import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { 
  Search, Filter, ShieldCheck, CheckCircle2, UserCheck, 
  ArrowRight, AlertTriangle, Layers, Calendar, RefreshCw, X
} from 'lucide-react';

export function AdminComplaints({ setSelectedComplaintId, setTrackId, setActivePage }) {
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [duplicateOnly, setDuplicateOnly] = useState(false);

  // Triage / Assign modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignDeptId, setAssignDeptId] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [overridePriority, setOverridePriority] = useState('');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter, deptFilter, priorityFilter, duplicateOnly]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (deptFilter !== 'ALL') params.department = deptFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (duplicateOnly) params.duplicates_only = 'true';

      const [complaintsData, deptsData, catsData] = await Promise.all([
        api.getComplaints(params),
        api.getDepartments(),
        api.getCategories(),
      ]);

      setComplaints(complaintsData);
      setDepartments(deptsData);
      setCategories(catsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTriage = (c, e) => {
    e.stopPropagation();
    setSelectedComplaint(c);
    setAssignDeptId(c.department || (c.department_details?.id || ''));
    setNewStatus(c.status);
    setOverridePriority(c.priority);
    setAdminRemarks('');
    setModalOpen(true);
  };

  const handleSaveTriage = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      // If department changed or assigned
      if (assignDeptId && assignDeptId !== selectedComplaint.department) {
        await api.assignComplaint(selectedComplaint.id, assignDeptId, null, adminRemarks || 'Department assigned by Administrator');
      }

      // If status or priority changed
      if (newStatus !== selectedComplaint.status || overridePriority !== selectedComplaint.priority) {
        await api.updateStatus(selectedComplaint.id, newStatus, adminRemarks || 'Administrative triage update', overridePriority);
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to update complaint.');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = complaints.filter((c) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return c.complaint_id.toLowerCase().includes(term) ||
           c.title.toLowerCase().includes(term) ||
           (c.address && c.address.toLowerCase().includes(term));
  });

  const handleView = (c) => {
    setSelectedComplaintId(c.id);
    setTrackId(c.complaint_id);
    setActivePage('complaint-detail');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Complaint Management Registry</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Triage, verify, allocate departments, monitor SLAs, and resolve potential duplicates across all municipal sectors.
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Registry
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          
          {/* Search text */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search Complaint ID, title, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="REPORTED">Reported (Unverified)</option>
              <option value="VERIFIED">Verified</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REOPENED">Reopened</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white font-medium"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white font-medium"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>

        </div>

        {/* Duplicate Toggle */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={duplicateOnly}
              onChange={(e) => setDuplicateOnly(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <span>Show Only Flagged Possible Duplicates</span>
          </label>
          <span className="text-[11px] text-slate-400">
            ({complaints.filter(c => c.is_duplicate_flag).length} flagged in system)
          </span>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Complaint ID</th>
                <th className="py-3 px-4">Grievance Title & Location</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date Filed</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading complaints registry...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No complaints matching filters.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr 
                    key={c.id} 
                    onClick={() => handleView(c)}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      {c.complaint_id}
                      {c.is_duplicate_flag && (
                        <span className="block mt-0.5 text-[9px] font-sans font-bold bg-amber-100 text-amber-800 px-1 py-0.2 rounded w-max">
                          DUP MATCH
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-bold text-slate-900 line-clamp-1">{c.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        📍 {c.address || 'Geo-located'} {c.landmark ? `(${c.landmark})` : ''}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">
                        {c.department_details?.code || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={c.priority} score={c.priority_score} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => handleOpenTriage(c, e)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition mr-1.5"
                      >
                        Triage / Edit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleView(c); }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition"
                      >
                        Inspect &rarr;
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Triage / Edit Modal */}
      {modalOpen && selectedComplaint && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {selectedComplaint.complaint_id}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Administrative Triage & Assignment
                </h3>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTriage} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lifecycle Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white font-medium"
                >
                  <option value="REPORTED">Reported</option>
                  <option value="VERIFIED">Verified (Official Inspection)</option>
                  <option value="ASSIGNED">Assigned to Department</option>
                  <option value="IN_PROGRESS">In Progress (Field Work)</option>
                  <option value="RESOLVED">Resolved (Pending Citizen Confirmation)</option>
                  <option value="CLOSED">Closed</option>
                  <option value="REOPENED">Reopened</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Municipal Department
                </label>
                <select
                  value={assignDeptId}
                  onChange={(e) => setAssignDeptId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white font-medium"
                >
                  <option value="">Select Department...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Override Priority
                </label>
                <select
                  value={overridePriority}
                  onChange={(e) => setOverridePriority(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white font-medium"
                >
                  <option value="CRITICAL">Critical Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Administrative Remarks / Dispatch Order
                </label>
                <textarea
                  rows={3}
                  placeholder="Notes for the department team or reason for status update..."
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {updating ? 'Saving Changes...' : 'Save Triage Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
