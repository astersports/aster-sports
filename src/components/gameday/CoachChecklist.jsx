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

  const toggle = useCallback(async (key) => {
    const next = { ...state, [key]: !state[key] };
    setState(next);
    await supabase.from('events').update({ coach_checklist_state: next }).eq('id', event.id);
  }, [state, event.id]);

  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 16px 12px' }} className="sf-no-scrollbar">
      {items.map((item) => {
        const done = state[item.key];
        return (
          <button key={item.key} type="button" onClick={() => toggle(item.key)} className="sf-press"
            style={{
              flexShrink: 0, minHeight: 36, padding: '0 12px', borderRadius: 999,
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
              border: done ? 'none' : '1px solid var(--em-border-default)',
              backgroundColor: done ? 'var(--em-success)' : 'var(--em-bg-card)',
              color: done ? 'var(--em-text-inverse)' : 'var(--em-text-secondary)',
              whiteSpace: 'nowrap',
            }}>
            {done ? '✓ ' : ''}{item.label}
          </button>
        );
      })}
    </div>
  );
}
