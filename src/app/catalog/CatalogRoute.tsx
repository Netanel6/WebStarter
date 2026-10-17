'use client';
import { useCallback, useState } from 'react';
import { createClientCatalogRepository } from '@/app/composition/client';
import type { AppResult } from '@/core/result/AppResult';
import type { CatalogItem } from '@/feature/catalog/domain/CatalogItem';
import type { UiAction } from '@/feature/catalog/presentation/list/CatalogModel';
import { useCatalogController } from '@/feature/catalog/presentation/list/useCatalogController';
import { CatalogScreen } from '@/feature/catalog/presentation/list/CatalogScreen';
import { CatalogDetailsScreen } from '@/feature/catalog/presentation/details/CatalogDetailsScreen';
import { catalogHref } from '@/feature/catalog/presentation/components/catalog-links';
export function CatalogRoute({
  initial,
  receivedAt,
  selectedId,
}: {
  initial: AppResult<readonly CatalogItem[]>;
  receivedAt: number;
  selectedId?: string;
}) {
  const [repository] = useState(createClientCatalogRepository);
  const [announcement, setAnnouncement] = useState('');
  const onAction = useCallback((action: UiAction) => {
    switch (action.type) {
      case 'announce':
        setAnnouncement(action.message);
        break;
    }
  }, []);
  const { state, onEvent } = useCatalogController(
    initial,
    receivedAt,
    repository,
    onAction,
  );
  return (
    <>
      {selectedId === undefined ? (
        <CatalogScreen
          state={state}
          onEvent={onEvent}
          hrefForItem={catalogHref}
        />
      ) : (
        <CatalogDetailsScreen id={selectedId} state={state} onEvent={onEvent} />
      )}
      <p role="status" className="srOnly">
        {announcement}
      </p>
    </>
  );
}
