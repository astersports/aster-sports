// PR-D token chip — authoring affordance. A small "Insert link" menu in the
// composer body offering the action tokens. Selecting one inserts the literal
// {{token:<kind>_url}} placeholder into the body text; it renders as a cobalt
// chip in the preview (TokenChipPreview) and as a real button to the family
// (statsNarrative renderer). Per BRIEFING_FULL_PRESENTATION §4: "Chip in
// authoring, real button to the family."
//
// Only tokens with a real URL source appear (BODY_TOKENS = rsvp / schedule /
// directions). "Latest briefing" is intentionally absent — no unauthenticated
// source exists, so it is never offered (fail-loud, no dead links). See report.

import { useState } from 'react';
import { Link2 } from 'lucide-react';
import { BODY_TOKENS, TOKEN_PLACEHOLDER } from '../../lib/engine/substitution/bodyTokens';

const trigger = { display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 32, padding: '0 12px', borderRadius: 8, border: '1px solid var(--as-border-default)', background: 'var(--as-bg-card)', color: 'var(--as-text-secondary)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' };
const menu = { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 };
const item = { minHeight: 32, padding: '0 12px', borderRadius: 999, border: '1px solid var(--as-accent)', background: 'var(--as-accent-soft)', color: 'var(--as-accent)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' };

export default function TokenInsertMenu({ onInsert }) {
  const [open, setOpen] = useState(false);
  const kinds = Object.keys(BODY_TOKENS);
  return (
    <div>
      <button type="button" className="as-press" style={trigger} aria-expanded={open} aria-haspopup="menu"
        aria-label="Insert action link" onClick={() => setOpen((o) => !o)}>
        <Link2 size={16} strokeWidth={1.75} /> Insert link
      </button>
      {open && (
        <div style={menu} role="menu" aria-label="Action links">
          {kinds.map((kind) => (
            <button key={kind} type="button" role="menuitem" className="as-press" style={item}
              aria-label={`Insert ${BODY_TOKENS[kind].label} link`}
              onClick={() => { onInsert?.(TOKEN_PLACEHOLDER(kind)); setOpen(false); }}>
              {BODY_TOKENS[kind].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
