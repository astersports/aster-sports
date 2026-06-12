import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/useToast';

import { cacheKey, responseCache } from '../../lib/rsvpCache';
import { ButtonsVariant, SegmentedVariant } from './ChildRsvpVariants';

const PILLS = [
  { value: 'going',     label: 'Going',     color: 'var(--as-success)' },
  { value: 'maybe',     label: 'Maybe',     color: 'var(--as-warning)' },
  { value: 'not_going', label: "Can't",      color: 'var(--as-danger)' },
];

// `initialResponse`/`initialActivated`: batch state from useScheduleData
// (VF-11) — when supplied (even null) the per-row fetches are SKIPPED.
// Batchless consumers (EventDetail, TeamDetailHero) keep the self-fetch
// path. `variant="segmented"` = the §10.2 two-option 44px control.
export default function ChildRsvp({ child, eventId, eventType, compact = false, disabled = false, onSave, initialResponse, initialActivated, variant = 'pills' }) {
  const { guardianId } = useAuth(), { showToast } = useToast();
  const batchFed = initialResponse !== undefined;
  const [response, setResponse] = useState(() => batchFed ? initialResponse : (responseCache.get(cacheKey(eventId, child.playerId)) ?? null));

  const needsActivation = child.memberType === 'futures_academy' && (eventType === 'game' || eventType === 'tournament');
  const [isActivated, setIsActivated] = useState(() => initialActivated !== undefined ? (initialActivated || !needsActivation) : !needsActivation);

  useEffect(() => {
    if (!needsActivation || initialActivated !== undefined) return;
    let cancelled = false;
    supabase.from('player_activations').select('player_id')
      .eq('event_id', eventId).eq('player_id', child.playerId).maybeSingle()
      .then(({ data }) => { if (!cancelled) setIsActivated(!!data); });
    return () => { cancelled = true; };
  }, [eventId, child.playerId, needsActivation, initialActivated]);

  const fetchRsvp = useCallback(async () => {
    const { data, error } = await supabase.from('event_rsvps').select('response')
      .eq('event_id', eventId).eq('player_id', child.playerId).maybeSingle();
    if (error) console.error('fetchRsvp:', error.message);
    const next = data?.response ?? null;
    responseCache.set(cacheKey(eventId, child.playerId), next);
    setResponse((prev) => (prev === next ? prev : next));
  }, [eventId, child.playerId]);

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
    responseCache.set(cacheKey(eventId, child.playerId), value);
    setResponse(value);
    navigator.vibrate?.(10);
    const { error } = await supabase.from('event_rsvps').upsert({
      event_id: eventId, player_id: child.playerId, guardian_id: guardianId ?? null,
      response: value, responded_at: new Date().toISOString(),
    }, { onConflict: 'event_id,player_id' });
    if (error) {
      responseCache.set(cacheKey(eventId, child.playerId), prev);
      setResponse(prev);
      showToast("Looks like that didn't go through. Try again?", 'error');
    } else {
      onSave?.();
    }
  };

  const clearRsvp = async () => {
    const prev = response;
    responseCache.set(cacheKey(eventId, child.playerId), null);
    setResponse(null);
    navigator.vibrate?.(10);
    const { error } = await supabase.from('event_rsvps').delete()
      .eq('event_id', eventId).eq('player_id', child.playerId);
    if (error) {
      responseCache.set(cacheKey(eventId, child.playerId), prev);
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

  const minH = compact ? 32 : 44, pillSize = compact ? 12 : 13;

  if (!isActivated) {
    // Card variants render NOTHING — the card's facts line carries the
    // academy note (R2 / PR-V2). The pills variant (hero, home rows)
    // keeps the inline pill.
    if (variant !== 'pills') return null;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: compact ? 4 : 8 }}>
        <span style={{ fontSize: pillSize, fontWeight: 500, color: 'var(--as-text-primary)', marginRight: 'auto' }}>{child.firstName}</span>
        <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4, backgroundColor: 'var(--as-academy-soft)', color: 'var(--as-academy)' }}>Academy · Not activated</span>
      </div>
    );
  }

  if (variant === 'segmented' || variant === 'buttons') {
    const V = variant === 'segmented' ? SegmentedVariant : ButtonsVariant;
    return (
      <div role="group" aria-label={`RSVP for ${child.firstName}`}>
        <V response={response} disabled={disabled} onPick={handleClick} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: compact ? 4 : 8 }}>
      <span style={{ fontSize: pillSize, fontWeight: 500, color: 'var(--as-text-primary)', marginRight: 'auto' }}>{child.firstName}</span>
      {PILLS.map((p) => {
        const active = response === p.value;
        return (
          <button key={p.value} type="button" onClick={(e) => handleClick(e, p.value)} className="as-press"
            aria-pressed={active}
            style={{
              minWidth: 44, minHeight: minH, borderRadius: 8, padding: '0 8px',
              fontSize: pillSize, fontWeight: 600,
              border: `1px solid ${p.color}`,
              backgroundColor: active ? p.color : 'transparent',
              color: active ? 'var(--as-text-inverse)' : p.color,
              fontFamily: 'inherit',
              ...(disabled ? { opacity: 0.5, pointerEvents: 'none' } : {}),
            }}>
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
