import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FullPageLoader from './FullPageLoader';

export default function PublicOnlyRoute() {
  const { user, isBootstrapping } = useAuth();
  if (isBootstrapping) return <FullPageLoader />;
  return user ? <Navigate to="/" replace /> : <Outlet />;
}
