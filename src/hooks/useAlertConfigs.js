import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { reportError } from '../lib/reportError';

// Admin hook for the S9 Alerts surface. Reads alert_configurations joined to
// alert_types (org-scoped, ordered by evaluation_order) and saves per-row
// `enabled` changes. No insert/delete (rows are seeded). Pessimistic: save
// awaits the UPDATEs and reports the first error. Thresholds are READ-ONLY in
// the pilot (S9 FLAG 2), so threshold_config is never written here.
export function useAlertConfigs() {
  const { orgId } = useAuth();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      if (!orgId) { setConfigs([]); return; }
      setLoading(true);
      const { data, error } = await supabase
        .from('alert_configurations')
        .select('id, enabled, instance_key, evaluation_order, threshold_config, alert_types(key, default_severity)')
        .eq('org_id', orgId)
        .order('evaluation_order');
      if (cancelled) return;
      setLoading(false);
      if (error) { reportError(error, { surface: 'useAlertConfigs.load', orgId }); setConfigs([]); return; }
      setConfigs((data || []).map((r) => ({
        id: r.id, enabled: r.enabled, instance_key: r.instance_key,
        threshold_config: r.threshold_config,
        type_key: r.alert_types?.key, default_severity: r.alert_types?.default_severity,
      })));
    });
    return () => { cancelled = true; };
  }, [orgId]);

  // updates: [{ id, enabled }]. Pessimistic; merges into local state on success.
  const save = useCallback(async (updates) => {
    setSaving(true);
    for (const u of updates) {
      const { error } = await supabase.from('alert_configurations').update({ enabled: u.enabled }).eq('id', u.id);
      if (error) { setSaving(false); reportError(error, { surface: 'useAlertConfigs.save', id: u.id }); return { ok: false }; }
    }
    setSaving(false);
    setConfigs((prev) => prev.map((c) => {
      const u = updates.find((x) => x.id === c.id);
      return u ? { ...c, enabled: u.enabled } : c;
    }));
    return { ok: true };
  }, []);

  return { configs, loading, saving, save };
}
