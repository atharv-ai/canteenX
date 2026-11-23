import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== 'canteen_admin' && user.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}
