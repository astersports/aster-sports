import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Reads published game_results for a team via events join.
 *
 * Schema reality (verified Apr 29 via Supabase MCP):
 *   game_results { id, event_id, our_score, opponent_score, result, published_at, ... }
 *   events       { id, team_id, opponent, start_at, event_type }
 *   teams        { id, org_id, name, team_color, ... }
 *
 * Org scoping is enforced by RLS on game_results (via teams join) — no
 * application-layer org_id filter needed.
 *
 * Returns: { loading, error, games, summary }
 *   summary = { record, streak, ppg, allowed, diff, winPct, gamesPlayed }
 */
export function useTeamRecords(teamId) {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [games, setGames]     = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);

      let q = supabase
        .from('game_results')
        .select(`
          id,
          our_score,
          opponent_score,
          result,
          published_at,
          point_differential,
          event:events!inner ( id, team_id, opponent, start_at, is_championship_final )
        `)
        .not('published_at', 'is', null)
        .order('start_at', { foreignTable: 'event', ascending: true });

      if (teamId) q = q.eq('event.team_id', teamId);

      const { data, error } = await q;
      if (cancelled) return;
      if (error) { setError(error); setLoading(false); return; }
      setGames(data || []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [teamId]);

  const summary = computeSummary(games);
  return { loading, error, games, summary };
}

function computeSummary(games) {
  const n = games.length;
  if (n === 0) return { record: '0-0', streak: '—', ppg: 0, allowed: 0, diff: 0, winPct: 0, gamesPlayed: 0 };

  let wins = 0, losses = 0, pf = 0, pa = 0;
  for (const g of games) {
    pf += Number(g.our_score) || 0;
    pa += Number(g.opponent_score) || 0;
    if (g.result === 'W') wins += 1; else losses += 1;
  }

  let streakKind = null, streakLen = 0;
  for (let i = games.length - 1; i >= 0; i -= 1) {
    const kind = games[i].result;
    if (streakKind === null) { streakKind = kind; streakLen = 1; continue; }
    if (kind === streakKind) streakLen += 1; else break;
  }

  const ppg     = +(pf / n).toFixed(1);
  const allowed = +(pa / n).toFixed(1);
  const diff    = +((pf - pa) / n).toFixed(1);
  const winPct  = Math.round((wins / n) * 100);

  return {
    record: `${wins}-${losses}`,
    streak: `${streakKind}${streakLen}`,
    ppg, allowed, diff, winPct,
    gamesPlayed: n,
  };
}
