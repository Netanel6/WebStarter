'use client';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { appError, type AppResult } from '@/core/result/AppResult';
import type { CatalogItem } from '../../domain/CatalogItem';
import type { CatalogRepository } from '../../domain/CatalogRepository';
import {
  catalogReducer,
  initialState,
  type UiAction,
  type UiEvent,
} from './CatalogModel';
export function useCatalogController(
  initial: AppResult<readonly CatalogItem[]>,
  receivedAt: number,
  repository: CatalogRepository,
  onAction: (action: UiAction) => void,
) {
  const [state, dispatch] = useReducer(catalogReducer, undefined, () =>
    initialState(initial, receivedAt),
  );
  const owner = useRef({
    active: false,
    generation: 0,
    request: null as AbortController | null,
  });
  useEffect(() => {
    const current = owner.current;
    current.active = true;
    return () => {
      current.active = false;
      current.generation++;
      current.request?.abort();
    };
  }, []);
  const actionRef = useRef(onAction);
  useEffect(() => {
    actionRef.current = onAction;
  }, [onAction]);
  const onEvent = useCallback(
    (event: UiEvent) => {
      const ui = state.uiState;
      const problem =
        ui.kind === 'error'
          ? ui
          : (ui.kind === 'data' || ui.kind === 'empty') &&
              ui.refresh.kind === 'failed'
            ? ui.refresh
            : null;
      if (event.type === 'retry' && !problem) return;
      if (problem && (!problem.error.retryable || Date.now() < problem.retryAt))
        return;
      const current = owner.current;
      if (!current.active) return;
      const generation = ++current.generation;
      current.request?.abort();
      const request = new AbortController();
      current.request = request;
      dispatch({ type: 'started' });
      void (async () => {
        let result: AppResult<readonly CatalogItem[]>;
        try {
          result = await repository.load(request.signal);
        } catch (error) {
          if (request.signal.aborted) return;
          console.error('catalog.client.unexpected', {
            kind: error instanceof Error ? error.name : 'unknown',
          });
          result = { ok: false, error: appError('UNKNOWN') };
        }
        if (
          !current.active ||
          generation !== current.generation ||
          request.signal.aborted
        )
          return;
        dispatch({ type: 'completed', result, receivedAt: Date.now() });
        if (result.ok)
          actionRef.current({
            type: 'announce',
            message: 'Collection updated.',
          });
      })();
    },
    [state, repository],
  );
  return { state, onEvent };
}
