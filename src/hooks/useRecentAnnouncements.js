import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

// §4.C Sprint C — COACH MESSAGE BLOCK per HOME_DESIGN_SPEC §1.1.7.
// Surfaces recent coach/admin broadcasts (channel='announcement')
// posted within the last 24h on parent's kids' teams.
//
// V1 scope: announcement channel only. The spec talks about "team
// chat" but team chat is two-way conversation; announcements are
// the coach→parents broadcast surface. Filtering to announcement
// gives the cleanest "coach posted" signal without needing a
// per-message coach-role check (staff post via RLS-gated insert).
//
// Returns at most one message per team (the latest). Sorted
// globally by created_at DESC so the newest team's announcement
// renders first.
//
// Per anti-pattern #36 (data + error destructured separately) +
// #37 (team_id-scoped, messages also carries org_id which the chain
// goes through implicitly via team_id RLS).

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function useRecentAnnouncements(myTeamIds, nowMs) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const teamIds = useMemo(() => (myTeamIds || []).filter(Boolean), [myTeamIds]);

  const refetch = useCallback(async () => {
    if (!teamIds.length) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const cutoffIso = new Date((nowMs || Date.now()) - TWENTY_FOUR_HOURS_MS).toISOString();
    const { data, error: e } = await supabase
      .from('messages')
      .select('id, team_id, sender_id, sender_name, body, created_at, pinned, teams!inner(id, name, team_color)')
      .eq('channel', 'announcement')
      .in('team_id', teamIds)
      .gte('created_at', cutoffIso)
      .order('created_at', { ascending: false });
    if (e) {
      console.error('useRecentAnnouncements fetch:', e.message);
      setError(e.message);
      setMessages([]);
      setLoading(false);
      return;
    }
    // Dedup to latest-per-team. Iteration is desc by created_at so
    // first occurrence per team is the latest.
    const seenTeams = new Set();
    const dedup = [];
    for (const m of data || []) {
      if (seenTeams.has(m.team_id)) continue;
      seenTeams.add(m.team_id);
      dedup.push(m);
    }
    setError(null);
    setMessages(dedup);
    setLoading(false);
  }, [teamIds, nowMs]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  return { messages, loading, error, refetch };
}
