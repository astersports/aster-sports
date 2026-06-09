// BriefingComposer — one-screen composer (PR-A compose simplification). Pick a
// kind, then audience + body + options + preview + send render on a single
// scroll (no step gating), via ComposerSections. Auto-saves via useBriefingDraft.
// Reached from Radar (review a proposal, or + New). Bug fixes locked in wave
// 4.1b + 4.2-A-8d (weekly_digest short-circuit).

import { useEffect, useMemo, useReducer, useState } from 'react';
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
import { useResolvedAudienceCount } from '../../hooks/useResolvedAudienceCount';
import { useLoadBriefingDraft } from '../../hooks/useLoadBriefingDraft';
import { useWizardDigestData } from '../../hooks/useWizardDigestData';
import { composerReducer } from './composerReducer';
import { KIND_METADATA } from '../../lib/briefings/kindMetadata';
import { reconcileAudienceForKind } from '../../lib/briefings/audienceReconcile';
import { computeAudience } from '../../lib/briefings/audience';
import { translateBriefingError } from '../../lib/briefings/translateBriefingError';
import InlineKindChips from './InlineKindChips';
import { MANUAL_KINDS } from '../../lib/briefings/composeKinds';
import ComposerSections from './ComposerSections';
import SaveStatusPill from './SaveStatusPill';
import { submitBriefing } from './composerSubmit';
import { friendlySendError } from '../../lib/briefings/sendErrorMessage';
import { sendWeeklyDigestFromWizard } from '../../lib/briefings/sendWeeklyDigestFromWizard';
import { buildInitial, fmtSchedule, hasAuthoredContent } from './briefingComposerHelpers';

export default function BriefingComposer({ onClose, initialKind, initialAnchorKind, initialAnchorId, initialDraftId, initialKindFilter }) {
  const { orgId } = useAuth();
  const { showToast } = useToast();
  const { pilotModeEnabled } = useOrgSettings(orgId);
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
    // Reconcile any anchor-prefilled audience (e.g. "Message this team")
    // against the kind being auto-selected — honor it only if valid.
    const aud = reconcileAudienceForKind(only, state.audience_type, state.audience_filter);
    Promise.resolve().then(() => {
      dispatch({ type: 'SET_KIND', kind: only, anchor_kind: state.anchor_kind || meta.defaultAnchorKind, audience_type: aud.audience_type, audience_filter: aud.audience_filter });
    });
  }, [state.kindFilter, state.kind, state.anchor_kind, state.audience_type, state.audience_filter]);

  useLoadBriefingDraft(initialDraftId, dispatch);

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

  // COMPOSE-FRONT P1: anchor/player audiences need an async lookup for their
  // recipient count — reuse the send pipeline's resolveAudience (AP #63).
  const { count: resolvedCount, resolving: audienceResolving } = useResolvedAudienceCount({ recipients, audienceType: state.audience_type, audienceFilter: state.audience_filter, anchorId: state.anchor_id });
  const audience = useMemo(() => computeAudience({
    recipientsFiltered: recipients, recipientsTotal, audienceType: state.audience_type,
    audienceFilter: state.audience_filter, anchorId: state.anchor_id, pilotModeOn: pilotModeEnabled, resolvedCount,
  }), [recipients, recipientsTotal, state.audience_type, state.audience_filter, state.anchor_id, pilotModeEnabled, resolvedCount]);

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
        {state.kind && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <SaveStatusPill busy={draft.busy} savedAt={draft.savedAt} error={draft.error} hasKind />
          </div>)}
        {showChips && (
          <InlineKindChips
            selected={state.kind}
            onPick={(kind, meta) => {
              // Entry point #2: honor a "Message this team" pre-fill only
              // when the chosen kind supports a team audience; otherwise
              // fall back to that kind's smart default (dropping the team).
              const aud = reconcileAudienceForKind(kind, state.audience_type, state.audience_filter);
              dispatch({ type: 'SET_KIND', kind, anchor_kind: state.anchor_kind || meta.defaultAnchorKind, audience_type: aud.audience_type, audience_filter: aud.audience_filter, defaultBody: {} });
            }}
          />
        )}
        {!state.kind && (
          <p style={{ fontSize: 13, color: 'var(--as-text-tertiary)', padding: '4px 2px', margin: 0 }}>Pick a kind above to start.</p>)}
        {state.kind && (
          <ComposerSections
            state={state} dispatch={dispatch} audience={audience}
            recipients={recipients} recipientsLoading={recipientsLoading} coaches={coaches}
            pilotModeEnabled={pilotModeEnabled}
            hasParentTournament={hasParentTournament} blocked={wizardBlocked}
            audienceResolving={audienceResolving} onSend={onSend} sending={busy}
            onSaveDraft={() => { showToast('Draft saved.', 'success'); onClose?.(); }} onCancel={onClose}
          />
        )}
      </div>
    </FullScreenForm>
  );
}
