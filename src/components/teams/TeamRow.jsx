// Single team row on /teams. Two-line layout: name on top, stats meta
// on bottom. Presentational — `summary` flows from TeamsPage, which
// calls useOrgTeamRecords once.
import { useNavigate } from 'react-router-dom';
import { EMPTY_SUMMARY } from '../../lib/teamRecords';

const CIRCUIT_LABELS = { aau: 'AAU', league_play: 'League Play', tournament: 'Tournament' };

function buildMetaLine(team, summary) {
  const parts = [team.age_group, CIRCUIT_LABELS[team.circuit] || team.circuit];
  if (summary.gamesPlayed > 0) {
    parts.push(summary.record);
    if (summary.streak !== '—') parts.push(summary.streak);
    parts.push(`${summary.ppg} PPG`);
    parts.push(`${summary.allowed} PA`);
  }
  return parts.filter(Boolean).join(' · ');
}

export default function TeamRow({ team, idx, summary }) {
  const navigate = useNavigate();
  const s = summary || EMPTY_SUMMARY;
  return (
    <button
      type="button"
      onClick={() => { navigator.vibrate?.(10); navigate(`/teams/${team.id}`); }}
      className={`w-full text-left sf-press sf-stagger-${idx + 1}`}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        backgroundColor: 'var(--em-bg-card)',
        borderRadius: 10,
        border: '1px solid var(--em-border-default)',
        boxShadow: 'var(--em-shadow-sm)',
        overflow: 'hidden',
        minHeight: 56,
        transition: 'box-shadow 150ms ease-out, transform 150ms ease-out',
      }}
    >
      <div style={{ width: 5, flexShrink: 0, backgroundColor: team.team_color || 'var(--em-neutral)' }} />
      <div style={{ flex: 1, padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <div className="font-semibold" style={{ color: 'var(--em-text-primary)', fontSize: 16, lineHeight: 1.3 }}>
          {team.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--em-text-tertiary)', lineHeight: 1.4 }}>
          {buildMetaLine(team, s)}
        </div>
      </div>
    </button>
  );
}
