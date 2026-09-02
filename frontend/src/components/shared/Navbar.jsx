import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const Navbar = ({ activeTab, onSelectTab }) => {
  const { currentLang, changeLanguage, languages, currentLanguageMeta, t } = useLanguage();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="civica-navbar">
      <div className="nav-container">
        {/* Logo and Brand */}
        <div className="nav-brand" onClick={() => onSelectTab('submit')} style={{ cursor: 'pointer' }}>
          <div className="brand-icon">
            <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#brandGrad)" />
              <path d="M16 6L6 14V26H12V19H20V26H26V14L16 6Z" fill="white" />
              <circle cx="16" cy="14" r="2.5" fill="#3B82F6" />
              <defs>
                <linearGradient id="brandGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#2563EB" />
                  <stop offset="1" stopColor="#1D4ED8" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-title">Civica</span>
            <span className="brand-badge">AI Grievance</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="nav-links desktop-only">
          <button
            type="button"
            className={`nav-link ${activeTab === 'submit' ? 'active' : ''}`}
            onClick={() => onSelectTab('submit')}
          >
            <span className="nav-link-icon">✍️</span>
            {t('navFileComplaint')}
          </button>

          <button
            type="button"
            className={`nav-link ${activeTab === 'track' ? 'active' : ''}`}
            onClick={() => onSelectTab('track')}
          >
            <span className="nav-link-icon">🔍</span>
            {t('navTrackStatus')}
          </button>
        </nav>

        {/* Right Section: Language Switcher & Authority Portal */}
        <div className="nav-actions">
          {/* Multi-language Selector Dropdown */}
          <div className="language-selector-wrapper" ref={dropdownRef}>
            <button
              type="button"
              className="btn-language-toggle"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              aria-label="Select Language"
            >
              <span className="lang-flag">{currentLanguageMeta.flag}</span>
              <span className="lang-name">{currentLanguageMeta.native}</span>
              <svg className={`chevron-icon ${langDropdownOpen ? 'open' : ''}`} viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {langDropdownOpen && (
              <div className="language-dropdown-menu">
                <div className="dropdown-header">Select Preferred Language</div>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    className={`lang-option ${lang.code === currentLang ? 'selected' : ''}`}
                    onClick={() => {
                      changeLanguage(lang.code);
                      setLangDropdownOpen(false);
                    }}
                  >
                    <span className="lang-flag">{lang.flag}</span>
                    <div className="lang-info">
                      <span className="lang-native">{lang.native}</span>
                      <span className="lang-english">{lang.name}</span>
                    </div>
                    {lang.code === currentLang && <span className="check-mark">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="btn-mobile-toggle mobile-only"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer mobile-only">
          <button
            type="button"
            className={`mobile-nav-link ${activeTab === 'submit' ? 'active' : ''}`}
            onClick={() => {
              onSelectTab('submit');
              setMobileMenuOpen(false);
            }}
          >
            <span>✍️</span> {t('navFileComplaint')}
          </button>
          <button
            type="button"
            className={`mobile-nav-link ${activeTab === 'track' ? 'active' : ''}`}
            onClick={() => {
              onSelectTab('track');
              setMobileMenuOpen(false);
            }}
          >
            <span>🔍</span> {t('navTrackStatus')}
          </button>
        </div>
      )}
    </header>
  );
};
