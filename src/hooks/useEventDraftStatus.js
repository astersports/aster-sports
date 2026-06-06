import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// useEventDraftStatus — resolves whether the given event's tournament schedule
// is still a DRAFT (HOME_RENDER_RULES_CC #2 draft pill). Tournament events
// carry NO foreign key to tournaments (verified against production — there is
// no events→tournaments FK), so we fetch the one tournament's schedule_status
// by id rather than embedding (the #763 no-FK-embed lesson). Only tournament
// events can be draft; everything else returns false. Draft = schedule_status
// is 'draft' or null (§15 map-priority doctrine: draft/null = schedule pending).
export function useEventDraftStatus(event) {
  const [isDraft, setIsDraft] = useState(false);
  const tournamentId = event?.event_type === 'tournament' ? event?.tournament_id : null;

  const refetch = useCallback(async () => {
    if (!tournamentId) { setIsDraft(false); return; }
    const { data, error } = await supabase
      .from('tournaments').select('schedule_status').eq('id', tournamentId).maybeSingle();
    // AP#36: surface the error path explicitly — on any failure don't claim
    // draft (false) rather than silently substituting a misleading pill.
    if (error) { setIsDraft(false); return; }
    setIsDraft(!data?.schedule_status || data.schedule_status === 'draft');
  }, [tournamentId]);

  useEffect(() => { Promise.resolve().then(refetch); }, [refetch]);

  return isDraft;
}
