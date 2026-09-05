import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { 
  PlusCircle, AlertTriangle, CheckCircle2, Clock, 
  Search, ArrowRight, ShieldAlert, Sparkles, MapPin 
} from 'lucide-react';

export function CitizenDashboard({ setActivePage, setTrackId, setSelectedComplaintId }) {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const fetchMyComplaints = async () => {
    try {
      setLoading(true);
      const data = await api.getComplaints({ my_complaints: 'true' });
      setComplaints(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const pendingVerification = complaints.filter(c => c.status === 'RESOLVED');
  const inProgress = complaints.filter(c => ['VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED'].includes(c.status));
  const closed = complaints.filter(c => c.status === 'CLOSED');

  const handleViewComplaint = (c) => {
    setSelectedComplaintId(c.id);
    setTrackId(c.complaint_id);
    setActivePage('complaint-detail');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Welcome & Action Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Welcome, {user?.first_name || user?.username}!
            </h1>
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
              {user?.ward_number || 'Ward Citizen'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track and verify the status of public infrastructure grievances you have submitted.
          </p>
        </div>

        <button
          onClick={() => setActivePage('report-issue')}
          className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Report New Problem
        </button>
      </div>

      {/* Verification Attention Alert */}
      {pendingVerification.length > 0 && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">
                Action Required: {pendingVerification.length} Complaint(s) Marked as Resolved!
              </p>
              <p className="text-xs text-emerald-700">
                Authorities have submitted resolution proof. Please review and confirm resolution or reopen the ticket.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleViewComplaint(pendingVerification[0])}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition shrink-0 shadow-sm"
          >
            Review & Verify Now &rarr;
          </button>
        </div>
      )}

      {/* Citizen Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Total Reported</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{complaints.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-amber-600">Active / In Progress</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{inProgress.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-emerald-600">Awaiting Verification</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{pendingVerification.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Closed & Verified</p>
          <p className="text-2xl font-black text-slate-700 mt-1">{closed.length}</p>
        </div>
      </div>

      {/* Complaints List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Reported Issues</h2>
            <p className="text-xs text-slate-500">Live progress tracking and municipal department routing</p>
          </div>
          <button
            onClick={() => setActivePage('my-complaints')}
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            View Full History &rarr;
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading your grievances...</div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto flex items-center justify-center text-slate-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No civic grievances filed yet.</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">Help improve your neighborhood by reporting damaged roads, broken streetlights, or waste accumulation.</p>
            <button
              onClick={() => setActivePage('report-issue')}
              className="mt-2 px-4 py-2 bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              File First Report
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {complaints.map((c) => (
              <div 
                key={c.id} 
                onClick={() => handleViewComplaint(c)}
                className="p-5 hover:bg-slate-50/80 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {c.complaint_id}
                    </span>
                    <StatusBadge status={c.status} />
                    <PriorityBadge priority={c.priority} />
                    {c.is_duplicate_flag && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                        Possible Duplicate
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {c.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {c.address || 'Geo-located'}
                    </span>
                    <span>&bull;</span>
                    <span>Dept: <strong>{c.department_details?.code || 'Pending'}</strong></span>
                    <span>&bull;</span>
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {c.status === 'RESOLVED' ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">
                      Ready to Verify &rarr;
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                      Track <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
