import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FullPageLoader from './FullPageLoader';

export default function ProtectedRoute() {
  const { user, isBootstrapping } = useAuth();
  if (isBootstrapping) return <FullPageLoader />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
