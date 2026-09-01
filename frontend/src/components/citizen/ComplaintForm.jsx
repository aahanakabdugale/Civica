import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { LocationPicker } from './LocationPicker';
import { PhotoUpload } from './PhotoUpload';

const CATEGORY_ITEMS = [
  { id: 'roads', icon: '🛣️', key: 'categories.roads' },
  { id: 'sanitation', icon: '🗑️', key: 'categories.sanitation' },
  { id: 'water', icon: '🚰', key: 'categories.water' },
  { id: 'electricity', icon: '💡', key: 'categories.electricity' },
  { id: 'drainage', icon: '🌊', key: 'categories.drainage' },
  { id: 'encroachment', icon: '🚧', key: 'categories.encroachment' },
  { id: 'public_safety', icon: '⚠️', key: 'categories.public_safety' },
  { id: 'other', icon: '📋', key: 'categories.other' },
];

export const ComplaintForm = ({ onSubmit, isSubmitting }) => {
  const { t, currentLang } = useLanguage();

  const [formData, setFormData] = useState({
    category: 'roads',
    categoryName: '',
    title: '',
    description: '',
    urgency: 'medium',
    location: {
      lat: 28.6139,
      lng: 77.2090,
      address: '',
      ward: 'Ward 12 - Municipal North',
    },
    images: [],
    citizen: {
      name: '',
      phone: '',
      email: '',
      isAnonymous: false,
    },
  });

  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [aiPreview, setAiPreview] = useState(null);

  // Set category name based on active translation
  useEffect(() => {
    const selectedCat = CATEGORY_ITEMS.find((c) => c.id === formData.category);
    if (selectedCat) {
      setFormData((prev) => ({
        ...prev,
        categoryName: t(selectedCat.key),
      }));
    }
  }, [formData.category, currentLang, t]);

  // Voice to text setup
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setSpeechSupported(false);
    }
  }, []);

  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      // Match voice recognition language to current portal language (English, Hindi, Marathi)
      const langMap = {
        en: 'en-US',
        hi: 'hi-IN',
        mr: 'mr-IN',
      };
      recognition.lang = langMap[currentLang] || 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setFormData((prev) => ({
          ...prev,
          description: prev.description ? `${prev.description} ${transcript}` : transcript,
        }));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  // Real-time AI categorization hint simulation as user types description
  useEffect(() => {
    const text = (formData.title + ' ' + formData.description).toLowerCase();
    if (text.length < 8) {
      setAiPreview(null);
      return;
    }

    const timer = setTimeout(() => {
      let cat = 'General';
      let dept = 'General Redressal Cell';
      let priority = 'Medium';

      if (text.includes('pothole') || text.includes('road') || text.includes('skid') || text.includes('asphalt')) {
        cat = 'Roads & Infrastructure';
        dept = 'Highway & PWD Department';
      } else if (text.includes('garbage') || text.includes('trash') || text.includes('waste') || text.includes('smell')) {
        cat = 'Solid Waste Management';
        dept = 'Municipal Sanitation Wing';
      } else if (text.includes('water') || text.includes('leak') || text.includes('pipe') || text.includes('flood')) {
        cat = 'Water Supply & Sewerage';
        dept = 'Jal Board Division';
        priority = text.includes('flood') || text.includes('burst') ? 'Critical Emergency' : 'High';
      } else if (text.includes('light') || text.includes('electric') || text.includes('wire')) {
        cat = 'Streetlights & Power';
        dept = 'Electrical Works Division';
      }

      setAiPreview({
        predictedCategory: cat,
        predictedDept: dept,
        estimatedPriority: priority,
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.title, formData.description]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleQuickTemplate = (title, desc, cat, urgency) => {
    setFormData((prev) => ({
      ...prev,
      title,
      description: desc,
      category: cat,
      urgency,
      categoryName: t(`categories.${cat}`),
    }));
  };

  return (
    <form className="complaint-form-card" onSubmit={handleSubmit}>
      {/* Quick Template Chips for Demo */}
      <div className="quick-templates-bar">
        <span className="templates-label">⚡ Quick Fill Demo Cases:</span>
        <button
          type="button"
          className="template-chip"
          onClick={() =>
            handleQuickTemplate(
              'Severe pothole causing vehicle damage near Gate 4',
              'Deep 2-foot pothole on main carriage way. Water pooling and causing dangerous skidding during night hours.',
              'roads',
              'high'
            )
          }
        >
          🛣️ Pothole Hazard
        </button>
        <button
          type="button"
          className="template-chip"
          onClick={() =>
            handleQuickTemplate(
              'Main potable water pipe leaking heavily on sidewalk',
              'Fresh drinking water pipe ruptured under pedestrian walkway. Flowing into residential driveway for 2 days.',
              'water',
              'high'
            )
          }
        >
          🚰 Water Leakage
        </button>
        <button
          type="button"
          className="template-chip"
          onClick={() =>
            handleQuickTemplate(
              'Garbage bin overflowing and blocking residential street',
              'Uncollected municipal dumpsters overflowing into street. Stray animals tearing plastic and creating health hazard.',
              'sanitation',
              'medium'
            )
          }
        >
          🗑️ Sanitation
        </button>
      </div>

      {/* 1. Category Selection */}
      <div className="form-section">
        <div className="section-label-group">
          <label className="field-label">{t('catLabel')}</label>
          <span className="field-hint">{t('catHint')}</span>
        </div>

        <div className="category-cards-grid">
          {CATEGORY_ITEMS.map((cat) => {
            const isSelected = formData.category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`category-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, category: cat.id, categoryName: t(cat.key) })}
              >
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-text">{t(cat.key)}</span>
                {isSelected && <span className="cat-check-badge">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Short Grievance Title */}
      <div className="form-section">
        <label className="field-label">{t('titleLabel')}</label>
        <input
          type="text"
          className="input-field input-title"
          placeholder={t('titlePlaceholder')}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      {/* 3. Detailed Description + Voice Input */}
      <div className="form-section">
        <div className="description-header-row">
          <label className="field-label">{t('descLabel')}</label>
          {speechSupported && (
            <button
              type="button"
              className={`btn-voice-input ${isListening ? 'listening' : ''}`}
              onClick={toggleVoiceInput}
            >
              <span className="mic-icon">🎙️</span>
              {isListening ? t('voiceInputListening') : t('voiceInputStart')}
            </button>
          )}
        </div>

        <div className="textarea-container">
          <textarea
            className="input-field input-textarea"
            rows="4"
            placeholder={t('descPlaceholder')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
          {isListening && (
            <div className="voice-wave-anim">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
        </div>

        {/* AI Real-time Classification Insight Preview */}
        {aiPreview && (
          <div className="ai-insight-box">
            <div className="ai-tag">✨ AI Live Triage Preview</div>
            <div className="ai-insight-content">
              <span>Suggested Department: <strong>{aiPreview.predictedDept}</strong></span>
              <span>•</span>
              <span>Estimated Severity: <strong>{aiPreview.estimatedPriority}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Perceived Urgency Level */}
      <div className="form-section">
        <label className="field-label">{t('urgencyLabel')}</label>
        <div className="urgency-options-grid">
          <label className={`urgency-option option-low ${formData.urgency === 'low' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="urgency"
              value="low"
              checked={formData.urgency === 'low'}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
            />
            <div className="urgency-content">
              <span className="urgency-dot low"></span>
              <span className="urgency-title">{t('urgencyLow')}</span>
            </div>
          </label>

          <label className={`urgency-option option-medium ${formData.urgency === 'medium' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="urgency"
              value="medium"
              checked={formData.urgency === 'medium'}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
            />
            <div className="urgency-content">
              <span className="urgency-dot medium"></span>
              <span className="urgency-title">{t('urgencyMedium')}</span>
            </div>
          </label>

          <label className={`urgency-option option-high ${formData.urgency === 'high' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="urgency"
              value="high"
              checked={formData.urgency === 'high'}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
            />
            <div className="urgency-content">
              <span className="urgency-dot high"></span>
              <span className="urgency-title">{t('urgencyHigh')}</span>
            </div>
          </label>

          <label className={`urgency-option option-critical ${formData.urgency === 'critical' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="urgency"
              value="critical"
              checked={formData.urgency === 'critical'}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
            />
            <div className="urgency-content">
              <span className="urgency-dot critical"></span>
              <span className="urgency-title">{t('urgencyCritical')}</span>
            </div>
          </label>
        </div>
      </div>

      {/* 5. Incident Location Picker */}
      <div className="form-section">
        <LocationPicker
          location={formData.location}
          onChange={(newLocation) => setFormData({ ...formData, location: newLocation })}
        />
      </div>

      {/* 6. Photo / Evidence Upload */}
      <div className="form-section">
        <PhotoUpload
          images={formData.images}
          onChange={(newImages) => setFormData({ ...formData, images: newImages })}
        />
      </div>

      {/* 7. Citizen Contact Info */}
      <div className="form-section contact-section">
        <div className="section-label-group">
          <label className="field-label">{t('contactLabel')}</label>
          <p className="field-subtitle">{t('contactSubtitle')}</p>
        </div>

        <div className="anonymous-toggle-box">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.citizen.isAnonymous}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  citizen: { ...formData.citizen, isAnonymous: e.target.checked },
                })
              }
            />
            <span className="checkbox-custom"></span>
            <span className="checkbox-text">{t('anonymousCheckbox')}</span>
          </label>
        </div>

        {!formData.citizen.isAnonymous && (
          <div className="contact-inputs-grid">
            <div className="field-group">
              <label className="subfield-label">{t('nameLabel')}</label>
              <input
                type="text"
                className="input-field"
                placeholder={t('namePlaceholder')}
                value={formData.citizen.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    citizen: { ...formData.citizen, name: e.target.value },
                  })
                }
                required={!formData.citizen.isAnonymous}
              />
            </div>

            <div className="field-group">
              <label className="subfield-label">{t('phoneLabel')}</label>
              <input
                type="tel"
                className="input-field"
                placeholder={t('phonePlaceholder')}
                value={formData.citizen.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    citizen: { ...formData.citizen, phone: e.target.value },
                  })
                }
                required={!formData.citizen.isAnonymous}
              />
            </div>

            <div className="field-group span-full">
              <label className="subfield-label">{t('emailLabel')}</label>
              <input
                type="email"
                className="input-field"
                placeholder={t('emailPlaceholder')}
                value={formData.citizen.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    citizen: { ...formData.citizen, email: e.target.value },
                  })
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="form-submit-action">
        <button
          type="submit"
          className="btn btn-submit btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="btn-spinner"></span>
              {t('submitting')}
            </>
          ) : (
            <>
              <span>🚀</span> {t('submitBtn')}
            </>
          )}
        </button>
      </div>
    </form>
  );
};
