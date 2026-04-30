import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { computeSummary } from '../lib/teamRecords';

/**
 * Single-query replacement for the N+1 pattern of calling
 * useTeamRecords(team.id) per team card. Fetches every published
 * game_result for the org's teams in one round-trip and groups by
 * team_id in JS.
 *
 * Returns: { byTeamId, loading, error }
 *   byTeamId — { [teamId]: summary } — same summary shape as
 *              useTeamRecords. Teams with no game_results are absent;
 *              consumers should default via EMPTY_SUMMARY when needed.
 *
 * Org scoping: events.team_id → teams.org_id chain matches Migrations
 * 025/028 public-RLS pattern, so this works for both anon /records
 * and authenticated org-internal callers.
 */
export function useOrgTeamRecords(orgId) {
  const [byTeamId, setByTeamId] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orgId) {
      Promise.resolve().then(() => { setByTeamId({}); setLoading(false); });
      return;
    }
    let cancelled = false;
    Promise.resolve().then(async () => {
      setLoading(true);
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from('game_results')
        .select('result, our_score, opponent_score, events!inner(team_id, start_at, teams!inner(org_id))')
        .eq('events.teams.org_id', orgId)
        .not('published_at', 'is', null)
        .order('start_at', { foreignTable: 'events', ascending: true });
      if (cancelled) return;
      if (fetchErr) { setError(fetchErr); setLoading(false); return; }

      const grouped = {};
      for (const row of (data || [])) {
        const teamId = row.events?.team_id;
        if (!teamId) continue;
        if (!grouped[teamId]) grouped[teamId] = [];
        grouped[teamId].push({
          result: row.result,
          our_score: row.our_score,
          opponent_score: row.opponent_score,
        });
      }

      const summaries = {};
      for (const [teamId, games] of Object.entries(grouped)) {
        summaries[teamId] = computeSummary(games);
      }
      setByTeamId(summaries);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [orgId]);

  return { byTeamId, loading, error };
}
