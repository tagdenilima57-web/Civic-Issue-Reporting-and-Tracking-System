import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { ReportIssue } from './pages/ReportIssue';
import { MyComplaints } from './pages/MyComplaints';
import { ComplaintDetail } from './pages/ComplaintDetail';
import { TrackComplaint } from './pages/TrackComplaint';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminComplaints } from './pages/AdminComplaints';
import { DepartmentManagement } from './pages/DepartmentManagement';
import { OfficialDashboard } from './pages/OfficialDashboard';
import { GISMapExplorer } from './pages/GISMapExplorer';

function MainApp() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState('home');
  const [trackId, setTrackId] = useState('');
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <Home setActivePage={setActivePage} setTrackId={setTrackId} />;
      case 'login':
        return <Login setActivePage={setActivePage} />;
      case 'register':
        return <Register setActivePage={setActivePage} />;
      case 'citizen-dashboard':
        return (
          <CitizenDashboard
            setActivePage={setActivePage}
            setTrackId={setTrackId}
            setSelectedComplaintId={setSelectedComplaintId}
          />
        );
      case 'report-issue':
        return (
          <ReportIssue
            setActivePage={setActivePage}
            setTrackId={setTrackId}
            setSelectedComplaintId={setSelectedComplaintId}
          />
        );
      case 'my-complaints':
        return (
          <MyComplaints
            setActivePage={setActivePage}
            setTrackId={setTrackId}
            setSelectedComplaintId={setSelectedComplaintId}
          />
        );
      case 'complaint-detail':
        return (
          <ComplaintDetail
            complaintId={trackId}
            selectedId={selectedComplaintId}
            setActivePage={setActivePage}
          />
        );
      case 'track':
        return (
          <TrackComplaint
            trackId={trackId}
            setTrackId={setTrackId}
            setActivePage={setActivePage}
          />
        );
      case 'notifications':
        return (
          <Notifications
            setSelectedComplaintId={setSelectedComplaintId}
            setTrackId={setTrackId}
            setActivePage={setActivePage}
          />
        );
      case 'profile':
        return <Profile setActivePage={setActivePage} />;
      case 'admin-dashboard':
        return (
          <AdminDashboard
            setActivePage={setActivePage}
            setSelectedComplaintId={setSelectedComplaintId}
            setTrackId={setTrackId}
          />
        );
      case 'admin-complaints':
        return (
          <AdminComplaints
            setSelectedComplaintId={setSelectedComplaintId}
            setTrackId={setTrackId}
            setActivePage={setActivePage}
          />
        );
      case 'department-management':
        return <DepartmentManagement />;
      case 'official-dashboard':
        return (
          <OfficialDashboard
            setSelectedComplaintId={setSelectedComplaintId}
            setTrackId={setTrackId}
            setActivePage={setActivePage}
          />
        );
      case 'gis-map':
        return (
          <GISMapExplorer
            setSelectedComplaintId={setSelectedComplaintId}
            setTrackId={setTrackId}
            setActivePage={setActivePage}
          />
        );
      default:
        return <Home setActivePage={setActivePage} setTrackId={setTrackId} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1">
        {renderPage()}
      </main>
      <Footer setActivePage={setActivePage} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
