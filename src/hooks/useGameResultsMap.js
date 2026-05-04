import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useGameResultsMap(activities) {
  const [map, setMap] = useState({});
  const gameIds = useMemo(() =>
    (activities || [])
      .filter((a) => (a.event_type === 'game' || a.event_type === 'tournament') && new Date(a.start_at) < new Date())
      .map((a) => a.id),
    [activities]
  );

  useEffect(() => {
    if (!gameIds.length) return;
    let cancelled = false;
    Promise.resolve().then(async () => {
      const { data } = await supabase.from('game_results')
        .select('event_id, result, our_score, opponent_score, published_at')
        .in('event_id', gameIds)
        .not('published_at', 'is', null);
      if (cancelled) return;
      const m = {};
      for (const r of (data || [])) m[r.event_id] = r;
      setMap(m);
    });
    return () => { cancelled = true; };
  }, [gameIds]);

  return map;
}
