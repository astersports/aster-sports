import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';

// Org-level event-feature toggles (operator directive 2026-06-12):
// ride-share + volunteers activate at system settings, not per event.
// Reads seed from AuthContext's org row (zero extra queries); writes go
// through the admin-gated merged-write RPC (mirror of the
// auto-notifications A2 pattern). Local state keeps the form + readers
// coherent within the session; other devices pick it up on next load.
export function useOrgFeatureSettings() {
  const { orgId, org } = useAuth();
  const { showToast } = useToast();
  const [overrides, setOverrides] = useState(null);
  const [saving, setSaving] = useState(false);

  const fs = overrides ?? org?.feature_settings ?? {};
  const ridesOn = fs.rides_enabled !== false;
  const dutiesOn = fs.duties_enabled !== false;

  const save = async (patch) => {
    setSaving(true);
    const { data, error } = await supabase.rpc('set_org_feature_settings', { p_org_id: orgId, p_patch: patch });
    setSaving(false);
    if (error) {
      showToast("Looks like that didn't go through. Try again?", 'error');
      return { ok: false };
    }
    setOverrides(data);
    showToast('Saved.', 'success');
    return { ok: true };
  };

  return { ridesOn, dutiesOn, loading: !org, saving, save };
}
