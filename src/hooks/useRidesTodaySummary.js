import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// HOME_DESIGN_SPEC + RIDES_DESIGN_SPEC §6 — admin rides today widget
// data. Returns aggregate ride-coordination state for events
// happening today across all teams in the org:
//   - eventCount         total events with rides_enabled today
//   - totalSeatsOffered  sum of active offers' seats_offered
//   - totalSeatsClaimed  sum of confirmed + pending + waitlisted claims
//   - coveragePct        claimed / max(offered, 1) — capped at 100
//   - byTeam             per-team breakdown { teamName, eventCount,
//                        offered, claimed, coveragePct, teamColor }
//
// Per anti-pattern #36 (data + error destructured) + #37 (org_id
// filter via FK chain through events!inner → teams!inner).
//
// Presence-driven: caller hides widget when eventCount === 0.

const DAY_MS = 24 * 60 * 60 * 1000;

export function useRidesTodaySummary(orgId, nowMs) {
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
    const { data: events, error: eventsErr } = await supabase
      .from('events')
      .select('id, enable_rides, teams!inner(id, name, team_color, org_id)')
      .eq('teams.org_id', orgId)
      .gte('start_at', startIso)
      .lt('start_at', endIso)
      .neq('status', 'cancelled');
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
    const offerByEvent = {};
    for (const o of offersRes.data || []) {
      offerByEvent[o.event_id] = (offerByEvent[o.event_id] || 0) + (o.seats_offered || 0);
    }
    const claimByEvent = {};
    for (const c of claimsRes.data || []) {
      if (!['confirmed', 'pending', 'waitlisted'].includes(c.status)) continue;
      claimByEvent[c.event_id] = (claimByEvent[c.event_id] || 0) + (c.seats_requested || 0);
    }
    const byTeamMap = {};
    let totalOffered = 0;
    let totalClaimed = 0;
    for (const e of ridesEvents) {
      const tid = e.teams.id;
      const offered = offerByEvent[e.id] || 0;
      const claimed = claimByEvent[e.id] || 0;
      totalOffered += offered;
      totalClaimed += claimed;
      if (!byTeamMap[tid]) {
        byTeamMap[tid] = { teamId: tid, teamName: e.teams.name, teamColor: e.teams.team_color, eventCount: 0, offered: 0, claimed: 0 };
      }
      byTeamMap[tid].eventCount += 1;
      byTeamMap[tid].offered += offered;
      byTeamMap[tid].claimed += claimed;
    }
    const byTeam = Object.values(byTeamMap).map((t) => ({
      ...t,
      coveragePct: t.offered > 0 ? Math.min(100, Math.round((t.claimed / t.offered) * 100)) : null,
    })).sort((a, b) => a.teamName.localeCompare(b.teamName));
    const coveragePct = totalOffered > 0 ? Math.min(100, Math.round((totalClaimed / totalOffered) * 100)) : null;
    setError(null);
    setData({
      eventCount: ridesEvents.length,
      totalSeatsOffered: totalOffered,
      totalSeatsClaimed: totalClaimed,
      coveragePct,
      byTeam,
    });
    setLoading(false);
  }, [orgId, nowMs]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  return { ...data, loading, error, refetch };
}
