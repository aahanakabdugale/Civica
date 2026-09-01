/**
 * StateComponents.jsx — components/shared/
 * Combined shared components for ALL groups (Group 1 citizen + Group 2 dashboard).
 *
 * Group 2 exports: LoadingState, EmptyState, ErrorState
 * Group 1 exports: PriorityBadge, StatusBadge, LoadingSpinner, Toast, SubmissionSuccessModal
 */

import React, { useState } from 'react';
import { C, FONTS } from './theme';

/* ================================================================
   GROUP 2 — Authority Dashboard state components
   (use these inside dashboard/ pages)
================================================================ */

/** Spinning loader centred in its container */
export function LoadingState({ message = 'Loading…', label }) {
  const displayMsg = message || label || 'Loading…';
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
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          display: 'inline-block',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p className="text-sm">{displayMsg}</p>
    </div>
  );
}

/** Empty state — no complaints match current filters */
export function EmptyState({ message = 'No complaints match these filters.', label }) {
  const displayMsg = message || label || 'No complaints match these filters.';
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
      <p className="text-sm text-center max-w-xs">{displayMsg}</p>
    </div>
  );
}

/** Error state — supports both message and label props */
export function ErrorState({ message, label, onRetry }) {
  const displayMsg = message || label || 'Something went wrong. Please refresh.';
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
      <p className="text-sm text-center max-w-xs" style={{ color: C.ink }}>{displayMsg}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            border: `1px solid ${C.line}`,
            borderRadius: 3,
            background: 'transparent',
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

/* ================================================================
   GROUP 1 — Citizen-facing shared components
   (use these inside citizen/ pages and SubmitComplaint / TrackComplaint)
================================================================ */

/** Priority badge with colour-coded dot (citizen-facing style) */
export const PriorityBadge = ({ priority }) => {
  const p = (priority || '').toLowerCase();

  let badgeClass = 'badge-medium';
  let label = priority || 'Medium';

  if (p.includes('critical') || p.includes('emergency')) {
    badgeClass = 'badge-critical';
  } else if (p.includes('high')) {
    badgeClass = 'badge-high';
  } else if (p.includes('low')) {
    badgeClass = 'badge-low';
  }

  return (
    <span className={`priority-badge ${badgeClass}`}>
      <span className="badge-dot"></span>
      {label}
    </span>
  );
};

/** Status pill for citizen tracking view */
export const StatusBadge = ({ status }) => {
  const s = (status || '').toLowerCase();

  let badgeClass = 'status-submitted';
  let label = 'Submitted';

  if (s.includes('resolved') || s.includes('closed')) {
    badgeClass = 'status-resolved';
    label = 'Resolved';
  } else if (s.includes('progress') || s.includes('action')) {
    badgeClass = 'status-progress';
    label = 'In Progress';
  } else if (s.includes('assign')) {
    badgeClass = 'status-assigned';
    label = 'Assigned';
  } else if (s.includes('classif') || s.includes('review')) {
    badgeClass = 'status-classified';
    label = 'AI Categorized';
  }

  return (
    <span className={`status-pill ${badgeClass}`}>
      {label}
    </span>
  );
};

/** Loading spinner (citizen pages) */
export const LoadingSpinner = ({ message = 'Loading details...' }) => (
  <div className="loading-container">
    <div className="spinner-ring">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
    <p className="loading-text">{message}</p>
  </div>
);

/** Toast notification (citizen pages) */
export const Toast = ({ message, type = 'info', onClose }) => {
  if (!message) return null;

  return (
    <div className={`toast-notification toast-${type}`}>
      <div className="toast-content">
        {type === 'success' && <span className="toast-icon">✓</span>}
        {type === 'error' && <span className="toast-icon">⚠</span>}
        {type === 'info' && <span className="toast-icon">ℹ</span>}
        <span className="toast-message">{message}</span>
      </div>
      {onClose && (
        <button className="toast-close" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
};

/** Submission success modal with tracking ID & QR preview (citizen pages) */
export const SubmissionSuccessModal = ({ complaint, onClose, onTrack }) => {
  const [copied, setCopied] = useState(false);

  if (!complaint) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(complaint.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div className="success-icon-wrap">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="modal-title">Grievance Submitted!</h2>
          <p className="modal-subtitle">Your grievance has been received and categorized by AI.</p>
        </div>

        <div className="modal-body">
          <div className="tracking-card">
            <span className="tracking-label">Tracking ID</span>
            <div className="tracking-id-row">
              <span className="tracking-code">{complaint.id}</span>
              <button
                type="button"
                className={`btn-copy ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
              >
                {copied ? 'Copied!' : 'Copy ID'}
              </button>
            </div>
          </div>

          <div className="submission-summary-grid">
            <div className="summary-item">
              <span className="summary-label">Assigned Department</span>
              <span className="summary-val">{complaint.department}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Priority</span>
              <div><PriorityBadge priority={complaint.priority} /></div>
            </div>
            <div className="summary-item">
              <span className="summary-label">Estimated Resolution</span>
              <span className="summary-val text-accent">{complaint.estimatedResolution}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Location</span>
              <span className="summary-val location-val">
                {complaint.location?.address || 'GPS Coordinates Recorded'}
              </span>
            </div>
          </div>

          <div className="qr-preview-box">
            <div className="qr-code-art">
              <svg viewBox="0 0 100 100" width="70" height="70" fill="currentColor">
                <path d="M10,10 h30 v30 h-30 z M15,15 v20 h20 v-20 z M20,20 h10 v10 h-10 z" />
                <path d="M60,10 h30 v30 h-30 z M65,15 v20 h20 v-20 z M70,20 h10 v10 h-10 z" />
                <path d="M10,60 h30 v30 h-30 z M15,65 v20 h20 v-20 z M20,70 h10 v10 h-10 z" />
                <rect x="45" y="15" width="8" height="8" />
                <rect x="45" y="30" width="8" height="20" />
                <rect x="60" y="50" width="10" height="10" />
                <rect x="75" y="60" width="15" height="15" />
                <rect x="50" y="75" width="12" height="12" />
              </svg>
            </div>
            <div className="qr-text-info">
              <strong>Save or Screenshot</strong>
              <p>Keep your ID safe for instant status lookups &amp; SMS verification.</p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => onTrack(complaint.id)}
          >
            Track Now →
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={onClose}
          >
            File Another
          </button>
        </div>
      </div>
    </div>
  );
};
