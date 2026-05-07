import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/useToast';

import { cacheKey, responseCache } from '../../lib/rsvpCache';

const PILLS = [
  { value: 'going',     label: 'Going',     color: 'var(--em-success)' },
  { value: 'maybe',     label: 'Maybe',     color: 'var(--em-warning)' },
  { value: 'not_going', label: 'No',        color: 'var(--em-danger)' },
];

export default function ChildRsvp({ child, eventId, eventType, compact = false, onSave, disabled = false }) {
  const { guardianId } = useAuth();
  const { showToast } = useToast();
  const [response, setResponse] = useState(() => responseCache.get(cacheKey(eventId, child.playerId)) ?? null);
  const needsActivation = child.memberType === 'futures_academy' && (eventType === 'game' || eventType === 'tournament');
  const [isActivated, setIsActivated] = useState(!needsActivation);

  // Academy players only see RSVP for games/tournaments if activated
  useEffect(() => {
    if (child.memberType !== 'futures_academy') return;
    if (!eventType || (eventType !== 'game' && eventType !== 'tournament')) return;
    let cancelled = false;
    supabase.from('player_activations').select('player_id')
      .eq('event_id', eventId).eq('player_id', child.playerId).maybeSingle()
      .then(({ data }) => { if (!cancelled) setIsActivated(!!data); });
    return () => { cancelled = true; };
  }, [eventId, child.playerId, child.memberType, eventType]);

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
    Promise.resolve().then(fetchRsvp);
  }, [fetchRsvp]);

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

  const minH = compact ? 32 : 44;
  const pillSize = compact ? 12 : 13;

  if (!isActivated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: compact ? 4 : 8 }}>
        <span style={{ fontSize: pillSize, fontWeight: 500, color: 'var(--em-text-primary)', marginRight: 'auto' }}>{child.firstName}</span>
        <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4, backgroundColor: 'var(--em-academy-soft)', color: 'var(--em-academy)' }}>Academy · Not activated</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: compact ? 4 : 8 }}>
      <span style={{ fontSize: pillSize, fontWeight: 500, color: 'var(--em-text-primary)', marginRight: 'auto' }}>{child.firstName}</span>
      {PILLS.map((p) => {
        const active = response === p.value;
        return (
          <button key={p.value} type="button" onClick={(e) => handleClick(e, p.value)} className="sf-press"
            aria-pressed={active}
            style={{
              minWidth: 44, minHeight: minH, borderRadius: 8, padding: '0 8px',
              fontSize: pillSize, fontWeight: 600,
              border: `1px solid ${p.color}`,
              backgroundColor: active ? p.color : 'transparent',
              color: active ? 'var(--em-text-inverse)' : p.color,
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
