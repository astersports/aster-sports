// src/hooks/usePlayerNamesByIds.js
// Phase D.2 Ship 4 — player display name lookup.
// Returns { [player_id]: "First Name" } map for given player ids, scoped to org.
// Mirrors useDriverNames pattern. Reusable for any UI resolving player_id → name.

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';

export function usePlayerNamesByIds(orgId, playerIds) {
  const [names, setNames] = useState({});

  const idsKey = useMemo(() => {
    const unique = [...new Set((playerIds || []).filter(Boolean))].sort();
    return unique.join(',');
  }, [playerIds]);

  useEffect(() => {
    if (!idsKey || !orgId) return undefined;
    const ids = idsKey.split(',').filter(Boolean);
    if (ids.length === 0) return undefined;
    let cancelled = false;
    (async () => {
      const { data, error: fetchError } = await supabase
        .from('players')
        .select('id, first_name')
        .eq('org_id', orgId)
        .in('id', ids);
      if (cancelled || fetchError || !data) return;
      const map = {};
      data.forEach((p) => {
        if (p.id && p.first_name) map[p.id] = p.first_name;
      });
      setNames(map);
    })();
    return () => { cancelled = true; };
  }, [idsKey, orgId]);

  return names;
}
