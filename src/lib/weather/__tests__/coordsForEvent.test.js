import { describe, expect, it } from 'vitest';
import { coordsForEvent } from '../coordsForEvent';
import { WEATHER_DEFAULT_COORDS } from '../../constants';

describe('coordsForEvent — weather anchor resolution (AP#7 seam)', () => {
  const locations = { loc1: { lat: 42.1, lon: -71.2, name: 'Waltham', address: '1 St, Waltham, MA' } };

  it('returns the org default when there are no events', () => {
    expect(coordsForEvent(null, null)).toEqual(WEATHER_DEFAULT_COORDS);
    expect(coordsForEvent([], locations)).toEqual(WEATHER_DEFAULT_COORDS);
  });

  it('returns the first event-location coords when present', () => {
    const events = [{ location_id: 'loc1', start_at: '2026-06-20T14:00:00Z' }];
    expect(coordsForEvent(events, locations)).toEqual([42.1, -71.2]);
  });

  it('falls back to the org default when the event location has no coords', () => {
    const events = [{ location_id: 'missing', start_at: '2026-06-20T14:00:00Z' }];
    expect(coordsForEvent(events, locations)).toEqual(WEATHER_DEFAULT_COORDS);
  });

  it('honors an explicit orgDefault override', () => {
    expect(coordsForEvent(null, null, [1, 2])).toEqual([1, 2]);
  });
});
