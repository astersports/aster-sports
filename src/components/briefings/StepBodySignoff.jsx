// Wave 3.11 follow-up — step 3 host. Kind-branched body editor +
// shared signoff textarea + send options.

import { lazy, Suspense, useMemo } from 'react';
import { Send } from 'lucide-react';
import { labelStyle, textareaStyle } from './bodies/_styles';
import TemplatePicker from './TemplatePicker';
import ScheduleForLaterPicker from './ScheduleForLaterPicker';

const BODY_LAZY = {
  weekly_digest: lazy(() => import('./bodies/WeeklyDigestBody.jsx')),
  schedule_change: lazy(() => import('./bodies/ScheduleChangeBody.jsx')),
  game_recap: lazy(() => import('./bodies/GameRecapBody.jsx')),
  tournament_prelim: lazy(() => import('./bodies/TournamentPrelimBody.jsx')),
  tournament_recap: lazy(() => import('./bodies/TournamentRecapBody.jsx')),
  announcement: lazy(() => import('./bodies/AnnouncementBody.jsx')),
  rsvp_nudge: lazy(() => import('./bodies/RsvpNudgeBody.jsx')),
  custom_message: lazy(() => import('./bodies/CustomMessageBody.jsx')),
};

const btnPrimary = { width: '100%', minHeight: 44, borderRadius: 10, backgroundColor: 'var(--em-accent)', color: 'var(--em-text-inverse)', fontSize: 15, fontWeight: 600, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' };
const btnGhost = { width: '100%', minHeight: 40, borderRadius: 10, backgroundColor: 'transparent', color: 'var(--em-text-secondary)', fontSize: 14, fontWeight: 500, border: '1px solid var(--em-border-default)', cursor: 'pointer' };

export default function StepBodySignoff({ state, dispatch, recipientCount, onSend, onSaveDraft, onCancel, busy }) {
  const Body = BODY_LAZY[state.kind] || BODY_LAZY.custom_message;
  const isScheduled = state.send_mode === 'scheduled';
  // Memoize on scheduled_for so Date.now() at render is captured once
  // per relevant change (admin updates the picker, validation refreshes).
  const scheduleInvalid = useMemo(() => {
    if (!isScheduled) return false;
    if (!state.scheduled_for) return true;
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return new Date(state.scheduled_for).getTime() - now < 5 * 60 * 1000;
  }, [isScheduled, state.scheduled_for]);
  const sendBlocked = busy || (recipientCount === 0 && !state.test_only) || scheduleInvalid;
  const sendLabel = isScheduled
    ? 'Schedule send'
    : (state.test_only
      ? 'Send test to admin@'
      : `Send to ${recipientCount ?? '…'} ${recipientCount === 1 ? 'family' : 'families'}`);

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
        <Body value={state.body} onChange={(patch) => dispatch({ type: 'UPDATE_BODY', patch })} />
      </Suspense>
      <label>
        <span style={labelStyle}>Signoff message (optional)</span>
        <textarea value={state.signoff_message} onChange={(e) => dispatch({ type: 'UPDATE_SIGNOFF', value: e.target.value })} style={{ ...textareaStyle, minHeight: 80 }} placeholder="Add a closing note…" />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--em-text-secondary)' }}>
        <input type="checkbox" checked={state.test_only} onChange={(e) => dispatch({ type: 'TOGGLE_TEST', value: e.target.checked })} />
        Send test to admin@ only (recommended first)
      </label>
      <ScheduleForLaterPicker
        mode={state.send_mode === 'scheduled' ? 'schedule_for_later' : 'send_now'}
        scheduledFor={state.scheduled_for}
        onChange={(payload) => dispatch({ type: 'SET_SCHEDULE', payload })}
      />
      <div style={{ fontSize: 12, color: 'var(--em-text-tertiary)' }}>
        Audience: {recipientCount ?? '…'} {recipientCount === 1 ? 'family' : 'families'}
      </div>
      <button type="button" onClick={onSend} disabled={sendBlocked} className="sf-press" style={{ ...btnPrimary, opacity: sendBlocked ? 0.5 : 1 }}>
        <Send size={16} strokeWidth={1.75} /> {busy ? 'Sending…' : sendLabel}
      </button>
      <button type="button" onClick={onSaveDraft} className="sf-press" style={btnGhost}>Save draft</button>
      <button type="button" onClick={onCancel} className="sf-press" style={btnGhost}>Cancel</button>
    </div>
  );
}
