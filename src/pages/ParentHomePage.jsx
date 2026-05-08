import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { usePrefetchChildRsvps } from '../hooks/usePrefetchChildRsvps';
import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
import { useNow } from '../hooks/useNow';
import { useEventRsvpCounts } from '../hooks/useEventRsvpCounts';
import { useEventRideCounts } from '../hooks/useEventRideCounts';
import { useEventDutyCounts } from '../hooks/useEventDutyCounts';
import { useGameResultsMap } from '../hooks/useGameResultsMap';
import { useWeather } from '../hooks/useWeather';
import { useOrgTeamRecords } from '../hooks/useOrgTeamRecords';
import { useDensity } from '../hooks/useDensity';
import DateGroupedList from '../components/schedule/DateGroupedList';
import ChildFilterChips from '../components/schedule/ChildFilterChips';
import PastEventsSection from '../components/schedule/PastEventsSection';
import MyTeamsStrip from '../components/home/MyTeamsStrip';
import DensityToggle from '../components/home/DensityToggle';
import TextEmptyState from '../components/shared/TextEmptyState';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import Label from '../components/shared/Label';
import { firstNameFrom, greetingFor } from '../lib/greetings';

export default function ParentHomePage() {
  const { user, guardianFirstName, myChildren, orgId, orgName } = useAuth();
  const { activities, loading, refetch } = useActivities();
  const { byTeamId: recordsByTeam, loading: recordsLoading } = useOrgTeamRecords(orgId);
  const navigate = useNavigate();
  const [activeKidFilter, setActiveKidFilter] = useState(null);
  const name = guardianFirstName ? guardianFirstName.charAt(0).toUpperCase() + guardianFirstName.slice(1) : firstNameFrom(user);
  usePrefetchChildRsvps(activities, myChildren);
  const now = useNow(), cutoff = now + 7 * 24 * 60 * 60 * 1000;
  useRefetchOnVisible(refetch);
  const { density } = useDensity('parent-home', 'medium');

  const myTeams = useMemo(() => {
    const map = new Map();
    for (const a of activities) {
      if (!a.team_id || map.has(a.team_id)) continue;
      map.set(a.team_id, { id: a.team_id, name: a.teams?.name || '—', team_color: a.teams?.team_color || 'var(--em-neutral)', sort_order: a.teams?.sort_order ?? 999 });
    }
    return [...map.values()].sort((x, y) => x.sort_order - y.sort_order);
  }, [activities]);

  const next7days = useMemo(() => activities
    .filter((a) => {
      if (!a.start_at) return false;
      const startT = new Date(a.start_at).getTime();
      return startT >= now && startT < cutoff && a.status !== 'cancelled';
    })
    .sort((a, b) => new Date(a.start_at) - new Date(b.start_at)),
    [activities, now, cutoff]);

  const filteredNext7 = useMemo(() => {
    if (!activeKidFilter) return next7days;
    const kid = (myChildren || []).find((k) => k.playerId === activeKidFilter);
    const ids = kid?.teamIds?.length ? kid.teamIds : (kid?.teamId ? [kid.teamId] : []);
    if (!ids.length) return next7days;
    return next7days.filter((e) => ids.includes(e.team_id));
  }, [next7days, activeKidFilter, myChildren]);

  const { counts: rsvpCounts, refetch: refetchRsvpCounts } = useEventRsvpCounts(filteredNext7);
  const { counts: rideCounts } = useEventRideCounts(filteredNext7);
  const { counts: dutyCounts } = useEventDutyCounts(filteredNext7);
  const gameResults = useGameResultsMap(filteredNext7);
  const weather = useWeather(41.03, -73.76);
  const nextEventId = filteredNext7.find((a) => new Date(a.start_at).getTime() >= now)?.id || null;

  if (loading) return <div style={{ padding: 24 }} role="status" aria-live="polite"><LoadingSkeleton variant="card" count={2} /></div>;

  return (
    <div className="px-4 py-5 flex flex-col gap-6 sf-fade-in">
      <section>
        <div style={{ color: 'var(--em-text-tertiary)', fontSize: 13 }}>{greetingFor()},</div>
        <h1 className="font-bold" style={{ color: 'var(--em-text-primary)', fontSize: 24, letterSpacing: '-0.025em', lineHeight: 1.2 }}>{name}</h1>
        {orgName && <div style={{ color: 'var(--em-text-tertiary)', fontSize: 13, marginTop: 2 }}>{orgName}{myTeams.length > 0 ? ` · ${myTeams.length} team${myTeams.length !== 1 ? 's' : ''}` : ''}</div>}
      </section>

      {!loading && myTeams.length === 0 && (
        <div style={{ padding: 20, backgroundColor: 'var(--em-bg-card)', borderRadius: 10, border: '1px solid var(--em-border-default)', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏀</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 4 }}>Welcome to {orgName || 'the team'}</div>
          <div style={{ fontSize: 14, color: 'var(--em-text-secondary)', lineHeight: 1.5 }}>Your coach is getting things set up. Once your child is added to a team, their schedule and events will appear here.</div>
        </div>
      )}

      {myTeams.length > 0 && (
        <>
          <MyTeamsStrip teams={myTeams} byTeamId={recordsByTeam} loading={recordsLoading} onSelect={(teamId) => navigate(`/teams/${teamId}`)} />
          <button type="button" onClick={() => navigate('/records')} className="sf-press"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 16px', minHeight: 44, backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-default)', borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontSize: 15, fontWeight: 500, color: 'var(--em-text-primary)' }}>
            <span>View full season records</span>
            <span style={{ fontSize: 17, color: 'var(--em-text-tertiary)' }}>›</span>
          </button>
        </>
      )}

      <section>
        <ChildFilterChips kids={myChildren} activeFilter={activeKidFilter} onChange={setActiveKidFilter} />
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <Label style={{ marginBottom: 0 }}>NEXT 7 DAYS</Label>
          <DensityToggle sectionKey="parent-home" />
        </div>
        {filteredNext7.length > 0 ? (
          <DateGroupedList events={filteredNext7} rsvpCounts={rsvpCounts} rideCounts={rideCounts} dutyCounts={dutyCounts} nextEventId={nextEventId} density={density} gameResults={gameResults} weather={weather} onRsvpChange={refetchRsvpCounts} />
        ) : (
          <TextEmptyState heading="Clear week ahead" message="No events coming up. Time to work on those crossovers." />
        )}
        <PastEventsSection activities={activities} rsvpCounts={rsvpCounts} rideCounts={rideCounts} dutyCounts={dutyCounts} gameResults={gameResults} weather={weather} onRsvpChange={refetchRsvpCounts} />
      </section>
    </div>
  );
}
