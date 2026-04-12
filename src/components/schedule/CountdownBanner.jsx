import { useState, useEffect } from 'react';

export default function CountdownBanner({ nextEvent }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!nextEvent) return null;

  const target = new Date(`${nextEvent.date}T${nextEvent.start_time || '00:00'}`).getTime();
  const diff = target - now;
  if (diff <= 0 || diff > 6 * 3600000) return null;

  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  const timeStr = hours > 0 ? `${hours}h ${mins}m ${secs}s` : `${mins}m ${secs}s`;
  const teamColor = nextEvent.teams?.team_color;
  const teamName = nextEvent.teams?.name || '';

  return (
    <div
      className="sf-fade-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 10,
        backgroundColor: 'var(--sf-bg-card)',
        border: '1px solid var(--sf-border-default)',
        boxShadow: 'var(--sf-shadow-sm)',
        marginBottom: 8,
      }}
    >
      <div className="sf-pulse-dot" style={{
        width: 8, height: 8, borderRadius: '50%',
        backgroundColor: 'var(--sf-success)', flexShrink: 0,
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--sf-text-secondary)' }}>
          Next: <span style={{ color: teamColor, fontWeight: 600 }}>{teamName}</span> {nextEvent.event_type || 'event'}
        </div>
      </div>
      <div className="font-bold" style={{
        fontSize: 16, color: 'var(--sf-accent)',
        fontVariantNumeric: 'tabular-nums',
      }}>{timeStr}</div>
    </div>
  );
}
