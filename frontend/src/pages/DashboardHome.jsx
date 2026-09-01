import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function DashboardHome() {
  const [selectedDept, setSelectedDept] = useState('All complaints');
  const [searchQuery, setSearchQuery] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const departments = [
    { name: 'All complaints' },
    { name: 'Roads & Infrastructure' },
    { name: 'Water Supply' },
    { name: 'Sanitation & Waste' },
    { name: 'Electricity' },
    { name: 'Public Safety' },
    { name: 'Parks & Environment' },
  ];

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/v1/complaints');
        
        if (!response.ok) {
          throw new Error('Failed to fetch complaints from database');
        }
        
        const data = await response.json();
        
        // Correctly extracts the array from your backend's pagination structure { items: [...] }
        const results = Array.isArray(data) 
          ? data 
          : (data.items || data.complaints || data.data || []);
          
        setComplaints(results);
        setLoading(false);
      } catch (err) {
        console.error('Error connecting to backend:', err);
        setError('Could not load live data from database. Ensure FastAPI backend is running.');
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

    
  // Safe check: ensures complaints is always an array to prevent .filter crashes
  const safeComplaints = Array.isArray(complaints) ? complaints : [];

  const filteredComplaints = safeComplaints.filter((item) => {
    const matchesDept = selectedDept === 'All complaints' || item.department === selectedDept || item.dept === selectedDept;
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      <aside className="w-72 bg-white border-r border-slate-200 hidden md:block p-6 space-y-6">
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Departments</h3>
          <div className="space-y-1">
            {departments.map((dept) => (
              <button
                key={dept.name}
                onClick={() => setSelectedDept(dept.name)}
                className={`w-full flex justify-between items-center px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  selectedDept === dept.name
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{dept.name}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-8 overflow-x-auto">
        
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-2xs flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="w-full md:w-96">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search database by ID, keyword, location..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-600"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold">
            <span className="text-slate-400">Database Status:</span>
            <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg border border-emerald-200">MongoDB Connected</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {selectedDept} <span className="text-red-600 font-mono">({filteredComplaints.length})</span>
            </h2>
            <span className="text-xs text-slate-400">Live feed from database</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 font-medium">
              Fetching records from MongoDB database...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-xs text-red-600 font-medium">
              {error}
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 font-medium">
              No records found in this category.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Complaint Description</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredComplaints.map((item) => (
                    <tr key={item.id || item._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-red-600">
                        <Link to={`/admin/complaint/${item.id || item._id}`} className="hover:underline">
                          {item.id || item._id}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 max-w-xs truncate">{item.title || item.description}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">{item.department || item.dept}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                          item.priority === 'Critical' ? 'bg-red-100 text-red-700 border border-red-200' :
                          item.priority === 'High' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {item.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium ${
                          item.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          item.status === 'In Progress' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {item.status || 'Open'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{item.location || item.address}</td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{item.date || item.created_at || 'Just now'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

    </div>
  );
}

export { DashboardHome };