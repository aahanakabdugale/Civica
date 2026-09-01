import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ComplaintForm } from '../components/citizen/ComplaintForm';
import { SubmissionSuccessModal, Toast } from '../components/shared/StateComponents';
import { submitComplaint } from '../api';

export const SubmitComplaint = ({ onNavigateToTrack }) => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);
  const [toast, setToast] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const response = await submitComplaint(formData);
      if (response && response.success) {
        setSubmittedComplaint(response.data);
        setToast({
          type: 'success',
          message: `Grievance #${response.data.id} submitted and categorized by AI!`,
        });
      } else {
        setToast({
          type: 'error',
          message: response?.error || 'Failed to submit grievance. Please try again.',
        });
      }
    } catch (err) {
      setToast({
        type: 'error',
        message: 'Network error. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="page-wrapper submit-page">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Hero Banner Section */}
      <section className="hero-banner">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="sparkle">✨</span> Municipal AI Redressal Portal
          </div>
          <h1 className="hero-title">{t('heroTitle')}</h1>
          <p className="hero-subtitle">{t('heroSubtitle')}</p>

          <div className="hero-track-bar">
            <span>{t('heroTrackPrompt')}</span>
            <button
              type="button"
              className="btn btn-outline-light"
              onClick={() => onNavigateToTrack()}
            >
              🔍 {t('heroTrackButton')}
            </button>
          </div>
        </div>

        {/* Feature Highlights Pill Cards */}
        <div className="hero-highlights-grid">
          <div className="highlight-card">
            <div className="highlight-icon">⚡</div>
            <div className="highlight-text">
              <strong>Instant AI Routing</strong>
              <span>Classified to correct department in &lt; 2 seconds</span>
            </div>
          </div>

          <div className="highlight-card">
            <div className="highlight-icon">🎯</div>
            <div className="highlight-text">
              <strong>Duplicate Detection</strong>
              <span>Semantic clustering prevents redundant work orders</span>
            </div>
          </div>

          <div className="highlight-card">
            <div className="highlight-icon">📍</div>
            <div className="highlight-text">
              <strong>Live GIS Pinning</strong>
              <span>GPS coordinates mapped directly to field crew</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Submission Form Container */}
      <main className="form-main-container">
        <div className="form-header-card">
          <h2 className="form-section-title">{t('formTitle')}</h2>
          <p className="form-section-subtitle">{t('formSubtitle')}</p>
        </div>

        <ComplaintForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </main>

      {/* FAQ Section */}
      <section className="faq-container">
        <h2 className="faq-heading">{t('faqTitle')}</h2>
        <div className="faq-list">
          <div className={`faq-card ${openFaq === 1 ? 'open' : ''}`}>
            <button
              type="button"
              className="faq-question"
              onClick={() => toggleFaq(1)}
            >
              <span>{t('faq1Q')}</span>
              <span className="faq-toggle-icon">{openFaq === 1 ? '−' : '+'}</span>
            </button>
            {openFaq === 1 && <div className="faq-answer">{t('faq1A')}</div>}
          </div>

          <div className={`faq-card ${openFaq === 2 ? 'open' : ''}`}>
            <button
              type="button"
              className="faq-question"
              onClick={() => toggleFaq(2)}
            >
              <span>{t('faq2Q')}</span>
              <span className="faq-toggle-icon">{openFaq === 2 ? '−' : '+'}</span>
            </button>
            {openFaq === 2 && <div className="faq-answer">{t('faq2A')}</div>}
          </div>

          <div className={`faq-card ${openFaq === 3 ? 'open' : ''}`}>
            <button
              type="button"
              className="faq-question"
              onClick={() => toggleFaq(3)}
            >
              <span>{t('faq3Q')}</span>
              <span className="faq-toggle-icon">{openFaq === 3 ? '−' : '+'}</span>
            </button>
            {openFaq === 3 && <div className="faq-answer">{t('faq3A')}</div>}
          </div>
        </div>
      </section>

      {/* Submission Success Dialog */}
      {submittedComplaint && (
        <SubmissionSuccessModal
          complaint={submittedComplaint}
          onClose={() => setSubmittedComplaint(null)}
          onTrack={(id) => {
            setSubmittedComplaint(null);
            onNavigateToTrack(id);
          }}
        />
      )}
    </div>
  );
};
