import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { getDirectionUrls } from '../mapsUrls';

// SD-14 gates (SCHEDULE_L99_BUILD_SPEC §8 PR-D'): both providers
// build from coords AND from address fallback; google_maps_url
// (Frank-verified pin, §15 priority 1) wins the Google slot; and the
// venue path is JOIN-resolved — no ilike name-matching anywhere in it.
// Waze removed 2026-06-13 (operator-directed) — no Waze slot anymore.

describe('getDirectionUrls — Apple + Google', () => {
  it('builds Apple/Google from lat/lon (no Waze)', () => {
    const u = getDirectionUrls(null, 41.03, -73.76, null);
    expect(u.google).toContain('query=41.03,-73.76');
    expect(u.apple).toBe('https://maps.apple.com/?daddr=41.03,-73.76');
    expect(u.waze).toBeUndefined();
  });

  it('builds both from an address when no coords', () => {
    const u = getDirectionUrls('30 Manhattanville Rd, Purchase NY', null, null, null);
    expect(u.google).toContain(encodeURIComponent('30 Manhattanville Rd, Purchase NY'));
    expect(u.apple).toContain('daddr=30%20Manhattanville');
    expect(u.waze).toBeUndefined();
  });

  it('google_maps_url (verified pin) wins the Google slot; coords still feed Apple', () => {
    const u = getDirectionUrls('addr', 41, -73, 'https://maps.app.goo.gl/abc123');
    expect(u.google).toBe('https://maps.app.goo.gl/abc123');
    expect(u.apple).toContain('41,-73');
    expect(u.waze).toBeUndefined();
  });

  it('null when nothing is navigable', () => {
    expect(getDirectionUrls(null, null, null, null)).toBeNull();
    expect(getDirectionUrls('   ', null, null, null)).toBeNull();
  });
});

describe('SD-14 static gate — venue via JOIN, no ilike in the maps path', () => {
  it('the ilike lookup hook is deleted', () => {
    expect(existsSync('src/hooks/useMapsUrl.js')).toBe(false);
  });

  it('no .ilike( in the maps-path surfaces', () => {
    for (const f of ['src/components/event/EventLocationTab.jsx', 'src/components/schedule/EventCard.jsx', 'src/lib/mapsUrls.js']) {
      expect(readFileSync(f, 'utf8').includes('.ilike('), `${f} must resolve venues via location_id, not name matching`).toBe(false);
    }
  });
});
