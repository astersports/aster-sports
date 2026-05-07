import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

export function useGameDetail(eventId) {
  const [result, setResult] = useState(null);
  const [plays, setPlays] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) { Promise.resolve().then(() => setLoading(false)); return; }
    let cancelled = false;
    (async () => {
      const [grRes, plRes, stRes] = await Promise.all([
        supabase.from('game_results').select('*').eq('event_id', eventId).maybeSingle(),
        supabase.from('game_plays').select('*').eq('event_id', eventId).eq('is_voided', false).order('created_at', { ascending: true }),
        supabase.from('player_game_stats').select('*, players(id, first_name, last_name)').eq('event_id', eventId).order('pts', { ascending: false, nullsFirst: false }),
      ]);
      if (cancelled) return;
      setResult(grRes.data || null);
      setPlays(plRes.data || []);
      setStats(stRes.data || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [eventId]);

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

  return { result, plays, stats, quarterScores, loading, update };
}
