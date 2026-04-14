import { MapPin } from 'lucide-react';

// Location tab — primary location, sub-location (court/room), and
// full address. Map + directions will land in a future prompt.
export default function EventLocationTab({ event }) {
  if (!event.location && !event.location_address) {
    return (
      <div style={{ padding: 24, color: 'var(--sf-text-tertiary)', fontSize: 14 }}>
        No location set.
      </div>
    );
  }

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <MapPin size={18} strokeWidth={1.75} color="var(--sf-accent)" style={{ marginTop: 2, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--sf-text-primary)' }}>
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
    </div>
  );
}
