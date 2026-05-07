import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

export function useGameDetail(eventId) {
  const [result, setResult] = useState(null);
  const [plays, setPlays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) { Promise.resolve().then(() => setLoading(false)); return; }
    let cancelled = false;
    (async () => {
      const [grRes, plRes] = await Promise.all([
        supabase.from('game_results').select('*').eq('event_id', eventId).maybeSingle(),
        supabase.from('game_plays').select('*').eq('event_id', eventId).eq('is_voided', false).order('created_at', { ascending: true }),
      ]);
      if (cancelled) return;
      setResult(grRes.data || null);
      setPlays(plRes.data || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [eventId]);

  const playerStats = useMemo(() => {
    const map = {};
    for (const p of plays) {
      if (p.is_opponent || !p.player_id) continue;
      if (!map[p.player_id]) map[p.player_id] = { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, foul: 0, fgm: 0, fga: 0, fg3m: 0, fg3a: 0, ftm: 0, fta: 0 };
      const s = map[p.player_id];
      if (p.play_type === 'fg2_made') { s.pts += 2; s.fgm++; s.fga++; }
      else if (p.play_type === 'fg2_miss') { s.fga++; }
      else if (p.play_type === 'fg3_made') { s.pts += 3; s.fgm++; s.fga++; s.fg3m++; s.fg3a++; }
      else if (p.play_type === 'fg3_miss') { s.fga++; s.fg3a++; }
      else if (p.play_type === 'ft_made') { s.pts += 1; s.ftm++; s.fta++; }
      else if (p.play_type === 'ft_miss') { s.fta++; }
      else if (p.play_type === 'rebound') s.reb++;
      else if (p.play_type === 'assist') s.ast++;
      else if (p.play_type === 'steal') s.stl++;
      else if (p.play_type === 'block') s.blk++;
      else if (p.play_type === 'turnover') s.to++;
      else if (p.play_type === 'foul') s.foul++;
    }
    return map;
  }, [plays]);

  const quarterScores = useMemo(() => {
    const qs = {};
    for (const p of plays) {
      const per = p.period || 1;
      if (!qs[per]) qs[per] = { us: 0, them: 0 };
      const pts = p.play_type === 'fg2_made' ? 2 : p.play_type === 'fg3_made' ? 3 : p.play_type === 'ft_made' ? 1 : 0;
      if (pts) { if (p.is_opponent) qs[per].them += pts; else qs[per].us += pts; }
    }
    return qs;
  }, [plays]);

  const update = async (fields) => {
    if (!result?.id) return;
    await supabase.from('game_results').update(fields).eq('id', result.id);
    setResult((prev) => prev ? { ...prev, ...fields } : prev);
  };

  return { result, plays, playerStats, quarterScores, loading, update };
}
