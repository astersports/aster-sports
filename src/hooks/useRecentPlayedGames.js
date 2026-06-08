// games_recap (G1) PR C — recent played games for the multi-game picker.
// Two-step fetch (events, then their published game_results) mirroring
// briefingRecapQueries.getGameRecapPendingEvents — avoids PostgREST
// embedded-filter ambiguity. Returns past games (event_type='game') in
// the last `days` window that have a PUBLISHED result AND have NOT already
// been recapped (a sent game_recap anchors on the event; a sent games_recap
// lists it in audience_filter.event_ids) — once recapped, a game drops out
// of the picker so it can't be sent twice.

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useRecentPlayedGames(orgId, days = 60) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!orgId) {
      Promise.resolve().then(() => { if (!cancelled) { setGames([]); setLoading(false); } });
      return () => { cancelled = true; };
    }
    const nowIso = new Date().toISOString();
    const sinceIso = new Date(Date.now() - days * 86400000).toISOString();
    Promise.resolve().then(async () => {
      if (cancelled) return;
      setLoading(true);
      const { data: events, error: evErr } = await supabase.from('events')
        .select('id, start_at, opponent, teams!inner(name, org_id)')
        .eq('teams.org_id', orgId).eq('event_type', 'game')
        .lt('start_at', nowIso).gte('start_at', sinceIso)
        .order('start_at', { ascending: false }).limit(80);
      if (cancelled) return;
      if (evErr) { setGames([]); setLoading(false); return; }
      const ids = (events || []).map((e) => e.id);
      if (!ids.length) { setGames([]); setLoading(false); return; }
      const { data: results, error: grErr } = await supabase.from('game_results')
        .select('event_id, our_score, opponent_score, result, published_at').in('event_id', ids);
      if (cancelled) return;
      if (grErr) { setGames([]); setLoading(false); return; }
      // Already-recapped events (sent game_recap anchor_id + sent games_recap
      // audience_filter.event_ids) -> exclude so a game can't be recapped twice.
      const { data: recaps, error: rcErr } = await supabase.from('comms_messages')
        .select('kind, anchor_id, audience_filter')
        .eq('org_id', orgId).eq('status', 'sent').in('kind', ['game_recap', 'games_recap']);
      if (cancelled) return;
      if (rcErr) { setGames([]); setLoading(false); return; }
      const recapped = new Set();
      for (const m of (recaps || [])) {
        if (m.anchor_id) recapped.add(m.anchor_id);
        const evIds = m.audience_filter?.event_ids;
        if (Array.isArray(evIds)) for (const id of evIds) recapped.add(id);
      }
      const byEvent = new Map((results || []).filter((r) => r.published_at).map((r) => [r.event_id, r]));
      const rows = (events || [])
        .filter((e) => byEvent.has(e.id) && !recapped.has(e.id))
        .map((e) => {
          const gr = byEvent.get(e.id);
          return { id: e.id, start_at: e.start_at, opponent: e.opponent, team_name: e.teams?.name || 'Team', our_score: gr.our_score, opponent_score: gr.opponent_score, result: gr.result };
        })
        .slice(0, 50);
      setGames(rows);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [orgId, days]);

  return { games, loading };
}
