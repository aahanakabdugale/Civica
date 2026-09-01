import React, { useState } from 'react';

export function TrackComplaint() {
  const [searchId, setSearchId] = useState('');
  const [complaintData, setComplaintData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await fetch(`http://localhost:8000/api/v1/complaints/${searchId.trim()}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Complaint ID not found in database.');
        }
        throw new Error('Failed to fetch tracking details from server.');
      }

      const data = await response.json();
      setComplaintData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching complaint status:', err);
      setError(err.message || 'Could not retrieve tracking details. Check the ID and try again.');
      setComplaintData(null);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F6FA] text-slate-800 pb-20">
      
      <div className="bg-[#E2EEF5] border-b border-sky-200/80 py-12 px-6 text-center">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
          Track Grievance Status
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
          Enter your unique Complaint ID to check real-time progress, assigned department, and resolution timeline from the database.
        </p>

        <form onSubmit={handleSearch} className="mt-6 max-w-xl mx-auto flex gap-3">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Enter Complaint ID (e.g., CIV-1002)..."
            className="flex-1 bg-white border border-sky-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-600 shadow-2xs"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition shadow-sm"
          >
            {loading ? 'Searching...' : 'Search Status'}
          </button>
        </form>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-10">
        
        {loading && (
          <div className="text-center py-16 text-slate-500 text-sm font-medium">
            Querying MongoDB database for complaint records...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center text-xs font-semibold shadow-2xs">
            {error}
          </div>
        )}

        {!loading && !error && searched && !complaintData && (
          <div className="bg-white border border-sky-100 p-8 rounded-3xl text-center text-slate-500 text-xs shadow-2xs">
            No record matched this ID. Please verify your Complaint ID and search again.
          </div>
        )}

        {!loading && complaintData && (
          <div className="bg-white border border-sky-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-2">
              <div className="flex items-center space-x-3">
                <span className="font-mono font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-lg border border-sky-200 text-xs">
                  {complaintData.id || complaintData._id}
                </span>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  complaintData.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {complaintData.status || 'In Progress'}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Filed On: {complaintData.date || complaintData.created_at || 'Recent'}
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">
                {complaintData.title || complaintData.description}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {complaintData.details || complaintData.description || 'No additional description provided.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#F8FAFC] p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block mb-1 uppercase tracking-wider text-[10px]">Assigned Department</span>
                <span className="font-bold text-slate-800">{complaintData.department || 'General Municipal Maintenance'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 uppercase tracking-wider text-[10px]">Location</span>
                <span className="font-bold text-slate-800">{complaintData.location || complaintData.address || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 uppercase tracking-wider text-[10px]">Filed By</span>
                <span className="font-bold text-slate-800">{complaintData.fullName || complaintData.submitted_by || 'Anonymous Citizen'}</span>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}