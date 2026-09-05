import React from 'react';
import { Building2, Phone, Mail, MapPin, ShieldCheck } from 'lucide-react';

export function Footer({ setActivePage }) {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Purpose */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <div className="w-7 h-7 rounded-lg bg-blue-700 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-bold text-base tracking-tight">CIVIC<span className="text-blue-400">PULSE</span></span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              An intelligent, transparent civic complaint management ecosystem empowering citizens and municipal departments to collaboratively resolve public infrastructure challenges.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              Verified Official Municipal System
            </div>
          </div>

          {/* Quick Civic Portals */}
          <div>
            <h4 className="text-slate-200 font-semibold text-xs uppercase tracking-wider mb-3">Public Services</h4>
            <ul className="space-y-2">
              <li><button onClick={() => setActivePage('report-issue')} className="hover:text-white transition">Report an Infrastructure Issue</button></li>
              <li><button onClick={() => setActivePage('track')} className="hover:text-white transition">Track Complaint by ID</button></li>
              <li><button onClick={() => setActivePage('gis-map')} className="hover:text-white transition">City GIS Heatmap Explorer</button></li>
              <li><button onClick={() => setActivePage('department-management')} className="hover:text-white transition">Municipal Directory</button></li>
            </ul>
          </div>

          {/* Civic Departments */}
          <div>
            <h4 className="text-slate-200 font-semibold text-xs uppercase tracking-wider mb-3">Key Departments</h4>
            <ul className="space-y-2">
              <li>Public Works (Roads & Bridges)</li>
              <li>Solid Waste & Street Cleansing</li>
              <li>Water Supply & Sewerage Board</li>
              <li>Electrical & Street Lighting</li>
              <li>Traffic Management & Signals</li>
            </ul>
          </div>

          {/* Emergency & Municipal Contacts */}
          <div>
            <h4 className="text-slate-200 font-semibold text-xs uppercase tracking-wider mb-3">Emergency & Grievance</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                <span>24/7 Helpline: <strong>1800-425-3333</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>support@civicpulse.gov</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Municipal HQ, Corporation Avenue</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center text-slate-500 text-[11px]">
          <p>&copy; 2026 Municipal Corporation. All Rights Reserved. Public Civic Portal.</p>
          <p>Powered by OpenStreetMap & AI-Assisted Issue Classification Engine</p>
        </div>
      </div>
    </footer>
  );
}
