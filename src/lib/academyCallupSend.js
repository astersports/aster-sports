// Wave 4.2-A-8c — academy_callup_notice send pipeline. Mirror of
// sendRsvpNudge (4.2-A-8b-b) adapted for the callup token infra
// shipped in 4.3-D. Single-slice fan-out (one callup_response section
// per email, since each notice targets one called-up player).
//
// Per-slice loop:
//   1. Resolve once via registry (context + slices).
//   2. For each slice: compose → mint accept + decline tokens
//      → wrap into handler URLs → substituteCallupTokens
//      → push to messages[].
//   3. INSERT comms_messages row (sample = first slice's UN-substituted
//      compose; admin BCC inherits placeholder buttons so an admin tap
//      doesn't accidentally accept/decline for the first family).
//   4. queueComposedMessages with adminSample = sample.
//   5. Invoke send-tournament-message — pilot mode gate inherited
//      from the resolver's effectivePilotOnly.
//   6. Mark comms_messages.status = 'sent'.
//
// Token semantics: per-(event, player, guardian, response). mint
// returns the signed token; we wrap into the callup-token-handler
// URL with `?t=<token>&action=accept|decline`.

import { NoRecipientsError, RESOLVER_REGISTRY } from './engine/resolvers/registry';
import { renderSections, renderSectionsPlainText } from './engine/composer';
import { substituteCallupTokens } from './engine/substitution/callupTokens';
import { queueComposedMessages } from './briefings/queueComposedMessages';

const HTML_OPEN = '<div style="max-width:600px;margin:0 auto;background-color:#ffffff;font-family:Inter,system-ui,sans-serif;padding:0 0 24px 0;">';
const HTML_CLOSE = '</div>';
const CALLUP_HANDLER_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/callup-token-handler`;

async function mintCallupToken(supabase, eventId, playerId, guardianId, response) {
  const { data, error } = await supabase.rpc('mint_callup_token', {
    p_event_id: eventId, p_player_id: playerId, p_guardian_id: guardianId, p_response: response,
  });
  if (error) throw new Error(`mint_callup_token failed: ${error.message}`);
  return `${CALLUP_HANDLER_BASE}?t=${encodeURIComponent(data)}&action=${response}`;
}

async function mintTokensForSlice(supabase, eventId, slice) {
  const playerId = slice.player_id;
  if (!playerId) throw new Error('sendAcademyCallupNotice: slice missing player_id');
  const [accept, decline] = await Promise.all([
    mintCallupToken(supabase, eventId, playerId, slice.guardian_id, 'accept'),
    mintCallupToken(supabase, eventId, playerId, slice.guardian_id, 'decline'),
  ]);
  return { [playerId]: { accept, decline } };
}

export async function sendAcademyCallupNotice({ state, supabase, now = new Date() }) {
  if (!state) throw new Error('sendAcademyCallupNotice: missing state.');
  if (!supabase) throw new Error('sendAcademyCallupNotice: missing supabase client.');
  const entry = RESOLVER_REGISTRY.academy_callup_notice;
  const anchor = entry.anchorFromState(state);
  const overrides = entry.overridesFromState(state);
  const { context, slices } = await entry.resolve(anchor, { supabase, now });
  if (!slices.length) throw new NoRecipientsError('academy_callup_notice', anchor);

  const sampleComposed = entry.compose(context, slices[0], overrides);

  const messages = [];
  for (const slice of slices) {
    const { subject, content_sections } = entry.compose(context, slice, overrides);
    const tokenMap = await mintTokensForSlice(supabase, anchor.eventId, slice);
    const substituted = substituteCallupTokens(content_sections, tokenMap);
    messages.push({ slice, subject, content_sections: substituted });
  }

  const orgId = context.org?.id;
  const teamId = context.receiving_team?.id || context.event?.team_id || null;
  const sampleHtml = HTML_OPEN + renderSections(sampleComposed.content_sections) + HTML_CLOSE;
  const samplePlain = renderSectionsPlainText(sampleComposed.content_sections);

  const { data: msg, error: msgErr } = await supabase.from('comms_messages').insert({
    org_id: orgId, tournament_id: null, team_id: teamId,
    kind: 'academy_callup_notice', language_code: 'en',
    delivery_method: 'queued', sent_at: null,
    subject: sampleComposed.subject, body_html: sampleHtml, body_plain: samplePlain,
    headline: 'CALL-UP', content_sections: sampleComposed.content_sections,
    signoff_message: state.signoff_message || null,
    anchor_kind: 'event', anchor_id: anchor.eventId,
    audience_type: 'player_specific',
    audience_filter: { player_ids: [anchor.playerId] },
  }).select('id').single();
  if (msgErr) throw msgErr;

  const adminSample = { slice: { kind: 'family' }, subject: sampleComposed.subject, content_sections: sampleComposed.content_sections };
  const queued = await queueComposedMessages({ messageId: msg.id, messages, testOnly: !!state.test_only, adminSample });

  const { error: dispErr } = await supabase.functions.invoke('send-tournament-message', { body: { message_id: msg.id } });
  if (dispErr) throw dispErr;
  await supabase.from('comms_messages').update({ status: 'sent' }).eq('id', msg.id);

  return { messageId: msg.id, audienceCount: queued.audienceCount };
}
