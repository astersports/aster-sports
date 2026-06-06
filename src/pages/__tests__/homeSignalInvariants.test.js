// Home signal invariants — hardening batch item 5 (AP#63 single-source /
// AP#43 cross-role / AP#7 no-hardcoded-coords). Static-source guards in the
// established home-audit style (same shape as homePageInvariantAudit).

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'node:url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (rel) => readFileSync(join(SRC, rel), 'utf8');

describe('home signal invariants', () => {
  it('owing-money has ONE source — useFamiliesOwingCount feeds both the admin "Out" KPI and the Payments item (AP#63)', () => {
    expect(read('components/home/AdminProgramHealth.jsx')).toMatch(/useFamiliesOwingCount/);
    expect(read('hooks/useAdminNeedsYou.js')).toMatch(/useFamiliesOwingCount/);
  });

  it('admin Needs-you never emits an inline RSVP item — RSVP is parent-only (AP#43)', () => {
    expect(read('hooks/useAdminNeedsYou.js')).not.toMatch(/domain:\s*['"]rsvp['"]/);
  });

  it('all three homes pull weather from the shared WEATHER_DEFAULT_COORDS — no hardcoded lat/lon (AP#7)', () => {
    for (const f of ['pages/ParentHomePage.jsx', 'pages/CoachHomePage.jsx', 'pages/AdminHomePage.jsx']) {
      const s = read(f);
      expect(s, `${f} should use WEATHER_DEFAULT_COORDS`).toMatch(/WEATHER_DEFAULT_COORDS/);
      expect(s, `${f} should not hardcode 41.x/40.x coords`).not.toMatch(/useWeather\(\s*4[01]\.\d/);
    }
  });

  it('the RSVP card shows the opponent only when present (no "vs" stub on practices)', () => {
    expect(read('components/home/ActionRow.jsx')).toMatch(/item\.opponent\s*\?/);
  });
});
