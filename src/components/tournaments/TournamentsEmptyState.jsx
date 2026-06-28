import { Plus, Trophy } from 'lucide-react';
import Button from '../shared/Button';

// L99 enhancement #2 + #3: role-aware empty state with kindness microcopy
// (§16.3) and an inline create CTA for staff (no second hunt for the header
// button). #2: distinguishes a "no tournaments at all" state from a
// "no matches for this filter" state so the copy is honest + actionable.
export default function TournamentsEmptyState({ isStaff, filtered, onClear, onCreate }) {
  const title = filtered ? 'Nothing matches that filter' : 'No tournaments yet';
  const body = filtered
    ? 'Try a different status — or clear the filter to see them all.'
    : isStaff
      ? 'Tap New to add your first tournament and start rallying teams.'
      : 'No tournaments yet — check back when your team signs up for one.';

  return (
    <div style={{ padding: '48px 16px', textAlign: 'center' }}>
      <Trophy size={32} strokeWidth={1.5} color="var(--as-text-tertiary)" aria-hidden="true" style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)', marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: 'var(--as-text-secondary)', marginBottom: filtered || isStaff ? 16 : 0 }}>
        {body}
      </div>
      {filtered ? (
        <Button size="sm" variant="secondary" onClick={onClear} aria-label="Clear status filter">
          Clear filter
        </Button>
      ) : isStaff ? (
        <Button size="sm" onClick={onCreate} aria-label="Create your first tournament">
          <Plus size={16} strokeWidth={2} aria-hidden="true" /> New tournament
        </Button>
      ) : null}
    </div>
  );
}
