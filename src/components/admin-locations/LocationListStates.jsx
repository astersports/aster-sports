import { MapPin, RefreshCw } from 'lucide-react';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import Button from '../shared/Button';

// Loading / error / empty render states for the Locations list, extracted so
// the page stays additive + thin. Kindness microcopy (§16.3), shape-matched
// skeleton (§16.11), and an actionable retry on error.

export default function LocationListStates({ loading, error, isEmpty, search, isStaff, showArchived, onRetry }) {
  if (loading) {
    return (
      <div aria-label="Loading venues">
        <LoadingSkeleton variant="card" count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)', marginBottom: 4 }}>
          Couldn&apos;t load your venues
        </div>
        <div style={{ fontSize: 13, color: 'var(--as-text-secondary)', marginBottom: 14 }}>
          Try again in a moment.
        </div>
        {onRetry && (
          <Button size="sm" variant="secondary" onClick={onRetry} aria-label="Retry loading venues">
            <RefreshCw size={14} strokeWidth={1.75} /> Try again
          </Button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    const title = search
      ? `No matches for "${search}"`
      : showArchived
        ? 'No archived venues'
        : 'No venues yet';
    const hint = search
      ? 'Try a different name or address.'
      : showArchived
        ? 'Venues you archive will show up here.'
        : isStaff
          ? 'Tap "New" to add your first venue — gyms, fields, anywhere you play.'
          : 'No venues here yet — check back soon.';
    return (
      <div style={{ padding: '48px 16px', textAlign: 'center' }}>
        <MapPin size={32} strokeWidth={1.5} color="var(--as-text-tertiary)" style={{ marginBottom: 12 }} aria-hidden="true" />
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)', marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: 'var(--as-text-secondary)' }}>{hint}</div>
      </div>
    );
  }

  return null;
}
