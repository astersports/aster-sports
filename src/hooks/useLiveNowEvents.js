import { useMemo } from 'react';
import { formatEventTitleString } from '../lib/eventTitle';

// §4.C Sprint C — LIVE NOW card data. Pure derivation hook (no
// queries) — composes the live-event slice off the already-fetched
// activities + myChildren context. Re-renders when `now` ticks via
// the parent's useNow.
//
// Trigger per HOME_DESIGN_SPEC §1.1.3:
//   event.status = 'scheduled' AND
//   event.start_at <= now <= event.end_at AND
//   kid is on event's team
//
// Output: array of { event_id, kid_first_name, event_title,
//   start_at, end_at, team_color, team_name }. Multi-kid handled
//   naturally — if both Charlie (11U) and Milo (8U) have events
//   live simultaneously, two items.
//
// Empty when no kids OR no live events at this moment.

export function useLiveNowEvents(myChildren, activities, nowMs) {
  return useMemo(() => {
    if (!myChildren?.length || !activities?.length || !nowMs) return [];
    const out = [];
    for (const ev of activities) {
      if (!ev?.id || !ev?.team_id || !ev.start_at || !ev.end_at) continue;
      if (ev.status === 'cancelled') continue;
      const startMs = new Date(ev.start_at).getTime();
      const endMs = new Date(ev.end_at).getTime();
      if (Number.isNaN(startMs) || Number.isNaN(endMs)) continue;
      if (nowMs < startMs || nowMs > endMs) continue;
      for (const k of myChildren) {
        const teamIds = k.teamIds || (k.teamId ? [k.teamId] : []);
        if (!teamIds.includes(ev.team_id)) continue;
        out.push({
          event_id: ev.id,
          kid_first_name: k.firstName || 'Your kid',
          event_title: formatEventTitleString(ev),
          start_at: ev.start_at,
          end_at: ev.end_at,
          team_color: ev.teams?.team_color || 'var(--em-success)',
          team_name: ev.teams?.name || '—',
        });
      }
    }
    // Stable order: earliest end_at first (event ending soonest gets
    // priority). Multiple kids in same event keep input order.
    out.sort((a, b) => new Date(a.end_at) - new Date(b.end_at));
    return out;
  }, [myChildren, activities, nowMs]);
}
