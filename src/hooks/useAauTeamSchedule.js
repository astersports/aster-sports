import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Public AAU schedule for one team, for the no-login Hub (R1·PR-A).
 *
 * Reads the anon-callable `get_public_aau_team_schedule(p_team_ids)` RPC (gated
 * server-side by org_is_public_listed()). The RPC matches a team by its qkey —
 * the same `teamKey` carried in a search_public_aau() team result — and returns
 * that team's games ACROSS all its tournaments, already sorted by start time
 * (ascending, nulls last). Each game: { gameId, isHome, opponent, myScore,
 * oppScore, status, startAt, court, isBracket, isForfeit, division, tournament,
 * tournamentId, trackedTeamName, venue:{ name, address, city, state, lat, lng } }.
 */
export function useAauTeamSchedule(teamKey) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!teamKey) {
      Promise.resolve().then(() => { setGames([]); setLoading(false); });
      return;
    }
    let cancelled = false;
    Promise.resolve().then(() => { setLoading(true); setError(null); });

    (async () => {
      // AP #36: destructure { data, error }; surface the error before use.
      const { data, error: rpcErr } = await supabase.rpc('get_public_aau_team_schedule', { p_team_ids: [teamKey] });
      if (cancelled) return;
      if (rpcErr) {
        setError(rpcErr);
        setGames([]);
        setLoading(false);
        return;
      }
      setGames(Array.isArray(data) ? data : []);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [teamKey]);

  // The team's display name rides on each game row; first row is fine.
  const teamName = games[0]?.trackedTeamName || null;
  return { games, teamName, loading, error };
}
