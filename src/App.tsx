import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layouts/AppLayout'; // Import AppLayout
import ProtectedRoute from './components/common/ProtectedRoute'; // Import ProtectedRoute
import PublicLayout from './components/layouts/PublicLayout'; // Import PublicLayout

// Import Page Components
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import FollowUpsPage from './pages/FollowUpsPage';
import MeetingsPage from './pages/MeetingsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
        <Route path="/signup" element={<PublicLayout><SignupPage /></PublicLayout>} />

        {/* Protected Routes Main Application Structure */}
        <Route element={<ProtectedRoute />}> {/* Ensures user is authenticated before trying to pick a role-based layout */}
          <Route element={<AppLayout />}> {/* AppLayout picks Agent, Manager, or SuperAdminLayout */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/follow-ups" element={<FollowUpsPage />} />
            <Route path="/meetings" element={<MeetingsPage />} />
            
            {/* Admin specific routes nested further under ProtectedRoute with specific roles */}
            <Route path="admin" element={<ProtectedRoute allowedRoles={['super_admin']} />}>
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
          </Route>
        </Route>
        
        <Route path="*" element={<PublicLayout><NotFoundPage /></PublicLayout>} />
      </Routes>
    </Router>
  );
}

export default App; 