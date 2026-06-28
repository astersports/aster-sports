import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useGetOrCreateDm() {
  const { user, orgId } = useAuth();

  const getOrCreate = useCallback(async (otherUserId) => {
    if (!user || !orgId) return null;
    const [a, b] = [user.id, otherUserId].sort();
    const { data: existing, error: fetchErr } = await supabase
      .from('dm_threads')
      .select('*')
      .eq('org_id', orgId)
      .eq('user_a', a)
      .eq('user_b', b)
      .maybeSingle();
    if (fetchErr) { console.warn('getOrCreateDm (fetch):', fetchErr.message); return null; }
    if (existing) return existing;
    const { data: created, error } = await supabase
      .from('dm_threads')
      .insert({ org_id: orgId, user_a: a, user_b: b })
      .select()
      .single();
    if (error) {
      // TOCTOU: a concurrent insert may have won the race (unique violation).
      // Re-select and return the now-existing thread instead of null.
      const { data: raced, error: raceErr } = await supabase
        .from('dm_threads')
        .select('*')
        .eq('org_id', orgId)
        .eq('user_a', a)
        .eq('user_b', b)
        .maybeSingle();
      if (raced) return raced;
      console.error('getOrCreateDm:', error.message);
      if (raceErr) console.error('getOrCreateDm (re-select):', raceErr.message);
      return null;
    }
    return created;
  }, [user, orgId]);

  return getOrCreate;
}
