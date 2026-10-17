import Link from 'next/link';
import { Button } from '@/core/designsystem/Button';
import { Feedback } from '@/core/designsystem/Feedback';
import type { ScreenState, UiEvent } from './CatalogModel';
import { CatalogFailure } from '../components/CatalogFailure';
import styles from './catalog.module.css';
export function CatalogScreen({
  state,
  onEvent,
  hrefForItem,
}: {
  state: ScreenState;
  onEvent: (event: UiEvent) => void;
  hrefForItem: (id: string) => string;
}) {
  const ui = state.uiState;
  const refresh = ui.kind === 'data' || ui.kind === 'empty' ? ui.refresh : null;
  return (
    <>
      <section className={styles.intro}>
        <p className="eyebrow">
          <span className="accentDot" /> The everyday collection
        </p>
        <h1>
          Less, but
          <br />
          <span>better considered.</span>
        </h1>
        <p className={styles.description}>
          Thoughtful objects for the spaces you make your own.
          <br className={styles.desktopBreak} /> Discover something worth
          keeping.
        </p>
      </section>
      <section aria-labelledby="collection-heading">
        <div className={styles.toolbar}>
          <div className={styles.heading}>
            <h2 id="collection-heading">The collection</h2>
            {ui.kind === 'data' && (
              <span className={styles.count}>
                {String(ui.items.length).padStart(2, '0')}
              </span>
            )}
          </div>
          {refresh && (
            <Button
              onClick={() => onEvent({ type: 'refresh' })}
              disabled={refresh.kind === 'running' || refresh.kind === 'failed'}
            >
              <span aria-hidden="true">↻</span>{' '}
              {refresh.kind === 'running' ? 'Refreshing…' : 'Refresh'}
            </Button>
          )}
        </div>
        {refresh?.kind === 'failed' && (
          <CatalogFailure
            problem={refresh}
            onRetry={() => onEvent({ type: 'retry' })}
          />
        )}
        {ui.kind === 'loading' && (
          <Feedback title="Finding your next favorite…" busy />
        )}
        {ui.kind === 'error' && (
          <Feedback
            title="We couldn’t load the collection"
            action={
              <CatalogFailure
                problem={ui}
                onRetry={() => onEvent({ type: 'retry' })}
              />
            }
          />
        )}
        {ui.kind === 'empty' && (
          <Feedback title="A little room for something new">
            There are no objects in the collection yet. Check back soon.
          </Feedback>
        )}
        {ui.kind === 'data' && (
          <ul className={styles.grid} aria-busy={refresh?.kind === 'running'}>
            {ui.items.map((item, index) => (
              <li key={item.id}>
                <Link
                  href={hrefForItem(item.id)}
                  prefetch={false}
                  className={styles.card}
                >
                  <div
                    className={`${styles.art} ${styles[`tone${index % 6}`]}`}
                    aria-hidden="true"
                  >
                    <span className={styles.number}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className={styles.shape}>
                      <span />
                    </span>
                    <span className={styles.artLabel}>OBJECTS / EVERYDAY</span>
                  </div>
                  <div className={styles.cardFooter}>
                    <div>
                      <span className={styles.category}>Selected object</span>
                      <h3>{item.title}</h3>
                    </div>
                    <span className={styles.arrow} aria-hidden="true">
                      ↗
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
