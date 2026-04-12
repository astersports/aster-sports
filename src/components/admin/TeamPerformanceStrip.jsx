// Horizontal scroll strip of team performance cards on the Admin
// Home. Each card shows team name, W-L record placeholder, and a
// short metadata line. Tapping navigates to the team detail page.
export default function TeamPerformanceStrip({ programs, navigate }) {
  return (
    <div className="flex gap-3 overflow-x-auto sf-no-scrollbar" style={{ paddingBottom: 4 }}>
      {programs.map((team) => (
        <button
          key={team.id}
          type="button"
          onClick={() => { navigator.vibrate?.(10); navigate(`/teams/${team.id}`); }}
          className="sf-press sf-fade-in"
          style={{
            flexShrink: 0,
            width: 140,
            padding: 12,
            borderRadius: 10,
            backgroundColor: 'var(--sf-bg-card)',
            border: '1px solid var(--sf-border-default)',
            boxShadow: 'var(--sf-shadow-sm)',
            textAlign: 'left',
            borderTop: `3px solid ${team.team_color || 'var(--sf-neutral)'}`,
          }}
        >
          <div className="font-semibold truncate" style={{ fontSize: 14, color: 'var(--sf-text-primary)' }}>
            {team.name}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--sf-text-primary)', marginTop: 4 }}>
            0-0
          </div>
          <div style={{ fontSize: 11, color: 'var(--sf-text-tertiary)', marginTop: 2 }}>
            {team.age_group} · {team.circuit === 'aau' ? 'AAU' : 'League Play'}
          </div>
        </button>
      ))}
    </div>
  );
}
