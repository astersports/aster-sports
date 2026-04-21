const STATUS_CHIPS = [
  { value: 'all', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'Live' },
  { value: 'complete', label: 'Complete' },
];

// Horizontal pill row for the status filter on TournamentsPage. Each
// chip is aria-pressed so screen readers announce the active filter.
export default function TournamentStatusChips({ statusFilter, setStatusFilter }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
      {STATUS_CHIPS.map((c) => {
        const active = statusFilter === c.value;
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => setStatusFilter(c.value)}
            className="sf-press"
            aria-pressed={active}
            style={{
              minHeight: 32, padding: '0 12px', borderRadius: 999,
              border: `1.5px solid ${active ? 'var(--sf-accent)' : 'var(--sf-border-default)'}`,
              backgroundColor: active ? 'var(--sf-accent-soft)' : 'var(--sf-bg-card)',
              color: active ? 'var(--sf-accent)' : 'var(--sf-text-primary)',
              fontSize: 12, fontWeight: active ? 600 : 400,
              whiteSpace: 'nowrap',
            }}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
