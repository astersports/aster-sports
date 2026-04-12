// Horizontal pill strip for quick team switching without going back
// to the Teams list. Renders one pill per team in the active season,
// styled with the team's color. Active team is filled; others outlined.
export default function TeamSwitcher({ programs, teamId, navigate }) {
  return (
    <div className="flex gap-2 overflow-x-auto sf-no-scrollbar" style={{ marginBottom: 12, paddingBottom: 4 }}>
      {programs.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => { navigator.vibrate?.(10); navigate(`/teams/${p.id}`); }}
          className="sf-press"
          style={{
            flexShrink: 0,
            minHeight: 32,
            padding: '0 12px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: p.id === teamId ? 600 : 400,
            border: `2px solid ${p.team_color || 'var(--sf-border-default)'}`,
            backgroundColor: p.id === teamId ? (p.team_color || 'var(--sf-accent)') : 'var(--sf-bg-card)',
            color: p.id === teamId ? 'var(--sf-text-inverse)' : 'var(--sf-text-primary)',
            whiteSpace: 'nowrap',
          }}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}
