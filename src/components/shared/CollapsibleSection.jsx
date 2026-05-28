import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// 2026-05-21 (Teams PR A / platform audit C6) — defaultOpen flipped
// true→false. Pre-flight grep confirmed every existing caller passes
// defaultOpen explicitly (literal false, computed locationAutoExpand,
// or isStaff(role)) — no caller relied on the previous default. New
// detail-page sections per CLAUDE.md §16.14 are closed-by-default;
// surfaces that need open-by-default now opt in explicitly.
export default function CollapsibleSection({ title, sectionKey, defaultOpen = false, count, subtitle, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="em-press"
        data-section={sectionKey}
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '0 16px', minHeight: 44,
          background: 'none', border: 'none', cursor: 'pointer',
          marginTop: 8, marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--em-text-primary)' }}>
          {title}
          {count != null && <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--em-text-tertiary)', marginLeft: 8 }}>{count}</span>}
          {!open && subtitle && <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--em-text-tertiary)', marginLeft: 8 }}>&middot; {subtitle}</span>}
        </span>
        <ChevronDown size={17} strokeWidth={1.75} color="var(--em-text-tertiary)"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease-out' }} />
      </button>
      <div className="em-collapsible" data-open={open ? 'true' : 'false'}>
        <div className="em-collapsible-inner">
          {children}
        </div>
      </div>
    </div>
  );
}
