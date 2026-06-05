// Extracted from BriefingComposer (COMPOSE-FRONT cap-pressure split, §6).
// Hydrates an existing comms_messages draft row into the composer reducer on
// mount when ?draft=<id> is present. Pure side-effect hook — dispatches
// HYDRATE_DRAFT once per initialDraftId.

import { useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useLoadBriefingDraft(initialDraftId, dispatch) {
  const loadDraft = useCallback(async (id) => {
    if (!id) return;
    const { data, error } = await supabase.from('comms_messages').select('*').eq('id', id).maybeSingle();
    if (error || !data) return;
    dispatch({ type: 'HYDRATE_DRAFT', payload: { kind: data.kind, anchor_kind: data.anchor_kind, anchor_id: data.anchor_id, audience_type: data.audience_type, audience_filter: data.audience_filter, body: data.content_sections?.body || {}, signoff_message: data.signoff_message || '', draft_id: data.id } });
  }, [dispatch]);
  useEffect(() => { if (initialDraftId) Promise.resolve().then(() => loadDraft(initialDraftId)); }, [initialDraftId, loadDraft]);
}
