import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, CheckCircle2, Clock, ShieldCheck, 
  AlertTriangle, RefreshCw, Check, ArrowRight 
} from 'lucide-react';

export function Notifications({ setSelectedComplaintId, setTrackId, setActivePage }) {
  const { refreshNotifications } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (n) => {
    if (n.complaint) {
      setSelectedComplaintId(n.complaint);
      setTrackId(n.complaint_identifier);
      setActivePage('complaint-detail');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-700" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Notifications & Alerts</h1>
            {unreadCount > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time status changes, department dispatches, and resolution verification requests.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Bell className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No notifications in your inbox.</p>
            <p className="text-xs text-slate-400">You will receive updates when complaints change status or require verification.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 sm:p-5 transition cursor-pointer flex items-start justify-between gap-4 ${
                !n.is_read ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  !n.is_read ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-xs sm:text-sm ${!n.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                      {n.title}
                    </h3>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-center">
                {!n.is_read && (
                  <button
                    type="button"
                    onClick={(e) => handleMarkAsRead(n.id, e)}
                    className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-white rounded-lg transition"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                {n.complaint && (
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
