# L99 Briefings Full Audit — 2026-05-11

**Purpose:** Handoff document for Claude.ai to plan wave 4.3-H (pre-launch quality pass) and wave 4.3-C (inbox enrichment) with full ground-truth visibility into the briefing code surface.

**Methodology:** Three parallel code-side Explore agents (engine, edge-functions+schema, UI+state) + session-fresh discovery + live Supabase MCP cross-checks. All file:line refs are anchors as of `main` HEAD `fee2aac` + wave 4.3-B merged.

**Branch in flight:** `claude/wave-4-3-h-bug-cleanup-and-branding` (not yet pushed). Step 1 discovery complete; Step 2 implementation pending answers to 3 open questions (see §10).

---

## 1. Executive Summary

The briefing auto-draft engine (wave 4.3-B) is functionally clean post-merge. Cron health: 27/27 ticks 200 in the last 15min, 0 errors. Idempotency holding. RLS coverage clean across the 13 critical tables. All 7 shared-secret edge functions comply with anti-pattern #31 (`verify_jwt: false` declared) and #33 (secrets in `app_secrets` or platform-managed).

Production data state was **wiped at 01:17 UTC tonight** (migration `20260511011751_wave_4_3_h_data_full_interaction_wipe`): 227 rows across 14 interaction tables deleted; structural data (145 events, 33 game_results, 5 teams, 115 players, 175 guardians, all org settings, all briefing_triggers) preserved. Auto-draft engine has since refilled `comms_messages` with 9 fresh drafts using current (pre-4.3-H) code.

Outstanding issues fall into four buckets:
1. **Wave 4.3-H pre-launch quality pass** — 9 items, scope-locked, awaiting answers to 3 open Qs before implementation.
2. **Wave 4.3-C inbox enrichment** — inbox SELECT projection incomplete; row-level resolver preview not yet wired.
3. **Wave 4.4 polymorphic rename completion** — 22 rows with legacy `body_html`, 14 with `headline`, 7 with `tournament_id` field writes from the manual send path; needs cleanup migration to stop dual-writing.
4. **Phase 4+ polish** — branded token-handler confirmation pages, engagement trending dashboard, cron observability, multi-kid "Going for all" UX.

No P0s outstanding. No active regressions in flight.

---

## 2. Production State Snapshot

**Post-wipe + cron refill (verified via MCP 2026-05-11 01:35 UTC):**

| Table | Count | Notes |
|---|---|---|
| event_rsvps | 0 | wiped |
| event_duties | 0 | wiped |
| event_arrivals | 0 | wiped |
| event_comments | 0 | wiped |
| check_ins | 0 | wiped |
| event_ride_claims | 0 | wiped |
| event_ride_requests | 0 | wiped |
| event_ride_offers | 0 | wiped |
| event_notifications | 0 | wiped |
| comms_messages | 9 | refilled by cron post-wipe |
| comms_message_recipients | 0 | wiped (cascade-protected) |
| event_change_audit | 0 | wiped |
| messages | 0 | wiped |
| dm_threads | 0 | wiped |
| events | 145 | preserved |
| game_results | 33 | preserved |
| briefing_triggers | 22 active | preserved |

**Residual that wasn't wiped (intentional):**
- `message_reads` (9 rows) — per-user channel marker, no FK to messages, harmless residual.
- `briefing_triggers` (22 active) — config data, structural.
- `organization_settings`, `app_secrets`, structural tables — preserved.

**Composition contract clarification (key architectural lock):** Auto-draft rows store only `{kind, anchor_kind, anchor_id, audience_type, audience_filter, status}`. Subject + content_sections + body_html stay empty/null and **compose fresh at preview/send time** against whatever code is deployed. This means wave 4.3-H fixes will flow through to all 9 currently-refilled drafts automatically when the PR merges — no re-wipe required.

---

## 3. Engine Code Surface

**Inventory:** 42 files, ~6,200 lines across `src/lib/engine/`.

### Resolver/Composer Registry (7 canonical kinds)

`src/lib/engine/resolvers/registry.js` (122 lines) is the single source of truth. Each registry entry exposes `{ resolve, compose, anchorFromState, overridesFromState, sendPath, blockedReason? }`.

