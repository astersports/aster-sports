import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { aggregateRidesSummary } from '../lib/ridesSummary';

// HOME_DESIGN_SPEC + RIDES_DESIGN_SPEC §5/§6 — rides today widget data.
// Returns aggregate ride-coordination state for events happening
// today within the requested scope:
//   - eventCount         total events with rides_enabled today
//   - totalSeatsOffered  sum of active offers' seats_offered
//   - totalSeatsClaimed  sum of confirmed + pending + waitlisted claims
//   - coveragePct        claimed / max(offered, 1) — capped at 100
//   - byTeam             per-team breakdown { teamName, eventCount,
//                        offered, claimed, coveragePct, teamColor }
//
// Scope discipline (anti-pattern #42, one hook two consumers):
//   - Admin home (§6): pass orgId only → org-wide aggregate
//   - Coach home (§5): pass orgId + teamIds → coach-scoped aggregate
//     (filtered to coachedTeamIds via teams!inner.id IN list)
//
// Per anti-pattern #36 (data + error destructured) + #37 (org_id
// filter via FK chain through events!inner → teams!inner).
//
// Presence-driven: caller hides widget when eventCount === 0.

const DAY_MS = 24 * 60 * 60 * 1000;

export function useRidesTodaySummary(orgId, nowMs, teamIds = null) {
  // Stable key for caller-provided teamIds (callers often re-derive
  // the array each render). Used in useCallback deps below.
  const teamIdsKey = useMemo(() => (teamIds ? teamIds.join(',') : ''), [teamIds]);
  const [data, setData] = useState({ eventCount: 0, totalSeatsOffered: 0, totalSeatsClaimed: 0, coveragePct: 0, byTeam: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!orgId || !nowMs) {
      setData({ eventCount: 0, totalSeatsOffered: 0, totalSeatsClaimed: 0, coveragePct: 0, byTeam: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    const todayStart = new Date(nowMs);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + DAY_MS);
    const startIso = todayStart.toISOString();
    const endIso = todayEnd.toISOString();
    let eventsQuery = supabase
      .from('events')
      .select('id, enable_rides, teams!inner(id, name, team_color, org_id)')
      .eq('teams.org_id', orgId)
      .gte('start_at', startIso)
      .lt('start_at', endIso)
      .neq('status', 'cancelled');
    if (teamIds && teamIds.length > 0) {
      eventsQuery = eventsQuery.in('teams.id', teamIds);
    } else if (teamIds && teamIds.length === 0) {
      // Coach with zero coached teams → no events possible. Bail.
      setError(null);
      setData({ eventCount: 0, totalSeatsOffered: 0, totalSeatsClaimed: 0, coveragePct: 0, byTeam: [] });
      setLoading(false);
      return;
    }
    const { data: events, error: eventsErr } = await eventsQuery;
    if (eventsErr) {
      console.error('useRidesTodaySummary events:', eventsErr.message);
      setError(eventsErr.message);
      setLoading(false);
      return;
    }
    const ridesEvents = (events || []).filter((e) => e.enable_rides === true);
    if (ridesEvents.length === 0) {
      setError(null);
      setData({ eventCount: 0, totalSeatsOffered: 0, totalSeatsClaimed: 0, coveragePct: 0, byTeam: [] });
      setLoading(false);
      return;
    }
    const eventIds = ridesEvents.map((e) => e.id);
    const [offersRes, claimsRes] = await Promise.all([
      supabase.from('event_ride_offers').select('event_id, seats_offered').eq('status', 'active').in('event_id', eventIds),
      supabase.from('event_ride_claims').select('event_id, seats_requested, status').in('event_id', eventIds),
    ]);
    if (offersRes.error || claimsRes.error) {
      const msg = offersRes.error?.message || claimsRes.error?.message;
      console.error('useRidesTodaySummary rides:', msg);
      setError(msg);
      setLoading(false);
      return;
    }
    // Aggregation extracted to lib/ridesSummary.js as a pure helper
    // (PR #335) so the math is unit-testable in isolation.
    const summary = aggregateRidesSummary(ridesEvents, offersRes.data, claimsRes.data);
    setError(null);
    setData(summary);
    setLoading(false);
  // teamIdsKey is the join-string memo; safe in the deps array.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, nowMs, teamIdsKey]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  return { ...data, loading, error, refetch };
}
