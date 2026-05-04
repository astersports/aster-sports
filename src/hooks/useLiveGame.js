import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const POINT_MAP = { fg2_made: 2, fg3_made: 3, ft_made: 1 };

export function useLiveGame(eventId) {
  const { user } = useAuth();
  const [plays, setPlays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(1);
  const [onCourt, setOnCourt] = useState([]);

  useEffect(() => {
    if (!eventId) return;
    supabase.from('game_plays').select('*').eq('event_id', eventId)
      .order('created_at', { ascending: true })
      .then(({ data }) => { setPlays(data || []); setLoading(false); });
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    const ch = supabase.channel(`live-${eventId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_plays', filter: `event_id=eq.${eventId}` }, (payload) => {
        setPlays((prev) => prev.some((p) => p.id === payload.new.id) ? prev : [...prev, payload.new]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'game_plays', filter: `event_id=eq.${eventId}` }, (payload) => {
        setPlays((prev) => prev.filter((p) => p.id !== payload.old.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [eventId]);

  const addPlay = useCallback(async (playType, opts = {}) => {
    const row = {
      event_id: eventId,
      team_id: opts.teamId || null,
      player_id: opts.playerId || null,
      play_type: playType,
      points: POINT_MAP[playType] || 0,
      period,
      is_opponent: opts.isOpponent || false,
      created_by: user?.id,
    };
    const { data, error } = await supabase.from('game_plays').insert(row).select().single();
    if (error) { console.error('addPlay:', error.message); return null; }
    return data;
  }, [eventId, period, user]);

  const undoLast = useCallback(async () => {
    if (plays.length === 0) return;
    const last = plays[plays.length - 1];
    setPlays((prev) => prev.slice(0, -1));
    await supabase.from('game_plays').delete().eq('id', last.id);
  }, [plays]);

  const subIn = useCallback((playerId) => {
    setOnCourt((prev) => prev.includes(playerId) ? prev : [...prev, playerId]);
    addPlay('sub_in', { playerId });
  }, [addPlay]);

  const subOut = useCallback((playerId) => {
    setOnCourt((prev) => prev.filter((id) => id !== playerId));
    addPlay('sub_out', { playerId });
  }, [addPlay]);

  const ourScore = plays.filter((p) => !p.is_opponent).reduce((s, p) => s + p.points, 0);
  const oppScore = plays.filter((p) => p.is_opponent).reduce((s, p) => s + p.points, 0);

  const playerStats = {};
  plays.filter((p) => p.player_id && !p.is_opponent).forEach((p) => {
    if (!playerStats[p.player_id]) playerStats[p.player_id] = { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, foul: 0 };
    const s = playerStats[p.player_id];
    s.pts += p.points;
    if (p.play_type === 'rebound') s.reb++;
    if (p.play_type === 'assist') s.ast++;
    if (p.play_type === 'steal') s.stl++;
    if (p.play_type === 'block') s.blk++;
    if (p.play_type === 'turnover') s.to++;
    if (p.play_type === 'foul') s.foul++;
  });

  return { plays, loading, period, setPeriod, onCourt, ourScore, oppScore, playerStats, addPlay, undoLast, subIn, subOut };
}
