import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// §4.C Sprint E — Admin ACTION QUEUE second signal: unscored games
// past their start time. Surfaces games (event_type='game' OR
// 'tournament') that have already started but lack a published
// game_results row. Bounds the lookback to 7 days so old un-scored
// games don't dominate the queue forever.
//
// Per HOME_DESIGN_SPEC §3.1 Admin "Attention Required" intent:
// surface ops gaps that need chasing (in this case, ask the coach
// to enter the score).
//
// Strategy: query events for games in window, then LEFT-style check
// via a separate game_results published_at fetch. Single roundtrip
// each via Promise.all.
//
// Per anti-pattern #36: data + error destructured separately +
// first-observed error surfaces. Per #37: events query implicit
// org-scope via the join chain (events.team_id → teams.org_id
// per public RLS pattern).

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function useUnscoredGames(orgId, nowMs) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!orgId || !nowMs) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const cutoffStart = new Date(nowMs - SEVEN_DAYS_MS).toISOString();
    const nowIso = new Date(nowMs).toISOString();
    const { data: events, error: e } = await supabase
      .from('events')
      .select('id, title, event_type, start_at, opponent, team_id, teams!inner(id, name, team_color, org_id)')
      .in('event_type', ['game', 'tournament'])
      .eq('teams.org_id', orgId)
      .gte('start_at', cutoffStart)
      .lt('start_at', nowIso)
      .neq('status', 'cancelled');
    if (e) {
      console.error('useUnscoredGames events fetch:', e.message);
      setError(e.message);
      setItems([]);
      setLoading(false);
      return;
    }
    const ids = (events || []).map((ev) => ev.id);
    if (!ids.length) {
      setError(null);
      setItems([]);
      setLoading(false);
      return;
    }
    const { data: results, error: re } = await supabase
      .from('game_results')
      .select('event_id, published_at')
      .in('event_id', ids);
    if (re) {
      console.error('useUnscoredGames results fetch:', re.message);
      setError(re.message);
      setItems([]);
      setLoading(false);
      return;
    }
    const publishedSet = new Set();
    for (const r of results || []) {
      if (r.published_at) publishedSet.add(r.event_id);
    }
    const out = (events || [])
      .filter((ev) => !publishedSet.has(ev.id))
      .map((ev) => {
        const teamName = ev.teams?.name || 'Team';
        const opponent = ev.opponent;
        const titleBit = opponent ? `vs ${opponent}` : (ev.title || 'Game');
        return {
          kind: 'unscored_game',
          primary: `${teamName}: ${titleBit}`,
          secondary: 'Score not entered yet',
          href: `/events/${ev.id}`,
          id: ev.id,
          event_id: ev.id,
          start_at: ev.start_at,
          team_name: teamName,
          team_color: ev.teams?.team_color || 'var(--as-warning)',
        };
      });
    out.sort((a, b) => new Date(b.start_at) - new Date(a.start_at)); // most-recent past game first
    setError(null);
    setItems(out);
    setLoading(false);
  }, [orgId, nowMs]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  return { items, loading, error, refetch };
}
