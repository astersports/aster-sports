// Wave 4.2-A-8a — composerSubmit dispatches via RESOLVER_REGISTRY
// for the 4 calendar-anchored kinds that route through the main
// BriefingComposer flow (game_recap, tournament_prelim,
// tournament_recap, schedule_change).
//
// Other kinds:
//   weekly_digest: routes through DigestComposer.jsx -> digestSend
//                  (already on resolver pipeline). composerSubmit
//                  guards against accidental dispatch.
//   rsvp_nudge:    short-circuits to lib/rsvpNudgeSend.js (per-
//                  recipient mint_rsvp_token + per-recipient compose).
//                  Migration to registry deferred to 4.2-A-8b.
//   academy_callup_notice: blocked -- callup token mint
//                  infrastructure pending in wave 4.3. composerSubmit
//                  raises NoCallupTokenInfrastructureError.
//   announcement / custom_message: free-form, legacy compose path.
//
// 4.2-A-8a uses slices[0]'s subject + content_sections as the SINGLE-
// BODY message handed to queueRecipients. content_sections is
// structurally identical across slices for these 4 kinds per the
// wave contract. Per-slice fan-out arrives in 4.2-A-8b via
// queueRecipients refactor.

import { compose, renderSections, renderSectionsPlainText } from '../../lib/engine/composer';
import { sendRsvpNudge } from '../../lib/rsvpNudgeSend';
import { supabase } from '../../lib/supabase';
import { resolveAudience } from '../../lib/briefings/recipientFilter';
import { queueRecipients } from '../../lib/briefings/queueRecipients';
import { getDispatchSendPath, NoRecipientsError, RESOLVER_REGISTRY } from '../../lib/engine/resolvers/registry';

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

async function composeViaRegistry(state) {
  const entry = RESOLVER_REGISTRY[state.kind];
  const anchor = entry.anchorFromState(state);
  const overrides = entry.overridesFromState(state);
  const { context, slices } = await entry.resolve(anchor, { supabase, now: new Date() });
  if (!slices.length) throw new NoRecipientsError(state.kind, anchor);
  const { subject, content_sections } = entry.compose(context, slices[0], overrides);
  const html = '<div style="max-width:600px;margin:0 auto;background-color:#ffffff;font-family:Inter,system-ui,sans-serif;padding:0 0 24px 0;">' + renderSections(content_sections) + '</div>';
  const plainText = renderSectionsPlainText(content_sections);
  return { subject, html, plainText, sections: content_sections };
}

async function composeLegacy(state, coaches) {
  const tourneyUrl = await resolveTourneyUrl(state);
  return compose({ kind: state.kind, data: { ...state.body, tourney_url: tourneyUrl, signoff_message: state.signoff_message, coaches } });
}

export async function submitBriefing({ state, draft, orgId, recipients, coaches, pilotModeEnabled }) {
  if (state.kind === 'rsvp_nudge' && state.anchor_kind === 'event' && state.anchor_id) {
    const { data: ev } = await supabase.from('events').select('id,title,start_at,location,team_id').eq('id', state.anchor_id).maybeSingle();
    const r = await sendRsvpNudge({ orgId, event: ev, body: state.body, signoffMessage: state.signoff_message, coaches, recipients, pilotModeEnabled, testOnly: state.test_only });
    if (r?.error) throw r.error;
    return { audienceCount: r.audienceCount };
  }

  const sendPath = getDispatchSendPath(state.kind);
  if (sendPath === 'digestSend' || sendPath === 'rsvpNudgeSend') throw new Error(`${state.kind} sends via ${sendPath} directly; should not reach composerSubmit.`);
  if (sendPath === 'blocked') {
    const Err = RESOLVER_REGISTRY[state.kind].blockedReason;
    throw new Err();
  }

  const composed = sendPath === 'composerSubmit' ? await composeViaRegistry(state) : await composeLegacy(state, coaches);
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
    const { teamIds, audience } = await resolveAudience({ recipients, audienceType: state.audience_type, audienceFilter: state.audience_filter, anchorId: state.anchor_id });
    const queued = await queueRecipients({ messageId: r.id, audience, composed, teamIds, testOnly: state.test_only });
    return { scheduledFor: state.scheduled_for, audienceCount: queued.audienceCount };
  }
  const r = await draft.submitSend(payload);
  if (r?.error) throw r.error;
  const { teamIds, audience } = await resolveAudience({ recipients, audienceType: state.audience_type, audienceFilter: state.audience_filter, anchorId: state.anchor_id });
  const queued = await queueRecipients({ messageId: r.id, audience, composed, teamIds, testOnly: state.test_only });
  const dispatchInvoke = await supabase.functions.invoke('send-tournament-message', { body: { message_id: r.id } });
  if (dispatchInvoke.error) throw dispatchInvoke.error;
  await supabase.from('comms_messages').update({ status: 'sent' }).eq('id', r.id);
  return { sent: true, audienceCount: queued.audienceCount };
}
