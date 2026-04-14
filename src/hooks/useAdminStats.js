import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';

// Counts for the admin dashboard KPI grid. Each count is wrapped in its
// own try/catch so one missing table doesn't take the whole grid down —
// if `team_players` or `events` isn't provisioned yet the card just shows 0.
// Payment totals are hard-coded to 0 until the billing schema lands.
//
// Loading discipline: `loading: false` is ONLY ever written from the
// single setStats at the end of a completed fetch. No early-return
// paths write state. If orgId or seasonsLoading aren't settled yet, the
// effect bails without touching state and the hook stays on its initial
// `loading: true`. This is what prevents the KPI Events card from
// flashing "0" on hard refresh while the season data is still in
// flight.
const SAFE = async (fn) => {
  try { return await fn(); }
  catch { return 0; }
};

const INITIAL = {
  players: 0,
  events: 0,
  collected: 0,
  outstanding: 0,
  loading: true,
};

export function useAdminStats() {
  const { orgId } = useAuth();
  const { activeSeason, loading: seasonsLoading } = useSeason();
  const seasonId = activeSeason?.id ?? null;

  const [stats, setStats] = useState(INITIAL);

  useEffect(() => {
    // Wait for auth AND season context to settle before doing anything.
    // The effect re-fires when either dep changes, so we'll come back
    // here once they're ready. Critically: no state mutation in these
    // bail paths — the hook stays on loading=true.
    if (!orgId || seasonsLoading) return undefined;

    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;

      // Team IDs for the active season scope every subsequent count.
      // When there's no active season (seasonId null but seasonsLoading
      // is already false), we skip this fetch and teamIds stays empty,
      // which naturally drives both counts to 0 in SAFE() below.
      let teamIds = [];
      if (seasonId) {
        const { data } = await supabase
          .from('teams')
          .select('id')
          .eq('org_id', orgId)
          .eq('season_id', seasonId);
        teamIds = (data ?? []).map((t) => t.id);
      }

      const players = await SAFE(async () => {
        if (teamIds.length === 0) return 0;
        const { count } = await supabase
          .from('roster_members')
          .select('id', { count: 'exact', head: true })
          .in('team_id', teamIds);
        return count ?? 0;
      });

      const events = await SAFE(async () => {
        if (teamIds.length === 0) return 0;
        const { count } = await supabase
          .from('events')
          .select('id', { count: 'exact', head: true })
          .in('team_id', teamIds);
        return count ?? 0;
      });

      if (cancelled) return;
      // Single authoritative write. loading: false only gets set HERE.
      setStats({ players, events, collected: 0, outstanding: 0, loading: false });
    });

    return () => { cancelled = true; };
  }, [orgId, seasonId, seasonsLoading]);

  return stats;
}
