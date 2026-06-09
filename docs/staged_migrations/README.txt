STAGED MIGRATIONS — programs Tier-1 forks  (ALL APPLIED — closed-out record)
=============================================================================
This dir pre-staged the ratified Tier-1 forks (2026-06-08, Frank's directive)
as apply-ready references — NOT in supabase/migrations/ on purpose (AP#21: the
canonical timestamped mirror is written the turn the migration is applied via
MCP, to avoid version-string collisions).

As of 2026-06-09 ALL of S1-S4 are APPLIED to production; their canonical mirrors
live in supabase/migrations/ and the staged .sql references were removed. This
README is kept as the closed-out record.

SOURCE OF TRUTH for rationale: docs/PROGRAMS_TIER1_FORK_SPECS_2026-06-08.txt
RATIFICATION: architect 2026-06-08 (S1/S2/S3/S4 ratified; S5 deferred).

APPLIED (mirror -> live migration):
  S3 FORK-REG-UNIQUE      -> 20260609015340_registrations_program_player_partial_unique.sql
  S4 FORK-DELETE          -> 20260609015354_financial_accounts_season_fk_restrict.sql
  S1 FORK-ROLLOVER-RPC    -> 20260609031536_rollover_season_rpc_atomic.sql  (= H-2;
                             architect-authored from the staged reference + live schema)
  S2 DIRECTION A          -> 20260609033114_teams_team_type_id_not_null_fk_restrict.sql (= H-3)
  (+ 20260609031508 revoke_anon_execute_claim_guardian — AP#57 follow-up.)

APP-CODE COMPANIONS (shipped): C-1 deleteProgram financial guard (#878);
  B-PR2 claim_guardian_by_email wiring (#879); B-PR3 useSeasonRollover -> RPC (#881).

NOT IN THIS ARC (deferred / architect lane):
  S5 FORK-ANON-GRANTS — defense-in-depth (RLS empirically holds), deferred.
  H-1 submit_registration rewrite (reg-status-gate write half + C-4 ON CONFLICT) — held.
  H-4 teams.season_id CASCADE -> RESTRICT (Q7-a) — held.
  H-5 parent-read RLS narrowing (Q4) — held.
