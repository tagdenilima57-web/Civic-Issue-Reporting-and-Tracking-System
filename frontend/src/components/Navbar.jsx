import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, MapPin, PlusCircle, Bell, User, LogOut, 
  LayoutDashboard, ListChecks, ShieldAlert, BarChart3, 
  Users, ChevronDown, Sparkles
} from 'lucide-react';

export function Navbar({ activePage, setActivePage }) {
  const { user, logout, demoLogin, unreadCount, isAdmin, isOfficial, isCitizen } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);

  const handleNavClick = (page) => {
    setActivePage(page);
    setUserDropdownOpen(false);
  };

  const handleDemoSwitch = async (role) => {
    await demoLogin(role);
    setDemoDropdownOpen(false);
    if (role === 'ADMIN') setActivePage('admin-dashboard');
    else if (role === 'OFFICIAL') setActivePage('official-dashboard');
    else setActivePage('citizen-dashboard');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Municipal Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1 px-4 sm:px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Official Municipal Corporation Citizen Engagement & Grievance Redressal Portal</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-slate-400">Toll-Free Civic Helpline: 1800-425-3333</span>
          
          {/* Quick Demo Switcher */}
          <div className="relative">
            <button
              onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
              className="flex items-center gap-1.5 bg-blue-900 hover:bg-blue-800 text-blue-100 px-2 py-0.5 rounded text-[11px] font-medium transition"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Switch Demo Role</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {demoDropdownOpen && (
              <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1 text-slate-800 z-50 text-xs">
                <div className="px-3 py-1.5 font-semibold text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Select Demo Persona
                </div>
                <button
                  onClick={() => handleDemoSwitch('CITIZEN')}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between"
                >
                  <span className="font-medium">Citizen (John)</span>
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Reporter</span>
                </button>
                <button
                  onClick={() => handleDemoSwitch('ADMIN')}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between"
                >
                  <span className="font-medium">Administrator</span>
                  <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Admin</span>
                </button>
                <button
                  onClick={() => handleDemoSwitch('OFFICIAL')}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between"
                >
                  <span className="font-medium">PWD Official</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Official</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo / Emblem */}
          <div 
            onClick={() => handleNavClick(user ? (isAdmin ? 'admin-dashboard' : isOfficial ? 'official-dashboard' : 'citizen-dashboard') : 'home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:bg-blue-800 transition">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">CIVIC<span className="text-blue-700">PULSE</span></span>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">GovPortal</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">MUNICIPAL CIVIC MANAGEMENT</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {!user && (
              <>
                <button
                  onClick={() => handleNavClick('home')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activePage === 'home' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  Home
                </button>
                <button
                  onClick={() => handleNavClick('track')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activePage === 'track' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  Track Complaint
                </button>
                <button
                  onClick={() => handleNavClick('gis-map')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activePage === 'gis-map' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  City Map & Heatmap
                </button>
              </>
            )}

            {/* Citizen Links */}
            {isCitizen && (
              <>
                <button
                  onClick={() => handleNavClick('citizen-dashboard')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activePage === 'citizen-dashboard' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => handleNavClick('report-issue')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-blue-700 hover:bg-blue-800 text-white shadow-sm transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  Report Problem
                </button>
                <button
                  onClick={() => handleNavClick('my-complaints')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activePage === 'my-complaints' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  My Complaints
                </button>
                <button
                  onClick={() => handleNavClick('track')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activePage === 'track' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  Track Status
                </button>
                <button
                  onClick={() => handleNavClick('gis-map')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activePage === 'gis-map' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  Civic Map
                </button>
              </>
            )}

            {/* Admin Links */}
            {isAdmin && (
              <>
                <button
                  onClick={() => handleNavClick('admin-dashboard')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activePage === 'admin-dashboard' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  Admin Analytics
                </button>
                <button
                  onClick={() => handleNavClick('admin-complaints')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activePage === 'admin-complaints' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  Manage Complaints
                </button>
                <button
                  onClick={() => handleNavClick('department-management')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activePage === 'department-management' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  Departments
                </button>
                <button
                  onClick={() => handleNavClick('gis-map')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activePage === 'gis-map' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  GIS & Heatmap
                </button>
              </>
            )}

            {/* Official Links */}
            {isOfficial && (
              <>
                <button
                  onClick={() => handleNavClick('official-dashboard')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activePage === 'official-dashboard' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  Department Tasks
                </button>
                <button
                  onClick={() => handleNavClick('gis-map')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activePage === 'gis-map' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  Department Map
                </button>
              </>
            )}
          </nav>

          {/* Right Area: Notifications & Auth User */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Notification Bell */}
                <button
                  onClick={() => handleNavClick('notifications')}
                  className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center border border-blue-200">
                      {user.first_name ? user.first_name[0] : user.username[0].toUpperCase()}
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-xs font-semibold text-slate-800 leading-tight">
                        {user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.username}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {user.role === 'ADMIN' ? 'Administrator' : user.role === 'OFFICIAL' ? (user.department_details?.code || 'Official') : 'Citizen'}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-800">{user.email}</p>
                        <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          user.role === 'ADMIN' ? 'bg-red-100 text-red-700' : user.role === 'OFFICIAL' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                      <button
                        onClick={() => handleNavClick('profile')}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <User className="w-3.5 h-3.5" />
                        My Profile
                      </button>
                      <button
                        onClick={() => { logout(); handleNavClick('home'); }}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavClick('login')}
                  className="px-3.5 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-lg transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNavClick('register')}
                  className="px-4 py-2 text-sm font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg shadow-sm transition"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
