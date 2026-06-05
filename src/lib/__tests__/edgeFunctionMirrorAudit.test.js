// Platform PR ζ (L99 platform audit, 2026-05-21) — edge-function mirror
// byte-compare audit. Enforces CLAUDE.md anti-pattern #30: helpers shared
// with vitest live in two mirrored files (Deno .ts in supabase/functions/*
// + src/lib/* .js) "byte-near-identical apart from TS annotations."
// Same shape as verifyJwtConfigAudit.test.js (#31 enforcement).
//
// Mechanism: normalize both sides (strip comments + TS annotations + quote
// variants + whitespace) and assert resulting line-diff stays within a
// per-pair baseline. New drift → diff grows → fail. Drift closed → diff
// shrinks → baseline lowered in same PR (visible in review).
//
// 2026-05-21 first-run discovery: all 4 pairs carried pre-existing drift
// (function renames, destructuring shape, quote style inside template
// `${}` interpolations, header-comment content). PR ζ follow-up
// (chore/mirror-drift-cleanup) harmonized stylistic drift and lowered
// the baselines. Residual diff per pair = unavoidable TS-only annotation
// (typed Map<>, typed empty array, inline type-object on destructured
// param, `(e as Error)` cast) that the normalizer cannot fully strip.
//
// Deferred (spec edge cases + 150-line cap):
//   - team-feed/index.ts inline ICS block ↔ src/lib/icalHelpers.js
//     (needs marker-extraction or _helpers.ts split first).
//   - briefing-auto-draft-tick/_handlers.ts + _draftRow.ts (Deno-only).
//   - send-tournament-message/_lib.ts (no src/lib mirror today).

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

const TS_KEYWORDS = ['string', 'number', 'boolean', 'void', 'any', 'unknown', 'never', 'null', 'undefined', 'object'];

const PAIRS = [
  { ts: 'supabase/functions/briefing-auto-draft-tick/_helpers.ts', js: 'src/lib/cron/briefingCronHelpers.js', baseline: 2 },
  { ts: 'supabase/functions/parse-tournament-schedule/_helpers.ts', js: 'src/lib/import/parseTournamentSchedulePrompt.js', baseline: 4 },
  { ts: 'supabase/functions/suggest-briefing-closer/_helpers.ts', js: 'src/lib/briefings/suggestCloserPrompt.js', baseline: 2 },
  { ts: 'supabase/functions/suggest-briefing-closer/_scheduleGaps.ts', js: 'src/lib/briefings/scheduleGaps.js', baseline: 9 },
  { ts: 'supabase/functions/briefing-auto-draft-tick/_rsvpNudgeThreshold.ts', js: 'src/lib/cron/rsvpNudgeThreshold.js', baseline: 0 },
];

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/[^\n]*$/gm, '').replace(/[ \t]+\/\/[^\n]*$/gm, '');
}

