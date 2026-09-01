import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function SubmitComplaint() {
  const navigate = useNavigate();
  
  const [category, setCategory] = useState('Roads & Potholes');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [address, setAddress] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: 'Roads & Potholes', label: 'Roads & Potholes', icon: '🛣️' },
    { id: 'Garbage & Sanitation', label: 'Sanitation & Waste', icon: '🗑️' },
    { id: 'Water Supply & Leakage', label: 'Water & Pipelines', icon: '🚰' },
    { id: 'Streetlights & Power', label: 'Power & Grid', icon: '💡' },
    { id: 'Drainage & Sewage', label: 'Drainage Systems', icon: '🌊' },
    { id: 'Illegal Encroachment', label: 'Encroachments', icon: '🚧' },
    { id: 'Public Safety & Hazards', label: 'Safety Hazards', icon: '⚠️' },
    { id: 'Other Civic Issues', label: 'General Civic', icon: '📋' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Grievance successfully filed and dispatched!');
      navigate('/track');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F0F6FA] text-slate-800 selection:bg-sky-200 pb-24">
      
      {/* 🧊 Powder Blue Professional Header Banner */}
      <div className="bg-[#E2EEF5] border-b border-sky-200/80 py-12 px-6 lg:px-16 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-sky-200 text-sky-800 text-xs font-semibold mb-3 tracking-wide uppercase shadow-2xs">
              <span>🏛️ Municipal Redressal System</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-sans font-bold text-slate-900 tracking-tight mb-2">
              Citizen Grievance Portal
            </h1>
            <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
              Submit local infrastructure or public utility issues. Our automated system classifies, prioritizes, and routes your complaint directly to the responsible municipal department.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          
          
        </div>
      </div>

      {/* 📋 Main Workspace Layout (Form + Clean Sidebar) */}
      <div className="max-w-7xl mx-auto px-4 lg:px-16 pt-10">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Form Fields (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Section 1: Categories */}
            <div className="bg-white border border-sky-100 rounded-3xl p-6 lg:p-8 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1 flex justify-between items-center">
                <span>1. Select Grievance Category</span>
                <span className="text-[11px] font-normal text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full">Auto-Sorted</span>
              </h2>
              <p className="text-xs text-slate-500 mb-5">Choose the sector that best describes your issue.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {categories.map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all ${
                      category === cat.id
                        ? 'border-sky-600 bg-sky-600 text-white shadow-md'
                        : 'border-slate-200 bg-[#F8FAFC] hover:bg-sky-50/50 text-slate-700'
                    }`}
                  >
                    <span className="text-2xl mb-1.5">{cat.icon}</span>
                    <span className="text-xs font-medium leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: Title & Description */}
            <div className="bg-white border border-sky-100 rounded-3xl p-6 lg:p-8 shadow-xs space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  2. Grievance Summary Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Deep pothole causing traffic obstruction on Station Road"
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  3. Detailed Description
                </label>
                <textarea
                  rows="4"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide precise details, exact landmarks, severity, and potential hazards..."
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-600 transition resize-none"
                />
              </div>
            </div>

            {/* Section 3: Urgency & Location */}
            <div className="bg-white border border-sky-100 rounded-3xl p-6 lg:p-8 shadow-xs space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  4. Urgency Level Assignment
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { level: 'Low', desc: 'Routine maintenance' },
                    { level: 'Medium', desc: 'Daily commute impact' },
                    { level: 'High', desc: 'Health / safety risk' },
                    { level: 'Critical', desc: 'Emergency hazard' },
                  ].map((item) => (
                    <label
                      key={item.level}
                      onClick={() => setPriority(item.level)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        priority === item.level
                          ? 'border-sky-600 bg-sky-50/70 ring-1 ring-sky-600'
                          : 'border-slate-200 bg-[#F8FAFC] hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="priority"
                          checked={priority === item.level}
                          onChange={() => setPriority(item.level)}
                          className="accent-sky-600"
                        />
                        <span className="font-bold text-xs text-slate-900">{item.level}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1">{item.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                    5. Incident Location & Map Pin
                  </label>
                  <button
                    type="button"
                    className="bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs px-3 py-1.5 rounded-lg font-medium transition border border-sky-200"
                  >
                    📍 Use Current GPS
                  </button>
                </div>
                
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter street, landmark, or area name..."
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-600 mb-3"
                />

                <div className="w-full h-44 rounded-2xl border border-sky-100 bg-[#EFEFF2] flex items-center justify-center text-slate-500 text-xs font-mono">
                  [ GIS Interactive Map Preview ]
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar (1 Column): Contact Info & Submission (No AI diagnostic boxes) */}
          <div className="space-y-6">
            
            <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-xs sticky top-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-4 pb-2 border-b border-slate-100">
                👤 Contact & Submission
              </h3>

              <div className="space-y-4">
                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded accent-sky-600 w-4 h-4"
                  />
                  <span>File grievance anonymously</span>
                </label>

                {!isAnonymous && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Full Name</label>
                      <input
                        type="text"
                        required={!isAnonymous}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g., Rajesh Sharma"
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                      <input
                        type="tel"
                        required={!isAnonymous}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-600"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 px-6 rounded-2xl transition shadow-md text-xs uppercase tracking-wider mt-4"
                >
                  {loading ? 'Submitting...' : 'Submit & Route to Authority'}
                </button>
              </div>

            </div>

          </div>

        </form>
      </div>

    </div>
  );
}