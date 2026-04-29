import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Reads all teams visible to the user, ordered oldest to youngest.
 * RLS scopes to org automatically. Single-org pilot today; multi-org safe.
 */
export function useTeams() {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [teams, setTeams]     = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, team_color, sort_order, age_group, division, circuit')
        .order('sort_order', { ascending: true });
      if (cancelled) return;
      if (error) { setError(error); setLoading(false); return; }
      setTeams(data || []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { loading, error, teams };
}
