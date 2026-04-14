import { Calendar, Clock, MapPin } from 'lucide-react';

// Presentational info + notes rows for the event detail page. No data
// fetching; just renders whatever fields the event row exposes.
export default function EventInfo({ event }) {
  const date = event.start_at ? new Date(event.start_at) : null;
  const endDate = event.end_at ? new Date(event.end_at) : null;

  const fmt = (d) => d?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const fmtTime = (d) => d?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {date && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--sf-text-primary)' }}>
            <Calendar size={16} strokeWidth={1.75} color="var(--sf-text-tertiary)" />
            <span>{fmt(date)}{endDate ? ` · ${fmtTime(date)} – ${fmtTime(endDate)}` : ''}</span>
          </div>
        )}
        {event.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--sf-text-primary)' }}>
            <MapPin size={16} strokeWidth={1.75} color="var(--sf-text-tertiary)" />
            <span>{event.location}{event.sub_location ? ` · ${event.sub_location}` : ''}</span>
          </div>
        )}
        {event.arrival_minutes_before > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--sf-text-secondary)' }}>
            <Clock size={16} strokeWidth={1.75} color="var(--sf-text-tertiary)" />
            <span>Arrive {event.arrival_minutes_before} min early</span>
          </div>
        )}
        {event.opponent && (
          <div style={{
            fontSize: 15, fontWeight: 600, color: 'var(--sf-text-primary)',
            padding: '8px 12px', backgroundColor: 'var(--sf-bg-secondary)', borderRadius: 10,
          }}>
            vs. {event.opponent} · {(event.home_away || 'tbd').toUpperCase()}
          </div>
        )}
        {event.jersey && (
          <div style={{ fontSize: 13, color: 'var(--sf-text-secondary)' }}>Jersey: {event.jersey}</div>
        )}
      </div>

      {event.notes && (
        <div style={{ padding: '0 16px 16px', fontSize: 14, color: 'var(--sf-text-secondary)' }}>
          <div style={{ fontWeight: 500, color: 'var(--sf-text-primary)', marginBottom: 4, fontSize: 13 }}>Parent instructions</div>
          {event.notes}
        </div>
      )}
      {event.coach_notes && (
        <div style={{ padding: '0 16px 16px', fontSize: 14, color: 'var(--sf-text-secondary)' }}>
          <div style={{ fontWeight: 500, color: 'var(--sf-warning)', marginBottom: 4, fontSize: 13 }}>Coach notes (not visible to parents)</div>
          {event.coach_notes}
        </div>
      )}
    </>
  );
}
