// Tier 3 v1 PR 2 — alert evaluator orchestrator tests.
// Sliced from evaluator.test.js to stay under 150-line cap.
// Covers the orchestrator path: disabled-config skip, per-evaluator
// error containment, empty/invalid input handling.

import { describe, expect, it } from 'vitest';
import { evaluateAlerts } from '../evaluator';
import { makeConfig, makeExec } from './_fixtures';

describe('orchestrator behavior', () => {
  it('skips disabled configs', async () => {
    const cfg = makeConfig('payment_overdue', null, {}, false);
    const qx = makeExec({ getOverdueFamilyBalances: () => Promise.resolve([{ family_id: 'f1', outstanding_amount: 99999, oldest_outstanding_age_days: 90 }]) });
    expect(await evaluateAlerts([cfg], qx)).toEqual([]);
  });
  it('continues evaluation when one evaluator throws', async () => {
    const cfg1 = makeConfig('payment_overdue', null);
    const cfg2 = makeConfig('data_integrity_event_location_missing', null);
    const qx = makeExec({
      getOverdueFamilyBalances: () => Promise.reject(new Error('boom')),
      getEventsWithBrokenLocationData: () => Promise.resolve([{ id: 'e1', teams: { name: 'A' } }]),
    });
    const out = await evaluateAlerts([cfg1, cfg2], qx);
    expect(out).toHaveLength(1);
    expect(out[0].alert_type_key).toBe('data_integrity_event_location_missing');
  });
  it('returns empty for empty/invalid inputs', async () => {
    expect(await evaluateAlerts([], makeExec())).toEqual([]);
    expect(await evaluateAlerts(null, makeExec())).toEqual([]);
    expect(await evaluateAlerts([makeConfig('x')], null)).toEqual([]);
  });
  it('respects evaluation_order sorting', async () => {
    const cfg1 = { ...makeConfig('payment_overdue', null), evaluation_order: 50 };
    const cfg2 = { ...makeConfig('data_integrity_event_location_missing', null), evaluation_order: 10 };
    const qx = makeExec({
      getOverdueFamilyBalances: () => Promise.resolve([{ family_id: 'f1', outstanding_amount: 5000, oldest_outstanding_age_days: 40 }]),
      getEventsWithBrokenLocationData: () => Promise.resolve([{ id: 'e1', teams: { name: 'A' } }]),
    });
    const out = await evaluateAlerts([cfg1, cfg2], qx);
    expect(out[0].alert_type_key).toBe('data_integrity_event_location_missing');
    expect(out[1].alert_type_key).toBe('payment_overdue');
  });
});
