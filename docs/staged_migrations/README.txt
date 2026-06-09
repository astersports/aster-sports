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
  S3 + S4 — APPLIED via MCP. Mirrors live in supabase/migrations/:
      20260609015340_registrations_program_player_partial_unique.sql
      20260609015354_financial_accounts_season_fk_restrict.sql
  S1 — SUPERSEDED + APPLIED. The architect authored the canonical rollover RPC
    (Rule 7) from this staged reference + live schema and applied it as
      20260609031536_rollover_season_rpc_atomic.sql  (= H-2)
    The staged S1_rollover_season_rpc.sql was removed (superseded). Next: CC ships
    B-PR3 (switch useSeasonRollover to .rpc('rollover_season', ...) + src_team_id),
    GO before push; then H-3 (= S2) lands AFTER B-PR3.
  S2 — STILL STAGED (below) = H-3. Sequencing-locked AFTER B-PR3 (the client switch
    is the gate; NOT NULL before it would 23502 any team writer that omits the type).
  S5 FORK-ANON-GRANTS — not staged (architect ruled it defense-in-depth, deferred).

REMAINING APPLY ORDER (dependency-correct):
  1. (done) rollover RPC = 20260609031536 (H-2)
  2. CC B-PR3 client switch (GO before push)
  3. S2_team_type_not_null.sql = H-3 (NOT NULL + FK RESTRICT), AFTER B-PR3

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
