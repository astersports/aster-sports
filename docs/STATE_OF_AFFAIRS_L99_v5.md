# STATE OF AFFAIRS L99: v5
## Legacy Hoopers / Ember Platform Build

**Written:** May 9, 2026 (afternoon)
**Verified against production:** May 9, 2026 ~13:45 UTC via Supabase MCP + GitHub MCP
**Production main HEAD at writing:** `5c43be89` (PR #36, wave 3.7 hotfix merge)
**Latest production migration:** `20260509124926` (org_settings_from_name_email)
**Latest edge function:** `send-tournament-message` v13 ACTIVE
**Supersedes:** STATE_OF_AFFAIRS_L99_v4.md (April 27, 2026), now stale.
**Evidence basis:** Live Supabase MCP queries against project `vrwwpsbfbnveawqwbdmj`, GitHub MCP queries against `LegacyHoopers/skyfire-app`, edge function read-back, file inventory in repo.

---

# HOW TO USE THIS DOCUMENT

Same protocol as v4. v5 is a **delta update** — it does NOT restate v4 sections that haven't changed. Read v4 once for unchanged decisions, schema infrastructure, design tokens, and pre-existing bug catalog. v5 captures what's shipped or changed since April 27.

If this doc says "feature X shipped May Y," it IS shipped. If a v4 claim conflicts with v5 (e.g., a deferred parking-lot item that v5 marks done), v5 wins.

---

# PART 1: HEADLINE — DIGEST PIPELINE LIVE, PILOT INFRASTRUCTURE LOCKED

The biggest material change between v4 and v5: the **weekly digest engine shipped end-to-end** and the **pilot-mode safety net** is now production-grade.

What this means in practice:
- Operator (Frank) can compose a digest from `/admin/briefings`, type per-week body notes + signoff, preview the personalized output for any pilot recipient, fire test send to admin@ for verification, and dispatch real send to flagged guardians.
- Defense in depth: edge function aborts dispatch with HTTP 403 if any non-pilot guardian leaks into the queue while `pilot_mode_enabled=TRUE`.
- Per-org email-header config (FROM display, FROM address, Reply-To) all read from `organization_settings` columns. Multi-tenant ready at the dispatch layer.
- Visual: Knight logo (transparent, post-auth org brand), color-coded RSVP counts (green/amber/red WCAG AA), cobalt-deep eyebrow (#2563eb), accessibility-passing typography across all surfaces.

**Pilot is paused at 2 recipients (Frank + Stephanie Samaritano)** by explicit decision (D-PILOT-1, D-PILOT-2 below). No real-family dispatch until Frank explicitly resumes. Test sends to admin@ continue for verification.

---

# PART 2: VERIFIED PRODUCTION STATE (May 9 afternoon)

## Database

**Source of truth:** Live SQL queries against project `vrwwpsbfbnveawqwbdmj` at ~13:45 UTC.

| Metric | Value | vs v4 |
|---|---|---|
| Latest migration | `20260509124926` | +30 migrations applied since `20260427190412` |
| Edge functions deployed | 2 | `invite-parent` + `send-tournament-message` (NEW since v4) |
| `comms_messages` rows (digest kind) | 5+ | New table family from foundation rename, populated by digest sends |
| `guardians.is_pilot_family` flagged | 2 | Frank + Stephanie Samaritano |
| `organization_settings` per-org config | populated | from_name, from_email, reply_to_email, pilot_mode_enabled all set for Legacy Hoopers |

## Migrations applied since v4 (chronological)

The May 8–9 build session shipped substantial schema work:

| Version | Name | Purpose |
|---|---|---|
| `20260509004510` | `roster_lock_kind_extension_and_rpcs` | Roster lock RPCs (lock/unlock/add_callup/remove_callup) |
| `20260509004550` | `roster_lock_revoke_anon_execute` | REVOKE EXECUTE FROM anon for roster lock RPCs |
| `20260509021709` | `digest_recipients_function` | `get_digest_recipients(p_org_id)` SECURITY INVOKER RPC |
| `20260509031540` | `comms_messages_rls_org_scoped` | Org-scoped RLS for comms_messages + comms_message_recipients |
| `20260509101739` | `pilot_mode_infrastructure` | `organization_settings.pilot_mode_enabled` + `guardians.is_pilot_family` + RPC pilot filter overload |
| `20260509103700` | `briefing_queue_tab_filter` | `get_briefing_queue(p_org_id, p_tab)` for Active/Past/All inbox tabs |
| `20260509103810` | `briefing_queue_archived_in_past_all` | Allow archived tournaments in Past + All tabs |
| `20260509112704` | `org_settings_reply_to_email` | `organization_settings.reply_to_email` column |
| `20260509124926` | `org_settings_from_name_email` | `organization_settings.from_name` + `from_email` columns |

Plus foundation work mirrored in earlier waves (May 8): comms_messages rename + recipients body-capture columns, polymorphic `kind` enum, etc.

All migrations have mirror files in `supabase/migrations/` per anti-pattern §21. Mirror file for `20260509124926` lands in PR #37 (this PR — wave 3.8).

## Application

**Source of truth:** github.com/LegacyHoopers/skyfire-app at SHA `5c43be89` on branch main.

| Metric | Value |
|---|---|
| Production main HEAD | `5c43be89` (PR #36 wave 3.7 hotfix) |
| Production deploy | live on `skyfire-app.vercel.app` (and `app.legacyhoopers.org`) |
| Vercel project | `prj_peID30eF61qubU90e1TVvM1kikuP` |
| Tests | 117/117 passing |
| Bundle | 300 KB main / 88 KB gzip — under 350 KB budget |

## Edge function `send-tournament-message`

**Current: v13 ACTIVE**, sha256 `83bd9d0d3ed86860a0bb4218f82dacf8e963336ea1bd531287bd5b0036e9515f`.

Version evolution this session:
- **v7** (PR #29 wave 3) — initial deploy with per-recipient body capture + Resend batch chunking
- **v8** — hotfix: reply_to corrected to `info@legacyhoopers.org`
- **v9** (PR #34 wave 3.6) — adds `organization_settings.reply_to_email` column read with fallback
- **v10–v12** — Frank's iteration on column-read pattern + per-tenant config plumbing
- **v13** — adds `from_name` + `from_email` column reads alongside `reply_to_email`. Current ACTIVE state.

**Pilot mode defense in depth (in v9+):** when `pilot_mode_enabled=TRUE`, every queued recipient with non-null `guardian_id` MUST have `is_pilot_family=TRUE`. Any leak → 403 with offending email list. Admin BCC rows (guardian_id=null) always allowed.

---

# PART 3: PR LEDGER FOR THIS BUILD SWEEP (May 8–9)

15 PRs merged across two days (May 8 and May 9). Wave 3 → wave 3.8 covers the full digest engine + accessibility + tenant config + housekeeping arc.

| PR | SHA | Title |
|---|---|---|
| #23 | `a82ed12` | Bug 1 fix (recipient count) + admin@ BCC |
| #24 | `f4be14c8` | Foundation comms_messages rename mirror |
| #25 | `ad3bf063` | Roster lock RPCs mirror |
| #26 | `ecc3964` | Engine renderer wave 1 (header, gameCard, championshipScenarios, academy_callup_notice) |
| #27 | `2123cb41` | Roster lock UX + academy callup picker |
| #28 | `705fdfa` | Engine renderer wave 2 (5 real + 6 templates + 2 free-text) |
| #29 | `062f8808` | Wave 3 — weekly digest engine + per-family dispatch |
| #30 | `764a51b8` | RLS org-scoped policies mirror |
| #31 | `baf006e9` | Pilot mode infrastructure mirror |
| #32 | `d85e29f7` | Wave 3.5 PR-B — digest polish + pilot mode + edge function v7 |
| #33 | `7243b842` | Wave 3.5 PR-C — inbox tabs + schedule_change diagnosis + tournament Sat+Sun pattern |
| #34 | `5531ead0` | Wave 3.6 — WCAG accessibility + footer + reply_to_email column |
| #35 | `d923ab5f` | Phoenix → Knight logo swap |
| #36 | `5c43be89` | Wave 3.7 hotfix — transparent Knight + color-coded RSVPs + migration mirror |
| #37 | (this PR) | Wave 3.8 §5.1 + §5.3 — staff profile UI bug fix + STATE_OF_AFFAIRS v5 + BUILD_QUEUE update |

---

# PART 4: LOCKED ARCHITECTURAL DECISIONS (this session)

These supplement v4 Part 4. Read alongside it.

| Decision ID | Locked content |
|---|---|
| **D-PILOT-1** | Pilot send is **PAUSED INDEFINITELY**. No real-family dispatch until Frank explicitly resumes. Test sends to admin@ are encouraged for verification. |
| **D-PILOT-2** | Pilot list stays at **2 (Samaritano household)**. Restore to 6 (add Alexander + Dodaro) is a one-line UPDATE on Frank's signal. |
| **D-LOGO-1** | Knight logo is the post-auth Legacy Hoopers brand mark. Phoenix is the pre-auth Ember PWA shell. **Never swap them.** Knight rendered with TRANSPARENT alpha channel. |
| **D-RSVP-1** | Color-coded RSVP counts in renderer #6: going `#16a34a`, maybe `#d97706`, out `#dc2626`, separators in `TEXT_GRAPHITE`. Compound visual (count + label both colored). Zero state stays muted. |
| **D-RSVP-2** | RSVP update from email = ONE-TAP (signed token URL, single-use, no app redirect). Wave 4a scope. |
| **D-VIEW-1** | Detailed digest view = compose-time toggle on `weeklyDigest` kind, NOT a separate kind. `{ detailed: bool }` flag. Wave 4c scope. |
| **D-WEATHER-1** | Weather forecast per event fetched at COMPOSE TIME (not on email open) via OpenWeatherMap, cached 6h, indoor events skip. Wave 4b scope. |
| **D-CIRCUIT-1** | Circuit-aware composer split: `weekly_digest_aau` vs `weekly_digest_league`. Wave 4.5 scope. |
| **D-TENANT-1** | All email-header values per-org configurable via `organization_settings` columns. Live: `from_name`, `from_email`, `reply_to_email`. Edge function v13 reads all three with safe fallbacks. |

---

# PART 5: ACTIVE BUG CATALOG (delta from v4)

## Closed since v4

All v4 P0 bugs remain closed. New closures this session:

- ✅ **Bug 1 (recipient count + admin@ BCC)** — PR #23
- ✅ **`comms_messages_write` RLS blocked digest INSERT** (tournament_id-scoped policy ignored non-tournament kinds) — PR #30
- ✅ **Briefings inbox missing past tournaments** (RPC start_date window + `archived_at IS NULL` filter excluded ZG NY Metro Showdown Apr 18-19) — PR #33
- ✅ **Phoenix logo in footer** — wrong asset (apple-touch-icon = PWA shell). Swapped to Knight in PR #35.
- ✅ **Knight logo white box** — source had no alpha channel. Re-exported with transparency in PR #36.
- ✅ **RSVP counts low contrast** (12px `#94a3b8` failed WCAG AA) — bumped to 13px `#475569`, then color-coded in PR #36.
- ✅ **Eyebrow + day header low contrast** (`#4a8fd4` failed WCAG body 4.5:1) — bumped to `#2563eb` in PR #34.
- ✅ **Reply-to was personal Gmail** (regression in v8 hotfix) — moved to `organization_settings.reply_to_email` column read in PR #34, edge function v9+.
- ✅ **Profile editor save fails with "Couldn't save profile"** — useStaffProfile.js upsert payload missing `org_id` (NOT NULL constraint failed at INSERT phase even when conflict path resolved). Fixed in PR #37 (this PR — wave 3.8 §5.1).

## Still open

Pre-existing v4 P1 bugs unchanged (UpcomingEvents stub data, Comments display name, Games filter, MY TEAMS records, NextUpCard urgency, Login CTA color). Phase 1 work remains the path to closing them.

`schedule_change` UX is documented in `docs/SCHEDULE_CHANGE_DIAGNOSIS.md` (PR #33). Root cause confirmed: `useUpdateActivity.updateSeries()` strips `start_at`/`end_at` deliberately + `schedule_change` kind has zero producers in the codebase. Wave 3.8 §5.2 candidate (3-option dialog + dispatch + audit table) — pending Claude.ai spec lock before CC starts.

---

# PART 6: BACKLOG (next 3 sessions)

| Wave | Scope | Estimate | Status |
|---|---|---:|---|
| **3.8 §5.1** | Profile UI bug fix (staff_profiles.org_id in upsert) | 30 min | ✅ THIS PR |
| **3.8 §5.2** | schedule_change UX rebuild (3-option dialog + composer + audit table) | 6-8h | Spec pending Claude.ai |
| **3.8 §5.3** | Doc rot fix (STATE_OF_AFFAIRS v5 + BUILD_QUEUE update) | 30 min | ✅ THIS PR |
| **4a** | RSVP one-tap tokens (HMAC + edge fn + per-event anchors in renderer) | 8-10h + security pass | Backlog |
| **4b** | Weather forecast (OpenWeatherMap + 6h cache + outdoor/indoor gating) | 4-6h | Backlog |
| **4c** | Detailed compose toggle (`detailed: bool` flag + per-event notes/opponent/context) | 4-6h | Backlog |
| **4.5** | Circuit-aware composer split (weekly_digest_aau vs weekly_digest_league) | TBD | Backlog |
| **5+** | Capacitor + App Store + Fall 2026 rollout, then Stripe + multi-tenant cleanup | TBD | Backlog |

Phase 0C (Ember rebrand), Phase 1 (Parent 95%), Phase 2 (Coach 95%), Phase 3 (Admin 95%), Phase 4-7 timelines unchanged from v4 Part 7.

---

# PART 7: REFERENCE PATHS (deltas from v4)

## New documentation in repo

- `docs/SCHEDULE_CHANGE_DIAGNOSIS.md` — Wave 3.6 candidate readout for the `schedule_change` rebuild (PR #33)
- `docs/STATE_OF_AFFAIRS_L99_v5.md` — **this file**

## New source code

- `src/lib/engine/composer.js` + `src/lib/engine/renderers/*.js` — engine + 16 atomic renderers + 3 kind composers (academy_callup_notice, tournament_preliminary, weekly_digest) + footer + colors module
- `src/lib/engine/__fixtures__/*.js` — 13 renderer fixtures + weeklyDigest fixture
- `src/components/admin/briefings/Digest*.jsx` — DigestComposer, DigestComposerForm, DigestRecipientPreview, DigestComposeButton, PilotModeBanner
- `src/hooks/useDigest*.js` — useDigestRecipients, useDigestEvents, useOrgSettings, useOrgStaff
- `src/lib/digestSend.js` — per-family compose + queue + dispatch pipeline
- `supabase/functions/send-tournament-message/index.ts` — edge function, currently v13 in production
- `supabase/migrations/2026050900*.sql` and `2026050910*.sql` and `20260509124926_*.sql` — 9 schema migrations from this session (all mirrored)

## Production artifacts (unchanged)

- Supabase project: `vrwwpsbfbnveawqwbdmj`, org `e3e95e21-3571-4e9a-985a-d5d01480d4a6`
- Vercel project: `prj_peID30eF61qubU90e1TVvM1kikuP`
- GitHub: `LegacyHoopers/skyfire-app` (private, will rename in Phase 0C)
- Production URL: `app.legacyhoopers.org` + `skyfire-app.vercel.app`

---

# PART 8: NEW ANTI-PATTERNS LEARNED

v4 listed principles 1-16. Three new lessons from this session:

**17. Email HTML cannot use CSS variables.** Wave 3.6 spec said "use --sf-* CSS variable namespace" — but most email clients (Gmail, Outlook, Apple Mail Win) strip or inline-resolve CSS variables, breaking the design intent. Solution shipped in PR #34: `src/lib/engine/colors.js` exports JS constants. Renderers import from this module. Same outcome (centralized, single source) without the email-client incompatibility. Future email-renderer work uses this pattern.

**18. PostgREST upsert validates NOT NULL columns at INSERT phase.** `INSERT INTO ... ON CONFLICT (user_id) DO UPDATE SET ...` builds a full INSERT row first, validates NOT NULL, THEN routes to the conflict path. If the payload omits a NOT NULL column without a default, the upsert errors before reaching UPDATE — even when the row already exists and only fields in the payload need updating. Solution: include all NOT NULL columns in upsert payloads. Direct SQL UPDATE is unaffected (only updates columns in SET). Caught in wave 3.8 §5.1 (`staff_profiles.org_id` missing from `useStaffProfile.js` upsert).

**19. PWA service-worker cache invalidation is a real test-deploy gap.** Multiple times this session, Frank's iOS PWA served the previous bundle for ~30-90 seconds after a Vercel deploy completed. Test sends composed during that window rendered with stale code — looked like a bug but was actually cached client. Solution: when verifying a UI-rendering change post-deploy, force-quit the PWA + Safari hard-reload before the verification compose. Future waves should bake this into the verification checklist explicitly.

**20. PostgREST `.upsert(..., { onConflict: 'col' })` requires a real UNIQUE/PK on the named column(s).** Single-column conflict targets fail with `42P10` when the table only has a composite UNIQUE/PK. PR #38 fixed `staff_profiles` upsert by switching `'user_id'` → `'user_id,org_id'` (the PK is composite). Always cross-check `pg_constraint` for `contype IN ('u','p')` before writing onConflict. Combine with #18 and you can land two separate-cause PRs against the same line — defensive grep confirmed all 9 remaining upsert sites in `src/` target real composite UNIQUEs. Codified as CLAUDE.md anti-pattern #25.

**21. Diagnostic protocol: replay failing operations via MCP `execute_sql` before shipping the fix PR.** PR #37 fixed half the staff_profiles bug; PR #38 fixed the other half. One MCP replay between them would have surfaced both at once because Postgres error codes (42501, 42P10, 23502, 23505) name the failure category instantly. Codified as CLAUDE.md anti-pattern #26. Wave 3.8 §5.2 baked this into the schema migration step (RLS smoke + admin/parent insert before merge).

---

# PART 9: WAVE 3.8 §5.2 — SCHEDULE_CHANGE UX REBUILD (May 9, 2026)

Closes the "Wed→Fri move silently no-op" diagnosis from PR #33 (`docs/SCHEDULE_CHANGE_DIAGNOSIS.md`). Two compounding bugs:

1. `useUpdateActivity.updateSeries()` deleted `start_at`/`end_at` from the payload unconditionally — every date/time change in series mode silently failed to persist.
2. `schedule_change` enum existed in `comms_messages.kind` CHECK + label maps but had **zero producers** in the codebase. Even when single-mode persisted, families were never notified.

### Shipped

- **Migration `20260509144639_schedule_change_audit_table`** — `event_change_audit` (id, org_id, event_id, changed_by, changed_at, change_kind {time/location/cancelled/other}, recurrence_scope {instance/this_and_future/series}, before_jsonb, after_jsonb, dispatch_email_id FK to comms_messages). RLS smoke verified pre-merge (admin insert succeeds, parent insert rejected 42501).
- **`src/lib/engine/renderers/scheduleChange.js`** — kind composer with header / summary / diff block / signoff / footer sections. Subject auto-derived from after.label.
- **`src/lib/engine/renderers/scheduleChangeDiff.js`** — section renderer for the strikethrough-old / bold-new diff block. Plain-text path uses uppercase `PREVIOUS` / `UPDATED` prefixes.
- **`src/hooks/useUpdateActivity.js`** — `updateSeries(eventId, parentId, oldStartAt, formData, scope)`. Three scopes; offset math (`newStart - oldStart`) preserves day-of-week pattern when shifting siblings. No more unconditional date strip.
- **`src/components/event/ScopeChoiceDialog.jsx`** — three-option bottom sheet replacing the old 2-option ConfirmDialog.
- **`src/components/event/ScheduleChangeComposer.jsx`** — pre-populated composer (FullScreenForm) with diff preview, signoff textarea, audience count, test-only toggle, Send + Skip paths.
- **`src/hooks/useScheduleChangeAudit.js`** — `recordSkip(diff)` writes audit row only; `recordAndDispatch(diff, opts)` dispatches via `send-tournament-message` v13 then writes audit row with `dispatch_email_id` populated. Pilot mode gate inherited from v13.
- **`src/lib/scheduleChangeSend.js`** — schedule_change send pipeline (mirrors `digestSend.js` shape).
- **`src/components/wizard/wizardForm.js`** — `buildSaveDiff()` helper extracted to keep wizard ≤150 lines.

### Defensive grep result

All 9 `.upsert()` call sites in `src/` audited: every composite-PK or composite-UNIQUE table has a matching comma-separated onConflict spec. Zero remaining anti-pattern #25 traps.

### Edge function

v13 unchanged. schedule_change routes through the same dispatch path — pilot mode gate applies automatically.

---

# APPENDIX (May 10, 2026 — late afternoon)

**Wave 4.2-A-2 shipped.** `resolveGameRecap` + `composeGameRecap` extracted into `src/lib/engine/resolvers/gameRecap.js`. Compose UI's data-shaped score / POG / coach_highlight inputs replaced with read-only displays backed by `game_results`, with Quick Score edit-links. `GameRecapNotPublishedError` thrown when published_at is null. Production unlock: 32 published-but-unrecapped games no longer require manual retyping. Snapshot anchored to hand-authored expected output for event a0b2d68a (10U Blue vs Resurrection White 4AB, 2026-05-02 W 2-0).

**Wave 4.2-A-1 shipped.** Reference resolver pair (`resolveWeeklyDigest` + `composeWeeklyDigest`) extracted from the four-hook + buildScheduleSection chain into `src/lib/engine/resolvers/weeklyDigest.js`. Locks the two-stage contract for the rest of wave 4.2-A:
```
resolveX(anchor, options) -> { context, slices }
composeX(context, slice, overrides) -> { subject, content_sections }
```
Snapshot parity against production row `3b431eb1` confirmed. `digestSchedule.js` deleted; helpers moved to `src/lib/engine/resolvers/weeklyDigestSchedule.js`. See `docs/BRIEFINGS_COVERAGE_L99.md` §0.

# END OF DOCUMENT

**Next action when this is consumed by a new chat:** Verify against live Supabase + git. The pace of this session was high; if anything has shipped after `5c43be89`, write v6 before executing work. Do not skip verification.
