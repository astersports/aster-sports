import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// All public games for one tournament on the no-login Hub (R1·PR-A) — the source
// for a division page's Schedule + Bracket tabs. Reads the anon-callable
// get_public_tournament_games(p_tournament_id) RPC; each game carries
// { gameId, startAt, status, court, venue, isBracket, isForfeit, home, away,
//   homeScore, awayScore, divisionId, divisionName }. The division page filters
// by divisionId client-side. Anon client, gated server-side by org_is_public_listed().
export function useAauTournamentGames(tournamentId) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tournamentId) { Promise.resolve().then(() => setLoading(false)); return undefined; }
    let cancelled = false;
    Promise.resolve().then(() => { setLoading(true); setError(null); });
    (async () => {
      // AP #36: destructure { data, error }; surface the error before use.
      const { data, error: rpcErr } = await supabase.rpc('get_public_tournament_games', { p_tournament_id: tournamentId });
      if (cancelled) return;
      if (rpcErr) { setError(rpcErr); setGames([]); setLoading(false); return; }
      setGames(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [tournamentId]);

  return { games, loading, error };
}
