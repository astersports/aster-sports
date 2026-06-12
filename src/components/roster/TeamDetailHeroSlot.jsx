import { memo, useMemo } from 'react';
import { useNow } from '../../hooks/useNow';
import { isRsvpOpen } from '../../lib/eventWindows';
import { isStaff } from '../../lib/permissions';
import { cacheKey } from '../../lib/rsvpCache';
import TeamDetailHero from './TeamDetailHero';

// 2026-05-21 (Teams audit C7) — useNow lifted OUT of TeamDetailPage into
// this slot. Without this wrapper, the 60s useNow tick re-renders the
// whole page subtree (RosterSection, TeamHeatmap, TeamAchievements,
// UpcomingEvents) even though none of those care about time.
//
// The slot is the ONLY component on the team-detail page that needs to
// react to the minute tick — it derives nextEvent from activities +
// teamId + now. TeamDetailHero stays time-agnostic (preserves the
// existing per-role invariant test which passes nextEvent as a prop).
//
// Wave-2 F-7 (audit 2026-06-12): the slot also pre-shapes the hero's
// RSVP slice from the PAGE's useScheduleData instance (`data`) — counts
// carry the SD-6 denominator the schedule card shows, the parent control
// is batch-fed, and §10.1(2) hidden-roster suppression nulls the counts
// for non-staff. One source; the hero's per-event useEventRsvpCounts
// read (roster_members total, PATTERN A divergence) is gone.
function TeamDetailHeroSlot({ team, role, summary, myChild, myChildPlayer, activities, teamId, data }) {
  const now = useNow();
  const nextEvent = useMemo(
    () => (activities || [])
      .filter((a) => a.team_id === teamId && a.status !== 'cancelled' && a.start_at)
      .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
      .find((a) => new Date(a.start_at).getTime() >= now),
    [activities, teamId, now],
  );
  const { counts, childRsvpMap, activatedMap, countSuppressedByTeam, onRsvpSaved } = data || {};
  const suppressed = !isStaff(role) && !!countSuppressedByTeam?.[teamId];
  const nextCount = nextEvent && !suppressed ? (counts?.[nextEvent.id] ?? null) : null;
  const k = nextEvent && myChild ? cacheKey(nextEvent.id, myChild.playerId) : null;
  const rsvp = k ? {
    response: childRsvpMap ? (childRsvpMap[k] ?? null) : undefined,
    activated: activatedMap ? (activatedMap[k] ?? false) : undefined,
  } : undefined;
  return (
    <TeamDetailHero
      team={team}
      role={role}
      summary={summary}
      myChild={myChild}
      myChildPlayer={myChildPlayer}
      nextEvent={nextEvent}
      nextCount={nextCount}
      rsvp={rsvp}
      rsvpOpen={nextEvent ? isRsvpOpen(nextEvent.start_at, now) : true}
      onRsvpSaved={onRsvpSaved}
    />
  );
}

export default memo(TeamDetailHeroSlot);
