import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// §4.O — read-only fetch around the `opponents` table for the admin
// opponents directory. Returns opponents for the current org ordered
// alphabetically by name. Per anti-pattern #37 (org_id filter first)
// + #36 (destructure data + error separately). CRUD edit lands in a
// later PR with OpponentFormSheet.
//
// Output shape preserved from the table: id, name, circuit, city,
// state, head_to_head_wins, head_to_head_losses, last_played_at,
// scouting_notes.
export function useOpponents() {
  const { orgId } = useAuth();
  const [opponents, setOpponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!orgId) { setOpponents([]); setLoading(false); return; }
    setLoading(true);
    const { data, error: e } = await supabase
      .from('opponents')
      .select('id, name, circuit, city, state, head_to_head_wins, head_to_head_losses, last_played_at, scouting_notes')
      .eq('org_id', orgId)
      .order('name', { ascending: true });
    if (e) {
      console.error('useOpponents fetch:', e.message);
      setError(e.message);
      setOpponents([]);
    } else {
      setError(null);
      setOpponents(data ?? []);
    }
    setLoading(false);
  }, [orgId]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  return { opponents, loading, error, refetch };
}
