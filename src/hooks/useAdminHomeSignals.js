import { useMemo } from 'react';
import { useNow } from './useNow';
import { useEventRsvpCounts } from './useEventRsvpCounts';
import { useLowRsvpEvents } from './useLowRsvpEvents';
import { useUnscoredGames } from './useUnscoredGames';
import { usePendingInvitations } from './usePendingInvitations';
import { usePendingAchievementsOrg } from './usePendingAchievementsOrg';
import { useCoachPayoutsPending } from './useCoachPayoutsPending';

// §4.C Sprint D — Aggregates admin-home signal hooks into the two
// shells admin home renders today:
//   - actionItems  → ActionZone (per-item rows, time-critical)
//   - pendingLanes → PendingQueuesLanes (aggregate review queues)
// Lives in a hook so AdminHomePage stays under the 150-line cap
// (anti-pattern #11). Caller passes activities + orgId; hook owns
// the rest of the wiring.

const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;

export function useAdminHomeSignals(activities, orgId) {
  const now = useNow();
  const next72hActivities = useMemo(
    () => (activities || []).filter((a) => {
      if (!a?.start_at || a.status === 'cancelled') return false;
      const ms = new Date(a.start_at).getTime();
      return ms >= now && ms <= now + SEVENTY_TWO_HOURS_MS;
    }),
    [activities, now],
  );
  const { counts: rsvpCounts } = useEventRsvpCounts(next72hActivities);
  const lowRsvpItems = useLowRsvpEvents(next72hActivities, rsvpCounts, now);
  const { items: unscoredGames, loading: unscoredLoading } = useUnscoredGames(orgId, now);
  const { items: pendingInvitations, loading: invitationsLoading } = usePendingInvitations(orgId, now);
  const { count: achievementsPendingCount, loading: achievementsLoading } = usePendingAchievementsOrg(orgId);
  const { count: coachPayoutsPendingCount, loading: payoutsLoading } = useCoachPayoutsPending(orgId);

  const actionItems = useMemo(
    () => [...(lowRsvpItems || []), ...(unscoredGames || []), ...(pendingInvitations || [])],
    [lowRsvpItems, unscoredGames, pendingInvitations],
  );
  const actionLoading = unscoredLoading || invitationsLoading;

  const pendingLanes = useMemo(
    () => [
      { kind: 'achievements', emoji: '\u{1F3C6}', label: 'Achievements awaiting confirmation', count: achievementsPendingCount, href: '/admin/teams' },
      { kind: 'coach_payouts', emoji: '\u{1F4B0}', label: 'Coach payouts pending', count: coachPayoutsPendingCount, href: '/admin/financials' },
    ],
    [achievementsPendingCount, coachPayoutsPendingCount],
  );
  const pendingLanesLoading = achievementsLoading || payoutsLoading;

  return { actionItems, actionLoading, pendingLanes, pendingLanesLoading };
}
