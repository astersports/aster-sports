// Colored pill showing tournament status. Used in list items and detail page.
// Status values per tournaments.status CHECK constraint:
// planned | scheduled | in_progress | eliminated | champions | complete | cancelled

const STATUS_STYLES = {
  planned:     { bg: 'var(--em-neutral-soft)', color: 'var(--em-text-secondary)', label: 'PLANNED' },
  scheduled:   { bg: 'var(--em-info-soft)', color: 'var(--em-info)', label: 'SCHEDULED' },
  in_progress: { bg: 'var(--em-warning-soft)', color: 'var(--em-warning)', label: 'LIVE' },
  eliminated:  { bg: 'var(--em-neutral-soft)', color: 'var(--em-text-secondary)', label: 'ELIMINATED' },
  champions:   { bg: 'var(--em-success-soft)', color: 'var(--em-success)', label: 'CHAMPIONS' },
  complete:    { bg: 'var(--em-success-soft)', color: 'var(--em-success)', label: 'COMPLETE' },
  cancelled:   { bg: 'var(--em-danger-soft)', color: 'var(--em-danger)', label: 'CANCELLED' },
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
