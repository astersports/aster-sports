import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';

// Counts for the admin dashboard KPI grid. Each count is wrapped in its
// own try/catch so one missing table doesn't take the whole grid down —
// if `team_players` or `events` isn't provisioned yet the card just shows 0.
// Payment totals are hard-coded to 0 until the billing schema lands.
const SAFE = async (fn) => {
  try { return await fn(); }
  catch { return 0; }
};

export function useAdminStats() {
  const { orgId } = useAuth();
  const { activeSeason } = useSeason();
  const seasonId = activeSeason?.id ?? null;

  const [stats, setStats] = useState({
    players: 0, events: 0, collected: 0, outstanding: 0, loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    // Everything — including the "no org" short-circuit — runs inside the
    // microtask so setState never fires synchronously from the effect body.
    Promise.resolve().then(async () => {
      if (cancelled) return;
      if (!orgId) {
        setStats((s) => ({ ...s, loading: false }));
        return;
      }
      // 1. Find team IDs in the active season so both counts scope correctly.
      let teamIds = [];
      if (seasonId) {
        const { data } = await supabase
          .from('teams').select('id')
          .eq('org_id', orgId).eq('season_id', seasonId);
        teamIds = (data ?? []).map((t) => t.id);
      }

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
  }, [orgId, seasonId]);

  return stats;
}
