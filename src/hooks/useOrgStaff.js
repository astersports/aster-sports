import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Returns staff_profiles rows for the org (user_id, display_name, title,
// phone). Used by the signoff "who to include" picker (user_id is the stable
// selection key) and the digest signoff signature block.

export function useOrgStaff(orgId) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      if (!orgId) { setStaff([]); setLoading(false); return; }
      setLoading(true);
      const { data, error } = await supabase
        .from('staff_profiles')
        .select('user_id, display_name, title, phone')
        .eq('org_id', orgId)
        .not('display_name', 'is', null);
      if (cancelled) return;
      if (error) { setStaff([]); setLoading(false); return; }
      setStaff(data || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [orgId]);

  return { staff, loading };
}
