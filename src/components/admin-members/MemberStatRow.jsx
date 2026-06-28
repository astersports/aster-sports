// L99 enhancement — at-a-glance summary stat row for the members
// directory. Three pills: guardians, kid links, and an actionable
// "needs a kid link" count that warms when > 0. Tapping the needs-link
// pill jumps the filter to the unlinked view (clarity + fast triage).
import { Link2, Users, UserX } from 'lucide-react';
import { summarize } from './memberHelpers';

const PILL = {
  flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2,
  padding: 12, borderRadius: 10, backgroundColor: 'var(--as-bg-card)',
  border: '1px solid var(--as-border-subtle)', boxShadow: 'var(--as-shadow-sm)',
};
const NUM = { fontSize: 20, fontWeight: 700, color: 'var(--as-text-primary)', lineHeight: 1.1 };
const LABEL = {
  fontSize: 11, fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase',
  color: 'var(--as-text-secondary)', display: 'flex', alignItems: 'center', gap: 4,
};

export default function MemberStatRow({ guardians, onShowUnlinked }) {
  const { guardians: gCount, kidLinks, unlinked } = summarize(guardians);
  const hasUnlinked = unlinked > 0;
  return (
    <div className="flex gap-2 mb-3">
      <div style={PILL}>
        <span style={NUM}>{gCount}</span>
        <span style={LABEL}><Users size={12} strokeWidth={1.75} aria-hidden="true" /> Guardians</span>
      </div>
      <div style={PILL}>
        <span style={NUM}>{kidLinks}</span>
        <span style={LABEL}><Link2 size={12} strokeWidth={1.75} aria-hidden="true" /> Kid links</span>
      </div>
      <button
        type="button"
        onClick={hasUnlinked ? onShowUnlinked : undefined}
        disabled={!hasUnlinked}
        aria-label={hasUnlinked ? `Show ${unlinked} guardians needing a kid link` : 'No guardians need a kid link'}
        className={hasUnlinked ? 'as-press' : undefined}
        style={{
          ...PILL,
          minHeight: 44,
          cursor: hasUnlinked ? 'pointer' : 'default',
          textAlign: 'left',
          backgroundColor: hasUnlinked ? 'var(--as-warning-soft)' : 'var(--as-bg-card)',
          border: hasUnlinked ? '1px solid var(--as-warning)' : '1px solid var(--as-border-subtle)',
        }}
      >
        <span style={{ ...NUM, color: hasUnlinked ? 'var(--as-warning)' : 'var(--as-text-primary)' }}>{unlinked}</span>
        <span style={{ ...LABEL, color: hasUnlinked ? 'var(--as-warning)' : 'var(--as-text-secondary)' }}>
          <UserX size={12} strokeWidth={1.75} aria-hidden="true" /> Need a kid
        </span>
      </button>
    </div>
  );
}
