import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { 
  Wrench, CheckCircle2, Clock, MapPin, Upload, 
  Camera, ArrowRight, RefreshCw, X, AlertTriangle 
} from 'lucide-react';

export function OfficialDashboard({ setSelectedComplaintId, setTrackId, setActivePage }) {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Resolve Modal
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [targetComplaint, setTargetComplaint] = useState(null);
  const [actionTaken, setActionTaken] = useState('');
  const [materialUsed, setMaterialUsed] = useState('');
  const [resolutionPhoto, setResolutionPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submittingResolution, setSubmittingResolution] = useState(false);

  useEffect(() => {
    fetchDepartmentQueue();
  }, [statusFilter]);

  const fetchDepartmentQueue = async () => {
    try {
      setLoading(true);
      const params = { department_only: 'true' };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const data = await api.getComplaints(params);
      setComplaints(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWork = async (c, e) => {
    e.stopPropagation();
    try {
      await api.updateStatus(c.id, 'IN_PROGRESS', 'Department field team dispatched on site. Active repair in progress.');
      fetchDepartmentQueue();
    } catch (err) {
      alert(err.message || 'Failed to update progress.');
    }
  };

  const handleOpenResolveModal = (c, e) => {
    e.stopPropagation();
    setTargetComplaint(c);
    setActionTaken('');
    setMaterialUsed('');
    setResolutionPhoto(null);
    setPhotoPreview(null);
    setResolveModalOpen(true);
  };

  const handleResolutionPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResolutionPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitResolution = async (e) => {
    e.preventDefault();
    if (!actionTaken.trim()) {
      alert('Please describe the remedial work taken.');
      return;
    }

    setSubmittingResolution(true);
    try {
      const formData = new FormData();
      formData.append('action_taken', actionTaken.trim());
      formData.append('material_used', materialUsed.trim());
      if (resolutionPhoto) {
        formData.append('resolution_evidence', resolutionPhoto);
      }

      await api.resolveComplaint(targetComplaint.id, formData);
      setResolveModalOpen(false);
      fetchDepartmentQueue();
    } catch (err) {
      alert(err.message || 'Failed to submit resolution.');
    } finally {
      setSubmittingResolution(false);
    }
  };

  const handleView = (c) => {
    setSelectedComplaintId(c.id);
    setTrackId(c.complaint_id);
    setActivePage('complaint-detail');
  };

  const deptName = user?.department_details?.name || 'Department Operations';
  const deptCode = user?.department_details?.code || 'DEPT';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Department Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
              {deptCode} OFFICIAL
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">{deptName}</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Department grievance work queue. Inspect reported issues, execute repairs, and upload resolution proof.
          </p>
        </div>

        <button
          onClick={fetchDepartmentQueue}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Queue
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              statusFilter === st
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {st === 'ALL' ? 'All Assigned Issues' : st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Complaints Queue */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            Loading departmental tasks...
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No pending issues in this queue!</p>
            <p className="text-xs text-slate-400">All tasks in your department have been addressed.</p>
          </div>
        ) : (
          complaints.map((c) => (
            <div
              key={c.id}
              onClick={() => handleView(c)}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {c.complaint_id}
                  </span>
                  <StatusBadge status={c.status} />
                  <PriorityBadge priority={c.priority} score={c.priority_score} />
                  {c.status === 'REOPENED' && (
                    <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded animate-pulse">
                      REOPENED BY CITIZEN
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {c.title}
                </h3>

                <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {c.address || 'Geo-located'} {c.landmark ? `(${c.landmark})` : ''}
                  </span>
                  <span>&bull;</span>
                  <span>Category: <strong>{c.category_details?.name}</strong></span>
                  <span>&bull;</span>
                  <span>Filed: {new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {c.status === 'ASSIGNED' && (
                  <button
                    type="button"
                    onClick={(e) => handleStartWork(c, e)}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    Start On-Site Work
                  </button>
                )}

                {(c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED' || c.status === 'REOPENED') && (
                  <button
                    type="button"
                    onClick={(e) => handleOpenResolveModal(c, e)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Upload Resolution Proof
                  </button>
                )}

                {c.status === 'RESOLVED' && (
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-lg">
                    Awaiting Citizen Verification
                  </span>
                )}

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleView(c); }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Inspect &rarr;
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Upload Resolution Proof */}
      {resolveModalOpen && targetComplaint && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {targetComplaint.complaint_id}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Upload Resolution Evidence & Complete Work
                </h3>
              </div>
              <button 
                onClick={() => setResolveModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitResolution} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Done Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the repair operations executed on-site (e.g. Applied cold-mix asphalt patch and compacted road surface)..."
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Materials / Equipment Used
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 tons bitumen emulsion, plate compactor"
                  value={materialUsed}
                  onChange={(e) => setMaterialUsed(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resolution Photo Proof
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50 hover:border-emerald-500 transition relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleResolutionPhotoChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Resolution Proof"
                      className="max-h-36 mx-auto rounded-lg object-cover"
                    />
                  ) : (
                    <div className="space-y-1">
                      <Camera className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="text-xs font-semibold text-slate-700">Click to attach photo of completed repair</p>
                      <p className="text-[10px] text-slate-400">Citizen will inspect this image to verify resolution</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolveModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResolution}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submittingResolution ? 'Submitting...' : 'Mark as Resolved'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
