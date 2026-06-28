import { RotateCw, WifiOff } from 'lucide-react';

// L99 enhancement: graceful error surface with retry (kindness microcopy §16.3).
// Rendered when a channels/DM load fails so the user is never stuck on a blank page.
export default function MessagesErrorState({ onRetry }) {
  return (
    <div
      role="alert"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', padding: '40px 24px', gap: 12,
      }}
    >
      <div
        style={{
          width: 56, height: 56, borderRadius: '50%',
          backgroundColor: 'var(--as-danger-soft)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <WifiOff size={24} strokeWidth={1.75} color="var(--as-danger)" aria-hidden="true" />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)' }}>
        Couldn&apos;t load your messages
      </div>
      <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)', lineHeight: 1.5, maxWidth: 280 }}>
        Couldn&apos;t reach the server. Try again in a moment.
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="as-press"
          aria-label="Retry loading messages"
          style={{
            display: 'flex', alignItems: 'center', gap: 8, minHeight: 44,
            padding: '0 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
            backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)',
            fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
          }}
        >
          <RotateCw size={16} strokeWidth={2} color="var(--as-text-inverse)" />
          Try again
        </button>
      )}
    </div>
  );
}
