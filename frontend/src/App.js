/**
 * App.js
 * Root of the Civica frontend. Handles the auth gate (Login → DashboardHome).
 *
 * Group 1 pages (SubmitComplaint, TrackComplaint) and Group 3 pages
 * (AnalyticsDashboard) will be wired in here once their components are ready.
 * Use conditional rendering or react-router-dom <Routes> when all groups merge.
 */

import { useState } from "react";
import Login from "./pages/Login";
import DashboardHome from "./pages/DashboardHome";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  return loggedIn ? (
    <DashboardHome onLogout={() => setLoggedIn(false)} />
  ) : (
    <Login onLogin={() => setLoggedIn(true)} />
  );
}
