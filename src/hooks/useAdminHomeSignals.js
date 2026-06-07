import { useMemo } from 'react';
import { useNow } from './useNow';
import { useUnscoredGames } from './useUnscoredGames';
import { usePendingInvitations } from './usePendingInvitations';

// §4.C Sprint D — aggregates the admin-home ActionZone signal hooks:
//   - actionItems → ActionZone (per-item rows, time-critical)
// Lives in a hook so AdminHomePage stays under the 150-line cap
// (anti-pattern #11). Caller passes activities + orgId; hook owns
// the rest of the wiring.
//
// pendingLanes/PendingQueuesLanes retired 2026-06-07 (cross-section scan
// §4.S.3): the aggregate had ZERO consumers (no mounted PendingQueuesLanes),
// so its useCoachPayoutsPending + useFamiliesOwingCount reads were dead
// queries — removed per AP#51. The live owing-count read stays on
// useAdminNeedsYou + AdminProgramHealth.

export function useAdminHomeSignals(activities, orgId, activeSeasonId) {
  const now = useNow();
  void activities;
  void activeSeasonId;
  // Frank-reported 2026-05-20: "Actions for admin should only include
  // scores and not RSVPs updates or it becomes a long list." Dropped
  // the lowRsvpEvents feed from the ActionZone. RSVP triage still
  // surfaces per-event on the Schedule page; the admin home lane is
  // now scoped to scores-not-entered + pending team invites — the two
  // items that genuinely block admin action.
  const { items: unscoredGames, loading: unscoredLoading } = useUnscoredGames(orgId, now);
  const { items: pendingInvitations, loading: invitationsLoading } = usePendingInvitations(orgId, now);

  const actionItems = useMemo(
    () => [...(unscoredGames || []), ...(pendingInvitations || [])],
    [unscoredGames, pendingInvitations],
  );
  const actionLoading = unscoredLoading || invitationsLoading;

  return { actionItems, actionLoading };
}
