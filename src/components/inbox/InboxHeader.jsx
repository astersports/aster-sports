import { Inbox as InboxIcon } from 'lucide-react';

// Inbox page header — title + accent underline + a live unread-count badge.
// The count is announced via aria-live so a screen reader hears it update
// when a row is opened / "mark all read" fires (§16.4 live regions).
// Tokens only; no hardcoded hex.

const titleRow = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 };
const ruleStyle = { width: 32, height: 3, backgroundColor: 'var(--as-accent)', borderRadius: 2, marginBottom: 12 };
const badgeStyle = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  minWidth: 22, height: 22, padding: '0 7px', borderRadius: 9999,
  backgroundColor: 'var(--as-accent-soft)', color: 'var(--as-accent)',
  fontSize: 12, fontWeight: 700, lineHeight: 1,
};

export default function InboxHeader({ unreadCount = 0, total = 0 }) {
  const hasUnread = unreadCount > 0;
  return (
    <header>
      <div style={titleRow}>
        <InboxIcon size={20} strokeWidth={1.75} color="var(--as-text-primary)" aria-hidden="true" />
        <h1 className="font-bold" style={{ color: 'var(--as-text-primary)', fontSize: 20, margin: 0 }}>Inbox</h1>
        {hasUnread && (
          <span style={badgeStyle} aria-hidden="true">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </div>
      <div style={ruleStyle} aria-hidden="true" />
      {/* Screen-reader-only running summary; visually conveyed by the badge. */}
      <span aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        {total === 0
          ? 'Inbox empty'
          : hasUnread
            ? `${unreadCount} unread of ${total} ${total === 1 ? 'briefing' : 'briefings'}`
            : `All caught up. ${total} ${total === 1 ? 'briefing' : 'briefings'}, none unread.`}
      </span>
    </header>
  );
}
