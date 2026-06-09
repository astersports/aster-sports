import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { reportError } from '../lib/reportError';
import { rsvpMinGoingThreshold, rsvpNudgesEnabled } from '../lib/cron/rsvpNudgeThreshold';

// Stream A reminders default-ON rule, mirrored from the edge handler
// supabase/functions/briefing-auto-draft-tick/_reminders.ts: reminders SEND
// unless auto_notifications.reminders_enabled === false. Kept inline (not in
// the RSVP-nudge AP#30 mirror pair, which is Stream-B-scoped) so A2 doesn't
// touch that mirror. The hook reads Stream B via the canonical rsvpNudge
// helpers so the UI's notion of on/off + floor can never drift from the cron
// (AP#43/#63 cross-surface invariant).
export function remindersEnabled(autoNotifications) {
  return autoNotifications?.reminders_enabled !== false;
}

// Reads organizations.auto_notifications for the current org and writes it via
// the admin-gated SECDEF RPC set_org_auto_notifications (organizations has RLS
// on with a SELECT-only policy — there is NO client UPDATE path; the RPC's
// `||` merge protects sibling keys). Pessimistic save: the caller awaits
// save() and closes on { ok: true }.
export function useOrgAutoNotifications() {
  const { orgId } = useAuth();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      if (!orgId) { setConfig(null); setLoading(false); return; }
      setLoading(true);
      const { data, error } = await supabase
        .from('organizations')
        .select('auto_notifications')
        .eq('id', orgId)
        .maybeSingle();
      if (cancelled) return;
      if (error) { setConfig(null); setLoading(false); return; }
      setConfig(data?.auto_notifications ?? {});
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [orgId]);

  const save = useCallback(async (patch) => {
    if (!orgId) return { ok: false };
    setSaving(true);
    const { data, error } = await supabase.rpc('set_org_auto_notifications', {
      p_org_id: orgId,
      p_patch: patch,
    });
    setSaving(false);
    if (error) {
      reportError(error, { surface: 'useOrgAutoNotifications.save', orgId });
      return { ok: false };
    }
    setConfig(data ?? {});
    return { ok: true };
  }, [orgId]);

  return {
    config,
    loading,
    saving,
    save,
    // Derived reads via the SAME helpers the cron uses (AP#43/#63).
    remindersOn: remindersEnabled(config),
    nudgesOn: rsvpNudgesEnabled(config),
    minGoing: rsvpMinGoingThreshold(config),
  };
}
