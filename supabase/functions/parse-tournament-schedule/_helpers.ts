// Wave 5 PR 2 — Deno mirror of src/lib/import/parseTournamentSchedulePrompt.js
// per anti-pattern #30. Two near-identical files (TS annotations
// being the only diff) so vitest covers the logic in Node while
// the edge function deploys self-contained.
//
// CRITICAL: keep this file in sync with the .js mirror. Adding logic
// to one without the other is the failure mode (vitest passes,
// deploy succeeds, but production runs different code than tests).

const STATIC_INSTRUCTIONS = `You extract basketball game events from raw TourneyMachine text.

Each event in the source follows a 7-line repeating pattern:
  line 1: score (always "0" before play starts)
  line 2: away team name
  line 3: score (always "0" before play starts)
  line 4: home team name
  line 5: date (M/D, no year)
  line 6: time (H:MM AM/PM)
  line 7: court+venue (format: "<num> - <venue> - Court <n>")

Section headers like "2nd grade - 8u" or "5th grade - 11u girls" tell
you which Legacy Hoopers team the events belong to.

Pool Standings sections must be IGNORED — they are not events.

For each event, output: { team, date, time, opponent, venue, court,
home_away }. team = the Legacy Hoopers team name from the section
header. opponent = the non-Legacy team. home_away = "home" if Legacy
appears as home (line 4), "away" if Legacy appears as away (line 2).

Return ONLY a JSON array of event objects. No prose, no markdown
fences. If the input has no parseable events, return [].
`;

export function buildPrompt(paste: string, ctx: { teams?: { name: string }[]; venues?: { name: string }[] } = {}) {
  const teams = ctx.teams || [];
  const venues = ctx.venues || [];
  const teamList = teams.map((t) => `- ${t.name}`).join("\n");
  const venueList = venues.map((v) => `- ${v.name}`).join("\n");
  return `${STATIC_INSTRUCTIONS}

Known Legacy Hoopers teams (map team identifiers to these):
${teamList || "(none)"}

Known venues (prefer matching to these by name):
${venueList || "(none)"}

Input:
${paste}`;
}

export function parseClaudeOutput(rawText: string) {
  if (!rawText || typeof rawText !== "string") throw new Error("Empty parser output");
  const trimmed = rawText.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  let parsed;
  try { parsed = JSON.parse(trimmed); }
  catch (e) { throw new Error(`Malformed JSON from parser: ${(e as Error).message}`); }
  if (!Array.isArray(parsed)) throw new Error("Parser output is not an array");
  return parsed.map((row, i) => {
    if (!row || typeof row !== "object") throw new Error(`Row ${i} is not an object`);
    return {
      team: String(row.team || "").trim(),
      date: String(row.date || "").trim(),
      time: String(row.time || "").trim(),
      opponent: String(row.opponent || "").trim(),
      venue: String(row.venue || "").trim(),
      court: String(row.court || "").trim(),
      home_away: row.home_away === "away" ? "away" : "home",
    };
  });
}
