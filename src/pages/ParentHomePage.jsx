import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { useEventRsvpCounts } from '../hooks/useEventRsvpCounts';
import { useEventRideCounts } from '../hooks/useEventRideCounts';
import { useEventDutyCounts } from '../hooks/useEventDutyCounts';
import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
import { useNow } from '../hooks/useNow';
import NextUpCard from '../components/schedule/NextUpCard';
import CompactCard from '../components/schedule/CompactCard';
import ChildFilterChips from '../components/schedule/ChildFilterChips';
import ParentHomeTeamCard from '../components/home/ParentHomeTeamCard';
import TextEmptyState from '../components/shared/TextEmptyState';
import { groupByDate, formatDateHeader } from '../lib/scheduleHelpers';

function firstNameFrom(user) {
  const f = (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || '').split(/[\s.@]/)[0];
  return f ? f.charAt(0).toUpperCase() + f.slice(1) : 'there';
}

function greetingFor(date = new Date()) {
  const h = date.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function ParentHomePage() {
  const { user, guardianFirstName, myChildren } = useAuth();
  const { activities, loading, refetch } = useActivities();
  const rsvpCounts = useEventRsvpCounts(activities);
  const rideCounts = useEventRideCounts(activities);
  const dutyCounts = useEventDutyCounts(activities);
  const navigate = useNavigate();
  const [activeKidFilter, setActiveKidFilter] = useState(null);
  const name = guardianFirstName ? guardianFirstName.charAt(0).toUpperCase() + guardianFirstName.slice(1) : firstNameFrom(user);
  const now = useNow(), weekEnd = now + 7 * 24 * 60 * 60 * 1000;
  useRefetchOnVisible(refetch);

  const myTeams = useMemo(() => {
    const map = new Map();
    for (const a of activities) {
      if (!a.team_id || map.has(a.team_id)) continue;
      map.set(a.team_id, {
        id: a.team_id,
        name: a.teams?.name || '—',
        team_color: a.teams?.team_color || 'var(--sf-neutral)',
        sort_order: a.teams?.sort_order ?? 999,
      });
    }
    return [...map.values()].sort((x, y) => x.sort_order - y.sort_order);
  }, [activities]);

  const nextByTeam = useMemo(() => {
    const out = {};
    const sorted = [...activities].sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
    for (const a of sorted) {
      if (!a.team_id || a.status === 'cancelled') continue;
      if (new Date(a.start_at).getTime() < now) continue;
      if (!out[a.team_id]) out[a.team_id] = a;
    }
    return out;
  }, [activities, now]);

  const nextEventOverall = activities.find((a) => a.start_at && a.status !== 'cancelled' && new Date(a.start_at).getTime() >= now) || null;
  const thisWeek = useMemo(() => activities
    .filter((a) => {
      if (!a.start_at || a.status === 'cancelled') return false;
      const t = new Date(a.start_at).getTime();
      return t >= now && t <= weekEnd;
    })
    .sort((a, b) => new Date(a.start_at) - new Date(b.start_at)),
    [activities, now, weekEnd]);

  const filteredThisWeek = useMemo(() => {
    if (!activeKidFilter) return thisWeek;
    const kid = (myChildren || []).find((k) => k.playerId === activeKidFilter);
    const teamId = kid?.teamId ?? null;
    if (!teamId) return thisWeek;
    return thisWeek.filter((e) => e.team_id === teamId);
  }, [thisWeek, activeKidFilter, myChildren]);

  if (loading) return <div style={{ padding: 24, color: 'var(--sf-text-tertiary)' }}>Loading...</div>;

  return (
    <div className="px-4 py-5 flex flex-col gap-6 sf-fade-in">
      <section>
        <div style={{ color: 'var(--sf-text-tertiary)', fontSize: 13 }}>{greetingFor()},</div>
        <h1 className="font-bold" style={{ color: 'var(--sf-text-primary)', fontSize: 24, letterSpacing: '-0.025em', lineHeight: 1.2 }}>{name}</h1>
      </section>

      <section>
        <SectionHeader>NEXT UP</SectionHeader>
        {myTeams.length === 0 ? <EmptyLine>No teams yet</EmptyLine> : !Object.keys(nextByTeam).length ? <TextEmptyState heading="All caught up" message="No upcoming events for your teams. Check back when the schedule updates." />
          : myTeams.map((t) => (
            nextByTeam[t.id]
              ? <NextUpCard key={t.id} event={nextByTeam[t.id]} rsvpCount={rsvpCounts[nextByTeam[t.id].id]} rideCount={rideCounts[nextByTeam[t.id].id]} dutyCount={dutyCounts[nextByTeam[t.id].id]} />
              : <EmptyLine key={t.id}>No upcoming events for {t.name}</EmptyLine>
          ))}
      </section>

      {myTeams.length > 0 && (
        <section>
          <SectionHeader>MY TEAMS</SectionHeader>
          <div className="flex gap-2 overflow-x-auto sf-no-scrollbar" style={{ paddingBottom: 6 }}>
            {myTeams.map((t) => <ParentHomeTeamCard key={t.id} team={t} onClick={() => navigate(`/schedule?team=${t.id}`)} />)}
          </div>
        </section>
      )}

      <section>
        <SectionHeader>THIS WEEK</SectionHeader>
        <ChildFilterChips
          kids={myChildren}
          activeFilter={activeKidFilter}
          onChange={setActiveKidFilter}
        />
        {filteredThisWeek.length > 0 ? groupByDate(filteredThisWeek).map(([date, evts]) => (
          <div key={date}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sf-text-tertiary)', marginTop: 12, marginBottom: 6, textTransform: 'uppercase' }}>
              {formatDateHeader(date)}
            </div>
            <div className="flex flex-col gap-2">
              {evts.map((e) => <CompactCard key={e.id} event={e} />)}
            </div>
          </div>
        )) : (
          <TextEmptyState heading="Nothing this week" message={nextEventOverall ? `Your next event is ${new Date(nextEventOverall.start_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}` : 'No upcoming events scheduled'} />
        )}
      </section>
    </div>
  );
}

function SectionHeader({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--sf-text-tertiary)', marginBottom: 8 }}>
      {children}
    </div>
  );
}

function EmptyLine({ children }) {
  return (
    <div style={{ fontSize: 13, color: 'var(--sf-text-tertiary)', padding: '8px 12px', marginBottom: 8 }}>
      {children}
    </div>
  );
}

