import 'server-only';
import { appError, type AppError } from '@/core/result/AppResult';
import { readJson, retryAfter, withDeadline } from '@/core/network/http';
import type { CatalogRepository } from '../domain/CatalogRepository';
import { decodeCatalog } from './remote/catalog-decoder';
import { toCatalogItems } from './mapper/catalog-mapper';

export function upstreamError(response: Response, now: number): AppError {
  const status = response.status;
  if (status === 401) return appError('UNAUTHORIZED', status);
  if (status === 403) return appError('FORBIDDEN', status);
  if (status === 404) return appError('NOT_FOUND', status);
  if (status === 429)
    return appError(
      'RATE_LIMITED',
      status,
      retryAfter(response.headers.get('retry-after'), now),
    );
  if (status >= 500) return appError('SERVER', status);
  if (status >= 300) return appError('BAD_REQUEST', status);
  return appError('DECODING', status);
}
export function createHttpCatalogRepository(
  origin: string,
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
  timeoutMs = 15_000,
): CatalogRepository {
  return {
    load: (caller) =>
      withDeadline(
        async (signal) => {
          let response: Response;
          try {
            response = await fetcher(new URL('/v1/catalog', origin), {
              headers: { Accept: 'application/json' },
              cache: 'no-store',
              redirect: 'manual',
              signal,
            });
          } catch (error) {
            signal.throwIfAborted();
            if (error instanceof TypeError)
              return { ok: false, error: appError('NETWORK') };
            throw error;
          }
          if (response.status !== 200) {
            await response.body?.cancel();
            return { ok: false, error: upstreamError(response, now()) };
          }
          try {
            const dto = decodeCatalog(await readJson(response, signal));
            signal.throwIfAborted();
            return dto
              ? { ok: true, value: toCatalogItems(dto) }
              : { ok: false, error: appError('DECODING', 200) };
          } catch (error) {
            signal.throwIfAborted();
            if (error instanceof TypeError)
              return { ok: false, error: appError('NETWORK') };
            if (error instanceof SyntaxError)
              return { ok: false, error: appError('DECODING', 200) };
            throw error;
          }
        },
        caller,
        timeoutMs,
      ),
  };
}
