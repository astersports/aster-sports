import { useMemo } from 'react';

// useParentComingUp — the single "next event not already surfaced in Needs
// you" (shell contract v2). The full week lives on the Schedule tab. Pure
// selection over the already-org-scoped activities from useActivities;
// excludeEventIds are the events already shown as Needs-you actions.
export function useParentComingUp(activities, nowMs, excludeEventIds = []) {
  const excludeKey = excludeEventIds.join(',');
  return useMemo(() => {
    const exclude = new Set(excludeEventIds);
    const upcoming = (activities || [])
      .filter((a) => a.start_at && a.status !== 'cancelled'
        && new Date(a.start_at).getTime() >= nowMs && !exclude.has(a.id))
      .sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
    return upcoming[0] || null;
    // excludeKey is the stable primitive form of excludeEventIds.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, nowMs, excludeKey]);
}
