// PR-A (compose simplification): the kind-chosen sections of the composer,
// rendered on ONE screen (no step gating). Reuses the existing step components
// as sections: anchor+audience, body+signoff, schedule, preview, send. The send
// path stays submitBriefing (via onSend from BriefingComposer).
//
// `blocked` (kind.wizardSupported === false, e.g. academy_callup) renders ONLY
// the body, whose redirect card points to the canonical EventDetail flow — no
// audience/options/send.

import StepAnchorAudience from './StepAnchorAudience';
import StepBodySignoff from './StepBodySignoff';
import StepSendConfirm from './StepSendConfirm';
import PreviewPanel from './PreviewPanel';
import ScheduleForLaterPicker from './ScheduleForLaterPicker';

export default function ComposerSections({
  state, dispatch, audience, recipients, recipientsLoading, coaches,
  pilotTestRecipientEmail, pilotModeEnabled, hasParentTournament, blocked,
  audienceResolving = false, onSend, sending, onSaveDraft, onCancel,
}) {
  const body = (
    <StepBodySignoff
      state={state} dispatch={dispatch} audience={audience}
      hasParentTournament={hasParentTournament} onSaveDraft={onSaveDraft} onCancel={onCancel}
    />
  );
  if (blocked) return body;

  return (
    <>
      <StepAnchorAudience
        state={state} dispatch={dispatch} audience={audience}
        recipientsLoading={recipientsLoading} pilotTestRecipientEmail={pilotTestRecipientEmail}
      />
      {body}
      <ScheduleForLaterPicker
        mode={state.send_mode === 'scheduled' ? 'schedule_for_later' : 'send_now'}
        scheduledFor={state.scheduled_for}
        onChange={(payload) => dispatch({ type: 'SET_SCHEDULE', payload })}
      />
      <PreviewPanel state={state} families={recipients} coaches={coaches} recipientCount={audience.filtered} />
      <StepSendConfirm state={state} audience={audience} onSend={onSend} sending={sending} pilotModeEnabled={pilotModeEnabled} audienceResolving={audienceResolving} />
    </>
  );
}
