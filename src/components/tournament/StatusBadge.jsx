// Colored pill showing tournament status. Used in list items and detail page.
// Status values per tournaments.status CHECK constraint:
// planned | scheduled | in_progress | eliminated | champions | complete | cancelled

const STATUS_STYLES = {
  planned:     { bg: 'var(--sf-neutral-soft)', color: 'var(--sf-text-secondary)', label: 'PLANNED' },
  scheduled:   { bg: 'var(--sf-info-soft)', color: 'var(--sf-info)', label: 'SCHEDULED' },
  in_progress: { bg: 'var(--sf-warning-soft)', color: 'var(--sf-warning)', label: 'LIVE' },
  eliminated:  { bg: 'var(--sf-neutral-soft)', color: 'var(--sf-text-secondary)', label: 'ELIMINATED' },
  champions:   { bg: 'var(--sf-success-soft)', color: 'var(--sf-success)', label: 'CHAMPIONS' },
  complete:    { bg: 'var(--sf-success-soft)', color: 'var(--sf-success)', label: 'COMPLETE' },
  cancelled:   { bg: 'var(--sf-danger-soft)', color: 'var(--sf-danger)', label: 'CANCELLED' },
};

export default function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.scheduled;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '1px',
      padding: '3px 8px', borderRadius: 6,
      backgroundColor: s.bg, color: s.color,
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {s.label}
    </span>
  );
}
