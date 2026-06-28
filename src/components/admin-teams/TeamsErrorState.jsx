import { AlertTriangle } from 'lucide-react';

// Friendly error state for AdminTeamsPage (CLAUDE.md §16.3 kindness
// microcopy). Surfaces the load failure with a retry instead of an
// empty list that silently reads as "no teams". Token-only colors;
// 44px retry target; aria-live so the failure is announced.
export default function TeamsErrorState({ onRetry }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center justify-center text-center px-6 py-8"
      style={{ color: 'var(--as-text-secondary)' }}
    >
      <div
        className="flex items-center justify-center mb-4"
        style={{
          width: 56, height: 56, borderRadius: '50%',
          backgroundColor: 'var(--as-danger-soft)', color: 'var(--as-danger)',
        }}
      >
        <AlertTriangle size={24} strokeWidth={1.75} aria-hidden="true" />
      </div>
      <div className="font-semibold" style={{ color: 'var(--as-text-primary)', fontSize: 16, marginBottom: 4 }}>
        Couldn’t load your teams
      </div>
      <p style={{ fontSize: 14, maxWidth: 280, lineHeight: 1.5 }}>
        Couldn’t reach the server. Try again in a moment.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="as-press as-bounce-tap mt-4 font-semibold"
          style={{
            minHeight: 44, padding: '0 20px', borderRadius: 10, fontSize: 15,
            backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Try again
        </button>
      )}
    </div>
  );
}
