// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { decodeCatalog } from '@/feature/catalog/data/remote/catalog-decoder';
import { createHttpCatalogRepository } from '@/feature/catalog/data/http-catalog-repository.server';
import { createBrowserCatalogRepository } from '@/feature/catalog/data/browser-catalog-repository';
import {
  decodeEnvelope,
  encodeEnvelope,
  handlerStatus,
} from '@/feature/catalog/data/catalog-envelope';
import { appError } from '@/core/result/AppResult';
import { retryAfter, readJson } from '@/core/network/http';
import { parseEnvironment } from '@/core/config/environment';
import {
  catalogHref,
  catalogId,
} from '@/feature/catalog/presentation/components/catalog-links';
const response = (body: unknown, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
const valid = { items: [{ id: 'item-1', title: 'Example item' }] };
const repo = (fetcher: typeof fetch) =>
  createHttpCatalogRepository('https://api.example.test', fetcher);

describe('C1 decoder', () => {
  it.each(['success', 'empty', 'unknown-field'])(
    'accepts %s fixture',
    (name) => {
      const fixture = JSON.parse(
        readFileSync(`contracts/catalog/${name}.json`, 'utf8'),
      );
      expect(decodeCatalog(fixture)).not.toBeNull();
    },
  );
  it.each(['missing-title', 'null-title', 'duplicate-id', 'wrong-type'])(
    'rejects %s fixture',
    (name) => {
      expect(
        decodeCatalog(
          JSON.parse(readFileSync(`contracts/catalog/${name}.json`, 'utf8')),
        ),
      ).toBeNull();
    },
  );
  it.each([
    null,
    {},
    { items: null },
    { items: [null] },
    { items: [{ id: ' ', title: 'X' }] },
    { items: [{ id: 'x', title: '\t\n' }] },
  ])('rejects malformed input %j', (input) =>
    expect(decodeCatalog(input)).toBeNull(),
  );
  it('preserves values, order and case-sensitive opaque IDs; only ASCII whitespace is blank', () => {
    const value = {
      items: [
        { id: ' X ', title: ' Name ' },
        { id: 'x', title: '\u00a0' },
      ],
    };
    expect(decodeCatalog(value)).toEqual(value);
  });
});

describe('server repository', () => {
  it('uses the fixed endpoint, no-store and cancellation, and exposes mapped values only', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(valid));
    const result = await repo(fetcher).load();
    expect(result).toEqual({ ok: true, value: valid.items });
    expect(fetcher.mock.calls[0]?.[0].toString()).toBe(
      'https://api.example.test/v1/catalog',
    );
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({
      cache: 'no-store',
      redirect: 'manual',
      signal: expect.any(AbortSignal),
    });
  });
  it.each([
    [401, 'UNAUTHORIZED'],
    [403, 'FORBIDDEN'],
    [404, 'NOT_FOUND'],
    [400, 'BAD_REQUEST'],
    [429, 'RATE_LIMITED'],
    [503, 'SERVER'],
    [201, 'DECODING'],
    [302, 'BAD_REQUEST'],
  ] as const)('maps HTTP %s to %s', async (status, code) => {
    const result = await repo(
      vi.fn<typeof fetch>().mockResolvedValue(response({}, status)),
    ).load();
    expect(result).toMatchObject({ ok: false, error: { code, status } });
  });
  it('rejects empty 204 and invalid body/content type', async () => {
    for (const value of [
      new Response(null, { status: 204 }),
      new Response('<html>oops</html>'),
      response({ items: [{}] }),
    ]) {
      expect(
        await repo(vi.fn<typeof fetch>().mockResolvedValue(value)).load(),
      ).toMatchObject({ ok: false, error: { code: 'DECODING' } });
    }
  });
  it('maps fetch rejection but preserves unexpected programming defects', async () => {
    expect(
      await repo(
        vi.fn<typeof fetch>().mockRejectedValue(new TypeError('fetch failed')),
      ).load(),
    ).toMatchObject({ ok: false, error: { code: 'NETWORK' } });
    await expect(
      repo(vi.fn<typeof fetch>().mockRejectedValue(new Error('bug'))).load(),
    ).rejects.toThrow('bug');
  });
  it('preserves caller cancellation before and during a request', async () => {
    const cancelled = new AbortController();
    cancelled.abort();
    const fetcher = vi.fn<typeof fetch>();
    await expect(repo(fetcher).load(cancelled.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(fetcher).not.toHaveBeenCalled();
    const active = new AbortController();
    const pending = repo(
      vi.fn<typeof fetch>().mockImplementation(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(init.signal?.reason),
            );
          }),
      ),
    ).load(active.signal);
    active.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('times out while consuming a stalled response body', async () => {
    vi.useFakeTimers();
    try {
      const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('{'));
            },
          }),
          { headers: { 'Content-Type': 'application/json' } },
        ),
      );
      const pending = createHttpCatalogRepository(
        'https://example.test',
        fetcher,
        Date.now,
        100,
      ).load();
      await vi.advanceTimersByTimeAsync(101);
      expect(await pending).toEqual({ ok: false, error: appError('TIMEOUT') });
    } finally {
      vi.useRealTimers();
    }
  });
  it('bounds the response body', async () => {
    const huge = response({ items: [], padding: 'x'.repeat(1024 * 1024) });
    await expect(readJson(huge, new AbortController().signal)).rejects.toThrow(
      'exceeds limit',
    );
  });
  it('isolates simultaneous requests', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () =>
      response({
        items: [{ id: String(fetcher.mock.calls.length), title: 'Item' }],
      }),
    );
    const [a, b] = await Promise.all([
      repo(fetcher).load(),
      repo(fetcher).load(),
    ]);
    expect(a).not.toEqual(b);
  });
});

