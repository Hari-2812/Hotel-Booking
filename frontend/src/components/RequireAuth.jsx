import { Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/auth-context';
import { PageSkeleton } from './LoadingSkeleton';

export default function RequireAuth({ children, roles }) {
  const { token, user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return <PageSkeleton />;
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles?.length && user?.role && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
