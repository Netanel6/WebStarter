import type { CatalogDto } from '../remote/catalog-decoder';
import type { CatalogItem } from '../../domain/CatalogItem';
export function toCatalogItems(dto: CatalogDto): readonly CatalogItem[] {
  return dto.items.map(({ id, title }) => Object.freeze({ id, title }));
}
