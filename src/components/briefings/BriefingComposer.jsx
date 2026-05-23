// Unified BriefingComposer 3-step wizard (kind → anchor+audience →
// body+signoff) with live preview. Auto-saves via useBriefingDraft.
// Bug fixes locked in wave 4.1b + 4.2-A-8d (weekly_digest short-circuit).

import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useResetOnOrgChange } from '../../hooks/useResetOnOrgChange';
import FullScreenForm from '../shared/FullScreenForm';
import { useToast } from '../../context/useToast';
import { useAuth } from '../../context/AuthContext';
import { useOrgSettings } from '../../hooks/useOrgSettings';
import { useDigestRecipients } from '../../hooks/useDigestRecipients';
import { useOrgStaff } from '../../hooks/useOrgStaff';
import { useBriefingDraft } from '../../hooks/useBriefingDraft';
import { useWizardDigestData } from '../../hooks/useWizardDigestData';
import { supabase } from '../../lib/supabase';
import { canAdvance, composerReducer } from './composerReducer';
import { KIND_METADATA } from '../../lib/briefings/kindMetadata';
import { computeAudience } from '../../lib/briefings/audience';
import StepKindPicker from './StepKindPicker';
import StepAnchorAudience from './StepAnchorAudience';
import StepBodySignoff from './StepBodySignoff';
import StepSendConfirm from './StepSendConfirm';
import PreviewPanel from './PreviewPanel';
import ScheduleForLaterPicker from './ScheduleForLaterPicker';
import WizardHeader from './WizardHeader';
import { submitBriefing } from './composerSubmit';
import { sendWeeklyDigestFromWizard } from '../../lib/briefings/sendWeeklyDigestFromWizard';
import { buildInitial, fmtSchedule, STEPS } from './briefingComposerHelpers';

