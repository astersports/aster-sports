// G5 OPT-B re-drive sweep safety guard (static-source lock; mirrors the
// stuckSendsGuard shape). The whole OPT-B contract is: the cron auto-re-drives
// ONLY provably-safe 'failed' rows under the redrive_count<3 cap, NEVER the
// ambiguous 'queued' class (crash-after-dispatch double-send hold, PR 1a), and
// it RE-APPLIES the pilot + suppression gate at re-drive time via the shared
// pure kernels. These assert those properties at the source.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

const REDRIVE = readFileSync('supabase/functions/briefing-auto-draft-tick/_redrive.ts', 'utf8');

describe('G5 OPT-B redrive sweep — only safe failed rows, never queued', () => {
  it("selects ONLY delivery_status='failed' + redrive_count<3", () => {
    expect(REDRIVE).toMatch(/\.eq\(["']delivery_status["'],\s*["']failed["']\)/);
    expect(REDRIVE).toMatch(/\.lt\(["']redrive_count["'],\s*3\)/);
  });

  it("NEVER selects/filters the ambiguous 'queued' class for re-drive", () => {
    // No re-drive query may target delivery_status 'queued' (human-review only).
    expect(REDRIVE).not.toMatch(/\.eq\(["']delivery_status["'],\s*["']queued["']\)/);
    // 'queued' may appear only inside a comment line, never in executable code
    // (e.g. a select string, an .eq filter value, or a status literal).
    const codeOnly = REDRIVE.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
    expect(codeOnly).not.toMatch(/["']queued["']/);
  });

  it('re-applies BOTH the pilot gate and the suppression gate at re-drive time', () => {
    expect(REDRIVE).toMatch(/decidePilotGate\(/);
    expect(REDRIVE).toMatch(/decideSuppression\(/);
    // imported from the cron's LOCAL kernel mirror (AP#30), not cross-tree.
    expect(REDRIVE).toMatch(/from\s+["']\.\/_dispatch\.ts["']/);
  });

  it('caps escalation at redrive_count reaching 3 (no further auto-retry)', () => {
    expect(REDRIVE).toMatch(/next\s*>=\s*3/);
  });
});
