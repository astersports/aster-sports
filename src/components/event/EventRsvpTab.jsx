import RsvpSummary from '../rsvp/RsvpSummary';
import RsvpPlayerRow from '../rsvp/RsvpPlayerRow';

// RSVP tab — summary bar + one row per roster player with 3-button
// going/maybe/not-going selector. Thin wrapper around the existing
// RSVP components; kept as a tab so the page-level state can own
// the useRsvps hook and pass in the resulting data.
export default function EventRsvpTab({ roster, rsvps, rsvpMap, teamColor, onSetRsvp, loading }) {
  if (loading) {
    return <div style={{ padding: 16, color: 'var(--sf-text-tertiary)', fontSize: 14 }}>Loading roster...</div>;
  }
  if (roster.length === 0) {
    return <div style={{ padding: 16, color: 'var(--sf-text-tertiary)', fontSize: 14 }}>No players on this team yet.</div>;
  }

  return (
    <div style={{ padding: '16px 16px 32px' }}>
      <RsvpSummary roster={roster} rsvps={rsvps} />
      {roster.map((player) => (
        <RsvpPlayerRow
          key={player.id}
          player={player}
          response={rsvpMap[player.id] || null}
          teamColor={teamColor}
          onSetRsvp={onSetRsvp}
        />
      ))}
    </div>
  );
}
