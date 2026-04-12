// Placeholder upcoming events list shown under the team roster. The
// three events are hardcoded until the activities query is wired up;
// swap UPCOMING_SEED for a real query filtered by team_id.
const UPCOMING_SEED = [
  { type: 'Practice', date: 'Wed, Apr 16', time: '5:00 PM', location: 'WCC Gym' },
  { type: 'Game', date: 'Sat, Apr 19', time: '9:00 AM', location: "St. Patrick's Gym", opponent: 'vs Storm AAU' },
  { type: 'Practice', date: 'Wed, Apr 23', time: '5:00 PM', location: 'WCC Gym' },
];

export default function UpcomingEvents() {
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
        textTransform: 'uppercase', color: 'var(--sf-text-tertiary)', marginBottom: 8,
      }}>UPCOMING</div>
      <div style={{
        backgroundColor: 'var(--sf-bg-card)',
        borderRadius: 10,
        border: '1px solid var(--sf-border-default)',
        boxShadow: 'var(--sf-shadow-sm)',
        overflow: 'hidden',
      }}>
        {UPCOMING_SEED.map((evt, i, arr) => (
          <div
            key={i}
            className="sf-press"
            onClick={() => navigator.vibrate?.(10)}
            style={{
              padding: '12px 16px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--sf-border-subtle)' : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              minHeight: 52,
            }}
          >
            <div>
              <div className="font-semibold" style={{ fontSize: 14, color: 'var(--sf-text-primary)' }}>
                {evt.opponent || evt.type}
              </div>
              <div style={{ fontSize: 12, color: 'var(--sf-text-tertiary)', marginTop: 2 }}>
                {evt.date} · {evt.location}
              </div>
            </div>
            <div className="font-semibold" style={{ fontSize: 14, color: 'var(--sf-text-primary)' }}>
              {evt.time}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => { navigator.vibrate?.(10); /* TODO: navigate to /schedule filtered by team */ }}
        className="w-full sf-press"
        style={{
          marginTop: 8,
          minHeight: 44,
          borderRadius: 10,
          border: '1px solid var(--sf-border-default)',
          backgroundColor: 'var(--sf-bg-card)',
          color: 'var(--sf-accent)',
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        View full schedule →
      </button>
    </div>
  );
}
