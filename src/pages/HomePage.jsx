// src/pages/HomePage.jsx
// Phase 1 Step 5C: HomePage role router. Reads useHomeRole().activeRole
// (not useAuth().role) so admin "view as" QA preview routes correctly.
// Coach branch is a placeholder until Step 5D scaffolds CoachHomePage.

import { lazy, Suspense } from 'react';
import { House } from 'lucide-react';
import { useHomeRole } from '../hooks/useHomeRole';
import ParentHomePage from './ParentHomePage';
import PlaceholderPage from './PlaceholderPage';
import WelcomeOverlay from '../components/shared/WelcomeOverlay';
import InstallPrompt from '../components/shared/InstallPrompt';

const AdminHomePage = lazy(() => import('./AdminHomePage'));

const FALLBACK = (
  <div style={{ padding: 32, textAlign: 'center', color: 'var(--em-text-tertiary)' }}>
    Loading...
  </div>
);

// Wrap every branch with the same shared UI: welcome overlay + PWA install prompt.
function withChrome(content) {
  return (
    <>
      <WelcomeOverlay />
      <InstallPrompt />
      {content}
    </>
  );
}

export default function HomePage() {
  const { activeRole, loading } = useHomeRole();

  if (loading) return withChrome(FALLBACK);

  if (activeRole === 'parent') return withChrome(<ParentHomePage />);

  if (activeRole === 'admin') {
    return withChrome(
      <Suspense fallback={FALLBACK}>
        <AdminHomePage />
      </Suspense>
    );
  }

  if (activeRole === 'coach') {
    return withChrome(
      <PlaceholderPage
        icon={House}
        title="Coach home"
        description="Your team dashboard is coming soon."
      />
    );
  }

  // Defensive: unknown role (shouldn't happen if useHomeRole resolved).
  return withChrome(
    <PlaceholderPage
      icon={House}
      title="Home"
      description="Your personalized dashboard will appear here once your account is ready."
    />
  );
}
