import React from 'react';
import './dashboard.css';

/**
 * Shown while data is being fetched (map data, analytics, dashboard list).
 * Usage: <LoadingState label="Loading complaints..." />
 */
export function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="state-container">
      <div className="spinner" />
      <p className="state-desc">{label}</p>
    </div>
  );
}

/**
 * Shown when a query returns zero results — e.g. no complaints yet,
 * or a filter combination matches nothing.
 * Usage: <EmptyState title="No complaints yet" description="..." />
 */
export function EmptyState({
  icon = '📭',
  title = 'Nothing here yet',
  description = 'Once complaints come in, they’ll show up here.',
}) {
  return (
    <div className="state-container">
      <div className="state-icon">{icon}</div>
      <p className="state-title">{title}</p>
      <p className="state-desc">{description}</p>
    </div>
  );
}

/**
 * Shown when a fetch fails — keep it factual, no apology tone.
 * Usage: <ErrorState onRetry={() => refetch()} />
 */
export function ErrorState({
  title = 'Couldn’t load this data',
  description = 'Check your connection and try again.',
  onRetry,
}) {
  return (
    <div className="state-container">
      <div className="state-icon">⚠️</div>
      <p className="state-title">{title}</p>
      <p className="state-desc">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 14,
            padding: '6px 14px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'white',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}