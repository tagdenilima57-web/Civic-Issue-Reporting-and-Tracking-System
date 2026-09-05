import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, Mail, Phone, MapPin, Building2, 
  ShieldCheck, LogOut, CheckCircle2 
} from 'lucide-react';

export function Profile({ setActivePage }) {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <p className="text-slate-500 text-sm">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-blue-700 text-white font-black text-2xl flex items-center justify-center shadow-md">
          {user.first_name ? user.first_name[0] : user.username[0].toUpperCase()}
        </div>
        <div className="text-center sm:text-left space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h1 className="text-xl font-black text-slate-900">
              {user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.username}
            </h1>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              user.role === 'ADMIN' ? 'bg-red-100 text-red-700' : user.role === 'OFFICIAL' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'
            }`}>
              {user.role}
            </span>
          </div>
          <p className="text-xs text-slate-500">Official Municipal Account ID: #{user.id}</p>
          {user.department_details && (
            <p className="text-xs font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded inline-block">
              {user.department_details.name} ({user.department_details.code})
            </p>
          )}
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          Account & Location Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400">Username</span>
            <p className="font-semibold text-slate-800">{user.username}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400">Official Email</span>
            <p className="font-semibold text-slate-800">{user.email}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400">Registered Phone</span>
            <p className="font-semibold text-slate-800">{user.phone_number || 'Not specified'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400">Municipal Ward</span>
            <p className="font-semibold text-slate-800">{user.ward_number || 'Ward 12'}</p>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <span className="text-slate-400">Street Address</span>
            <p className="font-semibold text-slate-800">{user.address || 'Civil Lines Residential Quarter'}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
          <button
            onClick={() => { logout(); setActivePage('home'); }}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out of Account
          </button>
        </div>
      </div>

    </div>
  );
}
