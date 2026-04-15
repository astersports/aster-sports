import { Calendar, Clock, Repeat, MapPin } from 'lucide-react';

// Info block — date/time, location, arrival, opponent, jersey.
// Parent and coach notes are rendered separately in EventDetailPage.
export default function EventDetailTab({ event }) {
  const date = event.start_at ? new Date(event.start_at) : null;
  const endDate = event.end_at ? new Date(event.end_at) : null;

  const fmt = (d) => d?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const fmtTime = (d) => d?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {event.parent_event_id && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 12, color: 'var(--sf-text-tertiary)',
          backgroundColor: 'var(--sf-bg-secondary)', padding: '2px 8px', borderRadius: 6,
          alignSelf: 'flex-start',
        }}>
          <Repeat size={12} strokeWidth={1.75} />
          Part of recurring series
        </div>
      )}
      {date && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--sf-text-primary)' }}>
          <Calendar size={16} strokeWidth={1.75} color="var(--sf-text-tertiary)" />
          <span>{fmt(date)}{endDate ? ` · ${fmtTime(date)} – ${fmtTime(endDate)}` : ''}</span>
        </div>
      )}
      {(event.location || event.location_address) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <MapPin size={16} strokeWidth={1.75} color="var(--sf-text-tertiary)" style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--sf-text-primary)' }}>
              {event.location || 'Location TBD'}
            </div>
            {event.sub_location && (
              <div style={{ fontSize: 13, color: 'var(--sf-text-secondary)', marginTop: 2 }}>
                {event.sub_location}
              </div>
            )}
            {event.location_address && (
              <div style={{ fontSize: 13, color: 'var(--sf-text-tertiary)', marginTop: 4 }}>
                {event.location_address}
              </div>
            )}
          </div>
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
  );
}
