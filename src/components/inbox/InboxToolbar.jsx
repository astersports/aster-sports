import { CheckCheck } from 'lucide-react';
import SegmentedControl from '../shared/SegmentedControl';

// Inbox toolbar — All / Unread filter + an optimistic "Mark all read"
// action. The filter is a radiogroup (SegmentedControl, 44px targets, §7).
// "Mark all read" only renders when there is something to clear; it's a
// 44px-min ghost button with an accessible label (§16.4). The actual
// optimistic clear + persistence is owned by the page (passed in as
// onMarkAllRead) so this stays a presentational control.

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
];

const wrap = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 };
const markBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
  minHeight: 44, padding: '0 12px', borderRadius: 8,
  border: '1px solid var(--as-border-default)', background: 'var(--as-bg-card)',
  color: 'var(--as-text-secondary)', fontFamily: 'inherit', fontSize: 13,
  fontWeight: 600, cursor: 'pointer',
};

export default function InboxToolbar({ filter, onFilterChange, unreadCount = 0, onMarkAllRead, busy = false }) {
  const canMark = unreadCount > 0;
  return (
    <div style={wrap}>
      <div style={{ flex: 1 }}>
        <SegmentedControl
          label="Filter briefings"
          value={filter}
          onChange={onFilterChange}
          options={FILTERS}
        />
      </div>
      {canMark && (
        <button
          type="button"
          className="as-press"
          style={{ ...markBtn, opacity: busy ? 0.6 : 1 }}
          onClick={onMarkAllRead}
          disabled={busy}
          aria-label={`Mark all ${unreadCount} unread briefings as read`}
        >
          <CheckCheck size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>Mark all read</span>
        </button>
      )}
    </div>
  );
}
