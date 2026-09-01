import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function CitizenNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="w-full bg-white border-b border-sky-100 px-6 lg:px-16 py-4 flex justify-between items-center shadow-2xs sticky top-0 z-50">
      
      <Link to="/" className="flex items-center space-x-2 text-slate-900 font-bold text-lg tracking-tight">
        <span className="bg-sky-600 text-white p-1.5 rounded-xl shadow-xs text-sm">🏛️</span>
        <span>Civica <span className="text-sky-600 font-normal text-xs uppercase tracking-widest ml-1">Portal</span></span>
      </Link>

      <div className="flex items-center space-x-6 text-sm font-medium">
        <Link to="/" className={`transition ${location.pathname === '/' ? 'text-sky-600 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}>
          Submit Grievance
        </Link>
        <Link to="/track" className={`transition ${location.pathname === '/track' ? 'text-sky-600 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}>
          Track Complaint
        </Link>
      </div>

      <div className="flex items-center space-x-3">
        {!user ? (
          <>
            <Link to="/login" className="text-slate-700 hover:text-slate-900 text-xs font-semibold px-4 py-2 transition">
              Sign In
            </Link>
            <Link to="/login" className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-xs">
              Authority Portal
            </Link>
          </>
        ) : user.role === 'authority' ? (
          <Link 
            to="/admin/dashboard" 
            className="bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-xs flex items-center space-x-2"
          >
            <span>Command Dashboard</span>
          </Link>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 bg-sky-50 border border-sky-200 hover:bg-sky-100 p-1.5 pr-3 rounded-full transition focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user.email ? user.email.substring(0, 2).toUpperCase() : 'US'}
              </div>
              <span className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">
                {user.email || user.name || 'User'}
              </span>
              <span className="text-[10px] text-slate-500">▼</span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">Account Profile</p>
                  <p className="text-[11px] text-sky-600 font-mono truncate mt-0.5">{user.email || user.phone}</p>
                </div>

                <div className="py-1">
                  <Link 
                    to="/my-complaints" 
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-xs text-slate-700 hover:bg-sky-50 hover:text-sky-600 font-medium transition"
                  >
                    Past Grievance History
                  </Link>
                  <Link 
                    to="/profile" 
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-xs text-slate-700 hover:bg-sky-50 hover:text-sky-600 font-medium transition"
                  >
                    My Profile Info
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-1 mt-1">
                  <button 
                    onClick={handleLogoutClick}
                    className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-medium transition"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </nav>
  );
}

export { CitizenNavbar };