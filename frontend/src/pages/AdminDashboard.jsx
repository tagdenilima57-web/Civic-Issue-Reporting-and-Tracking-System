import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { 
  Building2, Layers, CheckCircle2, Clock, Flame, 
  AlertTriangle, Users, Star, ArrowRight, BarChart3, 
  RefreshCw, ShieldAlert, Sparkles, MapPin 
} from 'lucide-react';

export function AdminDashboard({ setActivePage, setSelectedComplaintId, setTrackId }) {
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, complaintsData] = await Promise.all([
        api.getDashboardStats(),
        api.getComplaints({ ordering: '-created_at' })
      ]);
      setStats(statsData);
      setRecentComplaints(complaintsData.slice(0, 6));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInspect = (c) => {
    setSelectedComplaintId(c.id);
    setTrackId(c.complaint_id);
    setActivePage('complaint-detail');
  };

  if (loading || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
        <p className="text-xs font-semibold">Aggregating municipal telemetry and GIS metrics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Municipal Command & Analytics</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time grievance telemetry, departmental workloads, and civic service level agreements.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActivePage('admin-complaints')}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            Manage Complaints &rarr;
          </button>
          <button
            onClick={() => setActivePage('gis-map')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5" />
            GIS Heatmap
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500">Total Grievances</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.total_complaints}</p>
          <span className="text-[10px] text-blue-600 font-medium">All municipal wards</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-purple-600">Pending Triage</span>
          <p className="text-2xl font-black text-purple-700 mt-1">{stats.pending_complaints}</p>
          <span className="text-[10px] text-purple-500 font-medium">Reported & Unverified</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-amber-600">Active Work</span>
          <p className="text-2xl font-black text-amber-700 mt-1">{stats.in_progress_complaints}</p>
          <span className="text-[10px] text-amber-500 font-medium">Field teams on site</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-emerald-600">Resolved</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{stats.resolved_complaints}</p>
          <span className="text-[10px] text-emerald-500 font-medium">Verified by citizens</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-rose-600">Reopened</span>
          <p className="text-2xl font-black text-rose-700 mt-1">{stats.reopened_complaints}</p>
          <span className="text-[10px] text-rose-500 font-medium">Escalated priority</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-blue-600">Satisfaction</span>
          <p className="text-2xl font-black text-blue-700 mt-1">{stats.satisfaction_rate}%</p>
          <span className="text-[10px] text-slate-500 font-medium">{stats.average_rating} / 5.0 Avg Rating</span>
        </div>
      </div>

      {/* Priority & Category Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Priority Matrix */}
        <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-600" />
              Priority Distribution Matrix
            </h2>
            <span className="text-[10px] text-slate-400 font-medium">Multi-factor Scoring</span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Critical Priority', count: stats.priority_distribution?.CRITICAL || 0, color: 'bg-red-600', textColor: 'text-red-700', bg: 'bg-red-50' },
              { label: 'High Priority', count: stats.priority_distribution?.HIGH || 0, color: 'bg-orange-500', textColor: 'text-orange-700', bg: 'bg-orange-50' },
              { label: 'Medium Priority', count: stats.priority_distribution?.MEDIUM || 0, color: 'bg-amber-400', textColor: 'text-amber-700', bg: 'bg-amber-50' },
              { label: 'Low Priority', count: stats.priority_distribution?.LOW || 0, color: 'bg-slate-400', textColor: 'text-slate-700', bg: 'bg-slate-100' },
            ].map((p, idx) => {
              const total = stats.total_complaints || 1;
              const pct = Math.round((p.count / total) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className={p.textColor}>{p.label}</span>
                    <span className="text-slate-700">{p.count} issues ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className={`${p.color} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            Priority values are calculated transparently using hazard criticality, location sensitivity, and elapsed age without unverified AI black-box claims.
          </p>
        </div>

        {/* 7-Day Resolution Trends */}
        <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-700" />
              7-Day Inflow vs. Resolution Trend
            </h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-slate-600"><span className="w-2.5 h-2.5 rounded bg-blue-600"></span> Reported</span>
              <span className="flex items-center gap-1 text-slate-600"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Resolved</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 pt-4 items-end h-48 border-b border-slate-100 pb-2">
            {stats.trend_7_days?.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1 h-36">
                  {/* Reported bar */}
                  <div 
                    className="w-3 bg-blue-600 rounded-t transition-all"
                    style={{ height: `${Math.max(12, (day.reported || 1) * 32)}px` }}
                    title={`Reported: ${day.reported}`}
                  />
                  {/* Resolved bar */}
                  <div 
                    className="w-3 bg-emerald-500 rounded-t transition-all"
                    style={{ height: `${Math.max(12, (day.resolved || 0) * 32)}px` }}
                    title={`Resolved: ${day.resolved}`}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-medium">{day.date}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-xs text-slate-500 pt-1">
            <span>Average Municipal Daily Resolution: <strong>92.4%</strong></span>
            <span>Target SLA Compliance: <strong>95%</strong></span>
          </div>
        </div>

      </div>

      {/* Department Performance Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Department Workload & Turnaround Performance</h2>
            <p className="text-xs text-slate-500">Active grievance allocation and resolution ratios across municipal authorities</p>
          </div>
          <button
            onClick={() => setActivePage('department-management')}
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            Manage Departments & Staff &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Department Name</th>
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Total Assigned</th>
                <th className="py-2.5 px-3">Pending / In Progress</th>
                <th className="py-2.5 px-3">Resolved</th>
                <th className="py-2.5 px-3">Resolution Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.department_distribution?.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3 font-bold text-slate-900">{dept.name}</td>
                  <td className="py-3 px-3 font-mono font-semibold text-blue-700">{dept.code}</td>
                  <td className="py-3 px-3 font-semibold">{dept.total}</td>
                  <td className="py-3 px-3 text-amber-700 font-semibold">{dept.pending}</td>
                  <td className="py-3 px-3 text-emerald-700 font-semibold">{dept.resolved}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${dept.resolution_rate}%` }} />
                      </div>
                      <span className="font-bold text-slate-700">{dept.resolution_rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Triage & Recent Grievances Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Complaints Queue</h2>
            <p className="text-xs text-slate-500">Fast triage, verification, and department assignment</p>
          </div>
          <button
            onClick={() => setActivePage('admin-complaints')}
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            View All Complaints Table &rarr;
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentComplaints.map((c) => (
            <div
              key={c.id}
              onClick={() => handleInspect(c)}
              className="p-4 hover:bg-slate-50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 flex-1">
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
                <h3 className="text-sm font-bold text-slate-900">{c.title}</h3>
                <p className="text-xs text-slate-500">
                  📍 {c.address || 'Geo-located'} &bull; Category: {c.category_details?.name} &bull; Dept: {c.department_details?.code || 'Pending'}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleInspect(c); }}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition"
                >
                  Triage / Assign &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
