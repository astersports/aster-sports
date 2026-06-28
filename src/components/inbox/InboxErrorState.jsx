import { AlertCircle, RefreshCw } from 'lucide-react';

// Inbox load-error surface — kindness microcopy (§16.3) + a retry action.
// Extracted from InboxPage so the page stays thin and the error UI can grow
// (icon, 44px retry target) without crowding the orchestration file.
// role="alert" so the failure is announced. Tokens only.

const box = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: 16, borderRadius: 10,
  backgroundColor: 'var(--as-danger-soft)', color: 'var(--as-danger)',
};
const copy = { flex: 1, fontSize: 14, lineHeight: 1.4 };
const retryBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
  minHeight: 44, padding: '0 14px', borderRadius: 8, border: 'none',
  backgroundColor: 'var(--as-danger)', color: 'var(--as-text-inverse)',
  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
};

export default function InboxErrorState({ onRetry }) {
  return (
    <div role="alert" style={box}>
      <AlertCircle size={20} strokeWidth={1.75} aria-hidden="true" />
      <span style={copy}>Couldn&rsquo;t load your inbox. Try again in a moment.</span>
      <button type="button" className="as-press" style={retryBtn} onClick={onRetry} aria-label="Retry loading inbox">
        <RefreshCw size={16} strokeWidth={1.75} aria-hidden="true" />
        <span>Retry</span>
      </button>
    </div>
  );
}
