import type { ReactNode } from 'react';
import styles from './primitives.module.css';
export function Feedback({
  title,
  children,
  action,
  busy = false,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  busy?: boolean;
}) {
  return (
    <section className={styles.feedback} aria-busy={busy}>
      <span className={styles.feedbackMark} aria-hidden="true">
        {busy ? '◌' : '○'}
      </span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {action}
    </section>
  );
}
