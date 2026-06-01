const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'games', label: 'Games' },
  { value: 'roster', label: 'Roster' },
  { value: 'messages', label: 'Messages' },
  { value: 'scenarios', label: 'Scenarios' },
];

export default function TournamentTabs({ active, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="Tournament sections"
      style={{
        display: 'flex', overflowX: 'auto', borderBottom: '1px solid var(--as-border-default)',
        backgroundColor: 'var(--as-bg-card)', paddingLeft: 8, scrollbarWidth: 'none',
      }}
    >
      {TABS.map((t) => {
        const isActive = active === t.value;
        return (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`tab-panel-${t.value}`}
            onClick={() => onChange(t.value)}
            className="as-press"
            style={{
              minHeight: 44, padding: '10px 16px', border: 'none',
              borderBottom: `2px solid ${isActive ? 'var(--as-accent)' : 'transparent'}`,
              backgroundColor: 'transparent',
              color: isActive ? 'var(--as-accent)' : 'var(--as-text-secondary)',
              fontSize: 15, fontWeight: isActive ? 600 : 500,
              cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif',
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
