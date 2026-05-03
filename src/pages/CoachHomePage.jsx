import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
import { useNow } from '../hooks/useNow';
import AdminGreeting from '../components/admin/AdminGreeting';
import SectionShell from '../components/home/SectionShell';
import DateGroupedList from '../components/schedule/DateGroupedList';
import { useDensity } from '../hooks/useDensity';
import ParentHomeTeamCard from '../components/home/ParentHomeTeamCard';

export default function CoachHomePage() {
  const { user, signOut } = useAuth();
  const { activities, loading, error, refetch } = useActivities();
  const navigate = useNavigate();
  useRefetchOnVisible(refetch);
  const now = useNow();
  const weekEnd = useMemo(() => now + 7 * 24 * 60 * 60 * 1000, [now]);
  const thisWeek = useMemo(() => activities.filter((a) => {
    if (!a.start_at || a.status === 'cancelled') return false;
    const t = new Date(a.start_at).getTime();
    return t >= now - 48 * 60 * 60 * 1000 && t <= weekEnd;
  }).sort((a, b) => new Date(a.start_at) - new Date(b.start_at)), [activities, now, weekEnd]);
  const { density } = useDensity('coach-schedule', 'medium');

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
        title="THIS WEEK"
        sectionKey="coach-now"
        loading={loading}
        error={error}
        skeletonVariant="card"
        skeletonRows={2}
        empty={thisWeek.length === 0 ? { heading: 'All caught up', message: 'No events in the next 7 days.' } : null}
      >
        {thisWeek.length > 0 && <DateGroupedList events={thisWeek} density={density} />}
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
