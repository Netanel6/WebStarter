import Link from 'next/link';
import { Feedback } from '@/core/designsystem/Feedback';
export default function NotFound() {
  return (
    <Feedback
      title="This object isn’t here"
      action={<Link href="/catalog">Explore the collection →</Link>}
    >
      It may have moved or is no longer available.
    </Feedback>
  );
}
