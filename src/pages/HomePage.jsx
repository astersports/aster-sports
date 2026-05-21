// src/pages/HomePage.jsx
// Phase 1 Step 5C: HomePage role router. Reads useHomeRole().activeRole
// (not useAuth().role) so admin "view as" QA preview routes correctly.
// Coach branch is a placeholder until Step 5D scaffolds CoachHomePage.

import { lazy, Suspense } from 'react';
import { House } from 'lucide-react';
import { useHomeRole } from '../hooks/useHomeRole';
import ParentHomePage from './ParentHomePage';
import PlaceholderPage from './PlaceholderPage';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';

const AdminHomePage = lazy(() => import('./AdminHomePage'));
const CoachHomePage = lazy(() => import('./CoachHomePage'));

const FALLBACK = (
  <div className="p-4">
    <LoadingSkeleton variant="card" count={1} />
    <div style={{ marginTop: 12 }}><LoadingSkeleton variant="list" count={3} /></div>
  </div>
);

// Pass-through wrapper retained for branch-render symmetry.
function withChrome(content) {
  return <>{content}</>;
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
      <Suspense fallback={FALLBACK}>
        <CoachHomePage />
      </Suspense>
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
