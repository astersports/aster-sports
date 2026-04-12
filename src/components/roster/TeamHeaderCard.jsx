const CIRCUIT_LABELS = { aau: 'AAU', league_play: 'League Play', tournament: 'Tournament' };

// Team summary card at the top of TeamDetailPage: full-width color
// stripe, team name, team-color age-group roundel, grey pill badges,
// and a player count. The component is presentational — it does not
// query anything; both `team` and the player count come from the page.
export default function TeamHeaderCard({ team, playerCount }) {
  return (
    <div style={{
      backgroundColor: 'var(--sf-bg-card)',
      borderRadius: 10,
      border: '1px solid var(--sf-border-default)',
      boxShadow: 'var(--sf-shadow-sm)',
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      <div style={{
        height: 6,
        backgroundColor: team.team_color || 'var(--sf-neutral)',
      }} />
      <div style={{ padding: 16 }}>
        <div className="flex items-center justify-between">
          <h1 className="font-bold" style={{ color: 'var(--sf-text-primary)', fontSize: 20, letterSpacing: '-0.025em' }}>
            {team.name}
          </h1>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: team.team_color || 'var(--sf-neutral)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--sf-text-inverse)',
            fontSize: 15,
            fontWeight: 700,
          }}>
            {team.age_group}
          </div>
        </div>
        <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6,
            backgroundColor: 'var(--sf-bg-secondary)', color: 'var(--sf-text-secondary)',
          }}>{team.age_group}</span>
          <span style={{
            fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6,
            backgroundColor: 'var(--sf-bg-secondary)', color: 'var(--sf-text-secondary)',
          }}>{CIRCUIT_LABELS[team.circuit] || team.circuit}</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--sf-text-tertiary)', marginTop: 8 }}>
          {playerCount} {playerCount === 1 ? 'player' : 'players'}
        </div>
      </div>
    </div>
  );
}
