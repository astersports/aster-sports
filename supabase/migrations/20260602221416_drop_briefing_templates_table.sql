-- Closes Wave 3.A #20 P1: briefing_templates DB table empty (retire or wire).
-- Per AUDIT_WAVE_3_P1_BACKLOG_STATUS.md routing call: retire.
--
-- Background: briefing_templates was created in mig 20260509234421
-- (L99 wave 4.1+4.2 foundation step M4) to hold per-org template
-- overrides for briefing kinds. The table was never populated and
-- never read by application code — in-code defaults in
-- src/lib/briefings/* are the de facto source of truth. PATTERN
-- COLD-SURFACE per Wave 3.A CROSS-PATTERN 4 (production infra
-- with 0 real exercise).
--
-- Pre-flight verification (per AP #34 removal discipline):
--   grep -rn "briefing_templates" src/ supabase/functions/
--   → ZERO callers (only matches are migration files that
--     created or altered the table).
--   → No FKs reference briefing_templates (confirmed via grep).
--
-- DROP TABLE CASCADE handles:
--   - 4 RLS policies (read, insert_admin, update_admin, delete_admin)
--   - 3 indexes (org_kind_slug_uniq, kind_active_idx, org_idx)
--   - 2 constraints (kind_check from mig 20260515223916, slug_format_check)
--
-- Reinstating later: if multi-tenant template customization becomes
-- a real need, the original mig 20260509234421 + the wave5_pr4a
-- ALTER (20260515223916) remain in the repo as the schema-restore
-- recipe. The kind taxonomy may have grown by then; reissue as a
-- fresh CREATE TABLE with the current 12-kind taxonomy.

-- Verification: empty before drop. If any row exists, abort — the
-- "0 sends ever" justification doesn't hold and the retire decision
-- needs re-routing.
do $$
declare
  row_count int;
begin
  select count(*) into row_count from public.briefing_templates;
  if row_count <> 0 then
    raise exception 'cannot DROP briefing_templates: % rows present. Retire decision assumed zero rows; reconcile manually first.', row_count;
  end if;
end $$;

drop table if exists public.briefing_templates cascade;

-- Verification: table is gone.
do $$
declare
  tbl_count int;
begin
  select count(*) into tbl_count
    from information_schema.tables
   where table_schema = 'public' and table_name = 'briefing_templates';
  if tbl_count <> 0 then
    raise exception 'briefing_templates drop incomplete (table still present)';
  end if;
end $$;
