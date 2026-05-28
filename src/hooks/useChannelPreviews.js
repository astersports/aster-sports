import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// L99 perf audit (TIER 2) — collapse 1 + N team queries into 2 parallel
// queries (announcement + batched team), plus PATTERN A stable-deps guard:
// derive a value-stable string key from teamIds so fetch doesn't re-run on
// every upstream channels-array reference churn.

export function useChannelPreviews(channels) {
  const { orgId } = useAuth();
  const [previews, setPreviews] = useState({});

  // Value-stable key for the dep array. channels.reference may change each
  // render upstream, but as long as the team-id set is the same, teamIdsKey
  // is the same string and useCallback's primitive equality holds.
  const teamIdsKey = useMemo(
    () => channels.filter((c) => c.teamId).map((c) => c.teamId).sort().join(','),
    [channels]
  );

  const fetch = useCallback(async () => {
    if (!orgId) return;
    const teamIds = teamIdsKey ? teamIdsKey.split(',') : [];
    if (teamIds.length === 0) { setPreviews({}); return; }

    // Two parallel queries vs 1 + N. For the team batch, fetch recent
    // messages across all teams ordered desc, then pick the latest per
    // team in JS. Cap covers normal chat volume with headroom.
    const [annRes, teamRes] = await Promise.all([
      supabase.from('messages').select('channel, team_id, sender_name, body, created_at')
        .eq('org_id', orgId).eq('channel', 'announcement')
        .order('created_at', { ascending: false }).limit(1),
      supabase.from('messages').select('channel, team_id, sender_name, body, created_at')
        .eq('org_id', orgId).eq('channel', 'team').in('team_id', teamIds)
        .order('created_at', { ascending: false }).limit(Math.max(teamIds.length * 10, 20)),
    ]);
    if (annRes.error) { console.error('useChannelPreviews announcement:', annRes.error.message); return; }
    if (teamRes.error) { console.error('useChannelPreviews team:', teamRes.error.message); return; }

    const map = {};
    const annMsg = annRes.data?.[0];
    if (annMsg) map.announcements = { sender: annMsg.sender_name, body: annMsg.body, time: annMsg.created_at };
    const seen = new Set();
    (teamRes.data ?? []).forEach((m) => {
      if (seen.has(m.team_id)) return;
      seen.add(m.team_id);
      map[`team-${m.team_id}`] = { sender: m.sender_name, body: m.body, time: m.created_at };
    });
    setPreviews(map);
  }, [orgId, teamIdsKey]);

  useEffect(() => { Promise.resolve().then(fetch); }, [fetch]);

  return previews;
}
