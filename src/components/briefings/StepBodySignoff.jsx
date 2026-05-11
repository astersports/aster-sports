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

import { lazy, Suspense } from 'react';
import { labelStyle, textareaStyle } from './bodies/_styles';
import TemplatePicker from './TemplatePicker';
import PilotModeChip from './PilotModeChip';
import { audienceCopy } from '../../lib/briefings/audience';

const BODY_LAZY = {
  weekly_digest: lazy(() => import('./bodies/WeeklyDigestBody.jsx')),
  schedule_change: lazy(() => import('./bodies/ScheduleChangeBody.jsx')),
  game_recap: lazy(() => import('./bodies/GameRecapBody.jsx')),
  tournament_prelim: lazy(() => import('./bodies/TournamentPrelimBody.jsx')),
  tournament_recap: lazy(() => import('./bodies/TournamentRecapBody.jsx')),
  announcement: lazy(() => import('./bodies/AnnouncementBody.jsx')),
  rsvp_nudge: lazy(() => import('./bodies/RsvpNudgeBody.jsx')),
  // Wave 4.1d-2 §5 — G2 academy_callup_notice surfaced.
  academy_callup_notice: lazy(() => import('./bodies/AcademyCallupBody.jsx')),
  custom_message: lazy(() => import('./bodies/CustomMessageBody.jsx')),
};

const btnGhost = { width: '100%', minHeight: 40, borderRadius: 10, backgroundColor: 'transparent', color: 'var(--em-text-secondary)', fontSize: 14, fontWeight: 500, border: '1px solid var(--em-border-default)', cursor: 'pointer' };

export default function StepBodySignoff({ state, dispatch, audience, hasParentTournament, onSaveDraft, onCancel }) {
  const Body = BODY_LAZY[state.kind] || BODY_LAZY.custom_message;
  const a = audience || { filtered: null, total: null, mode: 'standard', pilotModeOn: false };
  const showChip = a.pilotModeOn && (a.mode === 'pilot_zero' || a.mode === 'pilot_partial');

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
      <Suspense fallback={<div style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>Loading editor…</div>}>
        <Body value={state.body} onChange={(patch) => dispatch({ type: 'UPDATE_BODY', patch })}
          anchorId={state.anchor_id} audienceFilter={state.audience_filter}
          hasParentTournament={hasParentTournament}
          onAudienceChange={(audience_filter) => dispatch({ type: 'SET_AUDIENCE', audience_type: state.audience_type, audience_filter })} />
      </Suspense>
      <label>
        <span style={labelStyle}>Signoff message (optional)</span>
        <textarea value={state.signoff_message} onChange={(e) => dispatch({ type: 'UPDATE_SIGNOFF', value: e.target.value })} style={{ ...textareaStyle, minHeight: 80 }} placeholder="Add a closing note…" />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--em-text-secondary)' }}>
        <input type="checkbox" checked={state.test_only} onChange={(e) => dispatch({ type: 'TOGGLE_TEST', value: e.target.checked })} />
        Send test to admin@ only (recommended first)
      </label>
      {showChip && <div><PilotModeChip /></div>}
      <div style={{ fontSize: 12, color: a.mode === 'pilot_zero' ? 'var(--em-warning)' : 'var(--em-text-tertiary)', lineHeight: 1.4 }}>
        {audienceCopy(a)}
      </div>
      <button type="button" onClick={onSaveDraft} className="sf-press" style={btnGhost}>Save draft</button>
      <button type="button" onClick={onCancel} className="sf-press" style={btnGhost}>Cancel</button>
    </div>
  );
}
