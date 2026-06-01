import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import RequireAuth from './components/layout/RequireAuth';
import { useRouteMemory } from './hooks/useRouteMemory';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import HomePage from './pages/HomePage';
import SchedulePage from './pages/SchedulePage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailPage from './pages/TeamDetailPage';
import AccountPage from './pages/AccountPage';
import PublicSchedulePage from './pages/PublicSchedulePage';

const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const TournamentsPage = lazy(() => import('./pages/TournamentsPage'));
const TournamentDetailPage = lazy(() => import('./pages/TournamentDetailPage'));
const RecordsPage = lazy(() => import('./pages/RecordsPage'));
const LiveScorePage = lazy(() => import('./pages/LiveScorePage'));
const PlayerProfilePage = lazy(() => import('./pages/PlayerProfilePage'));
const AdminSeasonsPage = lazy(() => import('./pages/AdminSeasonsPage'));
const AdminTeamsPage = lazy(() => import('./pages/AdminTeamsPage'));
const AdminMembersPage = lazy(() => import('./pages/AdminMembersPage'));
const AdminOpponentsPage = lazy(() => import('./pages/AdminOpponentsPage'));
const AdminLocationsPage = lazy(() => import('./pages/AdminLocationsPage'));
const SeasonRolloverPage = lazy(() => import('./pages/SeasonRolloverPage'));
const FinancialDashboardPage = lazy(() => import('./pages/FinancialDashboardPage'));
const FinancialImportPage = lazy(() => import('./pages/FinancialImportPage'));
const ImportSchedulePage = lazy(() => import('./pages/ImportSchedulePage'));
const BriefingsComposePage = lazy(() => import('./pages/BriefingsComposePage'));
const BriefingsHistoryPage = lazy(() => import('./pages/BriefingsHistoryPage'));
const BriefingHistoryDetail = lazy(() => import('./pages/admin/BriefingHistoryDetail'));
const RegisterEntryPage = lazy(() => import('./pages/RegisterEntryPage'));
const RegisterFlowPage = lazy(() => import('./pages/RegisterFlowPage'));
const ProgramSetupPage = lazy(() => import('./pages/admin/ProgramSetupPage'));

const LAZY_FALLBACK = <div style={{ padding: 32, textAlign: 'center', color: 'var(--em-text-tertiary)' }}>Loading...</div>;

const Protected = ({ children, allowedRoles }) => (
  <RequireAuth allowedRoles={allowedRoles}>
    <AppShell>{children}</AppShell>
  </RequireAuth>
);

function PageTransition({ children }) {
  // Persist last route on hide + restore on PWA cold-launch (start_url is /).
  // See src/hooks/useRouteMemory.js for the design rationale.
  useRouteMemory();
  // Wave 2.B Batch 1 (#2 P0-1): removed `key={location.pathname}` wrapper.
  // Originally added in 531e07a (Apr 12, 2026) as a "fade on route change"
  // hook — but the fade CSS class (em-fade-in) was never wired to this
  // div, so the key was forcing full subtree remount (AppShell + Header +
  // BottomNav + every realtime channel) on every nav for zero visible
  // effect. Single largest INP regression closure. Wrapper preserved so
  // useRouteMemory() still runs; routes now reconcile in place.
  return <>{children}</>;
}

export default function App() {
  return (
    <PageTransition>
      <Suspense fallback={LAZY_FALLBACK}>
      <Routes>
      {/* Public auth routes — no shell, no guard */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/schedule/:teamId" element={<PublicSchedulePage />} />
      <Route path="/r/:slug" element={<RegisterEntryPage />} />
      <Route path="/r/:slug/apply" element={<RegisterFlowPage />} />

      {/* Authenticated routes */}
      <Route path="/"         element={<Protected><HomePage /></Protected>} />
      <Route path="/records"  element={<Protected><RecordsPage /></Protected>} />
      <Route path="/schedule" element={<Protected><SchedulePage /></Protected>} />
      <Route path="/teams"           element={<Protected><TeamsPage /></Protected>} />
      <Route path="/teams/:teamId"   element={<Protected><TeamDetailPage /></Protected>} />
      <Route path="/teams/:teamId/player/:playerId" element={<Protected><PlayerProfilePage /></Protected>} />
      <Route path="/teams/:teamId/tournaments" element={<Protected><TournamentsPage /></Protected>} />
      <Route path="/tournaments"     element={<Protected><TournamentsPage /></Protected>} />
      <Route path="/tournaments/:id" element={<Protected><TournamentDetailPage /></Protected>} />
      <Route path="/messages"        element={<Protected><MessagesPage /></Protected>} />
      <Route path="/account"         element={<Protected><AccountPage /></Protected>} />
      <Route path="/records-preview" element={<Navigate to="/records" replace />} />

      {/* Full-screen authenticated routes — auth guard without AppShell chrome */}
      <Route path="/events/:id" element={<RequireAuth><EventDetailPage /></RequireAuth>} />
      <Route path="/events/:id/live" element={<RequireAuth allowedRoles={['admin', 'coach']}><LiveScorePage /></RequireAuth>} />

      {/* Admin-only management routes */}
      <Route path="/admin/seasons" element={<Protected allowedRoles={['admin']}><AdminSeasonsPage /></Protected>} />
      <Route path="/admin/programs/new" element={<Protected allowedRoles={['admin']}><ProgramSetupPage /></Protected>} />
      <Route path="/admin/teams" element={<Protected allowedRoles={['admin']}><AdminTeamsPage /></Protected>} />
      <Route path="/admin/members" element={<Protected allowedRoles={['admin']}><AdminMembersPage /></Protected>} />
      <Route path="/admin/opponents" element={<Protected allowedRoles={['admin']}><AdminOpponentsPage /></Protected>} />
      <Route path="/admin/locations" element={<Protected allowedRoles={['admin']}><AdminLocationsPage /></Protected>} />
      <Route path="/admin/rollover" element={<Protected allowedRoles={['admin']}><SeasonRolloverPage /></Protected>} />
      <Route path="/admin/financials" element={<Protected allowedRoles={['admin']}><FinancialDashboardPage /></Protected>} />
      <Route path="/admin/financials/import" element={<Protected allowedRoles={['admin']}><FinancialImportPage /></Protected>} />
      <Route path="/admin/import-schedule" element={<Protected allowedRoles={['admin']}><ImportSchedulePage /></Protected>} />
      <Route path="/admin/briefings" element={<Navigate to="/admin/briefings/compose" replace />} />
      <Route path="/admin/briefings/compose" element={<Protected allowedRoles={['admin']}><BriefingsComposePage /></Protected>} />
      <Route path="/admin/briefings/history" element={<Protected allowedRoles={['admin']}><BriefingsHistoryPage /></Protected>} />
      <Route path="/admin/briefings/history/:id" element={<Protected allowedRoles={['admin']}><BriefingHistoryDetail /></Protected>} />
    </Routes>
      </Suspense>
    </PageTransition>
  );
}
