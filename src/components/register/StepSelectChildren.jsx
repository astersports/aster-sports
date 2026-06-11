import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { childIneligibleReason } from '../../lib/registerEligibility';
import { primaryBtn } from './registerStyles';

// B3 funnel (render: funnel-child-select). An authenticated parent SELECTS their
// existing children instead of re-typing — each carries its real player_id into one
// submit, so the (program, player_id) guard dedupes (closing the double-registration
// hole). RG-3: a grade/gender-ineligible child is shown DISABLED with the reason.
// RG-4: an already-registered child shows a badge and is non-selectable. "Add a
// child who isn't listed" drops to the manual entry for a genuinely new player.
export default function StepSelectChildren({ kids, division, onContinue, onAddNew }) {
  const [sel, setSel] = useState(() => new Set());
  const toggle = (id) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const picks = kids.filter((c) => sel.has(c.player_id));

  return (
    <div>
      <p style={sub}>Pick from your children, or add one who isn’t listed.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {kids.map((c) => {
          const ineligible = childIneligibleReason(c, division);
          const blocked = c.alreadyRegistered || !!ineligible;
          const reason = c.alreadyRegistered ? 'Already registered' : ineligible;
          const on = sel.has(c.player_id);
          return (
            <button
              key={c.player_id} type="button" aria-disabled={blocked}
              onClick={() => { if (!blocked) toggle(c.player_id); }} aria-pressed={blocked ? undefined : on}
              aria-label={`${c.first_name}${reason ? ` — ${reason}` : ''}`}
              className={blocked ? undefined : 'as-press'} style={card(on, blocked)}
            >
              <span style={box(on)} aria-hidden="true">{on && <Check size={15} strokeWidth={3} color="var(--as-text-inverse)" />}</span>
              <span style={avatar} aria-hidden="true">{(c.first_name || '?').charAt(0).toUpperCase()}</span>
              <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <span style={nm}>{c.first_name}</span>
                <span style={blocked ? metaBlocked : meta}>{blocked ? reason : (c.grade != null ? `Grade ${c.grade}` : ' ')}</span>
              </span>
            </button>
          );
        })}
        <button type="button" className="as-press" style={addBtn} onClick={onAddNew}>
          <Plus size={18} strokeWidth={2.3} aria-hidden="true" /> Add a child who isn’t listed
        </button>
      </div>
      <button
        type="button" className="as-press" disabled={!picks.length}
        aria-label={picks.length ? undefined : 'Select at least one child to continue'}
        style={{ ...primaryBtn, marginTop: 18, opacity: picks.length ? 1 : 0.5 }}
        onClick={() => onContinue(picks)}
      >
        Continue{picks.length ? ` · ${picks.length} ${picks.length === 1 ? 'child' : 'children'}` : ''}
      </button>
    </div>
  );
}

const sub = { fontSize: 13, color: 'var(--as-text-tertiary)', margin: '0 0 16px' };
const card = (on, blocked) => ({
  display: 'flex', alignItems: 'center', gap: 13, width: '100%', minHeight: 62, padding: '13px 15px',
  borderRadius: 12, fontFamily: 'inherit', textAlign: 'left',
  border: `1.5px solid ${on ? 'var(--as-accent)' : 'var(--as-border-default)'}`,
  backgroundColor: on ? 'var(--as-accent-soft)' : 'var(--as-bg-card)',
  opacity: blocked ? 0.55 : 1, cursor: blocked ? 'default' : 'pointer',
});
const box = (on) => ({
  width: 24, height: 24, borderRadius: 7, flex: 'none', display: 'grid', placeItems: 'center',
  border: `2px solid ${on ? 'var(--as-accent)' : 'var(--as-border-default)'}`,
  backgroundColor: on ? 'var(--as-accent)' : 'transparent',
});
const avatar = { width: 40, height: 40, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 700, color: 'var(--as-accent)', backgroundColor: 'var(--as-accent-soft)' };
const nm = { display: 'block', fontSize: 16, fontWeight: 700, color: 'var(--as-text-primary)' };
const meta = { display: 'block', fontSize: 12, color: 'var(--as-text-secondary)', marginTop: 1 };
const metaBlocked = { ...meta, color: 'var(--as-warning)', fontWeight: 600 };
const addBtn = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, minHeight: 54, marginTop: 2,
  borderRadius: 12, border: '1.5px dashed var(--as-accent)', backgroundColor: 'var(--as-bg-card)',
  color: 'var(--as-accent)', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
};
