// §5-A follow-up (2026-05-24) — inline opponent setter for the score
// sheet. When an event was created without an opponent (common for
// bracket/championship placeholders — see the 10U Black Rumble for the
// Ring championship that scored with a null opponent), this lets the
// admin set it WITHOUT leaving the score sheet. Removes the prior
// dead-end ("close this sheet, tap the event, edit the opponent field").
//
// Writes events.opponent (text) + opponent_id (when the typed name
// matches a saved opponent — keeps head-to-head accurate). Mirrors the
// create-event wizard's datalist autocomplete (StepDetails.jsx).

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useOpponents } from '../../hooks/useOpponents';

const inputStyle = { width: '100%', minHeight: 44, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)', fontSize: 15, fontFamily: 'inherit' };
const btnStyle = (active) => ({ marginTop: 8, minHeight: 44, width: '100%', borderRadius: 10, border: 'none', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: active ? 'pointer' : 'default', backgroundColor: active ? 'var(--em-accent)' : 'var(--em-bg-secondary)', color: active ? 'var(--em-text-inverse)' : 'var(--em-text-tertiary)' });

export default function OpponentInlineField({ eventId, onSaved }) {
  const { opponents } = useOpponents();
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const save = async () => {
    const name = value.trim();
    if (!name || saving) return;
    setSaving(true); setError(false);
    const match = opponents.find((o) => o.name.toLowerCase() === name.toLowerCase());
    const { error: e } = await supabase.from('events')
      .update({ opponent: name, opponent_id: match?.id ?? null })
      .eq('id', eventId);
    setSaving(false);
    if (e) { setError(true); return; }
    onSaved(name);
  };

  return (
    <div role="group" aria-label="Set opponent" style={{ marginBottom: 16, padding: 12, backgroundColor: 'var(--em-warning-soft)', borderLeft: '4px solid var(--em-warning)', borderRadius: 6 }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--em-text-primary)', marginBottom: 8 }}>
        Who did you play? Set the opponent to publish.
      </div>
      <input list="score-opponent-list" value={value} onChange={(e) => setValue(e.target.value)}
        placeholder="Search or type opponent name" aria-label="Opponent name" style={inputStyle} />
      <datalist id="score-opponent-list">
        {opponents.map((o) => <option key={o.id} value={o.name} />)}
      </datalist>
      <button type="button" onClick={save} disabled={!value.trim() || saving} className="em-press" style={btnStyle(!!value.trim() && !saving)}>
        {saving ? 'Saving…' : 'Set opponent'}
      </button>
      {error && <div role="alert" style={{ marginTop: 6, fontSize: 13, color: 'var(--em-danger)' }}>Couldn&apos;t save. Try again.</div>}
    </div>
  );
}
