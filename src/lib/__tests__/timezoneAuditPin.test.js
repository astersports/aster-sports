// Static-grep audit — enforces the NY-pin invariant for every
// date-rendering call across the codebase.
//
// Per CLAUDE.md anti-pattern #31: a vitest assertion that fails CI
// if any toLocale* date-rendering call lands without a timeZone
// option.
//
// Background: PR #233 fixed the canonical formatters.js source, and
// the follow-up (this PR) NY-pinned 51 leaf callsites. This test
// guards the invariant going forward — future contributors can't
// accidentally re-introduce the bug.
//
// Design choice — bracket-balance over fixed-line window:
// the audit walks forward from the matching `(` tracking paren depth
// (skipping over string literals and JS comments) to capture the
// FULL call expression regardless of how the options object is
// formatted. A fixed N-line window would miss arbitrarily-large
// multi-line options objects AND wrongly succeed on post-call
// context. The bracket-balancer is the dedicated approach for the
// dedicated problem.
//
// Discriminator: toLocaleTimeString / toLocaleDateString are
// Date-only methods (always flag without timeZone). toLocaleString
// is ambiguous (Date, Number, Array); we skip when a Number-formatter
// signal is present in the options (style, fractionDigits, notation,
// signDisplay, useGrouping, currency*, unit*, compactDisplay).
//
// Known limitations (punt to eslint-disable escape if/when they
// surface):
//   - Pre-defined options vars (`const opts = {...}; .toLocale*(
//     'en-US', opts)`) false-positive because the audit walks the
//     call range only, not the enclosing function scope. Zero
//     callsites use this pattern in repo today (TournamentHeader
//     and TournamentListItem had it pre-PR and were inlined).
//   - Variable locale args (e.g. `.toLocale*(localeVar, ...)`)
//     are not flagged because LOCALE_FIRST_ARG_RE requires a string
//     literal. Same eslint-disable escape applies.

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const SRC_ROOT = 'src';
const IGNORE_PATHS = ['src/lib/formatters.js'];
const IGNORE_DIR_NAMES = new Set(['__tests__']);
const IGNORE_FILE_RE = /\.test\.(js|jsx)$/;

const METHOD_RE = /\.toLocale(Time|Date)?String\(/g;
const LOCALE_FIRST_ARG_RE =
  /^\(\s*['"][a-z]{2}(-[A-Z]{2})?['"]/;
const NUMBER_FORMATTER_RE =
  /(\bstyle\s*:|\b(?:minimum|maximum)FractionDigits\b|\bnotation\s*:|\bsignDisplay\b|\buseGrouping\b|\bcurrency(?:Display|Sign)?\s*:|\bunit(?:Display)?\s*:|\bcompactDisplay\s*:)/;
const TIMEZONE_PIN_RE = /\btimeZone\s*:/;

function findMatchingParen(content, openIdx) {
  let depth = 0;
  let i = openIdx;
  const len = content.length;
  while (i < len) {
    const ch = content[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      i++;
      while (i < len) {
        if (content[i] === '\\') { i += 2; continue; }
        if (content[i] === quote) { i++; break; }
        if (quote === '`' && content[i] === '$' && content[i + 1] === '{') {
          i += 2;
          let bdepth = 1;
          while (i < len && bdepth > 0) {
            if (content[i] === '{') bdepth++;
            else if (content[i] === '}') bdepth--;
            i++;
          }
          continue;
        }
        i++;
      }
      continue;
    }
    if (ch === '/' && content[i + 1] === '/') {
      while (i < len && content[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && content[i + 1] === '*') {
      i += 2;
      while (i < len - 1 && !(content[i] === '*' && content[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  return -1;
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (IGNORE_DIR_NAMES.has(entry)) continue;
    if (IGNORE_PATHS.includes(full)) continue;
    const s = statSync(full);
    if (s.isDirectory()) out.push(...walk(full));
    else if (/\.(js|jsx)$/.test(entry) && !IGNORE_FILE_RE.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe('timezone audit pin', () => {
  it('every toLocale* date call across src/ has a timeZone option', () => {
    const violations = [];
    for (const file of walk(SRC_ROOT)) {
      const content = readFileSync(file, 'utf8');
      const re = new RegExp(METHOD_RE.source, 'g');
      let match;
      while ((match = re.exec(content)) !== null) {
        const isDateOnly = match[1] !== undefined;
        const openIdx = match.index + match[0].length - 1;
        const closeIdx = findMatchingParen(content, openIdx);
        if (closeIdx === -1) continue;
        const callRange = content.slice(openIdx, closeIdx + 1);
        if (!LOCALE_FIRST_ARG_RE.test(callRange)) continue;
        if (!isDateOnly && NUMBER_FORMATTER_RE.test(callRange)) continue;
        if (TIMEZONE_PIN_RE.test(callRange)) continue;
        const lineNum = content.slice(0, match.index).split('\n').length;
        const lineContent = content.split('\n')[lineNum - 1].trim();
        violations.push({ file, line: lineNum, code: lineContent });
      }
    }
    if (violations.length) {
      const msg = violations
        .map((v) => `  ${v.file}:${v.line}\n    ${v.code}`)
        .join('\n');
      throw new Error(
        `${violations.length} toLocale* date call(s) missing timeZone pin:\n${msg}`,
      );
    }
    expect(violations).toEqual([]);
  });
});
