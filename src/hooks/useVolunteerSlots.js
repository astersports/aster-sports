import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatEventTitleString } from '../lib/eventTitle';

// §4.C Sprint B — ACTION ZONE third signal: open volunteer slots.
// Triggers per event (not per kid) when:
//   - Parent has at least one kid on the event's team, AND
//   - Event has ≥1 unclaimed event_duties row (guardian_id IS NULL
//     AND claimed_by_name IS NULL).
//
// Unlike rsvp_pending and ride_needed which are per (kid × event),
// volunteer slots are per-event. Item.player_id stays null so the
// ActionZone key remains unique via `${kind}:${event_id}:null`.
//
// Per anti-pattern #36: data + error destructured separately.

export function useVolunteerSlots(myChildren, upcomingActivities) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Events where the parent has a kid on the team.
  const candidateEvents = useMemo(() => {
    const myTeamIds = new Set();
    for (const k of myChildren || []) {
      for (const tid of (k.teamIds || (k.teamId ? [k.teamId] : []))) {
        myTeamIds.add(tid);
      }
    }
    return (upcomingActivities || []).filter((ev) => ev?.id && ev?.team_id && myTeamIds.has(ev.team_id));
  }, [upcomingActivities, myChildren]);

  const refetch = useCallback(async () => {
    if (!candidateEvents.length) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const eventIds = candidateEvents.map((ev) => ev.id);
    const { data, error: e } = await supabase
      .from('event_duties')
      .select('event_id, guardian_id, claimed_by_name')
      .in('event_id', eventIds)
      .is('guardian_id', null)
      .is('claimed_by_name', null);
    if (e) {
      console.error('useVolunteerSlots fetch:', e.message);
      setError(e.message);
      setItems([]);
      setLoading(false);
      return;
    }
    // Count open slots per event_id.
    const openByEvent = new Map();
    for (const row of data || []) {
      openByEvent.set(row.event_id, (openByEvent.get(row.event_id) || 0) + 1);
    }
    const out = [];
    for (const ev of candidateEvents) {
      const count = openByEvent.get(ev.id) || 0;
      if (count === 0) continue;
      out.push({
        kind: 'volunteer_slot',
        primary: count === 1 ? '1 volunteer slot open' : `${count} volunteer slots open`,
        event_id: ev.id,
        player_id: null,
        start_at: ev.start_at,
        event_title: formatEventTitleString(ev),
        team_name: ev.teams?.name || '—',
        team_color: ev.teams?.team_color || 'var(--as-neutral)',
        open_count: count,
      });
    }
    out.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
    setError(null);
    setItems(out);
    setLoading(false);
  }, [candidateEvents]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  return { items, loading, error, refetch };
}
