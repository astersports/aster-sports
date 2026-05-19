import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

// §4.C Sprint C — UPCOMING TOURNAMENT WEEKEND BANNER per
// HOME_DESIGN_SPEC §1.1.10.
//
// Trigger: tournament whose first event for parent's kids' teams
// starts within the next 72h. Activities are already org-and-team-
// scoped via useActivities + ParentHomePage's next7days filter, so
// we derive tournament_id from the activities list (no extra
// tournament_teams join needed) and fetch the matching tournament
// row for display details.
//
// Returns the SINGLE soonest tournament; banner is singular per
// HOME_DESIGN_SPEC. If multiple tournaments fall inside 72h,
// future iteration could surface a stack — for now the dominant
// upcoming weekend gets the slot.

const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;

export function useUpcomingTournament(upcomingActivities, nowMs) {
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tournamentId = useMemo(() => {
    if (!upcomingActivities?.length || !nowMs) return null;
    const cutoff = nowMs + SEVENTY_TWO_HOURS_MS;
    let earliestStart = Infinity;
    let pickedId = null;
    for (const ev of upcomingActivities) {
      if (!ev?.tournament_id || !ev?.start_at) continue;
      const startMs = new Date(ev.start_at).getTime();
      if (Number.isNaN(startMs)) continue;
      if (startMs < nowMs || startMs > cutoff) continue;
      if (startMs < earliestStart) {
        earliestStart = startMs;
        pickedId = ev.tournament_id;
      }
    }
    return pickedId;
  }, [upcomingActivities, nowMs]);

  const refetch = useCallback(async () => {
    if (!tournamentId) {
      setTournament(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: e } = await supabase
      .from('tournaments')
      .select('id, name, start_date, end_date, primary_venue, primary_venue_address, tourney_url, hotel_url, archived_at')
      .eq('id', tournamentId)
      .maybeSingle();
    if (e) {
      console.error('useUpcomingTournament fetch:', e.message);
      setError(e.message);
      setTournament(null);
      setLoading(false);
      return;
    }
    if (data?.archived_at) {
      setTournament(null);
      setLoading(false);
      return;
    }
    setError(null);
    setTournament(data || null);
    setLoading(false);
  }, [tournamentId]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  return { tournament, loading, error, refetch };
}
