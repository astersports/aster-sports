// Wave 3.11 §B.6 — auto-save hook for BriefingComposer.
//
// Behavior:
//   - 3-second debounced save while user is editing
//   - First save: INSERT comms_messages row with status='draft',
//     captures id, returns draft_id
//   - Subsequent saves: UPDATE existing row (sets last_edited_at +
//     content_sections + body fields)
//   - submitSend(): UPDATE status='draft' → 'queued', returns id so
//     caller can invoke send-tournament-message
//   - submitSchedule(scheduledFor): UPDATE status='draft' →
//     'scheduled', sets scheduled_for
//   - discard(): UPDATE status='draft' → 'archived' (soft delete so
//     audit trail is preserved)
//
// Persistence: draft_id is returned to the caller, who is expected
// to thread it into the URL (?draft=...) so PWA reload resumes.
//
// Pilot mode: NOT enforced here. Pilot is a dispatch-time concern
// (edge function v13). Drafts are admin-only via comms_messages RLS.

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const DEBOUNCE_MS = 3000;

function buildPayload({ orgId, userId, draft }) {
  return {
    org_id: orgId,
    kind: draft.kind || 'custom_message',
    anchor_kind: draft.anchor_kind || null,
    anchor_id: draft.anchor_id || null,
    audience_type: draft.audience_type || null,
    audience_filter: draft.audience_filter || null,
    subject: draft.subject || null,
    body_html: draft.body_html || '',
    body_plain: draft.body_plain || '',
    content_sections: draft.content_sections || [],
    signoff_message: draft.signoff_message || null,
    last_edited_at: new Date().toISOString(),
    last_edited_by: userId,
    language_code: draft.language_code || 'en',
    delivery_method: 'queued',
  };
}

export function useBriefingDraft(initialDraftId = null) {
  const { user, orgId } = useAuth();
  const [draftId, setDraftId] = useState(initialDraftId);
  const [savedAt, setSavedAt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const pendingRef = useRef(null);

  const flush = useCallback(async () => {
    const draft = pendingRef.current;
    if (!draft || !user?.id || !orgId) return null;
    setBusy(true); setError(null);
    try {
      if (!draftId) {
        const payload = { ...buildPayload({ orgId, userId: user.id, draft }), status: 'draft' };
        const { data, error: err } = await supabase.from('comms_messages').insert(payload).select('id').single();
        if (err) throw err;
        setDraftId(data.id); setSavedAt(new Date());
        pendingRef.current = null;
        return data.id;
      }
      const { error: err } = await supabase.from('comms_messages').update(buildPayload({ orgId, userId: user.id, draft })).eq('id', draftId);
      if (err) throw err;
      setSavedAt(new Date());
      pendingRef.current = null;
      return draftId;
    } catch (e) { setError(e); return null; }
    finally { setBusy(false); }
  }, [draftId, orgId, user?.id]);

  const save = useCallback((draft) => {
    pendingRef.current = draft;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { flush(); }, DEBOUNCE_MS);
  }, [flush]);

  const submitSend = useCallback(async (draft) => {
    pendingRef.current = draft;
    const id = await flush();
    if (!id) return { error: error || new Error('Save failed.') };
    const { error: err } = await supabase.from('comms_messages').update({ status: 'queued' }).eq('id', id);
    if (err) return { error: err };
    return { id };
  }, [flush, error]);

  const submitSchedule = useCallback(async (draft, scheduledFor) => {
    pendingRef.current = draft;
    const id = await flush();
    if (!id) return { error: error || new Error('Save failed.') };
    const { error: err } = await supabase.from('comms_messages').update({ status: 'scheduled', scheduled_for: scheduledFor }).eq('id', id);
    if (err) return { error: err };
    return { id };
  }, [flush, error]);

  const discard = useCallback(async () => {
    if (!draftId) return { ok: true };
    const { error: err } = await supabase.from('comms_messages').update({ status: 'archived' }).eq('id', draftId);
    if (err) return { error: err };
    return { ok: true };
  }, [draftId]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { draftId, savedAt, busy, error, save, flush, submitSend, submitSchedule, discard };
}
