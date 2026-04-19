import { lazy, Suspense } from 'react';
import { House } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../lib/permissions';
import ParentHomePage from './ParentHomePage';
import PlaceholderPage from './PlaceholderPage';
import WelcomeOverlay from '../components/shared/WelcomeOverlay';
import InstallPrompt from '../components/shared/InstallPrompt';

const AdminHomePage = lazy(() => import('./AdminHomePage'));
const LAZY_FALLBACK = <div style={{ padding: 32, textAlign: 'center', color: 'var(--sf-text-tertiary)' }}>Loading...</div>;

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
      <Suspense fallback={LAZY_FALLBACK}><AdminHomePage /></Suspense>
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
