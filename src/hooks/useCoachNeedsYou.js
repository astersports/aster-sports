import { useMemo } from 'react';
import { useCoachHomeSignals } from './useCoachHomeSignals';
import { formatEventTitleString } from '../lib/eventTitle';
import { alertToActionItem } from '../lib/home/coachHomeData';

// useCoachNeedsYou — owns the coach "Needs you" signals (shell contract v2).
// Day-one scope (HOME_DAYONE): the prep card for the next TEAM event (Rule 1
// — coach scopes to team via team_staff until event_coach_assignments is
// populated) + the action chips, then RSVP shortfall + coach action queue
// (unpublished scores, pending achievements). Roster-health is deferred
// (check_ins = 0). Capped at CAP with a "see all" overflow. Re-exports
// myTeams so the page doesn't double-call useCoachHomeSignals.
const PREP_CHIPS = [
  { label: 'Check-In', to: '/schedule' },
  { label: 'Quick Score', to: '/records' },
  { label: 'Message', to: '/messages' },
  { label: 'Briefings', to: '/team-briefings' },
];
const CAP = 4;

export function useCoachNeedsYou({ userId, activities, nowMs }) {
  const {
    myTeams, coachedTeamIds, coachAlerts, actionQueueItems,
    alertsLoading, actionQueueLoading,
  } = useCoachHomeSignals(userId, nowMs);

  const teamSet = useMemo(() => new Set(coachedTeamIds), [coachedTeamIds]);
  const prep = useMemo(() => {
    const next = (activities || [])
      .filter((a) => a.start_at && a.status !== 'cancelled' && teamSet.has(a.team_id)
        && new Date(a.start_at).getTime() >= nowMs)
      .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))[0];
    if (!next) return null;
    return {
      domain: 'prep', id: 'prep', event_id: next.id,
      title: formatEventTitleString(next),
      start_at: next.start_at, team_name: next.teams?.name || '',
      team_color: next.teams?.team_color || 'var(--as-accent)', chips: PREP_CHIPS,
    };
  }, [activities, teamSet, nowMs]);

  const items = useMemo(() => {
    const alertItems = (coachAlerts || []).map(alertToActionItem);
    const queueItems = (actionQueueItems || []).map((q, i) => ({
      domain: 'generic', id: `q-${q.kind}-${i}`, primary: q.primary, to: '/records',
    }));
    return [...(prep ? [prep] : []), ...alertItems, ...queueItems];
  }, [prep, coachAlerts, actionQueueItems]);

  return {
    items: items.slice(0, CAP),
    overflowCount: Math.max(0, items.length - CAP),
    totalCount: items.length,
    loading: alertsLoading || actionQueueLoading,
    onRsvpResolved: () => {}, // coach NeedsYou has no inline RSVP
    myTeams,
  };
}
