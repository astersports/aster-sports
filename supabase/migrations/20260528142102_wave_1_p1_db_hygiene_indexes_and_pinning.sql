-- Wave 1 P1 DB hygiene: FK indexes + policy pinning + ledger cleanup
--
-- Closes 3 P1 findings from AUDIT_WAVE_1_PRE_CUTOVER_2026-05-28.md:
--   #7 — app_secrets + event_reminder_log RLS pinning
--   #8 — unindexed FK columns (highest-priority 7 of 33)
--   #8 (sub) — duplicate assert_org_owns_helpers ledger row cleanup
--
-- NOTE on CONCURRENTLY: spec authorized IF NOT EXISTS (without CONCURRENTLY)
-- because apply_migration wraps in a transaction and these tables are low
-- write-volume at current scale. IF NOT EXISTS safely no-ops if any index
-- already exists.
--
-- Naming convention: <table>_<column>_idx per repo precedent (verified
-- against migrations/20260528090937_tier_1_cleanup_rls_initplan_wrap_and_fk_indexes.sql).

-- =============================================================================
-- TASK 1 — FK indexes (cutover-readiness + user-deletion-cascade perf)
-- =============================================================================
-- Pre-flight identified 3 of 8 originally-targeted columns already indexed.
-- Targeting the 7 genuinely unindexed columns (2 org-scoped + 4 user-cascade
-- + 1 bonus token-guardian to round to highest-priority 8 surface).

-- Org-scoped (cutover org-archival flows):
CREATE INDEX IF NOT EXISTS coaching_assignments_org_id_idx
  ON public.coaching_assignments (org_id);
CREATE INDEX IF NOT EXISTS user_roles_organization_id_idx
  ON public.user_roles (organization_id);

-- User-cascade (high-write paths that table-scan on user deletion):
CREATE INDEX IF NOT EXISTS game_plays_created_by_idx
  ON public.game_plays (created_by);
CREATE INDEX IF NOT EXISTS game_plays_voided_by_idx
  ON public.game_plays (voided_by);
CREATE INDEX IF NOT EXISTS event_change_audit_changed_by_idx
  ON public.event_change_audit (changed_by);
CREATE INDEX IF NOT EXISTS rsvp_token_uses_guardian_id_idx
  ON public.rsvp_token_uses (guardian_id);
CREATE INDEX IF NOT EXISTS callup_token_uses_guardian_id_idx
  ON public.callup_token_uses (guardian_id);

-- =============================================================================
-- TASK 2 — app_secrets + event_reminder_log RLS pinning
-- =============================================================================
-- Both tables have RLS enabled with zero policies (deny-by-default).
-- Pin explicitly with REVOKE + COMMENT so future audits don't flag as
-- "missing policy" and document the deny-by-default intent.

-- app_secrets: service-role only per AP #33
REVOKE ALL ON TABLE public.app_secrets FROM PUBLIC;
REVOKE ALL ON TABLE public.app_secrets FROM authenticated;
REVOKE ALL ON TABLE public.app_secrets FROM anon;
COMMENT ON TABLE public.app_secrets IS
  'Service-role only access via SECDEF functions per AP #33. RLS enabled with zero policies = deny-by-default for authenticated/anon. Do NOT add SELECT policies; secret values read via verify_*_token RPCs.';

-- event_reminder_log: cron-only write, no client read
REVOKE ALL ON TABLE public.event_reminder_log FROM PUBLIC;
REVOKE ALL ON TABLE public.event_reminder_log FROM authenticated;
REVOKE ALL ON TABLE public.event_reminder_log FROM anon;
COMMENT ON TABLE public.event_reminder_log IS
  'Cron-written idempotency log for event reminders. RLS enabled with zero policies = deny-by-default. Service role writes; no client reads.';

-- =============================================================================
-- TASK 3 — Duplicate assert_org_owns_helpers ledger row cleanup
-- =============================================================================
-- Pre-flight confirmed: both 20260521114129 and 20260521114252 carry
-- byte-identical SQL bodies. 114252 is the canonical (later) version
-- matching production state. 114129 was a no-op rerun.

DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260521114129';
