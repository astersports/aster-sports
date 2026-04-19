import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const PILLS = [
  { value: 'going',     label: 'Going',     color: 'var(--sf-success)' },
  { value: 'maybe',     label: 'Maybe',     color: 'var(--sf-warning)' },
  { value: 'not_going', label: 'Not Going', color: 'var(--sf-danger)' },
];

const CONFIRMED = {
  going:     { icon: '✓', label: 'Going',     color: 'var(--sf-success)' },
  maybe:     { icon: '?', label: 'Maybe',     color: 'var(--sf-warning)' },
  not_going: { icon: '✗', label: 'Not Going', color: 'var(--sf-danger)' },
};

export default function ChildRsvp({ child, eventId, compact = false }) {
  const { guardianId } = useAuth();
  const [response, setResponse] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchRsvp = useCallback(async () => {
    const { data } = await supabase.from('event_rsvps').select('response')
      .eq('event_id', eventId).eq('player_id', child.playerId).maybeSingle();
    setResponse(data?.response ?? null);
  }, [eventId, child.playerId]);

  useEffect(() => {
    fetchRsvp();
    const handler = () => fetchRsvp();
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, [fetchRsvp]);

  const save = async (value) => {
    setSaving(true);
    navigator.vibrate?.(10);
    const { error } = await supabase.from('event_rsvps').upsert({
      event_id: eventId, player_id: child.playerId, guardian_id: guardianId ?? null,
      response: value, responded_at: new Date().toISOString(),
    }, { onConflict: 'event_id,player_id' });
    setSaving(false);
    if (!error) setResponse(value);
    else console.error('RSVP save failed:', error.message);
  };

  const minH = compact ? 36 : 44;
  const nameSize = compact ? 12 : 14;
  const pillSize = compact ? 12 : 13;

  const state = CONFIRMED[response];
  if (state) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: minH, marginTop: compact ? 4 : 8 }}>
        <span style={{ fontSize: nameSize, fontWeight: 500, color: state.color }}>
          {state.icon} {child.firstName} {state.label}
        </span>
        <button type="button" onClick={(e) => { e.stopPropagation(); setResponse(null); }}
          style={{ background: 'none', border: 'none', color: 'var(--sf-accent)', fontSize: pillSize, fontWeight: 500, padding: 4 }}>
          Change
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: compact ? 4 : 8 }}>
      <span style={{ fontSize: pillSize, fontWeight: 500, color: 'var(--sf-text-primary)', minWidth: 60 }}>{child.firstName}</span>
      {PILLS.map((p) => (
        <button key={p.value} type="button" onClick={(e) => { e.stopPropagation(); save(p.value); }} disabled={saving} className="sf-press"
          style={{ flex: 1, minHeight: minH, borderRadius: 10, fontSize: pillSize, fontWeight: 600, border: `1.5px solid ${p.color}`, backgroundColor: 'transparent', color: p.color, opacity: saving ? 0.6 : 1 }}>
          {p.label}
        </button>
      ))}
    </div>
  );
}
