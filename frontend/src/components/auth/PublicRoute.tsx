import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FullscreenLoader } from '../common/FullscreenLoader';

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <FullscreenLoader />;
  }

  if (user) {
    // 1. Try to get the previous page from location state
    const from = (location.state as any)?.from?.pathname;

    if (from) {
      return <Navigate to={from} replace />;
    }

    // 2. Fallback: If no previous page, go to role-based dashboard
    let targetPath = '/dashboard';
    if (user.role === 'ADMIN') {
      targetPath = '/admin';
    } else if (user.role === 'INSTRUCTOR') {
      targetPath = '/instructor/dashboard';
    }

    return <Navigate to={targetPath} replace />;
  }

  return <>{children}</>;
};
