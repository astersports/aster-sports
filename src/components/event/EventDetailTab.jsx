import { Calendar, Clock } from 'lucide-react';

// Info block — date/time, location, arrival, opponent, jersey.
// Parent and coach notes are rendered separately in EventDetailPage.
export default function EventDetailTab({ event }) {
  const date = event.start_at ? new Date(event.start_at) : null;
  const endDate = event.end_at ? new Date(event.end_at) : null;

  const fmt = (d) => d?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const fmtTime = (d) => d?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {date && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: 'var(--em-text-primary)' }}>
          <Calendar size={16} strokeWidth={1.75} color="var(--em-text-tertiary)" />
          <span>{fmt(date)}{endDate ? ` · ${fmtTime(date)} – ${fmtTime(endDate)}` : ` · ${fmtTime(date)}`}</span>
        </div>
      )}
      {event.arrival_minutes_before > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: 'var(--em-text-secondary)' }}>
          <Clock size={16} strokeWidth={1.75} color="var(--em-text-tertiary)" />
          <span>Arrive {event.arrival_minutes_before} min early</span>
        </div>
      )}
      {event.opponent && (
        <div style={{
          fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)',
          padding: '8px 12px', backgroundColor: 'var(--em-bg-secondary)', borderRadius: 10,
        }}>
          vs. {event.opponent} · {(event.home_away || 'tbd').toUpperCase()}
        </div>
      )}
      {event.jersey && (
        <div style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>Jersey: {event.jersey}</div>
      )}
    </div>
  );
}