| Kind | File | Lines | sendPath | Anchor Type |
|---|---|---|---|---|
| weekly_digest | weeklyDigest.js | **152** ⚠ | digestSend | org + period |
| game_recap | gameRecap.js | 117 | composerSubmit | eventId |
| tournament_prelim | tournamentPrelim.js | 148 | composerSubmit | tournamentId |
| tournament_recap | tournamentRecap.js | 130 | composerSubmit | tournamentId |
| schedule_change | scheduleChange.js | 134 | composerSubmit | eventId |
| rsvp_nudge | rsvpNudge.js | 134 | rsvpNudgeSend | eventId |
| academy_callup_notice | academyCallupNotice.js | — | academyCallupSend | eventId + playerId |

⚠ `weeklyDigest.js` at 152 lines is **2 over** the 150-line cap (CLAUDE.md §6). Pre-existing tech debt, not introduced by 4.3-B.

### Helpers + Composers

- `gameRecapHelpers.js` (60 lines) — **contains the "vs opponent" bug at line 26**
- `rsvpNudgeHelpers.js` (63)
- `scheduleChangeHelpers.js` (91)
- `tournamentPrelimHelpers.js` (85) — uses `tournament.name` from joined table ✓
- `tournamentRecapHelpers.js` (47) — uses `tournament.name` from joined table ✓
- `weeklyDigestSchedule.js` (101) — **contains the tournament_name priority bug at line 33**

### Renderers

30 files, 1,606 lines across `src/lib/engine/renderers/`.

**Per-kind renderers:** weeklyDigest.js (119), gameRecap.js (75), rsvpRequest.js (69), academyCallupNotice.js (78), scheduleChange.js (88).

**Atomic section renderers** (composable): gameCard.js (92), weeklySchedule.js (106), scheduleChangeDiff.js (96), header.js (63), plus footer, signoff, statsNarrative, poolStandings, resultsTable, tiebreakerExplainer, etc.

**Snapshot tests:** in `src/lib/engine/renderers/__tests__/__snapshots__/` — fixture-driven, asserting exact HTML output per kind.

### Send Pipelines

| File | Lines | Purpose | INSERT shape |
|---|---|---|---|
| `composerSubmit.js` | 127 | Registry-driven dispatch | delivery_method='queued' on init, →'resend_api' on send |
| `digestSend.js` | 150+ | Per-family weekly_digest sends | delivery_method='queued' / 'resend_api' |
| `scheduleChangeSend.js` | — | Schedule change broadcast | delivery_method='queued' / 'resend_api' |
| `rsvpNudgeSend.js` | 98 | Per-kid RSVP token mint + queue | delivery_method='queued' / 'resend_api' |
| `academyCallupSend.js` | — | Per-kid callup token mint + queue | delivery_method='queued' / 'resend_api' |
| `briefings/queueComposedMessages.js` | — | Bulk insert with adminSample override | delivery_method='resend_api' |
| `briefings/queueRecipients.js` | — | Per-recipient row generation | delivery_method='resend_api' |

### Cron Helpers (anti-pattern #30 mirror pair)

- `src/lib/cron/briefingCronHelpers.js` (102 lines) — vitest-covered source of truth. Functions: `partsInTimeZone`, `localDateIso`, `addDaysIso`, `isWeeklySundayWindow`, `weeklyDigestPeriod`, `buildWeeklyDigestDraftRow`, `weeklyDigestIdempotencyKey`.
- `supabase/functions/briefing-auto-draft-tick/_helpers.ts` (94 lines) — Deno mirror. Header comments enforce sync. ✓ Compliant.

### Auto-Draft Handlers

`supabase/functions/briefing-auto-draft-tick/_handlers.ts` (150 lines). 5 trigger handlers: `handleGameCompleted`, `handleTournamentApproaching`, `handleTournamentCompleted`, `handleScheduleChanged`, `handleRsvpLow24h`. Plus `handleEventReminderDue` stub (returns `skipped: 'not_implemented'`).

