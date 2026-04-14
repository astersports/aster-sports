const TYPE_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'practice', label: 'Practice' },
  { key: 'game', label: 'Game' },
  { key: 'skills_lab', label: 'Skills Lab' },
  { key: 'tryout', label: 'Tryout' },
  { key: 'tournament', label: 'Tournament' },
  { key: 'other', label: 'Other' },
];

export default function FilterBar({ teams, filters, onFilterChange, density, onDensityChange }) {
  const { teamId, eventType } = filters;

  return (
    <div className="sf-sticky-filters" style={{ padding: '8px 0' }}>
      <div className="flex gap-2 overflow-x-auto sf-no-scrollbar" style={{ paddingBottom: 6 }}>
        <Chip
          label="All Teams"
          active={!teamId}
          onClick={() => onFilterChange({ ...filters, teamId: null })}
        />
        {teams.map((t) => (
          <Chip
            key={t.id}
            label={t.name}
            active={teamId === t.id}
            color={t.team_color}
            onClick={() => onFilterChange({ ...filters, teamId: teamId === t.id ? null : t.id })}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex gap-2 overflow-x-auto sf-no-scrollbar flex-1">
          {TYPE_OPTIONS.map((opt) => (
            <Chip
              key={opt.key}
              label={opt.label}
              active={eventType === opt.key}
              onClick={() => onFilterChange({ ...filters, eventType: opt.key })}
            />
          ))}
        </div>
        <div className="flex" style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--sf-border-default)', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => { navigator.vibrate?.(10); onDensityChange('comfortable'); }}
            style={{
              width: 32, height: 32, border: 'none',
              backgroundColor: density === 'comfortable' ? 'var(--sf-accent)' : 'var(--sf-bg-card)',
              color: density === 'comfortable' ? 'var(--sf-text-inverse)' : 'var(--sf-text-tertiary)',
              fontSize: 14,
            }}
          >⊞</button>
          <button
            type="button"
            onClick={() => { navigator.vibrate?.(10); onDensityChange('compact'); }}
            style={{
              width: 32, height: 32, border: 'none',
              backgroundColor: density === 'compact' ? 'var(--sf-accent)' : 'var(--sf-bg-card)',
              color: density === 'compact' ? 'var(--sf-text-inverse)' : 'var(--sf-text-tertiary)',
              fontSize: 14,
            }}
          >⊟</button>
        </div>
      </div>
    </div>
  );
}

function Chip({ label, active, color, onClick }) {
  return (
    <button
      type="button"
      onClick={() => { navigator.vibrate?.(10); onClick(); }}
      className="sf-press"
      style={{
        flexShrink: 0,
        minHeight: 32,
        padding: '0 12px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        border: `1.5px solid ${active ? (color || 'var(--sf-accent)') : 'var(--sf-border-default)'}`,
        backgroundColor: active ? (color ? `${color}15` : 'var(--sf-accent-soft)') : 'var(--sf-bg-card)',
        color: active ? (color || 'var(--sf-accent)') : 'var(--sf-text-primary)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}
