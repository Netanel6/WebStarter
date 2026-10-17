import 'server-only';
import type { CatalogRepository } from '../domain/CatalogRepository';
const sample = [
  { id: 'field-notes', title: 'Field notes' },
  { id: 'arc-lamp', title: 'Arc lamp' },
  { id: 'ceramic-cup', title: 'Ceramic cup' },
  { id: 'studio-headphones', title: 'Studio headphones' },
  { id: 'table-clock', title: 'Table clock' },
  { id: 'canvas-tote', title: 'Canvas tote' },
];
export function createDemoCatalogRepository(): CatalogRepository {
  return {
    async load(signal) {
      signal?.throwIfAborted();
      return { ok: true, value: sample.map((item) => ({ ...item })) };
    },
  };
}
