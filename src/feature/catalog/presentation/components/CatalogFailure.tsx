'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/core/designsystem/Button';
import type { ErrorCode } from '@/core/result/AppResult';
import type { Failure } from '../list/CatalogModel';
const messages: Record<ErrorCode, string> = {
  NETWORK: 'We could not connect. Check your connection and try again.',
  TIMEOUT: 'This is taking longer than expected. Please try again.',
  SERVER: 'The collection is temporarily unavailable. Please try again.',
  RATE_LIMITED: 'Please wait a moment before trying again.',
  UNAUTHORIZED: 'This collection requires access that is not available here.',
  FORBIDDEN: 'You do not have access to this collection.',
  NOT_FOUND: 'The collection service could not be found.',
  BAD_REQUEST: 'The collection could not be requested.',
  DECODING: 'We received an unexpected response. Please come back later.',
  UNKNOWN: 'Something unexpected happened. Please come back later.',
};
export function CatalogFailure({
  problem,
  onRetry,
}: {
  problem: Failure;
  onRetry: () => void;
}) {
  // Initial zero keeps SSR/hydration markup identical. Time advances only after mount.
  const [now, setNow] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);
  const waiting = problem.retryAt > 0 && now < problem.retryAt;
  return (
    <div role="alert" className="failure">
      <p>{messages[problem.error.code]}</p>
      {problem.error.retryable && (
        <Button onClick={onRetry} disabled={waiting}>
          {waiting ? 'Try again shortly' : 'Try again'}
        </Button>
      )}
    </div>
  );
}
