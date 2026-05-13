// Wave 4.3-A — digest-pipeline helpers (period, draft row, idempotency, expiry).
// Split from briefingCronHelpers.test.js for the 150-line cap.

import { describe, expect, it } from 'vitest';
import {
  buildWeeklyDigestDraftRow, computeExpiryForKind,
  weeklyDigestIdempotencyKey, weeklyDigestPeriod,
} from '../briefingCronHelpers';

const ORG_ID = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';
const TRIGGER_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
// 2026-05-10 is a Sunday. 12:30 UTC == 08:30 EDT (NY in May).
const SUNDAY_8AM_LOCAL = new Date('2026-05-10T12:30:00Z');

describe('weeklyDigestPeriod', () => {
  it('returns Sunday → following Saturday in YYYY-MM-DD', () => {
    expect(weeklyDigestPeriod(SUNDAY_8AM_LOCAL)).toEqual({
      period_start: '2026-05-10', period_end: '2026-05-16',
    });
  });
});

describe('buildWeeklyDigestDraftRow', () => {
  it('builds correct insert shape with triggerId: created_by_trigger set, delivery_method=queued', () => {
    const row = buildWeeklyDigestDraftRow({
      orgId: ORG_ID,
      period: { period_start: '2026-05-10', period_end: '2026-05-16' },
      now: SUNDAY_8AM_LOCAL,
      triggerId: TRIGGER_ID,
    });
    expect(row).toEqual({
      org_id: ORG_ID, created_by_trigger: TRIGGER_ID,
      kind: 'weekly_digest', anchor_kind: 'org', anchor_id: ORG_ID,
      period_start: '2026-05-10', period_end: '2026-05-16',
      status: 'draft', subject: null,
      body_html: '', body_plain: '', content_sections: [],
      audience_type: 'org_all', audience_filter: null,
      delivery_method: 'queued',
      last_edited_at: SUNDAY_8AM_LOCAL.toISOString(), last_edited_by: null,
      // Wave 4.8 6c — weekly_digest expires 7 days post-edit.
      expires_at: new Date(SUNDAY_8AM_LOCAL.getTime() + 7 * 86400000).toISOString(),
    });
  });
  it('defaults created_by_trigger to null when triggerId not provided', () => {
    const row = buildWeeklyDigestDraftRow({
      orgId: ORG_ID,
      period: { period_start: '2026-05-10', period_end: '2026-05-16' },
      now: SUNDAY_8AM_LOCAL,
    });
    expect(row.created_by_trigger).toBeNull();
    expect(row.delivery_method).toBe('queued');
  });
});

describe('weeklyDigestIdempotencyKey', () => {
  it('returns (org_id, kind, period_start) tuple for the existing-row check', () => {
    expect(weeklyDigestIdempotencyKey(ORG_ID, '2026-05-10')).toEqual({
      org_id: ORG_ID, kind: 'weekly_digest', period_start: '2026-05-10',
    });
  });
});

describe('computeExpiryForKind (Wave 4.8 6c)', () => {
  const NOW = new Date('2026-05-12T16:00:00Z');
  const ANCHOR = new Date('2026-05-15T20:00:00Z'); // 3 days in future

  it('a. game_recap: anchor + 14d', () => {
    expect(computeExpiryForKind('game_recap', ANCHOR, NOW).toISOString())
      .toBe(new Date(ANCHOR.getTime() + 14 * 86400000).toISOString());
  });
  it('a2. game_recap fallback to (now + 14d) when anchor null', () => {
    expect(computeExpiryForKind('game_recap', null, NOW).toISOString())
      .toBe(new Date(NOW.getTime() + 14 * 86400000).toISOString());
  });
  it('b. tournament_prelim returns anchor verbatim (no extra interval)', () => {
    expect(computeExpiryForKind('tournament_prelim', ANCHOR, NOW)).toBe(ANCHOR);
  });
  it('c. tournament_prelim falls back to (now + 14d) when anchor null', () => {
    expect(computeExpiryForKind('tournament_prelim', null, NOW).toISOString())
      .toBe(new Date(NOW.getTime() + 14 * 86400000).toISOString());
  });
  it('d. schedule_change ignores anchor entirely (always now + 7d)', () => {
    expect(computeExpiryForKind('schedule_change', ANCHOR, NOW).toISOString())
      .toBe(new Date(NOW.getTime() + 7 * 86400000).toISOString());
  });
  it('e. rsvp_nudge falls back to (now + 3d) when anchor null', () => {
    expect(computeExpiryForKind('rsvp_nudge', null, NOW).toISOString())
      .toBe(new Date(NOW.getTime() + 3 * 86400000).toISOString());
  });
  it('f. unknown kind falls through to default (now + 14d)', () => {
    expect(computeExpiryForKind('totally_unknown', null, NOW).toISOString())
      .toBe(new Date(NOW.getTime() + 14 * 86400000).toISOString());
  });
});
