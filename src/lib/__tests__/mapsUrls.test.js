import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { getDirectionUrls } from '../mapsUrls';

// SD-14 gates (SCHEDULE_L99_BUILD_SPEC §8 PR-D'): all three providers
// build from coords AND from address fallback; google_maps_url
// (Frank-verified pin, §15 priority 1) wins the Google slot; and the
// venue path is JOIN-resolved — no ilike name-matching anywhere in it.

describe('getDirectionUrls — three providers', () => {
  it('builds Apple/Google/Waze from lat/lon', () => {
    const u = getDirectionUrls(null, 41.03, -73.76, null);
    expect(u.google).toContain('query=41.03,-73.76');
    expect(u.apple).toBe('https://maps.apple.com/?daddr=41.03,-73.76');
    expect(u.waze).toBe('https://www.waze.com/ul?ll=41.03,-73.76&navigate=yes');
  });

  it('builds all three from an address when no coords', () => {
    const u = getDirectionUrls('30 Manhattanville Rd, Purchase NY', null, null, null);
    expect(u.google).toContain(encodeURIComponent('30 Manhattanville Rd, Purchase NY'));
    expect(u.apple).toContain('daddr=30%20Manhattanville');
    expect(u.waze).toContain('navigate=yes');
  });

  it('google_maps_url (verified pin) wins the Google slot; coords still feed Apple/Waze', () => {
    const u = getDirectionUrls('addr', 41, -73, 'https://maps.app.goo.gl/abc123');
    expect(u.google).toBe('https://maps.app.goo.gl/abc123');
    expect(u.apple).toContain('41,-73');
    expect(u.waze).toContain('41,-73');
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
