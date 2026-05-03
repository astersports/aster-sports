import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
import { useAdminStats } from '../hooks/useAdminStats';
import { useSeasons } from '../hooks/useSeasons';
import { usePrograms } from '../hooks/usePrograms';
import { useActivities } from '../hooks/useActivities';
import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
import { useNow } from '../hooks/useNow';
import KpiGrid from '../components/admin/KpiGrid';
import QuickActions from '../components/admin/QuickActions';
import ActiveSeasonCard from '../components/admin/ActiveSeasonCard';
import NextEventCard from '../components/admin/NextEventCard';
import TeamPerformanceStrip from '../components/admin/TeamPerformanceStrip';
import GettingStarted from '../components/admin/GettingStarted';
import AdminGreeting from '../components/admin/AdminGreeting';
import Label from '../components/shared/Label';

export default function AdminHomePage() {
  const { user, signOut } = useAuth();
  const { activeSeason } = useSeason();
  const stats = useAdminStats();
  const { seasons } = useSeasons();
  const { programs } = usePrograms();
  const { activities, refetch } = useActivities();
  useRefetchOnVisible(refetch);
  const now = useNow();
  const navigate = useNavigate();
  const nextEvent = useMemo(() => activities.find((a) => a.start_at && a.status !== 'cancelled' && new Date(a.start_at).getTime() >= now) || null, [activities, now]);

  // Temporary sign-out affordance until the Account page is built. Lives
  // at the bottom of the admin dashboard so it's reachable without
  // needing a top-nav menu yet.
  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  // overflow-x-hidden + max-w-full on the page wrapper is defense in
  // depth — even if a child component escapes its box, nothing drags
  // the page horizontally. `min-w-0` on each section lets flex children
  // actually shrink below their content width (the default is auto,
  // which refuses to shrink and widens the parent).
  return (
    <div className="px-4 py-5 flex flex-col gap-6 sf-fade-in">
      <AdminGreeting user={user} />

      <section className="min-w-0" aria-label="Key metrics">
        <KpiGrid stats={stats} />
      </section>

      <section className="min-w-0" aria-label="Quick actions">
        <Label>QUICK ACTIONS</Label>
        <QuickActions />
      </section>

      <section className="min-w-0">
        <Label>TEAMS</Label>
        <TeamPerformanceStrip programs={programs} navigate={navigate} />
      </section>

      <section className="min-w-0" aria-label="Active season">
        <Label>SEASON</Label>
        <ActiveSeasonCard season={activeSeason} />
        <NextEventCard event={nextEvent} />
      </section>

      <GettingStarted
        hasSeasons={seasons.length > 0}
        hasPrograms={programs.length > 0}
      />

      {/* TEMP: sign-out affordance until the Account page is built. */}
      <div style={{ borderTop: '1px solid var(--em-border-subtle)', paddingTop: 12 }}>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full sf-press flex items-center justify-between"
          style={{
            minHeight: 44,
            padding: '0 4px',
            background: 'none',
            border: 'none',
            color: 'var(--em-danger)',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <span>Sign out</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  );
}
