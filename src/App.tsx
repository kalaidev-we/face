import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import DashboardLayout from './pages/DashboardLayout';
import Overview from './pages/Overview';
import AttendanceMarking from './pages/AttendanceMarking';
import Students from './pages/Students';
import Staff from './pages/Staff';
import Departments from './pages/Departments';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Router>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'rgba(17, 24, 39, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#f3f4f6',
            backdropFilter: 'blur(10px)',
          },
        }}
      />
      <Routes>
        {/* Public Marketing Route */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Authentication Pathway */}
        <Route path="/login" element={<Login />} />
        
        {/* Secure Dashboard Viewport Shell */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Index Redirects to Overview */}
          <Route index element={<Navigate to="overview" replace />} />
          
          <Route path="overview" element={<Overview />} />
          <Route path="attendance" element={<AttendanceMarking />} />
          <Route path="students" element={<Students />} />
          <Route path="staff" element={<Staff />} />
          <Route path="departments" element={<Departments />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* Wildcard Fallback redirects back to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
