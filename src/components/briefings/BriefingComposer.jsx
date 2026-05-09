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
import { supabase } from '../../lib/supabase';
import { canAdvance, composerReducer, INITIAL_STATE } from './composerReducer';
import { KIND_METADATA } from '../../lib/briefings/kindMetadata';
import StepKindPicker from './StepKindPicker';
import StepAnchorAudience from './StepAnchorAudience';
import StepBodySignoff from './StepBodySignoff';
import PreviewPanel from './PreviewPanel';

const STEPS = ['Kind', 'Audience', 'Body'];

function buildInitial(initialKind, initialAnchorKind, initialAnchorId) {
  if (!initialKind) return INITIAL_STATE;
  const meta = KIND_METADATA[initialKind] || {};
  return { ...INITIAL_STATE, step: initialAnchorId ? 2 : 1, kind: initialKind, anchor_kind: initialAnchorKind || meta.defaultAnchorKind, anchor_id: initialAnchorId || null, audience_type: meta.defaultAudienceType };
}

export default function BriefingComposer({ onClose, initialKind, initialAnchorKind, initialAnchorId, initialDraftId }) {
  const { orgId } = useAuth();
  const { showToast } = useToast();
  const { pilotModeEnabled } = useOrgSettings(orgId);
  const { recipients } = useDigestRecipients({ orgId, pilotOnly: pilotModeEnabled });
  const { staff: coaches } = useOrgStaff(orgId);
  const draft = useBriefingDraft(initialDraftId);
  const [state, dispatch] = useReducer(composerReducer, buildInitial(initialKind, initialAnchorKind, initialAnchorId));
  const [busy, setBusy] = useState(false);

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
      const composed = compose({ kind: state.kind, data: { ...state.body, signoff_message: state.signoff_message, coaches } });
      const r = await draft.submitSend({ kind: state.kind, anchor_kind: state.anchor_kind, anchor_id: state.anchor_id, audience_type: state.audience_type, audience_filter: state.audience_filter, content_sections: { body: state.body, sections: composed.sections }, signoff_message: state.signoff_message, subject: composed.subject, body_html: composed.html, body_plain: composed.plainText });
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
        {state.step === 1 && <StepKindPicker onPick={(kind, meta) => dispatch({ type: 'SET_KIND', kind, anchor_kind: meta.defaultAnchorKind, audience_type: meta.defaultAudienceType, defaultBody: {} }) || dispatch({ type: 'GO_FORWARD' })} />}
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
