import { useMemo } from 'react';
import { useNow } from './useNow';
import { useUnscoredGames } from './useUnscoredGames';
import { usePendingInvitations } from './usePendingInvitations';
import { usePendingAchievementsOrg } from './usePendingAchievementsOrg';
import { useCoachPayoutsPending } from './useCoachPayoutsPending';
import { useSeasonFinancials } from './useSeasonFinancials';

// §4.C Sprint D — Aggregates admin-home signal hooks into the two
// shells admin home renders today:
//   - actionItems  → ActionZone (per-item rows, time-critical)
//   - pendingLanes → PendingQueuesLanes (aggregate review queues)
// Lives in a hook so AdminHomePage stays under the 150-line cap
// (anti-pattern #11). Caller passes activities + orgId; hook owns
// the rest of the wiring.

export function useAdminHomeSignals(activities, orgId, activeSeasonId) {
  const now = useNow();
  void activities;
  // Frank-reported 2026-05-20: "Actions for admin should only include
  // scores and not RSVPs updates or it becomes a long list." Dropped
  // the lowRsvpEvents feed from the ActionZone. RSVP triage still
  // surfaces per-event on the Schedule page; the admin home lane is
  // now scoped to scores-not-entered + pending team invites — the two
  // items that genuinely block admin action.
  const { items: unscoredGames, loading: unscoredLoading } = useUnscoredGames(orgId, now);
  const { items: pendingInvitations, loading: invitationsLoading } = usePendingInvitations(orgId, now);
  const { count: achievementsPendingCount, loading: achievementsLoading } = usePendingAchievementsOrg(orgId);
  const { count: coachPayoutsPendingCount, loading: payoutsLoading } = useCoachPayoutsPending(orgId);
  const { stats: financialStats, loading: financialsLoading } = useSeasonFinancials(orgId, activeSeasonId);
  const familiesOwingCount = financialStats?.familiesOwing || 0;

  const actionItems = useMemo(
    () => [...(unscoredGames || []), ...(pendingInvitations || [])],
    [unscoredGames, pendingInvitations],
  );
  const actionLoading = unscoredLoading || invitationsLoading;

  const pendingLanes = useMemo(
    () => [
      { kind: 'achievements', emoji: '\u{1F3C6}', label: 'Achievements awaiting confirmation', count: achievementsPendingCount, href: '/admin/teams' },
      { kind: 'coach_payouts', emoji: '\u{1F4B0}', label: 'Coach payouts pending', count: coachPayoutsPendingCount, href: '/admin/financials' },
      { kind: 'families_owing', emoji: '\u{1F4B3}', label: 'Families with outstanding balance', count: familiesOwingCount, href: '/admin/financials' },
    ],
    [achievementsPendingCount, coachPayoutsPendingCount, familiesOwingCount],
  );
  const pendingLanesLoading = achievementsLoading || payoutsLoading || financialsLoading;

  return { actionItems, actionLoading, pendingLanes, pendingLanesLoading };
}
