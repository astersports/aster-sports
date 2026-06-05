// BriefingComposer — one-screen composer (PR-A compose simplification). Pick a
// kind, then audience + body + options + preview + send render on a single
// scroll (no step gating), via ComposerSections. Auto-saves via useBriefingDraft.
// Reached from Radar (review a proposal, or + New). Bug fixes locked in wave
// 4.1b + 4.2-A-8d (weekly_digest short-circuit).

import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useDraftUrlSync } from '../../hooks/useDraftUrlSync';
import { useGameRecapTournament } from '../../hooks/useGameRecapTournament';
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
import { composerReducer } from './composerReducer';
import { KIND_METADATA } from '../../lib/briefings/kindMetadata';
import { computeAudience } from '../../lib/briefings/audience';
import { translateBriefingError } from '../../lib/briefings/translateBriefingError';
import InlineKindChips from './InlineKindChips';
import { MANUAL_KINDS } from '../../lib/briefings/composeKinds';
import ComposerSections from './ComposerSections';
import { submitBriefing } from './composerSubmit';
import { friendlySendError } from '../../lib/briefings/sendErrorMessage';
import { sendWeeklyDigestFromWizard } from '../../lib/briefings/sendWeeklyDigestFromWizard';
import { buildInitial, fmtSchedule, hasAuthoredContent } from './briefingComposerHelpers';

export default function BriefingComposer({ onClose, initialKind, initialAnchorKind, initialAnchorId, initialDraftId, initialKindFilter }) {
  const { orgId } = useAuth();
  const { showToast } = useToast();
  const { pilotModeEnabled, pilotTestRecipientEmail } = useOrgSettings(orgId);
  const { recipients, loading: recipientsLoading } = useDigestRecipients({ orgId, pilotOnly: pilotModeEnabled });
  const { recipients: recipientsTotal } = useDigestRecipients({ orgId, pilotOnly: false });
  const { staff: coaches } = useOrgStaff(orgId);
  const draft = useBriefingDraft(initialDraftId);
  // ?draft=<id> URL sync so a PWA cold-launch resumes an in-progress draft.
  useDraftUrlSync(draft.draftId);
  const [state, dispatch] = useReducer(composerReducer, buildInitial({ initialKind, initialAnchorKind, initialAnchorId, initialKindFilter }));
  const [busy, setBusy] = useState(false);
  const digest = useWizardDigestData({ orgId, enabled: state.kind === 'weekly_digest' });
  useResetOnOrgChange(orgId, dispatch); // May 16 audit P2 #9 — prevent cross-org reducer-state bleed

  useEffect(() => {
    if (state.kind || !state.kindFilter || state.kindFilter.length !== 1) return;
    const [only] = state.kindFilter;
    const meta = KIND_METADATA[only] || {};
    Promise.resolve().then(() => {
      dispatch({ type: 'SET_KIND', kind: only, anchor_kind: state.anchor_kind || meta.defaultAnchorKind, audience_type: state.audience_type || meta.defaultAudienceType });
    });
  }, [state.kindFilter, state.kind, state.anchor_kind, state.audience_type]);

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

  useEffect(() => {
    if (!state.kind) return;
    // Only persist once content has been authored (or a draft row already
    // exists, so later edits — including clearing a field — keep saving).
    if (!draft.draftId && !hasAuthoredContent({ body: state.body, signoff_message: state.signoff_message })) return;
    draft.save({ kind: state.kind, anchor_kind: state.anchor_kind, anchor_id: state.anchor_id, audience_type: state.audience_type, audience_filter: state.audience_filter, content_sections: { body: state.body }, signoff_message: state.signoff_message });
  }, [state.kind, state.anchor_kind, state.anchor_id, state.audience_type, state.audience_filter, state.body, state.signoff_message, draft]);

  const audience = useMemo(() => computeAudience({
    recipientsFiltered: recipients, recipientsTotal,
    audienceType: state.audience_type, audienceFilter: state.audience_filter,
    anchorId: state.anchor_id, pilotModeOn: pilotModeEnabled,
  }), [recipients, recipientsTotal, state.audience_type, state.audience_filter, state.anchor_id, pilotModeEnabled]);

  // game_recap's league/bracket CTA shows only when the anchor event has a
  // parent tournament (stale-anchor-guarded lookup).
  const hasParentTournament = useGameRecapTournament(state);

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
    // DEF-8b friendlySendError handles NoRecipientsError; Meta/B5.1
    // translateBriefingError handles DB-class errors (23505/23514/etc.)
    // and falls back to the message or the generic friendly default.
    } catch (e) { showToast(friendlySendError(e) || translateBriefingError(e), 'error'); }
    finally { setBusy(false); }
  };

  // wizardSupported:false (academy_callup) renders a redirect card in the body
  // (no audience/options/send) — ComposerSections gates on `blocked`.
  const wizardBlocked = !!state.kind && KIND_METADATA[state.kind]?.wizardSupported === false;
  // Inline kind chips show for "+ New" (no kind) and the 5 manual kinds (switch
  // among them). A hydrated proposal of an auto kind has no chips (kind fixed).
  const showChips = !state.kind || MANUAL_KINDS.includes(state.kind);
  return (
    <FullScreenForm open onClose={onClose} title={state.kind ? `Compose · ${KIND_METADATA[state.kind]?.label || ''}` : 'New briefing'}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {showChips && (
          <InlineKindChips
            selected={state.kind}
            onPick={(kind, meta) => dispatch({ type: 'SET_KIND', kind, anchor_kind: state.anchor_kind || meta.defaultAnchorKind, audience_type: state.audience_type || meta.defaultAudienceType, defaultBody: {} })}
          />
        )}
        {!state.kind && (
          <p style={{ fontSize: 13, color: 'var(--as-text-tertiary)', padding: '4px 2px', margin: 0 }}>Pick a kind above to start.</p>
        )}
        {state.kind && (
          <ComposerSections
            state={state} dispatch={dispatch} audience={audience}
            recipients={recipients} recipientsLoading={recipientsLoading} coaches={coaches}
            pilotTestRecipientEmail={pilotTestRecipientEmail} pilotModeEnabled={pilotModeEnabled}
            hasParentTournament={hasParentTournament} blocked={wizardBlocked}
            onSend={onSend} sending={busy}
            onSaveDraft={() => { showToast('Draft saved.', 'success'); onClose?.(); }} onCancel={onClose}
          />
        )}
      </div>
    </FullScreenForm>
  );
}
