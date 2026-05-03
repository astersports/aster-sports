import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { usePrefetchChildRsvps } from '../hooks/usePrefetchChildRsvps';
import { useRefetchOnVisible } from '../hooks/useRefetchOnVisible';
import { useNow } from '../hooks/useNow';
import { useEventRideCounts } from '../hooks/useEventRideCounts';
import { useEventDutyCounts } from '../hooks/useEventDutyCounts';
import { useOrgTeamRecords } from '../hooks/useOrgTeamRecords';
import ThisWeekRow from '../components/schedule/ThisWeekRow';
import ChildFilterChips from '../components/schedule/ChildFilterChips';
import MyTeamsStrip from '../components/home/MyTeamsStrip';
import TextEmptyState from '../components/shared/TextEmptyState';
import LoadingSkeleton from '../components/shared/LoadingSkeleton';
import Label from '../components/shared/Label';
import { groupByDate, formatDateHeader } from '../lib/scheduleHelpers';
import { detectConflicts } from '../lib/conflicts';
import { firstNameFrom, greetingFor } from '../lib/greetings';

export default function ParentHomePage() {
  const { user, guardianFirstName, myChildren, orgId } = useAuth();
  const { activities, loading, refetch } = useActivities();
  const { byTeamId: recordsByTeam, loading: recordsLoading } = useOrgTeamRecords(orgId);
  const navigate = useNavigate();
  const [activeKidFilter, setActiveKidFilter] = useState(null);
  const name = guardianFirstName ? guardianFirstName.charAt(0).toUpperCase() + guardianFirstName.slice(1) : firstNameFrom(user);
  usePrefetchChildRsvps(activities, myChildren);
  const now = useNow(), cutoff = now + 7 * 24 * 60 * 60 * 1000;
  useRefetchOnVisible(refetch);

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

  const todayStart = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }, []);
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
    const teamId = kid?.teamId ?? null;
    if (!teamId) return next7days;
    return next7days.filter((e) => e.team_id === teamId);
  }, [next7days, activeKidFilter, myChildren]);

  const rideCounts = useEventRideCounts(filteredNext7);
  const dutyCounts = useEventDutyCounts(filteredNext7);
  const conflictsByEvent = useMemo(() => detectConflicts(filteredNext7), [filteredNext7]);

  const [collapsedDates, setCollapsedDates] = useState(() => new Map());
  const dayMs = 24 * 60 * 60 * 1000;
  const isCollapsed = (dateStr) => {
    if (collapsedDates.has(dateStr)) return collapsedDates.get(dateStr);
    const d = new Date(dateStr + 'T12:00:00').getTime();
    return Math.floor((d - todayStart) / dayMs) > 2;
  };
  const toggleCollapse = (dateStr) => setCollapsedDates((prev) => {
    const next = new Map(prev); next.set(dateStr, !isCollapsed(dateStr)); return next;
  });
  if (loading) return <div style={{ padding: 24 }} role="status" aria-live="polite"><LoadingSkeleton variant="card" rows={2} /></div>;

  return (
    <div className="px-4 py-5 flex flex-col gap-6 sf-fade-in">
      <section>
        <div style={{ color: 'var(--em-text-tertiary)', fontSize: 13 }}>{greetingFor()},</div>
        <h1 className="font-bold" style={{ color: 'var(--em-text-primary)', fontSize: 24, letterSpacing: '-0.025em', lineHeight: 1.2 }}>{name}</h1>
      </section>

      <MyTeamsStrip
        teams={myTeams}
        byTeamId={recordsByTeam}
        loading={recordsLoading}
        onSelect={(teamId) => navigate(`/schedule?team=${teamId}`)}
      />

      <button type="button" onClick={() => navigate('/records')} className="sf-press"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '14px 16px', minHeight: 56, backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-default)', borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontSize: 15, fontWeight: 500, color: 'var(--em-text-primary)' }}>
        <span>View full season records</span>
        <span style={{ fontSize: 17, color: 'var(--em-text-tertiary)' }}>›</span>
      </button>

      <section>
        <Label>NEXT 7 DAYS</Label>
        <ChildFilterChips
          kids={myChildren}
          activeFilter={activeKidFilter}
          onChange={setActiveKidFilter}
        />
        {filteredNext7.length > 0 ? groupByDate(filteredNext7).map(([date, evts]) => {
          const collapsed = isCollapsed(date);
          return (
            <div key={date} style={{ marginTop: 12 }}>
              <button type="button" onClick={() => toggleCollapse(date)} className="sf-press"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '4px 0', minHeight: 32, background: 'none', border: 'none', cursor: 'pointer' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{formatDateHeader(date)}</span>
                {collapsed && <span style={{ fontSize: 11, color: 'var(--em-text-tertiary)' }}>{evts.length} event{evts.length !== 1 ? 's' : ''}</span>}
              </button>
              <div className="sf-collapsible" data-open={collapsed ? 'false' : 'true'}>
                <div className="sf-collapsible-inner">
                  <div className="flex flex-col gap-2" style={{ paddingTop: 6 }}>
                    {evts.map((e) => (
                      <ThisWeekRow key={e.id} event={e}
                        rideCount={rideCounts[e.id]} dutyCount={dutyCounts[e.id]}
                        conflictWith={conflictsByEvent[e.id]} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        }) : (
          <TextEmptyState heading="Nothing this week" message="No upcoming events in the next 7 days." />
        )}
      </section>
    </div>
  );
}
