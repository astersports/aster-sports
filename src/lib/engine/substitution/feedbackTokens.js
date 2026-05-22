// Cutover PR 7b-1 — substituteFeedbackTokens. Mirror of
// substituteRsvpTokens (4.2-A-8b-b) + substituteCallupTokens (4.2-A-8c)
// adapted for the briefing cutover-gate metric.
//
// Walks content_sections, finds each feedback_survey section, and
// replaces literal {{feedback_<n>_url}} placeholders with minted
// per-recipient token URLs. Caller (PR 7b-2 send pipeline) mints 5
// tokens per recipient (one per rating 1..5) and passes them as a
// tokens object keyed by recipient_email → { 1: url1, ..., 5: url5 }.
//
// Field rename feedback_token_placeholders -> feedback_token_urls so
// the renderer never accidentally emits literal {{...}} strings to a
// real recipient. Renderer reads feedback_token_urls; if the field is
// absent (substitution missed), renderer falls back to literal
// placeholder strings — fail-loud signal during smoke testing per
// AP #29.

export function substituteFeedbackTokens(content_sections, tokenMapByEmail) {
  if (!Array.isArray(content_sections)) {
    throw new TypeError('substituteFeedbackTokens: content_sections must be an array');
  }
  if (!tokenMapByEmail || typeof tokenMapByEmail !== 'object') {
    throw new TypeError('substituteFeedbackTokens: tokenMapByEmail must be an object');
  }

  return content_sections.map((section) => {
    if (section?.kind !== 'feedback_survey') return section;
    if (!section.feedback_token_placeholders) return section;
    if (!section.recipient_email) {
      throw new Error('substituteFeedbackTokens: feedback_survey section missing recipient_email');
    }

    const tokens = tokenMapByEmail[section.recipient_email];
    if (!tokens) {
      throw new Error(`substituteFeedbackTokens: no token entry for recipient_email ${section.recipient_email}`);
    }
    for (let r = 1; r <= 5; r += 1) {
      if (typeof tokens[r] !== 'string') {
        throw new TypeError(`substituteFeedbackTokens: tokens.${r} for ${section.recipient_email} must be a string URL`);
      }
    }

    const { feedback_token_placeholders, ...rest } = section;
    void feedback_token_placeholders;
    return {
      ...rest,
      feedback_token_urls: { 1: tokens[1], 2: tokens[2], 3: tokens[3], 4: tokens[4], 5: tokens[5] },
    };
  });
}
