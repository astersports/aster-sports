import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
import { useSeasonFinancials } from './useSeasonFinancials';

// Counts for the admin dashboard KPI grid: players + events + the
// financial pair (collected, outstanding).
//
// Anti-pattern #42 cleanup (PR #305): financial computation used to
// live inline at :82-111, duplicating the math owned by
// useSeasonFinancials. After this PR the financial slice flows
// through the shared hook (4th consumer); only the player + event
// counts stay local to this hook.
//
// Units fix (in-PR): pre-PR the hook returned collected/outstanding
// in DOLLARS (`paid / 100`), but KpiGrid pipes those values through
// `formatCurrency()` which itself divides by 100 (expects CENTS).
// Net effect: the KPI grid was rendering ~1/100th of actual values
// (e.g. "$702" instead of "$70,243"). Pre-existing bug surfaced
// during consolidation. Hook now returns CENTS to match
// formatCurrency's expectation — display values become correct.
//
// Each count is wrapped in SAFE so one missing table doesn't take
// the whole grid down. Loading discipline: counts.loading flips to
// false only at end of completed fetch; financialLoading comes
// from useSeasonFinancials's own gate. Hook stays on loading=true
// while either is in flight.
const SAFE = async (fn) => {
  try { return await fn(); }
  catch { return 0; }
};

export function useAdminStats() {
  const { orgId } = useAuth();
  const { activeSeason, loading: seasonsLoading } = useSeason();
  const seasonId = activeSeason?.id ?? null;

  const [counts, setCounts] = useState({ players: 0, events: 0, loading: true });

  // Financial slice via shared hook. Cents in; dollars out at boundary.
  const { stats: financial, loading: financialLoading } = useSeasonFinancials(orgId, seasonId);

  useEffect(() => {
    if (!orgId || seasonsLoading) return undefined;

    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;

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
      setCounts({ players, events, loading: false });
    });

    return () => { cancelled = true; };
  }, [orgId, seasonId, seasonsLoading]);

  return {
    players: counts.players,
    events: counts.events,
    collected: financial?.paid || 0,
    outstanding: Math.max(0, financial?.outstanding || 0),
    // PR #307 — billed + pct exposed for ProgramHealthCard. Single
    // useSeasonFinancials call serves both KPI grid + program-health
    // surface (avoids a second concurrent fetch).
    billed: financial?.billed || 0,
    pct: financial?.pct || 0,
    loading: counts.loading || financialLoading,
  };
}
