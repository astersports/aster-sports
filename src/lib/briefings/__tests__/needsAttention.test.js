import { describe, expect, it } from 'vitest';
import { buildDigestDueRow, weeklyDigestDueWindow } from '../needsAttention';

describe('weeklyDigestDueWindow — Wave 4.1b §5 (Sat AM → Mon AM ET)', () => {
  // Sample timestamps in UTC; the helper applies a -4h offset internally.
  it('Saturday 6 AM ET → true', () => {
    const sat10AM_UTC = new Date('2026-05-09T10:00:00Z');
    expect(weeklyDigestDueWindow(sat10AM_UTC)).toBe(true);
  });

  it('Friday 11 PM ET → false (out of window)', () => {
    const fri = new Date('2026-05-09T03:00:00Z');
    expect(weeklyDigestDueWindow(fri)).toBe(false);
  });

  it('Sunday afternoon → true', () => {
    const sun = new Date('2026-05-10T18:00:00Z');
    expect(weeklyDigestDueWindow(sun)).toBe(true);
  });

  it('Monday 8 AM ET → false (after 7 AM cutoff)', () => {
    const mon12_UTC = new Date('2026-05-11T12:00:00Z');
    expect(weeklyDigestDueWindow(mon12_UTC)).toBe(false);
  });
});

describe('buildDigestDueRow', () => {
  it('shape matches ActionQueueRow expectations', () => {
    const row = buildDigestDueRow('org-uuid', '2026-05-04T00:00:00.000Z');
    expect(row.synthetic_id).toBe('digest_due_2026-05-04');
    expect(row.kind).toBe('weekly_digest');
    expect(row.anchor_kind).toBe('org');
    expect(row.anchor_id).toBe('org-uuid');
  });
});

// Wave 4.8 6c (PR #120): tests for the 3 deleted builders
// (buildPrelimRows, buildTournRecapRows, buildGameRecapRows) and the
// schedule_change_skipped builder were removed when those surfaces
// moved to the briefing_active_queue RPC. The companion file
// wave_4_1d_2_synth.test.js was deleted in the same PR.
