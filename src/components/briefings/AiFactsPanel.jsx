// PR-D AI facts panel. Read-only panel listing the VERBATIM facts the AI
// draft grounded on (label .fl + value .fv per .factrow), plus any MISSING
// facts flagged amber (.factrow.miss). Per BRIEFING_FULL_PRESENTATION §4:
// "Verbatim facts the draft used; missing ones flag amber, never invented.
// Read-only, verifies grounding before send."
//
// Expands under a "Facts used · N" toggle (aria-expanded). facts is an array
// of { k, v } pairs (the briefing-ai-draft facts_used response, see
// useAiDraft); missing is an array of short strings (the draft warnings). The
// panel NEVER fabricates a value — a missing fact renders an amber row with
// the warning text, not a made-up value.

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const toggle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', minHeight: 36, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--as-border-default)', background: 'var(--as-bg-card)', color: 'var(--as-accent)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' };
const panel = { border: '1px solid var(--as-border-default)', borderRadius: 6, overflow: 'hidden', marginTop: 6 };
const row = (miss) => ({ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 11px', borderTop: '1px solid var(--as-border-subtle)', fontSize: 12.5, backgroundColor: miss ? 'var(--as-warning-soft)' : 'transparent' });
const fl = (miss) => ({ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: miss ? 'var(--as-warning)' : 'var(--as-text-tertiary)' });
const fv = (miss) => ({ fontWeight: 700, color: miss ? 'var(--as-warning)' : 'var(--as-text-primary)' });

export default function AiFactsPanel({ facts = [], missing = [] }) {
  const [open, setOpen] = useState(false);
  const count = facts.length;
  if (!count && !missing.length) return null;
  return (
    <div>
      <button type="button" className="as-press" style={toggle} aria-expanded={open}
        onClick={() => setOpen((o) => !o)} aria-label={`Facts used · ${count}`}>
        <span>Facts used · {count}</span>
        <ChevronDown size={16} strokeWidth={1.75} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 120ms' }} />
      </button>
      {open && (
        <div style={panel} role="list" aria-label="Facts the draft used">
          {facts.map((f, i) => (
            <div key={`f${i}`} role="listitem" style={{ ...row(false), borderTop: i === 0 ? 'none' : row(false).borderTop }}>
              <span style={fl(false)}>{String(f?.k ?? '')}</span>
              <span style={fv(false)}>{String(f?.v ?? '')}</span>
            </div>
          ))}
          {missing.map((w, i) => (
            <div key={`m${i}`} role="listitem" style={{ ...row(true), borderTop: (facts.length === 0 && i === 0) ? 'none' : row(true).borderTop }}>
              <span style={fl(true)}>Missing · {String(w)}</span>
              <span style={fv(true)}>not on file</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
