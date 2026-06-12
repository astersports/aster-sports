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

  // SD-14 (PR-D'): venue resolved via the location_id JOIN \u2014 the ilike
  // name-match could return the WRONG venue (VF-6 class: "Westchester
  // Community Center" matching "Westchester Community College"). The 19
  // legacy text-only events (no location_id) get no enrichment fetch;
  // directions degrade to a name-text search URL below.
  useEffect(() => {
    if (!event.location_id || !orgId) return;
    let cancelled = false;
    supabase.from('locations').select('name, address, lat, lon, google_maps_url, entry_instructions')
      .eq('org_id', orgId)
      .eq('id', event.location_id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('EventLocationTab location:', error.message);
        if (!cancelled && data) setLocationData(data);
      });
    return () => { cancelled = true; };
  }, [event.location_id, orgId]);

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

  // Address > legacy name-text (the 19 pre-FK events keep a search link).
  const resolvedAddress = event.location_address || locationData?.address || event.location || null;
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
      {/* SD-14 3-way: Apple / Google / Waze (§15 — formats un-deferred).
          Apple/Waze need coords or an address; google_maps_url-only
          venues render Google alone. */}
      {urls && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {urls.apple && (
            <Button variant="secondary" fullWidth onClick={() => window.open(urls.apple, '_blank')} aria-label="Directions in Apple Maps">
              Apple
            </Button>
          )}
          <Button variant="secondary" fullWidth onClick={() => window.open(urls.google, '_blank')} aria-label="Directions in Google Maps">
            <Navigation size={15} strokeWidth={1.75} />
            Google
          </Button>
          {urls.waze && (
            <Button variant="secondary" fullWidth onClick={() => window.open(urls.waze, '_blank')} aria-label="Directions in Waze">
              Waze
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
