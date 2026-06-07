// Wave 3.11 follow-up — step 3 host. Kind-branched body editor +
// shared signoff textarea + send options.
//
// Wave 4.1b §6.G — ScheduleForLaterPicker lifted to BriefingComposer
// parent (visible all steps). Wave 4.1b §2 — pilot mode chip + audience
// copy come in via the `audience` prop (computeAudience output).
//
// Wave 4.4-B Session 5c — Send button removed. STEPS grew 3 → 4; the
// SEND CTA lives on Step 4 (StepSendConfirm). The wizard chrome's Next
// button now appears on Step 3 to advance to Step 4. onSend/busy props
// dropped from this component's signature.

import { lazy, Suspense, useState } from 'react';
import { labelStyle, textareaStyle } from './bodies/_styles';
import TemplatePicker from './TemplatePicker';
import AiDraftAnchored from './AiDraftAnchored';
import AiDraftFreeForm from './AiDraftFreeForm';
import PilotModeChip from './PilotModeChip';
import { audienceCopy } from '../../lib/briefings/audience';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const BODY_LAZY = {
  weekly_digest: lazy(() => import('./bodies/WeeklyDigestBody.jsx')),
  schedule_change: lazy(() => import('./bodies/ScheduleChangeBody.jsx')),
  game_recap: lazy(() => import('./bodies/GameRecapBody.jsx')),
  games_recap: lazy(() => import('./bodies/GamesRecapBody.jsx')),
  tournament_prelim: lazy(() => import('./bodies/TournamentPrelimBody.jsx')),
  tournament_recap: lazy(() => import('./bodies/TournamentRecapBody.jsx')),
  announcement: lazy(() => import('./bodies/AnnouncementBody.jsx')),
  rsvp_nudge: lazy(() => import('./bodies/RsvpNudgeBody.jsx')),
  // Wave 4.1d-2 §5 — G2 academy_callup_notice surfaced.
  academy_callup_notice: lazy(() => import('./bodies/AcademyCallupBody.jsx')),
  // Wave 5 PR 4c — coach_roundup body (coach picker + date range).
  coach_roundup: lazy(() => import('./bodies/CoachRoundupBody.jsx')),
  // Wave 5 PR 5c — family_guide body (parent picker + date range).
  family_guide: lazy(() => import('./bodies/FamilyGuideBody.jsx')),
  custom_message: lazy(() => import('./bodies/CustomMessageBody.jsx')),
};

const btnGhost = { width: '100%', minHeight: 40, borderRadius: 10, backgroundColor: 'transparent', color: 'var(--as-text-secondary)', fontSize: 14, fontWeight: 500, border: '1px solid var(--as-border-default)', cursor: 'pointer' };
const btnSuggest = { minHeight: 32, padding: '0 12px', borderRadius: 8, backgroundColor: 'var(--as-accent-soft)', color: 'var(--as-accent)', fontSize: 13, fontWeight: 600, border: '1px solid var(--as-accent)', cursor: 'pointer' };

// Wave 5 PR 3b — Only tournament_prelim has the structured anchor +
// schedule shape the suggest-briefing-closer edge function needs.
// Adding more kinds later = extend this set + add the resolver
// context the edge function looks up.
const SUGGEST_CLOSER_KINDS = new Set(['tournament_prelim']);

export default function StepBodySignoff({ state, dispatch, audience, hasParentTournament, onSaveDraft, onCancel }) {
  const Body = BODY_LAZY[state.kind] || BODY_LAZY.custom_message;
  const a = audience || { filtered: null, total: null, mode: 'standard', pilotModeOn: false };
  const showChip = a.pilotModeOn && (a.mode === 'pilot_zero' || a.mode === 'pilot_partial');
  const { orgId } = useAuth();
  const [suggesting, setSuggesting] = useState(false);
  const [suggestErr, setSuggestErr] = useState(null);
  const canSuggest = SUGGEST_CLOSER_KINDS.has(state.kind) && state.anchor_id && orgId;

  const onSuggestCloser = async () => {
    if (!canSuggest || suggesting) return;
    setSuggesting(true); setSuggestErr(null);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-briefing-closer', {
        body: { tournament_id: state.anchor_id, org_id: orgId },
      });
      if (data?.error) throw new Error(data.error);
      if (error) throw error;
      const text = data?.suggested_closer || '';
      if (text) dispatch({ type: 'UPDATE_SIGNOFF', value: text });
      else setSuggestErr('The model returned an empty closer. Try again or write one manually.');
    } catch (e) {
      setSuggestErr(e.message || String(e));
    } finally { setSuggesting(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <TemplatePicker
        kind={state.kind}
        currentTemplateId={state.activeTemplateId}
        onSelect={(template) => {
          dispatch({ type: 'SET_ACTIVE_TEMPLATE', payload: { templateId: template?.id || null } });
          if (template) dispatch({ type: 'UPDATE_BODY', patch: template.body });
        }}
      />
      <AiDraftAnchored state={state} dispatch={dispatch} />
      <AiDraftFreeForm state={state} dispatch={dispatch} />
      <Suspense fallback={<div style={{ fontSize: 13, color: 'var(--as-text-tertiary)' }}>Loading editor…</div>}>
        <Body value={state.body} onChange={(patch) => dispatch({ type: 'UPDATE_BODY', patch })}
          anchorId={state.anchor_id} audienceFilter={state.audience_filter}
          hasParentTournament={hasParentTournament}
          onAudienceChange={(audience_filter) => dispatch({ type: 'SET_AUDIENCE', audience_type: state.audience_type, audience_filter })} />
      </Suspense>
      <label>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={labelStyle}>Signoff message (optional)</span>
          {canSuggest && (
            <button type="button" onClick={onSuggestCloser} disabled={suggesting} className="as-press"
              style={{ ...btnSuggest, opacity: suggesting ? 0.6 : 1, cursor: suggesting ? 'wait' : 'pointer' }}>
              {suggesting ? 'Suggesting…' : 'Suggest closer'}
            </button>
          )}
        </div>
        <textarea value={state.signoff_message} onChange={(e) => dispatch({ type: 'UPDATE_SIGNOFF', value: e.target.value })} style={{ ...textareaStyle, minHeight: 80 }} placeholder="Add a closing note…" />
        {suggestErr && <div role="alert" aria-live="assertive" style={{ fontSize: 12, color: 'var(--as-danger)', marginTop: 4 }}>{suggestErr}</div>}
      </label>
      {showChip && <div><PilotModeChip /></div>}
      <div style={{ fontSize: 12, color: a.mode === 'pilot_zero' ? 'var(--as-warning)' : 'var(--as-text-tertiary)', lineHeight: 1.4 }}>
        {audienceCopy(a)}
      </div>
      <button type="button" onClick={onSaveDraft} className="as-press" style={btnGhost}>Save draft</button>
      <button type="button" onClick={onCancel} className="as-press" style={btnGhost}>Cancel</button>
    </div>
  );
}
