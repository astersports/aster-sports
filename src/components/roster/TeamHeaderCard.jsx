import { formatDiff } from '../../lib/formatters';
import { EMPTY_SUMMARY } from '../../lib/teamRecords';

const CIRCUIT_LABELS = { aau: 'AAU', league_play: 'League Play', tournament: 'Tournament' };

function buildMetaLine(team, summary) {
  const parts = [team.age_group, CIRCUIT_LABELS[team.circuit] || team.circuit];
  if (summary.gamesPlayed > 0) {
    parts.push(summary.record);
    if (summary.streak !== '—') parts.push(summary.streak);
  }
  return parts.filter(Boolean).join(' · ');
}

function Cell({ value, label }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div className="font-bold" style={{ fontSize: 18, color: 'var(--em-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

// Hero block on TeamDetailPage. Color stripe, team identity, meta line
// (age · circuit · record · streak), and a five-cell record strip
// (PPG / Allowed / Diff / Win% / Games). Pure presentational —
// `team` and `summary` come from the page, which calls useTeamRecords
// once. Loading state renders '—' per cell so layout stays stable.
//
// Merged from prior TeamHeaderCard + TeamRecordsSection in 3d-g.4 so
// the records stop being a separate "buried" card below the header.
export default function TeamHeaderCard({ team, summary, loading }) {
  const s = summary || EMPTY_SUMMARY;
  const v = (n) => (loading ? '—' : n);
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
        <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)', marginTop: 4 }}>
          {buildMetaLine(team, s)}
        </div>
        <div style={{
          marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--em-border-subtle)',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Cell value={v(s.ppg)} label="PPG" />
          <Cell value={v(s.allowed)} label="Allowed" />
          <Cell value={v(formatDiff(s.diff))} label="Diff" />
          <Cell value={v(`${s.winPct}%`)} label="Win %" />
          <Cell value={v(s.gamesPlayed)} label="Games" />
        </div>
      </div>
    </div>
  );
}
