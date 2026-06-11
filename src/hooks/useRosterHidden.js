import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { rosterVisible } from '../lib/rosterVisibility';

// R3: is this team's roster hidden from other families? Mirrors the
// current_user_teammate_player_ids() COALESCE chain (team override -> program ->
// program_type default) so the parent roster view can render the privacy line that
// makes a one-child roster read as intentional (tryouts/camps), not a broken list.
export function useRosterHidden(teamId) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!teamId) { if (alive) setHidden(false); return; }
      const { data: t } = await supabase
        .from('teams').select('roster_visibility_override, season_id').eq('id', teamId).maybeSingle();
      if (!alive || !t) return;
      let pr = {};
      if (t.season_id) {
        const { data: p } = await supabase
          .from('programs').select('roster_visibility, program_type').eq('id', t.season_id).maybeSingle();
        pr = p || {};
      }
      if (alive) setHidden(rosterVisible(t.roster_visibility_override, pr.roster_visibility, pr.program_type) === false);
    })();
    return () => { alive = false; };
  }, [teamId]);
  return hidden;
}
