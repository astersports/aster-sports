// Wave 5 PR 3b — Deno mirror of src/lib/briefings/suggestCloserPrompt.js
// per anti-pattern #30. Two near-identical files (TS annotations
// being the only diff) so vitest covers the logic in Node while
// the edge function deploys self-contained.
//
// CRITICAL: keep this file in sync with the .js mirror. Adding logic
// to one without the other is the failure mode (vitest passes,
// deploy succeeds, but production runs different code than tests).

const STATIC_INSTRUCTIONS = `You write the closing paragraph of a tournament-weekend briefing for parents on a youth basketball team. The audience is busy parents who already RSVP'd and know the schedule — your job is to send them off with a moment of voice and warmth, not to repeat logistics.

VOICE
- Warm but tight. 2-4 sentences max. Never a wall of text.
- Coach-to-parent, not coach-to-player. No "let's go team."
- Sounds like a person, not a marketing email. Contractions are fine. Em-dashes are fine.
- Acknowledges the weekend specifically (which team, what's at stake, what the schedule shape is) without listing it.
- Ends with a beat that makes parents feel something — pride in the kid, anticipation for the games, gratitude for the family showing up. Not "see you Saturday."

DO NOT
- Don't restate game times, venues, or RSVP deadlines. Those live in other sections.
- Don't address the kids directly. Parents are reading.
- Don't use exclamation points unless one is genuinely earned.
- Don't quote sports clichés ("leave it all on the floor"). Frank reads these and groans.
- Don't sign off with "Coach Kenny" / "Coach Frank" / etc. The renderer appends the coach sign-off line separately.

OUTPUT
Return ONLY the closing paragraph as plain prose. No JSON, no markdown, no surrounding quotes, no leading label. If you have nothing genuine to say, return an empty string.
`;

function trim(s: unknown): string { return typeof s === "string" ? s.trim() : ""; }

export function buildSuggestCloserPrompt(
  { tournamentName, teamName, scheduleGapsText, voiceExamples = [] }:
  { tournamentName?: string; teamName?: string; scheduleGapsText?: string; voiceExamples?: string[] } = {},
) {
  const examples = (voiceExamples || []).map(trim).filter(Boolean).slice(0, 5);
  const exampleBlock = examples.length
    ? `Recent closers from the same coach (voice grounding):\n${examples.map((e) => `- "${e}"`).join("\n")}`
    : "Recent closers: (none yet — rely on the VOICE rules above).";
  const scheduleBlock = trim(scheduleGapsText)
    ? `Schedule shape for context:\n${trim(scheduleGapsText)}`
    : "Schedule shape: (not provided).";
  return `${STATIC_INSTRUCTIONS}

This weekend:
- Team: ${trim(teamName) || "(unknown team)"}
- Tournament: ${trim(tournamentName) || "(unnamed tournament)"}

${scheduleBlock}

${exampleBlock}

Write the closer now.`;
}

export function parseSuggestCloserOutput(rawText: unknown): string {
  if (!rawText || typeof rawText !== "string") return "";
  let t = rawText.trim();
  t = t.replace(/^```(?:\w+)?\n?/, "").replace(/\n?```$/, "");
  t = t.replace(/^["'"']\s*/, "").replace(/\s*["'"']$/, "");
  return t.trim();
}
