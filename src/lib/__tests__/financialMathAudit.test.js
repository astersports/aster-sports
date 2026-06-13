// Drift-hedge audit per anti-pattern #43: static-grep that fails CI
// if any JSX or JS file outside the allowlist re-implements the
// financial-math accumulation patterns owned by useSeasonFinancials.
//
// Origin (PRs #303 / #304 / #305 / #306): five separate implementations
// of the same "billed/paid/outstanding" math had accumulated across
// the codebase — FinancialDashboardPage:60-68, the (later-removed)
// admin stats hook :82-111, useAdminHomeSignals (via separate hook),
// useParentHomeSignals (via separate hook), FamilyBalanceList:8-17.
// PRs #303-#306 consolidated all five through useSeasonFinancials.
// This test prevents the next developer from silently introducing a
// sixth.
//
// MONEY_SEAM_AUDIT 2026-06-11 (F-1 / STEP 1): useSeasonFinancials now
// reads the family_balances VIEW instead of re-deriving the math from
// raw columns, so it (and its computation fixture) no longer match the
// patterns and were removed from the allowlist — the guard now covers
// them too. The only remaining canonical writer is the one-shot import.
//
// Patterns flagged (any one fires):
//   - `season_fee_cents - discount_cents` accumulation
//   - `transaction_type === 'payment'` or `=== 'refund'` accumulators
//
// Allowlist:
//   - lib/__tests__/financialMathAudit.test.js (this file)
//   - lib/leagueAppsImport.js (one-shot import script; legitimate
//     INSERT path, not a render-time recomputation)

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC_ROOT = join(__dirname, '..', '..');
const ALLOWLIST = new Set([
  'lib/__tests__/financialMathAudit.test.js',
  'lib/leagueAppsImport.js',
]);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else if (/\.(js|jsx)$/.test(name)) out.push(full);
  }
  return out;
}

const PATTERNS = [
  /season_fee_cents\s*-\s*\w*discount_cents/,    // billed math
  /transaction_type\s*===\s*['"]payment['"]/,    // payment accumulator
  /transaction_type\s*===\s*['"]refund['"]/,     // refund accumulator
];

describe('financial-math drift-hedge audit', () => {
  it('no file outside useSeasonFinancials re-implements the billed/paid math', () => {
    const files = walk(SRC_ROOT);
    const offenders = [];
    for (const f of files) {
      const rel = relative(SRC_ROOT, f).replace(/\\/g, '/');
      if (ALLOWLIST.has(rel)) continue;
      const src = readFileSync(f, 'utf-8');
      for (const pat of PATTERNS) {
        const m = src.match(pat);
        if (m) {
          offenders.push(`${rel}: ${m[0]}`);
          break;
        }
      }
    }
    expect(offenders, `Inline financial-math re-implementation found — route through useSeasonFinancials:\n${offenders.join('\n')}`).toEqual([]);
  });

  // Unit-safety guard (Sections L99 audit 2026-06-13, P0-1): formatCurrency
  // ALREADY divides cents by 100 (formatters.js). A caller that pre-divides
  // — formatCurrency(x / 100) — renders money 100x too small. This is exactly
  // how the CoachPayoutsSection payout bug shipped; the accumulation grep
  // above did not cover it. Any formatCurrency(<expr> / 100) is a bug.
  it('no formatCurrency call pre-divides by 100 (double-divide / 100x bug)', () => {
    const files = walk(SRC_ROOT);
    const offenders = [];
    const MIS_UNIT = /formatCurrency\s*\([^)]*\/\s*100\b/;
    for (const f of files) {
      const rel = relative(SRC_ROOT, f).replace(/\\/g, '/');
      if (ALLOWLIST.has(rel)) continue;
      const src = readFileSync(f, 'utf-8');
      const m = src.match(MIS_UNIT);
      if (m) offenders.push(`${rel}: ${m[0]}`);
    }
    expect(offenders, `formatCurrency(x / 100) found — it already divides by 100; pass integer cents:\n${offenders.join('\n')}`).toEqual([]);
  });
});
