import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';

// Counts for the admin dashboard KPI grid. Each count is wrapped in its
// own try/catch so one missing table doesn't take the whole grid down —
// if `team_players` or `events` isn't provisioned yet the card just shows 0.
// Payment totals are hard-coded to 0 until the billing schema lands.
//
// The loading contract matters for the UI: we only flip `loading: false`
// AFTER the hook has authoritative numbers for the active season.
// Previously we set loading=false in three places (no org, no season,
// after fetch), which caused the cards to flash "0 → 0 → real value" on
// every mount. Now the effect stays in the loading state until both
// `orgId` and season context have settled, then does exactly one write.
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
    // Still waiting for auth or season context to resolve? Do nothing —
    // the effect will re-run when those values settle, so the card stays
    // on the loading placeholder instead of flashing zeros.
    if (!orgId || seasonsLoading) return undefined;

    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;

      // Seasons finished loading but the org has no active season — the
      // zeros here are authoritative, not a flash.
      if (!seasonId) {
        setStats({ ...INITIAL, loading: false });
        return;
      }

      // 1. Team IDs for the active season scope every subsequent count.
      const { data } = await supabase
        .from('teams')
        .select('id')
        .eq('org_id', orgId)
        .eq('season_id', seasonId);
      const teamIds = (data ?? []).map((t) => t.id);

      const players = await SAFE(async () => {
        if (teamIds.length === 0) return 0;
        const { count } = await supabase
          .from('team_players')
          .select('id', { count: 'exact', head: true })
          .in('team_id', teamIds)
          .eq('status', 'active');
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
      setStats({ players, events, collected: 0, outstanding: 0, loading: false });
    });

    return () => { cancelled = true; };
  }, [orgId, seasonId, seasonsLoading]);

  return stats;
}
