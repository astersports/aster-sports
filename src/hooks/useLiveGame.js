import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';

const POINT_MAP = { fg2_made: 2, fg3_made: 3, ft_made: 1 };

export function useLiveGame(eventId) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [plays, setPlays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(1);
  const undoingRef = useRef(false);

  useEffect(() => {
    if (!eventId) return;
    supabase.from('game_plays').select('*').eq('event_id', eventId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) showToast("Couldn't load plays. Check your connection.", 'error');
        setPlays(data || []);
        setLoading(false);
      });
  }, [eventId, showToast]);

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
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const row = {
      event_id: eventId, team_id: opts.teamId || null, player_id: opts.playerId || null,
      play_type: playType, points: POINT_MAP[playType] || 0, period,
      is_opponent: opts.isOpponent || false, created_by: user?.id,
    };
    setPlays((prev) => [...prev, { ...row, id: tempId, created_at: new Date().toISOString() }]);
    const { data, error } = await supabase.from('game_plays').insert(row).select().single();
    if (error) {
      showToast("Play didn't save. Check your connection.", 'error');
      setPlays((prev) => prev.filter((p) => p.id !== tempId));
      return null;
    }
    setPlays((prev) => prev.map((p) => p.id === tempId ? data : p));
    return data;
  }, [eventId, period, user, showToast]);

  const undoLast = useCallback(async () => {
    if (undoingRef.current) return;
    undoingRef.current = true;
    setPlays((prev) => {
      if (prev.length === 0) { undoingRef.current = false; return prev; }
      const last = prev[prev.length - 1];
      supabase.from('game_plays').delete().eq('id', last.id)
        .then(({ error }) => {
          undoingRef.current = false;
          if (error) showToast("Couldn't undo. Try again?", 'error');
        });
      return prev.slice(0, -1);
    });
  }, [showToast]);

  const onCourt = useMemo(() => {
    const court = new Set();
    plays.forEach((p) => {
      if (p.play_type === 'sub_in' && p.player_id) court.add(p.player_id);
      if (p.play_type === 'sub_out' && p.player_id) court.delete(p.player_id);
    });
    return [...court];
  }, [plays]);

  const subIn = useCallback((playerId) => { addPlay('sub_in', { playerId }); }, [addPlay]);
  const subOut = useCallback((playerId) => { addPlay('sub_out', { playerId }); }, [addPlay]);

  const ourScore = plays.filter((p) => !p.is_opponent).reduce((s, p) => s + (p.points || 0), 0);
  const oppScore = plays.filter((p) => p.is_opponent).reduce((s, p) => s + (p.points || 0), 0);

  const playerStats = useMemo(() => {
    const stats = {};
    plays.filter((p) => p.player_id && !p.is_opponent).forEach((p) => {
      if (!stats[p.player_id]) stats[p.player_id] = { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, foul: 0 };
      const s = stats[p.player_id];
      s.pts += (p.points || 0);
      if (p.play_type === 'rebound') s.reb++;
      if (p.play_type === 'assist') s.ast++;
      if (p.play_type === 'steal') s.stl++;
      if (p.play_type === 'block') s.blk++;
      if (p.play_type === 'turnover') s.to++;
      if (p.play_type === 'foul') s.foul++;
    });
    return stats;
  }, [plays]);

  const saveToGameResults = useCallback(async () => {
    const result = ourScore > oppScore ? 'W' : ourScore < oppScore ? 'L' : 'T';
    const { data: existing } = await supabase.from('game_results').select('id').eq('event_id', eventId).maybeSingle();
    const row = { event_id: eventId, our_score: ourScore, opponent_score: oppScore, result, point_differential: ourScore - oppScore, published_at: new Date().toISOString(), published_by: user?.id };
    let error;
    if (existing) {
      ({ error } = await supabase.from('game_results').update(row).eq('id', existing.id));
    } else {
      ({ error } = await supabase.from('game_results').insert(row));
    }
    if (error) { showToast("Couldn't save final score. Try again?", 'error'); return false; }
    showToast('Final score saved and published.', 'success');
    return true;
  }, [eventId, ourScore, oppScore, user, showToast]);

  return { plays, loading, period, setPeriod, onCourt, ourScore, oppScore, playerStats, addPlay, undoLast, subIn, subOut, saveToGameResults };
}
