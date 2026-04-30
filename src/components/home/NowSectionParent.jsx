// src/components/home/NowSectionParent.jsx
// Phase 1 Step 5E-2a: NEXT UP section extracted from ParentHomePage.
// Wraps the per-team NextUpCard pattern in SectionShell with a DensityToggle
// in the title action slot. Density persistence works in 5E-2a; content
// variants per density land in 5E-2b.
//
// Props are passed in (not fetched) to avoid double subscriptions:
//   activities  — array from useActivities
//   loading     — boolean
//   error       — Error | string | null
//   myChildren  — array from useAuth (used by NextUpCard for per-child RSVPs)

import { useMemo } from 'react';
import NextUpCard from '../schedule/NextUpCard';
import SectionShell from './SectionShell';
import DensityToggle from './DensityToggle';
import { useEventRsvpCounts } from '../../hooks/useEventRsvpCounts';
import { useEventRideCounts } from '../../hooks/useEventRideCounts';
import { useEventDutyCounts } from '../../hooks/useEventDutyCounts';
import { useNow } from '../../hooks/useNow';
import { useDensity } from '../../hooks/useDensity';

const SECTION_KEY = 'parent-now';

function EmptyLine({ children }) {
  return (
    <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)', padding: '8px 12px', marginBottom: 8 }}>
      {children}
    </div>
  );
}

export default function NowSectionParent({ activities = [], loading = false, error = null, onRetry }) {
  const now = useNow();
  const { density } = useDensity(SECTION_KEY);
  const rsvpCounts = useEventRsvpCounts(activities);
  const rideCounts = useEventRideCounts(activities);
  const dutyCounts = useEventDutyCounts(activities);

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

  const populatedPairs = myTeams
    .filter((t) => nextByTeam[t.id])
    .map((t) => ({ team: t, event: nextByTeam[t.id] }))
    .sort((a, b) => new Date(a.event.start_at) - new Date(b.event.start_at));
  const emptyTeams = myTeams.filter((t) => !nextByTeam[t.id]);

  const teamsWithUpcoming = Object.keys(nextByTeam).length;
  const empty = !loading && !error && (
    myTeams.length === 0
      ? { heading: 'No teams yet', message: 'Once you are linked to a child on a team, their next event appears here.' }
      : teamsWithUpcoming === 0
        ? { heading: 'All caught up', message: 'No upcoming events for your teams. Check back when the schedule updates.' }
        : null
  );

  return (
    <SectionShell
      title="NEXT UP"
      titleAction={<DensityToggle sectionKey={SECTION_KEY} />}
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={empty}
      sectionKey={SECTION_KEY}
      skeletonVariant="card"
      skeletonRows={1}
    >
      {populatedPairs.map(({ event }) => (
        <NextUpCard
          key={event.id}
          event={event}
          rsvpCount={rsvpCounts[event.id]}
          rideCount={rideCounts[event.id]}
          dutyCount={dutyCounts[event.id]}
          density={density}
        />
      ))}
      {emptyTeams.map((t) => (
        <EmptyLine key={t.id}>No upcoming events for {t.name}</EmptyLine>
      ))}
    </SectionShell>
  );
}
