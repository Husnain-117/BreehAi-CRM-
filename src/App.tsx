import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layouts/AppLayout'; // Import AppLayout
import ProtectedRoute from './components/common/ProtectedRoute'; // Import ProtectedRoute
import PublicLayout from './components/layouts/PublicLayout'; // Import PublicLayout
import { Toaster } from 'react-hot-toast'; // Import Toaster

// Import Page Components
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import FollowUpsPage from './pages/FollowUpsPage';
import MeetingsPage from './pages/MeetingsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import TeamProgressPage from './pages/admin/TeamProgressPage'; // Import the new page
import DailyReportPage from './pages/DailyReportPage'; // Import the new Daily Report page
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        toastOptions={{
          // Default options for all toasts
          className: '',
          duration: 5000,
          style: {
            background: '#333', // Darker background for better contrast with default white text
            color: '#fff',
            fontSize: '15px',
          },
          // Default options for specific types
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4CAF50', // Green icon
              secondary: '#fff',   // White checkmark
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#F44336', // Red icon
              secondary: '#fff',   // White X
            },
          },
        }}
      />
      <Routes>
        {/* Public Routes - Corrected Layout Routing */}
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<NotFoundPage />} /> {/* Catch-all for 404 inside public layout */}
        </Route>

        {/* Protected Routes Main Application Structure */}
        <Route element={<ProtectedRoute />}> {/* Ensures user is authenticated before trying to pick a role-based layout */}
          <Route element={<AppLayout />}> {/* AppLayout picks Agent, Manager, or SuperAdminLayout */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/follow-ups" element={<FollowUpsPage />} />
            <Route path="/meetings" element={<MeetingsPage />} />
            <Route path="/daily-report" element={<DailyReportPage />} />
            
            {/* Admin specific routes nested further under ProtectedRoute with specific roles */}
            <Route path="admin" element={<ProtectedRoute allowedRoles={['super_admin']} />}>
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="team-progress" element={<TeamProgressPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App; 