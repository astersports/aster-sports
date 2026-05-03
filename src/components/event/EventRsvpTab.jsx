import RsvpSummary from '../rsvp/RsvpSummary';
import RsvpPlayerRow from '../rsvp/RsvpPlayerRow';

// RSVP tab — summary bar + one row per roster player with 3-button
// going/maybe/not-going selector. Thin wrapper around the existing
// RSVP components; kept as a tab so the page-level state can own
// the useRsvps hook and pass in the resulting data.
export default function EventRsvpTab({ roster, rsvps, rsvpMap, teamColor, onSetRsvp, onSaveNote, loading }) {
  if (loading) {
    return <div style={{ padding: 16, color: 'var(--em-text-tertiary)', fontSize: 15 }}>Loading roster...</div>;
  }
  if (roster.length === 0) {
    return <div style={{ padding: 16, color: 'var(--em-text-tertiary)', fontSize: 15 }}>No players on this team yet.</div>;
  }

  const statusOrder = { going: 0, maybe: 1, not_going: 2 };
  const sorted = [...roster].sort((a, b) => {
    const aStatus = rsvpMap[a.id] || 'none';
    const bStatus = rsvpMap[b.id] || 'none';
    const aOrder = statusOrder[aStatus] ?? 3;
    const bOrder = statusOrder[bStatus] ?? 3;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.last_name.localeCompare(b.last_name);
  });

  const headerLabels = { going: 'Going', maybe: 'Maybe', not_going: 'Not Going', none: 'No Response' };

  return (
    <div style={{ padding: '16px 16px 32px' }}>
      <RsvpSummary roster={roster} rsvps={rsvps} />
      {sorted.map((player, i) => {
        const status = rsvpMap[player.id] || 'none';
        const prevStatus = i > 0 ? (rsvpMap[sorted[i - 1].id] || 'none') : null;
        const showHeader = i === 0 || status !== prevStatus;
        return (
          <div key={player.id}>
            {showHeader && (
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: i > 0 ? 12 : 0, marginBottom: 4 }}>
                {headerLabels[status]}
              </div>
            )}
            <RsvpPlayerRow
              player={player}
              response={rsvpMap[player.id] || null}
              existingNote={rsvps.find((r) => r.player_id === player.id)?.comment || ''}
              teamColor={teamColor}
              onSetRsvp={onSetRsvp}
              onSaveNote={onSaveNote}
            />
          </div>
        );
      })}
    </div>
  );
}
