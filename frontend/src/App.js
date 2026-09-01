/**
 * App.js — Civica frontend root
 *
 * Integrates all modules:
 *   Group 1  →  Citizen portal (Submit + Track complaints with multi-language support)
 *   Group 2  →  Authority console (Nagrik Ops — auth gated: Login → Dashboard)
 *   Group 3  →  Analytics dashboard (pluggable tab/view)
 */

import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { CitizenNavbar } from './components/shared/Navbar';
import { SubmitComplaint } from './pages/SubmitComplaint';
import { TrackComplaint } from './pages/TrackComplaint';
import Login from './pages/Login';
import DashboardHome from './pages/DashboardHome';

export default function App() {
  // Navigation tabs: 'submit' | 'track' | 'authority'
  const [activeTab, setActiveTab] = useState('submit');
  const [targetTrackingId, setTargetTrackingId] = useState('');

  // Group 2 Authority authentication state
  const [loggedIn, setLoggedIn] = useState(false);

  const navigateToTrack = (complaintId = '') => {
    setTargetTrackingId(complaintId);
    setActiveTab('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToSubmit = () => {
    setActiveTab('submit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <LanguageProvider>
      <div className="civica-app">
        {/* If user is in Authority Console */}
        {activeTab === 'authority' ? (
          <div>
            {/* Top link back to Citizen view */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 24px',
                borderBottom: '1px solid #D8D3C7',
                background: '#FBFAF7',
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('submit')}
                style={{
                  color: '#7C8A94',
                  fontSize: 13,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                ← Back to Citizen Portal
              </button>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 12,
                  color: '#7C8A94',
                }}
              >
                Civica Authority Portal
              </span>
            </div>

            {/* Auth Gate: Login or Dashboard */}
            {loggedIn ? (
              <DashboardHome onLogout={() => setLoggedIn(false)} />
            ) : (
              <Login onLogin={() => setLoggedIn(true)} />
            )}
          </div>
        ) : (
          /* Citizen Portal (Group 1) */
          <div>
            {/* Shared Citizen Navigation Bar with Language Switcher */}
            <CitizenNavbar
              activeTab={activeTab}
              onSelectTab={(tab) => {
                if (tab === 'submit') navigateToSubmit();
                if (tab === 'track') navigateToTrack();
                if (tab === 'authority') setActiveTab('authority');
              }}
            />

            {/* Submit Complaint Page */}
            {activeTab === 'submit' && (
              <SubmitComplaint onNavigateToTrack={navigateToTrack} />
            )}

            {/* Track Complaint Page */}
            {activeTab === 'track' && (
              <TrackComplaint
                initialComplaintId={targetTrackingId}
                onNavigateToSubmit={navigateToSubmit}
              />
            )}
          </div>
        )}
      </div>
    </LanguageProvider>
  );
}
