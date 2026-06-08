// Pure helpers for the briefing-ai-draft edge function (prompt assembly +
// output parsing). NO Node/Deno APIs — standard ES only, so this file and its
// Deno mirror stay byte-near-identical.
//
// AP #30: this is the vitest-covered SOURCE OF TRUTH. The Deno mirror lives at
// supabase/functions/briefing-ai-draft/_helpers.ts. Change BOTH in one commit.

// v1 free-form kinds (AI-1). Anchored kinds (AI-2) resolve facts CLIENT-side
// (reusing the useResolverPreview / RESOLVER_REGISTRY path the preview already
// runs) and pass them to the fn as the free-form shape — so no resolver runs in
// Deno (AI-2 reconciliation of design seam 4b against deploy reality).
export const FREE_FORM_KINDS = ['announcement', 'custom_message'];
export const ANCHORED_KINDS = ['game_recap', 'games_recap', 'weekly_digest', 'tournament_recap', 'tournament_prelim'];
export const AI_DRAFT_KINDS = [...FREE_FORM_KINDS, ...ANCHORED_KINDS];

// Salutation/framing string from the audience. team_id is FRAMING only (per the
// engine seam decision 4d), never a facts-scoping key.
export function audienceFraming(teamName) {
  return teamName && teamName.trim() ? `${teamName.trim()} families` : 'all families';
}

// Flatten an admin-supplied facts object into "label: value" lines, dropping
// empties. Free-form facts are whatever the admin typed; never invented here.
export function factsToLines(facts) {
  if (!facts || typeof facts !== 'object') return [];
  return Object.entries(facts)
    .filter(([, v]) => v != null && String(v).trim() !== '')
    .map(([k, v]) => `${k}: ${String(v).trim()}`);
}

// The user turn. The system turn is the org voice profile (verbatim), supplied
// by the caller. Facts go in verbatim; the model writes prose around them.
// narrativeOnly (AI-2 anchored kinds): the structured stat block / game log
// render the facts separately, so the model writes ONLY the voice narrative.
export function buildAiDraftUserPrompt({ kind, framing, factLines, gist, narrativeOnly }) {
  const parts = [`Draft a ${String(kind).replace(/_/g, ' ')} briefing for ${framing}.`];
  if (narrativeOnly) {
    parts.push("Write ONLY the coach's voice narrative: a short opening hook, a reflective line or two on what it meant and the effort, and a warm or rally close. Do NOT sign off by name (the signature is added separately, not by you). Weave the key facts (final score, opponent, player of the game, venue) naturally into the prose so the message itself carries the data; do not dump a bare stat list.");
  }
  if (gist && gist.trim()) parts.push(`What it needs to say: ${gist.trim()}`);
  if (factLines && factLines.length) {
    parts.push(narrativeOnly
      ? 'Facts to weave naturally into the narrative (use VERBATIM, reference the key ones like score and opponent; never invent or alter a number, name, time, or venue):'
      : 'Facts (use VERBATIM; never invent or alter a number, name, time, or venue; if a needed fact is missing, leave a clear blank and add a warnings entry):');
    parts.push(factLines.map((l) => `  - ${l}`).join('\n'));
  } else {
    parts.push('No structured facts were provided. Write from the gist only and do not invent specifics (scores, times, venues, names).');
  }
  parts.push(
    (narrativeOnly ? '' : 'Follow the structure template for this kind from the voice profile. ')
    + 'Do NOT sign off by name (the signature is added separately, not by you). '
    + 'Return ONLY minified JSON (no markdown, no code fence) with exactly these keys: '
    + `body (the ${narrativeOnly ? 'narrative prose' : 'full briefing prose'}), card_summary (one ~10-second summary line), `
    + 'facts_used (array of {"k","v"} label/value pairs you relied on), '
    + 'warnings (array of short strings for any missing fact or caveat). '
    + 'Hard rules: NO em dashes (use periods, commas, colons, or the middot/pipe), no corporate jargon.',
  );
  return parts.join('\n\n');
}

// Strip a leading/trailing markdown code fence the model may wrap JSON in.
export function stripFences(raw) {
  return String(raw == null ? '' : raw).replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
}

// Defensive voice guard (profile §4 HARD DON'T): the prompt forbids em dashes;
// this catches any that slip through and maps them to a colon (matches #712).
export function stripEmDashes(s) {
  return String(s == null ? '' : s).replace(/\s*—\s*/g, ': ');
}

// Parse the model output into the locked response shape. Throws on non-JSON or
// a missing body so the handler can retry once, then surface { error }.
export function parseAiDraftOutput(raw) {
  let obj;
  try { obj = JSON.parse(stripFences(raw)); } catch { throw new Error('AI returned non-JSON output'); }
  if (!obj || typeof obj.body !== 'string' || !obj.body.trim()) throw new Error('AI output missing body');
  return {
    body: stripEmDashes(obj.body),
    card_summary: stripEmDashes(typeof obj.card_summary === 'string' ? obj.card_summary : ''),
    facts_used: Array.isArray(obj.facts_used) ? obj.facts_used : [],
    warnings: Array.isArray(obj.warnings) ? obj.warnings : [],
  };
}
