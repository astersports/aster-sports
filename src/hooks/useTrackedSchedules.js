import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { pickNextGame } from '../lib/aau/nextGame';

// The single soonest upcoming game across ALL the parent's tracked teams, for
// the no-login Hub up-next hero (R1·PR-A). One RPC call —
// get_public_aau_team_schedule(p_team_ids) accepts the whole tracked-key array
// — so a parent following several East Coast Storm teams gets one "next up"
// across all of them, not one card per team. The pure pick-helper lives in
// lib/aau/nextGame.js (AP #27 — IO-free so the unit test can import it).

export function useTrackedSchedules(teamKeys) {
  const [nextGame, setNextGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const keyCsv = (teamKeys || []).join(',');

  useEffect(() => {
    const keys = keyCsv ? keyCsv.split(',') : [];
    if (keys.length === 0) {
      Promise.resolve().then(() => { setNextGame(null); setLoading(false); });
      return;
    }
    let cancelled = false;
    Promise.resolve().then(() => setLoading(true));

    (async () => {
      // AP #36: destructure { data, error }; surface the error before use.
      const { data, error } = await supabase.rpc('get_public_aau_team_schedule', { p_team_ids: keys });
      if (cancelled) return;
      setNextGame(error ? null : pickNextGame(Array.isArray(data) ? data : []));
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [keyCsv]);

  return { nextGame, loading };
}
