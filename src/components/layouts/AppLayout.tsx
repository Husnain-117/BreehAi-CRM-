import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AgentLayout from './AgentLayout';
import ManagerLayout from './ManagerLayout';
import SuperAdminLayout from './SuperAdminLayout';
import PublicLayout from './PublicLayout'; // Or a specific layout for authenticated but no role

const AppLayout: React.FC = () => {
  const { profile, loading, user } = useAuth();

  if (loading) return <div>Loading user profile for layout...</div>;

  if (user && profile) {
    switch (profile.role) {
      case 'agent':
        return <AgentLayout><Outlet /></AgentLayout>;
      case 'manager':
        return <ManagerLayout><Outlet /></ManagerLayout>;
      case 'super_admin':
        return <SuperAdminLayout><Outlet /></SuperAdminLayout>;
      default:
        console.warn("Unknown or missing user role for layout selection:", profile.role);
        // Fallback for authenticated user with an unknown role
        return <PublicLayout><Outlet /></PublicLayout>; // Or a specific "AuthenticatedNoRoleLayout"
    }
  }
  
  // This case should ideally not be hit if AppLayout is used within a ProtectedRoute context
  // that ensures 'user' exists. If it can be hit, redirect or show minimal layout.
  console.log("AppLayout: User not authenticated or profile missing, rendering PublicLayout or redirecting.");
  return <PublicLayout><Outlet /></PublicLayout>; // Fallback, or <Navigate to="/login" />
};

export default AppLayout; 