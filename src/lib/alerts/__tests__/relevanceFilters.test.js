// Tier 3 v1 PR 5 — relevance filter tests.
//
// Covers: admin-only types dropped; event scope filter by team_id;
// severity recompute on location_unassigned; empty kids → empty;
// event-less non-admin-only alerts pass through; coach variant.

import { describe, expect, it } from 'vitest';
import { ADMIN_ONLY_TYPES, filterAlertsForCoach, filterAlertsForParent } from '../relevanceFilters';

const T_NEAR = new Date(Date.now() + 6 * 3600000).toISOString();    // 6h out (critical)
const T_FAR = new Date(Date.now() + 72 * 3600000).toISOString();   // 72h out (warning)

const kids = [
  { playerId: 'p1', firstName: 'Aria', teamId: 'team-a' },
  { playerId: 'p2', firstName: 'Beck', teamIds: ['team-b', 'team-c'] },
];

function rsvpAlert(events) {
  return { config_id: 'cfg1', alert_type_key: 'rsvp_shortfall', instance_key: 'friday_noon', severity: 'warning',
    data: { events, affected_count: events.length } };
}
function locationAlert(events) {
  return { config_id: 'cfg2', alert_type_key: 'location_unassigned', instance_key: null, severity: 'warning',
    data: { events, critical_count: 0 } };
}
function paymentAlert() {
  return { config_id: 'cfg3', alert_type_key: 'payment_overdue', instance_key: null, severity: 'warning',
    data: { total_outstanding_cents: 50000, family_count: 3 } };
}
function briefingAlert() {
  return { config_id: 'cfg4', alert_type_key: 'briefing_overdue', instance_key: 'weekly_digest', severity: 'warning',
    data: { briefing_kind: 'weekly_digest', expected_send_by: 'Thursday 09:00' } };
}

describe('filterAlertsForParent', () => {
  it('returns [] when kids array is empty', () => {
    expect(filterAlertsForParent([rsvpAlert([{ team_id: 'team-a', start_at: T_FAR }])], [])).toEqual([]);
  });

  it('drops payment_overdue (admin-only)', () => {
    const out = filterAlertsForParent([paymentAlert()], kids);
    expect(out).toEqual([]);
  });

  it('drops briefing_overdue (admin-only)', () => {
    const out = filterAlertsForParent([briefingAlert()], kids);
    expect(out).toEqual([]);
  });

  it('filters event-bearing alerts to events whose team_id matches kids team_ids', () => {
    const alert = rsvpAlert([
      { event_id: 'e1', team_id: 'team-a', start_at: T_FAR },
      { event_id: 'e2', team_id: 'team-z', start_at: T_FAR },
      { event_id: 'e3', team_id: 'team-b', start_at: T_FAR },
    ]);
    const out = filterAlertsForParent([alert], kids);
    expect(out).toHaveLength(1);
    expect(out[0].data.events.map((e) => e.event_id)).toEqual(['e1', 'e3']);
    expect(out[0].data.affected_count).toBe(2);
  });

  it('drops event-bearing alert entirely when no events match', () => {
    const alert = rsvpAlert([{ event_id: 'e1', team_id: 'team-other', start_at: T_FAR }]);
    expect(filterAlertsForParent([alert], kids)).toEqual([]);
  });

  it('recomputes severity for location_unassigned: critical when filtered event is <24h', () => {
    const alert = locationAlert([
      { id: 'ev1', team_id: 'team-a', start_at: T_NEAR },
      { id: 'ev2', team_id: 'team-z', start_at: T_NEAR },
    ]);
    const out = filterAlertsForParent([alert], kids);
    expect(out[0].severity).toBe('critical');
    expect(out[0].data.critical_count).toBe(1);
  });

  it('recomputes severity for location_unassigned: warning when filtered event is >24h', () => {
    const alert = locationAlert([
      { id: 'ev1', team_id: 'team-a', start_at: T_FAR },
      { id: 'ev2', team_id: 'team-z', start_at: T_NEAR },
    ]);
    const out = filterAlertsForParent([alert], kids);
    expect(out[0].severity).toBe('warning');
    expect(out[0].data.critical_count).toBe(0);
  });
});

describe('filterAlertsForCoach', () => {
  it('filters by coach teamIds', () => {
    const alert = rsvpAlert([
      { event_id: 'e1', team_id: 'team-a', start_at: T_FAR },
      { event_id: 'e2', team_id: 'team-b', start_at: T_FAR },
    ]);
    const out = filterAlertsForCoach([alert], ['team-b']);
    expect(out).toHaveLength(1);
    expect(out[0].data.events.map((e) => e.event_id)).toEqual(['e2']);
  });

  it('returns [] when teamIds empty', () => {
    expect(filterAlertsForCoach([rsvpAlert([{ team_id: 'team-a', start_at: T_FAR }])], [])).toEqual([]);
  });

  it('also drops admin-only types', () => {
    expect(filterAlertsForCoach([paymentAlert(), briefingAlert()], ['team-a'])).toEqual([]);
  });
});

describe('ADMIN_ONLY_TYPES', () => {
  it('contains briefing_overdue and payment_overdue (v1 catalog)', () => {
    expect(ADMIN_ONLY_TYPES.has('briefing_overdue')).toBe(true);
    expect(ADMIN_ONLY_TYPES.has('payment_overdue')).toBe(true);
    expect(ADMIN_ONLY_TYPES.has('rsvp_shortfall')).toBe(false);
    expect(ADMIN_ONLY_TYPES.has('location_unassigned')).toBe(false);
  });
});
