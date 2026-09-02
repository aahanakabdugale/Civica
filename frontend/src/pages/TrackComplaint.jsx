import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getComplaintById, getRecentComplaints } from '../api';
import { PriorityBadge, StatusBadge, LoadingSpinner, Toast } from '../components/shared/StateComponents';

const RESOLUTION_STEPS = [
  { stepNumber: 1, key: 'submitted', labelKey: 'steps.submitted', descKey: 'steps.submittedDesc' },
  { stepNumber: 2, key: 'classified', labelKey: 'steps.classified', descKey: 'steps.classifiedDesc' },
  { stepNumber: 3, key: 'assigned', labelKey: 'steps.assigned', descKey: 'steps.assignedDesc' },
  { stepNumber: 4, key: 'in_progress', labelKey: 'steps.in_progress', descKey: 'steps.in_progressDesc' },
  { stepNumber: 5, key: 'resolved', labelKey: 'steps.resolved', descKey: 'steps.resolvedDesc' },
];

export const TrackComplaint = ({ initialComplaintId = '', onNavigateToSubmit }) => {
  const { t } = useLanguage();
  const [searchInput, setSearchInput] = useState(initialComplaintId);
  const [complaint, setComplaint] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [recentList, setRecentList] = useState([]);
  const [toast, setToast] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedbackSent, setFeedbackSent] = useState(false);
  
  const miniMapRef = useRef(null);
  const miniMapInstance = useRef(null);

  // Load recent / seed complaints on mount
  useEffect(() => {
    const loadRecents = async () => {
      const list = await getRecentComplaints();
      setRecentList(list.slice(0, 4));
    };
    loadRecents();
  }, []);

  // Auto-search if initialComplaintId is passed
  useEffect(() => {
    if (initialComplaintId) {
      setSearchInput(initialComplaintId);
      performSearch(initialComplaintId);
    } else {
      // Default to first demo complaint for immediate visual richness
      performSearch('CIV-1001');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialComplaintId]);

  // Mini map renderer
  useEffect(() => {
    if (!complaint || !complaint.location || !miniMapRef.current) return;

    const lat = complaint.location.lat || 28.6139;
    const lng = complaint.location.lng || 77.2090;

    const renderMap = () => {
      if (!window.L) return;

      if (!miniMapInstance.current) {
        const map = window.L.map(miniMapRef.current, {
          center: [lat, lng],
          zoom: 15,
          zoomControl: false,
          dragging: false,
          touchZoom: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
        });

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);

        const customIcon = window.L.divIcon({
          className: 'custom-map-pin',
          html: `<div class="pin-head">📍</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        });

        window.L.marker([lat, lng], { icon: customIcon }).addTo(map);
        miniMapInstance.current = map;
      } else {
        miniMapInstance.current.setView([lat, lng], 15);
      }
    };

    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = renderMap;
      document.body.appendChild(script);
    } else {
      renderMap();
    }
  }, [complaint]);

  const performSearch = async (idToSearch) => {
    const query = (idToSearch || searchInput).trim();
    if (!query) {
      setErrorMessage('Please enter a valid Complaint ID.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setFeedbackSent(false);

    try {
      const res = await getComplaintById(query);
      if (res && res.success) {
        setComplaint(res.data);
      } else {
        setComplaint(null);
        setErrorMessage(res?.error || t('noRecordFound'));
      }
    } catch {
      setErrorMessage('Unable to look up complaint status.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    performSearch(searchInput);
  };

  const handleSelectRecent = (id) => {
    setSearchInput(id);
    performSearch(id);
  };

  const handleReopen = () => {
    if (!complaint) return;
    setToast({
      type: 'info',
      message: `Re-open request logged for #${complaint.id}. A senior municipal inspector has been notified.`,
    });
  };

  const handleRate = (stars) => {
    setRating(stars);
    setFeedbackSent(true);
    setToast({
      type: 'success',
      message: `Thank you for rating ${stars} stars! Your feedback improves municipal response times.`,
    });
  };

  const currentStep = complaint?.statusStep || 1;

  return (
    <div className="page-wrapper track-page">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header Search Section */}
      <section className="track-header-hero">
        <div className="track-hero-inner">
          <h1 className="track-page-title">{t('trackTitle')}</h1>
          <p className="track-page-subtitle">{t('trackSubtitle')}</p>

          {/* Search Form */}
          <form className="track-search-form" onSubmit={handleFormSubmit}>
            <div className="track-search-box">
              <span className="search-input-icon">🔍</span>
              <input
                type="text"
                className="track-search-input"
                placeholder={t('trackInputPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button
                  type="button"
                  className="btn-clear-search"
                  onClick={() => setSearchInput('')}
                >
                  ✕
                </button>
              )}
            </div>
            <button type="submit" className="btn btn-primary btn-track-search" disabled={isLoading}>
              {isLoading ? 'Searching...' : t('searchBtn')}
            </button>
          </form>

          {/* Recent Quick Chips */}
          {recentList.length > 0 && (
            <div className="recent-chips-container">
              <span className="recent-chips-label">{t('recentSearches')}</span>
              <div className="chips-row">
                {recentList.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`status-demo-chip ${complaint?.id === item.id ? 'active' : ''}`}
                    onClick={() => handleSelectRecent(item.id)}
                  >
                    <span className="chip-code">{item.id}</span>
                    <span className="chip-cat">({item.category})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Error Notice */}
      {errorMessage && (
        <div className="track-error-card">
          <div className="error-icon">⚠️</div>
          <div className="error-body">
            <h3>No Record Found</h3>
            <p>{errorMessage}</p>
            <button
              type="button"
              className="btn btn-outline-primary mt-2"
              onClick={onNavigateToSubmit}
            >
              ✍️ {t('navFileComplaint')}
            </button>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && <LoadingSpinner message="Querying live municipal grievance records..." />}

      {/* Main Complaint Tracking Details Card */}
      {!isLoading && complaint && (
        <main className="track-details-container">
          {/* Top Overview Banner */}
          <div className="complaint-summary-card">
            <div className="summary-top-row">
              <div className="id-badge-group">
                <span className="complaint-id-tag">{complaint.id}</span>
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
              </div>
              <div className="filed-date-meta">
                <span>{t('filedOn')}: </span>
                <strong>{new Date(complaint.filedAt).toLocaleDateString()}</strong>
              </div>
            </div>

            <h2 className="complaint-title-display">{complaint.title}</h2>
            <p className="complaint-desc-display">{complaint.description}</p>

            {/* Attached Photo Gallery */}
            {complaint.images && complaint.images.length > 0 && (
              <div className="complaint-images-gallery">
                <span className="gallery-title">Attached Evidence Photos ({complaint.images.length})</span>
                <div className="gallery-grid">
                  {complaint.images.map((img, idx) => (
                    <div key={idx} className="gallery-item">
                      <img src={img} alt={`Evidence ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Meta Grid */}
            <div className="complaint-meta-grid">
              <div className="meta-block">
                <span className="meta-label">{t('assignedDept')}</span>
                <strong className="meta-value text-blue">{complaint.department}</strong>
              </div>

              <div className="meta-block">
                <span className="meta-label">{t('wardArea')}</span>
                <strong className="meta-value">{complaint.ward}</strong>
              </div>

              <div className="meta-block">
                <span className="meta-label">{t('estimatedResolution')}</span>
                <strong className="meta-value text-green">{complaint.estimatedResolution}</strong>
              </div>

              <div className="meta-block">
                <span className="meta-label">Filed By</span>
                <strong className="meta-value">{complaint.citizen?.name || 'Citizen'}</strong>
              </div>
            </div>
          </div>

          {/* AI Duplicate Detection / Cluster Insight Alert */}
          {complaint.duplicateInfo && (
            <div className="duplicate-detection-card">
              <div className="duplicate-icon">🤖</div>
              <div className="duplicate-content">
                <h4 className="duplicate-title">{t('duplicateAlertTitle')}</h4>
                <p className="duplicate-desc">{complaint.duplicateInfo.clusterMessage}</p>
                {complaint.duplicateInfo.masterId && (
                  <span className="linked-badge">
                    Linked to Master Incident: <strong>{complaint.duplicateInfo.masterId}</strong>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 5-Step Resolution Timeline */}
          <div className="timeline-tracker-card">
            <h3 className="timeline-heading">{t('statusTimeline')}</h3>

            <div className="steps-progress-bar">
              {RESOLUTION_STEPS.map((step) => {
                const isCompleted = step.stepNumber < currentStep;
                const isCurrent = step.stepNumber === currentStep;

                let stepClass = 'step-pending';
                if (isCompleted) stepClass = 'step-completed';
                if (isCurrent) stepClass = 'step-current';

                return (
                  <div key={step.key} className={`timeline-step-item ${stepClass}`}>
                    <div className="step-marker-col">
                      <div className="step-circle">
                        {isCompleted ? '✓' : step.stepNumber}
                      </div>
                      {step.stepNumber < RESOLUTION_STEPS.length && (
                        <div className={`step-connector ${isCompleted ? 'connector-done' : ''}`} />
                      )}
                    </div>

                    <div className="step-info-col">
                      <div className="step-name">{t(step.labelKey)}</div>
                      <div className="step-desc">{t(step.descKey)}</div>
                      {isCurrent && (
                        <div className="step-live-pill">
                          <span className="live-dot"></span> In Active Stage
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Location & Official Remarks Grid */}
          <div className="bottom-info-columns">
            {/* Location & Map Card */}
            <div className="info-card location-info-card">
              <h3 className="card-subheading">📍 Location Details</h3>
              <p className="location-text-address">{complaint.location?.address || 'Incident location'}</p>
              <div className="mini-map-container">
                <div ref={miniMapRef} className="mini-leaflet-map" />
              </div>
              <div className="coord-chips-row">
                <span className="coord-chip">Lat: {complaint.location?.lat}</span>
                <span className="coord-chip">Lng: {complaint.location?.lng}</span>
              </div>
            </div>

            {/* Official Remarks & Feedback */}
            <div className="info-card remarks-card">
              <h3 className="card-subheading">🛡️ {t('officerNotes')}</h3>
              <div className="remarks-body">
                <p className="remarks-text">"{complaint.officerNotes}"</p>
                <div className="remarks-timestamp">
                  Last updated: {new Date(complaint.updatedAt).toLocaleTimeString()}
                </div>
              </div>

              {/* Citizen Action & Rating */}
              <div className="feedback-section-box">
                {complaint.status === 'resolved' ? (
                  <div className="rate-service-box">
                    <h4>{t('rateResolution')}</h4>
                    <div className="star-rating-row">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`star-btn ${star <= rating ? 'starred' : ''}`}
                          onClick={() => handleRate(star)}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    {feedbackSent && <span className="feedback-done-text">Feedback recorded!</span>}
                  </div>
                ) : (
                  <div className="reopen-box">
                    <button
                      type="button"
                      className="btn btn-outline-warning btn-block"
                      onClick={handleReopen}
                    >
                      ⚠️ {t('reopenButton')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};
