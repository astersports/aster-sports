import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { reportError } from '../lib/reportError';

// Reads + writes organization_settings for the current org. Returns the
// pilot_mode_enabled flag (existing callers) plus the full bucket-A settings
// row and an admin merged-write `save` for the Settings page sections.
//
// IMPORTANT: organization_settings uses `organization_id`, not `org_id`.
// Most other tables use `org_id` — see CLAUDE.md schema notes.
//
// Write path: bucket-A fields are admin-writable directly via the existing
// "Admins can manage their org settings" ALL policy — no RPC, no migration.
// (auto_notifications lives on organizations and uses its own RPC; not here.)
const FIELDS = [
  'pilot_mode_enabled', 'pilot_test_recipient_email',
  'from_name', 'from_email', 'reply_to_email',
  'season_label', 'timezone', 'registration_open',
  'futures_academy_enabled', 'carpool_enabled', 'custom_domain',
].join(', ');

export function useOrgSettings(orgId) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      if (!orgId) { setSettings(null); setLoading(false); return; }
      setLoading(true);
      const { data, error } = await supabase
        .from('organization_settings')
        .select(FIELDS)
        .eq('organization_id', orgId)
        .maybeSingle();
      if (cancelled) return;
      if (error) { setSettings(null); setLoading(false); return; }
      setSettings(data || null);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [orgId]);

  // Pessimistic merged-write: UPDATE the named columns, then merge the patch
  // into local state so the page summary reflects the save without a refetch.
  const save = useCallback(async (patch) => {
    if (!orgId) return { ok: false };
    setSaving(true);
    const { error } = await supabase
      .from('organization_settings')
      .update(patch)
      .eq('organization_id', orgId);
    setSaving(false);
    if (error) {
      reportError(error, { surface: 'useOrgSettings.save', orgId });
      return { ok: false };
    }
    setSettings((prev) => ({ ...(prev || {}), ...patch }));
    return { ok: true };
  }, [orgId]);

  // Safe default: when the row is missing or the fetch errors, treat as
  // pilot mode ON. The whole point of the gate is to fail closed.
  const pilotModeEnabled = settings?.pilot_mode_enabled ?? true;
  // Wave 4.3-K: pilot_test_recipient_email override is org-scoped; null
  // means "no override, route to real pilot families." UI gates the test
  // scope picker on this being non-null.
  const pilotTestRecipientEmail = settings?.pilot_test_recipient_email || null;
  return { settings, pilotModeEnabled, pilotTestRecipientEmail, loading, saving, save };
}
