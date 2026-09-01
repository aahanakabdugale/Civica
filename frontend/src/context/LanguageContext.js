import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, SUPPORTED_LANGUAGES } from '../translations/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLang, setCurrentLang] = useState(() => {
    const saved = localStorage.getItem('civica_language');
    return (saved && translations[saved]) ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('civica_language', currentLang);
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  const changeLanguage = (langCode) => {
    if (translations[langCode]) {
      setCurrentLang(langCode);
    }
  };

  // Translation helper function supporting nested keys e.g. t('categories.roads')
  const t = (path, fallback = '') => {
    const keys = path.split('.');
    let current = translations[currentLang] || translations.en;
    
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        // Fallback to English
        let fallbackCur = translations.en;
        for (const fbKey of keys) {
          if (fallbackCur && fallbackCur[fbKey] !== undefined) {
            fallbackCur = fallbackCur[fbKey];
          } else {
            return fallback || path;
          }
        }
        return fallbackCur;
      }
    }
    return current;
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLang,
        changeLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
        currentLanguageMeta: SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