**Item 8 bug location:** `_handlers.ts:143` — `handleRsvpLow24h` drafts for every event in 24h window, no threshold check. Comment: "Future refinement: check RSVP coverage threshold (e.g., < 70% responded)."

---

## 4. Edge Functions + Schema Surface

### Edge Functions Inventory

| Function | Lines | Auth | verify_jwt | Secrets |
|---|---|---|---|---|
| briefing-cron-dispatch | 141 | Bearer vs app_secrets.cron_secret | false (config:34) | app_secrets: cron_secret, supabase_jwt_secret |
| briefing-auto-draft-tick | 109 | Bearer vs app_secrets.cron_secret | false (config:49) | app_secrets: cron_secret |
| rsvp-token-handler | 113 | HMAC token via RPC | false (config:37) | GUC: rsvp_token_secret |
| callup-token-handler | 113 | HMAC token via RPC | false (config:52) | app_secrets: callup_token_secret |
| unsubscribe-handler | 81 | HMAC token via RPC | false (config:43) | GUC: unsubscribe_secret |
| resend-webhook-receiver | 116 | Svix signature | false (config:46) | Deno.env: RESEND_WEBHOOK_SECRET (Resend-managed; #33 exempt) |
| send-tournament-message | **185** ⚠ | User JWT (often impersonated) | true | Deno.env: SUPABASE_URL, SERVICE_ROLE_KEY |

⚠ `send-tournament-message/index.ts` at 185 lines is **35 over** the 150-line cap. Pre-existing tech debt.

### Migration History — Briefings-Related (last 15)

| Version | Name | Wave |
|---|---|---|
| 20260511011751 | wave_4_3_h_data_full_interaction_wipe | 4.3-H |
| 20260510200529 | wave_4_3_d_callup_token_infrastructure | 4.3-D |
| 20260510 (TBC) | wave_4_3_a_auto_draft_weekly_digest | 4.3-A |
| 20260509234601 | unsubscribe_token_mint_and_verify_functions | 4.2 M8 |
| 20260509215604 | rsvp_token_infrastructure | 4.0 |
| 20260509101739 | pilot_mode_infrastructure | 4.2 |
| 20260508234920 | comms_foundation_polymorphic_rename | 4.1d |
| 20260505161540 | user_roles_self_privilege_escalation_fix | M5 |
| (earlier) | wave_4_3_f_cron_secret_to_app_secrets | 4.3-F |
| (earlier) | wave_4_3_g_jwt_secret_to_app_secrets | 4.3-G |
| 017 | organization_settings_admin_configurable | early — defines nudge_rules jsonb |

**Pending mirror file** (per anti-pattern #21):
- `supabase/migrations/20260511011751_wave_4_3_h_data_full_interaction_wipe.sql` — applied via MCP, mirror needed in repo. **Will land in 4.3-H PR.**

### RLS State (briefings tables)

| Table | Coverage |
|---|---|
| comms_messages | RLS enabled; admin-scoped via org_id matches user's organization |
| comms_message_recipients | RLS enabled; service_role for Resend webhook; admin SELECT |
| briefing_triggers | RLS enabled; admin SELECT only |
| event_change_audit | RLS enabled; service_role INSERT; org-scoped SELECT |
| app_secrets | RLS enabled; service_role SELECT only |

**Anti-pattern #24 reminder:** when auditing RLS, filter by `pg_class.relkind='r'` to skip views. `notifications_queue` is a view and surfaces as a false positive in coverage audits.

### Token Infrastructure RPCs (SECURITY DEFINER)

- `mint_rsvp_token(event_id, player_id, response)` — 30-day expiry, HMAC-SHA256 via GUC secret
- `verify_rsvp_token(token_string)` — validates sig + expiry + nonce reuse
- `mint_callup_token(event_id, academy_player_id, response)` — no expiry, app_secrets-sourced
- `verify_callup_token(token_string)`
- `apply_callup_decline(event_id, academy_player_id)` — array_remove() from events.academy_callup_player_ids
- `mint_unsubscribe_token(guardian_id)` — no expiry (CAN-SPAM)
- `verify_unsubscribe_token(token_string)`

### Anti-Pattern Compliance Summary

| Anti-pattern | Coverage |
|---|---|
| #27 (pure resolvers) | ✓ All 7 resolvers inject supabase via options |
| #28 (registry as dispatch source) | ✓ composerSubmit.js routes via registry; no per-kind branching outside |
| #29 (token substitution separation) | ✓ rsvp + callup use separate placeholder/url fields, fail-loud renderer |
| #30 (edge function mirror sync) | ✓ briefing-auto-draft-tick/_helpers.ts ↔ briefingCronHelpers.js synced |
| #31 (verify_jwt config) | ✓ All 6 shared-secret functions declared in config.toml |
| #33 (secrets in app_secrets) | ✓ All migrated; Resend exempt as documented |

---

## 5. UI + State Flow Surface

### Component Inventory

| File | Lines | Purpose |
|---|---|---|
| `BriefingComposer.jsx` | 148 | 3-step wizard, near line cap |
| `PreviewPanel.jsx` | 80 | Resolver bridge to renderers |
| `composerSubmit.js` | 126 | Dispatch router |
| `composerReducer.js` | 92 | State machine |
| `ActionQueueRow.jsx` | 54 | Inbox row renderer |
| `ActiveQueue.jsx` | 50 | Merge DB drafts + synthetic items |

### Hook Inventory

| Hook | Purpose | Critical gap |
|---|---|---|
| useBriefingDraft | INSERT + auto-save + UPDATE flow | buildPayload doesn't capture pilot_only (per agent finding — but see §6 fix decision) |
| useInboxQueue | SELECT projection on comms_messages | **Missing fields: content_sections, signoff_message, body_html, test_only, pilot_only, last_edited_by** |
| useNeedsBriefing | Synthetic action items | — |
| useDigestRecipients | RPC get_digest_recipients with pilot_only param | — |
| useOrgSettings | Reads pilot_mode_enabled | Default `?? true` is fail-closed |
| useOrgStaff | Coaches list for signoff | — |
| useWizardDigestData | Wizard digest data bundle | — |
| useResolverPreview | Bridges resolver to PreviewPanel | — |

### Inbox SELECT Projection (verbatim from useInboxQueue.js:19)

```
'id,kind,anchor_kind,anchor_id,audience_type,audience_filter,status,scheduled_for,subject,last_edited_at,created_at'
```

**Gaps for 4.3-C:**
- `last_edited_by` — required for auto/manual badge + filter
- `content_sections` + `body_html` + `signoff_message` — required for in-row preview enrichment
- `test_only` — for test-send filter
- `created_by_trigger` — once item 7 lands in 4.3-H

### Subject Fallback Path (ActionQueueRow.jsx:38)

```js
row.subject || KIND_METADATA[row.kind]?.label || row.kind
```

When `subject` is NULL (case for ~all unsent drafts post-wipe), renders generic kind label ("Game Recap"). 4.3-C target: row-level resolver compose to produce "Game recap — 10U Blue vs Resurrection White".

### BriefingComposer State Flow

**Reducer dispatch types:** SET_KIND, SET_ANCHOR, SET_AUDIENCE, UPDATE_BODY, UPDATE_SIGNOFF, GO_FORWARD, GO_BACK, JUMP_TO, HYDRATE_DRAFT, TOGGLE_TEST, SET_SCHEDULE.

**HYDRATE_DRAFT payload** (BriefingComposer.jsx:70):
```js
{ kind, anchor_kind, anchor_id, audience_type, audience_filter, body, signoff_message, draft_id }
```
**Missing: pilot_only.** All 7 resolver entries' `anchorFromState` read `state.pilot_only`. Currently always undefined → resolves as falsy → preview ignores pilot mode.

**Side-effect useEffects:** auto-advance for single-kind kindFilter, HYDRATE_DRAFT on mount, kind-null guard (bounces Step 3 → Step 1), debounced auto-save (3s).

### Per-Kind State Plumbing

| Kind | anchorFromState reads | HYDRATE populates? |
|---|---|---|
| weekly_digest | pilotOnly | ✗ |
| game_recap | pilotOnly | ✗ |
| tournament_prelim | pilotOnly | ✗ |
| tournament_recap | pilotOnly | ✗ |
| schedule_change | pilotOnly | ✗ |
| rsvp_nudge | pilotOnly | ✗ |
| academy_callup_notice | pilotOnly | ✗ |

### Elite Design Principles Compliance

- **Density:** ActionQueueRow uses minHeight 40px, gap 8px, single-line truncation. Acceptable for list scannability.
- **Accessibility:** Step counter labels "Step 3 of 3" for screen readers. Back button aria-label present. SaveStatusPill announces draft state. **Gap:** no ARIA live regions for toast notifications (useToast context may handle, unconfirmed).
- **Microcopy:** Kind picker has warm descriptions ("Monday-morning week-ahead summary"). Empty states ("No briefs match your filters", "No drafts yet. Start one below.") align with §16.3 kindness mandate.

---

## 6. Known Bugs — P1 (production-impacting)

Consolidated from the audit reconciliation work + this audit. All ground-truth-verified.

### Bug 1 — `pilot_only` state plumbing missing (P1 critical, UX-visible today)

- **Where:** BriefingComposer.jsx:70 HYDRATE_DRAFT payload omits pilot_only; all 7 registry anchorFromState reads `state.pilot_only`.
- **Impact:** With org pilot mode ON, preview resolves with `pilotOnly=undefined` (falsy) → previews against FULL recipient set; send pulls pilot subset via `useDigestRecipients({ pilotOnly: pilotModeEnabled })`. Mismatch between preview and send.
- **Fix decision (cleaner than original framing):** pilot_only is org-level, not draft-level. Don't add a schema column. Read `pilotModeEnabled` from `useOrgSettings(orgId)` into state at hydrate time + sync via separate effect when the flag toggles mid-session. No migration needed.

### Bug 2 — `from_name` hardcoded constant

- **Where:** `send-tournament-message/index.ts:47` → `const FROM_NAME = "Coach Frank · Legacy Hoopers"`. Single value, all kinds, hardcoded literal.
- **Impact:** Weekly digests sent from "Coach Frank" instead of "Legacy Hoopers · Week Ahead" (org-voice, not coach-voice). Wrong shape for org-wide digests.
- **Fix:** per-kind resolver. `weekly_digest` → "Legacy Hoopers · Week Ahead"; coach-driven kinds → `Coach {first_name} · Legacy Hoopers`; fallback → `organization_settings.from_name`.

### Bug 3 — `game_recap` "vs opponent" placeholder leak

- **Where:** `gameRecapHelpers.js:26` + `gameRecap.js:99` → `const opp = event?.opponent || 'opponent';`
- **Impact:** 1 sent production row already affected: `Recap — Legacy Hoopers 25-27 vs opponent`. Triggers whenever a game has NULL opponent.
- **Fix:** conditional clause emission. Omit `vs X` chunk when opponent is null/empty.

### Bug 4 — Tournament name priority bug in weekly_digest

- **Where:** `weeklyDigestSchedule.js:33` → `event.tournament_name || tournament?.name || 'Tournament'`. Denormalized field takes priority over joined.
- **Impact:** Same tournament rendered inconsistently across the digest. Production data showed `Rumble for the Ring CT` (Sat) vs `ZG Rumble for the Ring CT` (Sun) for the same event.
- **Fix:** invert priority → `tournament?.name || event.tournament_name || 'Tournament'`. Or drop `tournament_name` from `EVENT_SELECT` at weeklyDigest.js:28 entirely.

### Bug 5 — `delivery_method` inconsistency

- **Where:** `briefingCronHelpers.js:71` (weekly_digest builder) + `_helpers.ts:65` (Deno mirror) omit `delivery_method` → DB default `'copy_paste'`. `_handlers.ts:48` (other 5 kinds via placeholderDraft) sets `'queued'`.
- **Impact:** Cosmetic semantic drift; same pre-send state, two values. May surface as inconsistent labels in inbox.
- **Fix:** add `delivery_method: 'queued'` to both weekly_digest builders.

### Bug 6 — `verify_jwt` audit glob too narrow

- **Where:** `src/lib/__tests__/verifyJwtConfigAudit.test.js:94` reads only `index.ts` per function dir.
- **Impact:** Wave 4.3-B introduced `_handlers.ts` + `_helpers.ts` siblings. Future shared-secret code in a sibling would silently bypass anti-pattern #31's CI guard.
- **Fix:** glob `*.ts` per function dir.

### Bug 7 — `comms_messages.created_by_trigger` column missing

- **Where:** column not in schema (verified via `information_schema.columns`).
- **Impact:** Auto-drafts can't be traced back to their source trigger row. Diagnostic gap.
- **Fix:** migration adds `created_by_trigger uuid REFERENCES briefing_triggers(id) ON DELETE SET NULL` + `_handlers.ts` placeholderDraft writes `trigger.id`. Backfill MOOT (drafts wiped).

### Bug 8 — RSVP coverage threshold absent

- **Where:** `_handlers.ts:143` — handler drafts for every event in 24h window, no coverage check.
- **Impact:** On a Saturday with 3 events all at 90% RSVP, all 3 get unnecessary nudge drafts.
- **Fix:** add `rsvp_coverage_threshold` to `organization_settings.nudge_rules` (default 0.7); handler skips events at/above threshold; always nudge cold-start (responded=0).

### Bug 9 — `weekly_header` brand pass

- **Where:** `resolvers/weeklyDigest.js:141` → eyebrow constructed as `${context.org.name} · WEEKLY DIGEST`.
- **Impact:** Redundant "WEEKLY DIGEST" subhead — header section already conveys digest context via "WEEK AHEAD" headline.
- **Fix:** drop ` · WEEKLY DIGEST` suffix. Update 4 snapshot/test assertions.

---

## 7. Wave 4.3-H Locked Scope (9 items)

Per Frank's locked prompt template (~140 LOC + 2 migrations + tests).

| # | Item | File(s) | Migration? |
|---|---|---|---|
| 1 | pilot_only state plumbing | BriefingComposer.jsx | No (org-level fix, no schema change) |
| 2 | from_name per-kind resolver | send-tournament-message/index.ts | No |
| 3 | Tournament name priority | weeklyDigest.js + weeklyDigestSchedule.js | No |
| 4 | game_recap "vs opponent" | gameRecapHelpers.js + gameRecap.js | No |
| 5 | delivery_method harmonization | briefingCronHelpers.js + _helpers.ts | No |
| 6 | verify_jwt audit glob | verifyJwtConfigAudit.test.js | No |
| 7 | created_by_trigger column | _handlers.ts + briefingCronHelpers.js + _helpers.ts | **Yes** — add column |
| 8 | RSVP coverage threshold | _handlers.ts | **Yes** — extend nudge_rules default + UPDATE existing rows |
| 9 | weekly_header brand pass | resolvers/weeklyDigest.js + tests | No |

**Plus:** Mirror file commit for `20260511011751_wave_4_3_h_data_full_interaction_wipe.sql` (data wipe migration).

**Migration split-of-labor per anti-pattern #21 locked pattern:**
- Code-side (this branch) drafts SQL in PR description
- Chat-side runs pre-flight via `execute_sql`, applies via `apply_migration` after GO
- Code-side commits mirror file at `supabase/migrations/<canonical_version>_<name>.sql` in same PR

---

## 8. Open Questions Before 4.3-H Proceeds

**Q1 (item 2):** Where does the coach display name live? Three plausible sources:
- `staff_profiles.first_name`
- `user_profiles.first_name`
- `auth.users.raw_user_meta_data->>'first_name'`

Need one more grep + schema check to resolve. Recommend: `staff_profiles` (per CLAUDE.md §11 mention of `staff_profiles_pkey`); fallback to user_profiles if not.

**Q2 (item 2):** Does `organization_settings` have a `from_name` text column for the fallback path? Prompt mentions `org_settings.from_name` — need confirmation this exists or whether to add it.

**Q3 (item 8):** Confirm denominator for RSVP coverage:
- Option A: active `team_players` count at event time (status='active', eligibility-window aware)
- Option B: `rsvp_recipients` projection table (if it exists)
- Option C: distinct guardian_id heuristic

Recommend A (team_players) — cleanest semantic match for "expected RSVPs."

---

## 9. Wave 4.3-C Scope Notes (deferred from this audit)

**Theme:** inbox enrichment — admin sees fully-composed subject + body snippet per row without click-through.

**Concrete work:**
1. Extend `useInboxQueue.js:19` SELECT projection to include: `last_edited_by, content_sections, signoff_message, body_html, test_only, created_by_trigger`.
2. Wire `useResolverPreview` per-row (or batched) for resolver-driven subject + snippet enrichment.
3. Add auto-draft badge + filter (`last_edited_by IS NULL` discriminator).
4. RSVP coverage threshold heuristic (lives in handler, not UI — but admin needs visibility into "why isn't this event nudging?" via inbox).
5. `17 vs 22` trigger reconciliation: add explicit `skipped: "no_teams_of_type"` results in cron tick body so reconciliation is observable.

**Estimated scope:** 300-500 LOC + 1 minor migration (if RSVP threshold not done in 4.3-H). Bigger lift than 4.3-H.

**Performance concern:** 20-row inbox × N resolver calls × 5-10 supabase queries per resolver = 100-200 queries on open. Acceptable for LH single-org scale; needs batching/caching strategy before multi-org rollout. Recommend per-anchor cache layer in `useResolverPreview` keyed by `(kind, anchor_id, period?, pilot_only)`.

---

## 10. Wave 4.4+ Deferred Work

### Polymorphic Rename Completion

Production state confirms legacy field writes from the manual send path:
- `tournament_id` populated on 7 rows (legacy column)
- `headline` populated on 14 rows (legacy column)
- `body_html` non-empty on 22 rows (legacy column)
- Total 34 rows pre-wipe; 11 auto-drafts had body_html='' (clean); 23 manual rows had legacy field writes.

**Fix path:** stop writes to `body_html`/`headline`/`tournament_id` in send-tournament-message + queueComposedMessages + queueRecipients; drop columns one rollover cycle later. Or formally lock dual-write contract in CLAUDE.md.

### Daily Batching for Weekly Digest

`digestSend.js` per-family composition is clear. Caller orchestration (how daily recipients are collected into one send window per org) sits in a separate cron/job controller not yet implemented. Currently weekly_digest fires Sunday 8am ET; daily digest variants (per Frank's roadmap) need this layer.

### Phase 4 Polish

- Token-handler branded confirmation pages (rsvp/callup/unsubscribe currently return plain HTML)
- Engagement trending dashboard (per-team RSVP rate, open rate, click-through over time)
- Multi-kid "Going for all" convenience row (deferred from wave 4.2-A-8b-b)
- Cron observability (Sentry hook or pg_cron job_run_details audit)
- `app_secrets.value NOT NULL` trigger that throws on accidental NULL-ing of populated secrets
- Force-fire auth scoping (admin JWT vs CRON_SECRET — Phase 5 multi-tenant)

---

## 11. Architectural Drift / Open Questions Surfaced

Things found during this audit that aren't on the bug list but worth surfacing for downstream judgment:

### Pre-existing line-count violations

- `weeklyDigest.js` (resolver): 152 lines (2 over)
- `send-tournament-message/index.ts`: 185 lines (35 over)

Cosmetic, ungated. Worth splitting in a low-stakes cleanup wave.

### `events.tournament_name` denormalized field

Wider denormalized reads in non-composer code:
- `wizardForm.js:39`
- `AcademyCallupCompose.jsx:20`
- `TournamentPlaceholderEventsModal.jsx:78` (writes)
- `useTournamentBriefing.js:70,90` (queries by text equality!)

OUT OF SCOPE for 4.3-H (item 3 targets only composer drift). But the denormalized field is structurally fragile — text-equality queries break if `tournaments.name` is renamed without a sync. Recommend evaluation in wave 4.4 cleanup.

### `useTournamentBriefing.js:70` text-equality query

```js
query = query.eq('tournament_name', event.tournament_name);
```

Querying by a denormalized text column is brittle. If wave 4.4 drops `events.tournament_name`, this hook breaks. Worth flagging when polymorphic rename completion is scoped.

### Content sections invariance across slices

Wave-locked contract assumes per-slice composition produces identical `content_sections` keys across all slices for a given anchor. Enforced at `queueComposedMessages` level. No runtime drift detected, but no explicit invariant test either. Worth adding when 4.3-C lands.

### Pilot mode "effective" precedence

`state.pilot_only` vs `org_settings.pilot_mode_enabled` precedence is implicit. After item 1 fix, state.pilot_only is sourced from useOrgSettings. But mid-session toggle from another admin user is not synced cross-session. Acceptable for single-admin LH; needs realtime sync for multi-admin Phase 5.

### `audience_filter` edge cases

`academy_callup_notice` uses `audience_filter?.player_ids?.[0]` (registry.js:111) — first-element-only. Behavior when filter is null or multi-element is implicit. Recommend explicit handling + test coverage.

---

## 12. Recommended Next-Step Ordering

### Now (this branch — 4.3-H precursor PR)

1. **Resolve Q1, Q2, Q3** (one more grep for coach name source, schema check on org_settings.from_name, denominator confirmation).
2. **Implement in Step 2 order from prompt:** 2a created_by_trigger → 2b RSVP threshold → 2c delivery_method → 2d audit glob → 2e gameRecap clause → 2f from_name resolver → 2g tournament priority → 2h weekly_header brand → 2i pilot_only plumbing.
3. **Tests per item.** Target 465 → ~475 green.
4. **Mirror file commit** for data wipe migration.
5. **PR.** Title: "Wave 4.3-H: bug cleanup + branding + audit completeness (pre-launch quality)".

### Next session (wave 4.3-C)

1. Extend inbox SELECT projection (5 new fields).
2. Wire per-row resolver preview with batching/caching.
3. Auto-draft badge + filter.
4. 17 vs 22 trigger reconciliation as visible audit signal.

### Wave 4.4 (cleanup)

1. Polymorphic rename completion (stop dual-writes, drop legacy columns).
2. Denormalized `tournament_name` field evaluation.
3. Line-cap fixes for weeklyDigest.js + send-tournament-message/index.ts.

### Phase 4+ (parallel polish track)

Token-handler branded pages, engagement dashboard, cron observability, multi-kid UX, app_secrets NOT NULL trigger.

---

## 13. Severity Rollup

| Severity | Count | Bucket |
|---|---|---|
| P0 | 0 | — |
| P1 | 9 | wave 4.3-H |
| P2 | 5 | wave 4.3-C (inbox enrichment + threshold UI) |
| P3 | 4 | wave 4.4 (polymorphic rename + line caps + denormalized field) |
| Polish | 6 | Phase 4+ |

**No P0s outstanding.** Auto-draft engine is functionally clean. The work ahead is quality-tier + technical-debt + L99 polish.

---

## 14. Appendix — Things Verified This Session

- 14-table data wipe applied at 01:17 UTC (227 rows deleted)
- Migration history clean (duplicate `wave_4_3_h_data_wipe` row dropped from schema_migrations)
- 9 fresh auto-drafts refilled by cron post-wipe
- Cron health: 27 ticks 200 in last 15min
- All 7 edge functions verify_jwt:false-compliant per anti-pattern #31
- All shared secrets in app_secrets or GUC (Resend exempt per anti-pattern #33)
- Anti-pattern #30 mirror sync between briefingCronHelpers.js + _helpers.ts holding
- BriefingComposer.jsx HYDRATE_DRAFT confirmed missing pilot_only
- weeklyDigestSchedule.js:33 confirmed denormalized-first priority
- gameRecapHelpers.js:26 + gameRecap.js:99 confirmed `|| 'opponent'` fallback
- nudge_rules jsonb confirmed exists on organization_settings; missing rsvp_coverage_threshold
- comms_messages.created_by_trigger confirmed does NOT exist
- `events.tournament_name` denormalized reads found in 4 non-composer sites

---

**End of audit. Ready for Claude.ai consumption.**
