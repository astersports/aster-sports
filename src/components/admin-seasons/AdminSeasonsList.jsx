import { Calendar, Star } from 'lucide-react';
import Badge from '../shared/Badge';
import EmptyState from '../shared/EmptyState';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import { formatDateFull } from '../../lib/formatters';

// Season list table for AdminSeasonsPage. Extracted from
// AdminSeasonsPage in the preemptive split arc per L99 platform
// audit PART 5 Phase 4 / PQ3 (2026-05-21). Pure presentational; the
// season list / loading state / empty state live here so the parent
// page stays orchestration-only.
export default function AdminSeasonsList({ seasons, loading, onEdit, onRequestSetActive }) {
  if (loading) return <LoadingSkeleton variant="card" count={3} />;
  if (seasons.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No seasons yet"
        description="Create your first season to start scheduling events."
      />
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {seasons.map((s) => {
        const active = s.status === 'active';
        // Card shell is the <li> itself — background, shadow, and
        // borders live here so the edit + set-active controls inside
        // can be real <button>s (invalid to nest button-in-button).
        // Border stacking is intentionally minimal: `border` paints
        // all four sides, then `borderLeft` overrides just the left
        // edge with a thicker accent.
        const cardStyle = {
          backgroundColor: 'var(--em-bg-card)',
          borderRadius: 10,
          border: '1px solid var(--em-border-subtle)',
          borderLeft: `4px solid ${active ? 'var(--em-success)' : 'var(--em-border-default)'}`,
          boxShadow: 'var(--em-shadow-sm)',
          overflow: 'hidden',
        };
        return (
          <li key={s.id} style={cardStyle}>
            <button
              type="button"
              onClick={() => onEdit(s)}
              className="w-full text-left p-4 sf-press flex flex-col"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold" style={{ color: 'var(--em-text-primary)', fontSize: 17 }}>
                  {s.name}
                </span>
                {active ? <Badge variant="success">Active</Badge> : <Badge>Archived</Badge>}
              </div>
              <span style={{ color: 'var(--em-text-secondary)', fontSize: 13 }}>
                {formatDateFull(s.start_date)} – {formatDateFull(s.end_date)}
              </span>
            </button>
            {!active && (
              <button
                type="button"
                onClick={() => onRequestSetActive(s)}
                className="flex items-center gap-1 sf-press w-full"
                style={{
                  minHeight: 44,
                  padding: '0 16px',
                  borderTop: '1px solid var(--em-border-subtle)',
                  color: 'var(--em-accent)',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                <Star size={16} strokeWidth={1.75} /> Set as active
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
