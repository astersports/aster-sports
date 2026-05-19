import { useMemo } from 'react';

// §4.C Sprint E — Admin ACTION QUEUE first signal: events with poor
// RSVP coverage in the next 72h. Pure derivation hook off the
// already-fetched activities + rsvpCounts maps. Same ActionZone
// shape as parent + coach signals — validates the shell as truly
// cross-role infrastructure (admin is the third consumer).
//
// Threshold: noResponse / total > 0.5 (more than half the roster
// hasn't responded). Admin gets to nudge before the day-of.
//
// 72h window matches the parent Tournament Weekend Banner cutoff —
// "the immediate horizon" for admin attention.

const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;
const DEFAULT_NO_RESPONSE_RATIO = 0.5;

export function useLowRsvpEvents(activities, rsvpCounts, nowMs, options = {}) {
  const threshold = options.threshold ?? DEFAULT_NO_RESPONSE_RATIO;

  return useMemo(() => {
    if (!activities?.length || !rsvpCounts || !nowMs) return [];
    const cutoff = nowMs + SEVENTY_TWO_HOURS_MS;
    const out = [];
    for (const ev of activities) {
      if (!ev?.id || !ev?.start_at || ev.status === 'cancelled') continue;
      const startMs = new Date(ev.start_at).getTime();
      if (Number.isNaN(startMs) || startMs < nowMs || startMs > cutoff) continue;
      const counts = rsvpCounts[ev.id];
      if (!counts || !counts.total) continue;
      const ratio = (counts.noResponse || 0) / counts.total;
      if (ratio < threshold) continue;
      const teamName = ev.teams?.name || 'Team';
      const teamColor = ev.teams?.team_color || 'var(--em-warning)';
      const eventTitle = ev.title || ev.event_type || 'Event';
      out.push({
        kind: 'low_rsvp',
        primary: `${teamName}: ${eventTitle}`,
        secondary: `${counts.noResponse} of ${counts.total} no RSVP yet`,
        href: `/events/${ev.id}`,
        id: ev.id,
        event_id: ev.id,
        start_at: ev.start_at,
        team_name: teamName,
        team_color: teamColor,
      });
    }
    out.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
    return out;
  }, [activities, rsvpCounts, nowMs, threshold]);
}
