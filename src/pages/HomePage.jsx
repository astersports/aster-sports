import { House } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../lib/permissions';
import AdminHomePage from './AdminHomePage';
import PlaceholderPage from './PlaceholderPage';

// Home dispatches on role: admins land on the KPI dashboard, coaches and
// parents get a placeholder until their role-specific dashboards are built.
export default function HomePage() {
  const { role } = useAuth();
  if (isAdmin(role)) return <AdminHomePage />;
  return (
    <PlaceholderPage
      icon={House}
      title="Home"
      description="Your personalized dashboard will live here."
    />
  );
}
