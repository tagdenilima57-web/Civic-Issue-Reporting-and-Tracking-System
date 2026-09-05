import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, Wrench, ShieldCheck, Archive, RefreshCw, Flame } from 'lucide-react';

export function StatusBadge({ status, size = 'sm' }) {
  const sizeClasses = size === 'lg' ? 'px-3 py-1 text-sm font-semibold' : 'px-2.5 py-0.5 text-xs font-medium';

  switch (status) {
    case 'REPORTED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 text-purple-700 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5" />
          Reported
        </span>
      );
    case 'VERIFIED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          Verified
        </span>
      );
    case 'ASSIGNED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 ${sizeClasses}`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          Assigned
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-800 animate-pulse ${sizeClasses}`}>
          <Wrench className="w-3.5 h-3.5" />
          In Progress
        </span>
      );
    case 'RESOLVED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          Resolved
        </span>
      );
    case 'CLOSED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 text-slate-700 ${sizeClasses}`}>
          <Archive className="w-3.5 h-3.5" />
          Closed
        </span>
      );
    case 'REOPENED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 text-rose-700 ${sizeClasses}`}>
          <RefreshCw className="w-3.5 h-3.5" />
          Reopened
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
}

export function PriorityBadge({ priority, score, size = 'sm' }) {
  const sizeClasses = size === 'lg' ? 'px-3 py-1 text-sm font-semibold' : 'px-2.5 py-0.5 text-xs font-medium';

  switch (priority) {
    case 'CRITICAL':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-red-100 text-red-800 ${sizeClasses}`}>
          <Flame className="w-3.5 h-3.5 text-red-600" />
          Critical Priority {score ? `(${score})` : ''}
        </span>
      );
    case 'HIGH':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md border border-orange-300 bg-orange-50 text-orange-800 ${sizeClasses}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
          High Priority {score ? `(${score})` : ''}
        </span>
      );
    case 'MEDIUM':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 text-amber-800 ${sizeClasses}`}>
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          Medium Priority {score ? `(${score})` : ''}
        </span>
      );
    case 'LOW':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 text-slate-700 ${sizeClasses}`}>
          Low Priority {score ? `(${score})` : ''}
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 text-slate-600 ${sizeClasses}`}>
          {priority}
        </span>
      );
  }
}
