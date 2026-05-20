// Tier 3 v1 PR 2 — alert evaluator unit tests.
// 8 alert configurations × threshold edge cases. Mock queryExecutor
// supplies deterministic data per test; evaluator is pure logic
// from data → firing alert (or null).

import { describe, expect, it } from 'vitest';
import { evaluateAlerts, evaluatorKey, EVALUATORS } from '../evaluator';
import { makeConfig, makeExec, TEAM_11U, TEAM_8U } from './_fixtures';

describe('evaluatorKey', () => {
  it('formats key:instance for primitives', () => {
    expect(evaluatorKey({ alert_type_key: 'rsvp_shortfall', instance_key: 'friday_noon' })).toBe('rsvp_shortfall:friday_noon');
  });
  it('formats key only for specifics', () => {
    expect(evaluatorKey({ alert_type_key: 'payment_overdue', instance_key: null })).toBe('payment_overdue');
  });
});

describe('EVALUATORS map covers all v1 configs', () => {
  it('has 6 catalog entries + 3 rsvp primitives = 9 keys', () => {
    // L99 v6 §5.1 B2: opponent_unassigned added 2026-05-20.
    expect(Object.keys(EVALUATORS).sort()).toEqual([
      'briefing_overdue:tournament_prelim', 'briefing_overdue:weekly_digest',
      'data_integrity_event_location_missing', 'location_unassigned',
      'opponent_unassigned', 'payment_overdue',
      'rsvp_shortfall:friday_noon', 'rsvp_shortfall:league_24h', 'rsvp_shortfall:saturday_6am',
    ]);
  });
});

describe('rsvp_shortfall:friday_noon — non-responder threshold', () => {
  const cfg = makeConfig('rsvp_shortfall', 'friday_noon', { severity: 'warning', non_responder_threshold: 5 });
  it('FIRES when non_responder count == threshold', async () => {
    const qx = makeExec({ getRsvpShortfallEvents: () => Promise.resolve([{ event_id: 'e1', team: TEAM_11U, expected_roster: 10, responded: 5, yes_count: 4 }]) });
    const out = await evaluateAlerts([cfg], qx);
    expect(out).toHaveLength(1);
    expect(out[0].severity).toBe('warning');
  });
  it('FIRES when non_responder > threshold', async () => {
    const qx = makeExec({ getRsvpShortfallEvents: () => Promise.resolve([{ event_id: 'e1', team: TEAM_11U, expected_roster: 12, responded: 6, yes_count: 4 }]) });
    const out = await evaluateAlerts([cfg], qx);
    expect(out).toHaveLength(1);
  });
  it('does NOT fire when non_responder < threshold', async () => {
    const qx = makeExec({ getRsvpShortfallEvents: () => Promise.resolve([{ event_id: 'e1', team: TEAM_11U, expected_roster: 10, responded: 6, yes_count: 5 }]) });
    expect(await evaluateAlerts([cfg], qx)).toEqual([]);
  });
});

describe('rsvp_shortfall:saturday_6am — yes_count threshold (Q1 derivation)', () => {
  const cfg = makeConfig('rsvp_shortfall', 'saturday_6am', { severity: 'critical' });
  it('FIRES when yes_count < derived threshold for 11U (5)', async () => {
    const qx = makeExec({ getRsvpShortfallEvents: () => Promise.resolve([{ event_id: 'e1', team: TEAM_11U, expected_roster: 10, responded: 8, yes_count: 4 }]) });
    const out = await evaluateAlerts([cfg], qx);
    expect(out[0].severity).toBe('critical');
  });
  it('FIRES when yes_count < derived threshold for 8U (4)', async () => {
    const qx = makeExec({ getRsvpShortfallEvents: () => Promise.resolve([{ event_id: 'e1', team: TEAM_8U, expected_roster: 8, responded: 6, yes_count: 3 }]) });
    expect(await evaluateAlerts([cfg], qx)).toHaveLength(1);
  });
  it('does NOT fire when yes_count == derived threshold (boundary)', async () => {
    const qx = makeExec({ getRsvpShortfallEvents: () => Promise.resolve([{ event_id: 'e1', team: TEAM_8U, expected_roster: 8, responded: 6, yes_count: 4 }]) });
    expect(await evaluateAlerts([cfg], qx)).toEqual([]);
  });
});

