import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Reads all teams visible to the user, ordered oldest to youngest.
 * RLS scopes to org automatically. Optional orgId argument adds an
 * explicit `.eq('org_id', orgId)` filter — defense-in-depth so that
 * if/when public RLS policies are generalized for multi-org, anon
 * surfaces still see only the requested org. Calling with no argument
 * preserves the original RLS-only behavior for existing consumers.
 */
export function useTeams(orgId) {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [teams, setTeams]     = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      let query = supabase
        .from('teams')
        .select('id, name, team_color, sort_order, age_group, division, circuit, team_type_id, team_types(slug)')
        .order('sort_order', { ascending: true });
      if (orgId) query = query.eq('org_id', orgId);
      const { data, error } = await query;
      if (cancelled) return;
      if (error) { setError(error); setLoading(false); return; }
      setTeams(data || []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [orgId]);

  return { loading, error, teams };
}
