// Pure helpers for briefing-ai-draft (prompt assembly + output parsing).
// AP #30: Deno MIRROR of the vitest source of truth at
// src/lib/briefings/aiDraftPrompt.js. Change BOTH in one commit. Standard ES
// only (no Deno/Node APIs) so the two files stay byte-near-identical.

export const FREE_FORM_KINDS = ["announcement", "custom_message"];
export const ANCHORED_KINDS = ["game_recap", "games_recap", "weekly_digest", "tournament_recap", "tournament_prelim"];
export const AI_DRAFT_KINDS = [...FREE_FORM_KINDS, ...ANCHORED_KINDS];

export function audienceFraming(teamName: string | null): string {
  return teamName && teamName.trim() ? `${teamName.trim()} families` : "all families";
}

export function factsToLines(facts: Record<string, unknown> | null): string[] {
  if (!facts || typeof facts !== "object") return [];
  return Object.entries(facts)
    .filter(([, v]) => v != null && String(v).trim() !== "")
    .map(([k, v]) => `${k}: ${String(v).trim()}`);
}

export function buildAiDraftUserPrompt(
  { kind, framing, factLines, gist, narrativeOnly }:
    { kind: string; framing: string; factLines: string[]; gist?: string; narrativeOnly?: boolean },
): string {
  const parts = [`Draft a ${String(kind).replace(/_/g, " ")} briefing for ${framing}.`];
  if (narrativeOnly) {
    parts.push("Write ONLY the coach's voice narrative: a short opening hook, a reflective line or two on what it meant and the effort, and a warm or rally close. Do NOT sign off by name (the signature is added separately, not by you). Weave the key facts (final score, opponent, player of the game, venue) naturally into the prose so the message itself carries the data; do not dump a bare stat list. Any record or game list shown covers ONLY this briefing's games, not the full season, so do NOT imply this is the team's first, last, or only game of the season, and do NOT write a season-wrap or 'time to breathe' style summary unless the facts say the season has ended. If a 'Season so far' fact is given, you MAY reference the season position accurately (e.g. the record after this game); never contradict it. Structure the narrative as 2 to 4 SHORT paragraphs separated by a blank line (a real line break between them), never one long run-on block.");
  }
  if (gist && gist.trim()) parts.push(`What it needs to say: ${gist.trim()}`);
  if (factLines && factLines.length) {
    parts.push(narrativeOnly
      ? "Facts to weave naturally into the narrative (use VERBATIM, reference the key ones like score and opponent; never invent or alter a number, name, time, or venue):"
      : "Facts (use VERBATIM; never invent or alter a number, name, time, or venue; if a needed fact is missing, leave a clear blank and add a warnings entry):");
    parts.push(factLines.map((l) => `  - ${l}`).join("\n"));
  } else {
    parts.push("No structured facts were provided. Write from the gist only and do not invent specifics (scores, times, venues, names).");
  }
  parts.push(
    (narrativeOnly ? "" : "Follow the structure template for this kind from the voice profile. ")
    + "Do NOT sign off by name (the signature is added separately, not by you). "
    + "Return ONLY minified JSON (no markdown, no code fence) with exactly these keys: "
    + `body (the ${narrativeOnly ? "narrative prose" : "full briefing prose"}), card_summary (one ~10-second summary line), `
    + 'facts_used (array of {"k","v"} label/value pairs you relied on), '
    + "warnings (array of short strings for any missing fact or caveat). "
    + 'Hard rules: use ONLY the facts provided. Do NOT assert game context you were not given, such as whether it was an opener, playoff, or first game, any within-game timeline (halftime, quarter splits, a "second half" run), or any momentum or comeback story. Stick to the given final score, result, point differential, opponent, date, venue, and record. NO em dashes (use periods, commas, colons, or the middot/pipe), no corporate jargon.',
  );
  return parts.join("\n\n");
}

export function stripFences(raw: unknown): string {
  return String(raw == null ? "" : raw).replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
}

export function stripEmDashes(s: unknown): string {
  return String(s == null ? "" : s).replace(/\s*—\s*/g, ": ");
}

export function parseAiDraftOutput(raw: unknown): {
  body: string; card_summary: string; facts_used: unknown[]; warnings: unknown[];
} {
  let obj: any;
  try { obj = JSON.parse(stripFences(raw)); } catch { throw new Error("AI returned non-JSON output"); }
  if (!obj || typeof obj.body !== "string" || !obj.body.trim()) throw new Error("AI output missing body");
  return {
    body: stripEmDashes(obj.body),
    card_summary: stripEmDashes(typeof obj.card_summary === "string" ? obj.card_summary : ""),
    facts_used: Array.isArray(obj.facts_used) ? obj.facts_used : [],
    warnings: Array.isArray(obj.warnings) ? obj.warnings : [],
  };
}
