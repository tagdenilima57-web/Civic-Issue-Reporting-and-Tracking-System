import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Shield, User, Wrench, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export function Login({ setActivePage }) {
  const { login, demoLogin } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(identifier, password);
      if (user.role === 'ADMIN') setActivePage('admin-dashboard');
      else if (user.role === 'OFFICIAL') setActivePage('official-dashboard');
      else setActivePage('citizen-dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (role) => {
    setError('');
    setLoading(true);
    try {
      const user = await demoLogin(role);
      if (user.role === 'ADMIN') setActivePage('admin-dashboard');
      else if (user.role === 'OFFICIAL') setActivePage('official-dashboard');
      else setActivePage('citizen-dashboard');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Form */}
        <div className="md:col-span-7 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-blue-700 font-bold mb-2">
            <Building2 className="w-6 h-6" />
            <span className="text-xl">CivicPulse Access</span>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Sign in with your registered municipal credentials to report, track, or manage public issues.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username or Official Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. citizen@example.com or admin"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm rounded-lg transition shadow flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              New to CivicPulse?{' '}
              <button
                type="button"
                onClick={() => setActivePage('register')}
                className="text-blue-700 font-semibold hover:underline"
              >
                Register Citizen Account
              </button>
            </p>
          </div>
        </div>

        {/* Right: 1-Click Demo Personas */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md">
            <h3 className="font-bold text-sm tracking-wide uppercase text-blue-200 mb-1">
              One-Click Demo Personas
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Explore the system instantly with pre-seeded role permissions and data.
            </p>

            <div className="space-y-3">
              {/* Citizen */}
              <button
                type="button"
                onClick={() => handleDemoClick('CITIZEN')}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/10 p-3 rounded-xl text-left transition flex items-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500/30 text-blue-200 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    Citizen Persona
                    <span className="text-[10px] bg-blue-400/20 text-blue-200 px-1.5 py-0.2 rounded font-mono">John</span>
                  </div>
                  <p className="text-[11px] text-slate-300">Report issues, track timeline, verify repairs</p>
                </div>
              </button>

              {/* Administrator */}
              <button
                type="button"
                onClick={() => handleDemoClick('ADMIN')}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/10 p-3 rounded-xl text-left transition flex items-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-red-500/30 text-red-200 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    Municipal Administrator
                    <span className="text-[10px] bg-red-400/20 text-red-200 px-1.5 py-0.2 rounded font-mono">Chief Admin</span>
                  </div>
                  <p className="text-[11px] text-slate-300">Triage complaints, assign depts, view GIS analytics</p>
                </div>
              </button>

              {/* Official */}
              <button
                type="button"
                onClick={() => handleDemoClick('OFFICIAL')}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/10 p-3 rounded-xl text-left transition flex items-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-500/30 text-amber-200 flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    PWD Department Official
                    <span className="text-[10px] bg-amber-400/20 text-amber-200 px-1.5 py-0.2 rounded font-mono">Roads & Bridges</span>
                  </div>
                  <p className="text-[11px] text-slate-300">Inspect tasks, post updates, upload resolution proof</p>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Security & RBAC Enforcement:</p>
            <p>Passwords are securely hashed using PBKDF2/SHA256. Role permissions strictly isolate operational capabilities.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
