import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import RequireAuth from './components/layout/RequireAuth';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import HomePage from './pages/HomePage';
import SchedulePage from './pages/SchedulePage';
import ScorePage from './pages/ScorePage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailPage from './pages/TeamDetailPage';
import MessagesPage from './pages/MessagesPage';
import EventDetailPage from './pages/EventDetailPage';

const AdminSeasonsPage = lazy(() => import('./pages/AdminSeasonsPage'));
const AdminTeamsPage = lazy(() => import('./pages/AdminTeamsPage'));

const LAZY_FALLBACK = <div style={{ padding: 32, textAlign: 'center', color: 'var(--sf-text-tertiary)' }}>Loading...</div>;

// Wrap an authenticated route in both the shell and the auth guard. Keeps
// the route table below flat and readable instead of nesting <RequireAuth>
// manually on every line.
const Protected = ({ children, allowedRoles }) => (
  <RequireAuth allowedRoles={allowedRoles}>
    <AppShell>{children}</AppShell>
  </RequireAuth>
);

function PageTransition({ children }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="sf-fade-in">
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

      {/* Authenticated routes */}
      <Route path="/"         element={<Protected><HomePage /></Protected>} />
      <Route path="/schedule" element={<Protected><SchedulePage /></Protected>} />
      <Route
        path="/score"
        element={
          <Protected allowedRoles={['admin', 'coach']}>
            <ScorePage />
          </Protected>
        }
      />
      <Route path="/teams"           element={<Protected><TeamsPage /></Protected>} />
      <Route path="/teams/:teamId"   element={<Protected><TeamDetailPage /></Protected>} />
      <Route path="/messages"        element={<Protected><MessagesPage /></Protected>} />

      {/* Full-screen authenticated routes — auth guard without AppShell chrome */}
      <Route path="/events/:id" element={<RequireAuth><EventDetailPage /></RequireAuth>} />

      {/* Admin-only management routes */}
      <Route
        path="/admin/seasons"
        element={
          <Protected allowedRoles={['admin']}>
            <AdminSeasonsPage />
          </Protected>
        }
      />
      <Route
        path="/admin/teams"
        element={
          <Protected allowedRoles={['admin']}>
            <AdminTeamsPage />
          </Protected>
        }
      />
    </Routes>
      </Suspense>
    </PageTransition>
  );
}
