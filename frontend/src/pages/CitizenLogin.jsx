import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function CitizenLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [role, setRole] = useState('citizen');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      
      const userData = {
        name: role === 'authority' ? 'Municipal Officer' : identifier.split('@')[0] || 'Citizen User',
        email: identifier,
        phone: identifier,
        role: role
      };
      
      login(userData);

      if (role === 'authority') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    }, 1000);
  };

  return (
    <div className="min-h-[90vh] bg-[#F0F6FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <span className="bg-sky-600 text-white p-2.5 rounded-2xl shadow-xs text-xl inline-block mb-3">🏛️</span>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Portal Authentication
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Access your civic history or municipal control workspace
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-sky-100 py-8 px-6 shadow-xs rounded-3xl sm:px-10">
          
          <div className="flex bg-[#F8FAFC] border border-slate-200 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setRole('citizen')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
                role === 'citizen'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Citizen Access
            </button>
            <button
              type="button"
              onClick={() => setRole('authority')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
                role === 'authority'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Authority / Officer
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {role === 'authority' ? 'Official Staff ID / Email' : 'Registered Email or Phone Number'}
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={role === 'authority' ? 'officer@civica.gov' : 'name@example.com'}
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-sky-600"
              />
            </div>

            {role === 'authority' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Secure Password
                </label>
                <input
                  type="password"
                  required={role === 'authority'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-sky-600"
                />
              </div>
            )}

            {role === 'citizen' && (
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Note: You can file complaints anonymously without logging in. Logging in unlocks your personal <strong>Grievance History</strong> and profile.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 px-4 rounded-xl transition shadow-sm text-xs uppercase tracking-wider"
            >
              {loading ? 'Authenticating...' : `Sign In as ${role === 'authority' ? 'Officer' : 'Citizen'}`}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-slate-100 pt-4">
            <Link to="/" className="text-xs text-sky-600 hover:underline font-medium">
              ← Return to Public Grievance Portal
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default CitizenLogin;