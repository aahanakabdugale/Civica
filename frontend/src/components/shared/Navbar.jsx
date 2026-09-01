/**
 * Navbar.jsx — components/shared/
 * Contains TWO navbar implementations:
 *
 *  default export  →  DashboardNavbar  (Group 2 — authority console stat bar)
 *  named export    →  CitizenNavbar    (Group 1 — citizen-facing nav with language switcher)
 *
 * Import accordingly:
 *   import DashboardNavbar from '../shared/Navbar';           // Group 2
 *   import { CitizenNavbar, Navbar } from '../shared/Navbar'; // Group 1
 */

import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, LogOut } from 'lucide-react';
import { C, FONTS } from './theme';
import { useLanguage } from '../../context/LanguageContext';

/* ================================================================
   GROUP 2 — Authority Dashboard top bar
================================================================ */

export default function DashboardNavbar({
  onLogout,
  username = 'authority',
  openCount = 0,
  criticalCount = 0,
  dupCount = 0,
}) {
  return (
    <div
      style={{
        borderBottom: `1px solid ${C.line}`,
        background: C.surface,
        fontFamily: "'IBM Plex Sans', sans-serif",
      }}
      className="flex flex-wrap items-center gap-x-8 gap-y-2 px-6 py-4"
    >
      <style>{FONTS}</style>

      {/* Brand (mobile only — sidebar hides on md+) */}
      <div className="flex items-center gap-2 md:hidden">
        <ShieldCheck size={16} color={C.ink} />
        <span style={{ fontFamily: "'Fraunces', serif", color: C.ink }} className="text-base">
          Nagrik Ops
        </span>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-1">
        <div>
          <span style={{ fontFamily: "'Fraunces', serif", color: C.ink }} className="text-2xl">
            {openCount}
          </span>
          <span style={{ color: C.muted }} className="text-sm ml-2">open</span>
        </div>
        <div>
          <span style={{ fontFamily: "'Fraunces', serif", color: C.critical }} className="text-2xl">
            {criticalCount}
          </span>
          <span style={{ color: C.muted }} className="text-sm ml-2">critical</span>
        </div>
        <div>
          <span style={{ fontFamily: "'Fraunces', serif", color: C.amber }} className="text-2xl">
            {dupCount}
          </span>
          <span style={{ color: C.muted }} className="text-sm ml-2">flagged duplicates</span>
        </div>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-2" style={{ color: C.muted }}>
          <span className="text-sm hidden sm:inline">Signed in as</span>
          <span
            style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.ink }}
            className="text-sm"
          >
            {username}
          </span>
        </div>
        <button
          id="navbar-logout-btn"
          onClick={onLogout}
          style={{ color: C.muted }}
          className="flex items-center gap-1.5 text-sm hover:text-ink transition-colors"
          title="Log out"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   GROUP 1 — Citizen-facing navigation bar with multi-language toggle
================================================================ */

export const CitizenNavbar = ({ activeTab, onSelectTab }) => {
  let langState = {
    currentLang: 'en',
    changeLanguage: () => {},
    languages: [
      { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
      { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
      { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
      { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
      { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
    ],
    currentLanguageMeta: { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
    t: (k) => (k === 'navFileComplaint' ? 'File Complaint' : k === 'navTrackStatus' ? 'Track Status' : k),
  };

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ctx = useLanguage();
    if (ctx) langState = ctx;
  } catch (_) {
    // Gracefully handle rendering outside LanguageProvider
  }

  const { currentLang, changeLanguage, languages, currentLanguageMeta, t } = langState;
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

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
        {/* Brand */}
        <div
          className="nav-brand"
          onClick={() => onSelectTab && onSelectTab('submit')}
          style={{ cursor: 'pointer' }}
        >
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
            onClick={() => onSelectTab && onSelectTab('submit')}
          >
            <span className="nav-link-icon">✍️</span>
            {t('navFileComplaint')}
          </button>

          <button
            type="button"
            className={`nav-link ${activeTab === 'track' ? 'active' : ''}`}
            onClick={() => onSelectTab && onSelectTab('track')}
          >
            <span className="nav-link-icon">🔍</span>
            {t('navTrackStatus')}
          </button>

          <button
            type="button"
            className={`nav-link ${activeTab === 'authority' ? 'active' : ''}`}
            onClick={() => onSelectTab && onSelectTab('authority')}
            style={{ marginLeft: '12px' }}
          >
            <span className="nav-link-icon">🛡️</span>
            Authority Portal
          </button>
        </nav>

        {/* Right Section: Language Switcher */}
        <div className="nav-actions">
          <div className="language-selector-wrapper" ref={dropdownRef}>
            <button
              type="button"
              className="btn-language-toggle"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              aria-label="Select Language"
            >
              <span className="lang-flag">{currentLanguageMeta?.flag || '🌐'}</span>
              <span className="lang-name">{currentLanguageMeta?.native || 'Language'}</span>
              <svg
                className={`chevron-icon ${langDropdownOpen ? 'open' : ''}`}
                viewBox="0 0 20 20"
                width="16"
                height="16"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {langDropdownOpen && (
              <div className="language-dropdown-menu">
                <div className="dropdown-header">Select Preferred Language</div>
                {languages?.map((lang) => (
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
              onSelectTab && onSelectTab('submit');
              setMobileMenuOpen(false);
            }}
          >
            <span>✍️</span> {t('navFileComplaint')}
          </button>
          <button
            type="button"
            className={`mobile-nav-link ${activeTab === 'track' ? 'active' : ''}`}
            onClick={() => {
              onSelectTab && onSelectTab('track');
              setMobileMenuOpen(false);
            }}
          >
            <span>🔍</span> {t('navTrackStatus')}
          </button>
          <button
            type="button"
            className={`mobile-nav-link ${activeTab === 'authority' ? 'active' : ''}`}
            onClick={() => {
              onSelectTab && onSelectTab('authority');
              setMobileMenuOpen(false);
            }}
          >
            <span>🛡️</span> Authority Portal
          </button>
        </div>
      )}
    </header>
  );
};

// Named alias for backwards compatibility
export { CitizenNavbar as Navbar };
