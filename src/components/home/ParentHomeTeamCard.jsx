// Horizontal team pill rendered in the MY TEAMS carousel on ParentHomePage.
// The colored left stripe uses team.team_color so each team stays
// visually keyed to its identity across the app. Presentational —
// `summary` (or null while loading) is passed in by the parent, which
// calls useOrgTeamRecords once for all team cards.
import { EMPTY_SUMMARY } from '../../lib/teamRecords';

export default function ParentHomeTeamCard({ team, summary, loading, onClick }) {
  const s = summary || EMPTY_SUMMARY;
  const recordLine = loading
    ? '—'
    : (s.streak === '—' ? s.record : `${s.record} · ${s.streak}`);
  return (
    <button type="button" onClick={onClick} className="sf-press"
      style={{
        flexShrink: 0, minWidth: 140, minHeight: 72, borderRadius: 10, overflow: 'hidden',
        border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)',
        boxShadow: 'var(--em-shadow-sm)', display: 'flex', alignItems: 'stretch', textAlign: 'left',
      }}
    >
      <div style={{ width: 3, flexShrink: 0, backgroundColor: team.team_color || 'var(--em-neutral)' }} />
      <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)' }}>{team.name}</span>
        <span style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>{recordLine}</span>
      </div>
    </button>
  );
}
