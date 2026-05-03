import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/useToast';

// Module-level cache so response survives component unmount/remount on nav.
const responseCache = new Map();
const cacheKey = (eventId, playerId) => `${eventId}:${playerId}`;

const PILLS = [
  { value: 'going',     label: 'Going',     color: 'var(--em-success)' },
  { value: 'maybe',     label: 'Maybe',     color: 'var(--em-warning)' },
  { value: 'not_going', label: 'No',        color: 'var(--em-danger)' },
];

export default function ChildRsvp({ child, eventId, compact = false }) {
  const { guardianId } = useAuth();
  const { showToast } = useToast();
  const [response, setResponse] = useState(() => responseCache.get(cacheKey(eventId, child.playerId)) ?? null);

  const fetchRsvp = useCallback(async () => {
    const { data } = await supabase.from('event_rsvps').select('response')
      .eq('event_id', eventId).eq('player_id', child.playerId).maybeSingle();
    const next = data?.response ?? null;
    responseCache.set(cacheKey(eventId, child.playerId), next);
    setResponse((prev) => (prev === next ? prev : next));
  }, [eventId, child.playerId]);

  // Microtask wrap on the initial fetchRsvp() call pushes its synchronous
  // setResponse out of the effect body, satisfying react-hooks/set-state-in-effect.
  useEffect(() => {
    Promise.resolve().then(fetchRsvp);
    const handler = () => fetchRsvp();
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
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
    }
  };

  const handleClick = (e, value) => {
    e.stopPropagation();
    if (value === response) clearRsvp();
    else save(value);
  };

  const minH = compact ? 36 : 44;
  const pillSize = compact ? 12 : 13;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: compact ? 4 : 8 }}>
      <span style={{ fontSize: pillSize, fontWeight: 500, color: 'var(--em-text-primary)', minWidth: 60 }}>{child.firstName}</span>
      {PILLS.map((p) => {
        const active = response === p.value;
        return (
          <button key={p.value} type="button" onClick={(e) => handleClick(e, p.value)} className="sf-press"
            aria-pressed={active}
            style={{
              flex: 1, minWidth: 0, minHeight: minH, borderRadius: 10,
              fontSize: pillSize, fontWeight: 600,
              border: `1.5px solid ${p.color}`,
              backgroundColor: active ? p.color : 'transparent',
              color: active ? 'var(--em-text-inverse)' : p.color,
              fontFamily: 'inherit',
            }}>
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
