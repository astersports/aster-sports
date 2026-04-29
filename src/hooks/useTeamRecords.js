import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Reads game_results for a team. If teamId is null, returns the org-level summary.
 * org_id is scoped via RLS — every query hits org boundary automatically.
 *
 * Note: column name `played_at` is assumed. Wave 3b verifies via Supabase
 * SQL Editor and patches if the actual column is `game_date` or other.
 *
 * Returns: { loading, error, games, summary }
 *   summary = { record, streak, ppg, allowed, diff, winPct, gamesPlayed }
 */
export function useTeamRecords(teamId, orgId) {
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
        .select('id, team_id, opponent_name, our_score, opponent_score, played_at, is_published')
        .eq('org_id', orgId)
        .eq('is_published', true)
        .order('played_at', { ascending: true });

      if (teamId) q = q.eq('team_id', teamId);

      const { data, error } = await q;
      if (cancelled) return;
      if (error) { setError(error); setLoading(false); return; }
      setGames(data || []);
      setLoading(false);
    }
    if (orgId) load();
    return () => { cancelled = true; };
  }, [teamId, orgId]);

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
    if ((g.our_score ?? 0) > (g.opponent_score ?? 0)) wins += 1; else losses += 1;
  }

  let streakKind = null, streakLen = 0;
  for (let i = games.length - 1; i >= 0; i -= 1) {
    const g = games[i];
    const w = (g.our_score ?? 0) > (g.opponent_score ?? 0);
    const kind = w ? 'W' : 'L';
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
