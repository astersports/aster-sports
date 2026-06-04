// Track-R R-1 — read-only audience pill ("<n> families · <scope>"). The
// editable audience dropdown is a later slice (R-3).

import { Users } from 'lucide-react';

const pill = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  fontSize: 12, fontWeight: 500, color: 'var(--as-text-tertiary)',
  backgroundColor: 'var(--as-bg-secondary)', borderRadius: 6, padding: '4px 8px',
};

export default function AudiencePill({ text }) {
  return (
    <span style={pill}>
      <Users size={14} strokeWidth={1.75} aria-hidden="true" />
      {text}
    </span>
  );
}
