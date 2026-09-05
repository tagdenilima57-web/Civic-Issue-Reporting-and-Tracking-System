import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { Search, Filter, MapPin, Calendar, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';

export function MyComplaints({ setActivePage, setTrackId, setSelectedComplaintId }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = { my_complaints: 'true' };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const data = await api.getComplaints(params);
      setComplaints(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const filtered = complaints.filter(c => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return c.complaint_id.toLowerCase().includes(term) ||
           c.title.toLowerCase().includes(term) ||
           (c.address && c.address.toLowerCase().includes(term));
  });

  const handleSelect = (c) => {
    setSelectedComplaintId(c.id);
    setTrackId(c.complaint_id);
    setActivePage('complaint-detail');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">My Grievances & Complaints</h1>
          <p className="text-xs sm:text-sm text-slate-500">Track resolution progress, inspect evidence, and verify municipal repairs.</p>
        </div>
        <button
          onClick={() => setActivePage('report-issue')}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition"
        >
          + File New Complaint
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by ID, title, or street..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'REPORTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Complaints' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            Loading grievances...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No complaints matching your criteria.</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => handleSelect(c)}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {c.complaint_id}
                  </span>
                  <StatusBadge status={c.status} />
                  <PriorityBadge priority={c.priority} />
                  {c.is_duplicate_flag && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      Possible Duplicate Flagged
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {c.title}
                </h3>

                <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {c.address || 'Geo-located'}
                  </span>
                  <span>&bull;</span>
                  <span>Department: <strong>{c.department_details?.name || 'Assigned'}</strong></span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                {c.status === 'RESOLVED' && (
                  <span className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm animate-bounce">
                    Verify Resolution &rarr;
                  </span>
                )}
                <span className="text-xs font-bold text-blue-700 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                  Inspect Timeline &rarr;
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
