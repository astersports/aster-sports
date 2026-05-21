import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import AppShell from './AppShell';

// Auth gate. Reads useAuth().role — the RLS-authoritative real role.
// Permissions MUST be gated on real role, not view-as. Header reads
// useHomeRole().activeRole for label display only — those two are
// deliberately split (see Header.jsx comment).
export default function RequireAuth({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <AppShell>
        <div className="p-4">
          <LoadingSkeleton variant="card" count={2} />
          <div style={{ marginTop: 12 }}><LoadingSkeleton variant="list" count={4} /></div>
        </div>
      </AppShell>
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
