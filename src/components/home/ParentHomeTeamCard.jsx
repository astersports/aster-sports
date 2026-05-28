// Team card rendered in the MY TEAMS section on ParentHomePage.
// Full-width horizontal row: colored left stripe, team name + record + next event on right.
// Presentational — `summary` (or null while loading) is passed in by the parent,
// which calls useOrgTeamRecords once for all team cards.
import { EMPTY_SUMMARY } from '../../lib/teamRecords';

export default function ParentHomeTeamCard({ team, summary, loading, nextEvent, onClick }) {
  const s = summary || EMPTY_SUMMARY;
  const recordLine = loading
    ? '—'
    : (s.streak === '—' ? s.record : `${s.record} · ${s.streak}`);
  return (
    <button type="button" onClick={onClick} className="em-press"
      style={{
        width: '100%', minHeight: 56, borderRadius: 10, overflow: 'hidden',
        border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)',
        boxShadow: 'var(--em-shadow-sm)', display: 'flex', alignItems: 'stretch', textAlign: 'left',
      }}
    >
      <div style={{ width: 3, flexShrink: 0, backgroundColor: team.team_color || 'var(--em-neutral)' }} />
      <div style={{ flex: 1, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)' }}>{team.name}</span>
        <span style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>{recordLine}</span>
        {nextEvent && (
          <span style={{ fontSize: 11, color: 'var(--em-text-tertiary)', marginLeft: 'auto' }}>
            Next: {new Date(nextEvent.start_at).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/New_York' })} {new Date(nextEvent.start_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })}
          </span>
        )}
      </div>
    </button>
  );
}
