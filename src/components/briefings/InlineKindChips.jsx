// PR-B (compose simplification) — the inline kind chips at the top of the
// one-screen composer. The FIVE manual kinds only; the 6 auto-proposed kinds
// arrive as Radar cards (not here), and academy_callup is EventDetail-initiated.
// Pick a chip -> SET_KIND -> the composer fields render below.
//
// A2 (Part A, architect ruling 2026-06-07): grouped into Recaps / Outreach /
// Guides (KIND_GROUPS — the lib source of truth + static order). Group headers
// always show, even over a single-item group (Recaps), so the taxonomy the
// picker teaches stays stable regardless of how many kinds a group has (KEEP
// ruling #3). The picker invariant test locks KIND_GROUPS == MANUAL_KINDS.

import { KIND_METADATA } from '../../lib/briefings/kindMetadata';
import { KIND_GROUPS } from '../../lib/briefings/composeKinds';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {KIND_GROUPS.map((group) => {
        const kinds = group.kinds.filter((k) => KIND_METADATA[k]);
        if (!kinds.length) return null;
        return (
          <div key={group.label}>
            <div style={label}>{group.label}</div>
            <div style={row} role="group" aria-label={group.label}>
              {kinds.map((k) => {
                const meta = KIND_METADATA[k];
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
      })}
    </div>
  );
}
