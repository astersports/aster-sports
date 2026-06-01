import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Navigation } from 'lucide-react';
import { getDirectionUrls } from '../../lib/mapsUrls';
import { useAuth } from '../../context/AuthContext';
import Button from '../shared/Button';

export default function EventLocationTab({ event }) {
  const [locationData, setLocationData] = useState(null);
  const [tournamentStatus, setTournamentStatus] = useState(undefined);
  // Phase 1 audit findings P0-1 + P1-1 (docs/AUDIT_PHASE1_WIRING_2026-05-16.md):
  // both queries below were missing the org_id filter. Locations was also
  // missing archived_at. Same class as the AnchorPicker bug (PR #193).
  const { orgId } = useAuth();

  useEffect(() => {
    if (event.event_type !== 'tournament') return;
    let cancelled = false;
    if (!event.tournament_id || !orgId) {
      Promise.resolve().then(() => { if (!cancelled) setTournamentStatus(null); });
      return () => { cancelled = true; };
    }
    supabase.from('tournaments').select('schedule_status')
      .eq('id', event.tournament_id)
      .eq('org_id', orgId)
      .limit(1)
      .then(({ data, error }) => {
        if (error) console.error('EventLocationTab tournamentStatus:', error.message);
        if (cancelled) return;
        setTournamentStatus(data?.[0]?.schedule_status ?? null);
      });
    return () => { cancelled = true; };
  }, [event.event_type, event.tournament_id, orgId]);

  useEffect(() => {
    if (!event.location || !orgId) return;
    const searchName = event.location.replace(/[\u2018\u2019\u2032]/g, "'").split(' - ')[0].split('(')[0].trim();
    if (!searchName) return;
    supabase.from('locations').select('name, address, lat, lon, google_maps_url, entry_instructions')
      .eq('org_id', orgId)
      .is('archived_at', null)
      .ilike('name', `%${searchName}%`)
      .limit(1)
      .then(({ data, error }) => {
        if (error) console.error('EventLocationTab locationSearch:', error.message);
        if (data && data[0]) setLocationData(data[0]);
      });
  }, [event.location, orgId]);

  const isTournamentNotPublished = event.event_type === 'tournament' &&
    (tournamentStatus === undefined || tournamentStatus === null || tournamentStatus === 'draft');

  if (isTournamentNotPublished) {
    return (
      <div style={{
        margin: '0 16px',
        padding: 16,
        backgroundColor: 'var(--as-bg-card)',
        border: '1px solid var(--as-border-default)',
        borderRadius: 10,
        boxShadow: 'var(--as-shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Calendar size={20} strokeWidth={1.75} style={{ color: 'var(--as-text-primary)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--as-text-primary)' }}>
              Schedule releases Wednesday
            </div>
            <div style={{ fontSize: 13, color: 'var(--as-text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
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
      backgroundColor: 'var(--as-bg-card)',
      border: '1px solid var(--as-border-default)',
      borderRadius: 10,
      boxShadow: 'var(--as-shadow-sm)',
    }}>
      {event.location ? (
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--as-text-primary)' }}>
          {event.location}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)', fontStyle: 'italic' }}>
          Location TBD
        </div>
      )}
      {(event.location_address || locationData?.address) && (
        <div style={{ fontSize: 13, color: 'var(--as-text-secondary)', marginTop: 4 }}>
          {event.location_address || locationData.address}
        </div>
      )}
      {event.sub_location && (
        <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)', marginTop: 2 }}>
          {event.sub_location}
        </div>
      )}
      {locationData?.entry_instructions && (
        <div style={{
          marginTop: 10, padding: 10, borderRadius: 8,
          backgroundColor: 'var(--as-warning-soft)',
          color: 'var(--as-warning)',
          fontSize: 13, fontWeight: 500, lineHeight: 1.4,
        }}>
          {locationData.entry_instructions}
        </div>
      )}
      {urls && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Button variant="secondary" fullWidth onClick={() => window.open(urls.google, '_blank')}>
            <Navigation size={15} strokeWidth={1.75} />
            Get Directions
          </Button>
        </div>
      )}
    </div>
  );
}
