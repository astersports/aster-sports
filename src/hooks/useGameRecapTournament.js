// game_recap's GameRecapBody renders the league/bracket CTA field only when
// the anchor event has a parent tournament. The raw lookup is tagged with
// anchorId so the render-time derivation rejects stale results from a prior
// anchor (preventing a flash of the CTA when switching anchors).
// Extracted from BriefingComposer (P4) to keep that file under the 150-line cap.

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useGameRecapTournament(state) {
  const [tournamentLookup, setTournamentLookup] = useState(null);
  useEffect(() => {
    let cancelled = false;
    if (state.kind !== 'game_recap' || state.anchor_kind !== 'event' || !state.anchor_id) return undefined;
    Promise.resolve().then(async () => {
      const { data } = await supabase.from('events').select('tournament_id').eq('id', state.anchor_id).maybeSingle();
      if (cancelled) return;
      setTournamentLookup({ anchorId: state.anchor_id, tournamentId: data?.tournament_id ?? null });
    });
    return () => { cancelled = true; };
  }, [state.kind, state.anchor_kind, state.anchor_id]);
  return state.kind === 'game_recap' && state.anchor_kind === 'event' && !!state.anchor_id
    && tournamentLookup?.anchorId === state.anchor_id && !!tournamentLookup?.tournamentId;
}
