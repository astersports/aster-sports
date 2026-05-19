import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// §4.O — read-only fetch around guardians + their kid links for the
// admin members directory. Returns guardians for the current org with
// inlined kid info via the `player_guardians` join. Per anti-pattern
// #37: org_id filter first on the chain. Per #36: destructure data +
// error separately. CRUD edit lands in PR B (GuardianFormSheet).
//
// Output shape per row:
//   { id, first_name, last_name, email, phone, user_id,
//     kids: [{ player_id, first_name, last_name }, ...] }
export function useGuardians() {
  const { orgId } = useAuth();
  const [guardians, setGuardians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!orgId) { setGuardians([]); setLoading(false); return; }
    setLoading(true);
    const { data, error: e } = await supabase
      .from('guardians')
      .select('id, first_name, last_name, email, phone, user_id, player_guardians(player_id, players(id, first_name, last_name))')
      .eq('org_id', orgId)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });
    if (e) {
      console.error('useGuardians fetch:', e.message);
      setError(e.message);
      setGuardians([]);
      setLoading(false);
      return;
    }
    const shaped = (data || []).map((g) => ({
      id: g.id,
      first_name: g.first_name,
      last_name: g.last_name,
      email: g.email,
      phone: g.phone,
      user_id: g.user_id,
      kids: (g.player_guardians || [])
        .map((pg) => pg.players)
        .filter(Boolean)
        .map((p) => ({ player_id: p.id, first_name: p.first_name, last_name: p.last_name })),
    }));
    setError(null);
    setGuardians(shaped);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  // PR 5b-B — basic add/edit CRUD. No archive in this PR (guardians
  // table lacks archived_at; cascading-delete via FK to player_guardians
  // is also out of scope until product call on "what happens to a
  // kid when their last guardian is removed" lands). Per anti-pattern
  // #36: destructure data + error; surface error to caller.
  const createGuardian = useCallback(async (input) => {
    if (!orgId) return { error: 'No organization' };
    const payload = {
      org_id: orgId,
      first_name: (input.first_name || '').trim() || null,
      last_name: (input.last_name || '').trim() || null,
      email: (input.email || '').trim() || null,
      phone: (input.phone || '').trim() || null,
    };
    const { error: e } = await supabase.from('guardians').insert(payload);
    if (!e) await refetch();
    return { error: e?.message };
  }, [orgId, refetch]);

  const updateGuardian = useCallback(async (id, input) => {
    const payload = {
      first_name: (input.first_name || '').trim() || null,
      last_name: (input.last_name || '').trim() || null,
      email: (input.email || '').trim() || null,
      phone: (input.phone || '').trim() || null,
    };
    const { error: e } = await supabase.from('guardians').update(payload).eq('id', id);
    if (!e) await refetch();
    return { error: e?.message };
  }, [refetch]);

  return { guardians, loading, error, refetch, createGuardian, updateGuardian };
}
