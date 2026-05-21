import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { computeSummary } from '../lib/teamRecords';

/**
 * Single-query replacement for the N+1 pattern of calling
 * useTeamRecords(team.id) per team card. Fetches every published
 * game_result for the org's teams in one round-trip and groups by
 * team_id in JS.
 *
 * Returns: { byTeamId, loading, error, refetch }
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

  const refetch = useCallback(async () => {
    if (!orgId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const { data, error: fetchErr } = await supabase
      .from('game_results')
      .select('result, our_score, opponent_score, events!inner(team_id, start_at, teams!inner(org_id))')
      .eq('events.teams.org_id', orgId)
      .not('published_at', 'is', null);
    // Per anti-pattern #48: parent rows are ordered in JS via
    // computeSummary's start_at sort (teamRecords.js:28). PostgREST's
    // `.order(..., { foreignTable: 'events' })` would apply only to
    // embedded subarrays, not to top-level result rows — so it was
    // dead code here.
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
        // start_at is required by computeSummary's chronological sort
        // (teamRecords.js:28). Without it, the sort was a no-op (every
        // game's "start_at" resolved to '') and the last-5 form guide
        // rendered in PostgREST entry order instead of by game date.
        // Frank-reported 2026-05-20: last-5 didn't match recent games.
        start_at: row.events?.start_at,
      });
    }

    const summaries = {};
    for (const [teamId, games] of Object.entries(grouped)) {
      summaries[teamId] = computeSummary(games);
    }
    setByTeamId(summaries);
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    Promise.resolve().then(refetch);
  }, [refetch]);

  return { byTeamId, loading, error, refetch };
}
