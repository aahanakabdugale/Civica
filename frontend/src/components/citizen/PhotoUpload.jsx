import React, { useState, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const PhotoUpload = ({ images = [], onChange }) => {
  const { t } = useLanguage();
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const processFiles = (fileList) => {
    setErrorMessage('');
    const newFiles = Array.from(fileList);

    for (const file of newFiles) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Only image files (JPG, PNG, WEBP) are supported.');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage(`"${file.name}" exceeds the 5MB size limit.`);
        continue;
      }

      // Convert to base64 DataURL for instant visual preview & offline storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target.result;
        if (!images.includes(result)) {
          onChange([...images, result]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeImage = (indexToRemove) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  return (
    <div className="photo-upload-section">
      <div className="section-label-group">
        <label className="field-label">{t('photoLabel')}</label>
        <span className="field-hint">{t('photoMaxNotice')}</span>
      </div>

      {/* Drag & Drop Target Area */}
      <div
        className={`photo-drop-zone ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden-file-input"
          onChange={handleFileSelect}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden-file-input"
          onChange={handleFileSelect}
        />

        <div className="drop-zone-content">
          <div className="upload-icon-circle">
            <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2" fill="none">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="drop-title">{t('photoDropText')}</p>
          <div className="upload-actions-row" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="btn-camera-action"
              onClick={() => cameraInputRef.current && cameraInputRef.current.click()}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              {t('photoCaptureCamera')}
            </button>
          </div>
        </div>
      </div>

      {errorMessage && <div className="field-error-text">{errorMessage}</div>}

      {/* Image Preview Thumbnails */}
      {images.length > 0 && (
        <div className="photo-preview-grid">
          {images.map((imgSrc, index) => (
            <div key={index} className="preview-card">
              <img src={imgSrc} alt={`Complaint Evidence ${index + 1}`} className="preview-image" />
              <button
                type="button"
                className="btn-remove-photo"
                onClick={() => removeImage(index)}
                title={t('photoRemove')}
              >
                ×
              </button>
              <span className="photo-index-tag">#{index + 1}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