function stripBalancedInterface(s) {
  const m = /(?:^|\n)([ \t]*)(?:export\s+)?interface\s+\w+(?:\s*<[^>]*>)?\s*\{/.exec(s);
  if (!m) return s;
  const start = m.index + (s[m.index] === '\n' ? 1 : 0);
  let depth = 0; let opened = false; let j = start;
  for (; j < s.length; j++) {
    if (s[j] === '{') { depth++; opened = true; }
    else if (s[j] === '}') { depth--; if (opened && depth === 0) { j++; break; } }
  }
  return stripBalancedInterface(s.slice(0, start) + s.slice(j));
}

function stripTypeAnnotations(s) {
  let out = ''; const stack = []; let inT = false; let inS = null; let i = 0;
  while (i < s.length) {
    const c = s[i], n = s[i + 1];
    if (inT) { out += c; if (c === '\\') { out += n; i += 2; continue; } if (c === '`') inT = false; i++; continue; }
    if (inS) { out += c; if (c === '\\') { out += n; i += 2; continue; } if (c === inS) inS = null; i++; continue; }
    if (c === '`') { inT = true; out += c; i++; continue; }
    if (c === "'" || c === '"') { inS = c; out += c; i++; continue; }
    if (c === '(' || c === '{' || c === '[') { stack.push(c); out += c; i++; continue; }
    if (c === ')' || c === '}' || c === ']') { stack.pop(); out += c; i++; continue; }
    if (c === ':') {
      let j = i + 1; while (j < s.length && /\s/.test(s[j])) j++;
      const after = s.slice(j);
      const tsPrim = TS_KEYWORDS.some((p) => after.startsWith(p) && /[\s,)=;{[<|>\n]/.test(after[p.length] || ''));
      const capType = /^[A-Z][A-Za-z0-9_]/.test(after);
      let p = out.length - 1; while (p >= 0 && /\s/.test(out[p])) p--;
      const retPos = p >= 0 && out[p] === ')';
      if ((stack[stack.length - 1] === '(' || retPos) && (tsPrim || capType)) {
        let depth = 0; let k = j;
        while (k < s.length) {
          const cc = s[k];
          if (cc === '<' || cc === '(' || cc === '[') depth++;
          else if (cc === '>' || cc === ')' || cc === ']') { if (depth === 0) break; depth--; }
          else if (depth === 0 && (cc === ',' || cc === '=' || cc === ';' || cc === '\n' || cc === '{')) break;
          k++;
        }
        i = k; continue;
      }
    }
    out += c; i++;
  }
  return out;
}

function stripTs(src) {
  let s = src;
  s = s.replace(/^[ \t]*import\s+type\s+[^;\n]+;?\s*$/gm, '');
  s = s.replace(/^[ \t]*(export\s+)?type\s+\w+\s*=[^;\n]+;?\s*$/gm, '');
  s = stripBalancedInterface(s);
  s = s.replace(/\s+as\s+[A-Z][\w<>[\]|]*/g, '');
  s = s.replace(/!(?=[.);\],])/g, '');
  s = s.replace(/(\b[a-zA-Z_]\w*)\?(?=\s*[:,)])/g, '$1');
  s = s.replace(/<[A-Za-z_][\w<>[\]|, ]*>(?=\()/g, '');
  s = stripTypeAnnotations(s);
  return s;
}

function normalizeQuotes(s) {
  let out = ''; let inT = false; let inS = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i], n = s[i + 1];
    if (inT) { out += c; if (c === '\\') { out += n; i++; continue; } if (c === '`') inT = false; continue; }
    if (inS) { if (c === '\\') { out += c + n; i++; continue; } if (c === inS) { out += "'"; inS = null; continue; } out += c; continue; }
    if (c === '`') { inT = true; out += c; continue; }
    if (c === '"') { inS = '"'; out += "'"; continue; }
    if (c === "'") { inS = "'"; out += "'"; continue; }
    out += c;
  }
  return out;
}

function normalize(src, isTs) {
  let s = stripComments(src);
  if (isTs) s = stripTs(s);
  s = normalizeQuotes(s);
  s = s.split('\n').map((l) => l.replace(/\s+$/, '')).join('\n');
  s = s.replace(/\n{2,}/g, '\n').replace(/\)\{/g, ') {');
  return s.trim();
}

// Set-based diff: counts lines present in only one side. Position-
// insensitive (a line reordered without content change adds 0 to diff).
// Lower bound on true positional drift; fine as a regression signal.
function lineDiffCount(a, b) {
  const A = a.split('\n'), B = b.split('\n');
  const setA = new Set(A), setB = new Set(B);
  let n = 0;
  for (const l of A) if (!setB.has(l)) n++;
  for (const l of B) if (!setA.has(l)) n++;
  return n;
}

describe('Edge function mirror byte-compare audit (CLAUDE.md anti-pattern #30)', () => {
  for (const { ts, js, baseline } of PAIRS) {
    it(`${ts} ↔ ${js} normalized diff ≤ ${baseline} lines`, () => {
      const tsNorm = normalize(readFileSync(ts, 'utf-8'), true);
      const jsNorm = normalize(readFileSync(js, 'utf-8'), false);
      const actual = lineDiffCount(tsNorm, jsNorm);
      expect(actual, `Mirror drift between ${ts} and ${js}: ${actual} diff lines (baseline ${baseline}). If you ADDED drift, sync the two files. If you CLOSED drift, lower the baseline in this test file to match (visible in review). See anti-pattern #30.`).toBeLessThanOrEqual(baseline);
    });
  }
});
