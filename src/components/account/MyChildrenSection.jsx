import { Users } from 'lucide-react';
import Label from '../shared/Label';

// "My Children" group on /account (parent role). Extracted from AccountPage
// to keep it lean (≤150) and to add: a labelled icon header, a warm empty
// state when no children are linked yet, and an accessible list semantics +
// 44px tap target on the "My Family" deep link. Token-only colors.
const CARD = { backgroundColor: 'var(--as-bg-card)', borderRadius: 10, border: '1px solid var(--as-border-default)', overflow: 'hidden' };

export default function MyChildrenSection({ children = [], teamName, onOpenFamily }) {
  const hasChildren = children.length > 0;

  return (
    <section style={{ marginBottom: 16 }}>
      <Label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Users size={12} strokeWidth={2} aria-hidden="true" /> My Children
      </Label>
      {hasChildren ? (
        <ul style={{ ...CARD, listStyle: 'none', margin: 0, padding: 0 }}>
          {children.map((c, i) => (
            <li key={c.playerId} style={{ padding: '12px 14px', borderTop: i === 0 ? 'none' : '1px solid var(--as-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, gap: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--as-text-primary)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.firstName} {c.lastName}</span>
              <span style={{ fontSize: 13, color: 'var(--as-text-tertiary)', flexShrink: 0 }}>{teamName(c.teamId)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ ...CARD, padding: 16, fontSize: 13, color: 'var(--as-text-tertiary)', lineHeight: 1.5 }}>
          No players linked yet — your admin connects your kids when registration is in. Check back soon.
        </div>
      )}
      <button type="button" onClick={onOpenFamily} className="as-press"
        aria-label="Open My Family — registrations and balance"
        style={{ width: '100%', minHeight: 44, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', color: 'var(--as-text-primary)', fontSize: 15, fontWeight: 500, padding: '0 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
        My Family · registrations &amp; balance
        <span style={{ color: 'var(--as-accent)', fontWeight: 600 }} aria-hidden="true">Open ›</span>
      </button>
    </section>
  );
}
