// src/hooks/useDriverNames.js
// Phase 1.5 rides Phase D — driver display name lookup.
// Returns { [user_id]: "First L." } map for given driver user_ids.
// Scoped to org_id. Refetches when ids change.
// Reusable for user_id → display name patterns (messages, audit logs, etc.).

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';

export function useDriverNames(orgId, driverUserIds) {
  const [names, setNames] = useState({});

  // Stable string key — avoids re-fetch on array re-reference with same contents.
  const idsKey = useMemo(() => {
    const unique = [...new Set((driverUserIds || []).filter(Boolean))].sort();
    return unique.join(',');
  }, [driverUserIds]);

  useEffect(() => {
    if (!idsKey || !orgId) return undefined;
    const ids = idsKey.split(',').filter(Boolean);
    if (ids.length === 0) return undefined;
    let cancelled = false;
    (async () => {
      const { data, error: fetchError } = await supabase
        .from('guardians')
        .select('user_id, first_name, last_name')
        .eq('org_id', orgId)
        .in('user_id', ids);
      if (cancelled || fetchError || !data) return;
      const map = {};
      data.forEach((g) => {
        if (!g.user_id) return;
        const lastInitial = g.last_name ? ` ${g.last_name.charAt(0)}.` : '';
        map[g.user_id] = `${g.first_name}${lastInitial}`;
      });
      setNames(map);
    })();
    return () => { cancelled = true; };
  }, [idsKey, orgId]);

  return names;
}
