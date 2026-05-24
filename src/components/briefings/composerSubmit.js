// Wave 4.2-A-8a — composerSubmit dispatches via RESOLVER_REGISTRY
// for the 4 calendar-anchored kinds that route through the main
// BriefingComposer flow (game_recap, tournament_prelim,
// tournament_recap, schedule_change).
//
// Wave 4.2-A-8b-a — those 4 kinds compose per-slice and queue via
// queueComposedMessages (per-recipient body_html_rendered). The
// wave-locked contract guarantees content_sections is invariant
// across slices for these 4 kinds, so fan-out is identical-bodied
// today; the architectural symmetry is the win. Free-form kinds
// (announcement, custom_message) keep the legacy single-body
// queueRecipients path.
//
// Other kinds:
//   weekly_digest: routes through DigestComposer.jsx -> digestSend
//                  (already on resolver pipeline). composerSubmit
//                  guards against accidental dispatch.
//   rsvp_nudge:    short-circuits to lib/rsvpNudgeSend.js, which
//                  migrated to RESOLVER_REGISTRY in wave 4.2-A-8b-b
//                  with per-kid mint_rsvp_token + substituteRsvpTokens.
//   academy_callup_notice: short-circuits to lib/academyCallupSend.js,
//                  which migrated to RESOLVER_REGISTRY in wave 4.2-A-8c
//                  with per-(player, guardian) mint_callup_token +
//                  substituteCallupTokens. Closes wave 4.2-A at 7/7
//                  calendar-anchored kinds on registry path.
//   announcement / custom_message: free-form, legacy compose path.

import { compose, renderSections, renderSectionsPlainText } from '../../lib/engine/composer';
import { sendRsvpNudge } from '../../lib/rsvpNudgeSend';
import { sendAcademyCallupNotice } from '../../lib/academyCallupSend';
import { supabase } from '../../lib/supabase';
import { resolveAudience } from '../../lib/briefings/recipientFilter';
import { queueRecipients } from '../../lib/briefings/queueRecipients';
import { queueComposedMessages } from '../../lib/briefings/queueComposedMessages';
import { getDispatchSendPath, NoRecipientsError, RESOLVER_REGISTRY } from '../../lib/engine/resolvers/registry';

const HTML_OPEN = '<div style="max-width:600px;margin:0 auto;background-color:#ffffff;font-family:Inter,system-ui,sans-serif;padding:0 0 24px 0;">';
const HTML_CLOSE = '</div>';

async function resolveTourneyUrl(state) {
  if (state.anchor_kind === 'tournament' && state.anchor_id) {
    const { data } = await supabase.from('tournaments').select('tourney_url').eq('id', state.anchor_id).maybeSingle();
    return data?.tourney_url || null;
  }
  if (state.anchor_kind === 'event' && state.anchor_id && state.kind === 'game_recap') {
    const { data } = await supabase.from('events').select('tournament_id, tournaments(tourney_url)').eq('id', state.anchor_id).maybeSingle();
    return data?.tournaments?.tourney_url || null;
  }
  return null;
}

async function resolveAndComposePerSlice(state) {
  const entry = RESOLVER_REGISTRY[state.kind];
  const anchor = entry.anchorFromState(state);
  const overrides = entry.overridesFromState(state);
  const { context, slices } = await entry.resolve(anchor, { supabase, now: new Date() });
  if (!slices.length) throw new NoRecipientsError(state.kind, anchor);
  const messages = slices.map((slice) => ({ slice, ...entry.compose(context, slice, overrides) }));
  const { subject, content_sections } = messages[0];
  const sample = {
    subject,
    html: HTML_OPEN + renderSections(content_sections) + HTML_CLOSE,
    plainText: renderSectionsPlainText(content_sections),
    sections: content_sections,
  };
  return { messages, sample };
}

async function composeLegacy(state, coaches) {
  const tourneyUrl = await resolveTourneyUrl(state);
  return compose({ kind: state.kind, data: { ...state.body, tourney_url: tourneyUrl, signoff_message: state.signoff_message, coaches } });
}

async function queueForDispatch({ messages, composed, state, recipients, messageId }) {
  if (messages) {
    return queueComposedMessages({ messageId, messages, testOnly: state.test_only });
  }
  const { teamIds, audience } = await resolveAudience({ recipients, audienceType: state.audience_type, audienceFilter: state.audience_filter, anchorId: state.anchor_id });
  return queueRecipients({ messageId, audience, composed, teamIds, testOnly: state.test_only });
}

export async function submitBriefing({ state, draft, recipients, coaches }) {
  if (state.kind === 'rsvp_nudge' && state.anchor_kind === 'event' && state.anchor_id) {
    const r = await sendRsvpNudge({ state, supabase, now: new Date() });
    if (r?.error) throw r.error;
    return { audienceCount: r.audienceCount };
  }
  if (state.kind === 'academy_callup_notice' && state.anchor_kind === 'event' && state.anchor_id) {
    const r = await sendAcademyCallupNotice({ state, supabase, now: new Date() });
    if (r?.error) throw r.error;
    return { audienceCount: r.audienceCount };
  }

  const sendPath = getDispatchSendPath(state.kind);
  if (sendPath === 'digestSend' || sendPath === 'rsvpNudgeSend' || sendPath === 'academyCallupSend') {
    throw new Error(`${state.kind} sends via ${sendPath} directly; should not reach composerSubmit.`);
  }

  let messages = null;
  let composed;
  if (sendPath === 'composerSubmit') {
    const r = await resolveAndComposePerSlice(state);
    messages = r.messages;
    composed = r.sample;
  } else {
    composed = await composeLegacy(state, coaches);
  }
  const payload = {
    kind: state.kind, anchor_kind: state.anchor_kind, anchor_id: state.anchor_id,
    audience_type: state.audience_type, audience_filter: state.audience_filter,
    content_sections: { body: state.body, sections: composed.sections },
    signoff_message: state.signoff_message,
    subject: composed.subject, body_html: composed.html, body_plain: composed.plainText,
  };
  if (state.send_mode === 'scheduled' && state.scheduled_for) {
    const r = await draft.submitSchedule(payload, state.scheduled_for);
    if (r?.error) throw r.error;
    const queued = await queueForDispatch({ messages, composed, state, recipients, messageId: r.id });
    return { scheduledFor: state.scheduled_for, audienceCount: queued.audienceCount };
  }
  const r = await draft.submitSend(payload);
  if (r?.error) throw r.error;
  const queued = await queueForDispatch({ messages, composed, state, recipients, messageId: r.id });
  const dispatchInvoke = await supabase.functions.invoke('send-tournament-message', { body: { message_id: r.id } });
  if (dispatchInvoke.error) throw dispatchInvoke.error;
  await supabase.from('comms_messages').update({ status: 'sent' }).eq('id', r.id);
  return { sent: true, audienceCount: queued.audienceCount };
}
