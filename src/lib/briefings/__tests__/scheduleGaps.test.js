import { describe, expect, it } from 'vitest';
import { describeScheduleGaps } from '../scheduleGaps';

describe('describeScheduleGaps', () => {
  it('returns empty string for no events', () => {
    expect(describeScheduleGaps([])).toBe('');
    expect(describeScheduleGaps(null)).toBe('');
  });

  it('emits a one-line summary for a single event', () => {
    const out = describeScheduleGaps([{ start_at: '2026-05-16T15:00:00-04:00', opponent: 'CT Northstars' }]);
    expect(out).toMatch(/Saturday/);
    expect(out).toMatch(/3:00 PM vs CT Northstars/);
  });

  it('describes a 2-hour gap between same-day events', () => {
    const out = describeScheduleGaps([
      { start_at: '2026-05-16T15:00:00-04:00', opponent: 'A' },
      { start_at: '2026-05-16T18:00:00-04:00', opponent: 'B' },
    ]);
    expect(out).toContain('3:00 PM vs A');
    expect(out).toContain('6:00 PM vs B');
    expect(out).toContain('[2-hour gap]');
  });

  it('groups events by ET calendar day, not UTC', () => {
    // 22:00 ET = 02:00 UTC next day; ET grouping keeps both on Sat
    const out = describeScheduleGaps([
      { start_at: '2026-05-16T20:00:00-04:00', opponent: 'A' },
      { start_at: '2026-05-16T22:00:00-04:00', opponent: 'B' },
    ]);
    const lines = out.split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/Saturday/);
  });

  it('omits gaps under the minGapMinutes threshold', () => {
    const out = describeScheduleGaps([
      { start_at: '2026-05-16T11:00:00-04:00', opponent: 'A', end_at: '2026-05-16T12:00:00-04:00' },
      { start_at: '2026-05-16T12:15:00-04:00', opponent: 'B' },
    ]);
    expect(out).not.toContain('gap');
  });

  it('uses end_at when available instead of default game length', () => {
    const out = describeScheduleGaps([
      { start_at: '2026-05-16T10:00:00-04:00', opponent: 'A', end_at: '2026-05-16T11:30:00-04:00' },
      { start_at: '2026-05-16T13:00:00-04:00', opponent: 'B' },
    ]);
    expect(out).toContain('1h 30m gap');
  });

  it('handles events without opponent', () => {
    const out = describeScheduleGaps([{ start_at: '2026-05-16T10:00:00-04:00' }]);
    expect(out).toMatch(/10:00 AM$/);
  });

  it('multi-day produces multiple lines', () => {
    const out = describeScheduleGaps([
      { start_at: '2026-05-16T15:00:00-04:00', opponent: 'A' },
      { start_at: '2026-05-17T10:00:00-04:00', opponent: 'B' },
    ]);
    expect(out.split('\n')).toHaveLength(2);
    expect(out).toMatch(/Saturday/);
    expect(out).toMatch(/Sunday/);
  });
});
