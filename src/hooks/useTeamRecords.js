import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { computeSummary } from '../lib/teamRecords';

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

      // Anti-pattern #48: PostgREST .order with foreignTable hint applies
      // to embedded subarrays, NOT parent rows. Removed — computeSummary
      // sorts JS-side by event.start_at (src/lib/teamRecords.js).
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
        .not('published_at', 'is', null);

      if (teamId) q = q.eq('events.team_id', teamId);

      // Anti-pattern #36: destructure error + throw.
      const { data, error } = await q;
      if (cancelled) return;
      if (error) { setError(error); setLoading(false); return; }
      setGames(data || []);
      setLoading(false);
    }
    // Microtask wrap matches usePublicTournaments / useLastPublishedAt
    // pattern — defers setLoading(true) out of the effect body to satisfy
    // react-hooks/set-state-in-effect.
    Promise.resolve().then(load);
    return () => { cancelled = true; };
  }, [teamId]);

  const summary = useMemo(() => computeSummary(games), [games]);
  return { loading, error, games, summary };
}

