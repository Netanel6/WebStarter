import 'server-only';
import { randomUUID } from 'node:crypto';
import { readEnvironment } from '@/core/config/env.server';
import { appError } from '@/core/result/AppResult';
import { createDemoCatalogRepository } from '@/feature/catalog/data/demo-catalog-repository.server';
import { createHttpCatalogRepository } from '@/feature/catalog/data/http-catalog-repository.server';
import type { CatalogRepository } from '@/feature/catalog/domain/CatalogRepository';
export function createServerCatalogRepository(): CatalogRepository {
  const env = readEnvironment();
  const repository =
    env.mode === 'demo'
      ? createDemoCatalogRepository()
      : createHttpCatalogRepository(env.origin);
  return {
    async load(signal) {
      try {
        return await repository.load(signal);
      } catch (error) {
        signal?.throwIfAborted();
        // Never log raw exception messages, request URLs, headers, or payloads.
        console.error('catalog.load.unexpected', {
          kind: error instanceof Error ? error.name : 'unknown',
        });
        return { ok: false, error: appError('UNKNOWN') };
      }
    },
  };
}

export async function loadCatalogSnapshot() {
  const initial = await createServerCatalogRepository().load();
  return { initial, receivedAt: Date.now(), instanceKey: randomUUID() };
}
