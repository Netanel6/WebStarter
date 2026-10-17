import { appError } from '@/core/result/AppResult';
import { readJson, withDeadline } from '@/core/network/http';
import type { CatalogRepository } from '../domain/CatalogRepository';
import { decodeEnvelope } from './catalog-envelope';
export function createBrowserCatalogRepository(
  fetcher: typeof fetch = fetch,
): CatalogRepository {
  return {
    load: (caller) =>
      withDeadline(
        async (signal) => {
          let response: Response;
          try {
            response = await fetcher('/api/catalog', {
              cache: 'no-store',
              redirect: 'error',
              signal,
              headers: { Accept: 'application/json' },
            });
          } catch (error) {
            signal.throwIfAborted();
            if (error instanceof TypeError)
              return { ok: false, error: appError('NETWORK') };
            throw error;
          }
          try {
            return decodeEnvelope(
              await readJson(response, signal),
              response.status,
            );
          } catch (error) {
            signal.throwIfAborted();
            if (error instanceof TypeError)
              return { ok: false, error: appError('NETWORK') };
            if (error instanceof SyntaxError)
              return { ok: false, error: appError('DECODING') };
            throw error;
          }
        },
        caller,
        20_000,
      ),
  };
}
