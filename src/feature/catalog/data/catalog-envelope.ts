import {
  appError,
  errorCodes,
  type AppError,
  type AppResult,
} from '@/core/result/AppResult';
import type { CatalogItem } from '../domain/CatalogItem';
import { decodeCatalog, isRecord } from './remote/catalog-decoder';
import { toCatalogItems } from './mapper/catalog-mapper';
export type CatalogEnvelope =
  | { readonly ok: true; readonly items: readonly CatalogItem[] }
  | { readonly ok: false; readonly error: AppError };

export function handlerStatus(error: AppError): number {
  if (error.code === 'TIMEOUT') return 504;
  if (error.code === 'UNKNOWN') return 500;
  if (error.code === 'NETWORK' || error.code === 'DECODING') return 502;
  return error.status && error.status >= 400 && error.status <= 599
    ? error.status
    : 502;
}
export function encodeEnvelope(
  result: AppResult<readonly CatalogItem[]>,
): CatalogEnvelope {
  if (result.ok)
    return {
      ok: true,
      items: result.value.map(({ id, title }) => ({ id, title })),
    };
  const { code, status, retryAfterSeconds } = result.error;
  return { ok: false, error: appError(code, status, retryAfterSeconds) };
}
function hasConsistentStatus(error: AppError): boolean {
  const status = error.status;
  switch (error.code) {
    case 'UNAUTHORIZED':
      return status === 401;
    case 'FORBIDDEN':
      return status === 403;
    case 'NOT_FOUND':
      return status === 404;
    case 'RATE_LIMITED':
      return status === 429;
    case 'SERVER':
      return status !== undefined && status >= 500 && status <= 599;
    case 'BAD_REQUEST':
      return (
        status !== undefined &&
        status >= 300 &&
        status < 500 &&
        ![401, 403, 404, 429].includes(status)
      );
    case 'DECODING':
      return status === undefined || (status >= 200 && status < 300);
    case 'NETWORK':
    case 'TIMEOUT':
    case 'UNKNOWN':
      return status === undefined;
  }
}
export function decodeEnvelope(
  value: unknown,
  httpStatus: number,
): AppResult<readonly CatalogItem[]> {
  const invalid = { ok: false, error: appError('DECODING') } as const;
  if (!isRecord(value)) return invalid;
  if (value.ok === true && httpStatus === 200) {
    const dto = decodeCatalog(value);
    return dto ? { ok: true, value: toCatalogItems(dto) } : invalid;
  }
  if (value.ok !== false || !isRecord(value.error)) return invalid;
  const error = value.error;
  if (!errorCodes.some((code) => code === error.code)) return invalid;
  const code = error.code as AppError['code'];
  if (
    error.status !== undefined &&
    (typeof error.status !== 'number' ||
      !Number.isInteger(error.status) ||
      error.status < 100 ||
      error.status > 599)
  )
    return invalid;
  if (
    error.retryAfterSeconds !== undefined &&
    (code !== 'RATE_LIMITED' ||
      typeof error.retryAfterSeconds !== 'number' ||
      !Number.isFinite(error.retryAfterSeconds) ||
      error.retryAfterSeconds < 0)
  )
    return invalid;
  const safe = appError(
    code,
    error.status as number | undefined,
    error.retryAfterSeconds as number | undefined,
  );
  if (
    !hasConsistentStatus(safe) ||
    error.retryable !== safe.retryable ||
    handlerStatus(safe) !== httpStatus
  )
    return invalid;
  return { ok: false, error: safe };
}
