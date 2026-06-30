import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { pickUpcoming } from '../lib/aau/nextGame';

// The next few upcoming games across ALL the parent's tracked teams, for the
// no-login Hub up-next hero (R1·PR-A). One RPC call —
// get_public_aau_team_schedule(p_team_ids) accepts the whole tracked-key array
// — so a parent following several East Coast Storm teams gets one merged
// "what's next" across all of them. `nextGame` anchors the countdown; `afterThis`
// is the next one or two after it (the on-deck mini box). The pure pick-helper
// lives in lib/aau/nextGame.js (AP #27 — IO-free so the unit test can import it).

export function useTrackedSchedules(teamKeys) {
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const keyCsv = (teamKeys || []).join(',');

  useEffect(() => {
    const keys = keyCsv ? keyCsv.split(',') : [];
    if (keys.length === 0) {
      Promise.resolve().then(() => { setUpcoming([]); setLoading(false); });
      return;
    }
    let cancelled = false;
    Promise.resolve().then(() => setLoading(true));

    (async () => {
      // AP #36: destructure { data, error }; surface the error before use.
      const { data, error } = await supabase.rpc('get_public_aau_team_schedule', { p_team_ids: keys });
      if (cancelled) return;
      setUpcoming(error ? [] : pickUpcoming(Array.isArray(data) ? data : [], Date.now(), 3));
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [keyCsv]);

  return { nextGame: upcoming[0] || null, afterThis: upcoming.slice(1), loading };
}
