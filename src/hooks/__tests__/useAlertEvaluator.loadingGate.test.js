// @vitest-environment jsdom
//
// useAlertEvaluator — initial-render loading gate test.
//
// Locks the regression Frank smoke-surfaced on 2026-05-18 (PR #241 origin
// case for CLAUDE.md anti-pattern #43): the original implementation used
// configs = useState([]) which made the initial state and the
// "fetched + empty" state indistinguishable. The evaluate callback fired
// on mount with configs=[], hit its empty-configs early return, and
// flipped loading=false BEFORE the configs fetch completed. AlertZone
// then briefly rendered the green AllClearPill before re-rendering with
// the real alerts (amber) once configs loaded and evaluate re-fired.
//
// Fix: configs = useState(null) as "not yet fetched" sentinel. The
// evaluate callback's null branch returns without touching loading,
// keeping the AlertZone loading gate armed through the configs-fetch
// window.
//
// This test asserts loading stays true from mount through the configs
// fetch + first evaluate cycle. If the null sentinel is ever reverted
// (or if some future PR adds a code path that flips loading=false
// before configs are fetched), this test fails.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

let orgIdValue = 'org-1';
let configsResolver = null;
let evaluateResolver = null;
let pendingConfigs = null;
let pendingEvaluate = null;

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => {
            pendingConfigs = new Promise((resolve) => { configsResolver = resolve; });
            return pendingConfigs;
          },
        }),
      }),
    }),
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ orgId: orgIdValue }),
}));

vi.mock('../../lib/alerts/evaluator', () => ({
  evaluateAlerts: () => {
    pendingEvaluate = new Promise((resolve) => { evaluateResolver = resolve; });
    return pendingEvaluate;
  },
}));

vi.mock('../../lib/alerts/queries', () => ({
  createSupabaseQueryExecutor: () => ({}),
}));

const { useAlertEvaluator } = await import('../useAlertEvaluator');

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  configsResolver = null;
  evaluateResolver = null;
  pendingConfigs = null;
  pendingEvaluate = null;
});
beforeEach(() => { orgIdValue = 'org-1'; });

describe('useAlertEvaluator — initial-render loading gate (anti-pattern #43)', () => {
  it('a. loading stays true from mount through configs fetch (regression lock)', async () => {
    const { result } = renderHook(() => useAlertEvaluator());

    // Initial synchronous render: loading must be true.
    expect(result.current.loading).toBe(true);
    expect(result.current.alerts).toEqual([]);

    // Yield microtasks so the configs fetch effect + evaluate effect fire.
    // The configs fetch is paused (configsResolver hasn't been called) so
    // configs is still null. The evaluate callback runs with configs=null
    // and must early-return WITHOUT touching loading. This is the load-
    // bearing assertion — pre-fix, loading would flip to false here.
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.loading).toBe(true);
    expect(result.current.alerts).toEqual([]);
  });

  it('b. loading flips to false only after configs load + evaluate completes', async () => {
    const { result } = renderHook(() => useAlertEvaluator());

    // Wait for the configs supabase chain to be called (mock's pendingConfigs
    // promise created). Microtasks need to flush first.
    await waitFor(() => expect(configsResolver).not.toBeNull());

    // Resolve the configs fetch with one config so evaluate has work to do.
    configsResolver({
      data: [{
        id: 'c1', org_id: 'org-1', alert_type_id: 'at1', instance_key: 'k1',
        enabled: true, threshold_config: {}, evaluation_order: 1,
        alert_type: { key: 'rsvp_shortfall', default_severity: 'warning', is_primitive: true },
      }],
      error: null,
    });
    await waitFor(() => expect(pendingEvaluate).not.toBeNull());

    // Evaluate is in flight — configs has loaded but the eval query hasn't
    // completed. loading should still be true.
    expect(result.current.loading).toBe(true);

    // Resolve evaluate with a firing alert.
    evaluateResolver([
      { config_id: 'c1', alert_type_key: 'rsvp_shortfall', severity: 'warning', title: 'RSVP shortfall', description: '1 event' },
    ]);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.alerts).toHaveLength(1);
    expect(result.current.alerts[0].severity).toBe('warning');
  });

  it('c. loading flips to false on empty-configs (fetched + empty) without flashing alerts', async () => {
    const { result } = renderHook(() => useAlertEvaluator());

    expect(result.current.loading).toBe(true);

    // Wait for the configs supabase chain to be called.
    await waitFor(() => expect(configsResolver).not.toBeNull());

    // Resolve configs as empty array (org has no enabled alerts).
    configsResolver({ data: [], error: null });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.alerts).toEqual([]);
    // Evaluate should not have fired (no configs to evaluate against).
    expect(pendingEvaluate).toBeNull();
  });
});