describe('briefing_overdue:weekly_digest', () => {
  const cfg = makeConfig('briefing_overdue', 'weekly_digest', { severity: 'warning', briefing_kind: 'weekly_digest', week_start_local: 'Sunday' });
  it('FIRES when no briefing sent this week', async () => {
    const qx = makeExec({ getMostRecentBriefingByKind: () => Promise.resolve(null) });
    expect(await evaluateAlerts([cfg], qx)).toHaveLength(1);
  });
  it('does NOT fire when a briefing was queued or sent this week (Q3 lock)', async () => {
    const qx = makeExec({ getMostRecentBriefingByKind: () => Promise.resolve({ id: 'b1', status: 'queued', created_at: new Date().toISOString() }) });
    expect(await evaluateAlerts([cfg], qx)).toEqual([]);
  });
});

describe('briefing_overdue:tournament_prelim', () => {
  const cfg = makeConfig('briefing_overdue', 'tournament_prelim', { severity: 'warning', briefing_kind: 'tournament_prelim' });
  it('FIRES when tournaments exist without prelim', async () => {
    const qx = makeExec({ getTournamentsWithoutPrelim: () => Promise.resolve([{ id: 't1', name: 'Test', start_date: '2026-05-20' }]) });
    expect(await evaluateAlerts([cfg], qx)).toHaveLength(1);
  });
  it('does NOT fire when all tournaments have prelim sent', async () => {
    const qx = makeExec({ getTournamentsWithoutPrelim: () => Promise.resolve([]) });
    expect(await evaluateAlerts([cfg], qx)).toEqual([]);
  });
});

describe('location_unassigned — severity escalation', () => {
  const cfg = makeConfig('location_unassigned', null, { severity_warning_window_hours: 48, severity_critical_window_hours: 24 });
  it('FIRES warning when event 48h-24h out', async () => {
    const start = new Date(Date.now() + 36 * 3600000).toISOString();
    const qx = makeExec({ getEventsWithoutLocation: () => Promise.resolve([{ id: 'e1', start_at: start, teams: { name: 'A' } }]) });
    const out = await evaluateAlerts([cfg], qx);
    expect(out[0].severity).toBe('warning');
  });
  it('FIRES critical when event <24h out', async () => {
    const start = new Date(Date.now() + 12 * 3600000).toISOString();
    const qx = makeExec({ getEventsWithoutLocation: () => Promise.resolve([{ id: 'e1', start_at: start, teams: { name: 'A' } }]) });
    expect((await evaluateAlerts([cfg], qx))[0].severity).toBe('critical');
  });
  it('does NOT fire when no events without location', async () => {
    expect(await evaluateAlerts([cfg], makeExec())).toEqual([]);
  });
});

describe('payment_overdue — rolled-up alert', () => {
  const cfg = makeConfig('payment_overdue', null, { severity: 'warning', age_threshold_days: 30, minimum_amount_dollars: 1 });
  it('FIRES with rolled-up totals when overdue families exist', async () => {
    const qx = makeExec({ getOverdueFamilyBalances: () => Promise.resolve([
      { family_id: 'f1', outstanding_amount: 12000, oldest_outstanding_age_days: 45 },
      { family_id: 'f2', outstanding_amount: 25000, oldest_outstanding_age_days: 60 },
    ]) });
    const out = await evaluateAlerts([cfg], qx);
    expect(out[0].data.family_count).toBe(2);
    expect(out[0].data.total_outstanding_cents).toBe(37000);
  });
  it('does NOT fire when no overdue families', async () => {
    expect(await evaluateAlerts([cfg], makeExec())).toEqual([]);
  });
});

describe('data_integrity_event_location_missing (Q7 — 2 conditions only)', () => {
  const cfg = makeConfig('data_integrity_event_location_missing', null, { severity: 'info' });
  it('FIRES Info severity when broken-location events exist', async () => {
    const qx = makeExec({ getEventsWithBrokenLocationData: () => Promise.resolve([{ id: 'e1', location_id: null, location: null, teams: { name: 'A' } }]) });
    const out = await evaluateAlerts([cfg], qx);
    expect(out[0].severity).toBe('info');
    expect(out[0].data.count).toBe(1);
  });
  it('does NOT fire when all events have valid location data', async () => {
    expect(await evaluateAlerts([cfg], makeExec())).toEqual([]);
  });
});
