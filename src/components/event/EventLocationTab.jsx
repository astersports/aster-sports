import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Navigation, Calendar } from 'lucide-react';
import { getDirectionUrls } from '../../lib/mapsUrls';

export default function EventLocationTab({ event }) {
  const [locationData, setLocationData] = useState(null);
  const [tournamentStatus, setTournamentStatus] = useState(undefined);

  useEffect(() => {
    if (event.event_type !== 'tournament') return;
    let cancelled = false;
    if (!event.tournament_id) {
      Promise.resolve().then(() => { if (!cancelled) setTournamentStatus(null); });
      return () => { cancelled = true; };
    }
    supabase.from('tournaments').select('schedule_status').eq('id', event.tournament_id).limit(1)
      .then(({ data }) => {
        if (cancelled) return;
        setTournamentStatus(data?.[0]?.schedule_status ?? null);
      });
    return () => { cancelled = true; };
  }, [event.event_type, event.tournament_id]);

  useEffect(() => {
    if (!event.location) return;
    const searchName = event.location.replace(/[\u2018\u2019\u2032]/g, "'").split(' - ')[0].split('(')[0].trim();
    if (!searchName) return;
    supabase.from('locations').select('name, address, lat, lon, google_maps_url, entry_instructions')
      .ilike('name', `%${searchName}%`)
      .limit(1)
      .then(({ data }) => {
        if (data && data[0]) setLocationData(data[0]);
      });
  }, [event.location]);

  const isTournamentNotPublished = event.event_type === 'tournament' &&
    (tournamentStatus === undefined || tournamentStatus === null || tournamentStatus === 'draft');

  if (isTournamentNotPublished) {
    return (
      <div style={{
        margin: '0 16px',
        padding: 16,
        backgroundColor: 'var(--em-bg-card)',
        border: '1px solid var(--em-border-default)',
        borderRadius: 10,
        boxShadow: 'var(--em-shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Calendar size={20} strokeWidth={1.75} style={{ color: 'var(--em-text-primary)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--em-text-primary)' }}>
              Schedule releases Wednesday
            </div>
            <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
              Venue, court assignments, and game times will appear once the tournament organizer publishes the bracket.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const resolvedAddress = event.location_address || locationData?.address || null;
  const urls = getDirectionUrls(resolvedAddress, locationData?.lat, locationData?.lon, locationData?.google_maps_url);

  return (
    <div style={{
      margin: '0 16px',
      padding: 16,
      backgroundColor: 'var(--em-bg-card)',
      border: '1px solid var(--em-border-default)',
      borderRadius: 10,
      boxShadow: 'var(--em-shadow-sm)',
    }}>
      {event.location ? (
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--em-text-primary)' }}>
          {event.location}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)', fontStyle: 'italic' }}>
          Location TBD
        </div>
      )}
      {(event.location_address || locationData?.address) && (
        <div style={{ fontSize: 13, color: 'var(--em-text-secondary)', marginTop: 4 }}>
          {event.location_address || locationData.address}
        </div>
      )}
      {event.sub_location && (
        <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)', marginTop: 2 }}>
          {event.sub_location}
        </div>
      )}
      {locationData?.entry_instructions && (
        <div style={{
          marginTop: 10, padding: 10, borderRadius: 8,
          backgroundColor: 'var(--em-warning-soft)',
          color: 'var(--em-warning)',
          fontSize: 12, fontWeight: 500, lineHeight: 1.4,
        }}>
          {locationData.entry_instructions}
        </div>
      )}
      {urls && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <a href={urls.apple}
            className="sf-press"
            style={{
              flex: 1, minHeight: 44, borderRadius: 10,
              border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)',
              color: 'var(--em-text-primary)', fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, textDecoration: 'none',
            }}>
            <Navigation size={14} strokeWidth={1.75} />
            Apple
          </a>
          <a href={urls.google}
            className="sf-press"
            style={{
              flex: 1, minHeight: 44, borderRadius: 10,
              border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)',
              color: 'var(--em-text-primary)', fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, textDecoration: 'none',
            }}>
            <Navigation size={14} strokeWidth={1.75} />
            Google
          </a>
          <a href={urls.waze}
            className="sf-press"
            style={{
              flex: 1, minHeight: 44, borderRadius: 10,
              border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)',
              color: 'var(--em-text-primary)', fontSize: 13, fontWeight: 500,
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
