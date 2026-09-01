// src/App.js
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/shared/Navbar';
import SubmitComplaint from './pages/SubmitComplaint';
import TrackComplaint from './pages/TrackComplaint';
import Login from './pages/Login';
import DashboardHome from './pages/DashboardHome';
import ComplaintDetail from './pages/ComplaintDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<SubmitComplaint />} />
        <Route path="/track" element={<TrackComplaint />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/complaint/:id" element={<ComplaintDetail />} />
      </Routes>
    </BrowserRouter>
  );
}