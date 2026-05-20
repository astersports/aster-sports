// Static-grep audit — enforces that every role-home page top-level
// loading gate waits on >1 loading signal.
//
// Per CLAUDE.md anti-pattern #43 (cross-role fixes ship with a
// cross-surface invariant test): the Wednesday→Thursday gate-extension
// PR (Frank-reported 2026-05-20) replaced single-signal gates on
// AdminHomePage / CoachHomePage / ParentHomePage with multi-signal
// composites. This audit locks the invariant — a future PR that
// reverts to a single-signal gate (or removes the gate entirely)
// fails CI, forcing the structural fix rather than per-page patching.
//
// Detection: each page declares `const isLoading = <expr>;` exactly
// once. The expression MUST contain at least one `||` (a composite
// of >=2 loading signals). Single-identifier gates fail.
//
// Drift-hedge: catches the failure mode where someone "simplifies"
// the gate back to one signal, re-introducing the cascade flash
// Frank reported. The shape mirrors timezoneAuditPin (PR #234) and
// verifyJwtConfigAudit (anti-pattern #31).

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const HOME_PAGES = [
  'src/pages/AdminHomePage.jsx',
  'src/pages/CoachHomePage.jsx',
  'src/pages/ParentHomePage.jsx',
];

describe('home page top-level loading gates (anti-pattern #43 invariant)', () => {
  HOME_PAGES.forEach((path) => {
    it(`${path} declares a composite isLoading gate (>=2 signals)`, () => {
      const src = readFileSync(path, 'utf8');
      const match = src.match(/const\s+isLoading\s*=\s*([^;]+);/);
      expect(match, `${path}: no \`const isLoading = ...;\` declaration found — the multi-signal gate has been removed`).not.toBeNull();
      const expr = match[1];
      const orCount = (expr.match(/\|\|/g) || []).length;
      expect(orCount, `${path}: isLoading expression "${expr.trim()}" combines fewer than 2 signals — anti-pattern #43 requires >=2 to prevent the cascade flash Frank reported 2026-05-20`).toBeGreaterThanOrEqual(1);
    });

    it(`${path} uses isLoading in the top-level gate`, () => {
      const src = readFileSync(path, 'utf8');
      const gate = src.match(/if\s*\(\s*isLoading\s*\)\s*return\s+<div[^>]*role=["']status["']/);
      expect(gate, `${path}: no \`if (isLoading) return <div role="status">\` gate found — the multi-signal gate is declared but not used`).not.toBeNull();
    });
  });
});
