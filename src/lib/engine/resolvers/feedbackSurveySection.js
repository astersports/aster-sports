// Cutover PR 7b-2 — shared helper for emitting feedback_survey sections
// from briefing kind resolvers. Identical across all 5 feedback-enabled
// kinds (tournament_prelim, family_guide, coach_roundup, game_recap,
// weekly_digest), so factored here to avoid drift.
//
// Section placement contract (per Frank's 2026-05-22 routing decision):
// AFTER signoff (and optional tagline_footer) + BEFORE brand_footer.
// Each resolver pushes this section into its sections array between
// the tagline and the brand footer.
//
// Placeholder URLs are populated at queue time by createFeedbackSubstitutor
// (src/lib/briefings/feedbackSubstitutor.js) which mints per-recipient
// signed tokens and runs substituteFeedbackTokens before INSERT.

export function buildFeedbackSurveySection() {
  return {
    kind: 'feedback_survey',
    feedback_token_placeholders: {
      1: '{{feedback_1_url}}',
      2: '{{feedback_2_url}}',
      3: '{{feedback_3_url}}',
      4: '{{feedback_4_url}}',
      5: '{{feedback_5_url}}',
    },
  };
}
