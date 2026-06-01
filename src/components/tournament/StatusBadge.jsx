// Colored pill showing tournament status. Used in list items and detail page.
// Status values per tournaments.status CHECK constraint:
// planned | scheduled | in_progress | eliminated | champions | complete | cancelled

const STATUS_STYLES = {
  planned:     { bg: 'var(--as-neutral-soft)', color: 'var(--as-text-secondary)', label: 'PLANNED' },
  scheduled:   { bg: 'var(--as-info-soft)', color: 'var(--as-info)', label: 'SCHEDULED' },
  in_progress: { bg: 'var(--as-warning-soft)', color: 'var(--as-warning)', label: 'LIVE' },
  eliminated:  { bg: 'var(--as-neutral-soft)', color: 'var(--as-text-secondary)', label: 'ELIMINATED' },
  champions:   { bg: 'var(--as-success-soft)', color: 'var(--as-success)', label: 'CHAMPIONS' },
  complete:    { bg: 'var(--as-success-soft)', color: 'var(--as-success)', label: 'COMPLETE' },
  cancelled:   { bg: 'var(--as-danger-soft)', color: 'var(--as-danger)', label: 'CANCELLED' },
};

export default function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.scheduled;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '1px',
      padding: '3px 8px', borderRadius: 6,
      backgroundColor: s.bg, color: s.color,
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {s.label}
    </span>
  );
}
