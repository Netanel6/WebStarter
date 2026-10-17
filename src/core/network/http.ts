import { appError, type AppResult } from '@/core/result/AppResult';

export function retryAfter(
  value: string | null,
  now: number,
): number | undefined {
  if (value === null) return undefined;
  const text = value.trim();
  if (/^\d+$/.test(text)) {
    const seconds = Number(text);
    return Number.isSafeInteger(seconds) ? seconds : undefined;
  }
  // Accept IMF-fixdate, not arbitrary strings accepted by Date.parse (e.g. "1.5").
  if (
    !/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(
      text,
    )
  )
    return undefined;
  const date = Date.parse(text);
  return Number.isFinite(date)
    ? Math.max(0, Math.ceil((date - now) / 1000))
    : undefined;
}

export async function readJson(
  response: Response,
  signal: AbortSignal,
): Promise<unknown> {
  const mediaType = response.headers
    .get('content-type')
    ?.split(';')[0]
    ?.trim()
    .toLowerCase();
  if (mediaType !== 'application/json') {
    await response.body?.cancel().catch(() => undefined);
    throw new SyntaxError('Invalid JSON content type');
  }
  if (!response.body) throw new SyntaxError('Missing JSON body');
  const reader = response.body.getReader();
  const limit = 1024 * 1024;
  let size = 0;
  let text = '';
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const decode = (bytes?: Uint8Array, stream = false): string => {
    try {
      return decoder.decode(bytes, { stream });
    } catch (error) {
      if (error instanceof TypeError)
        throw new SyntaxError('Invalid UTF-8', { cause: error });
      throw error;
    }
  };
  const abort = () => {
    void reader.cancel().catch(() => undefined);
  };
  signal.addEventListener('abort', abort, { once: true });
  try {
    while (true) {
      signal.throwIfAborted();
      const chunk = await reader.read();
      signal.throwIfAborted();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > limit) throw new SyntaxError('Response exceeds limit');
      text += decode(chunk.value, true);
    }
    text += decode();
    signal.throwIfAborted();
    return JSON.parse(text) as unknown;
  } finally {
    signal.removeEventListener('abort', abort);
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

// Bounds both fetching and body consumption. Caller cancellation remains control flow.
export async function withDeadline<T>(
  task: (signal: AbortSignal) => Promise<AppResult<T>>,
  caller?: AbortSignal,
  timeoutMs = 15_000,
): Promise<AppResult<T>> {
  caller?.throwIfAborted();
  const controller = new AbortController();
  let expired = false;
  const abort = () => controller.abort(caller?.reason);
  caller?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => {
    expired = true;
    controller.abort();
  }, timeoutMs);
  try {
    const result = await task(controller.signal);
    caller?.throwIfAborted();
    return expired ? { ok: false, error: appError('TIMEOUT') } : result;
  } catch (error) {
    caller?.throwIfAborted();
    if (expired) return { ok: false, error: appError('TIMEOUT') };
    throw error;
  } finally {
    clearTimeout(timer);
    caller?.removeEventListener('abort', abort);
  }
}
