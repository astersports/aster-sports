import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/useToast';

import { cacheKey, responseCache } from '../../lib/rsvpCache';
import { ButtonsVariant, SegmentedVariant } from './ChildRsvpVariants';

// `initialResponse`/`initialActivated`: batch state from useScheduleData
// (VF-11) — when supplied (even null) the per-row fetches are SKIPPED.
// Batchless consumers (EventDetail) keep the self-fetch path. D4 tri-state
// only: variant 'buttons' (detailed) or 'segmented' (compact 44px 3-way).
// The legacy pills variant retired with its last consumer (wave-2 F-8,
// AP#51) — TeamDetailHero now rides the D4 buttons + batch feed.
export default function ChildRsvp({ child, eventId, eventType, disabled = false, onSave, initialResponse, initialActivated, variant = 'buttons' }) {
  const { guardianId } = useAuth(), { showToast } = useToast();
  const batchFed = initialResponse !== undefined;
  const [response, setResponse] = useState(() => batchFed ? initialResponse : (responseCache.get(cacheKey(eventId, child?.playerId)) ?? null));

  const needsActivation = child?.memberType === 'futures_academy' && (eventType === 'game' || eventType === 'tournament');
  const [isActivated, setIsActivated] = useState(() => initialActivated !== undefined ? (initialActivated || !needsActivation) : !needsActivation);

  useEffect(() => {
    if (!needsActivation || initialActivated !== undefined) return;
    let cancelled = false;
    supabase.from('player_activations').select('player_id')
      .eq('event_id', eventId).eq('player_id', child?.playerId).maybeSingle()
      .then(({ data }) => { if (!cancelled) setIsActivated(!!data); });
    return () => { cancelled = true; };
  }, [eventId, child?.playerId, needsActivation, initialActivated]);

  const fetchRsvp = useCallback(async () => {
    const { data, error } = await supabase.from('event_rsvps').select('response')
      .eq('event_id', eventId).eq('player_id', child?.playerId).maybeSingle();
    if (error) console.error('fetchRsvp:', error.message);
    const next = data?.response ?? null;
    responseCache.set(cacheKey(eventId, child?.playerId), next);
    setResponse((prev) => (prev === next ? prev : next));
  }, [eventId, child?.playerId]);

  // Microtask wrap on the initial fetchRsvp() call pushes its synchronous
  // setResponse out of the effect body, satisfying react-hooks/set-state-in-effect.
  useEffect(() => {
    if (batchFed) return;
    Promise.resolve().then(fetchRsvp);
  }, [fetchRsvp, batchFed]);
  // Batch refreshes flow back via prop (microtask-wrapped per above).
  useEffect(() => {
    if (!batchFed) return undefined;
    let cancelled = false;
    Promise.resolve().then(() => { if (!cancelled) setResponse((prev) => (prev === initialResponse ? prev : initialResponse)); });
    return () => { cancelled = true; };
  }, [batchFed, initialResponse]);

  const save = async (value) => {
    const prev = response;
    responseCache.set(cacheKey(eventId, child?.playerId), value);
    setResponse(value);
    navigator.vibrate?.(10);
    const { error } = await supabase.from('event_rsvps').upsert({
      event_id: eventId, player_id: child?.playerId, guardian_id: guardianId ?? null,
      response: value, responded_at: new Date().toISOString(),
    }, { onConflict: 'event_id,player_id' });
    if (error) {
      responseCache.set(cacheKey(eventId, child?.playerId), prev);
      setResponse(prev);
      showToast("Looks like that didn't go through. Try again?", 'error');
    } else {
      onSave?.();
    }
  };

  const clearRsvp = async () => {
    const prev = response;
    responseCache.set(cacheKey(eventId, child?.playerId), null);
    setResponse(null);
    navigator.vibrate?.(10);
    const { error } = await supabase.from('event_rsvps').delete()
      .eq('event_id', eventId).eq('player_id', child?.playerId);
    if (error) {
      responseCache.set(cacheKey(eventId, child?.playerId), prev);
      setResponse(prev);
      showToast("Looks like that didn't go through. Try again?", 'error');
    } else {
      onSave?.();
    }
  };

  const handleClick = (e, value) => {
    e.stopPropagation();
    if (disabled) return;
    if (value === response) clearRsvp();
    else save(value);
  };

  // Unactivated academy renders NOTHING — the D5 note belongs to the
  // consumer (card facts line; the heroes render the violet sentence).
  if (!child || !isActivated) return null;

  const V = variant === 'segmented' ? SegmentedVariant : ButtonsVariant;
  return (
    <div role="group" aria-label={`RSVP for ${child.firstName}`}>
      <V response={response} disabled={disabled} onPick={handleClick} />
    </div>
  );
}
