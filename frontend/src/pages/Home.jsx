import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  Search, AlertTriangle, CheckCircle2, ShieldCheck, MapPin, 
  ArrowRight, Users, Sparkles, Clock, Layers, ThumbsUp, ChevronRight
} from 'lucide-react';

export function Home({ setActivePage, setTrackId }) {
  const [searchInput, setSearchInput] = useState('');
  const [stats, setStats] = useState({
    total_complaints: 8,
    resolved_complaints: 3,
    satisfaction_rate: 94.2,
    in_progress_complaints: 3,
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.getDashboardStats().then(setStats).catch(() => {});
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setTrackId(searchInput.trim().toUpperCase());
      setActivePage('track');
    }
  };

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-900 via-blue-800 to-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8 rounded-3xl mx-2 sm:mx-6 mt-4 shadow-xl overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-400 blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-indigo-500 blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-700/60 border border-blue-500/30 text-blue-200 text-xs font-semibold backdrop-blur">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Empowering Citizens & Modernizing Municipal Services
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Report Civic Issues. Track in Real-Time. <br />
            <span className="text-blue-300">Transform Your City.</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Report potholes, garbage accumulation, broken streetlights, water leaks, and road hazards directly to municipal authorities with GPS accuracy and AI-assisted classification.
          </p>

          {/* Quick Track Complaint Bar */}
          <div className="max-w-xl mx-auto pt-4">
            <form onSubmit={handleSearch} className="flex items-center bg-white rounded-2xl p-2 shadow-2xl border border-slate-200">
              <div className="pl-3 text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Enter Complaint ID (e.g. CIV-2026-A101)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full px-3 py-2 text-slate-800 text-sm focus:outline-none placeholder-slate-400"
              />
              <button
                type="submit"
                className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition shadow-md shrink-0 flex items-center gap-1.5"
              >
                Track Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
            <p className="text-xs text-blue-200/80 mt-2">
              Try sample complaints: <button type="button" onClick={() => { setTrackId('CIV-2026-A101'); setActivePage('track'); }} className="underline hover:text-white">CIV-2026-A101</button>, <button type="button" onClick={() => { setTrackId('CIV-2026-B204'); setActivePage('track'); }} className="underline hover:text-white">CIV-2026-B204</button>
            </p>
          </div>

          {/* Hero Action Buttons */}
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setActivePage('report-issue')}
              className="px-6 py-3 bg-white text-blue-900 hover:bg-blue-50 font-bold rounded-xl shadow-lg transition flex items-center gap-2 text-sm"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Report an Issue Now
            </button>
            <button
              onClick={() => setActivePage('gis-map')}
              className="px-6 py-3 bg-blue-800/80 hover:bg-blue-700/80 text-white font-semibold rounded-xl border border-blue-600 transition flex items-center gap-2 text-sm backdrop-blur"
            >
              <MapPin className="w-4 h-4 text-blue-300" />
              Explore City GIS Map
            </button>
          </div>
        </div>
      </section>

      {/* Live Impact Statistics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{stats.total_complaints}</p>
              <p className="text-xs font-medium text-slate-500">Total Grievances</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{stats.resolved_complaints}</p>
              <p className="text-xs font-medium text-slate-500">Issues Resolved</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">28 hrs</p>
              <p className="text-xs font-medium text-slate-500">Avg. Turnaround Time</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <ThumbsUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{stats.satisfaction_rate}%</p>
              <p className="text-xs font-medium text-slate-500">Citizen Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Reportable Civic Categories</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Select an issue category to launch a streamlined report with municipal SLA guarantees.</p>
          </div>
          <button 
            onClick={() => setActivePage('report-issue')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
          >
            All Categories &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.slice(0, 8).map((cat) => (
            <div
              key={cat.id}
              onClick={() => setActivePage('report-issue')}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition leading-snug">
                {cat.name}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                {cat.description}
              </p>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>SLA: {cat.sla_hours} hrs</span>
                <span className="font-semibold text-blue-600 group-hover:translate-x-0.5 transition">&rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How the Civic Pipeline Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white py-12 rounded-3xl border border-slate-200">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-blue-700 font-bold text-xs uppercase tracking-wider">Accountable Governance</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">How CivicPulse Works</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-2">A transparent 5-step lifecycle ensuring that every public grievance is verified, addressed, and validated by the citizen.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
          {[
            { step: '01', title: 'Citizen Reports', desc: 'Snap a photo, pick GPS location on the map, and write a brief description.', icon: AlertTriangle },
            { step: '02', title: 'AI Assist & Duplicate Check', desc: 'AI suggests category & department while scanning for active duplicates nearby.', icon: Sparkles },
            { step: '03', title: 'Authority Verification', desc: 'Admin verifies the issue and delegates it to the designated department team.', icon: ShieldCheck },
            { step: '04', title: 'On-Site Resolution', desc: 'Department personnel repair the issue and upload verifiable resolution proof.', icon: CheckCircle2 },
            { step: '05', title: 'Citizen Validation', desc: 'You inspect the repair, confirm completion, or reopen if unsatisfied.', icon: ThumbsUp },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex flex-col items-center text-center p-4">
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full mb-3">
                  STEP {item.step}
                </span>
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3">
                  <Icon className="w-6 h-6 text-blue-700" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Call to Action banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold">Noticed an infrastructure problem today?</h3>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
              Don't wait for accidents or worsening decay. Report it in under 60 seconds with your phone's camera and GPS.
            </p>
          </div>
          <button
            onClick={() => setActivePage('report-issue')}
            className="px-6 py-3 bg-white text-blue-800 hover:bg-blue-50 font-bold text-sm rounded-xl shadow-md transition shrink-0"
          >
            File a Civic Report Now
          </button>
        </div>
      </section>
    </div>
  );
}
