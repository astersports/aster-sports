import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Reads organization_settings for the current org. Returns the
// pilot_mode_enabled flag (and other settings shape if needed later).
//
// IMPORTANT: organization_settings uses `organization_id`, not `org_id`.
// Most other tables use `org_id` — see CLAUDE.md schema notes.

export function useOrgSettings(orgId) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      if (!orgId) { setSettings(null); setLoading(false); return; }
      setLoading(true);
      const { data, error } = await supabase
        .from('organization_settings')
        .select('pilot_mode_enabled')
        .eq('organization_id', orgId)
        .maybeSingle();
      if (cancelled) return;
      if (error) { setSettings(null); setLoading(false); return; }
      setSettings(data || null);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [orgId]);

  // Safe default: when the row is missing or the fetch errors, treat as
  // pilot mode ON. The whole point of the gate is to fail closed.
  const pilotModeEnabled = settings?.pilot_mode_enabled ?? true;
  return { settings, pilotModeEnabled, loading };
}
