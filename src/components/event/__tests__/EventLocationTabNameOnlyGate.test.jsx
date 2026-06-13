// @vitest-environment jsdom
//
// §15 name-text-only gate (2026-06-13 locations audit, operator-caught):
// a bare venue NAME is a GOOGLE-ONLY directions input — Apple name-search
// mis-resolves. Apple renders only from a resolved venue row (coords /
// street address). Cross-surface invariant per AP#43. (Waze removed
// entirely 2026-06-13, operator-directed — only Apple + Google remain.)

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({ locRow: null }));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ orgId: 'org-1' }),
}));
vi.mock('../../../lib/supabase', () => {
  const chain = () => {
    const q = {};
    ['select', 'eq', 'limit'].forEach((m) => { q[m] = () => q; });
    q.maybeSingle = () => Promise.resolve({ data: h.locRow, error: null });
    q.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    return q;
  };
  return { supabase: { from: () => chain() } };
});

import EventLocationTab from '../EventLocationTab';

afterEach(cleanup);

describe('EventLocationTab — §15 name-only directions gate', () => {
  it('name-only event (no FK, no address): Google renders, Apple does NOT; no Waze', () => {
    h.locRow = null;
    const { queryByLabelText } = render(
      <EventLocationTab event={{ id: 'e-1', event_type: 'game', location: 'East Coast Sports & Fitness', location_id: null }} />
    );
    expect(queryByLabelText('Directions in Google Maps')).not.toBeNull();
    expect(queryByLabelText('Directions in Apple Maps')).toBeNull();
    expect(queryByLabelText('Directions in Waze')).toBeNull();
  });

  it('resolved venue row (address + coords + pin): Apple + Google render, no Waze', async () => {
    h.locRow = { name: 'East Coast Sports & Fitness', address: '201 Veterans Rd, Yorktown Heights, NY 10598', lat: 41.2764, lon: -73.7856, google_maps_url: 'https://maps.app.goo.gl/x' };
    const { queryByLabelText } = render(
      <EventLocationTab event={{ id: 'e-1', event_type: 'game', location: 'East Coast Sports & Fitness', location_id: 'loc-1' }} />
    );
    await waitFor(() => expect(queryByLabelText('Directions in Apple Maps')).not.toBeNull());
    expect(queryByLabelText('Directions in Google Maps')).not.toBeNull();
    expect(queryByLabelText('Directions in Waze')).toBeNull();
  });

  it('street address without a venue row (event.location_address) keeps Apple + Google, no Waze', () => {
    h.locRow = null;
    const { queryByLabelText } = render(
      <EventLocationTab event={{ id: 'e-1', event_type: 'game', location: 'Some Gym', location_address: '1 Main St, Armonk, NY 10504', location_id: null }} />
    );
    expect(queryByLabelText('Directions in Apple Maps')).not.toBeNull();
    expect(queryByLabelText('Directions in Google Maps')).not.toBeNull();
    expect(queryByLabelText('Directions in Waze')).toBeNull();
  });
});
