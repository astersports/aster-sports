import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
import { useActivities } from './useActivities';
import { useEventRsvpCounts } from './useEventRsvpCounts';
import { useEventRideCounts } from './useEventRideCounts';
import { useEventDutyCounts } from './useEventDutyCounts';
import { useGameResultsMap } from './useGameResultsMap';
import { rosterVisible } from '../lib/rosterVisibility';
import { cacheKey } from '../lib/rsvpCache';

// SCH-2 / DL-7 / VF-11 batch hook (SCHEDULE_L99_BUILD_SPEC §4 + §10.3).
// ONE composed fetch layer for the whole visible schedule list: events,
// per-child RSVP + activation state, SD-6 denominators, §10.1 chip data
// (going / rides / duties), §10.4 own-commitment line, and the Hidden-
// roster count suppression input. Request count is CONSTANT in list
// length — every query is .in()-batched. The always-on RSVP control
// (PR-B') MUST consume this hook, never per-row fetches.
export function useScheduleData() {
  const { orgId, role, guardianId, user, myChildren } = useAuth();
  const { activeSeason } = useSeason();
  const { activities, loading, error, refetch } = useActivities();
  const { counts: rawCounts, refetch: refetchRsvpCounts } = useEventRsvpCounts(activities);
  const { counts: rideCounts } = useEventRideCounts(activities);
  const { counts: dutyCounts } = useEventDutyCounts(activities);
  const gameResults = useGameResultsMap(activities);
  const [batch, setBatch] = useState({ childRsvps: {}, activated: {}, activationCounts: {}, rosteredByTeam: {}, commitments: {}, program: null });

  const kidIds = useMemo(() => (myChildren || []).map((c) => c.playerId).filter(Boolean).sort().join(','), [myChildren]);
  const stableKey = useMemo(() => {
    const ids = (activities || []).map((a) => a.id).filter(Boolean).sort().join(',');
    const teamIds = [...new Set((activities || []).map((a) => a.team_id).filter(Boolean))].sort().join('|');
    return ids ? `${ids}§${teamIds}` : '';
  }, [activities]);

  useEffect(() => {
    if (!stableKey) { Promise.resolve().then(() => setBatch((b) => ({ ...b, childRsvps: {}, activated: {}, activationCounts: {}, commitments: {} }))); return; }
    const [idCsv, teamCsv] = stableKey.split('§');
    const ids = idCsv.split(',');
    const teamIds = teamCsv ? teamCsv.split('|') : [];
    const kids = kidIds ? kidIds.split(',') : [];
    let cancelled = false;
    Promise.all([
      kids.length ? supabase.from('event_rsvps').select('event_id, player_id, response').in('event_id', ids).in('player_id', kids) : Promise.resolve({ data: [] }),
      supabase.from('player_activations').select('event_id, player_id').in('event_id', ids),
      teamIds.length ? supabase.from('team_players').select('team_id').in('team_id', teamIds).eq('status', 'active').eq('roster_type', 'rostered') : Promise.resolve({ data: [] }),
      guardianId ? supabase.from('event_duties').select('event_id, duty_name').in('event_id', ids).eq('guardian_id', guardianId) : Promise.resolve({ data: [] }),
      user?.id ? supabase.from('event_ride_offers').select('event_id').in('event_id', ids).eq('driver_user_id', user.id).eq('status', 'active') : Promise.resolve({ data: [] }),
      activeSeason?.id ? supabase.from('programs').select('roster_visibility, program_type').eq('id', activeSeason.id).maybeSingle() : Promise.resolve({ data: null }),
    ]).then(([rsvpRes, actRes, tpRes, dutyRes, rideRes, progRes]) => {
      if (cancelled) return;
      [rsvpRes, actRes, tpRes, dutyRes, rideRes, progRes].forEach((r) => { if (r?.error) console.warn('useScheduleData:', r.error.message); });
      const childRsvps = {};
      (rsvpRes.data || []).forEach((r) => { childRsvps[cacheKey(r.event_id, r.player_id)] = r.response; });
      const activated = {};
      const activationCounts = {};
      (actRes.data || []).forEach((r) => {
        activated[cacheKey(r.event_id, r.player_id)] = true;
        activationCounts[r.event_id] = (activationCounts[r.event_id] || 0) + 1;
      });
      const rosteredByTeam = {};
      (tpRes.data || []).forEach((r) => { rosteredByTeam[r.team_id] = (rosteredByTeam[r.team_id] || 0) + 1; });
      const commitments = {};
      (dutyRes.data || []).forEach((r) => { commitments[r.event_id] = r.duty_name ? `You signed up: ${r.duty_name}` : 'You signed up'; });
      (rideRes.data || []).forEach((r) => { commitments[r.event_id] = commitments[r.event_id] ? `You're driving · ${commitments[r.event_id]}` : "You're driving"; });
      setBatch({ childRsvps, activated, activationCounts, rosteredByTeam, commitments, program: progRes.data || null });
    });
    return () => { cancelled = true; };
  }, [stableKey, kidIds, guardianId, user?.id, activeSeason?.id]);

  // SD-6: the real committed denominator = rostered + activated academy.
  // Replaces the roster_members raw size (which counted unactivated
  // academy kids — the inflated "12NR" Frank saw on his own screenshots).
  const counts = useMemo(() => {
    const out = {};
    (activities || []).forEach((a) => {
      const raw = rawCounts[a.id];
      if (!raw) return;
      const denominator = (batch.rosteredByTeam[a.team_id] ?? null) === null
        ? raw.total
        : batch.rosteredByTeam[a.team_id] + (batch.activationCounts[a.id] || 0);
      const noResponse = Math.max(0, denominator - raw.going - raw.maybe - raw.not_going);
      out[a.id] = { ...raw, denominator, noResponse, total: denominator };
    });
    return out;
  }, [activities, rawCounts, batch.rosteredByTeam, batch.activationCounts]);

  // §10.1(2) privacy guard: suppress the going count (parents only) when
  // the team's RESOLVED roster visibility is Hidden (tryout/eval/camp).
  const countSuppressedByTeam = useMemo(() => {
    const out = {};
    (activities || []).forEach((a) => {
      const t = a.teams;
      if (!t || out[t.id] !== undefined) return;
      out[t.id] = rosterVisible(t.roster_visibility_override, batch.program?.roster_visibility, batch.program?.program_type) === false;
    });
    return out;
  }, [activities, batch.program]);

  const onRsvpSaved = useCallback(() => refetchRsvpCounts(), [refetchRsvpCounts]);

  return {
    orgId, role, activities, loading, error, refetch,
    counts, rideCounts, dutyCounts, gameResults,
    childRsvpMap: batch.childRsvps, activatedMap: batch.activated,
    commitments: batch.commitments, countSuppressedByTeam, onRsvpSaved,
  };
}
