import { createServerCatalogRepository } from '@/app/composition/server';
import {
  encodeEnvelope,
  handlerStatus,
} from '@/feature/catalog/data/catalog-envelope';
export async function GET(request: Request) {
  const result = await createServerCatalogRepository().load(request.signal);
  return Response.json(encodeEnvelope(result), {
    status: result.ok ? 200 : handlerStatus(result.error),
    headers: { 'Cache-Control': 'no-store' },
  });
}
