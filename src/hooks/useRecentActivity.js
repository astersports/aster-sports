import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

// HOME_DESIGN_SPEC §3.1.6 — admin home RECENT ACTIVITY feed.
// Merges three org-scoped streams (last 24h), sorted by timestamp
// desc, top N items:
//   - rsvp:           latest event_rsvps responses
//   - announcement:   latest messages WHERE channel='announcement'
//   - game_result:    latest game_results WHERE published_at IS NOT NULL
//
// Each item carries { ts, kind, text, team_color }. Caller renders;
// hook is pure data merging.
//
// Per anti-pattern #36 (data + error destructured) + #37 (org_id
// scoping via FK chain through teams!inner).

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LIMIT = 8;

const NEUTRAL = 'var(--as-neutral)';

export function useRecentActivity(orgId, seasonId, { limit = DEFAULT_LIMIT } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!orgId || !seasonId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const cutoffIso = new Date(Date.now() - TWENTY_FOUR_HOURS_MS).toISOString();
    // L99 TIER 2 perf — players fetch was a sequential 4th await after the
    // Promise.all of 3. event_rsvps has no declared FK to players (player_id
    // column exists; no FK constraint), so the PostgREST embed isn't
    // available (§4.AD BUG-D context). Instead: fold a small org-scoped
    // players prefetch (~60 rows for our scale) into the parallel batch and
    // join in JS at merge time. Saves one round trip on admin home first paint.
    const [rsvpRes, msgRes, gameRes, playersRes] = await Promise.all([
      supabase
        .from('event_rsvps')
        .select('id, response, responded_at, player_id, events!inner(id, teams!inner(id, name, team_color, season_id))')
        .eq('events.teams.season_id', seasonId)
        .gte('responded_at', cutoffIso)
        .order('responded_at', { ascending: false })
        .limit(limit),
      supabase
        .from('messages')
        .select('id, sender_name, body, created_at, teams!inner(id, name, team_color, season_id)')
        .eq('channel', 'announcement')
        .eq('teams.season_id', seasonId)
        .gte('created_at', cutoffIso)
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('game_results')
        .select('id, result, our_score, opponent_score, published_at, events!inner(id, opponent, teams!inner(id, name, team_color, season_id))')
        .eq('events.teams.season_id', seasonId)
        .not('published_at', 'is', null)
        .gte('published_at', cutoffIso)
        .order('published_at', { ascending: false })
        .limit(limit),
      supabase
        .from('players').select('id, first_name, last_name').eq('org_id', orgId),
    ]);
    const firstErr = rsvpRes.error || msgRes.error || gameRes.error || playersRes.error;
    if (firstErr) {
      console.error('useRecentActivity fetch:', firstErr.message);
      setError(firstErr.message);
      setItems([]);
      setLoading(false);
      return;
    }
    const playerMap = new Map((playersRes.data ?? []).map((p) => [p.id, p]));
    const merged = [
      ...(rsvpRes.data || []).map((r) => {
        const player = playerMap.get(r.player_id);
        const kid = player ? `${player.first_name} ${player.last_name?.[0] || ''}`.trim() : 'Someone';
        const verb = r.response === 'going' ? "RSVP'd Going" : r.response === 'maybe' ? "RSVP'd Maybe" : "RSVP'd Can't";
        const team = r.events?.teams?.name || '';
        return { ts: r.responded_at, kind: 'rsvp', text: `${kid} ${verb}${team ? ` · ${team}` : ''}`, team_color: r.events?.teams?.team_color || NEUTRAL };
      }),
      ...(msgRes.data || []).map((m) => ({
        ts: m.created_at,
        kind: 'announcement',
        text: `${m.sender_name || 'Coach'} posted to ${m.teams?.name || 'team'}`,
        team_color: m.teams?.team_color || NEUTRAL,
      })),
      ...(gameRes.data || []).map((g) => {
        const team = g.events?.teams?.name || 'Team';
        const verb = g.result === 'W' ? 'won' : g.result === 'L' ? 'lost' : 'tied';
        return { ts: g.published_at, kind: 'game_result', text: `${team} ${verb} ${g.our_score}-${g.opponent_score}`, team_color: g.events?.teams?.team_color || NEUTRAL };
      }),
    ];
    merged.sort((a, b) => new Date(b.ts) - new Date(a.ts));
    setError(null);
    setItems(merged.slice(0, limit));
    setLoading(false);
  }, [orgId, seasonId, limit]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  return useMemo(() => ({ items, loading, error, refetch }), [items, loading, error, refetch]);
}
