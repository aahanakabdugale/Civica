import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import en from "./locales/en.json";
import hi from "./locales/hi.json";

// Add more languages by importing their JSON and adding an entry here.
// Each file just needs the same keys as en.json.
const DICTIONARIES = { en, hi };

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
];

const STORAGE_KEY = "ngs-lang";

const I18nContext = createContext(null);

function getInitialLang() {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage?.getItem(STORAGE_KEY);
  if (stored && DICTIONARIES[stored]) return stored;
  const browser = window.navigator?.language?.slice(0, 2);
  return DICTIONARIES[browser] ? browser : "en";
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang);

  const setLang = useCallback((code) => {
    if (!DICTIONARIES[code]) return;
    setLangState(code);
    try {
      window.localStorage?.setItem(STORAGE_KEY, code);
    } catch {
      // localStorage unavailable (private browsing, etc.) — non-fatal
    }
  }, []);

  const t = useCallback(
    (key) => {
      const dict = DICTIONARIES[lang] || DICTIONARIES.en;
      return dict[key] ?? DICTIONARIES.en[key] ?? key;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
