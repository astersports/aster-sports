# Phase 4 RLS / Security Deep Dive Audit

**Date:** 2026-05-16 (Italy morning, "go and don't stop" mode)
**Method:** Direct DB introspection via Supabase MCP — pg_policies, pg_proc, information_schema.role_table_grants, pg_class
**Coverage:** 65 public tables (relkind='r' per anti-pattern #24), all SECURITY DEFINER functions, all anon/PUBLIC grants
**Status:** Read-only inventory.

---

## Severity tags

- **P0** — write-policy gap allowing data corruption / privilege escalation
- **P1** — PUBLIC-reachable SECURITY DEFINER function that should be locked
- **P2** — observation worth documenting; not actionable today

---

## P0 findings (3) — anti-pattern #20: UPDATE policy missing with_check

Per CLAUDE.md anti-pattern #20: `cmd='ALL'` or `cmd='UPDATE'` policies without `with_check` allow any column values that pass the `USING` qual, with zero constraint on data being written. Three policies match this pattern:

| Table | Policy | Roles | Risk |
|---|---|---|---|
| `briefing_reminders` | `admins update own org reminders` | authenticated | Admin updating a reminder could change `org_id` field, moving the row to another org silently |
| `briefing_templates` | `briefing_templates_update_admin` | public | Admin updating a template could change `org_id` or `kind` field outside intent |
| `team_types` | `team_types_update_admin` | public | Admin updating team_type could change `org_id` |

### P0-1: `briefing_reminders.admins update own org reminders`
**Fix scope:** add `WITH CHECK ((org_id = current_user_org_id()))` (or equivalent) to constrain post-update org_id to caller's org. Migration ~5 lines.

### P0-2: `briefing_templates.briefing_templates_update_admin`
**Fix scope:** same pattern. Add `WITH CHECK` matching the table's intended scope.

### P0-3: `team_types.team_types_update_admin`
**Fix scope:** same pattern.

**Gate per discipline:** Class 7 (RLS / Security). These are MIGRATION fixes, GATED until post-synthesis batched RLS PR.

---

## P1 findings (3) — anti-pattern #23: PUBLIC EXECUTE on SECURITY DEFINER functions

SECURITY DEFINER functions run with the function-owner's privileges, bypassing the caller's RLS. PUBLIC EXECUTE on these means anon + authenticated can both call them. Per anti-pattern #23, the canonical pattern is REVOKE FROM PUBLIC then REVOKE FROM specific roles, granting only to the roles that legitimately need access.

### P1-1: `briefing_active_queue(p_org_id, p_kind, p_team_ids, p_date_range)`
**Risk:** Admin briefing queue list RPC. PUBLIC EXECUTE means anon can call it. Function probably checks user role internally, but defense-in-depth says REVOKE PUBLIC.

### P1-2: `log_pii_change(p_target_table, p_target_record_id, p_field_changed, p_old_value, p_new_value, p_org_id)`
**Risk:** Audit log writer. Typically called from triggers (which run as SECURITY DEFINER themselves). PUBLIC EXECUTE means anon can write to `pii_audit_log` directly with crafted args — fabricated audit entries.

### P1-3: `suppress_unsubscribed_recipients()`
**Risk:** Trigger function. PUBLIC EXECUTE means anon can invoke it directly. Trigger functions should not have PUBLIC EXECUTE.

### Intentional (NOT a finding):
- `get_invitation_by_token(p_token text)` — PUBLIC EXECUTE is BY DESIGN. Anon invite-redemption flow; the function verifies the token internally.

**Gate per discipline:** Class 7 (RLS / Security). MIGRATION fixes, GATED until post-synthesis batched RLS PR.

---

## P2 findings (2) — observations worth documenting

### P2-1: anon role has full DML privileges on most tables (Supabase default; RLS gates)
Per `information_schema.role_table_grants` sweep, the `anon` role has DELETE/INSERT/SELECT/UPDATE on 65+ tables. This is the **Supabase default** when a table is created — table-level grants are permissive; RLS enforces per-row gating.

**Not a finding** because all 65 tables have RLS enabled (verified separately) and the policies gate per-row access. But worth knowing: if RLS were ever disabled on one of these tables, anon would have full DML reach.

### P2-2: `events`, `game_results`, `tournaments` — anon does NOT have SELECT
Defense-in-depth on public-facing tables. Reads happen via specific RLS-gated paths only. Looks intentional. Worth documenting so future schema work doesn't accidentally grant.

---

## Sweep summary

**RLS coverage:**
- 65 / 65 public tables have RLS enabled (`relrowsecurity=true`) ✓
- 0 tables with RLS disabled
- Per anti-pattern #24 filter (`relkind='r'`), only tables checked — views inherit RLS from underlying tables

**Policy quality:**
- 3 policies with `with_check IS NULL` on UPDATE → P0 (anti-pattern #20)
- 0 policies with trivially-true `with_check` ('true' / '%true%' under 10 chars) ✓
- All policies use named expressions, not bare TRUE

**SECURITY DEFINER function privileges:**
- ~35 SECURITY DEFINER functions inspected
- 4 with PUBLIC EXECUTE: `briefing_active_queue` (P1-1), `get_invitation_by_token` (BY DESIGN), `log_pii_change` (P1-2), `suppress_unsubscribed_recipients` (P1-3)
- 30+ correctly REVOKE FROM PUBLIC (canonical pattern observed)

**Per-role read simulation:**
- Not run as SET ROLE simulation (MCP doesn't easily support role-switching mid-session). All RLS findings derived from policy + grant inspection, not live impersonation. A live `psql --role anon` test is a follow-up if Frank wants deeper confidence — would take ~30 min of additional querying.

---

## Trade-off — fix-as-you-go on P0 + P1 RLS findings

Per Frank's fix-as-you-go policy, Class 7 (RLS / Security) is **GATED** until post-synthesis batched PR. Rationale: RLS policy changes have non-obvious cross-table effects; want the full picture before shipping.

**All 3 P0 + 3 P1 findings STAGED for the post-synthesis batched migration PR.** Single migration, ~30 lines, fixes:
- 3 ADD `WITH CHECK` clauses on the UPDATE policies
- 3 `REVOKE EXECUTE ... FROM PUBLIC` (and then FROM anon, per anti-pattern #23 sequence) on the SECURITY DEFINER functions
- Plus any additional RLS findings surfaced in Phase 5

Migration mirror file follows anti-pattern #21 — created in same commit as MCP apply.

---

## Phase 4 status: COMPLETE

- **P0:** 3 (RLS UPDATE policies missing with_check) — GATED for batched migration PR
- **P1:** 3 (PUBLIC EXECUTE on internal SECURITY DEFINER funcs) — GATED for batched migration PR
- **P2:** 2 observations (anon table grants permissive by Supabase default; events/game_results/tournaments correctly exclude anon SELECT)
- **RLS coverage:** 65/65 tables ✓
- **Process note:** "go and don't stop" mode — Italy break deferred; will take after Phase 5 + synthesis ship.

Standing by for Phase 5 (Type / Contract audit, ~30 min). Continuing per "don't stop" directive.
