// Wave 3.11 follow-up — unified BriefingComposer. 3-step wizard
// (kind → anchor+audience → body+signoff) with live preview. Wires
// to useBriefingDraft for auto-save and dispatch.
//
// Pilot mode + dispatch path are inherited from send-tournament-message
// v13. We do NOT special-case test mode here — the edge function and
// the send pipeline (digestSend / scheduleChangeSend) handle it.

import { useEffect, useMemo, useReducer, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import FullScreenForm from '../shared/FullScreenForm';
import { useToast } from '../../context/useToast';
import { useAuth } from '../../context/AuthContext';
import { useOrgSettings } from '../../hooks/useOrgSettings';
import { useDigestRecipients } from '../../hooks/useDigestRecipients';
import { useOrgStaff } from '../../hooks/useOrgStaff';
import { useBriefingDraft } from '../../hooks/useBriefingDraft';
import { compose } from '../../lib/engine/composer';
import { sendRsvpNudge } from '../../lib/rsvpNudgeSend';
import { supabase } from '../../lib/supabase';
import { canAdvance, composerReducer, INITIAL_STATE } from './composerReducer';
import { KIND_METADATA } from '../../lib/briefings/kindMetadata';
import StepKindPicker from './StepKindPicker';
import StepAnchorAudience from './StepAnchorAudience';
import StepBodySignoff from './StepBodySignoff';
import PreviewPanel from './PreviewPanel';

const STEPS = ['Kind', 'Audience', 'Body'];

function buildInitial({ initialKind, initialAnchorKind, initialAnchorId, initialKindFilter }) {
  const base = { ...INITIAL_STATE, kindFilter: initialKindFilter?.length ? initialKindFilter : null };
  if (!initialKind && !initialAnchorId) return base;
  const meta = KIND_METADATA[initialKind] || {};
  return { ...base, step: initialAnchorId ? 2 : 1, kind: initialKind || null, anchor_kind: initialAnchorKind || meta.defaultAnchorKind || null, anchor_id: initialAnchorId || null, audience_type: meta.defaultAudienceType || null };
}

export default function BriefingComposer({ onClose, initialKind, initialAnchorKind, initialAnchorId, initialDraftId, initialKindFilter }) {
  const { orgId } = useAuth();
  const { showToast } = useToast();
  const { pilotModeEnabled } = useOrgSettings(orgId);
  const { recipients } = useDigestRecipients({ orgId, pilotOnly: pilotModeEnabled });
  const { staff: coaches } = useOrgStaff(orgId);
  const draft = useBriefingDraft(initialDraftId);
  const [state, dispatch] = useReducer(composerReducer, buildInitial({ initialKind, initialAnchorKind, initialAnchorId, initialKindFilter }));
  const [busy, setBusy] = useState(false);

  // Auto-advance step 1 when the kind filter narrows to exactly one
  // kind and admin hasn't picked yet. react-hooks v7: wrap dispatch
  // in Promise.resolve so the effect doesn't trigger setState
  // synchronously during render.
  useEffect(() => {
    if (state.kind || !state.kindFilter || state.kindFilter.length !== 1 || state.step !== 1) return undefined;
    const [only] = state.kindFilter;
    const meta = KIND_METADATA[only] || {};
    Promise.resolve().then(() => {
      dispatch({ type: 'SET_KIND', kind: only, anchor_kind: state.anchor_kind || meta.defaultAnchorKind, audience_type: state.audience_type || meta.defaultAudienceType });
      dispatch({ type: 'GO_FORWARD' });
    });
    return undefined;
  }, [state.kindFilter, state.kind, state.step, state.anchor_kind, state.audience_type]);

  // Hydrate existing draft
  useEffect(() => {
    let cancelled = false;
    if (!initialDraftId) return undefined;
    Promise.resolve().then(async () => {
      const { data } = await supabase.from('comms_messages').select('*').eq('id', initialDraftId).maybeSingle();
      if (cancelled || !data) return;
      dispatch({ type: 'HYDRATE_DRAFT', payload: { kind: data.kind, anchor_kind: data.anchor_kind, anchor_id: data.anchor_id, audience_type: data.audience_type, audience_filter: data.audience_filter, body: data.content_sections?.body || {}, signoff_message: data.signoff_message || '', draft_id: data.id } });
    });
    return () => { cancelled = true; };
  }, [initialDraftId]);

  // Auto-save on every state change after step 2
  useEffect(() => {
    if (!state.kind || state.step < 2) return;
    draft.save({ kind: state.kind, anchor_kind: state.anchor_kind, anchor_id: state.anchor_id, audience_type: state.audience_type, audience_filter: state.audience_filter, content_sections: { body: state.body }, signoff_message: state.signoff_message });
  }, [state.kind, state.anchor_kind, state.anchor_id, state.audience_type, state.audience_filter, state.body, state.signoff_message, state.step, draft]);

  const recipientCount = useMemo(() => {
    if (!recipients) return null;
    if (state.audience_type === 'org_all') return recipients.length;
    if (state.audience_type === 'team') return recipients.filter((r) => (r.team_ids || []).includes(state.anchor_id)).length;
    return recipients.length;
  }, [recipients, state.audience_type, state.anchor_id]);

  const onSend = async () => {
    setBusy(true);
    try {
      // Wave 4.0: rsvp_nudge has its own send pipeline (mints per-player
      // tokens before dispatch). Route here, skip the generic compose path.
      if (state.kind === 'rsvp_nudge' && state.anchor_kind === 'event' && state.anchor_id) {
        const { data: ev } = await supabase.from('events').select('id,title,start_at,location,team_id').eq('id', state.anchor_id).maybeSingle();
        const r = await sendRsvpNudge({ orgId, event: ev, body: state.body, signoffMessage: state.signoff_message, coaches, recipients, pilotModeEnabled, testOnly: state.test_only });
        if (r?.error) throw r.error;
        showToast(state.test_only ? 'Test sent to admin@.' : `Sent to ${r.audienceCount ?? 'recipients'} ${r.audienceCount === 1 ? 'family' : 'families'}.`, 'success');
        onClose?.();
        return;
      }
      // Wave 3.16.1: resolve tourney_url from anchor so the kind
      // composer can emit a CTA when body.tourney_link_label is set.
      let tourneyUrl = null;
      if (state.anchor_kind === 'tournament' && state.anchor_id) {
        const { data: tRow } = await supabase.from('tournaments').select('tourney_url').eq('id', state.anchor_id).maybeSingle();
        tourneyUrl = tRow?.tourney_url || null;
      } else if (state.anchor_kind === 'event' && state.anchor_id && state.kind === 'game_recap') {
        const { data: eRow } = await supabase.from('events').select('tournament_id, tournaments(tourney_url)').eq('id', state.anchor_id).maybeSingle();
        tourneyUrl = eRow?.tournaments?.tourney_url || null;
      }
      const composed = compose({ kind: state.kind, data: { ...state.body, tourney_url: tourneyUrl, signoff_message: state.signoff_message, coaches } });
      const draftPayload = { kind: state.kind, anchor_kind: state.anchor_kind, anchor_id: state.anchor_id, audience_type: state.audience_type, audience_filter: state.audience_filter, content_sections: { body: state.body, sections: composed.sections }, signoff_message: state.signoff_message, subject: composed.subject, body_html: composed.html, body_plain: composed.plainText };
      if (state.send_mode === 'scheduled' && state.scheduled_for) {
        const r = await draft.submitSchedule(draftPayload, state.scheduled_for);
        if (r?.error) throw r.error;
        showToast(`Scheduled for ${new Date(state.scheduled_for).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}.`, 'success');
        onClose?.();
        return;
      }
      const r = await draft.submitSend(draftPayload);
      if (r?.error) throw r.error;
      const dispatchInvoke = await supabase.functions.invoke('send-tournament-message', { body: { message_id: r.id } });
      if (dispatchInvoke.error) throw dispatchInvoke.error;
      showToast(state.test_only ? 'Test sent to admin@.' : `Sent to ${recipientCount ?? 'recipients'}.`, 'success');
      onClose?.();
    } catch (e) { showToast(e.message || "Looks like that didn't go through. Try again?", 'error'); }
    finally { setBusy(false); }
  };

  const stepIndex = state.step - 1;
  return (
    <FullScreenForm open onClose={onClose} title={`Compose · ${STEPS[stepIndex]}`}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--em-text-tertiary)' }}>
          {state.step > 1 && <button type="button" onClick={() => dispatch({ type: 'GO_BACK' })} className="sf-press" style={{ minHeight: 36, minWidth: 36, border: 'none', background: 'transparent', cursor: 'pointer' }}><ArrowLeft size={16} strokeWidth={1.75} /></button>}
          <span>{`Step ${state.step} of 3`}</span>
          {draft.savedAt && <span style={{ marginLeft: 'auto' }}>Saved {new Date(draft.savedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>}
        </div>
        {state.step === 1 && <StepKindPicker visibleKinds={state.kindFilter} onPick={(kind, meta) => dispatch({ type: 'SET_KIND', kind, anchor_kind: state.anchor_kind || meta.defaultAnchorKind, audience_type: state.audience_type || meta.defaultAudienceType, defaultBody: {} }) || dispatch({ type: 'GO_FORWARD' })} />}
        {state.step === 2 && <StepAnchorAudience state={state} dispatch={dispatch} />}
        {state.step === 3 && <StepBodySignoff state={state} dispatch={dispatch} recipientCount={recipientCount} onSend={onSend} onSaveDraft={() => { showToast('Draft saved.', 'success'); onClose?.(); }} onCancel={onClose} busy={busy} />}
        {state.step < 3 && (
          <button type="button" disabled={!canAdvance(state)} onClick={() => dispatch({ type: 'GO_FORWARD' })} className="sf-press" style={{ minHeight: 44, borderRadius: 10, border: 'none', backgroundColor: canAdvance(state) ? 'var(--em-accent)' : 'var(--em-bg-tertiary)', color: canAdvance(state) ? 'var(--em-text-inverse)' : 'var(--em-text-tertiary)', fontSize: 15, fontWeight: 600, cursor: canAdvance(state) ? 'pointer' : 'default' }}>
            Next
          </button>
        )}
        {state.step === 3 && <PreviewPanel state={state} families={recipients} coaches={coaches} recipientCount={recipientCount} />}
      </div>
    </FullScreenForm>
  );
}
