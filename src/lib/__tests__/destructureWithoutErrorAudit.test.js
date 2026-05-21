// Static-grep audit — enforces anti-pattern #36 broadly across Supabase
// `.from(...)` / `.rpc(...)` chains, beyond `.maybeSingle()`.
//
// Per CLAUDE.md anti-pattern #36: destructured defaults on Supabase
// `.from(...)` / `.rpc(...)` results silently swallow errors. The pattern
// `const { data: rows = [] } = await supabase.from('foo').select(...)`
// resolves `data` to `null` on ANY error path (column missing, RLS denied,
// transient DB issue, RPC name typo), and the `= []` default substitutes
// silently — callers get an empty result with zero diagnostic signal.
//
// Existing audit `maybeSingleErrorAudit.test.js` covers `.maybeSingle()`
// only. L99 platform audit Batches 1, 12, 2b surfaced 25+ instances of
// the broader pattern (bare `.select()` / `.rpc()` chains and `.then`
// callbacks). This audit closes the cross-batch finding by walking the
// full src/ + supabase/functions/ tree and pinning the baseline.
//
// Detection:
//   (A) `const { ..., data, ... } = await (supabase|sb|sbClient|client)
//       .(from|rpc)(...)` where the destructure block does NOT contain
//       `error`. Catches `const { data } = await sb.from(...)...`,
//       `const { data: rows = [] } = await ...`, etc.
//   (B) `.then(({ data }) => ...)` (and `.then(({ data: foo }) => ...)`)
//       on a chain that originates from a supabase/sb/sbClient/.from/.rpc
//       call within the prior 200 chars. Detects the lambda-shape silent-
//       substitution variant.
//
// Correct pattern (anti-pattern #36 fix):
//   const { data, error } = await supabase.from('x').select(...);
//   if (error) throw error;
//   const rows = data || [];
//
// This test fails CI if the number of violations exceeds the pinned
// baseline. Baseline is the current state of the codebase as of PR shipping
// this audit (post-PR #448 + BUNDLE B1 in-flight) — locking discipline
// without blocking the in-progress sweep. Drift-hedge per anti-pattern #43;
// same shape as PR #234's `timezoneAuditPin.test.js`.

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const ROOTS = ['src', 'supabase/functions'];
const IGNORE_DIR_NAMES = new Set(['__tests__', 'node_modules', '.git', 'dist']);
const IGNORE_FILE_RE = /\.test\.(js|jsx|ts)$/;

// Baseline pinned at audit-introduction time. New violations fail CI; sweep
// PRs that fix existing sites lower this number in the same PR (visible in
// review). Mirrors `edgeFunctionMirrorAudit.test.js` baseline-lowering
// pattern.
const BASELINE_VIOLATIONS = 44;

// Pattern A — `const { ...data... } = await (supabase|sb|sbClient|client)
// .(from|rpc)(...)` with no `error` in the destructure block.
const AWAIT_DESTRUCTURE_RE =
  /\bconst\s*\{([^}]*?)\}\s*=\s*await\s+(supabase|sb|sbClient|client)\s*\.\s*(from|rpc)\s*\(/g;

// Pattern B — `.then(({ data ... }) => ...)` on a supabase chain.
// Anchored on the destructure shape; we verify the supabase origin via
// preceding-text lookback (next 200 chars) to keep the regex compact.
const THEN_DESTRUCTURE_RE = /\.then\(\s*\(?\s*\{([^}]*)\}\s*\)?\s*=>/g;

// Lookback regex: confirm the chain originates in supabase/sb/sbClient/
// client .from/.rpc within the preceding window.
const SUPABASE_ORIGIN_RE =
  /(supabase|sb|sbClient|client)\s*\.\s*(from|rpc)\s*\(/;

function destructureHasError(block) {
  // `error` is the only name we accept; aliases like `error: e` still
  // contain the word `error` and pass the check. Aliases like `err:
  // somethingElse` do NOT count — must be the literal `error` identifier
  // on the LEFT of the colon (or bare).
  return /\berror\b/.test(block);
}

function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (IGNORE_DIR_NAMES.has(entry)) continue;
    const s = statSync(full);
    if (s.isDirectory()) out.push(...walk(full));
    else if (/\.(js|jsx|ts)$/.test(entry) && !IGNORE_FILE_RE.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function collectViolations() {
  const violations = [];
  for (const root of ROOTS) {
    for (const file of walk(root)) {
      let content;
      try {
        content = readFileSync(file, 'utf8');
      } catch {
        continue;
      }

      // Pattern A
      const reA = new RegExp(AWAIT_DESTRUCTURE_RE.source, 'g');
      let mA;
      while ((mA = reA.exec(content)) !== null) {
        const block = mA[1];
        if (!/\bdata\b/.test(block)) continue;
        if (destructureHasError(block)) continue;
        const lineNum = content.slice(0, mA.index).split('\n').length;
        violations.push({ pattern: 'A', file, line: lineNum });
      }

      // Pattern B
      const reB = new RegExp(THEN_DESTRUCTURE_RE.source, 'g');
      let mB;
      while ((mB = reB.exec(content)) !== null) {
        const block = mB[1];
        if (!/\bdata\b/.test(block)) continue;
        if (destructureHasError(block)) continue;
        const before = content.slice(Math.max(0, mB.index - 200), mB.index);
        if (!SUPABASE_ORIGIN_RE.test(before)) continue;
        const lineNum = content.slice(0, mB.index).split('\n').length;
        violations.push({ pattern: 'B', file, line: lineNum });
      }
    }
  }
  return violations;
}

describe('destructure-without-error audit (anti-pattern #36)', () => {
  it(`no NEW destructure-without-error violations beyond baseline (${BASELINE_VIOLATIONS})`, () => {
    const violations = collectViolations();
    if (violations.length > BASELINE_VIOLATIONS) {
      const msg = violations
        .map((v) => `  [${v.pattern}] ${v.file}:${v.line}`)
        .join('\n');
      throw new Error(
        `${violations.length} destructure-without-error violations (baseline ${BASELINE_VIOLATIONS}). ` +
          `Anti-pattern #36 — destructure data WITHOUT error check silently swallows errors. ` +
          `If you ADDED a violation, destructure error alongside data and check it before use. ` +
          `If you FIXED violations, lower BASELINE_VIOLATIONS in this test file to match (visible in review).\n${msg}`,
      );
    }
    expect(violations.length).toBeLessThanOrEqual(BASELINE_VIOLATIONS);
  });
});
