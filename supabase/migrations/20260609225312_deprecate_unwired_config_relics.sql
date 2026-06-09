-- Migration: deprecate_unwired_config_relics  (version 20260609225312)
--
-- Mirror written by CC for AP#21 applied-history parity. Applied via Supabase
-- MCP apply_migration in the same turn; this file is the repo mirror — DO NOT
-- re-apply or hand-run (COMMENT ON is idempotent regardless).
--
-- Tags config tables that NO shipped surface reads, so grep/discovery surfaces
-- the warning automatically (anti-drift: substrate inventory != wired surface).
-- Source: docs/SETTINGS_CONSUMPTION_AUDIT_2026-06-09.txt +
-- docs/DEPRECATIONS_REGISTRY.md. Reversible (metadata only); tables are NOT
-- dropped (Phase-4 multi-tenant reseed may reuse them). A future DROP is gated on
-- a grep proving zero references first (per ARCHITECT_RULING_DR-S3).

COMMENT ON TABLE public.dashboard_section_visibility IS
  'DEPRECATED 2026-06-09: pre-Phase-3 Home relic. The shipped Home is the 4-slot '
  'shell-contract-v2 (greeting/needsYou/comingUp/tail); these 7 section keys describe '
  'the retired equal-weight card stack. No reader in src/ or functions/. Do NOT build '
  'an editor against this. Phase-4 (multi-tenant) reseed may reuse. See '
  'docs/SETTINGS_CONSUMPTION_AUDIT_2026-06-09.txt.';

COMMENT ON TABLE public.quick_actions_config IS
  'DEPRECATED 2026-06-09: pre-Phase-3 Home relic. QuickActions.jsx renders a hardcoded '
  'GROUPS array (9 tiles in 3 buckets); this seed is 6 flat rows with stale routes and '
  'no group column. No reader in src/ or functions/. Do NOT build an editor against '
  'this. Phase-4 reseed may reuse. See docs/SETTINGS_CONSUMPTION_AUDIT_2026-06-09.txt.';

COMMENT ON TABLE public.circuit_rules IS
  'DEPRECATED 2026-06-09: unwired config. No reader in src/ or functions/. Standings '
  'compute from game_results; the Records tiebreaker copy is a static engine template '
  '(tiebreakerExplainer T3), not this table. Do NOT build an editor until a consumer is '
  'wired (make the explainer read this table). See '
  'docs/SETTINGS_CONSUMPTION_AUDIT_2026-06-09.txt.';

COMMENT ON TABLE public.division_fees IS
  'DEPRECATED 2026-06-09: superseded substrate. Written at program creation but read by '
  'nothing; the live fee path reads registration_fees + division.base_fee_cents/fees '
  '(ProgramDetailPage, estimateCart). Do NOT build an S5 editor against this; re-spec '
  'against the consumed source. See docs/SETTINGS_CONSUMPTION_AUDIT_2026-06-09.txt.';
