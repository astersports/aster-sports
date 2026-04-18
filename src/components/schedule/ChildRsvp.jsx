import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const PILLS = [
  { value: 'going',     label: 'Going',     color: 'var(--sf-success)' },
  { value: 'not_going', label: 'Not Going', color: 'var(--sf-danger)' },
];

export default function ChildRsvp({ child, eventId }) {
  const { guardianId } = useAuth();
  const [response, setResponse] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('event_rsvps').select('response').eq('event_id', eventId).eq('player_id', child.playerId).maybeSingle()
      .then(({ data }) => setResponse(data?.response ?? null));
  }, [eventId, child.playerId]);

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

  if (response === 'going' || response === 'not_going') {
    const isGoing = response === 'going';
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 44, marginTop: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: isGoing ? 'var(--sf-success)' : 'var(--sf-danger)' }}>
          {isGoing ? '✓' : '✗'} {child.firstName} {isGoing ? 'Going' : 'Not Going'}
        </span>
        <button type="button" onClick={(e) => { e.stopPropagation(); setResponse(null); }}
          style={{ background: 'none', border: 'none', color: 'var(--sf-accent)', fontSize: 13, fontWeight: 500, padding: 4 }}>
          Change
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--sf-text-primary)', minWidth: 60 }}>{child.firstName}</span>
      {PILLS.map((p) => (
        <button key={p.value} type="button" onClick={(e) => { e.stopPropagation(); save(p.value); }} disabled={saving} className="sf-press"
          style={{ flex: 1, minHeight: 44, borderRadius: 10, fontSize: 13, fontWeight: 600, border: `1.5px solid ${p.color}`, backgroundColor: 'transparent', color: p.color, opacity: saving ? 0.6 : 1 }}>
          {p.label}
        </button>
      ))}
    </div>
  );
}
