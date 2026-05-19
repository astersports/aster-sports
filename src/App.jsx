import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import RequireAuth from './components/layout/RequireAuth';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import HomePage from './pages/HomePage';
import SchedulePage from './pages/SchedulePage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailPage from './pages/TeamDetailPage';
import AccountPage from './pages/AccountPage';
import PublicSchedulePage from './pages/PublicSchedulePage';

const LocationsPage = lazy(() => import('./pages/LocationsPage'));
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
const SeasonRolloverPage = lazy(() => import('./pages/SeasonRolloverPage'));
const FinancialDashboardPage = lazy(() => import('./pages/FinancialDashboardPage'));
const FinancialImportPage = lazy(() => import('./pages/FinancialImportPage'));
const ImportSchedulePage = lazy(() => import('./pages/ImportSchedulePage'));
const BriefingsInboxPage = lazy(() => import('./pages/BriefingsInboxPage'));
const BriefingHistoryDetail = lazy(() => import('./pages/admin/BriefingHistoryDetail'));
const EngineDebugPreviewPage = lazy(() => import('./pages/EngineDebugPreviewPage'));

const LAZY_FALLBACK = <div style={{ padding: 32, textAlign: 'center', color: 'var(--em-text-tertiary)' }}>Loading...</div>;

const Protected = ({ children, allowedRoles }) => (
  <RequireAuth allowedRoles={allowedRoles}>
    <AppShell>{children}</AppShell>
  </RequireAuth>
);

function PageTransition({ children }) {
  const location = useLocation();
  return (
    <div key={location.pathname}>
      {children}
    </div>
  );
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

      {/* Authenticated routes */}
      <Route path="/"         element={<Protected><HomePage /></Protected>} />
      <Route path="/records"  element={<Protected><RecordsPage /></Protected>} />
      <Route path="/schedule" element={<Protected><SchedulePage /></Protected>} />
      <Route path="/locations" element={<Protected><LocationsPage /></Protected>} />
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
      <Route path="/admin/teams" element={<Protected allowedRoles={['admin']}><AdminTeamsPage /></Protected>} />
      <Route path="/admin/members" element={<Protected allowedRoles={['admin']}><AdminMembersPage /></Protected>} />
      <Route path="/admin/rollover" element={<Protected allowedRoles={['admin']}><SeasonRolloverPage /></Protected>} />
      <Route path="/admin/financials" element={<Protected allowedRoles={['admin']}><FinancialDashboardPage /></Protected>} />
      <Route path="/admin/financials/import" element={<Protected allowedRoles={['admin']}><FinancialImportPage /></Protected>} />
      <Route path="/admin/import-schedule" element={<Protected allowedRoles={['admin']}><ImportSchedulePage /></Protected>} />
      <Route path="/admin/briefings" element={<Protected allowedRoles={['admin']}><BriefingsInboxPage /></Protected>} />
      <Route path="/admin/briefings/compose" element={<Protected allowedRoles={['admin']}><BriefingsInboxPage /></Protected>} />
      <Route path="/admin/briefings/history/:id" element={<Protected allowedRoles={['admin']}><BriefingHistoryDetail /></Protected>} />
      <Route path="/admin/engine-preview" element={<Protected allowedRoles={['admin']}><EngineDebugPreviewPage /></Protected>} />
    </Routes>
      </Suspense>
    </PageTransition>
  );
}
