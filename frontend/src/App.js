import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/shared/Navbar';
import { SubmitComplaint } from './pages/SubmitComplaint';
import { TrackComplaint } from './pages/TrackComplaint';

function App() {
  const [activeTab, setActiveTab] = useState('submit'); // 'submit' | 'track'
  const [targetTrackingId, setTargetTrackingId] = useState('');

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
        {/* Navigation Bar with Language Switcher */}
        <Navbar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'submit') navigateToSubmit();
            if (tab === 'track') navigateToTrack();
          }}
        />

        {/* Active Page View */}
        {activeTab === 'submit' && (
          <SubmitComplaint onNavigateToTrack={navigateToTrack} />
        )}

        {activeTab === 'track' && (
          <TrackComplaint
            initialComplaintId={targetTrackingId}
            onNavigateToSubmit={navigateToSubmit}
          />
        )}
      </div>
    </LanguageProvider>
  );
}

export default App;
