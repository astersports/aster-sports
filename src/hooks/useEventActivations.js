import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Per-event academy activation state. Extracted from AcademyActivationPanel
// 2026-05-20 so the toggle could live inline on the RSVP row instead of in
// a separate panel — Frank-flagged: activation decision is driven by the
// RSVP shortfall, so the two controls belong in the same list.
//
// Returns { activatedSet, toggle, loading }. When `enabled` is false (e.g.
// practice events, parent role, past games), the hook short-circuits and
// returns an empty set so callers can render conditionally without extra
// guard logic.
export function useEventActivations(eventId, enabled) {
  const [activated, setActivated] = useState(() => new Set());
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (!enabled || !eventId) { setLoading(false); return; }
      const { data, error } = await supabase
        .from('player_activations')
        .select('player_id')
        .eq('event_id', eventId);
      if (cancelled) return;
      if (error) { console.error('useEventActivations:', error.message); setLoading(false); return; }
      setActivated(new Set((data || []).map((a) => a.player_id)));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [eventId, enabled]);

  const toggle = useCallback(async (playerId) => {
    const wasActive = activated.has(playerId);
    setActivated((prev) => {
      const next = new Set(prev);
      if (wasActive) next.delete(playerId); else next.add(playerId);
      return next;
    });
    const { error } = wasActive
      ? await supabase.from('player_activations').delete().eq('event_id', eventId).eq('player_id', playerId)
      : await supabase.from('player_activations').insert({ event_id: eventId, player_id: playerId });
    if (error) {
      // Rollback on failure so UI matches DB state.
      setActivated((prev) => {
        const next = new Set(prev);
        if (wasActive) next.add(playerId); else next.delete(playerId);
        return next;
      });
    }
  }, [activated, eventId]);

  return { activatedSet: activated, toggle, loading };
}
