import FilterSelect from '../shared/FilterSelect';

export default function TeamSwitcher({ programs, teamId, navigate }) {
  if (programs.length > 6) {
    return (
      <div style={{ marginBottom: 8 }}>
        <FilterSelect
          value={teamId}
          onChange={(v) => { if (v && v !== teamId) { navigator.vibrate?.(10); navigate(`/teams/${v}`); } }}
          options={programs.map((p) => ({ value: p.id, label: p.name, color: p.team_color }))}
          ariaLabel="Switch team"
        />
      </div>
    );
  }
  return (
    <div className="flex gap-2 overflow-x-auto sf-no-scrollbar" style={{ marginBottom: 8, paddingBottom: 4 }}>
      {programs.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => { navigator.vibrate?.(10); navigate(`/teams/${p.id}`); }}
          className="sf-press"
          style={{
            flexShrink: 0,
            minHeight: 44,
            padding: '0 12px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: p.id === teamId ? 600 : 400,
            border: `2px solid ${p.team_color || 'var(--em-border-default)'}`,
            backgroundColor: p.id === teamId ? (p.team_color || 'var(--em-accent)') : 'var(--em-bg-card)',
            color: p.id === teamId ? 'var(--em-text-inverse)' : 'var(--em-text-primary)',
            whiteSpace: 'nowrap',
          }}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}
