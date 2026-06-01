import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatEventTitleString } from '../lib/eventTitle';

// §4.C Sprint B — ACTION ZONE: pending RSVP signal.
// Returns the list of (kid × event) pairs where the kid is on the
// event's team AND no event_rsvps row exists yet for that pair.
// Single query bounded to next 7 days of upcoming events.
//
// Output shape per item (per ActionZone's signal-agnostic shell):
//   { kind: 'rsvp_pending', primary, event_id, player_id,
//     kid_first_name, start_at, event_title, team_name, team_color }
//
// Empty list when myChildren is empty OR no upcoming events OR all
// (kid × event) pairs already have a response.
//
// Per anti-pattern #36: data + error destructured separately; error
// surfaces via state. Per #37: events query goes through team_id via
// FK; player_id filter via .in() — no top-level org_id needed since
// the upstream activities are already org-scoped via useActivities.
export function usePendingRsvps(myChildren, upcomingActivities) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const kidById = useMemo(() => {
    const m = new Map();
    for (const k of myChildren || []) m.set(k.playerId, k);
    return m;
  }, [myChildren]);

  // Build the (event × kid-eligible) cartesian first, then knock out
  // pairs with existing responses via the single query.
  const candidates = useMemo(() => {
    const out = [];
    for (const ev of upcomingActivities || []) {
      if (!ev?.id || !ev?.team_id) continue;
      for (const k of myChildren || []) {
        const teamIds = k.teamIds || (k.teamId ? [k.teamId] : []);
        if (!teamIds.includes(ev.team_id)) continue;
        out.push({
          event_id: ev.id,
          player_id: k.playerId,
          kid_first_name: k.firstName || 'Your kid',
          start_at: ev.start_at,
          event_title: formatEventTitleString(ev),
          team_name: ev.teams?.name || '—',
          team_color: ev.teams?.team_color || 'var(--as-neutral)',
        });
      }
    }
    return out;
  }, [upcomingActivities, myChildren]);

  const refetch = useCallback(async () => {
    if (!candidates.length) {
      setPending([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const eventIds = [...new Set(candidates.map((c) => c.event_id))];
    const playerIds = [...new Set(candidates.map((c) => c.player_id))];
    const { data, error: e } = await supabase
      .from('event_rsvps')
      .select('event_id, player_id, response')
      .in('event_id', eventIds)
      .in('player_id', playerIds);
    if (e) {
      console.error('usePendingRsvps fetch:', e.message);
      setError(e.message);
      setPending([]);
      setLoading(false);
      return;
    }
    const responded = new Set();
    for (const row of data || []) {
      if (row.response) responded.add(`${row.event_id}:${row.player_id}`);
    }
    const pendingItems = candidates
      .filter((c) => !responded.has(`${c.event_id}:${c.player_id}`))
      .map((c) => ({
        ...c,
        kind: 'rsvp_pending',
        primary: `${c.kid_first_name}: RSVP needed`,
      }));
    // Sort soonest first.
    pendingItems.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
    setError(null);
    setPending(pendingItems);
    setLoading(false);
  }, [candidates]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  // Re-export kidById for callers that want to enrich rendering with
  // kid details beyond first_name. Cheap — already memoized.
  return { pending, loading, error, refetch, kidById };
}