export default function BriefingComposer({ onClose, initialKind, initialAnchorKind, initialAnchorId, initialDraftId, initialKindFilter }) {
  const { orgId } = useAuth();
  const { showToast } = useToast();
  const { pilotModeEnabled, pilotTestRecipientEmail } = useOrgSettings(orgId);
  const { recipients, loading: recipientsLoading } = useDigestRecipients({ orgId, pilotOnly: pilotModeEnabled });
  const { recipients: recipientsTotal } = useDigestRecipients({ orgId, pilotOnly: false });
  const { staff: coaches } = useOrgStaff(orgId);
  const draft = useBriefingDraft(initialDraftId);
  const [state, dispatch] = useReducer(composerReducer, buildInitial({ initialKind, initialAnchorKind, initialAnchorId, initialKindFilter }));
  const [busy, setBusy] = useState(false);
  const digest = useWizardDigestData({ orgId, enabled: state.kind === 'weekly_digest' });
  useResetOnOrgChange(orgId, dispatch); // May 16 audit P2 #9 — prevent cross-org reducer-state bleed

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

  const loadDraft = useCallback(async (id) => {
    if (!id) return;
    const { data, error } = await supabase.from('comms_messages').select('*').eq('id', id).maybeSingle();
    if (error || !data) return;
    dispatch({ type: 'HYDRATE_DRAFT', payload: { kind: data.kind, anchor_kind: data.anchor_kind, anchor_id: data.anchor_id, audience_type: data.audience_type, audience_filter: data.audience_filter, body: data.content_sections?.body || {}, signoff_message: data.signoff_message || '', draft_id: data.id } });
  }, []);
  useEffect(() => { if (initialDraftId) Promise.resolve().then(() => loadDraft(initialDraftId)); }, [initialDraftId, loadDraft]);

  // Wave 4.3-H: keep state.pilot_only in sync with org-level pilot
  // mode so preview-vs-send filters stay consistent (without this,
  // preview rendered 60 families while send filtered to 5 in pilot
  // orgs — anchorFromState in RESOLVER_REGISTRY reads this field).
  useEffect(() => {
    dispatch({ type: 'SET_PILOT_ONLY', value: !!pilotModeEnabled });
  }, [pilotModeEnabled]);

  // Bug C — kind-null guard. If state lands on Step 3 without a kind,
  // bounce back to Step 1 with a toast so admins can pick first.
  useEffect(() => {
    if (state.step === STEPS.length && !state.kind) {
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

  // GameRecapBody renders the league/bracket CTA field only when the
  // anchor event has a parent tournament. Raw lookup tagged with anchorId
  // so render-time derivation rejects stale results from a prior anchor.
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
  const hasParentTournament = state.kind === 'game_recap' && state.anchor_kind === 'event' && state.anchor_id && tournamentLookup?.anchorId === state.anchor_id && !!tournamentLookup?.tournamentId;

  const onSend = async () => {
    setBusy(true);
    try {
      const r = state.kind === 'weekly_digest'
        ? await sendWeeklyDigestFromWizard({ state, orgId, recipients, coaches, ...digest })
        : await submitBriefing({ state, draft, orgId, recipients, coaches, pilotModeEnabled });
      const audienceCount = r?.audienceCount ?? r?.composedFamilies;
      if (audienceCount != null) showToast(state.test_only ? 'Test sent to admin@.' : `Sent to ${audienceCount} ${audienceCount === 1 ? 'family' : 'families'}.`, 'success');
      else if (r?.scheduledFor) showToast(`Scheduled for ${fmtSchedule(r.scheduledFor)}.`, 'success');
      else showToast(state.test_only ? 'Test sent to admin@.' : `Sent to ${audience.filtered ?? 'recipients'}.`, 'success');
      onClose?.();
    } catch (e) { showToast(e.message || "Looks like that didn't go through. Try again?", 'error'); }
    finally { setBusy(false); }
  };

  const stepIndex = state.step - 1;
  // Wave 4.8 BUG (5/13 incident) — Next is a dead end when the kind's
  // wizardSupported flag is false (the Body step renders a redirect card).
  const wizardBlocked = !!state.kind && KIND_METADATA[state.kind]?.wizardSupported === false;
  const canGo = canAdvance(state) && !wizardBlocked;
  return (
    <FullScreenForm open onClose={onClose} title={`Compose · ${STEPS[stepIndex]}`}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <WizardHeader step={state.step} totalSteps={STEPS.length} onBack={() => dispatch({ type: 'GO_BACK' })} draft={draft} hasKind={!!state.kind} viewSentTo="/admin/briefings/history" />
        <ScheduleForLaterPicker mode={state.send_mode === 'scheduled' ? 'schedule_for_later' : 'send_now'} scheduledFor={state.scheduled_for} onChange={(payload) => dispatch({ type: 'SET_SCHEDULE', payload })} />
        {state.step === 1 && <StepKindPicker visibleKinds={state.kindFilter} onResume={(d) => loadDraft(d.id)} onPick={(kind, meta) => dispatch({ type: 'SET_KIND', kind, anchor_kind: state.anchor_kind || meta.defaultAnchorKind, audience_type: state.audience_type || meta.defaultAudienceType, defaultBody: {} }) || dispatch({ type: 'GO_FORWARD' })} />}
        {state.step === 2 && <StepAnchorAudience state={state} dispatch={dispatch} audience={audience} recipientsLoading={recipientsLoading} pilotTestRecipientEmail={pilotTestRecipientEmail} />}
        {state.step === 3 && <StepBodySignoff state={state} dispatch={dispatch} audience={audience} hasParentTournament={hasParentTournament} onSaveDraft={() => { showToast('Draft saved.', 'success'); onClose?.(); }} onCancel={onClose} />}
        {state.step === STEPS.length && <StepSendConfirm state={state} audience={audience} onSend={onSend} sending={busy} pilotModeEnabled={pilotModeEnabled} />}
        {state.step < STEPS.length && (
          <button type="button" disabled={!canGo} onClick={() => dispatch({ type: 'GO_FORWARD' })} className="sf-press" style={{ minHeight: 44, borderRadius: 10, border: 'none', backgroundColor: canGo ? 'var(--em-accent)' : 'var(--em-bg-tertiary)', color: canGo ? 'var(--em-text-inverse)' : 'var(--em-text-tertiary)', fontSize: 15, fontWeight: 600, cursor: canGo ? 'pointer' : 'default' }}>
            Next
          </button>
        )}
        {/* PreviewPanel intentionally stays bound to Step 3 (Body) only — Frank-locked decision. Step 4 (Send) is text-only confirmation. */}
        {state.step === 3 && <PreviewPanel state={state} families={recipients} coaches={coaches} recipientCount={audience.filtered} />}
      </div>
    </FullScreenForm>
  );
}
