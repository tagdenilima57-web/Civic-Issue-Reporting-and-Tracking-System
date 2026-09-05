import React from 'react';
import { Check, Clock, ShieldCheck, Wrench, CheckCircle2, Archive, RefreshCw } from 'lucide-react';

export function TimelineStepper({ status, statusHistory = [] }) {
  const steps = [
    { key: 'REPORTED', label: 'Reported', icon: Clock, desc: 'Citizen submitted problem' },
    { key: 'VERIFIED', label: 'Verified', icon: Check, desc: 'Authority inspection confirmed' },
    { key: 'ASSIGNED', label: 'Assigned', icon: ShieldCheck, desc: 'Allocated to municipal dept' },
    { key: 'IN_PROGRESS', label: 'In Progress', icon: Wrench, desc: 'Field crew operating on site' },
    { key: 'RESOLVED', label: 'Resolved', icon: CheckCircle2, desc: 'Official uploaded resolution proof' },
    { key: 'CLOSED', label: 'Closed', icon: Archive, desc: 'Citizen confirmed & rated' },
  ];

  const statusOrder = ['REPORTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  const currentIndex = status === 'REOPENED' ? 3 : statusOrder.indexOf(status);

  // Map history events to step keys for timestamps
  const historyMap = {};
  statusHistory.forEach(h => {
    historyMap[h.to_status] = h;
  });

  return (
    <div className="w-full py-4">
      {status === 'REOPENED' && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm">
          <RefreshCw className="w-4 h-4 text-rose-600 animate-spin" />
          <span>
            <strong>Complaint Reopened:</strong> The citizen indicated the resolution was incomplete. Priority has been escalated and the case is back under active rectification.
          </span>
        </div>
      )}

      {/* Horizontal Stepper for md+ screens */}
      <div className="hidden md:flex items-center justify-between relative">
        <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-slate-200 -z-0" />
        <div 
          className="absolute top-1/2 left-6 -translate-y-1/2 h-1 bg-blue-600 transition-all duration-500 -z-0"
          style={{ width: `${Math.max(0, Math.min(100, (currentIndex / (steps.length - 1)) * 100))}%` }}
        />

        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isPassed = idx <= currentIndex;
          const isCurrent = idx === currentIndex && status !== 'CLOSED';
          const historyEntry = historyMap[step.key];

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 shadow-sm ${
                  isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : isPassed
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="mt-2 text-center max-w-[110px]">
                <p className={`text-xs font-semibold ${isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                  {step.label}
                </p>
                {historyEntry && (
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {new Date(historyEntry.changed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Vertical Stepper for Mobile */}
      <div className="md:hidden space-y-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isPassed = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const historyEntry = historyMap[step.key];

          return (
            <div key={step.key} className="flex items-start gap-3">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  isCurrent
                    ? 'bg-blue-600 text-white ring-2 ring-blue-100'
                    : isPassed
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 pb-2">
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-semibold ${isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                  {historyEntry && (
                    <span className="text-xs text-slate-400">
                      {new Date(historyEntry.changed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{step.desc}</p>
                {historyEntry?.remarks && (
                  <p className="text-xs text-slate-600 italic mt-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                    "{historyEntry.remarks}"
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
