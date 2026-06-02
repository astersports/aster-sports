-- Closes Wave 3.B #27 P1: pii_audit_log admin-readable cleartext PII.
--
-- The original policy (pii_audit_log_admin_select, mig 20260508234920)
-- granted SELECT to any user with role='admin' in the row's org_id.
-- The table stores old_value + new_value as cleartext. Any tenant
-- admin could SELECT old/new emails, names, phone numbers in plain
-- text — broader read surface than the table's purpose (operator
-- forensics) needs.
--
-- Empirical state: zero app readers of pii_audit_log (PATTERN OMEGA
-- per Wave 2.C #24 — write-only audit table, no admin UI ever built).
-- Dropping the admin SELECT policy doesn't regress any user-facing
-- feature today.
--
-- New posture:
--   - service_role (operator via MCP / SQL editor) reads cleartext for
--     forensics. RLS bypassed by service_role per Supabase platform
--     contract; no policy needed.
--   - Tenant admins lose direct cleartext access. When admin UI is
--     built (future PATTERN OMEGA closure), it reads through a
--     redacted view (FUTURE — not in this migration; design needed
--     on which fields to hash vs. surface).
--
-- log_pii_change() (the writer RPC) is SECDEF and unaffected — admins
-- can still TRIGGER audit-log writes via the existing flows.

drop policy if exists pii_audit_log_admin_select on public.pii_audit_log;

comment on table public.pii_audit_log is
  'Operator-forensics audit log of PII changes. SELECT is RLS-locked to service_role only (org admins do NOT read this directly per Wave 3.B #27 P1 closure). Future admin UI for change history should query through a redacted view, not this base table. Cleartext old_value/new_value remain by design — they are the forensic record. Writes happen via log_pii_change() SECDEF RPC.';

-- Verification: no SELECT policy on the table for `authenticated`.
do $$
declare
  policy_count int;
begin
  select count(*) into policy_count
    from pg_policies
   where schemaname = 'public' and tablename = 'pii_audit_log' and cmd = 'SELECT';
  if policy_count <> 0 then
    raise exception 'pii_audit_log still has % SELECT policy(ies) — drop incomplete', policy_count;
  end if;
end $$;
