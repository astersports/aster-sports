import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { useEventRsvpCounts } from '../hooks/useEventRsvpCounts';
import { useEventRideCounts } from '../hooks/useEventRideCounts';
import { useGameResultsMap } from '../hooks/useGameResultsMap';
import { useWeather } from '../hooks/useWeather';
import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
import { useNow } from '../hooks/useNow';
import { supabase } from '../lib/supabase';
import AdminGreeting from '../components/admin/AdminGreeting';
import SectionShell from '../components/home/SectionShell';
import DateGroupedList from '../components/schedule/DateGroupedList';
import PastEventsSection from '../components/schedule/PastEventsSection';
import DensityToggle from '../components/home/DensityToggle';
import { useDensity } from '../hooks/useDensity';
import ParentHomeTeamCard from '../components/home/ParentHomeTeamCard';

export default function CoachHomePage() {
  const { user } = useAuth();
  const { activities, loading, error, refetch } = useActivities();
  const { counts: rsvpCounts, refetch: refetchRsvpCounts } = useEventRsvpCounts(activities);
  const { counts: rideCounts } = useEventRideCounts(activities);
  const gameResults = useGameResultsMap(activities);
  const weather = useWeather(41.03, -73.76);
  const navigate = useNavigate();
  useRefetchOnVisible(refetch);
  const now = useNow();
  const weekEnd = useMemo(() => now + 7 * 24 * 60 * 60 * 1000, [now]);
  const thisWeek = useMemo(() => activities.filter((a) => {
    if (!a.start_at || a.status === 'cancelled') return false;
    const t = new Date(a.start_at).getTime();
    return t >= now && t <= weekEnd;
  }).sort((a, b) => new Date(a.start_at) - new Date(b.start_at)), [activities, now, weekEnd]);
  const { density } = useDensity('coach-schedule');

  const [myTeams, setMyTeams] = useState([]);
  useEffect(() => {
    if (!user?.id) return;
    Promise.resolve().then(async () => {
      const { data } = await supabase.from('team_staff').select('team_id, teams(id, name, team_color, sort_order)').eq('user_id', user.id);
      const teams = (data || []).filter((r) => r.teams).map((r) => ({ id: r.teams.id, name: r.teams.name, team_color: r.teams.team_color, sort_order: r.teams.sort_order ?? 999 }));
      setMyTeams(teams.sort((a, b) => a.sort_order - b.sort_order));
    });
  }, [user?.id]);


  return (
    <div className="px-4 py-5 flex flex-col gap-6 sf-fade-in">
      <AdminGreeting user={user} />

      <SectionShell
        title="NEXT 7 DAYS"
        titleAction={<DensityToggle sectionKey="coach-schedule" />}
        sectionKey="coach-now"
        loading={loading}
        error={error}
        skeletonVariant="card"
        skeletonRows={2}
        empty={thisWeek.length === 0 ? { heading: 'All caught up', message: 'No events in the next 7 days.' } : null}
      >
        {thisWeek.length > 0 && <DateGroupedList events={thisWeek} density={density} rsvpCounts={rsvpCounts} rideCounts={rideCounts} gameResults={gameResults} weather={weather} onRsvpChange={refetchRsvpCounts} />}
      </SectionShell>

      <PastEventsSection activities={activities} rsvpCounts={rsvpCounts} rideCounts={rideCounts} gameResults={gameResults} weather={weather} onRsvpChange={refetchRsvpCounts} />

      <SectionShell
        title="MY TEAMS"
        sectionKey="coach-my-teams"
        loading={loading && myTeams.length === 0}
        skeletonVariant="row"
        empty={myTeams.length === 0 ? { heading: 'No teams yet', message: 'Once an admin assigns you to a team, it appears here.' } : null}
      >
        <div className="flex gap-2 flex-wrap" style={{ paddingBottom: 4 }}>
          {myTeams.map((t) => (
            <ParentHomeTeamCard
              key={t.id}
              team={t}
              onClick={() => navigate(`/schedule?team=${t.id}`)}
            />
          ))}
        </div>
      </SectionShell>

    </div>
  );
}
