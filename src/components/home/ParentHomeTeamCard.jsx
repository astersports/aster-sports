// Horizontal team pill rendered in the MY TEAMS carousel on ParentHomePage.
// The colored left stripe uses team.team_color so each team stays
// visually keyed to its identity across the app. Record + streak
// pulled live from useTeamRecords (same hook the /records page uses).
import { useTeamRecords } from '../../hooks/useTeamRecords';

export default function ParentHomeTeamCard({ team, onClick }) {
  const { summary, loading } = useTeamRecords(team.id);
  const recordLine = loading
    ? '—'
    : (summary.streak === '—' ? summary.record : `${summary.record} · ${summary.streak}`);
  return (
    <button type="button" onClick={onClick} className="sf-press"
      style={{
        flexShrink: 0, minWidth: 140, minHeight: 80, borderRadius: 10, overflow: 'hidden',
        border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)',
        boxShadow: 'var(--em-shadow-sm)', display: 'flex', alignItems: 'stretch', textAlign: 'left',
      }}
    >
      <div style={{ width: 3, flexShrink: 0, backgroundColor: team.team_color || 'var(--em-neutral)' }} />
      <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--em-text-primary)' }}>{team.name}</span>
        <span style={{ fontSize: 12, color: 'var(--em-text-tertiary)' }}>{recordLine}</span>
      </div>
    </button>
  );
}
