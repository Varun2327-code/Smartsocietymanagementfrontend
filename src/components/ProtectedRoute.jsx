import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import useUserRole from '../hooks/useUserRole';
import LoadingScreen from './LoadingScreen';

/**
 * ProtectedRoute component to protect routes based on authentication and role.
 * 
 * Props:
 * - children: React node to render if authorized
 * - requiredRole: string or array of strings of allowed roles (e.g. 'admin' or ['admin', 'user'])
 * - redirectPath: path to redirect if unauthorized (default: '/login')
 */
const ProtectedRoute = ({ children, requiredRole, redirectPath = '/login' }) => {
  const [user, loading] = useAuthState(auth);
  const { role, loading: roleLoading } = useUserRole();

  if (loading || roleLoading || role === null) {
    // While auth or role is loading, show loading screen
    return <LoadingScreen />;
  }

  if (!user) {
    // Not logged in
    return <Navigate to={redirectPath} replace />;
  }

  // Normalize requiredRole to array
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (requiredRole && !allowedRoles.includes(role)) {
    // Role not authorized
    // Redirect to appropriate dashboard or login
    if (role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (role === 'user') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to={redirectPath} replace />;
    }
  }

  // Authorized
  return children;
};

export default ProtectedRoute;
