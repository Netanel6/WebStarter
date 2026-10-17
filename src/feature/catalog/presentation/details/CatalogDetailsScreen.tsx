import Link from 'next/link';
import { Button } from '@/core/designsystem/Button';
import { Feedback } from '@/core/designsystem/Feedback';
import { CatalogFailure } from '../components/CatalogFailure';
import type { ScreenState, UiEvent } from '../list/CatalogModel';
import styles from './details.module.css';
// Details reuse the collection read state: C1 has no detail endpoint or extra fields.
export function CatalogDetailsScreen({
  id,
  state,
  onEvent,
}: {
  id: string;
  state: ScreenState;
  onEvent: (event: UiEvent) => void;
}) {
  const ui = state.uiState;
  const item =
    ui.kind === 'data' ? ui.items.find((value) => value.id === id) : undefined;
  const refresh = ui.kind === 'data' || ui.kind === 'empty' ? ui.refresh : null;
  return (
    <>
      <Link href="/catalog" className={styles.back}>
        ← Back to the collection
      </Link>
      {ui.kind === 'error' && (
        <Feedback
          title="We couldn’t load this object"
          action={
            <CatalogFailure
              problem={ui}
              onRetry={() => onEvent({ type: 'retry' })}
            />
          }
        />
      )}
      {ui.kind === 'loading' && <Feedback title="Loading this object…" busy />}
      {item && (
        <section className={styles.detail}>
          <div className={styles.art} aria-hidden="true">
            <span className={styles.orbit} />
            <span className={styles.object} />
            <span className={styles.label}>A CLOSER LOOK</span>
          </div>
          <div className={styles.content}>
            <p className="eyebrow">The everyday collection</p>
            <h1>{item.title}</h1>
            <p>A considered addition to your everyday.</p>
            <div className={styles.rule} />
            <p className={styles.note}>
              Part of a collection of thoughtful objects for the spaces you make
              your own.
            </p>
            <Button
              onClick={() => onEvent({ type: 'refresh' })}
              disabled={
                refresh?.kind === 'running' || refresh?.kind === 'failed'
              }
            >
              {refresh?.kind === 'running' ? 'Refreshing…' : 'Refresh details'}
            </Button>
          </div>
        </section>
      )}
      {(ui.kind === 'data' || ui.kind === 'empty') && !item && (
        <Feedback title="This object is no longer in the collection">
          Explore the collection to find something else.
        </Feedback>
      )}
      {refresh?.kind === 'failed' && (
        <CatalogFailure
          problem={refresh}
          onRetry={() => onEvent({ type: 'retry' })}
        />
      )}
    </>
  );
}
