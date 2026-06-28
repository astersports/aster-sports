import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { reportError } from '../lib/reportError';

// Settings S2 — Family Notifications (parent self). guardian_notification_prefs is
// self-RLS (guardian_id in (select id from guardians where user_id = auth.uid())) and
// GUARDIAN-LEVEL (one row per parent, covers all their players). The row may NOT exist
// yet (greenfield): read → default all-ON; save → UPSERT by guardian_id (the table has
// a UNIQUE(guardian_id) constraint, so onConflict is safe — AP#25). isGuardian is the
// client gate for the /account group (RLS is the backstop).
const DEFAULTS = { receive_weekly_digest: true, receive_tournament_briefings: true, receive_game_recaps: true, receive_org_announcements: true };

export function useGuardianNotificationPrefs() {
  const { guardianId } = useAuth();
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      if (!guardianId) { setPrefs(null); setLoading(false); return; }
      setLoading(true);
      const { data, error } = await supabase
        .from('guardian_notification_prefs')
        .select('receive_weekly_digest, receive_tournament_briefings, receive_game_recaps, receive_org_announcements')
        .eq('guardian_id', guardianId)
        .maybeSingle();
      if (cancelled) return;
      // Greenfield (no row) → all-ON defaults. Read error also defaults (fail-open
      // read), but log it (AP#36) so a fetch failure isn't an invisible all-ON default.
      if (error) console.error('useGuardianNotificationPrefs:', error.message);
      setPrefs(error ? { ...DEFAULTS } : (data ?? { ...DEFAULTS }));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [guardianId]);

  const save = useCallback(async (patch) => {
    if (!guardianId) return { ok: false };
    setSaving(true);
    const { error } = await supabase
      .from('guardian_notification_prefs')
      .upsert({ guardian_id: guardianId, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'guardian_id' });
    setSaving(false);
    if (error) {
      reportError(error, { surface: 'useGuardianNotificationPrefs.save', guardianId });
      return { ok: false };
    }
    setPrefs((p) => ({ ...(p || DEFAULTS), ...patch }));
    return { ok: true };
  }, [guardianId]);

  return { prefs, loading, saving, save, isGuardian: !!guardianId };
}
