import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UserProfile } from '../../contexts/AuthContext'; // Adjusted path

interface ProtectedRouteProps {
  allowedRoles?: UserProfile['role'][];
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, profile, loading } = useAuth();
  console.log('ProtectedRoute loading state:', loading, 'User:', user, 'Profile:', profile);

  if (loading) {
    return <div>Loading session...</div>; // Replace with a proper spinner/loader
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && profile?.role && !allowedRoles.includes(profile.role)) {
    console.warn(`ProtectedRoute: User role '${profile.role}' not in allowed roles: ${allowedRoles.join(', ')} for route.`);
    return <Navigate to="/dashboard" replace />; // Or to an "Unauthorized" page
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute; 