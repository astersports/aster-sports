// PR-D token chip — composer-side chip render. Renders body text with any
// {{token:<kind>_url}} placeholder shown as a cobalt-wash CHIP (.tchip:
// check icon + label), per BRIEFING_FULL_PRESENTATION §4. This is the
// authoring view; the email render turns the same token into a real button
// (statsNarrative renderer). Unknown token kinds stay as literal text.

import { Check } from 'lucide-react';
import { BODY_TOKENS, splitBodyTokens } from '../../lib/engine/substitution/bodyTokens';

const wrap = { fontSize: 13, lineHeight: 1.6, color: 'var(--as-text-primary)', whiteSpace: 'pre-wrap' };
const chip = { display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--as-accent-soft)', color: 'var(--as-accent)', border: '1px solid var(--as-accent)', borderRadius: 999, padding: '1px 8px', fontSize: 11.5, fontWeight: 700, verticalAlign: 'baseline' };

export default function TokenChipPreview({ text }) {
  const segments = splitBodyTokens(text);
  if (!segments.some((s) => s.token)) return null;
  return (
    <div style={wrap} aria-label="Body preview with action links">
      {segments.map((s, i) => s.token
        ? (
          <span key={i} style={chip} className="tchip">
            <Check size={11} strokeWidth={2.25} aria-hidden="true" />
            {BODY_TOKENS[s.token].label}
          </span>
        )
        : <span key={i}>{s.text}</span>)}
    </div>
  );
}
