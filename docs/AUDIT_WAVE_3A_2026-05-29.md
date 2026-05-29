# AUDIT — Wave 3.A (Onboarding / Notifications / Briefings / Edge Deploy / Cron) — 2026-05-29

**Contract:** PLATFORM_PRIORITIES.md §17.6 Wave 3.A set per §4.AN routing — categories #18 onboarding pipeline, #19 notification pipeline coverage, #20 briefing engine coverage, #21 edge function deploy parity, #22 pg_cron job health. Five parallel line-by-line audits per CLAUDE.md §17.8 standing rule (AP #50 retired). Each agent ran first-pass line-by-line + §16.15 2-pass deep-read addendum.

**Status:** findings only. Routing → fix PRs is the next workstream.

---

## Headline

- **9 consolidated P0s** across 3 surfaces (#18 + #19 + #22)
- **~23 P1s** + ~16 P2s across all 5 categories
- **§17.5 calibration: 5/5 categories surfaced real findings.** 0 demotions.
- **Audit disciplined surfaces are CLEAN** (#21 13/13 byte-match; #20 zero AP #36/#37/#38 violations); **unguarded surfaces are broken** (#18 onboarding, #19 notifications).

---

## Cross-cutting patterns (AP #58 synthesis)

### CROSS-PATTERN 1 — Data plumbing terminates in admin UI blindness

**The dominant Wave 3.A finding.** Same class as Wave 2.C #24 PATTERN OMEGA (instrumentation without consumption), now confirmed across onboarding + notifications + cron + observability. Three independent audits surfaced it:

| Source | Instance |
|---|---|
| #18 PATTERN ZETA | `usePendingInvitations` reads the empty `invitations` table → Admin Home Action Queue shows clean → admin assumes onboarding queue empty → reality is 173 of 175 guardians unlinked (98.9%). The invite-parent edge function never writes to the table. False-negative all-clear. |
| #19 P0-1 | Migration 027 attaches 5 triggers that insert into `event_notifications` for cancellations/reschedules/relocations. `NotificationHistory.jsx:44` reads for admin display. **No dispatcher.** Cancellation/reschedule/relocate triggers fire DB-side; parents are NEVER notified. |
| #19 P0-3 | `AutoNotificationSettingsSheet` toggles write to `organizations.auto_notifications` JSONB. `_reminders.ts:24-26` reads `organization_settings.pilot_mode_enabled` only — never the toggles. Admin "Event Reminders" switch silently no-ops; Stream A fires regardless. |
| #19 P1-5 | `guardian_notification_prefs` exists in schema but is NOT read by any send path. Per-guardian opt-out never enforced. |
| #19 P2-4 | `NotificationPrefs.jsx` per-category prefs write to `user_preferences.notification_preferences` but no send path reads them either. |
| #22 P0-1 (PATTERN HOTEL) | `cron.job_run_details` reports `status='succeeded'` when `SELECT net.http_post(...)` ENQUEUES the request. The actual HTTP resolves async in `net._http_response`. 8 timeouts in last 24h (1.1% real failure) hidden behind 100% "success" reading. |
| Wave 2.C #24 P1 (cross-ref) | Vercel Speed Insights mounted → no queries → 5s LCP regressed for weeks. 5 audit-log tables write-only with zero admin readers. Resend bounce surface stored, no admin UI. |

**This is the same bug shape at 7 layers.** §4.AQ flagged PATTERN OMEGA at Wave 2.C close. Wave 3.A confirms it as the most pervasive architectural pattern across the platform — write paths exist, read paths don't.

### CROSS-PATTERN 2 — Spec drift across doc layers (doctrine outruns production OR production outruns doctrine, depending on which surface)

| Source | Instance |
|---|---|
| #20 PATTERN STALE-DOC | `comms_messages.kind_check` already migrated past §13's "7 transitional legacy values" claim (all 0 live rows). CLAUDE.md §13 wording stale. |
| #20 PATTERN STALE-DOC | `kind_check` now allows 12 kinds (9 canonical + coach_roundup + family_guide + games_recap). §13 canonical-9 claim outdated. |
| #20 PATTERN STALE-DOC | `BRIEFINGS_COVERAGE_L99.md` written May 10, documents 10 kinds. Production has 12. Per AP #45 ledger-reconciliation owed. |
| #20 P1-3 | §13 brand colors (`#091c36` / `#1e3a5f` / `#e05c2a`) drift from live engine (`#0f172a` / `#4a8fd4` / `#2563eb`). Per AP #39 the live colors look like the truer position. §13 needs reconciliation. |
| #19 P1-1 | Stream B (RSVP nudge) drift from §16.5: uses 24h coverage-threshold model anchored on event start; spec calls for T-4h + T-1h anchored on RSVP-lock deadline. |
| #19 P1-2 | Sunday 6 PM weekly digest per §16.5 is auto-DRAFT only, not auto-SEND. |
| #18 §17.4 backlog | 0/5 of "bulk-invite + QR + status column + PWA install prompt + push opt-in promo" present. Backlog item went stale. |
| #18 + AP #51 | AP #51 dead-feature catalog still cites `WelcomeOverlay` + `InstallPrompt` as "mounted at HomePage:29/30" — both files were already deleted. Catalog stale. |
| #21 P2-1 | 5 edge functions appear "version-drifted" but byte-compare shows no content delta — git-log artifact from commit `111f213` recording against function paths. |

### CROSS-PATTERN 3 — Audit-disciplined surfaces are CLEAN; unguarded surfaces are broken

The audit-discipline doctrine works where it lands. Where it doesn't land, things are broken at the production-architectural level.

**Clean (audit-disciplined):**
- #21 — all 13 edge functions byte-match repo source; 6/6 inbound shared secrets in app_secrets per AP #33; 5 mirror pairs intact per AP #30; config.toml parity holds; verify_jwt audit test enforces linkage per AP #31
- #20 — zero AP #27/#28/#29/#34/#36/#37/#38 violations; renderer-emit parity at 33:33; 9 canonical kinds + 3 Wave-5 additions all production-shippable

**Broken (unguarded):**
- #18 — onboarding pipeline is structurally disconnected (5 P0s)
- #19 — notification pipeline has 3 P0s of "trigger writes that nothing reads"

The pattern: surfaces that have an audit test (`verifyJwtConfigAudit.test.js`), a registered AP (#21 #27 #28 etc), or a documented mirror discipline survive intact. Surfaces that don't have those guards drift toward "write paths shipped, read paths never landed."

### CROSS-PATTERN 4 — Cold infrastructure is observability debt

| Source | Cold surface |
|---|---|
| #20 PATTERN COLD-SURFACE | `academy_callup_notice` infrastructure complete; 0 sends ever |
| #20 PATTERN COLD-SURFACE | `custom_message` UI shipped; 0 sends ever |
| #20 PATTERN COLD-SURFACE | `games_recap` Wave-5 kind; 0 sends ever |
| #18 P0 | `invitations` table empty; no sends ever |
| #18 stale | `auth.users.invited_at = 0` — no Supabase Auth invites ever sent either |

When the path is cold, configuration / schema / RPC permission bugs lurk silently. They surface on the first real send mid-phase. Pre-cutover P0 risk: send one of each to verify.

---

## Wave 3.A P0 consolidated (9)

Ordered by fix-PR clustering.

### Onboarding (5 P0s — bundle into one onboarding-pipeline rebuild PR)

1. **#18 P0-1 — `invitations` table disconnected from running pipeline.** `usePendingInvitations` reads an empty table that `invite-parent` never writes to. Either (a) wire invite-parent to write `invitations` + send via Resend, or (b) reroute `usePendingInvitations` to query `auth.users WHERE invited_at IS NOT NULL AND last_sign_in_at IS NULL`. **Decision needed.**

2. **#18 P0-2 — `InviteButton` is unmounted.** `grep -rn "InviteButton" src/` returns only `InviteButton.jsx`. No code path surfaces the invite trigger today.

3. **#18 P0-3 — No `AcceptInvitePage` exists.** `get_invitation_by_token` RPC is anon-callable + invitations table is anon-SELECTable + token generation works — but no UI consumes any of it. Supabase magic-link invite-email redirects to `/login` with no signup UI.

4. **#18 P0-4 — AP #29 / #62 token discipline gap on `invitations.token`.** 7-day TTL present but single-use NOT enforced at RPC layer; `get_invitation_by_token` exposes `is_expired`/`is_accepted`/`is_cancelled` as informational flags without enforcing. When accept UI lands, needs `accept_invitation(p_token, p_user_id)` SECDEF RPC that atomically validates + marks accepted.

5. **#18 P0-5 — Anon-SELECT on `invitations` table.** Token-enumeration risk. Even with 0 rows today, leaks future invitations to scrapers. REVOKE EXECUTE FROM PUBLIC + REVOKE FROM anon explicitly per AP #23 + #57.

### Notifications (3 P0s — bundle into one notification-pipeline wiring PR)

6. **#19 P0-1 — `event_notifications` trigger writes are inert.** Migration 027 fires DB triggers on insert/cancel/reschedule/relocate; `NotificationHistory.jsx` reads but no edge function dispatches. The literal admin message in NotificationHistory.jsx:64-71 says "Event reminders, RSVP nudges, and schedule change alerts will appear here once the notification engine is configured" — the engine isn't.

7. **#19 P0-2 — `AutoNotificationSettingsSheet:35` exposes DB schema** ("auto_notifications column may need to be added to the organizations table"). Wave 2.C #16 P0 confirmed live this audit. Plus the column may not exist (no migration found).

8. **#19 P0-3 — Admin toggles in `AutoNotificationSettings` don't gate the Stream A handler.** `_reminders.ts:24-26` reads `organization_settings.pilot_mode_enabled` only. Toggling "Event Reminders" in admin UI silently no-ops; reminders fire regardless. PATTERN DELTA from #19 surface — admin-toggle without enforcement.

### Cron / observability (1 P0)

9. **#22 P0-1 — `cron.job_run_details` "success" masks HTTP failures.** pg_cron records `status='succeeded'` instantly when `SELECT net.http_post(...)` enqueues. Actual HTTP resolves async in `net._http_response`. 8 timeouts in 24h (1.1%) invisible. Any future in-app "last success" widget that queries `cron.job_run_details` will report green while HTTP fails. **Canonical health source:** `net._http_response.status_code = 200 AND created > now() - interval 'N minutes'`.

---

## P1 surface (23 total)

**#18 Onboarding (6 P1):** admin Members directory needs onboarding-status column; no bulk-invite path; push opt-in buried in AccountPage with no promo; PWA install prompt missing; Resend webhook bounce data invisible to admin; admin invite email is unbranded Supabase template.

**#19 Notifications (8 P1):** §16.5 cadence Stream B drift (24h coverage threshold vs T-4h+T-1h); Sunday 6PM digest is auto-DRAFT only; Stream B doesn't honor quiet hours; Stream A reminder ignores RSVP intent; `guardian_notification_prefs` not read by any send path; cron `*/* *` evaluates every minute (mostly empty work); `RESEND_API_KEY` in `Deno.env` (should be `app_secrets` per AP #33); `send-push` body string partial (title and body often duplicate).

**#20 Briefings (6 P1):** §13 rule 7 recipient preview chip not implemented; `briefing_templates` DB table empty (retire or wire); §13 brand-color doctrine drift; parent-facing inbox per §4.AI not built; `academy_callup_notice` 0 production sends (cold infrastructure); `BRIEFINGS_COVERAGE_L99.md` stale per AP #45.

**#21 Edge function deploy (1 P1):** AP #63 candidate enforcement — no audit test that fires on deployed-without-repo (PR #566 closed the observed instance; next one would slip).

**#22 pg_cron (2 P1):** weekly_sunday handler dedup race window (UNIQUE constraint OR `ON CONFLICT DO NOTHING` needed per AP #25); `cron.job_run_details` has no retention policy (28MB at 53k rows, projected ~365MB/year).

---

## §17.5 calibration

**All 5 Wave 3.A categories surfaced real findings.** No demotions.

| Category | P0 | P1 | P2 | Notes |
|---|---|---|---|---|
| #18 Onboarding | 5 | 6 | 3 | Most-broken surface; pipeline structurally disconnected |
| #19 Notifications | 3 | 8 | 4 | Trigger writes nothing reads pattern |
| #20 Briefings | 0 | 6 | 5 | Engine clean; doctrine stale |
| #21 Edge func deploy | 0 | 1 | 2 | **CLEAN PASS** — 13/13 byte-match |
| #22 pg_cron | 1 | 2 | 2 | Observability gap (HTTP vs SQL success) |

---

## §17.4 backlog corrections (cumulative)

- "Bulk-invite + QR + status column + PWA install prompt + push opt-in promo" — **0/5 present**, all missing or broken
- AP #51 dead-feature catalog stale (cites already-deleted files)

---

## New AP candidates surfaced this batch

- **PATTERN ZETA (candidate)** — false-negative all-clear from broken data pipeline (write path absent + read path returns empty + UI consumers treat empty as healthy). One confirmed instance (`usePendingInvitations`). Promote on second.
- **PATTERN DELTA (candidate)** — admin-toggle without enforcement (UI JSONB write that no send path reads). 3 instances surfaced (AutoNotificationSettings, NotificationPrefs, guardian_notification_prefs schema-but-no-read). Promote-ready at 3+.
- **PATTERN HOTEL (candidate)** — SQL-layer enqueue-success masks downstream async failure. `cron.job_run_details` vs `net._http_response`. Generalizes to any queue-style metric (pg_net queue, mail queue, etc.).
- **PATTERN COLD-SURFACE (candidate)** — production infrastructure with 0 real exercise; AP #51 dead-feature retirement candidate class.
- **"pg_cron success ≠ HTTP success"** specific audit lens — always cross-check `net._http_response.status_code` when reasoning about cron health.

---

## Per-agent findings (preserved for fix-PR routing)

### #18 Onboarding pipeline

- Total guardians (LH org): 175; unlinked: 173 (98.9%); auth.users count: 5
- `invitations` table rows: 0 (whole DB)
- `auth.users.invited_at IS NOT NULL`: 0
- Pipeline state: Step 1 partial (orphan InviteButton) / Step 2 partial (unbranded Supabase template) / Step 3 missing (no AcceptInvitePage) / Step 4 present (autoLinkGuardian works) / Step 5-7 missing
- §17.4 backlog: 0/5 complete

### #19 Notification pipeline coverage

- Channel × Stream matrix mapped; Stream A 72h/24h/4h ✓ but only for game + tournament (practice excluded); Stream B has 24h coverage-threshold instead of T-4h + T-1h
- `event_notifications` triggers fire DB-side; nothing dispatches them to email/push
- Admin UI toggles cosmetic; handlers don't read them
- SMS path: confirmed zero code (per §16.5 SMS reserved for cancellations + admin critical)
- AP #33 violation: `RESEND_API_KEY` in `Deno.env` (not platform-managed, should be in app_secrets)

### #20 Briefing engine coverage

- 12 kinds in production `kind_check` (9 canonical + 3 Wave-5)
- Per-kind scoreboard: all 9 canonical + coach_roundup + family_guide in production with sends; custom_message + academy_callup_notice + games_recap have 0 sends
- Engine compliance: AP #27/#28/#29/#34/#36/#37/#38 all clean
- §13 doctrine + BRIEFINGS_COVERAGE_L99 stale relative to live engine
- `briefing_templates` DB table empty (in-code defaults instead)

### #21 Edge function deploy parity

- 13 deployed; 13 in repo; 13 byte-matched (the apparent version drift is git-log artifact from commit 111f213, no content delta)
- config.toml parity: 10 verify_jwt:false declarations + 3 implicit true — all match deployed flags
- 6 inbound shared secrets in app_secrets per AP #33; 2 documented exceptions (RESEND_WEBHOOK_SECRET + outbound RESEND_API_KEY)
- 5 mirror pairs intact per AP #30
- **Clean pass.**

### #22 pg_cron job health

- 4 cron jobs cataloged; 2 active (briefing-dispatch-tick + briefing-auto-draft-tick); 2 orphan history-only (legacy current_setting pattern, unscheduled by migration 20260510225122)
- Both active jobs at `* * * * *` cadence; 26,003 SQL-layer "successes" with 0 SQL-layer "failures"
- HTTP layer: 720/728 (98.9%) 200, 8/728 (1.1%) timeouts in 24h
- PATTERN HOTEL: SQL enqueue-success ≠ HTTP completion-success
- Idempotency: briefing-dispatch-tick clean (atomic claim); briefing-auto-draft-tick weekly_sunday has small race window (P1)
- `cron.job_run_details` no retention (28MB / 53k rows / 20 days)

---

## Routing — fix-PR arcs queued for next session

**Per-arc shape:**

1. **Onboarding pipeline rebuild** (closes #18 5 P0s + 6 P1s): decision call on invitations-table vs auth.users path; wire InviteButton mount + write to invitations + send branded email + AcceptInvitePage + status column + accept_invitation SECDEF RPC. **Multi-PR arc.**

2. **Notification pipeline wiring** (closes #19 3 P0s + 8 P1s): event_notifications dispatcher (new edge function or reuse send-tournament-message); wire AutoNotificationSettings toggles into Stream A handler; fix the schema-leak microcopy in same PR.

3. **Cron HTTP-health observability** (closes #22 P0-1): canonical health source switches from `cron.job_run_details` to `net._http_response`; admin cron-health card design; cross-references Wave 2.C #24 admin observability arc.

4. **Doctrine reconciliation** (closes #20 P1s + Cross-Pattern 2 doc-drift): CLAUDE.md §13 + BRIEFINGS_COVERAGE_L99.md + AP #51 catalog updates; AP #45 ledger reconciliation in same commit.

5. **Onboarding-adjacent observability wires** (per Wave 2.C #24 PATTERN OMEGA + Wave 3.A Cross-Pattern 1): admin views for `pii_audit_log` + `event_change_audit` + `event_reminder_log` + `comms_message_recipients` delivery state + Resend bounce surface. **Bundle with #1 or ship after.**

6. **Pre-cutover cold-surface validation** (closes #20 P1-5, partial cross-confirm Cross-Pattern 4): manually trigger one academy_callup_notice + custom_message + games_recap send. Verify no config/schema/RPC permission bugs lurk.

7. **#21 P1-1 + AP #63 audit-test extension** (per Wave 2.A #11 + #21): the deployed-vs-repo discipline relies on manual audit today; landing the test prevents the next slip.

---

## AP compliance

- **AP #45** — §4.AR ledger entry in same commit as `docs/AUDIT_*.md` ✓
- **AP #50** — RETIRED in PR #564; line-by-line methodology held throughout dispatch ✓
- **AP #56 + #59** — RETIRED in PR #572 ✓
- **AP #58** — cross-batch pattern check applied; 4 CROSS-PATTERNs ✓
- **AP #61** — pre-phase audit gate; required outputs delivered ✓
- **§17.8** — every agent reported §16.15 2-pass cascade-catch findings ✓

---

**Audit progress per §17.5:** 18 of 29 categories complete. Remaining: Wave 3.B (#6 anti-pattern compliance sweep, #10 data integrity canonical-source compliance, #25 DR/backup testing, #27 youth-sports compliance, #28 data migration playbook, #29 doctrine-vs-practice drift) plus the partially-deferred items in earlier waves.

**Next session opens with:** routing decisions on the 7 fix-PR arcs above + Wave 3.B dispatch.
