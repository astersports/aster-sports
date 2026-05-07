// Horizontal pill strip for quick team switching without going back
// to the Teams list. Renders one pill per team in the active season,
// styled with the team's color. Active team is filled; others outlined.
export default function TeamSwitcher({ programs, teamId, navigate }) {
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
