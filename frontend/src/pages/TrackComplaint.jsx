import React, { useState } from 'react';
import { ComplaintDetail } from './ComplaintDetail';
import { Search, Building2, ArrowRight, ShieldCheck } from 'lucide-react';

export function TrackComplaint({ trackId, setTrackId, setActivePage }) {
  const [inputVal, setInputVal] = useState(trackId || '');
  const [activeSearchId, setActiveSearchId] = useState(trackId || '');

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      const clean = inputVal.trim().toUpperCase();
      setActiveSearchId(clean);
      setTrackId(clean);
    }
  };

  const handleSampleClick = (id) => {
    setInputVal(id);
    setActiveSearchId(id);
    setTrackId(id);
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            Public Civic Grievance Tracker
          </div>
          <h1 className="text-2xl font-black text-slate-900">Track Complaint Status</h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Enter your unique municipal complaint ID to view real-time lifecycle progress, departmental dispatches, and resolution proof.
          </p>

          <form onSubmit={handleSearch} className="max-w-md mx-auto flex gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="CIV-2026-XXXX"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none uppercase font-mono font-bold"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1 shrink-0"
            >
              Track <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="text-[11px] text-slate-400 pt-1 flex justify-center gap-2 flex-wrap">
            <span>Try sample complaints:</span>
            <button onClick={() => handleSampleClick('CIV-2026-A101')} className="text-blue-700 font-mono font-semibold hover:underline">
              CIV-2026-A101 (In Progress)
            </button>
            <span>&bull;</span>
            <button onClick={() => handleSampleClick('CIV-2026-B204')} className="text-blue-700 font-mono font-semibold hover:underline">
              CIV-2026-B204 (Resolved)
            </button>
            <span>&bull;</span>
            <button onClick={() => handleSampleClick('CIV-2026-C309')} className="text-blue-700 font-mono font-semibold hover:underline">
              CIV-2026-C309 (Closed)
            </button>
          </div>
        </div>
      </div>

      {/* Render Complaint Detail if Search ID provided */}
      {activeSearchId ? (
        <ComplaintDetail
          complaintId={activeSearchId}
          setActivePage={setActivePage}
        />
      ) : (
        <div className="max-w-4xl mx-auto px-4 text-center py-12 text-slate-400 text-xs">
          Enter a Complaint ID above to view the status timeline and evidence.
        </div>
      )}
    </div>
  );
}
