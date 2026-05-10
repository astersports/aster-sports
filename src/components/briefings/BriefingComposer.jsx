// Wave 3.11 follow-up — unified BriefingComposer. 3-step wizard
// (kind → anchor+audience → body+signoff) with live preview. Wires
// to useBriefingDraft for auto-save and dispatch.
//
// Wave 4.1b §1-§6 — Bug A (anchor_id required for event/team/tournament),
// Bug B (pilot mode audience copy + chip), Bug C (kind-null guard +
// HYDRATE jumps to earliest invalid step), §6.G (schedule picker
// visible at all steps), §6.I (save-status pill in header).

import { useEffect, useMemo, useReducer, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import FullScreenForm from '../shared/FullScreenForm';
import { useToast } from '../../context/useToast';
import { useAuth } from '../../context/AuthContext';
import { useOrgSettings } from '../../hooks/useOrgSettings';
import { useDigestRecipients } from '../../hooks/useDigestRecipients';
import { useOrgStaff } from '../../hooks/useOrgStaff';
import { useBriefingDraft } from '../../hooks/useBriefingDraft';
import { supabase } from '../../lib/supabase';
import { canAdvance, composerReducer, INITIAL_STATE } from './composerReducer';
import { KIND_METADATA } from '../../lib/briefings/kindMetadata';
import { computeAudience } from '../../lib/briefings/audience';
import StepKindPicker from './StepKindPicker';
import StepAnchorAudience from './StepAnchorAudience';
import StepBodySignoff from './StepBodySignoff';
import PreviewPanel from './PreviewPanel';
import ScheduleForLaterPicker from './ScheduleForLaterPicker';
import SaveStatusPill from './SaveStatusPill';
import { submitBriefing } from './composerSubmit';

const STEPS = ['Kind', 'Audience', 'Body'];

function buildInitial({ initialKind, initialAnchorKind, initialAnchorId, initialKindFilter }) {
  const base = { ...INITIAL_STATE, kindFilter: initialKindFilter?.length ? initialKindFilter : null };
  if (!initialKind && !initialAnchorId) return base;
  const meta = KIND_METADATA[initialKind] || {};
  return { ...base, step: initialAnchorId ? 2 : 1, kind: initialKind || null, anchor_kind: initialAnchorKind || meta.defaultAnchorKind || null, anchor_id: initialAnchorId || null, audience_type: meta.defaultAudienceType || null };
}

function fmtSchedule(iso) {
  return new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function BriefingComposer({ onClose, initialKind, initialAnchorKind, initialAnchorId, initialDraftId, initialKindFilter }) {
  const { orgId } = useAuth();
  const { showToast } = useToast();
  const { pilotModeEnabled } = useOrgSettings(orgId);
  const { recipients } = useDigestRecipients({ orgId, pilotOnly: pilotModeEnabled });
  const { recipients: recipientsTotal } = useDigestRecipients({ orgId, pilotOnly: false });
  const { staff: coaches } = useOrgStaff(orgId);
  const draft = useBriefingDraft(initialDraftId);
  const [state, dispatch] = useReducer(composerReducer, buildInitial({ initialKind, initialAnchorKind, initialAnchorId, initialKindFilter }));
  const [busy, setBusy] = useState(false);

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

  // Bug C — kind-null guard. If state lands on Step 3 without a kind,
  // bounce back to Step 1 with a toast so admins can pick first.
  useEffect(() => {
    if (state.step === 3 && !state.kind) {
      dispatch({ type: 'JUMP_TO', step: 1 });
      showToast('Pick a kind to continue.', 'info');
    }
  }, [state.step, state.kind, showToast]);

  useEffect(() => {
    if (!state.kind || state.step < 2) return;
    draft.save({ kind: state.kind, anchor_kind: state.anchor_kind, anchor_id: state.anchor_id, audience_type: state.audience_type, audience_filter: state.audience_filter, content_sections: { body: state.body }, signoff_message: state.signoff_message });
  }, [state.kind, state.anchor_kind, state.anchor_id, state.audience_type, state.audience_filter, state.body, state.signoff_message, state.step, draft]);

  const audience = useMemo(() => computeAudience({
    recipientsFiltered: recipients, recipientsTotal,
    audienceType: state.audience_type, audienceFilter: state.audience_filter,
    anchorId: state.anchor_id, pilotModeOn: pilotModeEnabled,
  }), [recipients, recipientsTotal, state.audience_type, state.audience_filter, state.anchor_id, pilotModeEnabled]);

  const onSend = async () => {
    setBusy(true);
    try {
      const r = await submitBriefing({ state, draft, orgId, recipients, coaches, pilotModeEnabled });
      if (r.audienceCount != null) showToast(state.test_only ? 'Test sent to admin@.' : `Sent to ${r.audienceCount} ${r.audienceCount === 1 ? 'family' : 'families'}.`, 'success');
      else if (r.scheduledFor) showToast(`Scheduled for ${fmtSchedule(r.scheduledFor)}.`, 'success');
      else showToast(state.test_only ? 'Test sent to admin@.' : `Sent to ${audience.filtered ?? 'recipients'}.`, 'success');
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
          <span style={{ marginLeft: 'auto' }}><SaveStatusPill busy={draft.busy} savedAt={draft.savedAt} hasKind={!!state.kind} /></span>
        </div>
        <ScheduleForLaterPicker mode={state.send_mode === 'scheduled' ? 'schedule_for_later' : 'send_now'} scheduledFor={state.scheduled_for} onChange={(payload) => dispatch({ type: 'SET_SCHEDULE', payload })} />
        {state.step === 1 && <StepKindPicker visibleKinds={state.kindFilter} onPick={(kind, meta) => dispatch({ type: 'SET_KIND', kind, anchor_kind: state.anchor_kind || meta.defaultAnchorKind, audience_type: state.audience_type || meta.defaultAudienceType, defaultBody: {} }) || dispatch({ type: 'GO_FORWARD' })} />}
        {state.step === 2 && <StepAnchorAudience state={state} dispatch={dispatch} audience={audience} />}
        {state.step === 3 && <StepBodySignoff state={state} dispatch={dispatch} audience={audience} onSend={onSend} onSaveDraft={() => { showToast('Draft saved.', 'success'); onClose?.(); }} onCancel={onClose} busy={busy} />}
        {state.step < 3 && (
          <button type="button" disabled={!canAdvance(state)} onClick={() => dispatch({ type: 'GO_FORWARD' })} className="sf-press" style={{ minHeight: 44, borderRadius: 10, border: 'none', backgroundColor: canAdvance(state) ? 'var(--em-accent)' : 'var(--em-bg-tertiary)', color: canAdvance(state) ? 'var(--em-text-inverse)' : 'var(--em-text-tertiary)', fontSize: 15, fontWeight: 600, cursor: canAdvance(state) ? 'pointer' : 'default' }}>
            Next
          </button>
        )}
        {state.step === 3 && <PreviewPanel state={state} families={recipients} coaches={coaches} recipientCount={audience.filtered} />}
      </div>
    </FullScreenForm>
  );
}
