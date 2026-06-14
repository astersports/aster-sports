// src/hooks/useDriverNames.js
// Phase 1.5 rides Phase D — driver display name lookup.
// Returns { [user_id]: "First L." } map for given driver user_ids.
// Scoped to org_id. Refetches when ids change.
// Reusable for user_id → display name patterns (messages, audit logs, etc.).

import { useEffect, useMemo, useState } from 'react';
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
      const [guardiansRes, coachingRes] = await Promise.all([
        supabase.from('guardians').select('user_id, first_name, last_name').eq('org_id', orgId).in('user_id', ids),
        // Coach names come from staff_profiles (non-pay, org-readable). coaching_assignments
        // is admin/owner-only now (DR-F13 pay confidentiality), so a parent can't read it.
        supabase.from('staff_profiles').select('user_id, display_name').eq('org_id', orgId).in('user_id', ids),
      ]);
      if (cancelled) return;
      const map = {};
      // Coaching first (lower priority — guardians override).
      (coachingRes.data || []).forEach((c) => {
        if (!c.user_id || !c.display_name) return;
        const parts = c.display_name.trim().split(/\s+/);
        const lastInitial = parts.length > 1 ? ` ${parts[parts.length - 1].charAt(0)}.` : '';
        map[c.user_id] = `${parts[0]}${lastInitial}`;
      });
      // Guardians override.
      (guardiansRes.data || []).forEach((g) => {
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
