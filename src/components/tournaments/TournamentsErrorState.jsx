import { AlertTriangle, RotateCw } from 'lucide-react';
import Button from '../shared/Button';

// L99 enhancement #4: kindness error state (§16.3) — replaces the raw
// error.message dump with warm, actionable copy and a retry affordance.
// role="alert" + aria-live announce the failure to screen readers.
export default function TournamentsErrorState({ onRetry, retrying }) {
  return (
    <div role="alert" aria-live="assertive" style={{ padding: '40px 16px', textAlign: 'center' }}>
      <AlertTriangle size={28} strokeWidth={1.75} color="var(--as-danger)" aria-hidden="true" style={{ marginBottom: 10 }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)', marginBottom: 4 }}>
        Couldn't load tournaments
      </div>
      <div style={{ fontSize: 13, color: 'var(--as-text-secondary)', marginBottom: 16 }}>
        Couldn't reach the server. Try again in a moment.
      </div>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry} disabled={retrying} aria-label="Retry loading tournaments">
          <RotateCw size={16} strokeWidth={2} aria-hidden="true" /> {retrying ? 'Retrying…' : 'Try again'}
        </Button>
      )}
    </div>
  );
}
