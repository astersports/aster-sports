// Cutover PR 7b-2 — feedback-token substitutor factory. Mirror of the
// rsvp/callup mint+wrap pattern but consumed via Option A
// (queueComposedMessages perRecipientSubstitutor callback) instead of
// pre-queue mint loop.
//
// Factory builds a per-row callback that:
//   1. Reads row.email_at_send + row.__content_sections
//   2. Mints 5 mint_feedback_token RPC calls (rating 1..5) via Promise.all
//   3. Wraps each token into the handler URL (matches rsvp/callup pattern)
//   4. Calls substituteFeedbackTokens to replace placeholders with URLs
//   5. Re-renders body_html_rendered + body_plain_rendered
//   6. Returns the updated row (preserving guardian_id, email_at_send,
//      teams_included, etc.)
//
// HANDLER_BASE matches the pattern used by rsvpNudgeSend.js:26 +
// academyCallupSend.js. URL shape: ?t=<token>&r=<rating>.

import { renderSections, renderSectionsPlainText } from '../engine/composer';
import { substituteFeedbackTokens } from '../engine/substitution/feedbackTokens';

const HTML_OPEN = '<div style="max-width:600px;margin:0 auto;background-color:#ffffff;font-family:Inter,system-ui,sans-serif;padding:0 0 24px 0;">';
const HTML_CLOSE = '</div>';

async function mintFeedbackToken(supabase, messageId, email, rating) {
  const { data, error } = await supabase.rpc('mint_feedback_token', {
    p_message_id: messageId,
    p_recipient_email: email,
    p_rating: rating,
  });
  if (error) throw new Error(`mint_feedback_token failed for ${email}/${rating}: ${error.message}`);
  return data;
}

async function mintAllRatings(supabase, handlerBase, messageId, email) {
  const tokens = await Promise.all([1, 2, 3, 4, 5].map(
    (r) => mintFeedbackToken(supabase, messageId, email, r),
  ));
  return {
    1: `${handlerBase}?t=${encodeURIComponent(tokens[0])}&r=1`,
    2: `${handlerBase}?t=${encodeURIComponent(tokens[1])}&r=2`,
    3: `${handlerBase}?t=${encodeURIComponent(tokens[2])}&r=3`,
    4: `${handlerBase}?t=${encodeURIComponent(tokens[3])}&r=4`,
    5: `${handlerBase}?t=${encodeURIComponent(tokens[4])}&r=5`,
  };
}

// Decorates each feedback_survey section with the recipient_email
// from the row so substituteFeedbackTokens can key into tokenMap.
// Resolvers emit feedback_survey WITHOUT recipient_email (it's a
// per-recipient field, set at substitution time, not compose time).
function stampRecipientEmail(sections, email) {
  return sections.map((s) => (s?.kind === 'feedback_survey' ? { ...s, recipient_email: email } : s));
}

export function createFeedbackSubstitutor({ supabase, messageId, handlerBase }) {
  if (!supabase) throw new Error('createFeedbackSubstitutor: missing supabase client.');
  if (!messageId) throw new Error('createFeedbackSubstitutor: missing messageId.');
  if (!handlerBase) throw new Error('createFeedbackSubstitutor: missing handlerBase.');

  return async function feedbackSubstitutor(row) {
    if (!row?.email_at_send) {
      throw new Error('feedbackSubstitutor: row missing email_at_send.');
    }
    if (!Array.isArray(row.__content_sections)) {
      throw new Error('feedbackSubstitutor: row missing __content_sections (PR 7b-2 transient field).');
    }
    const email = row.email_at_send;
    const stamped = stampRecipientEmail(row.__content_sections, email);
    const tokenUrls = await mintAllRatings(supabase, handlerBase, messageId, email);
    const tokenMap = { [email]: tokenUrls };
    const substituted = substituteFeedbackTokens(stamped, tokenMap);
    return {
      ...row,
      __content_sections: substituted,
      body_html_rendered: HTML_OPEN + renderSections(substituted) + HTML_CLOSE,
      body_plain_rendered: renderSectionsPlainText(substituted),
    };
  };
}
