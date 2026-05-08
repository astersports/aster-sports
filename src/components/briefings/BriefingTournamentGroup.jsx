// Visual group header for a tournament's row list. Format:
//   "Sat May 16 · ZG Rumble for the Ring CT · in 8 days"
// Uses NY timezone for date label so it matches the briefing engine's
// rendering rules (per CLAUDE.md §13 and tournamentBriefing.js).

const dateFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

function relativeWindow(startDateStr) {
  if (!startDateStr) return '';
  const startMs = new Date(`${startDateStr}T12:00:00`).getTime();
  const days = Math.round((startMs - Date.now()) / 86400000);
  if (days < 0) {
    const past = -days;
    return `${past} day${past === 1 ? '' : 's'} ago`;
  }
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} day${days === 1 ? '' : 's'}`;
}

export default function BriefingTournamentGroup({ startDate, name, children }) {
  const dateLabel = startDate
    ? dateFmt.format(new Date(`${startDate}T12:00:00`))
    : '';
  const window = relativeWindow(startDate);

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        padding: '0 4px 8px',
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        flexWrap: 'wrap',
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--em-text-tertiary)',
        }}>
          {dateLabel}
        </span>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)' }}>
          {name}
        </span>
        {window && (
          <span style={{ fontSize: 12, color: 'var(--em-text-tertiary)' }}>
            · {window}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children}
      </div>
    </div>
  );
}
