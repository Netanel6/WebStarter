export type CatalogDto = { items: { id: string; title: string }[] };
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isText(value: unknown): value is string {
  // eslint-disable-next-line no-control-regex -- C1 explicitly defines ASCII whitespace, not Unicode trim semantics.
  return typeof value === 'string' && /[^\x09-\x0d\x20]/.test(value);
}
export function decodeCatalog(value: unknown): CatalogDto | null {
  if (!isRecord(value) || !Array.isArray(value.items)) return null;
  const ids = new Set<string>();
  const items: CatalogDto['items'] = [];
  for (const item of value.items) {
    if (
      !isRecord(item) ||
      !isText(item.id) ||
      !isText(item.title) ||
      ids.has(item.id)
    )
      return null;
    ids.add(item.id);
    items.push({ id: item.id, title: item.title });
  }
  return { items };
}
