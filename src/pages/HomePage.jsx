import { House } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../lib/permissions';
import AdminHomePage from './AdminHomePage';
import ParentHomePage from './ParentHomePage';
import PlaceholderPage from './PlaceholderPage';
import WelcomeOverlay from '../components/shared/WelcomeOverlay';
import InstallPrompt from '../components/shared/InstallPrompt';

// Home dispatches on role: admins land on the KPI dashboard, parents get
// the personalized schedule view, and coaches see a placeholder until
// their role-specific dashboard is built.
export default function HomePage() {
  const { role } = useAuth();
  if (role === 'parent') return (
    <>
      <WelcomeOverlay />
      <InstallPrompt />
      <ParentHomePage />
    </>
  );
  if (isAdmin(role)) return (
    <>
      <WelcomeOverlay />
      <InstallPrompt />
      <AdminHomePage />
    </>
  );
  return (
    <>
      <WelcomeOverlay />
      <InstallPrompt />
      <PlaceholderPage
        icon={House}
        title="Home"
        description="Your personalized dashboard will live here."
      />
    </>
  );
}
