import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  Building2, Phone, Mail, Users, Layers, 
  CheckCircle2, Plus, ShieldCheck, RefreshCw 
} from 'lucide-react';

export function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await api.getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-700" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Municipal Departments Directory</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official departmental authorities, designated contact lines, and staff allocation for grievance redressal.
          </p>
        </div>

        <button
          onClick={fetchDepartments}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            Loading departments directory...
          </div>
        ) : (
          departments.map((d) => (
            <div
              key={d.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    CODE: {d.code}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    ACTIVE
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {d.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {d.description || 'Specialized civic maintenance operations authority.'}
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{d.contact_phone || 'Emergency Control: 1800-425-3333'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{d.contact_email || `${d.code.toLowerCase()}@civicpulse.gov`}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl grid grid-cols-2 gap-2 text-center text-xs border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Active Workload</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {d.open_complaints_count !== undefined ? d.open_complaints_count : 2}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Staff Assigned</span>
                  <span className="font-bold text-blue-700 text-sm">
                    {d.official_count !== undefined ? d.official_count : 3}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
