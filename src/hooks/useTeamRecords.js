import { useEffect, useMemo, useState } from 'react';
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
 *   summary = { record, ties, streak, ppg, allowed, diff, winPct, gamesPlayed }
 *
 * Result handling: 'W' / 'L' / 'T' counted explicitly. null or unexpected
 * values are skipped (better than silently miscounting). Record formats
 * as "W-L" when ties=0, "W-L-T" when ties>0. A tie breaks the streak;
 * T-streaks don't render.
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
        .order('start_at', { foreignTable: 'events', ascending: true });

      if (teamId) q = q.eq('events.team_id', teamId);

      const { data, error } = await q;
      if (cancelled) return;
      if (error) { setError(error); setLoading(false); return; }
      setGames(data || []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [teamId]);

  const summary = useMemo(() => computeSummary(games), [games]);
  return { loading, error, games, summary };
}

function computeSummary(games) {
  const n = games.length;
  if (n === 0) return { record: '0-0', ties: 0, streak: '—', ppg: 0, allowed: 0, diff: 0, winPct: 0, gamesPlayed: 0 };

  let wins = 0, losses = 0, ties = 0, pf = 0, pa = 0;
  for (const g of games) {
    pf += Number(g.our_score) || 0;
    pa += Number(g.opponent_score) || 0;
    if (g.result === 'W') wins += 1;
    else if (g.result === 'L') losses += 1;
    else if (g.result === 'T') ties += 1;
    // null / void / anything else: skip silently rather than miscount
  }

  // Walk newest → oldest. A T (or any non-W/L) breaks the streak entirely.
  let streakKind = null, streakLen = 0;
  for (let i = games.length - 1; i >= 0; i -= 1) {
    const kind = games[i].result;
    if (kind !== 'W' && kind !== 'L') break;
    if (streakKind === null) { streakKind = kind; streakLen = 1; continue; }
    if (kind === streakKind) streakLen += 1; else break;
  }

  const ppg     = +(pf / n).toFixed(1);
  const allowed = +(pa / n).toFixed(1);
  const diff    = +((pf - pa) / n).toFixed(1);
  const winPct  = Math.round((wins / n) * 100);

  return {
    record: ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`,
    ties,
    streak: streakKind ? `${streakKind}${streakLen}` : '—',
    ppg, allowed, diff, winPct,
    gamesPlayed: n,
  };
}
