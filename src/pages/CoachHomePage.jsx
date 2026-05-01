// src/pages/CoachHomePage.jsx
// Coach home: greeting + NEXT UP (NextUpCard) + MY TEAMS + sign-out.

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
import { useEventRsvpCounts } from '../hooks/useEventRsvpCounts';
import { useEventRideCounts } from '../hooks/useEventRideCounts';
import { useEventDutyCounts } from '../hooks/useEventDutyCounts';
import { useNow } from '../hooks/useNow';
import AdminGreeting from '../components/admin/AdminGreeting';
import SectionShell from '../components/home/SectionShell';
import NextUpCard from '../components/schedule/NextUpCard';
import ParentHomeTeamCard from '../components/home/ParentHomeTeamCard';

export default function CoachHomePage() {
  const { user, signOut } = useAuth();
  const { activities, loading, error, refetch } = useActivities();
  const navigate = useNavigate();
  useRefetchOnVisible(refetch);
  const now = useNow();
  const rsvpCounts = useEventRsvpCounts(activities);
  const rideCounts = useEventRideCounts(activities);
  const dutyCounts = useEventDutyCounts(activities);
  const nextEvent = useMemo(() => activities.find((a) => a.start_at && a.status !== 'cancelled' && new Date(a.start_at).getTime() >= now) || null, [activities, now]);

  const myTeams = useMemo(() => {
    const map = new Map();
    for (const a of activities) {
      if (!a.team_id || map.has(a.team_id)) continue;
      map.set(a.team_id, {
        id: a.team_id,
        name: a.teams?.name || '—',
        team_color: a.teams?.team_color || 'var(--em-neutral)',
        sort_order: a.teams?.sort_order ?? 999,
      });
    }
    return [...map.values()].sort((x, y) => x.sort_order - y.sort_order);
  }, [activities]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="px-4 py-5 flex flex-col gap-6 sf-fade-in">
      <AdminGreeting user={user} />

      <SectionShell
        title="NEXT UP"
        sectionKey="coach-now"
        loading={loading}
        error={error}
        skeletonVariant="card"
        skeletonRows={1}
        empty={!nextEvent ? { heading: 'All caught up', message: 'No upcoming events scheduled.' } : null}
      >
        {nextEvent && <NextUpCard event={nextEvent} rsvpCount={rsvpCounts[nextEvent.id]} rideCount={rideCounts[nextEvent.id]} dutyCount={dutyCounts[nextEvent.id]} onRefresh={refetch} />}
      </SectionShell>

      <SectionShell
        title="MY TEAMS"
        sectionKey="coach-my-teams"
        loading={loading && myTeams.length === 0}
        skeletonVariant="row"
        empty={myTeams.length === 0 ? { heading: 'No teams yet', message: 'Once an admin assigns you to a team, it appears here.' } : null}
      >
        <div className="flex gap-2 overflow-x-auto sf-no-scrollbar" style={{ paddingBottom: 6 }}>
          {myTeams.map((t) => (
            <ParentHomeTeamCard
              key={t.id}
              team={t}
              onClick={() => navigate(`/schedule?team=${t.id}`)}
            />
          ))}
        </div>
      </SectionShell>

      {/* TEMP: sign-out affordance until Account page is built. Parity with AdminHomePage. */}
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