describe('retry and configuration policy', () => {
  it('parses delta/date waits with a controlled clock and rejects malformed values', () => {
    const now = Date.parse('Mon, 01 Jan 2024 00:00:00 GMT');
    expect(retryAfter('12', now)).toBe(12);
    expect(retryAfter('Mon, 01 Jan 2024 00:00:15 GMT', now)).toBe(15);
    expect(retryAfter('Sun, 31 Dec 2023 23:59:00 GMT', now)).toBe(0);
    for (const value of [null, 'oops', '-1', '1.5', '999999999999999999999999'])
      expect(retryAfter(value, now)).toBeUndefined();
  });
  it('defaults to demo and never silently falls back from malformed live config', () => {
    expect(parseEnvironment({})).toEqual({ mode: 'demo' });
    expect(
      parseEnvironment({
        DATA_MODE: 'live',
        API_BASE_URL: 'https://example.com',
      }),
    ).toEqual({ mode: 'live', origin: 'https://example.com' });
    for (const env of [
      { DATA_MODE: 'other' },
      { DATA_MODE: 'live' },
      ...[
        'http://example.com',
        'https://a:b@example.com',
        'https://example.com/path',
        'https://example.com?x=1',
        'https://example.com#x',
      ].map((API_BASE_URL) => ({ DATA_MODE: 'live', API_BASE_URL })),
    ])
      expect(() => parseEnvironment(env)).toThrow();
    expect(() =>
      parseEnvironment({
        DATA_MODE: 'live',
        API_BASE_URL: 'http://127.0.0.1:4318',
      }),
    ).toThrow();
    expect(
      parseEnvironment({
        DATA_MODE: 'live',
        API_BASE_URL: 'http://127.0.0.1:4318',
        STARTER_E2E: '1',
      }),
    ).toMatchObject({ mode: 'live' });
  });
  it.each(['simple', ' space ', 'עברית', 'a/b?c#d%', '.', '..', '🎉'])(
    'round-trips opaque ID %s without path ambiguity',
    (id) => {
      expect(catalogId(catalogHref(id).split('/').at(-1)!)).toBe(id);
    },
  );
  it('rejects malformed URL tokens', () => {
    for (const value of ['', 'z0', 'f', 'ff'])
      expect(catalogId(value)).toBeNull();
  });
});

describe('browser envelope', () => {
  it('decodes expected failures even when the HTTP response is not 200', async () => {
    const error = appError('SERVER', 503);
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response(encodeEnvelope({ ok: false, error }), 503));
    expect(await createBrowserCatalogRepository(fetcher).load()).toEqual({
      ok: false,
      error,
    });
    expect(fetcher).toHaveBeenCalledWith(
      '/api/catalog',
      expect.objectContaining({ cache: 'no-store' }),
    );
  });
  it('preserves upstream status separately from handler status', () => {
    const error = appError('DECODING', 200);
    expect(handlerStatus(error)).toBe(502);
    expect(decodeEnvelope({ ok: false, error }, 502)).toEqual({
      ok: false,
      error,
    });
  });
  it('rejects malformed, unsafe or inconsistent envelopes', () => {
    for (const envelope of [
      null,
      { ok: 'yes' },
      { ok: true, items: [{}] },
      { ok: false, error: { code: 'SURPRISE' } },
      { ok: false, error: { code: 'SERVER', retryable: false, status: 503 } },
      {
        ok: false,
        error: {
          code: 'RATE_LIMITED',
          retryable: true,
          status: 429,
          retryAfterSeconds: -1,
        },
      },
    ])
      expect(decodeEnvelope(envelope, 200)).toMatchObject({
        ok: false,
        error: { code: 'DECODING' },
      });
    expect(decodeEnvelope({ ok: true, items: [] }, 503)).toMatchObject({
      ok: false,
      error: { code: 'DECODING' },
    });
  });
});

it('distinguishes a broken response stream from invalid UTF-8', async () => {
  const broken = new Response(
    new ReadableStream({
      start(controller) {
        controller.error(new TypeError('connection closed'));
      },
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  expect(
    await repo(vi.fn<typeof fetch>().mockResolvedValue(broken)).load(),
  ).toMatchObject({ ok: false, error: { code: 'NETWORK' } });
  const invalid = new Response(new Uint8Array([0xff]), {
    headers: { 'Content-Type': 'application/json' },
  });
  expect(
    await repo(vi.fn<typeof fetch>().mockResolvedValue(invalid)).load(),
  ).toMatchObject({ ok: false, error: { code: 'DECODING' } });
});
it('rejects a mismatched semantic code and upstream status', () => {
  expect(
    decodeEnvelope({ ok: false, error: appError('UNAUTHORIZED', 503) }, 503),
  ).toMatchObject({ ok: false, error: { code: 'DECODING' } });
});

it('preserves lone UTF-16 surrogate IDs allowed by JSON without replacement', () => {
  const id = JSON.parse('"\\ud800"') as string;
  expect(catalogId(catalogHref(id).split('/').at(-1)!)).toBe(id);
});
