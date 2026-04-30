import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Returns the most recent published_at across all game_results so the
// /records "Last Updated" line stays honest off live data instead of a
// hardcoded date. Kept small + standalone so 3d-g's relative-time
// extension ("Updated 2 hours ago") can wrap it without rewrite.
export function useLastPublishedAt() {
  const [lastPublishedAt, setLastPublishedAt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      const { data } = await supabase
        .from('game_results')
        .select('published_at')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      setLastPublishedAt(data?.published_at || null);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { lastPublishedAt, loading };
}
