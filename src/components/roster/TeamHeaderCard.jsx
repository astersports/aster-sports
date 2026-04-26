const CIRCUIT_LABELS = { aau: 'AAU', league_play: 'League Play', tournament: 'Tournament' };

// Team summary card at the top of TeamDetailPage: full-width color
// stripe, team name, team-color age-group roundel, grey pill badges,
// W-L placeholder, and a three-stat row (Players / Roster / Academy).
// The component is presentational — it does not query anything; both
// `team` and `players` come from the page.
export default function TeamHeaderCard({ team, players }) {
  const rosterCount = players.filter((p) => p.member_type === 'roster').length;
  const academyCount = players.filter((p) => p.member_type === 'futures_academy').length;

  return (
    <div className="sf-fade-in" style={{
      backgroundColor: 'var(--em-bg-card)',
      borderRadius: 10,
      border: '1px solid var(--em-border-default)',
      boxShadow: 'var(--em-shadow-sm)',
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      <div style={{ height: 6, backgroundColor: team.team_color || 'var(--em-neutral)' }} />
      <div style={{ padding: 16 }}>
        <div className="flex items-center justify-between">
          <h1 className="font-bold" style={{ color: 'var(--em-text-primary)', fontSize: 20, letterSpacing: '-0.025em' }}>
            {team.name}
          </h1>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            backgroundColor: team.team_color || 'var(--em-neutral)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--em-text-inverse)', fontSize: 15, fontWeight: 700,
          }}>
            {team.age_group}
          </div>
        </div>
        <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6, backgroundColor: 'var(--em-bg-secondary)', color: 'var(--em-text-secondary)' }}>{team.age_group}</span>
          <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6, backgroundColor: 'var(--em-bg-secondary)', color: 'var(--em-text-secondary)' }}>{CIRCUIT_LABELS[team.circuit] || team.circuit}</span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, backgroundColor: 'var(--em-neutral-soft)', color: 'var(--em-text-tertiary)' }}>0-0</span>
        </div>
        <div className="flex items-center gap-4" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--em-border-subtle)' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="font-bold" style={{ fontSize: 20, color: 'var(--em-text-primary)' }}>{players.length}</div>
            <div style={{ fontSize: 11, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Players</div>
          </div>
          <div style={{ width: 1, height: 32, backgroundColor: 'var(--em-border-subtle)' }} />
          <div style={{ textAlign: 'center' }}>
            <div className="font-bold" style={{ fontSize: 20, color: 'var(--em-text-primary)' }}>{rosterCount}</div>
            <div style={{ fontSize: 11, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Roster</div>
          </div>
          <div style={{ width: 1, height: 32, backgroundColor: 'var(--em-border-subtle)' }} />
          <div style={{ textAlign: 'center' }}>
            <div className="font-bold" style={{ fontSize: 20, color: 'var(--em-academy)' }}>{academyCount}</div>
            <div style={{ fontSize: 11, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Academy</div>
          </div>
        </div>
      </div>
    </div>
  );
}
