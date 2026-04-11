import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSkeleton from '../shared/LoadingSkeleton';

// Route guard. Blocks children until auth state resolves, then either
// redirects to /login, /unauthorized, or renders.
// `allowedRoles` is optional — when omitted, any authenticated user passes.
export default function RequireAuth({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="p-4">
        <LoadingSkeleton variant="card" count={3} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
