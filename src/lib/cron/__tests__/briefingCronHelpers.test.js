// Wave 4.3-A — auto-draft engine helper unit tests.

import { describe, expect, it } from 'vitest';
import {
  addDaysIso, buildWeeklyDigestDraftRow, isWeeklySundayWindow,
  localDateIso, ORG_TIMEZONE, partsInTimeZone,
  weeklyDigestIdempotencyKey, weeklyDigestPeriod,
} from '../briefingCronHelpers';

const ORG_ID = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';
// 2026-05-10 is a Sunday. 12:30 UTC == 08:30 EDT (NY in May).
const SUNDAY_8AM_LOCAL = new Date('2026-05-10T12:30:00Z');
// Same day, 11:00 UTC == 07:00 EDT.
const SUNDAY_7AM_LOCAL = new Date('2026-05-10T11:00:00Z');
// Same day, 13:30 UTC == 09:30 EDT.
const SUNDAY_9_30AM_LOCAL = new Date('2026-05-10T13:30:00Z');
// Saturday May 9, 12:30 UTC == 08:30 EDT.
const SATURDAY_8AM_LOCAL = new Date('2026-05-09T12:30:00Z');

describe('partsInTimeZone', () => {
  it('extracts NY-tz weekday + hour for a known UTC moment', () => {
    expect(partsInTimeZone(SUNDAY_8AM_LOCAL).weekday).toBe('Sunday');
    expect(partsInTimeZone(SUNDAY_8AM_LOCAL).hour).toBe(8);
    expect(partsInTimeZone(SUNDAY_8AM_LOCAL).minute).toBe(30);
  });
  it('respects org timezone override', () => {
    // Sunday 08:30 EDT == Sunday 04:30 PDT (LA)
    const la = partsInTimeZone(SUNDAY_8AM_LOCAL, 'America/Los_Angeles');
    expect(la.weekday).toBe('Sunday');
    expect(la.hour).toBe(5); // EDT-PDT is 3h, but EDT 08:30 = PDT 05:30
  });
});

describe('localDateIso', () => {
  it('returns YYYY-MM-DD in the org timezone', () => {
    expect(localDateIso(SUNDAY_8AM_LOCAL)).toBe('2026-05-10');
  });
  it('boundary: 2026-05-10 03:00 UTC is still 2026-05-09 in NY', () => {
    expect(localDateIso(new Date('2026-05-10T03:00:00Z'))).toBe('2026-05-09');
  });
});

describe('addDaysIso', () => {
  it('adds days correctly across month boundaries', () => {
    expect(addDaysIso('2026-05-10', 6)).toBe('2026-05-16');
    expect(addDaysIso('2026-05-30', 5)).toBe('2026-06-04');
  });
});

describe('isWeeklySundayWindow', () => {
  it('Saturday 08:30 → false (wrong day)', () => {
    expect(isWeeklySundayWindow(SATURDAY_8AM_LOCAL)).toBe(false);
  });
  it('Sunday 07:00 → false (before window)', () => {
    expect(isWeeklySundayWindow(SUNDAY_7AM_LOCAL)).toBe(false);
  });
  it('Sunday 09:30 → false (after window)', () => {
    expect(isWeeklySundayWindow(SUNDAY_9_30AM_LOCAL)).toBe(false);
  });
  it('Sunday 08:30 → true (in window)', () => {
    expect(isWeeklySundayWindow(SUNDAY_8AM_LOCAL)).toBe(true);
  });
  it('Sunday 08:00 → true (window start)', () => {
    expect(isWeeklySundayWindow(new Date('2026-05-10T12:00:00Z'))).toBe(true);
  });
  it('Sunday 08:59 → true (window end)', () => {
    expect(isWeeklySundayWindow(new Date('2026-05-10T12:59:00Z'))).toBe(true);
  });
});

describe('weeklyDigestPeriod', () => {
  it('returns Sunday → following Saturday in YYYY-MM-DD', () => {
    expect(weeklyDigestPeriod(SUNDAY_8AM_LOCAL)).toEqual({
      period_start: '2026-05-10', period_end: '2026-05-16',
    });
  });
});

describe('buildWeeklyDigestDraftRow', () => {
  it('builds correct insert shape: subject NULL, body placeholders empty, content_sections [], anchor_kind=org', () => {
    const row = buildWeeklyDigestDraftRow({
      orgId: ORG_ID,
      period: { period_start: '2026-05-10', period_end: '2026-05-16' },
      now: SUNDAY_8AM_LOCAL,
    });
    expect(row).toEqual({
      org_id: ORG_ID, kind: 'weekly_digest', anchor_kind: 'org', anchor_id: ORG_ID,
      period_start: '2026-05-10', period_end: '2026-05-16',
      status: 'draft', subject: null,
      body_html: '', body_plain: '', content_sections: [],
      audience_type: 'org_all', audience_filter: null,
      last_edited_at: SUNDAY_8AM_LOCAL.toISOString(), last_edited_by: null,
    });
  });
});

describe('weeklyDigestIdempotencyKey', () => {
  it('returns (org_id, kind, period_start) tuple for the existing-row check', () => {
    expect(weeklyDigestIdempotencyKey(ORG_ID, '2026-05-10')).toEqual({
      org_id: ORG_ID, kind: 'weekly_digest', period_start: '2026-05-10',
    });
  });
});

describe('ORG_TIMEZONE constant', () => {
  it('is the NY timezone identifier', () => {
    expect(ORG_TIMEZONE).toBe('America/New_York');
  });
});
