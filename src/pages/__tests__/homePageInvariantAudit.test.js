// Cross-role home-page structural invariant audit per
// anti-pattern #43 + #11.
//
// Locks two decisions made across Wednesday's session arc
// (PRs #297 / #304 / #310):
//
//   (1) Each role's home page consumes its corresponding signal-
//       aggregator hook (useXHomeSignals). The pattern is now
//       proven across all three roles; this test prevents a future
//       refactor from inlining the hook back into the page (which
//       would re-introduce the 150-line-cap violations these
//       extractions resolved).
//
//   (2) Each home page file stays under the 150-line cap from
//       anti-pattern #11. The pre-commit hook already enforces this
//       on staged files; this audit catches any main-branch
//       regression (e.g., if hook is bypassed via --no-verify, or
//       if a future refactor lands without running the hook).
//
// Same drift-hedge shape as financialMathAudit (PR #306),
// eventTitleAudit (PR #298), timezoneAuditPin, and
// routeAccessibility tests.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PAGES_DIR = join(__dirname, '..');

const HOMES = [
  { file: 'ParentHomePage.jsx', hook: 'useParentHomeSignals' },
  { file: 'CoachHomePage.jsx',  hook: 'useCoachHomeSignals'  },
  { file: 'AdminHomePage.jsx',  hook: 'useAdminHomeSignals'  },
];

const LINE_CAP = 150;

describe('home-page invariant audit', () => {
  for (const { file, hook } of HOMES) {
    describe(file, () => {
      const path = join(PAGES_DIR, file);
      const src = readFileSync(path, 'utf-8');
      const lineCount = src.split('\n').length;

      it(`imports ${hook}`, () => {
        const importRe = new RegExp(`import\\s*\\{[^}]*\\b${hook}\\b[^}]*\\}`);
        expect(src).toMatch(importRe);
      });

      it(`stays under ${LINE_CAP} lines (anti-pattern #11)`, () => {
        expect(lineCount, `${file} is ${lineCount} lines (cap ${LINE_CAP})`).toBeLessThanOrEqual(LINE_CAP);
      });
    });
  }
});
