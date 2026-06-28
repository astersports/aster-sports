// Pure helpers for briefing-ai-draft (prompt assembly + output parsing).
// AP #30: Deno MIRROR of the vitest source of truth at
// src/lib/briefings/aiDraftPrompt.js. Change BOTH in one commit. Standard ES
// only (no Deno/Node APIs) so the two files stay byte-near-identical.

export const FREE_FORM_KINDS = ["announcement", "custom_message"];
// FORK B (2026-06-09): trimmed from 5 -> 3 to match the kinds actually wired
// for interactive AI draft (anchoredAiFacts.AI_DRAFT_FIELD). weekly_digest +
// tournament_prelim were advertised here but had no AI_DRAFT_FIELD entry, so
// AiDraftAnchored rendered an empty box for them (a latent UX bug) and no
// caller ever drafts those two via briefing-ai-draft (weekly_digest auto-drafts
// via cron; tournament_prelim offers the separate "Suggest closer" fn). Keeping
// AI_DRAFT_KINDS = the wired set means the edge fn correctly 400s an unwired kind.
export const ANCHORED_KINDS = ["game_recap", "games_recap", "tournament_recap"];
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

// Polish (T1 voice-polish): rewrite an EXISTING admin-authored body in the org
// voice per a style directive. Facts-preserving (never adds/drops/alters a
// fact), so no new sub-processor or data class beyond the existing AI-draft
// path. The model returns the same locked shape, parsed by parseAiDraftOutput.
export const POLISH_STYLES: Record<string, string> = {
  warmer: "Make the tone warmer, friendlier, and more personable while staying professional.",
  shorter: "Make it more concise and easier to skim: tighten the wording and cut filler.",
  clearer: "Make it clearer and better organized: simpler sentences, logical order, easy to scan.",
};

export function buildPolishPrompt(
  { body, styleDirective, framing }: { body: string; styleDirective: string; framing: string },
): string {
  return [
    `Rewrite the following briefing message for ${framing}. ${styleDirective}`,
    "Keep ALL facts, names, numbers, dates, times, scores, and venues EXACTLY as written: never add, drop, or alter a fact, and never invent new specifics. Preserve the original meaning. Do NOT sign off by name (the signature is added separately, not by you). Keep paragraphs short.",
    `Message to rewrite:\n"""\n${String(body == null ? "" : body).trim()}\n"""`,
    'Return ONLY minified JSON (no markdown, no code fence) with exactly these keys: body (the rewritten message), card_summary (one ~10-second summary line), facts_used (array of {"k","v"} pairs for the key facts you preserved), warnings (array of short strings; empty if none). NO em dashes (use periods, commas, colons, or the middot/pipe), no corporate jargon.',
  ].join("\n\n");
}
