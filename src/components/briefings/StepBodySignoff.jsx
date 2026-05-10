// Wave 3.11 follow-up — step 3 host. Kind-branched body editor +
// shared signoff textarea + send options.
//
// Wave 4.1b §6.G — ScheduleForLaterPicker lifted to BriefingComposer
// parent (visible all steps). Wave 4.1b §2 — pilot mode chip + audience
// copy come in via the `audience` prop (computeAudience output).

import { lazy, Suspense, useMemo } from 'react';
import { Send } from 'lucide-react';
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

const btnPrimary = { width: '100%', minHeight: 44, borderRadius: 10, backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 15, fontWeight: 600, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' };
const btnGhost = { width: '100%', minHeight: 40, borderRadius: 10, backgroundColor: 'transparent', color: 'var(--em-text-secondary)', fontSize: 14, fontWeight: 500, border: '1px solid var(--em-border-default)', cursor: 'pointer' };

export default function StepBodySignoff({ state, dispatch, audience, hasParentTournament, onSend, onSaveDraft, onCancel, busy }) {
  const Body = BODY_LAZY[state.kind] || BODY_LAZY.custom_message;
  const isScheduled = state.send_mode === 'scheduled';
  const a = audience || { filtered: null, total: null, mode: 'standard', pilotModeOn: false };
  const recipientCount = a.filtered;
  const scheduleInvalid = useMemo(() => {
    if (!isScheduled) return false;
    if (!state.scheduled_for) return true;
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return new Date(state.scheduled_for).getTime() - now < 5 * 60 * 1000;
  }, [isScheduled, state.scheduled_for]);
  // Bug B: in pilot_zero mode, send is blocked even with test_only off.
  const pilotZeroBlock = a.mode === 'pilot_zero' && !state.test_only;
  const sendBlocked = busy || (recipientCount === 0 && !state.test_only) || scheduleInvalid || pilotZeroBlock;
  const sendLabel = isScheduled
    ? 'Schedule send'
    : (state.test_only
      ? 'Send test to admin@'
      : `Send to ${recipientCount ?? '…'} ${recipientCount === 1 ? 'family' : 'families'}`);
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
      <button type="button" onClick={onSend} disabled={sendBlocked} className="sf-press" style={{ ...btnPrimary, opacity: sendBlocked ? 0.5 : 1 }}>
        <Send size={16} strokeWidth={1.75} /> {busy ? 'Sending…' : sendLabel}
      </button>
      <button type="button" onClick={onSaveDraft} className="sf-press" style={btnGhost}>Save draft</button>
      <button type="button" onClick={onCancel} className="sf-press" style={btnGhost}>Cancel</button>
    </div>
  );
}
