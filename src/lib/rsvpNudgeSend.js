// Wave 4.2-A-8b-b — rsvp_nudge send pipeline. Migrated to the
// RESOLVER_REGISTRY path. Per-slice loop:
//   1. Resolve once via registry (context + slices).
//   2. For each slice: compose → mint per-kid tokens (3 RPCs per kid)
//      → substituteRsvpTokens → push to messages[].
//   3. INSERT comms_messages row (sample = first slice's UN-substituted
//      compose; admin BCC inherits placeholder buttons so an admin tap
//      doesn't accidentally RSVP for the first family).
//   4. queueComposedMessages with adminSample = sample.
//   5. Invoke send-tournament-message v14 — pilot mode gate inherited
//      from the resolver's effectivePilotOnly (state.pilot_only or
//      org settings).
//   6. Mark comms_messages.status = 'sent'.
//
// Token semantics: per-(event, player, guardian, response) per the
// existing mint_rsvp_token RPC. Multi-kid families get one
// rsvp_request section per unresponded kid (Option A locked in
// wave 4.2-A-8b-b prep).

import { NoRecipientsError, RESOLVER_REGISTRY } from './engine/resolvers/registry';
import { renderSections, renderSectionsPlainText } from './engine/composer';
import { substituteRsvpTokens } from './engine/substitution/rsvpTokens';
import { queueComposedMessages } from './briefings/queueComposedMessages';

const HTML_OPEN = '<div style="max-width:600px;margin:0 auto;background-color:#ffffff;font-family:Inter,system-ui,sans-serif;padding:0 0 24px 0;">';
const HTML_CLOSE = '</div>';
const RSVP_HANDLER_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rsvp-token-handler`;

async function mintRsvpToken(supabase, eventId, playerId, guardianId, response) {
  const { data, error } = await supabase.rpc('mint_rsvp_token', {
    p_event_id: eventId, p_player_id: playerId, p_guardian_id: guardianId, p_response: response,
  });
  if (error) throw new Error(`mint_rsvp_token failed: ${error.message}`);
  // Wrap into the handler URL the recipient actually clicks. Legacy
  // `mintLinksForPlayer` wrapped here too; the 8b-b rewrite dropped
  // the wrap (latent bug fixed in 4.2-A-8c).
  return `${RSVP_HANDLER_BASE}?t=${encodeURIComponent(data)}&action=${response}`;
}

async function mintTokensForSlice(supabase, eventId, slice) {
  const map = {};
  for (const kid of slice.unresponded_kids || []) {
    const [going, maybe, not_going] = await Promise.all([
      mintRsvpToken(supabase, eventId, kid.player_id, slice.guardian_id, 'going'),
      mintRsvpToken(supabase, eventId, kid.player_id, slice.guardian_id, 'maybe'),
      mintRsvpToken(supabase, eventId, kid.player_id, slice.guardian_id, 'not_going'),
    ]);
    map[kid.player_id] = { going, maybe, not_going };
  }
  return map;
}

export async function sendRsvpNudge({ state, supabase, now = new Date() }) {
  if (!state) throw new Error('sendRsvpNudge: missing state.');
  if (!supabase) throw new Error('sendRsvpNudge: missing supabase client.');
  const entry = RESOLVER_REGISTRY.rsvp_nudge;
  const anchor = entry.anchorFromState(state);
  const overrides = entry.overridesFromState(state);
  const { context, slices } = await entry.resolve(anchor, { supabase, now });
  if (!slices.length) throw new NoRecipientsError('rsvp_nudge', anchor);

  const sampleComposed = entry.compose(context, slices[0], overrides);

  const messages = [];
  for (const slice of slices) {
    const { subject, content_sections } = entry.compose(context, slice, overrides);
    const tokenMap = await mintTokensForSlice(supabase, anchor.eventId, slice);
    const substituted = substituteRsvpTokens(content_sections, tokenMap);
    messages.push({ slice, subject, content_sections: substituted });
  }

  const orgId = context.org?.id;
  const teamId = context.team?.id || context.event?.team_id || null;
  const sampleHtml = HTML_OPEN + renderSections(sampleComposed.content_sections) + HTML_CLOSE;
  const samplePlain = renderSectionsPlainText(sampleComposed.content_sections);

  const { data: msg, error: msgErr } = await supabase.from('comms_messages').insert({
    org_id: orgId, tournament_id: null, team_id: teamId,
    kind: 'rsvp_nudge', language_code: 'en',
    delivery_method: 'queued', sent_at: null,
    subject: sampleComposed.subject, body_html: sampleHtml, body_plain: samplePlain,
    headline: 'QUICK RSVP', content_sections: sampleComposed.content_sections,
    signoff_message: state.signoff_message || null,
    anchor_kind: 'event', anchor_id: anchor.eventId,
    audience_type: 'event_attendees',
  }).select('id').single();
  if (msgErr) throw msgErr;

  const adminSample = { slice: { kind: 'family' }, subject: sampleComposed.subject, content_sections: sampleComposed.content_sections };
  const queued = await queueComposedMessages({ messageId: msg.id, messages, testOnly: !!state.test_only, adminSample });

  const { error: dispErr } = await supabase.functions.invoke('send-tournament-message', { body: { message_id: msg.id } });
  if (dispErr) throw dispErr;
  await supabase.from('comms_messages').update({ status: 'sent' }).eq('id', msg.id);

  return { messageId: msg.id, audienceCount: queued.audienceCount };
}
