// Static-grep audit — enforces anti-pattern #36 on `.maybeSingle()` callsites.
//
// Per CLAUDE.md anti-pattern #36: destructured defaults on Supabase
// `.from(...).maybeSingle()` calls silently swallow errors. The pattern
// `const { data: x } = await ...maybeSingle()` resolves `data` to `null`
// on ANY error path (column missing, RLS denied, transient DB issue),
// giving callers zero diagnostic signal.
//
// Origin: Beta synthesis carryover from 2026-05-16 audit. PR #211 closed
// the first batch in briefing resolvers; this audit + PR (the V-22 sweep)
// closes the broader follow-through across all 27 remaining callsites.
//
// Rule: every `.maybeSingle()` call MUST destructure `error` alongside
// `data`, and the caller MUST check `error` before using `data`.
//
// This test fails if any future PR introduces a new `.maybeSingle()`
// callsite without the error destructure. Same drift-hedge pattern as
// PR #234's timezoneAuditPin and PR #237's threshold-inclusive boundary
// test — per CLAUDE.md anti-pattern #43.

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const SRC_ROOT = 'src';
const IGNORE_DIR_NAMES = new Set(['__tests__']);
const IGNORE_FILE_RE = /\.test\.(js|jsx)$/;

// Pattern-A: `{ data: <var> } = ... .maybeSingle()` without error destructure
const PATTERN_A_RE = /\{\s*data:\s*\w+(\s*=\s*[^}]+)?\s*\}\s*=.*maybeSingle/;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (IGNORE_DIR_NAMES.has(entry)) continue;
    const s = statSync(full);
    if (s.isDirectory()) out.push(...walk(full));
    else if (/\.(js|jsx)$/.test(entry) && !IGNORE_FILE_RE.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe('maybeSingle error-destructure audit (anti-pattern #36)', () => {
  it('no .maybeSingle() callsite uses { data: x } pattern without error destructure', () => {
    const violations = [];
    for (const file of walk(SRC_ROOT)) {
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, idx) => {
        if (PATTERN_A_RE.test(line)) {
          violations.push({ file, line: idx + 1, code: line.trim() });
        }
      });
    }
    if (violations.length) {
      const msg = violations
        .map((v) => `  ${v.file}:${v.line}\n    ${v.code}`)
        .join('\n');
      throw new Error(
        `${violations.length} .maybeSingle() call(s) missing error destructure (anti-pattern #36):\n${msg}`,
      );
    }
    expect(violations).toEqual([]);
  });
});
