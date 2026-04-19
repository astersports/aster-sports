import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { useEventRsvpCounts } from '../hooks/useEventRsvpCounts';
import { useEventRideCounts } from '../hooks/useEventRideCounts';
import { useEventDutyCounts } from '../hooks/useEventDutyCounts';
import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
import NextUpCard from '../components/schedule/NextUpCard';
import CompactCard from '../components/schedule/CompactCard';
import { groupByDate, formatDateHeader } from '../lib/scheduleHelpers';

function firstNameFrom(user) {
  const f = (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || '').split(/[\s.@]/)[0];
  return f ? f.charAt(0).toUpperCase() + f.slice(1) : 'there';
}

function greetingFor(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function ParentHomePage() {
  const { user, guardianFirstName } = useAuth();
  const { activities, loading, refetch } = useActivities();
  const rsvpCounts = useEventRsvpCounts(activities);
  const rideCounts = useEventRideCounts(activities);
  const dutyCounts = useEventDutyCounts(activities);
  const navigate = useNavigate();
  const name = guardianFirstName ? guardianFirstName.charAt(0).toUpperCase() + guardianFirstName.slice(1) : firstNameFrom(user);
  const now = Date.now(), weekEnd = now + 7 * 24 * 60 * 60 * 1000;
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

  const thisWeek = useMemo(() => activities
    .filter((a) => {
      if (!a.start_at || a.status === 'cancelled') return false;
      const t = new Date(a.start_at).getTime();
      return t >= now && t <= weekEnd;
    })
    .sort((a, b) => new Date(a.start_at) - new Date(b.start_at)),
    [activities, now, weekEnd]);

  if (loading) return <div style={{ padding: 24, color: 'var(--sf-text-tertiary)' }}>Loading...</div>;

  return (
    <div className="px-4 py-5 flex flex-col gap-6 sf-fade-in">
      <section>
        <div style={{ color: 'var(--sf-text-tertiary)', fontSize: 13 }}>{greetingFor()},</div>
        <h1 className="font-bold" style={{ color: 'var(--sf-text-primary)', fontSize: 24, letterSpacing: '-0.025em', lineHeight: 1.2 }}>{name}</h1>
        <div style={{ width: 40, height: 3, borderRadius: 999, backgroundColor: 'var(--sf-accent)', marginTop: 8 }} />
      </section>

      <section>
        <SectionHeader>NEXT UP</SectionHeader>
        {myTeams.length === 0 && <EmptyLine>No teams yet</EmptyLine>}
        {myTeams.map((t) => (
          nextByTeam[t.id]
            ? <NextUpCard key={t.id} event={nextByTeam[t.id]} rsvpCount={rsvpCounts[nextByTeam[t.id].id]} rideCount={rideCounts[nextByTeam[t.id].id]} dutyCount={dutyCounts[nextByTeam[t.id].id]} />
            : <EmptyLine key={t.id}>No upcoming events for {t.name}</EmptyLine>
        ))}
      </section>

      {myTeams.length > 0 && (
        <section>
          <SectionHeader>MY TEAMS</SectionHeader>
          <div className="flex gap-2 overflow-x-auto sf-no-scrollbar" style={{ paddingBottom: 6 }}>
            {myTeams.map((t) => <TeamCard key={t.id} team={t} onClick={() => navigate(`/teams/${t.id}`)} />)}
          </div>
        </section>
      )}

      {thisWeek.length > 0 && (
        <section>
          <SectionHeader>THIS WEEK</SectionHeader>
          {groupByDate(thisWeek).map(([date, evts]) => (
            <div key={date}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sf-text-tertiary)', marginTop: 12, marginBottom: 6, textTransform: 'uppercase' }}>
                {formatDateHeader(date)}
              </div>
              <div className="flex flex-col gap-2">
                {evts.map((e) => <CompactCard key={e.id} event={e} />)}
              </div>
            </div>
          ))}
        </section>
      )}
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

function TeamCard({ team, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="sf-press"
      style={{
        flexShrink: 0, minWidth: 140, minHeight: 80, padding: 12, borderRadius: 10,
        border: `2px solid ${team.team_color}`, backgroundColor: 'var(--sf-bg-card)',
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--sf-text-primary)' }}>{team.name}</span>
      <span style={{ fontSize: 12, color: 'var(--sf-text-tertiary)' }}>0-0</span>
    </button>
  );
}
