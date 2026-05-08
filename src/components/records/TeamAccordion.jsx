import TeamDetail from './TeamDetail';
import FormGuide from './FormGuide';

function buildMeta(team) {
  if (team.circuit === 'aau') return 'AAU · Zero Gravity';
  if (team.circuit === 'league_play') return 'League Play';
  return team.age_group || '';
}

export default function TeamAccordion({ team, summary, expanded, onToggle }) {
  const s = summary;
  return (
    <div style={{ marginBottom: 12 }}>
      <button
        type="button" onClick={onToggle} className="sf-press"
        aria-expanded={expanded}
        aria-label={`${team.name} ${s.record}`}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
          background: 'var(--sf-bc-card)', border: `1px solid ${expanded ? team.team_color : 'rgba(74,143,212,0.18)'}`,
          borderLeft: `4px solid ${team.team_color}`, borderRadius: 10, cursor: 'pointer',
          textAlign: 'left', fontFamily: 'inherit', transition: 'border-color 200ms',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, textTransform: 'uppercase', color: '#fff' }}>{team.name}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{buildMeta(team)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 800, color: team.team_color, textShadow: `0 0 14px ${team.team_color}40` }}>{s.record}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
            {s.streak !== '—' && <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff' }}>{s.streak}</span>}
            <FormGuide results={s.last5} />
          </div>
        </div>
        <span style={{ fontSize: 15, color: team.team_color, transition: 'transform 200ms', transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
      </button>
      {expanded && <TeamDetail team={team} summary={s} />}
    </div>
  );
}
