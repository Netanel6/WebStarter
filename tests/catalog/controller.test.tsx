import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { appError, type AppResult } from '@/core/result/AppResult';
import type { CatalogItem } from '@/feature/catalog/domain/CatalogItem';
import type { CatalogRepository } from '@/feature/catalog/domain/CatalogRepository';
import { useCatalogController } from '@/feature/catalog/presentation/list/useCatalogController';
import {
  catalogReducer,
  initialState,
} from '@/feature/catalog/presentation/list/CatalogModel';
const initial = { ok: true, value: [{ id: 'old', title: 'Old' }] } as const;
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('screen lifecycle and concurrency', () => {
  it('seeds state without fetching on mount, including Strict Mode', () => {
    const repository = { load: vi.fn() };
    const action = vi.fn();
    const { result, rerender } = renderHook(
      () => useCatalogController(initial, 1, repository, action),
      { wrapper: StrictMode },
    );
    expect(result.current.state.uiState).toMatchObject({
      kind: 'data',
      items: initial.value,
    });
    rerender();
    expect(repository.load).not.toHaveBeenCalled();
    expect(action).not.toHaveBeenCalled();
  });
  it('retains the last snapshot after refresh failure', async () => {
    const repository: CatalogRepository = {
      load: vi
        .fn()
        .mockResolvedValue({ ok: false, error: appError('NETWORK') }),
    };
    const { result } = renderHook(() =>
      useCatalogController(initial, 1, repository, vi.fn()),
    );
    await act(async () => result.current.onEvent({ type: 'refresh' }));
    expect(result.current.state.uiState).toMatchObject({
      kind: 'data',
      items: initial.value,
      refresh: { kind: 'failed', error: { code: 'NETWORK' } },
    });
  });
  it('ignores an older completion even if transport ignores abort', async () => {
    const first = deferred<AppResult<readonly CatalogItem[]>>();
    const second = deferred<AppResult<readonly CatalogItem[]>>();
    const load = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const action = vi.fn();
    const { result } = renderHook(() =>
      useCatalogController(initial, 1, { load }, action),
    );
    act(() => result.current.onEvent({ type: 'refresh' }));
    act(() => result.current.onEvent({ type: 'refresh' }));
    expect(load.mock.calls[0]?.[0].aborted).toBe(true);
    await act(async () =>
      second.resolve({ ok: true, value: [{ id: 'new', title: 'New' }] }),
    );
    await act(async () =>
      first.resolve({ ok: true, value: [{ id: 'stale', title: 'Stale' }] }),
    );
    expect(result.current.state.uiState).toMatchObject({
      items: [{ id: 'new', title: 'New' }],
      refresh: { kind: 'idle' },
    });
    expect(action).toHaveBeenCalledTimes(1);
  });
  it('aborts on unmount and drops late actions', async () => {
    const request = deferred<AppResult<readonly CatalogItem[]>>();
    const load = vi.fn().mockReturnValue(request.promise);
    const action = vi.fn();
    const { result, unmount } = renderHook(() =>
      useCatalogController(initial, 1, { load }, action),
    );
    act(() => result.current.onEvent({ type: 'refresh' }));
    unmount();
    expect(load.mock.calls[0]?.[0].aborted).toBe(true);
    await act(async () => request.resolve(initial));
    expect(action).not.toHaveBeenCalled();
  });
  it('enforces rate limit at the event boundary, not only in the button', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(1000);
      const load = vi.fn().mockResolvedValue(initial);
      const failure = {
        ok: false,
        error: appError('RATE_LIMITED', 429, 2),
      } as const;
      const { result } = renderHook(() =>
        useCatalogController(failure, 1000, { load }, vi.fn()),
      );
      await act(async () => result.current.onEvent({ type: 'retry' }));
      expect(load).not.toHaveBeenCalled();
      vi.setSystemTime(3001);
      await act(async () => result.current.onEvent({ type: 'retry' }));
      expect(load).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });
  it('does not retry non-retryable errors', async () => {
    const load = vi.fn();
    const initial = { ok: false, error: appError('DECODING') } as const;
    const { result } = renderHook(() =>
      useCatalogController(initial, 1, { load }, vi.fn()),
    );
    await act(async () => result.current.onEvent({ type: 'retry' }));
    expect(load).not.toHaveBeenCalled();
  });
  it('preserves a successful empty snapshot on failure, and transitions to data on success', () => {
    const empty = initialState({ ok: true, value: [] }, 0);
    const failed = catalogReducer(empty, {
      type: 'completed',
      result: { ok: false, error: appError('NETWORK') },
      receivedAt: 1,
    });
    expect(failed.uiState).toMatchObject({
      kind: 'empty',
      refresh: { kind: 'failed' },
    });
    expect(
      catalogReducer(failed, {
        type: 'completed',
        result: initial,
        receivedAt: 2,
      }).uiState,
    ).toMatchObject({ kind: 'data' });
  });
});
