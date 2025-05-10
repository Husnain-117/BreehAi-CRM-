import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, UserProfile } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: UserProfile['role'][];
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, profile, loading, logout } = useAuth();
  const location = useLocation();
  console.log('ProtectedRoute loading state:', loading, 'User:', user, 'Profile:', profile, 'Path:', location.pathname);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute: No user found, redirecting to login.');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile) {
    console.warn('ProtectedRoute: User exists but profile is null. Logging out and redirecting to login.');
    useEffect(() => {
      logout();
    }, [logout]);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role as UserProfile['role'])) {
    console.warn(`ProtectedRoute: User role '${profile.role}' not in allowed roles: ${allowedRoles.join(', ')} for route.`);
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute; 