import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

// §4.C Sprint D — MESSAGING BLOCK feed for coach home per
// HOME_DESIGN_SPEC §2.1.4. Surfaces latest team-channel message per
// team within last 24h where sender is NOT the current coach (so
// coach sees parent chatter, not their own posts).
//
// Reuses the same shape as parent's CoachMessageBlock component
// (PR #287). Returns array of message rows ordered by created_at
// desc, deduped to latest-per-team.
//
// Per anti-pattern #36 (data + error destructured separately) +
// #37 (team_id-scoped via FK chain).

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function useRecentTeamMessages(coachedTeamIds, currentUserId, nowMs) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const teamIds = useMemo(() => (coachedTeamIds || []).filter(Boolean), [coachedTeamIds]);

  const refetch = useCallback(async () => {
    if (!teamIds.length || !currentUserId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const cutoffIso = new Date((nowMs || Date.now()) - TWENTY_FOUR_HOURS_MS).toISOString();
    const { data, error: e } = await supabase
      .from('messages')
      .select('id, team_id, sender_id, sender_name, body, created_at, pinned, teams!inner(id, name, team_color)')
      .eq('channel', 'team')
      .in('team_id', teamIds)
      .neq('sender_id', currentUserId)
      .gte('created_at', cutoffIso)
      .order('created_at', { ascending: false });
    if (e) {
      console.error('useRecentTeamMessages fetch:', e.message);
      setError(e.message);
      setMessages([]);
      setLoading(false);
      return;
    }
    // Dedup to latest-per-team. Iteration is desc by created_at so
    // first occurrence per team is the latest.
    const seen = new Set();
    const dedup = [];
    for (const m of data || []) {
      if (seen.has(m.team_id)) continue;
      seen.add(m.team_id);
      dedup.push(m);
    }
    setError(null);
    setMessages(dedup);
    setLoading(false);
  }, [teamIds, currentUserId, nowMs]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  return { messages, loading, error, refetch };
}
