import TeamGameLog from './TeamGameLog';
import { fmt1 } from '../../lib/teamRecords';

function Stat({ n, l, color }) {
  return (
    <div>
      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, color, display: 'block' }}>{n}</span>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', display: 'block', marginTop: 2 }}>{l}</span>
    </div>
  );
}

export default function TeamDetail({ team, summary }) {
  const s = summary;
  return (
    <div style={{ padding: '12px 20px 20px', background: 'rgba(14,30,51,0.5)', borderLeft: `4px solid ${team.team_color}`, borderRadius: '0 0 10px 10px', marginTop: -1 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, textAlign: 'center', marginBottom: 16, background: '#0e1e33', borderRadius: 10, padding: '12px 8px', border: '1px solid rgba(74,143,212,0.18)' }}>
        <Stat n={fmt1(s.ppg)} l="PPG" color={team.team_color} />
        <Stat n={fmt1(s.allowed)} l="Allowed" color="var(--em-bc-green)" />
        <Stat n={s.diff > 0 ? `+${fmt1(s.diff)}` : fmt1(s.diff)} l="Diff" color={s.diff >= 0 ? 'var(--em-bc-green)' : 'var(--em-bc-red)'} />
        <Stat n={`${s.winPct}%`} l="Win %" color="#fff" />
        <Stat n={s.gamesPlayed} l="Games" color="#fff" />
      </div>
      <TeamGameLog teamId={team.id} teamColor={team.team_color} />
    </div>
  );
}
