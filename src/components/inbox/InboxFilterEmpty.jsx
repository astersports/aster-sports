import { CheckCircle2 } from 'lucide-react';

// Shown when the "Unread" filter is active but every briefing is already
// read — distinct from the truly-empty inbox (InboxList owns that copy).
// Brand-voice "all caught up" empty state (§16.3, §16.11). role=status so
// the transition is announced. Tokens only.

const wrap = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  textAlign: 'center', padding: '40px 16px', gap: 10,
  color: 'var(--as-text-tertiary)',
};

export default function InboxFilterEmpty() {
  return (
    <div role="status" style={wrap}>
      <CheckCircle2 size={28} strokeWidth={1.5} color="var(--as-success)" aria-hidden="true" />
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-secondary)' }}>You&rsquo;re all caught up</div>
      <div style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 260 }}>
        No unread briefings right now. Switch to All to see everything from your coaches.
      </div>
    </div>
  );
}
