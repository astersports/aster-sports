// Offline eval harness for the AI briefing drafter (scouting candidate A5).
//
// PURE + DETERMINISTIC — no model call, no IO, standard ES only. Given the
// allowed facts and a raw model-output string, it returns a structured verdict
// of fact-fidelity + voice violations. This is the ENABLING CONTROL for the
// gated AI changes (model upgrade A2, structured outputs A1, ingest fallback
// A3): each rides this harness's golden set before promotion.
//
// It is NOT wired into the live edge function — production output is unchanged.
// Wiring it as a runtime guard is a separate, gated step (the AI output path is
// user-visible). For now it scores fixtures in vitest only.
//
// What it protects (the prompt's own "Hard rules" in buildAiDraftUserPrompt):
//   - malformed_json     output isn't parseable minified JSON
//   - missing_body       parsed object has no non-empty body
//   - bad_shape          card_summary/facts_used/warnings wrong types
//   - em_dash            body/card_summary contain an em dash
//   - fabricated_number  a number in the prose is not grounded in the facts
//   - invented_fact      a facts_used value isn't present in the provided facts
//   - unsupported_context a banned within-game / season-position claim the
//                         facts don't support (opener, playoff, halftime, etc.)

import { stripFences } from './aiDraftPrompt.js';

// Within-game timeline + season-position claims the drafter must NOT assert
// unless the facts contain them (see buildAiDraftUserPrompt "Hard rules").
// Each is allowed iff its keyword appears in the provided facts text.
export const BANNED_CONTEXT_TERMS = [
  'halftime', 'second half', 'first half', 'quarter', 'overtime',
  'comeback', 'season opener', 'opening game', 'first game', 'last game',
  'final game', 'playoff', 'championship', 'undefeated', 'time to breathe',
];

const numbersIn = (s) => (String(s == null ? '' : s).match(/\d+/g) || []);
const norm = (s) => String(s == null ? '' : s).toLowerCase();

// Flatten a facts object (or pre-built "label: value" lines) into one lowercase
// blob + the set of every number that legitimately appears in the facts.
export function factsIndex(facts) {
  let text = '';
  if (Array.isArray(facts)) text = facts.join('\n');
  else if (facts && typeof facts === 'object') {
    text = Object.entries(facts)
      .filter(([, v]) => v != null && String(v).trim() !== '')
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join('\n');
  }
  return { text: norm(text), numbers: new Set(numbersIn(text)) };
}

// Single source of the verdict. `raw` is the model's raw output string.
export function evaluateAiDraft(raw, facts) {
  const violations = [];
  const add = (code, detail) => violations.push({ code, detail });
  const idx = factsIndex(facts);

  let obj;
  try {
    obj = JSON.parse(stripFences(raw));
  } catch {
    add('malformed_json', 'output is not parseable JSON');
    return { ok: false, violations };
  }
  if (!obj || typeof obj !== 'object') {
    add('malformed_json', 'parsed output is not an object');
    return { ok: false, violations };
  }

  const body = typeof obj.body === 'string' ? obj.body : '';
  if (!body.trim()) add('missing_body', 'no non-empty body');
  if (typeof obj.card_summary !== 'string') add('bad_shape', 'card_summary not a string');
  if (!Array.isArray(obj.facts_used)) add('bad_shape', 'facts_used not an array');
  if (!Array.isArray(obj.warnings)) add('bad_shape', 'warnings not an array');

  const prose = `${body}\n${typeof obj.card_summary === 'string' ? obj.card_summary : ''}`;

  if (/—/.test(prose)) add('em_dash', 'em dash present (use period/comma/colon/middot)');

  for (const n of numbersIn(prose)) {
    if (!idx.numbers.has(n)) add('fabricated_number', `"${n}" not in the provided facts`);
  }

  if (Array.isArray(obj.facts_used)) {
    for (const f of obj.facts_used) {
      const v = f && typeof f === 'object' ? String(f.v == null ? '' : f.v).trim() : '';
      if (v && !idx.text.includes(norm(v))) add('invented_fact', `facts_used value "${v}" not in facts`);
    }
  }

  const lowProse = norm(prose);
  for (const term of BANNED_CONTEXT_TERMS) {
    if (lowProse.includes(term) && !idx.text.includes(term)) {
      add('unsupported_context', `"${term}" asserted but not in the facts`);
    }
  }

  return { ok: violations.length === 0, violations };
}

// Convenience for the harness: score a whole golden set, returning per-case
// pass/fail vs each case's expected violation codes (order-independent).
export function scoreGoldenSet(cases) {
  return cases.map((c) => {
    const verdict = evaluateAiDraft(c.raw, c.facts);
    const got = [...new Set(verdict.violations.map((v) => v.code))].sort();
    const want = [...new Set(c.expect || [])].sort();
    return { name: c.name, got, want, pass: JSON.stringify(got) === JSON.stringify(want) };
  });
}
