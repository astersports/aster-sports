import { Plus } from 'lucide-react';

// L99 enhancement: extracted page header with an unread summary subtitle.
// Keeps MessagesPage thin and gives the New-message button a 44px target + clear a11y.
export default function MessagesHeader({ unreadCount = 0, onNewMessage }) {
  const subtitle = unreadCount > 0
    ? `${unreadCount} unread ${unreadCount === 1 ? 'conversation' : 'conversations'}`
    : 'All caught up';
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <h1 className="font-bold" style={{ color: 'var(--as-text-primary)', fontSize: 20 }}>Messages</h1>
        <button
          type="button"
          onClick={() => { navigator.vibrate?.(10); onNewMessage(); }}
          className="as-press"
          aria-label="New message"
          style={{
            width: 44, height: 44, borderRadius: 10, border: 'none',
            backgroundColor: 'var(--as-accent)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <Plus size={18} strokeWidth={2} color="var(--as-text-inverse)" />
        </button>
      </div>
      <div
        aria-live="polite"
        style={{ fontSize: 13, color: 'var(--as-text-tertiary)', marginBottom: 6 }}
      >
        {subtitle}
      </div>
      <div style={{ width: 32, height: 3, backgroundColor: 'var(--as-accent)', borderRadius: 2, marginBottom: 12 }} />
    </>
  );
}
