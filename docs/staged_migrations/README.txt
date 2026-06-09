STAGED MIGRATIONS — programs Tier-1 forks (HELD, NOT APPLIED)
=============================================================
Pre-staged on Frank's directive (2026-06-08) so the ratified forks are
apply-ready the moment GO lands. These are NOT in supabase/migrations/ on
purpose: per AP#21, the canonical timestamped mirror .sql is written the SAME
turn the migration is actually applied via MCP (apply_migration) — pre-placing a
timestamped file here would risk a version-string collision / duplicate. When GO
lands, the architect/CC applies each via the MCP lane and the mirror lands in
supabase/migrations/ with the production version-string prefix at that moment.

SOURCE OF TRUTH for rationale/verification: docs/PROGRAMS_TIER1_FORK_SPECS_2026-06-08.txt
RATIFICATION: docs/ (architect 2026-06-08) — S1/S2/S3/S4 ratified; S5 not yet ruled.

APPLY ORDER (dependency-correct):
  1. S1_rollover_season_rpc.sql   (carries team_type_id forward — must precede S2)
  2. S2_team_type_not_null.sql    (NOT NULL + FK RESTRICT)
  3. S3_registrations_partial_unique.sql   (independent)
  4. S4_financial_accounts_fk_restrict.sql (independent)
  (S5 FORK-ANON-GRANTS not staged — awaiting the architect's Q2 ruling.)

OPEN DECISION POINTS still gating a clean apply (architect pre-flights each):
  - S1 Q-A: the ratification names BOTH (a) new season status 'draft' AND
    (e) activate-in-txn. These are in tension (a draft season is not active).
    S1 below implements: create as 'draft', and an OPTIONAL plan.activate-gated
    atomic activation block (archive-others-then-activate in the same txn). The
    architect must confirm whether rollover auto-activates or lands draft-only.
  - S1 Q-B financial-carry: implemented as clean-slate (0 cents carried; CC lean).
  - S1 Q-C org-assert: implemented inline via current_user_org_ids(); the
    assert_org_owns_* helper (AP#57) is the alternative.
  - S1 view-vs-table write: writes target the `seasons` view (security_invoker +
    check_option=cascaded). As a SECURITY DEFINER fn this needs a pre-flight on
    whether to write the view or the base table. Flagged inline.

Each file ends with an in-migration DO-block verify. NOTHING here is applied.
