import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// The playoff "path" (full division bracket, even before it's played) for a
// tracked team's live/upcoming tournaments (R1·PR-A). One anon RPC call —
// get_public_team_bracket_path(p_team_ids) — returns one entry per division the
// team is in (gated to end_date >= today), each with the whole bracket so a
// parent sees the weekend path. Supplementary to the schedule: returns [] (and
// renders nothing) when the team has no live bracket.
export function useAauTeamBracket(teamKey) {
  const [paths, setPaths] = useState([]);

  useEffect(() => {
    if (!teamKey) {
      Promise.resolve().then(() => setPaths([]));
      return undefined;
    }
    let cancelled = false;
    (async () => {
      // AP #36: destructure { data, error }; surface the error before use.
      const { data, error } = await supabase.rpc('get_public_team_bracket_path', { p_team_ids: [teamKey] });
      if (cancelled) return;
      setPaths(error || !Array.isArray(data) ? [] : data);
    })();
    return () => { cancelled = true; };
  }, [teamKey]);

  return paths;
}
