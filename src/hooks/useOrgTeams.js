// Wave 4.4-B Session 5d-b-1 — direct teams query with the grouping
// columns the audience picker needs (age_group, division, circuit,
// team_type_id, sort_order, team_color). The existing useDigestEvents
// also returns teams but only ({id, name, team_color, sort_order})
// from an events.teams JOIN and is gated on kind='weekly_digest'.
// This hook runs on mount regardless of kind so Step 2's
// TeamGroupedPicker has data ready when team / multi_team is picked.

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useOrgTeams() {
  const { orgId } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (!orgId) { setTeams([]); setLoading(false); return; }
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, age_group, division, circuit, team_type_id, sort_order, team_color')
        .eq('org_id', orgId)
        .order('sort_order', { ascending: true });
      if (cancelled) return;
      if (error) { setTeams([]); setLoading(false); return; }
      setTeams(data || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [orgId]);

  return { teams, loading };
}
