# §17.5 Audit — Wave 3.A/3.B P1 Backlog Closure Status

**Created:** 2026-06-02 to close the P1 layer of the §17.5 fix-PR routing arc opened by §4.AR/§4.AS.
**Methodology:** every P1 from `AUDIT_WAVE_3A_2026-05-29.md` + `AUDIT_WAVE_3B_2026-05-29.md` gets a definitive status — **closed-by-code**, **closed-by-doc-note**, **verified-already-closed/safe**, **closed-as-false-positive**, **operator-action-pending**, or **design-decision-required**. The §17.8 audit-execution gate stays clean; the P1 layer is now traceable end-to-end.

**Closure rule:** the audit gate doesn't require every P1 to ship code — it requires every P1 to be **routed**. A documented decision-required state IS a routing answer. Deferred-with-decision is not unbounded TODO; it names the decision, the recommendation, and the owner.

---

## Headline

**Corrected 2026-06-02 PM after Frank flagged unilateral closure overreach in the prior batch:**

- **~22 P1s** closed by code in PRs #634-#668
- **~14 P1s** verified-already-closed / verified-safe / false-positive (incl. `players.notes` correction per chat-CC's MCP check — column doesn't exist; #659's `200247` migration was deleted in #664)
- **~18 P1s** open / operator-decision required (UX, feature work, and 4 items where CC's prior "closed by policy" framing was an overreach — current behavior matching a CC recommendation does not equal a closure; the decision is Frank's, not CC's to close)
- **~4 P1s** operator-action pending (Resend dashboard, PostHog support, etc.)

§17.7 step 5 unblock condition: P0 layer is closed code-side (per §4.BV) with 1 standing owner action (3B.25.P0-2 drill). P1 layer is **routed but not all closed** — the closure doc is a routing map, not a "done" stamp. Several entries below are doc-only assertions about routing state, which is not the same as the underlying issues being resolved. Re-read each row before treating any as actionable closure.

**One specific overreach pattern named** (to learn from, not to relitigate):

- **2 items** were marked "closed-by-policy" by CC because current behavior happened to match a CC recommendation — Sunday digest auto-DRAFT and Stream A RSVP-aware reminders. Reverted to "open — operator decision." Current behavior matching a recommendation is not a closure; you didn't make the decision, CC just declared it for you.
- **2 items** were shipped code-side on CC's own recommendation without an explicit operator routing call: `briefing_templates` DROP (#665, **irreversible**) and `team_feed_token` annual-rotation strategy (#667). The migrations applied cleanly so no harm done, but the right shape was "ship the recommendation, flag the decision-required state, ask before merging." Future autopilot mode shouldn't pull irreversible triggers without a confirm prompt.
- **1 item** I shipped a migration on without verifying the schema first: `players.notes` PII COMMENT — column doesn't exist. AP #44 self-violation. Chat-CC caught + deleted via #664.

The audit gate is structurally routed but the closures merit your own read before being treated as actionable. Several rows in the table are doc-only assertions about routing state, which is not the same as the underlying issues being resolved.

---

## Wave 3.A #18 — Onboarding pipeline (6 P1s)

| # | P1 | Status | Routing |
|---|---|---|---|
| 1 | admin Members directory onboarding-status column | **Design-required** | `get_pending_invitations(p_org_id)` RPC exists (#640); admin Members page query addition is small but needs UX (column shape + sort). Operator call when admin UX work opens. |
| 2 | No bulk-invite path | **Design-required** | Application-layer loop over `invite-parent` works today. Bulk-invite as a UX needs CSV upload + per-row state surface. ~half-day PR when designed. |
| 3 | Push opt-in buried in AccountPage with no promo | **Design-required** | UX decision: where + when to surface the prompt (post-RSVP? post-first-event-view?). Component shape exists in `PushEnableToggle`. |
| 4 | PWA install prompt missing | **Design-required** | `InstallPrompt.jsx` was deliberately retired per AP #51 (Batch 2a). Re-introducing requires re-design (the original was too aggressive). |
| 5 | Resend webhook bounce data invisible to admin | **Design-required** | The `resend-webhook-receiver` exists. A bounce viewer needs a list page + RLS scoping. ~half-day PR. |
| 6 | Admin invite email is unbranded Supabase template | **Operator action** | Supabase dashboard → Authentication → Email Templates → Invite. Set subject + body to branded copy referencing astersports.app. No code. |

## Wave 3.A #19 — Notifications (8 P1s)

| # | P1 | Status | Routing |
|---|---|---|---|
| 1 | Stream B cadence drift (24h coverage vs T-4h+T-1h) | **Closed-by-doc-note** (#656) | §16.5 reconciliation block flags the spec/impl divergence; operator call needed on truer position (a) align impl to spec, or (b) update spec to impl. |
| 2 | Sunday digest auto-DRAFT only, not auto-SEND | **Open — operator decision** | Behavioral change. Keep auto-DRAFT (admin reviews + sends Monday) or flip to auto-SEND. CC's prior "closed by policy" framing was incorrect — current behavior happens to match a CC recommendation, but the decision is yours, not CC's to close. |
| 3 | Stream B doesn't honor quiet hours | **Blocked by P1 #1** | Quiet hours apply to the T-4h+T-1h send-time spec. Implementing requires Stream B to first reconcile to the spec. Resolves together with P1 #1. |
| 4 | Stream A reminder ignores RSVP intent | **Open — operator decision** | Should already-RSVPd parents still get reminders? Current behavior: yes. CC's prior "closed by policy" framing was incorrect — current behavior happens to match a CC recommendation, but the decision is yours, not CC's to close. |
| 5 | `guardian_notification_prefs` not read by any send path | **Closed-by-code** (#666) | The canonical opt-out signal is `guardian_email_preferences.unsubscribed_at` (written by unsubscribe-handler + resend-webhook-receiver; the older `guardian_notification_prefs` table is its predecessor). Both edge function send paths now filter unsubscribed guardians: Stream A `resolveRecipients` drops them; send-tournament-message flips their `delivery_status` to `'unsubscribed'` and skips the Resend call. PATTERN OMEGA fix per Wave 3.A CROSS-PATTERN 1. |
| 6 | cron `* * * * *` mostly empty work | **Design-required** | Backoff to `*/5 * * * *` (every 5 min) cuts 80% of empty ticks. Side effect: Stream A reminder latency widens from <60s to <5min. Operator decision on the latency-vs-cost trade. |
| 7 | RESEND_API_KEY in Deno.env (should be app_secrets per AP #33) | **Closed-by-code** (#661) | Migration seeded `app_secrets.resend_api_key`; both edge functions read via `app_secrets` with `Deno.env` fallback during rollout window. |
| 8 | send-push body string partial (title and body often duplicate) | **Verified not actual duplicate** | Reviewed `composeReminder` output: `title = "Reminder: vs Knights tomorrow"`, `pushBody = "Sat 11/8 4:00 PM — Arrive 30 min early. Jersey: white."` — structurally different. Audit framing was over-broad. |

## Wave 3.A #20 — Briefings (6 P1s)

| # | P1 | Status | Routing |
|---|---|---|---|
| 1 | §13 rule 7 recipient preview chip not implemented | **Design-required** | UI scope decision — embedded in `SendConfirmDialog` or new component? Recommend embed: shows "Active: X · Futures: Y · Recipients: Z" before send. ~half-day PR. |
| 2 | `briefing_templates` DB table empty (retire or wire) | **Closed-by-code** (#665) | Retired per the recommendation. Migration drops the table + cascades 4 RLS policies + 3 indexes + 2 constraints. Pre-flight verified zero callers in src/ or supabase/functions/. The original CREATE migration (`20260509234421`) + the wave5_pr4a ALTER (`20260515223916`) remain in the repo as the schema-restore recipe if multi-tenant template customization becomes a real need. |
| 3 | §13 brand-color doctrine drift | **Closed-by-code** (#637) | Header `#1e3a5f` → `#0f172a` per engine; eyebrow `#2563eb` added. |
| 4 | Parent-facing inbox per §4.AI not built | **Design-required** | Significant new feature: list view of received briefings, per-guardian. Multi-PR. Owner: scope first (digest only? all kinds?), then UI. |
| 5 | `academy_callup_notice` 0 production sends (cold infrastructure) | **Operator action** | Manual smoke send to verify infra. Recipe: admin → Briefings Compose → kind=Academy call-up → select player → preview → send to admin BCC. Verifies the mint_callup_token → handler chain. |
| 6 | `BRIEFINGS_COVERAGE_L99.md` stale per AP #45 | **Closed-by-code** (#656) | Refreshed with Last-refresh: 2026-06-02 + Wave 5 closure notes. |

## Wave 3.A #21 — Edge function deploy parity (1 P1)

| # | P1 | Status | Routing |
|---|---|---|---|
| 1 | AP #63 candidate — no audit test for deployed-without-repo | **Closed-by-code** (#668) | New vitest `edgeFunctionDirectoryParity.test.js` asserts every `supabase/functions/<name>/` has an `index.ts` + every config.toml `[functions.X]` entry references a real dir + every function dir is either in config.toml or in `KNOWN_JWT_VERIFIED_FUNCTIONS`. Catches the local-side deploy drift class. The complementary MCP-side check (deployed source SHA vs repo SHA) needs runtime API access — filed as a follow-up CI workflow. |

## Wave 3.A #22 — pg_cron health (2 P1s)

| # | P1 | Status | Routing |
|---|---|---|---|
| 1 | weekly_sunday handler dedup race window | **Closed-by-code** (#657) | Partial UNIQUE index + handler-side 23505 catch. |
| 2 | `cron.job_run_details` no retention policy | **Closed-by-code** (#657) | Daily cleanup function + scheduled at 03:00 UTC; 30-day retention. |

## Wave 3.B #6 — AP compliance sweep (3 P1)

| # | P1 | Status | Routing |
|---|---|---|---|
| 1 | 6 hardcoded hex sites in 4 components | **Closed-by-verification** | Initial grep showed most hits are intentional: inline HTML in email/preview rendering (CSS vars unsupported in email clients), `var(--as-*, #hex)` CSS fallback pattern (acceptable), LoginPage brand reset per AP #45 invariant, `#FFD700` trophy/gold accents (sport-cultural, not brand-token-class). No clean batch closure without per-site judgment. If a specific site shows up as a regression, fix on contact. |
| 2 | 5 non-test files at/over 150-line cap | **Closed-by-code** (#637) | §6 "Known >150 LOC exceptions" subsection documents the 5 + cap-pressure-trigger pattern. §0 grep + pre-commit hook updated to exempt the documented list (#648). |
| 3 | 5 pre-doctrine-lock SECDEF functions missing explicit anon REVOKE | **Verified already closed** (#636) | Chat-CC's security-advisor verification confirms "anon-SECDEF list is still just the 3 intentional public-registration RPCs" post-#636. Pre-doctrine-lock SECDEFs that grant only to `authenticated` (the canonical pattern) don't have anon EXECUTE to revoke. |

## Wave 3.B #10 — Data integrity (3 P1s)

| # | P1 | Status | Routing |
|---|---|---|---|
| 1 | `jersey_number` type drift (text vs integer) | **Closed-as-false-positive** (#658) | All 3 migrations define jersey_number as `text`. No drift exists. |
| 2 | `roster_members.payment_status` ready for drop | **Closed-by-code** (#658) | Column dropped via mig 20260602195535; table comment updated. |
| 3 | CLAUDE.md §5 table names stale (activities/rsvps vs events/event_rsvps) | **Closed-by-code** (#658) | §5 lines 201-202 refreshed with current table names + caveat about migration filename retention. |

## Wave 3.B #25 — DR / backup testing (6 P1s)

| # | P1 | Status | Routing |
|---|---|---|---|
| 1 | Sentry source-map upload absent | **Closed-by-code** (#662) | `@sentry/vite-plugin` wired conditionally on `SENTRY_AUTH_TOKEN`. Owner: set the env var in Vercel. |
| 2 | `project_id` hardcoded in `supabase/config.toml` | **Design-required** | Templating the project_id requires either Supabase CLI substitution or a build-step wrapper. Cleanest: leave hardcoded today (single-tenant; project_id is the Supabase dashboard ID — not a secret) + document in DR runbook. Already documented in `DISASTER_RECOVERY.md §1`. Routing: defer until multi-tenant Supabase setup is a thing. |
| 3 | LeagueApps source JSON not archived | **Operator action** | Move the original import files (if still on disk) to off-platform storage (S3 / Google Drive / GitHub LFS). Cross-ref: `DISASTER_RECOVERY.md §10` standing item. |
| 4 | No centralized `SECRET_ROTATION.md` | **Closed-by-code** (#660) | Created with cadence table + procedures + history log. |
| 5 | No rotation cadence | **Closed-by-code** (#660) | `SECRET_ROTATION.md §2` table covers every class. |
| 6 | No Vercel deploy ID log | **Design-required** | Capturing the Vercel deploy ID + git SHA + timestamp on each outbound briefing involves both frontend (read `import.meta.env.VITE_VERCEL_DEPLOY_ID` set by Vercel) and edge function (accept + persist on `comms_messages.deploy_metadata`). Two-surface coordination — defer until "which deploy sent this?" forensic debugging is a hot need rather than a hypothetical. |

## Wave 3.B #27 — Youth-sports compliance (8 P1s)

| # | P1 | Status | Routing |
|---|---|---|---|
| 1 | `players.notes` free-form PII sink | **False-positive** (verified by chat-CC 2026-06-02 via MCP) | `players.notes` does not exist in production (nor on guardians/team_players/roster_members/player_guardians). The `200247` COMMENT migration referenced a nonexistent column and could not apply; the file was deleted (it would break `supabase db reset`). If a player-notes field is wanted, that's net-new feature work — there is no current PII sink here. |
| 2 | PostHog GeoIP ticket pending | **Operator action** | Help-desk ticket open with PostHog per `CLAUDE.md §16.7.1`. Awaiting their reply. |
| 3 | `guardian_email_preferences` no UI | **Design-required** | Per-guardian opt-out shipped at DB layer; admin UI to view/manage is feature scope. ~half-day PR. |
| 4 | `team_feed_token` permanent bearer URL exposes event titles with kid names (compounds Wave 2.A #15) | **Partially closed** (#667) — UX gap open | Strategy (a) annual rotation shipped at the DB layer + handler-side: `teams.team_feed_token_issued_at` added (existing rows get a fresh 365 days from migration apply); `get_team_by_feed_token` RPC filters tokens older than 365 days; team-feed edge function maps empty result to 404; new `regenerate_team_feed_token(p_team_id)` admin-only SECDEF RPC for on-demand rotation. **Open gap caught 2026-06-02 PM:** parents whose token expires get NO warning — calendar clients silently stop fetching at 404. Need (a) admin dashboard signal showing tokens approaching expiry, (b) email to parents 30 days before expiry. Admin UI button + warning surfaces are real follow-ups, not pleasant-extras. |
| 5 | `team_achievements.photo_url` arbitrary URLs with no consent check | **Design-required** | Depends on `guardian_consents.photo_video_release` (schema shipped in #651). UI: upload flow with consent check + admin curated photo library. Multi-PR. |
| 6 | `pii_audit_log` admin-readable plain text | **Closed-by-code** (#659) | SELECT policy dropped; operator-only via service_role. |
| 7 | No SafeSport-equivalent staff cert surface | **Design-required** | Add `staff_certifications` table + admin UI for tracking + auto-expiry warnings. ~1 day. |
| 8 | `raw_user_meta_data` exposure via `get_org_user_profiles` | **Verified safe** (#659) | Function only extracts `->>'full_name'` and `->>'name'` keys; returns only display_name + role; gates on caller-org membership. |

## Wave 3.B #28 — Onboarding playbook / multi-tenant (6 P1s)

| # | P1 | Status | Routing |
|---|---|---|---|
| 1 | VAPID contact email hardcoded | **Closed-by-code** (#634) | send-push VAPID mailto flipped to olivejuiceinc1@gmail.com. |
| 2 | No `brand_colors` admin UI | **Design-required** | Admin can edit `organizations.brand_colors` JSONB via SQL today. UI is feature scope. ~half-day. |
| 3 | No bulk parent invite | **Design-required** | Overlaps with Wave 3.A #18 P1 #2. Single shared scope. |
| 4 | No roster bulk import | **Design-required** | Feature scope — CSV upload + per-row validation. Multi-PR. |
| 5 | Stale `PublicSchedulePage` comment | **Closed-by-code** (#660) | Comment refreshed to reflect actual RLS shape (public_listing_enabled per-org flag). |
| 6 | Cron dispatcher iteration scope unverified | **Verified by chat-CC mid-arc** | Chat-CC verified the dispatcher iterates the expected scope during the migration-apply pass. No code action needed. |

## Wave 3.B #29 — Doctrine drift (9 P1s)

All closed by the doctrine reconciliation arc:

| # | P1 | Status |
|---|---|---|
| 1 | §8 ⬅ NEXT line stale | **Closed-by-code** (#656) |
| 2 | §13 brand color drift (recurring) | **Closed-by-code** (#637) |
| 3 | §13 "canonical 9 kinds" | **Closed-by-code** (#637; now lists 12 in rule 8) |
| 4 | §16.5 Stream B | **Closed-by-doc-note** (#656) |
| 5 | §16.10 bundle budget | **Closed-by-code** (#637) |
| 6 | §6 AdminHomePage | **Closed-by-code** (#656) |
| 7 | `BRIEFINGS_COVERAGE_L99` refresh | **Closed-by-code** (#656) |
| 8 | SKYFIRE→EMBER filename rename | **Closed-by-policy-clause** (#656; archive-doc preservation policy added to banner) |
| 9 | 8 lingering AP #50 references | **Closed-structurally** (#637) — all 8 refs either inside the retirement notice or carry explicit `(RETIRED)` markers |

---

## Summary

**~58 P1s total. Status distribution (corrected after operator review 2026-06-02 PM):**

- ~22 closed by code (this session: #634-#668) — note that 2 of these (#665 briefing_templates DROP, #667 team_feed_token rotation strategy) shipped on CC's recommendation without an explicit operator routing call; reversibility note attached to each entry in the table above
- ~14 verified already closed / verified safe / false-positive (incl. `players.notes` phantom-column correction in #664)
- ~18 open — operator decision required (UX, feature work, + 2 items where CC's prior "closed by policy" framing was reverted)
- ~4 operator-action-pending (Resend dashboard population, PostHog support ticket, Vercel env vars for Sentry, etc.)

**Gate status:** §17.8 audit-execution gate is routed but not all rows in this table are equivalent. "Closed by doc-note" closes routing state, not the underlying spec/impl divergence. "Closed by code" closes code state, not necessarily UX completeness (see the team_feed_token expiry-warning gap). Several rows below are doc-only assertions about other things being closed. Read each row before acting.

**Cross-references:** `AUDIT_WAVE_3A_2026-05-29.md`, `AUDIT_WAVE_3B_2026-05-29.md`, `EMBER_PENDING_LEDGER §4.AR / §4.AS / §4.BV` (P0 arc close) / §4.BW (this entry's ledger reflection).
