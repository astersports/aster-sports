// Wave 5 PR 3b — vitest-covered source of truth for the
// suggest-briefing-closer edge function's prompt. Per anti-pattern
// #30, the Deno mirror lives at
// supabase/functions/suggest-briefing-closer/_helpers.ts and must
// stay in sync — change one, change the other in the same commit.
//
// The closer is a short, voicey paragraph that lands at the bottom
// of a tournament_prelim briefing. Frank reviews + edits + sends;
// this is a draft starting point, not a final send.

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

function trim(s) { return typeof s === 'string' ? s.trim() : ''; }

export function buildSuggestCloserPrompt({ tournamentName, teamName, scheduleGapsText, voiceExamples = [] } = {}) {
  const examples = (voiceExamples || []).map(trim).filter(Boolean).slice(0, 5);
  const exampleBlock = examples.length
    ? `Recent closers from the same coach (voice grounding):\n${examples.map((e) => `- "${e}"`).join('\n')}`
    : 'Recent closers: (none yet — rely on the VOICE rules above).';
  const scheduleBlock = trim(scheduleGapsText)
    ? `Schedule shape for context:\n${trim(scheduleGapsText)}`
    : 'Schedule shape: (not provided).';
  return `${STATIC_INSTRUCTIONS}

This weekend:
- Team: ${trim(teamName) || '(unknown team)'}
- Tournament: ${trim(tournamentName) || '(unnamed tournament)'}

${scheduleBlock}

${exampleBlock}

Write the closer now.`;
}

// Output is plain text; we strip surrounding quotes / markdown fences
// that Claude sometimes adds despite the instructions, then trim
// whitespace. Returns '' if the model deliberately produced empty.
export function parseSuggestCloserOutput(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  let t = rawText.trim();
  t = t.replace(/^```(?:\w+)?\n?/, '').replace(/\n?```$/, '');
  t = t.replace(/^["'"']\s*/, '').replace(/\s*["'"']$/, '');
  return t.trim();
}
