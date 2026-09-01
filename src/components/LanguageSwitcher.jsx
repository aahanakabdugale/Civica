import React from "react";
import { useI18n, LANGUAGES } from "../i18n";
import "./LanguageSwitcher.css";

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <label className="lang-switcher">
      <span className="lang-switcher__label">{t("lang.label")}</span>
      <select
        className="lang-switcher__select"
        value={lang}
        onChange={(e) => setLang(e.target.value)}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
