# Phase Beta B3 — Edge Function Input Validation Audit

**Date:** 2026-05-16
**Scope:** All 10 edge functions in supabase/functions/
**Method:** INLINE-only per method correction from B1 (sub-agents had 100%/50% false-positive rates)
**Status:** COMPLETE. **VERDICT: CLEAN.** Zero P0/P1, 1 P2 cosmetic.

---

## Functions audited (10/10)

| Function | Auth pattern | Writes | Verdict |
|---|---|---|---|
| briefing-auto-draft-tick | cron_secret (app_secrets) | INSERT comms_messages | ✓ SAFE — orgId from trusted briefing_triggers row |
| briefing-cron-dispatch | cron_secret (app_secrets) | UPDATE comms_messages by id | ✓ SAFE — system-level by-id updates |
| callup-token-handler | URL token + RPC verify | UPSERT event_rsvps, INSERT callup_token_uses | ✓ SAFE — token-validated payloads |
| invite-parent | JWT + admin role check | auth.admin.inviteUserByEmail | ⚠ P2 — no #36 error check on user_roles query (fails-closed if null) |
| parse-tournament-schedule | JWT + admin role in org | None (parser returns rows) | ✓ SAFE — org_id from body validated against user_roles |
| resend-webhook-receiver | svix signature | UPDATE comms_message_recipients by id, idempotent | ✓ SAFE — idempotent rank-based |
| rsvp-token-handler | URL token + RPC verify | UPSERT event_rsvps via RPC | ✓ SAFE |
| send-tournament-message | JWT + service-role chain | UPDATE comms_message_recipients by id | ✓ SAFE — guardian fetch org_id added in PR #195 |
| suggest-briefing-closer | JWT + admin role in org | None (LLM call) | ✓ SAFE — same pattern as parse-tournament-schedule |
| unsubscribe-handler | URL token + RPC verify | UPSERT guardian_email_preferences | ✓ SAFE |

## P2 finding

**invite-parent/index.ts:35-39** — user_roles query uses `const { data: role } = ...` (no `error` destructured). If RLS denies or query fails, `role` is null → role?.role !== 'admin' is true → returns 403. **Fails closed, defensible.** But anti-pattern #36 wants explicit error check. Cosmetic only.

## Pattern compliance summary

- **Anti-pattern #31 (verify_jwt config sync):** All shared-secret functions verified via vitest audit test (existing). Not re-audited here.
- **Anti-pattern #33 (app_secrets for shared secrets):** All edge functions reading shared secrets do so via `getAppSecret(sb, name)` helper from `app_secrets` table. Only `resend-webhook-receiver` reads `RESEND_WEBHOOK_SECRET` from Deno.env (platform-managed by Resend per anti-pattern #33 exception). Pattern compliance: complete.
- **Anti-pattern #36 (destructured defaults):** Mostly observed. 1 cosmetic gap in invite-parent (fails-closed). Production-critical paths (token handlers, send-tournament-message, parse-tournament-schedule) all have explicit error checks.
- **Anti-pattern #37 (org_id query contract):** Edge function callers either (a) accept body.org_id and validate vs user_roles before use, or (b) inherit trusted orgId from cron-driven context. All audited callers compliant.

## WRITE-side org_id story across B1 + B3 — COMPLETE

Combined finding for the WRITE-side hardening Frank framed as a Beta priority:

- **B1 hooks audit:** Sub-agent claimed 9 events WRITES needed org_id. ALL INVALID — events has no org_id column. FK-scoped via team_id.
- **B1 pages audit:** No WRITE-side findings beyond morning audit's coverage.
- **B3 edge functions:** All writes are SAFE-BY-ID, RPC-validated, or use trusted-orgId-from-DB. Zero gaps.

**Bottom line:** The WRITE-side concern was overstated by the sub-agent. Real WRITE-side hardening already in place via:
- RLS gates on all org-scoped tables
- INSERT payloads correctly include org_id where the table has the column
- UPDATE by-id patterns rely on RLS to gate
- Edge function writes validated via SECURITY DEFINER RPCs or signed payloads

No fix PR shipped for B3.

## Time report

- Function enumeration: ~1 min
- Per-function grep + read: ~10 min
- Pattern verification (#31, #33, #36, #37): ~5 min
- This doc: ~3 min
- **B3 total: ~19 min wall-clock**

## Moving to B6

Per execution order, next is B6 (Error Handling). Will absorb:
- academyCallupNotice.js:44 fix (Alpha carryover, anti-pattern #36 violation)
- Other #36 sweep findings
- User-facing error consistency
