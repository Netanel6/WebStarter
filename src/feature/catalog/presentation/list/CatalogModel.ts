import type { AppError, AppResult } from '@/core/result/AppResult';
import type { CatalogItem } from '../../domain/CatalogItem';
export type Failure = Readonly<{ error: AppError; retryAt: number }>;
export type RefreshState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'running' }
  | ({ readonly kind: 'failed' } & Failure);
export type UiState =
  | { readonly kind: 'loading' }
  | ({ readonly kind: 'error' } & Failure)
  | { readonly kind: 'empty'; readonly refresh: RefreshState }
  | {
      readonly kind: 'data';
      readonly items: readonly CatalogItem[];
      readonly refresh: RefreshState;
    };
export type ScreenState = Readonly<{ uiState: UiState }>;
export type UiEvent = { readonly type: 'refresh' } | { readonly type: 'retry' };
export type UiAction = { readonly type: 'announce'; readonly message: string };
export type Transition =
  | { readonly type: 'started' }
  | {
      readonly type: 'completed';
      readonly result: AppResult<readonly CatalogItem[]>;
      readonly receivedAt: number;
    };
export function failure(error: AppError, now: number): Failure {
  return {
    error,
    retryAt: error.retryAfterSeconds ? now + error.retryAfterSeconds * 1000 : 0,
  };
}
export function initialState(
  result: AppResult<readonly CatalogItem[]>,
  now: number,
): ScreenState {
  if (!result.ok)
    return { uiState: { kind: 'error', ...failure(result.error, now) } };
  return {
    uiState:
      result.value.length === 0
        ? { kind: 'empty', refresh: { kind: 'idle' } }
        : {
            kind: 'data',
            items: result.value.map((item) => ({ ...item })),
            refresh: { kind: 'idle' },
          },
  };
}
export function catalogReducer(
  state: ScreenState,
  event: Transition,
): ScreenState {
  const previous = state.uiState;
  const hasSnapshot = previous.kind === 'data' || previous.kind === 'empty';
  if (event.type === 'started')
    return {
      uiState: hasSnapshot
        ? { ...previous, refresh: { kind: 'running' } }
        : { kind: 'loading' },
    };
  if (!event.result.ok && hasSnapshot)
    return {
      uiState: {
        ...previous,
        refresh: {
          kind: 'failed',
          ...failure(event.result.error, event.receivedAt),
        },
      },
    };
  return initialState(event.result, event.receivedAt);
}
