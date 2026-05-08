import { useCallback, useState } from 'react';
import { supabase } from '../../lib/supabase';

const ITEMS = [
  { key: 'rsvp_closed', label: 'RSVPs in', auto: true },
  { key: 'lineup_set', label: 'Lineup set', auto: false },
  { key: 'equipment', label: 'Equipment', auto: false },
  { key: 'directions', label: 'Directions sent', auto: true },
  { key: 'officials', label: 'Officials confirmed', gameOnly: true, auto: false },
];

export default function CoachChecklist({ event }) {
  const [state, setState] = useState(event.coach_checklist_state || {});
  const isGame = event.event_type === 'game' || event.event_type === 'tournament';
  const items = ITEMS.filter((i) => !i.gameOnly || isGame);
  const allDone = items.every((item) => state[item.key]);

  const toggle = useCallback(async (key) => {
    const next = { ...state, [key]: !state[key] };
    setState(next);
    await supabase.from('events').update({ coach_checklist_state: next }).eq('id', event.id);
  }, [state, event.id]);

  return (
    <div style={{ padding: '0 16px 12px' }}>
      <div style={{ padding: 12, borderRadius: 10, border: allDone ? '1px solid var(--em-success)' : '1px solid var(--em-border-default)', backgroundColor: allDone ? 'var(--em-success-soft)' : undefined }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: allDone ? 'var(--em-success)' : 'var(--em-text-tertiary)', marginBottom: 8 }}>{allDone ? 'Pre-Game Checklist ✓' : 'Pre-Game Checklist'}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((item) => {
          const done = state[item.key];
          return (
            <button key={item.key} type="button" onClick={() => toggle(item.key)} className="sf-press"
              role="checkbox" aria-checked={done} aria-label={item.label}
              style={{
                flexShrink: 0, minHeight: 40, padding: '0 14px', borderRadius: 10,
                fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                border: done ? 'none' : '1px solid var(--em-border-default)',
                backgroundColor: done ? 'var(--em-success-soft)' : 'var(--em-bg-card)',
                color: done ? 'var(--em-success)' : 'var(--em-text-secondary)',
                whiteSpace: 'nowrap',
              }}>
              <span style={{ width: 18, height: 18, borderRadius: 4, border: done ? 'none' : '1.5px solid var(--em-border-default)', backgroundColor: done ? 'var(--em-success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--em-text-inverse)', fontWeight: 700 }}>{done ? '✓' : ''}</span>
              {item.label}
            </button>
          );
        })}
      </div>
      </div>
    </div>
  );
}
