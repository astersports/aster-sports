const STATUS_CHIPS = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
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
              minHeight: 44, padding: '0 12px', borderRadius: 999,
              border: `1.5px solid ${active ? 'var(--em-accent)' : 'var(--em-border-default)'}`,
              backgroundColor: active ? 'var(--em-accent-soft)' : 'var(--em-bg-card)',
              color: active ? 'var(--em-accent)' : 'var(--em-text-primary)',
              fontSize: 13, fontWeight: active ? 600 : 400,
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
