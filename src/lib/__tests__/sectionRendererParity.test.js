/* global process */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SECTION_RENDERERS } from '../engine/sectionRenderers';

// Phase 3 D-7 — section renderer parity (closes B2.9 catalog drift).
//
// Catches a missing renderer at CI time: every section.kind emitted by
// a composer / resolver compose() output must have a corresponding
// SECTION_RENDERERS entry. Otherwise the orphan-kind guard renders an
// empty string at email time (AP #38) — silently broken email.
//
// Approach: grep every src/lib/engine/{renderers,resolvers}/*.js for
// `kind: '<name>'` literals inside section-push expressions, build the
// observed set, and assert each observed kind is in SECTION_RENDERERS.
// Also asserts the reverse — every SECTION_RENDERERS key is actually
// emitted by some composer (catches dead-renderer bloat).
//
// Origin: docs/AUDIT_BRIEFINGS_2026-06-02.md §B2.9 — 33 entries in
// SECTION_RENDERERS, coverage doc said 32, no test held them aligned.

const ENGINE_DIR = join(process.cwd(), 'src', 'lib', 'engine');
const SCAN_SUBDIRS = ['renderers', 'resolvers'];

// Some section kinds are emitted under conditional branches the grep
// catches but only fire from external code (admin BCC sample, dev
// fixtures, etc.). Allowlist for known dead-emit cases — empty today;
// extend with justification.
const ALLOWED_DEAD_RENDERERS = new Set();

// Renderer entries whose section.kind is referenced via dynamic string
// rather than literal (rare). Add with justification — exempts them
// from the "every renderer must be emitted" check.
const RENDERER_DYNAMIC_REFS = new Set([
  // Currently none — keep here for future cases like a resolver
  // that pushes { kind: variant } from a switch.
]);

function listFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === '__fixtures__') continue;
      out.push(...listFiles(join(dir, entry.name)));
      continue;
    }
    if (!entry.name.endsWith('.js')) continue;
    if (entry.name.includes('.test.')) continue;
    out.push(join(dir, entry.name));
  }
  return out;
}

function extractKindLiterals(src) {
  // Matches both
  //   { kind: 'header', ... }
  //   sections.push({ kind: 'header', ... })
  // Excludes top-level `kind: '<x>'` outside object expressions by
  // requiring a `{` somewhere on the prior 50 chars window.
  const out = new Set();
  const re = /\{[^{}]{0,200}\bkind:\s*'([a-z_]+)'/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    out.add(m[1]);
  }
  return out;
}

describe('SECTION_RENDERERS catalog parity (Phase 3 D-7 / B2.9 guard)', () => {
  // Non-section uses of the `kind:` property in resolver/renderer source
  // (slice.kind, event.status, scheduleChange diff fields, etc.). These
  // pattern-match the extractor but aren't section kinds. Exempting them
  // here is mechanical — adding a new one means a NEW non-section `kind:`
  // usage was introduced, which is worth a code review.
  const NON_SECTION_KINDS = new Set([
    'family',           // slice.kind for per-family fan-out
    'single_recipient', // slice.kind variant
    'cancelled',        // event.status literal in renderers
    'time',             // schedule_change diff field
    'location',         // schedule_change diff field
    'opponent',         // schedule_change diff field
    'team',             // slice.kind / audience filter scope
  ]);

  let emittedKinds;
  it('collects every section.kind literal from renderers + resolvers', () => {
    emittedKinds = new Set();
    for (const sub of SCAN_SUBDIRS) {
      const dir = join(ENGINE_DIR, sub);
      for (const path of listFiles(dir)) {
        const src = readFileSync(path, 'utf8');
        for (const k of extractKindLiterals(src)) emittedKinds.add(k);
      }
    }
    for (const k of NON_SECTION_KINDS) emittedKinds.delete(k);
    expect(emittedKinds.size, 'no kind literals found — extractor broken?').toBeGreaterThan(20);
  });

  it('every observed section.kind has a SECTION_RENDERERS entry', () => {
    const rendererKeys = new Set(Object.keys(SECTION_RENDERERS));
    const missing = Array.from(emittedKinds).filter((k) => !rendererKeys.has(k));
    expect(
      missing,
      `Section kinds emitted by composers but missing from SECTION_RENDERERS: ${missing.join(', ')}. Add a renderer (see src/lib/engine/renderers/) or remove the emitter.`,
    ).toEqual([]);
  });

  it('every SECTION_RENDERERS entry is emitted by some composer (no dead renderers)', () => {
    const rendererKeys = new Set(Object.keys(SECTION_RENDERERS));
    const dead = Array.from(rendererKeys).filter(
      (k) => !emittedKinds.has(k)
        && !ALLOWED_DEAD_RENDERERS.has(k)
        && !RENDERER_DYNAMIC_REFS.has(k),
    );
    expect(
      dead,
      `SECTION_RENDERERS entries with no observed emitter: ${dead.join(', ')}. Either find the emitter and add it to RENDERER_DYNAMIC_REFS with justification, or delete the unused renderer.`,
    ).toEqual([]);
  });
});
