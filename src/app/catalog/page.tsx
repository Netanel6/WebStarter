import { connection } from 'next/server';
import { loadCatalogSnapshot } from '@/app/composition/server';
import { CatalogRoute } from './CatalogRoute';
export default async function CatalogPage() {
  await connection();
  const { initial, receivedAt, instanceKey } = await loadCatalogSnapshot();
  return (
    <CatalogRoute key={instanceKey} initial={initial} receivedAt={receivedAt} />
  );
}
