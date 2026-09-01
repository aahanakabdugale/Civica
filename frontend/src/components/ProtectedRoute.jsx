import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wrap any route element with this to require login.
 * Usage: <ProtectedRoute role="authority"><DashboardHome /></ProtectedRoute>
 */
export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) return null; // or a spinner

  if (!user || user.role !== role) {
    const loginPath = role === 'authority' ? '/admin/login' : '/login';
    return <Navigate to={loginPath} replace />;
  }

  return children;
}