import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Returns the end_date (YYYY-MM-DD) of the org's active season, or
// null while loading / if none exists. Used by StepWhen to default
// the Until date on recurring events.
export function useActiveSeasonEnd(orgId) {
  const [seasonEnd, setSeasonEnd] = useState(null);
  useEffect(() => {
    if (!orgId) return;
    supabase.from('seasons').select('end_date').eq('org_id', orgId).eq('status', 'active').limit(1)
      .then(({ data }) => {
        if (data?.[0]?.end_date) setSeasonEnd(data[0].end_date);
      });
  }, [orgId]);
  return seasonEnd;
}
