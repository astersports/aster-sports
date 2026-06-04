// Track-R R-1 — one Radar section (Ready / Scheduled / Sent) with a count and,
// for Scheduled/Sent, collapse-by-default. Labeled region for a11y.

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const wrap = { display: 'flex', flexDirection: 'column', gap: 10 };
const headerBase = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--as-text-secondary)', fontFamily: 'inherit' };
const headerBtn = { ...headerBase, background: 'none', border: 'none', padding: 0, cursor: 'pointer', minHeight: 44 };
const countStyle = { fontSize: 12, fontWeight: 500, color: 'var(--as-text-tertiary)' };

export default function RadarSection({ title, count, collapsible = false, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const Chevron = open ? ChevronDown : ChevronRight;
  return (
    <section style={wrap} aria-label={title}>
      {collapsible ? (
        <button type="button" style={headerBtn} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <Chevron size={16} strokeWidth={1.75} aria-hidden="true" />
          {title} <span style={countStyle}>{count}</span>
        </button>
      ) : (
        <div style={headerBase}>{title} <span style={countStyle}>{count}</span></div>
      )}
      {open && children}
    </section>
  );
}
