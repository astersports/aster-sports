// Static-grep invariant — AuthContext must fetch ALL user_roles rows for a
// user (multi-org), NEVER .maybeSingle(). After migration #0 (2026-05-29,
// EMBER_PROGRAM_SETUP_SPEC_v2 PR 0) user_roles allows multiple rows per user
// (UNIQUE(user_id, organization_id)); .maybeSingle() errors on >1 row and would
// break a multi-org parent's login (the family-first moat). This locks the
// anti-trap fix against regression. See ledger §4.BD.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

describe('AuthContext multi-org invariant (migration #0 anti-trap)', () => {
  const src = readFileSync('src/context/AuthContext.jsx', 'utf8');

  it('fetches user_roles without .maybeSingle() — multi-org safe', () => {
    const userRolesMaybeSingle = /from\(['"]user_roles['"]\)[\s\S]{0,400}?\.maybeSingle\(\)/.test(src);
    expect(
      userRolesMaybeSingle,
      'AuthContext must NOT call .maybeSingle() on user_roles — it errors on a multi-org user (>1 row) and breaks login. Fetch all rows and pick the active org (spec §2.3).',
    ).toBe(false);
  });

  it('still queries user_roles for membership', () => {
    expect(/from\(['"]user_roles['"]\)/.test(src)).toBe(true);
  });
});
