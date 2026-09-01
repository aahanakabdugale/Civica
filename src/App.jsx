import React, { useState } from "react";
import { I18nProvider, useI18n } from "./i18n";
import LanguageSwitcher from "./components/LanguageSwitcher";
import ComplaintForm from "./components/ComplaintForm";
import StatusTracker from "./components/StatusTracker";
import "./styles/tokens.css";
import "./App.css";

// --- Backend wiring -------------------------------------------------------
// Point these two functions at your team's actual API. Everything else in
// this file and in the components is backend-agnostic.

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:8000";

async function submitComplaint(formData) {
  const res = await fetch(`${API_BASE}/complaints`, {
    method: "POST",
    body: formData, // multipart/form-data — includes optional photo
  });
  if (!res.ok) throw new Error("Failed to submit complaint");
  const data = await res.json();
  return { complaintId: data.id };
}

async function lookupComplaint(id) {
  const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}`);
  if (res.status === 404) {
    const err = new Error("Not found");
    err.notFound = true;
    throw err;
  }
  if (!res.ok) throw new Error("Failed to fetch complaint");
  return res.json();
}

// --- App shell -------------------------------------------------------------

function getRoute() {
  if (typeof window === "undefined") return { page: "submit" };
  const params = new URLSearchParams(window.location.search);
  if (window.location.pathname.startsWith("/track")) {
    return { page: "track", id: params.get("id") || "" };
  }
  return { page: "submit" };
}

function AppShell() {
  const { t } = useI18n();
  const [route, setRoute] = useState(getRoute);

  const navigate = (page) => {
    window.history.pushState({}, "", page === "track" ? "/track" : "/");
    setRoute({ page });
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__brand">{t("appName")}</h1>
        <nav className="app__nav">
          <button
            className={route.page === "submit" ? "is-active" : ""}
            onClick={() => navigate("submit")}
          >
            {t("nav.submit")}
          </button>
          <button
            className={route.page === "track" ? "is-active" : ""}
            onClick={() => navigate("track")}
          >
            {t("nav.track")}
          </button>
        </nav>
        <LanguageSwitcher />
      </header>

      <p className="app__tagline">{t("tagline")}</p>

      <main className="app__main">
        {route.page === "submit" && <ComplaintForm onSubmit={submitComplaint} />}
        {route.page === "track" && (
          <StatusTracker initialId={route.id} onLookup={lookupComplaint} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppShell />
    </I18nProvider>
  );
}
