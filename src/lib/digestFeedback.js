// Cutover PR 7b-2.5 — weekly_digest feedback substitution. Mirrors
// feedbackSubstitutor.js (composerSubmit path) but adapted for the
// digestSend.js per-family render shape:
//   family: { family: slice, subject, html, plainText, sections, teams_included }
//
// digestSend renders sections inline at renderSlice time (NOT deferred
// via queueComposedMessages perRecipientSubstitutor), so the substitution
// pass runs AFTER the INSERT comms_messages step (need msg.id to mint)
// and BEFORE the comms_message_recipients row build. Each family's
// sections + html + plainText are replaced in place.
//
// Token URL shape matches feedbackSubstitutor.js: ?t=<token>&r=<rating>.

import { renderSections, renderSectionsPlainText } from './engine/composer';
import { substituteFeedbackTokens } from './engine/substitution/feedbackTokens';
import { EMAIL_WRAPPER_CLOSE, EMAIL_WRAPPER_OPEN } from './emailWrapper';

const HANDLER_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/feedback-token-handler`;

async function mintTokensForEmail(supabase, messageId, email) {
  const tokens = await Promise.all([1, 2, 3, 4, 5].map(async (rating) => {
    const { data, error } = await supabase.rpc('mint_feedback_token', {
      p_message_id: messageId, p_recipient_email: email, p_rating: rating,
    });
    if (error) throw new Error(`mint_feedback_token failed for ${email}/${rating}: ${error.message}`);
    return data;
  }));
  return {
    1: `${HANDLER_BASE}?t=${encodeURIComponent(tokens[0])}&r=1`,
    2: `${HANDLER_BASE}?t=${encodeURIComponent(tokens[1])}&r=2`,
    3: `${HANDLER_BASE}?t=${encodeURIComponent(tokens[2])}&r=3`,
    4: `${HANDLER_BASE}?t=${encodeURIComponent(tokens[3])}&r=4`,
    5: `${HANDLER_BASE}?t=${encodeURIComponent(tokens[4])}&r=5`,
  };
}

export async function substituteFeedbackForFamily(supabase, messageId, family) {
  if (!family?.family?.email) throw new Error('substituteFeedbackForFamily: missing family.email.');
  if (!Array.isArray(family.sections)) throw new Error('substituteFeedbackForFamily: missing sections.');
  const email = family.family.email;
  const tokenUrls = await mintTokensForEmail(supabase, messageId, email);
  const stamped = family.sections.map((s) => (s?.kind === 'feedback_survey' ? { ...s, recipient_email: email } : s));
  const substituted = substituteFeedbackTokens(stamped, { [email]: tokenUrls });
  return {
    ...family,
    sections: substituted,
    html: EMAIL_WRAPPER_OPEN + renderSections(substituted) + EMAIL_WRAPPER_CLOSE,
    plainText: renderSectionsPlainText(substituted),
  };
}
