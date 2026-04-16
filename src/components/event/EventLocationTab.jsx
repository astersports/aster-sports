import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Navigation } from 'lucide-react';

export default function EventLocationTab({ event }) {
  const [locationData, setLocationData] = useState(null);

  useEffect(() => {
    if (!event.location) return;
    supabase.from('locations').select('name, address, city, state, lat, lon')
      .ilike('name', `%${event.location.split(' - ')[0].split('(')[0].trim()}%`)
      .limit(1)
      .then(({ data }) => {
        if (data && data[0]) setLocationData(data[0]);
      });
  }, [event.location]);

  return (
    <div style={{ padding: 16 }}>
      {event.location && (
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--sf-text-primary)' }}>
          {event.location}
        </div>
      )}
      {(event.location_address || locationData?.address) && (
        <div style={{ fontSize: 13, color: 'var(--sf-text-secondary)', marginTop: 4 }}>
          {event.location_address || `${locationData.address}, ${locationData.city}, ${locationData.state}`}
        </div>
      )}
      {event.sub_location && (
        <div style={{ fontSize: 13, color: 'var(--sf-text-tertiary)', marginTop: 2 }}>
          {event.sub_location}
        </div>
      )}
      {locationData?.lat && locationData?.lon && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <a href={`https://maps.apple.com/?daddr=${locationData.lat},${locationData.lon}`}
            className="sf-press"
            style={{
              flex: 1, minHeight: 44, borderRadius: 10,
              border: '1px solid var(--sf-border-default)', backgroundColor: 'var(--sf-bg-card)',
              color: 'var(--sf-text-primary)', fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, textDecoration: 'none',
            }}>
            <Navigation size={14} strokeWidth={1.75} />
            Apple
          </a>
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${locationData.lat},${locationData.lon}`}
            className="sf-press"
            style={{
              flex: 1, minHeight: 44, borderRadius: 10,
              border: '1px solid var(--sf-border-default)', backgroundColor: 'var(--sf-bg-card)',
              color: 'var(--sf-text-primary)', fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, textDecoration: 'none',
            }}>
            <Navigation size={14} strokeWidth={1.75} />
            Google
          </a>
          <a href={`https://waze.com/ul?ll=${locationData.lat},${locationData.lon}&navigate=yes`}
            className="sf-press"
            style={{
              flex: 1, minHeight: 44, borderRadius: 10,
              border: '1px solid var(--sf-border-default)', backgroundColor: 'var(--sf-bg-card)',
              color: 'var(--sf-text-primary)', fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, textDecoration: 'none',
            }}>
            <Navigation size={14} strokeWidth={1.75} />
            Waze
          </a>
        </div>
      )}
    </div>
  );
}
