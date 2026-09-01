import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import CitizenNavbar from './components/citizen/CitizenNavbar';
import Navbar from './components/shared/Navbar';

// Use named imports with curly braces:
import { SubmitComplaint } from './pages/SubmitComplaint';
import { TrackComplaint } from './pages/TrackComplaint';
import CitizenLogin from './pages/CitizenLogin';
import DashboardHome from './pages/DashboardHome';
import ComplaintDetail from './pages/ComplaintDetail';
import { MyComplaints } from './pages/MyComplaints';
import { UserProfile } from './pages/UserProfile';

import './App.css';
import './index.css';

function CitizenLayout() {
  return (
    <>
      <CitizenNavbar />
      <Outlet />
    </>
  );
}

function AdminLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            {/* Citizen portal */}
            <Route element={<CitizenLayout />}>
              <Route path="/" element={<SubmitComplaint />} />
              <Route path="/track" element={<TrackComplaint />} />
              <Route path="/login" element={<CitizenLogin />} />
              <Route path="/my-complaints" element={<MyComplaints />} />
              <Route path="/profile" element={<UserProfile />} />
              {/* Optional fallback route for tracking if needed */}
              <Route path="/my-complaints" element={<TrackComplaint />} />
            </Route>

            {/* Admin/authority portal */}
            <Route element={<AdminLayout />}>
              <Route path="/admin/login" element={<CitizenLogin />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute role="authority">
                    <DashboardHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/complaint/:id"
                element={
                  <ProtectedRoute role="authority">
                    <ComplaintDetail />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;