import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const POINT_MAP = { fg2_made: 2, fg3_made: 3, ft_made: 1 };

export function usePlayerSeasonStats(teamId) {
  const [plays, setPlays] = useState(null);
  const fetchIdRef = useRef(0);

  const fetch = useCallback(() => {
    if (!teamId) return;
    const id = ++fetchIdRef.current;
    supabase
      .from('game_plays')
      .select('player_id, play_type, event_id, events!inner(team_id)')
      .eq('events.team_id', teamId)
      .eq('is_voided', false)
      .eq('is_opponent', false)
      .not('player_id', 'is', null)
      .then(({ data, error }) => {
        if (id !== fetchIdRef.current) return;
        if (error) console.error('usePlayerSeasonStats:', error.message);
        setPlays(data || []);
      });
  }, [teamId]);

  useEffect(() => { fetch(); }, [fetch]);

  const stats = useMemo(() => {
    if (!plays) return {};
    const map = {};
    const gamesByPlayer = {};
    for (const p of plays) {
      if (!map[p.player_id]) map[p.player_id] = { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, foul: 0, gp: 0 };
      if (!gamesByPlayer[p.player_id]) gamesByPlayer[p.player_id] = new Set();
      const s = map[p.player_id];
      s.pts += POINT_MAP[p.play_type] || 0;
      if (p.play_type === 'rebound') s.reb++;
      if (p.play_type === 'assist') s.ast++;
      if (p.play_type === 'steal') s.stl++;
      if (p.play_type === 'block') s.blk++;
      if (p.play_type === 'turnover') s.to++;
      if (p.play_type === 'foul') s.foul++;
      gamesByPlayer[p.player_id].add(p.event_id);
    }
    for (const [pid, games] of Object.entries(gamesByPlayer)) {
      map[pid].gp = games.size;
    }
    return map;
  }, [plays]);

  return { stats, loading: plays === null };
}
