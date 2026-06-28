import { AlertCircle } from 'lucide-react';

// Inline error/empty note shown when org settings finished loading but came
// back empty (fetch error or no settings row yet). useOrgSettings fails closed
// to null and exposes no error flag, so the page derives this state from
// (!loading && !settings). Kindness microcopy per §16.3 — names the situation
// and gives a recovery action instead of a blank card. Token-only colors.
export default function SettingsErrorNote({ onRetry }) {
  return (
    <div role="status" style={{
      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', marginBottom: 16,
      backgroundColor: 'var(--as-warning-soft)', border: '1px solid var(--as-warning)', borderRadius: 10,
    }}>
      <AlertCircle size={18} strokeWidth={2} aria-hidden="true" style={{ color: 'var(--as-warning)', flexShrink: 0, marginTop: 1 }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13, color: 'var(--as-text-primary)' }}>
          Couldn’t load some settings just now.
        </span>
        <span style={{ display: 'block', fontSize: 12, color: 'var(--as-text-secondary)', marginTop: 2 }}>
          The values below may be incomplete.{' '}
          {onRetry ? (
            <button
              type="button" onClick={onRetry}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                color: 'var(--as-accent)', font: 'inherit', fontSize: 12, textDecoration: 'underline' }}
            >
              Try again
            </button>
          ) : 'Try again in a moment.'}
        </span>
      </span>
    </div>
  );
}
