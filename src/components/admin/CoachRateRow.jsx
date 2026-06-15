import { useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';

// One coaching_assignment's pay rate, edited + saved on its OWN. The write
// touches EXACTLY this row (id-scoped) — it never fans across the coach's other
// teams (the PR-4b clobber fix). Empty field → NULL (Unpaid); a paid rate must
// be > 0 (reject 0/negatives). Future imported sessions pick up the new rate via
// the PR-4a stamp trigger; this edit never touches existing pay_cents or totals.
const ROLE = { head_coach: 'Head coach', assistant: 'Assistant', program_director: 'Program director', coach: 'Coach' };
const SCOPE = { all_events: 'All events', games_only: 'Games only', practices_only: 'Practices only' };
const input = { width: 88, minHeight: 44, padding: '0 10px', borderRadius: 10, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', textAlign: 'right' };

export default function CoachRateRow({ assignment, orgId, first, onSaved }) {
  // Mount-time snapshot; the parent remounts this row (via a rate-bearing key) after
  // its own save, so the input re-snaps to the saved DB value without an effect.
  const initial = assignment.pay_per_session_cents != null ? String(assignment.pay_per_session_cents / 100) : '';
  const [val, setVal] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const savingRef = useRef(false);

  const trimmed = val.trim();
  const cents = trimmed === '' ? null : Math.round(parseFloat(trimmed) * 100);
  const invalid = trimmed !== '' && (!Number.isFinite(cents) || cents <= 0);
  const dirty = trimmed !== initial;
  const canSave = dirty && !invalid && !saving;

  const save = async () => {
    if (savingRef.current || !dirty || invalid) return;
    savingRef.current = true; setSaving(true); setErr(null);
    // Single row, id-scoped (+ org defense-in-depth). No team fan-out.
    const { error } = await supabase.from('coaching_assignments')
      .update({ pay_per_session_cents: cents })
      .eq('id', assignment.id).eq('org_id', orgId);
    savingRef.current = false; setSaving(false);
    if (error) { console.error('CoachRateRow save:', error.message); setErr('Looks like that didn’t go through. Try again?'); return; }
    onSaved();
  };

  return (
    <div style={{ padding: '10px 13px', borderTop: first ? 'none' : '1px solid var(--as-border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--as-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{assignment.teamName}</div>
          <div style={{ fontSize: 11, color: 'var(--as-text-tertiary)' }}>{ROLE[assignment.role] || assignment.role} · {SCOPE[assignment.scope] || assignment.scope}</div>
        </div>
        <span style={{ fontSize: 14, color: 'var(--as-text-tertiary)' }}>$</span>
        <input type="number" inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value)} placeholder="Unpaid" aria-label={`Rate for ${assignment.teamName}`} style={input} />
        <button type="button" onClick={save} disabled={!canSave} className="as-press" aria-label={`Save rate for ${assignment.teamName}`}
          style={{ minHeight: 44, padding: '0 14px', borderRadius: 10, border: 'none', backgroundColor: canSave ? 'var(--as-accent)' : 'var(--as-bg-tertiary)', color: canSave ? 'var(--as-text-inverse)' : 'var(--as-text-tertiary)', fontSize: 14, fontWeight: 600, flexShrink: 0, opacity: saving ? 0.6 : 1 }}>
          {saving ? '…' : 'Save'}
        </button>
      </div>
      {invalid && <div style={{ fontSize: 12, color: 'var(--as-danger)', marginTop: 4 }}>Enter an amount over $0, or clear the field to mark unpaid.</div>}
      {err && <div style={{ fontSize: 12, color: 'var(--as-danger)', marginTop: 4 }}>{err}</div>}
    </div>
  );
}
