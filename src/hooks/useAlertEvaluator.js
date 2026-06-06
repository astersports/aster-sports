// Tier 3 v1 PR 4 — alert evaluator hook for home page surfaces.
//
// Wires PR 2's evaluateAlerts() to a 60s poll. Loads alert
// configurations once on mount, then re-evaluates against the same
// configs every 60s. Configs themselves only change when admin
// edits settings (deferred to v2), so reloading the catalog every
// tick would be waste.
//
// Returns { alerts, loading, error, refresh } so consumers can
// render firing alerts immediately + reflect loading state on
// first load.
//
// Loading-state contract (per CLAUDE.md anti-pattern #43, locked
// 2026-05-18 after L99 audit + Frank smoke surfaced a regression):
// `loading` MUST stay true from mount until the FIRST evaluate cycle
// completes with real configs. The original implementation used
// configs = useState([]) which made the initial state and the
// "fetched + empty" state indistinguishable — the evaluate callback
// fired on mount with configs=[] and hit its empty-configs early
// return (`setAlerts([]); setLoading(false)`), flipping loading=false
// BEFORE the configs fetch completed. AlertZone then briefly rendered
// the green AllClearPill before re-rendering with the real alerts
// (amber) once configs loaded and evaluate fired the second time.
//
// Fix: configs = useState(null) as the "not yet fetched" sentinel.
// The empty-configs early return only fires when configs is a
// fetched-but-empty array. The null branch returns without touching
// loading, so the loading gate in AlertZone stays armed through the
// configs-fetch window.

import { useCallback, useEffect, useState } from 'react';
import { useInterval } from './useInterval';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { evaluateAlerts } from '../lib/alerts/evaluator';
import { createSupabaseQueryExecutor } from '../lib/alerts/queries';

const POLL_INTERVAL_MS = 60_000;

export function useAlertEvaluator() {
  const { orgId } = useAuth();
  // null = configs not yet fetched (initial state).
  // [] = fetched, no configs enabled for this org.
  // [c1, c2, ...] = fetched, configs loaded.
  // The null sentinel keeps `loading` armed through the fetch window.
  const [configs, setConfigs] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load alert_configurations once on mount + on orgId change.
  // Joined with alert_types so the evaluator can dispatch by key.
  // Microtask-deferred setState satisfies react-hooks/set-state-in-effect
  // (CLAUDE.md anti-pattern: never call setState synchronously in an
  // effect body).
  useEffect(() => {
    if (!orgId) {
      Promise.resolve().then(() => { setConfigs([]); setLoading(false); });
      return undefined;
    }
    let cancelled = false;
    Promise.resolve().then(async () => {
      const { data, error: err } = await supabase
        .from('alert_configurations')
        .select('id, org_id, alert_type_id, instance_key, enabled, threshold_config, evaluation_order, alert_type:alert_types ( key, default_severity, is_primitive )')
        .eq('org_id', orgId).eq('enabled', true);
      if (cancelled) return;
      if (err) { setError(err); setConfigs([]); setLoading(false); return; }
      const flat = (data || []).map((c) => ({ ...c, alert_type_key: c.alert_type?.key }));
      setConfigs(flat);
    });
    return () => { cancelled = true; };
  }, [orgId]);

  const evaluate = useCallback(async () => {
    // Null = configs not yet fetched. Don't touch loading; the
    // configs fetch effect will set configs (to [] or [c1...]) when
    // it completes, which re-fires this callback via the useEffect
    // below.
    if (configs === null) return;
    // Fetched + empty: no alerts possible. Done loading.
    if (configs.length === 0) { setAlerts([]); setLoading(false); return; }
    try {
      const qx = createSupabaseQueryExecutor(supabase);
      const firing = await evaluateAlerts(configs, qx);
      setAlerts(firing);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [configs]);

  // Run once after configs load (configs transition from null → array).
  useEffect(() => { Promise.resolve().then(evaluate); }, [evaluate]);

  // Poll every 60s thereafter. Only poll when configs has loaded
  // and has at least one entry — null or empty array = nothing to poll.
  useInterval(evaluate, configs && configs.length ? POLL_INTERVAL_MS : null);

  return { alerts, loading, error, refresh: evaluate };
}
