'use client';
import { Button } from '@/core/designsystem/Button';
import { Feedback } from '@/core/designsystem/Feedback';
export default function CatalogError({ reset }: { reset: () => void }) {
  return (
    <Feedback
      title="Something went wrong"
      action={<Button onClick={reset}>Try again</Button>}
    >
      Please try opening the collection again.
    </Feedback>
  );
}
