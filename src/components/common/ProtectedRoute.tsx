import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UserProfile } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: UserProfile['role'][];
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, profile, loading } = useAuth();

  // Show a full-screen loader while determining auth state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '12px',
        background: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
      }}>
        <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>Loading your session...</p>
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role-restricted route: if we have a profile and role doesn't match, redirect
  if (allowedRoles && allowedRoles.length > 0) {
    if (!profile) {
      // Profile not yet loaded — let it through; role check will be retried when profile loads
      // (This avoids flashing the dashboard on slow profile fetches for admin routes)
      return <Navigate to="/dashboard" replace />;
    }
    if (profile.role && !allowedRoles.includes(profile.role)) {
      console.warn(`ProtectedRoute: Role '${profile.role}' not in [${allowedRoles.join(', ')}].`);
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
 