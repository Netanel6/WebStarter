import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { loadCatalogSnapshot } from '@/app/composition/server';
import { catalogId } from '@/feature/catalog/presentation/components/catalog-links';
import { CatalogRoute } from '../CatalogRoute';
export default async function DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const id = catalogId((await params).id);
  if (id === null) notFound();
  const { initial, receivedAt, instanceKey } = await loadCatalogSnapshot();
  if (initial.ok && !initial.value.some((item) => item.id === id)) notFound();
  return (
    <CatalogRoute
      key={instanceKey}
      initial={initial}
      receivedAt={receivedAt}
      selectedId={id}
    />
  );
}
