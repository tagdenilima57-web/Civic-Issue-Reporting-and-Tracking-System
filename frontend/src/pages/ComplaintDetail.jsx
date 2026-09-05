import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { TimelineStepper } from '../components/TimelineStepper';
import { LeafletMap } from '../components/LeafletMap';
import { 
  Building2, MapPin, Calendar, CheckCircle2, AlertTriangle, 
  Star, RefreshCw, MessageSquare, ShieldCheck, ArrowLeft,
  FileCheck, Clock, UserCheck, ThumbsUp
} from 'lucide-react';

export function ComplaintDetail({ complaintId, selectedId, setActivePage }) {
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Resolution verification modals/actions
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchComplaint();
  }, [complaintId, selectedId]);

  const fetchComplaint = async () => {
    try {
      setLoading(true);
      setError('');
      let data;
      if (selectedId) {
        data = await api.getComplaintById(selectedId);
      } else if (complaintId) {
        data = await api.trackComplaint(complaintId);
      } else {
        throw new Error('No complaint identifier specified.');
      }
      setComplaint(data);
    } catch (err) {
      setError(err.message || 'Unable to load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmResolution = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const updated = await api.verifyResolution(complaint.id, 'CONFIRM', {
        rating: rating,
        comment: feedbackComment,
      });
      setComplaint(updated);
      setShowVerifyModal(false);
    } catch (err) {
      alert(err.message || 'Failed to submit verification.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopenComplaint = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim()) {
      alert('Please specify why the issue is not resolved.');
      return;
    }
    setActionLoading(true);
    try {
      const updated = await api.verifyResolution(complaint.id, 'REOPEN', {
        reason: reopenReason.trim(),
      });
      setComplaint(updated);
      setShowReopenModal(false);
    } catch (err) {
      alert(err.message || 'Failed to reopen complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
        <p className="text-sm font-semibold">Retrieving official complaint record...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Complaint Record Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'Please verify the Complaint ID and try again.'}</p>
        <button
          onClick={() => setActivePage('track')}
          className="px-4 py-2 bg-blue-700 text-white text-xs font-bold rounded-lg"
        >
          &larr; Return to Tracking Search
        </button>
      </div>
    );
  }

  const initialMedia = complaint.media?.filter(m => !m.is_resolution_evidence) || [];
  const resolutionMedia = complaint.media?.filter(m => m.is_resolution_evidence) || [];
  const canCitizenVerify = complaint.status === 'RESOLVED';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Back button & Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <button
          onClick={() => setActivePage(user ? (user.role === 'CITIZEN' ? 'my-complaints' : 'admin-complaints') : 'home')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to List
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-black text-blue-800 bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200">
            {complaint.complaint_id}
          </span>
          <StatusBadge status={complaint.status} size="lg" />
          <PriorityBadge priority={complaint.priority} score={complaint.priority_score} size="lg" />
        </div>
      </div>

      {/* Main Complaint Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
            <span>{complaint.category_details?.name}</span>
            <span>&bull;</span>
            <span>{complaint.department_details?.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
            {complaint.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
            {complaint.description}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block">Reported By</span>
            <span className="font-semibold text-slate-800">{complaint.citizen_details?.first_name || 'Citizen'}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Assigned Dept</span>
            <span className="font-semibold text-slate-800">{complaint.department_details?.code || 'Pending'}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Date Filed</span>
            <span className="font-semibold text-slate-800">{new Date(complaint.created_at).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Resolution Target</span>
            <span className="font-semibold text-slate-800">{complaint.category_details?.sla_hours || 48}h SLA</span>
          </div>
        </div>
      </div>

      {/* Visual Lifecycle Stepper Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-700" />
          Complaint Lifecycle Progress
        </h2>
        <TimelineStepper status={complaint.status} statusHistory={complaint.status_history || []} />
      </div>

      {/* CITIZEN RESOLUTION VERIFICATION PANEL (If status is RESOLVED) */}
      {canCitizenVerify && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 p-6 rounded-2xl shadow-md space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-emerald-950">
                  Municipal Action Completed: Please Verify Resolution!
                </h3>
                <p className="text-xs text-emerald-800 mt-0.5">
                  The department official has inspected the site and uploaded evidence of repair. Please inspect and confirm whether the problem is fixed.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => setShowVerifyModal(true)}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-2"
            >
              <ThumbsUp className="w-4 h-4" />
              Confirm Resolution & Rate Service
            </button>

            <button
              onClick={() => setShowReopenModal(true)}
              className="px-5 py-2.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-rose-600" />
              Issue Not Resolved (Reopen Ticket)
            </button>
          </div>
        </div>
      )}

      {/* Citizen Feedback Showcase (If already Closed with Feedback) */}
      {complaint.feedback && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              Citizen Satisfaction & Feedback
            </h3>
            <div className="flex items-center gap-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-4 h-4 ${s <= complaint.feedback.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`} />
              ))}
              <span className="text-xs font-bold text-slate-700 ml-1.5">{complaint.feedback.rating} / 5</span>
            </div>
          </div>
          {complaint.feedback.comment && (
            <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
              "{complaint.feedback.comment}"
            </p>
          )}
        </div>
      )}

      {/* Evidence & Official Resolution Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Citizen Initial Evidence */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            Citizen Initial Evidence Photo
          </h3>

          {initialMedia.length > 0 ? (
            <div className="space-y-2">
              <img
                src={initialMedia[0].file_url || initialMedia[0].file}
                alt="Initial Grievance"
                className="w-full h-56 rounded-xl object-cover border border-slate-200"
              />
              <p className="text-[11px] text-slate-400">Uploaded at time of grievance submission</p>
            </div>
          ) : (
            <div className="w-full h-48 rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">
              No photo uploaded with initial report
            </div>
          )}
        </div>

        {/* Official Resolution Proof */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Official Resolution Evidence & Remarks
          </h3>

          {complaint.resolution_record ? (
            <div className="space-y-3">
              {complaint.resolution_record.resolution_photo_url && (
                <img
                  src={complaint.resolution_record.resolution_photo_url}
                  alt="Resolution Evidence"
                  className="w-full h-56 rounded-xl object-cover border border-emerald-200"
                />
              )}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1">
                <p className="font-bold text-emerald-900">Work Performed:</p>
                <p className="text-emerald-800">{complaint.resolution_record.action_taken}</p>
                {complaint.resolution_record.material_used && (
                  <p className="text-[11px] text-emerald-700 pt-1">
                    <strong>Materials:</strong> {complaint.resolution_record.material_used}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-48 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-xs text-slate-400 p-4 text-center">
              <Clock className="w-6 h-6 text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600">Pending Field Resolution</p>
              <p className="text-[11px] text-slate-400 mt-1">Official proof and remarks will appear here once the work is marked completed by the department team.</p>
            </div>
          )}
        </div>

      </div>

      {/* Location GIS Map */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-700" />
            Geographical GIS Location
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {complaint.latitude}, {complaint.longitude}
          </span>
        </div>
        <div className="h-64 rounded-xl overflow-hidden">
          <LeafletMap
            center={[Number(complaint.latitude), Number(complaint.longitude)]}
            zoom={15}
            markers={[complaint]}
            height="100%"
          />
        </div>
        <p className="text-xs text-slate-600">
          📍 <strong>Address:</strong> {complaint.address || 'Address logged at GPS coordinates'} {complaint.landmark ? `(Landmark: ${complaint.landmark})` : ''}
        </p>
      </div>

      {/* Audit History Log */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-slate-700" />
          Official Status & Assignment Log
        </h3>
        <div className="space-y-2">
          {complaint.status_history?.map((h) => (
            <div key={h.id} className="p-3 bg-slate-50 rounded-xl text-xs flex items-start justify-between gap-4 border border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{h.to_status}</span>
                  <span className="text-[11px] text-slate-500">by {h.changed_by_name || 'System'} ({h.changed_by_role || 'Authority'})</span>
                </div>
                {h.remarks && <p className="text-slate-600 mt-1 italic">"{h.remarks}"</p>}
              </div>
              <span className="text-[11px] text-slate-400 shrink-0">
                {new Date(h.changed_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Confirm Resolution & Feedback */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-lg text-slate-900">Confirm Resolution & Rate</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              By confirming, you acknowledge that municipal personnel have satisfactorily resolved the issue. Your feedback ensures service accountability.
            </p>

            <form onSubmit={handleConfirmResolution} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Rating (1 to 5 Stars)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-7 h-7 ${star <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Written Feedback / Appreciation
                </label>
                <textarea
                  rows={3}
                  placeholder="Share details regarding the quality and speed of the repair..."
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? 'Closing Case...' : 'Confirm & Close Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reopen Complaint */}
      {showReopenModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-fade-in">
            <div className="flex items-center gap-2 text-rose-700 font-bold">
              <RefreshCw className="w-6 h-6" />
              <h3 className="text-lg text-slate-900">Reopen Grievance</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              If the repair was substandard, incomplete, or broken again, you may reopen the complaint. Priority will automatically be escalated.
            </p>

            <form onSubmit={handleReopenComplaint} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Reopening <span className="text-rose-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why the problem is still not resolved..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-600 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? 'Reopening Case...' : 'Reopen Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
