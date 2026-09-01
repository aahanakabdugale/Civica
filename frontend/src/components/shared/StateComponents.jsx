import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

// Priority Badge component
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

// Status Badge component
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

// Loading Spinner with message
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

// Toast Notification
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

// Submission Success Modal with Tracking ID & QR code
export const SubmissionSuccessModal = ({ complaint, onClose, onTrack }) => {
  const { t } = useLanguage();
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
          <h2 className="modal-title">{t('submitSuccessTitle')}</h2>
          <p className="modal-subtitle">{t('submitSuccessDesc')}</p>
        </div>

        <div className="modal-body">
          <div className="tracking-card">
            <span className="tracking-label">{t('trackingIdLabel')}</span>
            <div className="tracking-id-row">
              <span className="tracking-code">{complaint.id}</span>
              <button 
                type="button"
                className={`btn-copy ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
              >
                {copied ? t('copiedText') : t('copyIdBtn')}
              </button>
            </div>
          </div>

          <div className="submission-summary-grid">
            <div className="summary-item">
              <span className="summary-label">{t('assignedDept')}</span>
              <span className="summary-val">{complaint.department}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">{t('priority')}</span>
              <div><PriorityBadge priority={complaint.priority} /></div>
            </div>
            <div className="summary-item">
              <span className="summary-label">{t('estimatedResolution')}</span>
              <span className="summary-val text-accent">{complaint.estimatedResolution}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">{t('locationLabel')}</span>
              <span className="summary-val location-val">{complaint.location?.address || 'GPS Coordinates Recorded'}</span>
            </div>
          </div>

          <div className="qr-preview-box">
            <div className="qr-code-art">
              {/* Scalable SVG QR code placeholder representation */}
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
              <p>Keep your ID safe for instant status lookups & SMS verification.</p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-primary btn-block"
            onClick={() => onTrack(complaint.id)}
          >
            {t('trackNowBtn')} →
          </button>
          <button 
            type="button" 
            className="btn btn-secondary btn-block"
            onClick={onClose}
          >
            {t('fileAnotherBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};
