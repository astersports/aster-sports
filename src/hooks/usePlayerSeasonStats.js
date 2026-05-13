import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export function usePlayerSeasonStats(teamId) {
  const [rows, setRows] = useState(null);
  const fetchIdRef = useRef(0);

  const fetch = useCallback(() => {
    if (!teamId) return;
    const id = ++fetchIdRef.current;
    supabase
      .from('player_game_stats')
      .select('player_id, pts, pf, fg_made, fg_att, three_made, three_att, ft_made, ft_att, to_count, orb, drb, reb, ast, stl, blk, plus_minus')
      .eq('team_id', teamId)
      .then(({ data, error }) => {
        if (id !== fetchIdRef.current) return;
        if (error) console.error('usePlayerSeasonStats:', error.message);
        setRows(data || []);
      });
  }, [teamId]);

  useEffect(() => { fetch(); }, [fetch]);

  const stats = useMemo(() => {
    if (!rows) return {};
    const map = {};
    for (const r of rows) {
      if (!map[r.player_id]) {
        map[r.player_id] = { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, foul: 0, gp: 0,
          fg_made: 0, fg_att: 0, three_made: 0, three_att: 0, ft_made: 0, ft_att: 0, orb: 0, drb: 0, plus_minus: 0 };
      }
      const s = map[r.player_id];
      s.gp++;
      s.pts += r.pts; s.reb += r.reb; s.ast += r.ast; s.stl += r.stl; s.blk += r.blk;
      s.to += r.to_count; s.foul += r.pf; s.plus_minus += r.plus_minus;
      s.fg_made += r.fg_made; s.fg_att += r.fg_att;
      s.three_made += r.three_made; s.three_att += r.three_att;
      s.ft_made += r.ft_made; s.ft_att += r.ft_att;
      s.orb += r.orb; s.drb += r.drb;
    }
    return map;
  }, [rows]);

  return { stats, loading: rows === null };
}
