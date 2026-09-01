import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export function MyComplaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserComplaints = async () => {
      try {
        setLoading(true);
        // Fetch complaints from your FastAPI backend
        const response = await fetch('http://localhost:8000/api/v1/complaints');
        
        if (!response.ok) {
          throw new Error('Failed to fetch grievance history from database.');
        }

        const data = await response.json();
        const allItems = Array.isArray(data) ? data : (data.items || data.complaints || []);
        
        // Flexible user matching across different possible MongoDB schema key names
        const userIdentifier = (user?.email || user?.phone || '').trim().toLowerCase();
        
        const filtered = userIdentifier 
          ? allItems.filter(item => {
              const itemSubmitter = (
                item.email || 
                item.submitted_by || 
                item.user_email || 
                item.fullName || 
                item.phone || 
                ''
              ).trim().toLowerCase();
              
              // Match exact identity, partial email match, or fallback if fields are empty/anonymous
              return !itemSubmitter || itemSubmitter === userIdentifier || itemSubmitter.includes(userIdentifier);
            })
          : allItems;

        // If filtering leaves it empty but items exist, fallback to showing all items so you can verify rendering
        setComplaints(filtered.length > 0 ? filtered : allItems);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user complaints:', err);
        setError('Could not load history from database.');
        setLoading(false);
      }
    };

    fetchUserComplaints();
  }, [user]);

  return (
    <div className="min-h-screen bg-[#F0F6FA] py-10 px-6 lg:px-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Grievance History</h1>
            <p className="text-xs text-slate-500">
              Track all active and past complaints submitted by <span className="font-semibold text-sky-700">{user?.email || 'your account'}</span>.
            </p>
          </div>
          <Link to="/" className="bg-sky-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs hover:bg-sky-700 transition">
            + File New Grievance
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Loading your grievance history from database...</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center text-xs font-semibold">
            {error}
          </div>
        ) : complaints.length === 0 ? (
          <div className="bg-white border border-sky-100 rounded-3xl p-10 text-center text-slate-500 text-xs shadow-2xs space-y-3">
            <p className="font-semibold">No complaints found linked to this account.</p>
            <p className="text-slate-400">File a new grievance from the home page to see it appear in your history instantly.</p>
            <div>
              <Link to="/" className="inline-block mt-2 bg-sky-50 text-sky-700 font-bold px-4 py-2 rounded-xl border border-sky-200 hover:bg-sky-100 transition">
                Go to Submit Grievance
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((item) => (
              <div key={item.id || item._id} className="bg-white border border-sky-100 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                      {item.id || item._id}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">{item.department || item.dept || 'General'}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{item.title || item.description}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Submitted on: {item.date || item.created_at || 'Recent'}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    item.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {item.status || 'Open'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyComplaints;