import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { computeStandings } from '../lib/standings/computeStandings';
import { predictBracket } from '../lib/standings/predictBracket';

// Public (anon) read of one tournament division's standings + bracket odds, via the
// get_public_tournament_standings SECURITY DEFINER RPC (migrations 2026-06-26). The RPC
// returns the raw inputs { teams, games (final), remaining, rules, division }; the SAME
// JS engine computes the ranked standings AND feeds the predictor (AP #63 — one source
// for the table and the odds). Destructures {data,error} and surfaces error (AP #36).
// Returns null data when the division is not public / not found.
export function usePublicStandings(divisionId) {
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      if (!divisionId) { if (active) { setRaw(null); setLoading(false); } return; }
      const { data, error: rpcErr } = await supabase.rpc('get_public_tournament_standings', { p_division_id: divisionId });
      if (!active) return;
      if (rpcErr) { setError(rpcErr); setRaw(null); } else { setRaw(data); }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [divisionId]);

  const derived = useMemo(() => {
    if (!raw) return { division: null, standings: [], advanceCount: null, predictFor: () => ({ available: false }) };
    const teams = raw.teams || [];
    const games = raw.games || [];
    const remaining = raw.remaining || [];
    const rules = raw.rules || {};
    const advanceCount = raw.division?.advance_count ?? null;
    const standings = computeStandings({ teams, games, rules, advanceCount });
    // The predictor enumerates the remaining games per focus team; advanceCount=null
    // (unconfirmed rule) makes predictBracket return { available:false } -> odds withheld.
    const predictFor = (focusId) => predictBracket({ teams, games, remaining, rules, advanceCount, focusId });
    return { division: raw.division, standings, advanceCount, predictFor };
  }, [raw]);

  return { loading, error, ...derived };
}
