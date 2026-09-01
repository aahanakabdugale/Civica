import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ complaints = [] }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Dynamically calculate actual counts from the database records
  const safeComplaints = Array.isArray(complaints) ? complaints : [];
  const openCount = safeComplaints.filter(c => (c.status || 'Open') === 'Open' || (c.status) === 'In Progress').length;
  const criticalCount = safeComplaints.filter(c => c.priority === 'Critical').length;
  // Assuming duplicates can be identified by a flag or status field from MongoDB
  const duplicateCount = safeComplaints.filter(c => c.is_duplicate || c.status === 'Duplicate').length;

  return (
    <header className="w-full bg-white border-b border-red-100 px-6 lg:px-12 py-3.5 flex justify-between items-center shadow-2xs sticky top-0 z-50">
      
      <div className="flex items-center space-x-3">
        <span className="bg-red-600 text-white p-2 rounded-xl text-sm shadow-xs font-bold">CN</span>
        <div>
          <span className="font-bold text-slate-900 text-base tracking-tight block leading-none">Civica</span>
          <span className="text-[10px] text-red-600 font-bold uppercase tracking-widest">Authority Command</span>
        </div>
      </div>

      {/* Dynamic Live Metrics Tally */}
      <div className="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-600">
        <span className="bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full">
          Open: <strong className="font-bold">{openCount}</strong>
        </span>
        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full">
          Critical: <strong className="font-bold">{criticalCount}</strong>
        </span>
        <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full">
          Duplicates: <strong className="font-bold">{duplicateCount}</strong>
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-slate-900">Municipal Officer</p>
          <p className="text-[10px] text-red-600 font-semibold uppercase tracking-wider">Signed in as Authority</p>
        </div>
        <button 
          onClick={handleLogout}
          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-2xs"
        >
          Logout
        </button>
      </div>

    </header>
  );
}

export { Navbar };