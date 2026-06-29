// Wave 5 PR 2 — Shared prompt + output-validation logic for the
// TourneyMachine schedule parser. Per anti-pattern #30: this file is
// the vitest source of truth; supabase/functions/parse-tournament-
// schedule/_helpers.ts mirrors it for Deno runtime.
//
// Architectural contract:
//   - buildPrompt(paste, context) → string sent as the user message
//     to Claude. Static prompt structure (instructions + schema)
//     embedded; dynamic context (team list, venue list) injected.
//   - parseClaudeOutput(rawText) → structured rows OR throws on
//     malformed JSON / missing required fields.

const STATIC_INSTRUCTIONS = `You extract basketball game events from raw TourneyMachine text.

Each event in the source follows a 7-line repeating pattern:
  line 1: score (always "0" before play starts)
  line 2: away team name
  line 3: score (always "0" before play starts)
  line 4: home team name
  line 5: date (M/D, no year)
  line 6: time (H:MM AM/PM)
  line 7: court+venue (format: "<num> - <venue> - Court <n>")

CRITICAL: "Legacy Hoopers" appears in every event as either the away
team (line 2) or home team (line 4) — that's our organization. The
\`team\` field in your output is NOT the literal string "Legacy
Hoopers". It's the SPECIFIC TEAM NAME from the section header that
groups the events.

Section headers look like:
  "2nd grade - 8u"           → output team = "8U Boys"
  "3rd grade - 9u boys"      → output team = "9U Boys"
  "4th grade - 10u black"    → output team = "10U Black"
  "4th grade - 10u blue"     → output team = "10U Blue"
  "5th grade - 11u girls"    → output team = "11U Girls"

The exact team names to use are in the "Known Legacy Hoopers teams"
list below. Match the section header to the closest team in that
list. If a section has 5 events under it, every one of those 5
events has the same \`team\` value (the team from that section's
header).

Pool Standings sections must be IGNORED — they are not events.

For each event, output: { team, date, time, opponent, venue, court,
home_away }.
  - team        = team name from the SECTION HEADER, matching
                  one of the known Legacy Hoopers teams.
  - opponent    = the non-Legacy team from the event lines.
  - home_away   = "home" if "Legacy Hoopers" appears as the home
                  team (line 4 of the 7-line block), "away" if
                  it appears as the away team (line 2).

Return ONLY a JSON array of event objects. No prose, no markdown
fences. If the input has no parseable events, return [].
`;

export function buildPrompt(paste, { teams = [], venues = [] } = {}) {
  const teamList = (teams || []).map((t) => `- ${t.name}`).join('\n');
  const venueList = (venues || []).map((v) => `- ${v.name}`).join('\n');
  return `${STATIC_INSTRUCTIONS}

Known Legacy Hoopers teams (map team identifiers to these):
${teamList || '(none)'}

Known venues (prefer matching to these by name):
${venueList || '(none)'}

Input:
${paste}`;
}

export function parseClaudeOutput(rawText) {
  if (!rawText || typeof rawText !== 'string') throw new Error('Empty parser output');
  const trimmed = rawText.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  let parsed;
  try { parsed = JSON.parse(trimmed); }
  catch (e) { throw new Error(`Malformed JSON from parser: ${e.message}`, { cause: e }); }
  if (!Array.isArray(parsed)) throw new Error('Parser output is not an array');
  return parsed.map((row, i) => {
    if (!row || typeof row !== 'object') throw new Error(`Row ${i} is not an object`);
    return {
      team: String(row.team || '').trim(),
      date: String(row.date || '').trim(),
      time: String(row.time || '').trim(),
      opponent: String(row.opponent || '').trim(),
      venue: String(row.venue || '').trim(),
      court: String(row.court || '').trim(),
      home_away: row.home_away === 'away' ? 'away' : 'home',
    };
  });
}
