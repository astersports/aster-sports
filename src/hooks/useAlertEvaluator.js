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

import { useCallback, useEffect, useState } from 'react';
import { useInterval } from './useInterval';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { evaluateAlerts } from '../lib/alerts/evaluator';
import { createSupabaseQueryExecutor } from '../lib/alerts/queries';

const POLL_INTERVAL_MS = 60_000;

export function useAlertEvaluator() {
  const { orgId } = useAuth();
  const [configs, setConfigs] = useState([]);
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
      if (err) { setError(err); setLoading(false); return; }
      const flat = (data || []).map((c) => ({ ...c, alert_type_key: c.alert_type?.key }));
      setConfigs(flat);
    });
    return () => { cancelled = true; };
  }, [orgId]);

  const evaluate = useCallback(async () => {
    if (!configs.length) { setAlerts([]); setLoading(false); return; }
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

  // Run once after configs load.
  useEffect(() => { Promise.resolve().then(evaluate); }, [evaluate]);

  // Poll every 60s thereafter.
  useInterval(evaluate, configs.length ? POLL_INTERVAL_MS : null);

  return { alerts, loading, error, refresh: evaluate };
}
