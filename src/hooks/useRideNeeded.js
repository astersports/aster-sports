import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

// §4.C Sprint B — ACTION ZONE second signal: ride needed.
// Triggers for a (kid × event) pair when:
//   - Kid has event_rsvps.response = 'going' for the event, AND
//   - Current user has NOT taken any ride action for this kid on
//     this event (no offer / no active claim / no pending request).
//
// "Ride action" scoped to the CURRENT user only — if a co-parent has
// already set up the ride, the current user still sees the action
// item; clicking through to event detail surfaces the existing
// arrangement. Single-guardian check keeps the query bounded and
// avoids cross-guardian linking that the schema doesn't model
// directly. Slight false-positive noise on multi-guardian families
// is acceptable for v1.
//
// Per anti-pattern #36: data + error destructured separately.

export function useRideNeeded(myChildren, upcomingActivities, userId) {
  const [needed, setNeeded] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          event_title: ev.title || ev.event_type || 'Event',
          team_name: ev.teams?.name || '—',
          team_color: ev.teams?.team_color || 'var(--em-neutral)',
        });
      }
    }
    return out;
  }, [upcomingActivities, myChildren]);

  const refetch = useCallback(async () => {
    if (!userId || !candidates.length) {
      setNeeded([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const eventIds = [...new Set(candidates.map((c) => c.event_id))];
    const playerIds = [...new Set(candidates.map((c) => c.player_id))];

    // Single roundtrip per source table — 3 queries in parallel.
    const [rsvpRes, offerRes, claimRes, reqRes] = await Promise.all([
      supabase
        .from('event_rsvps')
        .select('event_id, player_id, response')
        .in('event_id', eventIds)
        .in('player_id', playerIds),
      supabase
        .from('event_ride_offers')
        .select('event_id, driver_user_id, status')
        .in('event_id', eventIds)
        .eq('driver_user_id', userId),
      supabase
        .from('event_ride_claims')
        .select('event_id, rider_user_id, for_child_id, status')
        .in('event_id', eventIds)
        .eq('rider_user_id', userId),
      supabase
        .from('event_ride_requests')
        .select('event_id, requester_user_id, for_child_id, status')
        .in('event_id', eventIds)
        .eq('requester_user_id', userId),
    ]);
    const firstErr = rsvpRes.error || offerRes.error || claimRes.error || reqRes.error;
    if (firstErr) {
      console.error('useRideNeeded fetch:', firstErr.message);
      setError(firstErr.message);
      setNeeded([]);
      setLoading(false);
      return;
    }

    // Index: (event_id, player_id) → response
    const goingPairs = new Set();
    for (const r of rsvpRes.data || []) {
      if (r.response === 'going') goingPairs.add(`${r.event_id}:${r.player_id}`);
    }
    // Index: event_id → has-active-offer (any non-cancelled offer)
    const hasOfferEvents = new Set();
    for (const o of offerRes.data || []) {
      if (o.status !== 'cancelled') hasOfferEvents.add(o.event_id);
    }
    // Index: (event_id, for_child_id) → has-active-claim
    const hasClaimPairs = new Set();
    for (const c of claimRes.data || []) {
      if (c.status === 'confirmed' || c.status === 'waitlist') {
        hasClaimPairs.add(`${c.event_id}:${c.for_child_id}`);
      }
    }
    // Index: (event_id, for_child_id) → has-pending-request
    const hasRequestPairs = new Set();
    for (const r of reqRes.data || []) {
      if (r.status === 'pending') hasRequestPairs.add(`${r.event_id}:${r.for_child_id}`);
    }

    const neededItems = candidates
      .filter((c) => {
        const pairKey = `${c.event_id}:${c.player_id}`;
        if (!goingPairs.has(pairKey)) return false;
        if (hasOfferEvents.has(c.event_id)) return false;
        if (hasClaimPairs.has(pairKey)) return false;
        if (hasRequestPairs.has(pairKey)) return false;
        return true;
      })
      .map((c) => ({
        ...c,
        kind: 'ride_needed',
        primary: `${c.kid_first_name}: Ride needed`,
      }));
    neededItems.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
    setError(null);
    setNeeded(neededItems);
    setLoading(false);
  }, [candidates, userId]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  return { needed, loading, error, refetch };
}
