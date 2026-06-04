// Pure helpers for the briefing-ai-draft edge function (prompt assembly +
// output parsing). NO Node/Deno APIs — standard ES only, so this file and its
// Deno mirror stay byte-near-identical.
//
// AP #30: this is the vitest-covered SOURCE OF TRUTH. The Deno mirror lives at
// supabase/functions/briefing-ai-draft/_helpers.ts. Change BOTH in one commit.

// v1 free-form kinds (AI-1). Anchored kinds (AI-2) resolve facts server-side
// and are gated separately; see the edge fn handler.
export const FREE_FORM_KINDS = ['announcement', 'custom_message'];

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
export function buildAiDraftUserPrompt({ kind, framing, factLines, gist }) {
  const parts = [`Draft a ${String(kind).replace(/_/g, ' ')} briefing for ${framing}.`];
  if (gist && gist.trim()) parts.push(`What it needs to say: ${gist.trim()}`);
  if (factLines && factLines.length) {
    parts.push('Facts (use VERBATIM; never invent or alter a number, name, time, or venue; if a needed fact is missing, leave a clear blank and add a warnings entry):');
    parts.push(factLines.map((l) => `  - ${l}`).join('\n'));
  } else {
    parts.push('No structured facts were provided. Write from the gist only and do not invent specifics (scores, times, venues, names).');
  }
  parts.push(
    'Follow the structure template for this kind from the voice profile, and sign off by name. '
    + 'Return ONLY minified JSON (no markdown, no code fence) with exactly these keys: '
    + 'body (the full briefing prose), card_summary (one ~10-second summary line), '
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
