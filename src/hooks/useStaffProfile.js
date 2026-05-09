import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Reads + writes the current user's row in public.staff_profiles.
// Single-row pattern: maybeSingle() never errors when no row exists.
// Save uses upsert keyed on user_id (PK).
//
// Wave 3.8 §5.1 fix: payload now includes org_id. The table has
// `org_id NOT NULL`, and PostgREST upsert builds INSERT...ON CONFLICT
// SQL — the INSERT phase always validates NOT NULL columns even when
// the conflict clause routes to UPDATE. Omitting org_id was rejecting
// every save (even pure renames) with "Couldn't save profile."
// orgId comes from useAuth context, set per-org at login.

export function useStaffProfile() {
  const { user, orgId } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      if (!user?.id) { setProfile(null); setLoading(false); return; }
      setLoading(true); setError(null);
      const { data, error: err } = await supabase
        .from('staff_profiles')
        .select('user_id, display_name, phone, title, org_id, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (err) { setError(err); setLoading(false); return; }
      setProfile(data || null);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  const userId = user?.id;
  const save = useCallback(async ({ display_name, phone }) => {
    if (!userId) return { error: new Error('No auth user') };
    if (!orgId) return { error: new Error('No orgId in auth context') };
    setSaving(true); setError(null);
    const payload = {
      user_id: userId,
      org_id: orgId,
      display_name: (display_name || '').trim() || null,
      phone: (phone || '').trim() || null,
      updated_at: new Date().toISOString(),
    };
    const { data, error: err } = await supabase
      .from('staff_profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select('user_id, display_name, phone, title, org_id, updated_at')
      .single();
    setSaving(false);
    if (err) { setError(err); return { error: err }; }
    setProfile(data);
    return { data };
  }, [userId, orgId]);

  return { profile, loading, saving, error, save };
}
