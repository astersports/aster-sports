import { memo, useMemo } from 'react';
import { useNow } from '../../hooks/useNow';
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
// Also closes audit C2: enrichedPlayers no longer sits in a render tree
// that re-evaluates every minute.
function TeamDetailHeroSlot({ team, role, summary, myChild, myChildPlayer, activities, teamId }) {
  const now = useNow();
  const nextEvent = useMemo(
    () => (activities || [])
      .filter((a) => a.team_id === teamId && a.status !== 'cancelled' && a.start_at)
      .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
      .find((a) => new Date(a.start_at).getTime() >= now),
    [activities, teamId, now],
  );
  return (
    <TeamDetailHero
      team={team}
      role={role}
      summary={summary}
      myChild={myChild}
      myChildPlayer={myChildPlayer}
      nextEvent={nextEvent}
    />
  );
}

export default memo(TeamDetailHeroSlot);
