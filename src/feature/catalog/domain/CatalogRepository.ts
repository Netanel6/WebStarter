import type { AppResult } from '@/core/result/AppResult';
import type { CatalogItem } from './CatalogItem';
export interface CatalogRepository {
  load(signal?: AbortSignal): Promise<AppResult<readonly CatalogItem[]>>;
}
