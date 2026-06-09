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

APPLY STATUS (2026-06-09):
  S3 + S4 — APPLIED to production via MCP on Frank's GO (architect pre-flighted the
    premises live). Mirrors now live in supabase/migrations/:
      20260609015340_registrations_program_player_partial_unique.sql
      20260609015354_financial_accounts_season_fk_restrict.sql
    Their staged copies were removed from this dir (they are real migrations now).
  S1 + S2 — STILL STAGED (below). S1 wants an architect pre-flight of the FUNCTION
    BODY (not just premises); S2 is sequencing-locked AFTER/WITH S1.
  S5 FORK-ANON-GRANTS — not staged (awaiting the architect's Q2 ruling).

REMAINING APPLY ORDER (dependency-correct):
  1. S1_rollover_season_rpc.sql   (carries team_type_id forward — must precede S2)
  2. S2_team_type_not_null.sql    (NOT NULL + FK RESTRICT)

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
