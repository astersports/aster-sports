import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * One public tournament's structure for the no-login Hub (R1·PR-A).
 *
 * Reads the anon-callable `get_public_tournament_teams(p_tournament_id)` RPC
 * (gated by org_is_public_listed()), which returns
 * { tournament, divisions: [{ id, name, gender, grade_label, advance_count,
 * teams: [...] }] }. This increment renders the division structure only — the
 * ranked standings inside each division are PR-B (server-side compute, held).
 */
export function useAauTournament(tournamentId) {
  const [tournament, setTournament] = useState(null);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tournamentId) {
      Promise.resolve().then(() => { setLoading(false); });
      return;
    }
    let cancelled = false;
    Promise.resolve().then(() => { setLoading(true); setError(null); });

    (async () => {
      // AP #36: destructure { data, error }; surface the error before use.
      const { data, error: rpcErr } = await supabase.rpc('get_public_tournament_teams', { p_tournament_id: tournamentId });
      if (cancelled) return;
      if (rpcErr) {
        setError(rpcErr);
        setTournament(null);
        setDivisions([]);
        setLoading(false);
        return;
      }
      setTournament(data?.tournament || null);
      setDivisions(Array.isArray(data?.divisions) ? data.divisions : []);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [tournamentId]);

  return { tournament, divisions, loading, error };
}
