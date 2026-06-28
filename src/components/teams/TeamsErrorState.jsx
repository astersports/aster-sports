// Error block for /teams. The teams + records hooks both expose an
// `error`, which the page previously ignored — a failed fetch fell
// through to the "No teams yet" empty state, telling the user the org
// has no teams when really the request failed. Kindness microcopy
// (§16.3) + a retry that re-runs both fetches.
import { CloudOff } from 'lucide-react';

export default function TeamsErrorState({ onRetry }) {
  return (
    <div
      role="alert"
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
        <CloudOff size={24} strokeWidth={1.75} aria-hidden="true" />
      </div>
      <div className="font-semibold" style={{ color: 'var(--as-text-primary)', fontSize: 16, marginBottom: 4 }}>
        Couldn&apos;t load your teams
      </div>
      <p style={{ fontSize: 14, maxWidth: 280, lineHeight: 1.5 }}>
        Couldn&apos;t reach the server. Try again in a moment.
      </p>
      <button
        type="button"
        onClick={() => { navigator.vibrate?.(10); onRetry?.(); }}
        className="as-press"
        style={{
          marginTop: 16, minHeight: 44, padding: '0 20px', borderRadius: 10, fontSize: 15,
          fontWeight: 600, border: 'none', backgroundColor: 'var(--as-accent)',
          color: 'var(--as-text-inverse)',
        }}
      >
        Try again
      </button>
    </div>
  );
}
