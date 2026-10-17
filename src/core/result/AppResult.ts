export const errorCodes = [
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'BAD_REQUEST',
  'RATE_LIMITED',
  'SERVER',
  'TIMEOUT',
  'NETWORK',
  'DECODING',
  'UNKNOWN',
] as const;
export type ErrorCode = (typeof errorCodes)[number];
export type AppError = Readonly<{
  code: ErrorCode;
  retryable: boolean;
  status?: number;
  retryAfterSeconds?: number;
}>;
export type AppResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: AppError };

export function appError(
  code: ErrorCode,
  status?: number,
  retryAfterSeconds?: number,
): AppError {
  return {
    code,
    retryable: ['NETWORK', 'TIMEOUT', 'SERVER', 'RATE_LIMITED'].includes(code),
    ...(status !== undefined ? { status } : {}),
    ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
  };
}
