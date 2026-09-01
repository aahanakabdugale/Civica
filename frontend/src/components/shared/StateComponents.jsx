/**
 * StateComponents.jsx — shared/
 * Reusable loading, empty, and error state UI for Group 2 (dashboard) screens.
 * Group 3 has a separate copy in analytics/; do not merge them without coordination.
 */

import { C, FONTS } from "./theme";

/** Spinning loader centred in its container */
export function LoadingState({ message = "Loading…" }) {
  return (
    <div
      style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: C.muted }}
      className="flex flex-col items-center justify-center py-20 gap-3"
    >
      <style>{FONTS}</style>
      <span
        style={{
          width: 28,
          height: 28,
          border: `3px solid ${C.line}`,
          borderTopColor: C.teal,
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          display: "inline-block",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p className="text-sm">{message}</p>
    </div>
  );
}

/** Empty state — no complaints match current filters */
export function EmptyState({ message = "No complaints match these filters." }) {
  return (
    <div
      style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: C.muted }}
      className="flex flex-col items-center justify-center py-20 gap-2"
    >
      <style>{FONTS}</style>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.line} strokeWidth="1.5">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
      <p className="text-sm text-center max-w-xs">{message}</p>
    </div>
  );
}

/** Error state — something went wrong fetching data */
export function ErrorState({ message = "Something went wrong. Please refresh.", onRetry }) {
  return (
    <div
      style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: C.muted }}
      className="flex flex-col items-center justify-center py-20 gap-3"
    >
      <style>{FONTS}</style>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.critical} strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p className="text-sm text-center max-w-xs" style={{ color: C.ink }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            border: `1px solid ${C.line}`,
            borderRadius: 3,
            background: "transparent",
            color: C.ink,
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}
          className="px-4 py-1.5 text-sm mt-1"
        >
          Retry
        </button>
      )}
    </div>
  );
}
