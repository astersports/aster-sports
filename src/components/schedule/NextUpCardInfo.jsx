// Compact info rows for NextUpCard, split so the parent can place
// each piece at the right spot in the visual order:
//   WhenRow  → above the location line
//   GameInfo → below the location line (only renders for games)

export function WhenRow({ event }) {
  return (
    <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', marginTop: 2 }}>
      {new Date(event.start_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}, {new Date(event.start_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
      {event.end_at && ` - ${new Date(event.end_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
    </div>
  );
}

export function GameInfo({ event }) {
  const isGame = event.event_type === 'game' || event.event_type === 'tournament';
  const showJerseyOrChip = isGame && (event.jersey || (event.home_away && event.home_away !== 'tbd'));
  return (
    <>
      {event.arrival_minutes_before > 0 && (
        <div style={{ fontSize: 12, color: 'var(--em-warning)', fontWeight: 500, marginTop: 2 }}>
          Arrive {event.arrival_minutes_before} min early
        </div>
      )}
      {showJerseyOrChip && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
          {event.jersey && <span style={{ fontSize: 12, color: 'var(--em-text-secondary)' }}>{event.jersey} jersey</span>}
          {event.home_away && event.home_away !== 'tbd' && event.home_away !== 'neutral' && (
            <span style={{
              fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
              padding: '1px 6px', borderRadius: 4,
              backgroundColor: event.home_away === 'home' ? 'var(--em-success-soft)' : 'var(--em-info-soft)',
              color: event.home_away === 'home' ? 'var(--em-success)' : 'var(--em-info)',
            }}>
              {event.home_away}
            </span>
          )}
        </div>
      )}
      {event.is_scrimmage && (
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--em-text-tertiary)', textTransform: 'uppercase', marginTop: 4, display: 'block' }}>
          Scrimmage
        </span>
      )}
    </>
  );
}
