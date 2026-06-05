// PR-B (compose simplification) — the inline kind chips at the top of the
// one-screen composer, per the locked design (LH_END_STATE_MOCKUPS.html, Admin
// Composer). The FIVE manual kinds only; the 6 auto-proposed kinds arrive as
// Radar cards (not here), and academy_callup is EventDetail-initiated. Pick a
// chip -> SET_KIND -> the composer fields render below. Switching among the 5 is
// just tapping another chip (no separate kind screen, no "change kind").

import { KIND_METADATA } from '../../lib/briefings/kindMetadata';
import { MANUAL_KINDS } from '../../lib/briefings/composeKinds';

const label = { fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--as-text-tertiary)', margin: '2px 0 7px', paddingLeft: 2 };
const row = { display: 'flex', gap: 7, flexWrap: 'wrap' };
const chip = (on) => ({
  fontSize: 12.5, fontWeight: 700, padding: '8px 13px', borderRadius: 9999,
  backgroundColor: on ? 'var(--as-text-primary)' : 'var(--as-bg-card)',
  color: on ? 'var(--as-text-inverse)' : 'var(--as-text-secondary)',
  border: `1px solid ${on ? 'var(--as-text-primary)' : 'var(--as-border-default)'}`,
  cursor: 'pointer',
});

export default function InlineKindChips({ selected, onPick }) {
  return (
    <div>
      <div style={label}>What kind</div>
      <div style={row} role="group" aria-label="Briefing kind">
        {MANUAL_KINDS.map((k) => {
          const meta = KIND_METADATA[k];
          if (!meta) return null;
          const on = selected === k;
          return (
            <button key={k} type="button" className="as-press" aria-pressed={on} style={chip(on)} onClick={() => onPick(k, meta)}>
              {meta.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
