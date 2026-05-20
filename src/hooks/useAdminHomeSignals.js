import { useMemo } from 'react';
import { useNow } from './useNow';
import { useEventRsvpCounts } from './useEventRsvpCounts';
import { useLowRsvpEvents } from './useLowRsvpEvents';
import { useUnscoredGames } from './useUnscoredGames';
import { usePendingInvitations } from './usePendingInvitations';
import { useCoachPayoutsPending } from './useCoachPayoutsPending';
import { useSeasonFinancials } from './useSeasonFinancials';

// §4.C Sprint D — Aggregates admin-home signal hooks into the two
// shells admin home renders today:
//   - actionItems  → ActionZone (per-item rows, time-critical)
//   - pendingLanes → PendingQueuesLanes (aggregate review queues)
// Lives in a hook so AdminHomePage stays under the 150-line cap
// (anti-pattern #11). Caller passes activities + orgId; hook owns
// the rest of the wiring.

const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;

export function useAdminHomeSignals(activities, orgId, activeSeasonId) {
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
  const { count: coachPayoutsPendingCount, loading: payoutsLoading } = useCoachPayoutsPending(orgId);
  const { stats: financialStats, loading: financialsLoading } = useSeasonFinancials(orgId, activeSeasonId);
  const familiesOwingCount = financialStats?.familiesOwing || 0;

  const actionItems = useMemo(
    () => [...(lowRsvpItems || []), ...(unscoredGames || []), ...(pendingInvitations || [])],
    [lowRsvpItems, unscoredGames, pendingInvitations],
  );
  const actionLoading = unscoredLoading || invitationsLoading;

  // The achievements lane was removed 2026-05-20 — the REVIEW button
  // routed to /admin/teams (no actual review screen exists), so the
  // lane was dead UX. Frank archived the 3 stale seed-data rows via
  // MCP. Re-add this lane only when a dedicated achievement review
  // screen is built (anti-pattern #34: ship the consumer with the
  // surface, not before).
  const pendingLanes = useMemo(
    () => [
      { kind: 'coach_payouts', emoji: '\u{1F4B0}', label: 'Coach payouts pending', count: coachPayoutsPendingCount, href: '/admin/financials' },
      { kind: 'families_owing', emoji: '\u{1F4B3}', label: 'Families with outstanding balance', count: familiesOwingCount, href: '/admin/financials' },
    ],
    [coachPayoutsPendingCount, familiesOwingCount],
  );
  const pendingLanesLoading = payoutsLoading || financialsLoading;

  return { actionItems, actionLoading, pendingLanes, pendingLanesLoading };
}
