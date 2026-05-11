import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FullscreenLoader } from '../common/FullscreenLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectPath,
}) => {
  const { user, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <FullscreenLoader />;
  }

  if (!user) {
    // If not logged in, redirect to login page
    // Default to /login, but if it's an admin path, go to /admin/login
    const targetPath =
      redirectPath || (location.pathname.startsWith('/admin') ? '/admin/login' : '/login');
    return <Navigate to={targetPath} replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If logged in but role not allowed, redirect to home or unauthorized page
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
