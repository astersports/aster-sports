// Horizontal scroll strip of team performance cards on the Admin
// Home. Each card shows team name, W-L record placeholder, and a
// short metadata line. Tapping navigates to the team detail page.
export default function TeamPerformanceStrip({ programs, recordsByTeam = {}, navigate }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
      {programs.map((team) => (
        <button
          key={team.id}
          type="button"
          onClick={() => { navigator.vibrate?.(10); navigate(`/teams/${team.id}`); }}
          className="as-press as-fade-in"
          style={{
            padding: 12,
            borderRadius: 10,
            backgroundColor: 'var(--as-bg-card)',
            border: '1px solid var(--as-border-default)',
            boxShadow: 'var(--as-shadow-sm)',
            textAlign: 'left',
            borderTop: `3px solid ${team.team_color || 'var(--as-neutral)'}`,
          }}
        >
          <div className="font-semibold truncate" style={{ fontSize: 15, color: 'var(--as-text-primary)' }}>
            {team.name}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--as-text-primary)', marginTop: 4 }}>
            {recordsByTeam[team.id]?.record || '0-0'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--as-text-tertiary)', marginTop: 2 }}>
            {team.age_group} · {team.circuit === 'aau' ? 'AAU' : 'League Play'}
          </div>
        </button>
      ))}
    </div>
  );
}
