import React from 'react';
import { useAuth } from '../context/AuthContext';

export function UserProfile() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F0F6FA] py-10 px-6 lg:px-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Citizen Profile</h1>
        <p className="text-xs text-slate-500 mb-6">Your personal account information linked with MongoDB.</p>

        <div className="bg-white border border-sky-100 rounded-3xl p-8 shadow-xs space-y-6">
          <div className="flex items-center space-x-4 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'RS'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user?.name || 'Rajesh Sharma'}</h2>
              <p className="text-xs text-slate-500">{user?.phone || '+91 98765 43210'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-200">
              <span className="text-slate-400 block mb-1 uppercase tracking-wider text-[10px]">Account Type</span>
              <span className="font-bold text-slate-800">Verified Citizen</span>
            </div>
            <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-200">
              <span className="text-slate-400 block mb-1 uppercase tracking-wider text-[10px]">Database ID (MongoDB)</span>
              <span className="font-bold font-mono text-slate-800">{user?.id || '684f9a2b1c...'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}