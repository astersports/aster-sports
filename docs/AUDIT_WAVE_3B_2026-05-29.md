# AUDIT — Wave 3.B (Anti-patterns / Data integrity / DR / Compliance / Onboarding / Doctrine) — 2026-05-29

**Contract:** PLATFORM_PRIORITIES.md §17.6 Wave 3.B set per §4.AN routing — categories #6 anti-pattern compliance sweep, #10 data integrity / canonical-source compliance, #25 disaster recovery / backup testing, #27 youth-sports compliance, #28 data migration / org onboarding playbook, #29 doctrine-vs-practice drift. Six parallel line-by-line audits per CLAUDE.md §17.8 standing rule (AP #50 retired). Each agent ran first-pass line-by-line + §16.15 2-pass deep-read addendum.

**Status:** findings only. Routing → fix PRs is the next workstream.

## ⚡ AUDIT CAMPAIGN CLOSE — 29 of 29 §17.5 CATEGORIES COMPLETE ⚡

Wave 3.B closes out the §17.5 audit campaign. All 29 categories have now received line-by-line + §16.15 2-pass deep-read addendum per §17.8 standing rule. **The audit-execution side of the §17.8 gate is structurally complete.** Per §17.7 step 5, multi-program build phase opens after all P0+P1 fix PRs land — fix routing remains.

| Wave | Categories | Status |
|---|---|---|
| Wave 1 | #7, #8, #9, #12, #26 | ✓ complete (PRs #557, #558, #559, #560, #561, #562, #563) |
| Wave 2.A | #11, #13, #14, #15, #23 | ✓ complete (PRs #565, #566, #567, #568) |
| Wave 2.B | #1, #2, #3 | ✓ complete (PRs #569, #570, #571, #573 partial Batch 1) |
| Wave 2.C | #4, #5, #16, #17, #24 | ✓ complete (PR #572 + AP #56/#59 retirement) |
| Wave 3.A | #18, #19, #20, #21, #22 | ✓ complete (PR #574) |
| **Wave 3.B** | **#6, #10, #25, #27, #28, #29** | **✓ complete (this PR)** |

---

## Headline

- **17 consolidated P0s** across 5 surfaces
- **~35 P1s** + ~25 P2s across all 6 categories
- **~12 promotion-ready AP candidates** surfaced cumulative across all waves
- §17.5 calibration: 6/6 categories surfaced real findings. **0 demotions across all 6 waves (29/29 categories retained).**

---

## Cross-cutting patterns (AP #58 synthesis — campaign-cumulative)

### CROSS-PATTERN 1 — PATTERN OMEGA continuation (dominant platform-wide pattern)

**Confirmed at 7+ surfaces, spanning 3 waves.** The single most pervasive architectural pattern in the codebase. Instrumentation/infrastructure exists; consumption doesn't:

| Source | Instance |
|---|---|
| Wave 2.C #24 | Speed Insights mounted → no queries (5s LCP regressed weeks); 5 audit-log tables write-only; Resend bounce webhook stored but no admin UI; cron health invisible |
| Wave 3.A #18 PATTERN ZETA | usePendingInvitations false all-clear (173/175 unlinked, table empty) |
| Wave 3.A #19 P0-1 | event_notifications triggers fire DB-side, no dispatcher reads |
| Wave 3.A #19 P0-3 | AutoNotificationSettings toggles cosmetic (no handler reads) |
| Wave 3.A #22 PATTERN HOTEL | cron.job_run_details masks 1.1% HTTP failures |
| **Wave 3.B #25** | Pro daily backups exist, **never restored to staging**; no DR runbook anywhere |
| **Wave 3.B #27 PATTERN ZETA continuation** | guardian_email_preferences RLS+table shipped, no UI; pii_audit_log + admin RPC shipped, no admin viewer |
| **Wave 3.B #10 P0-1** | RLS helpers exist (`current_user_*()`); 5 policies bypass them and read roster_members directly |

**PATTERN OMEGA is PROMOTION-READY** per Wave 3.B #29 (10+ instances total).

### CROSS-PATTERN 2 — PATTERN STALE-DOC (doctrine drift unchecked)

**Confirmed across multiple waves; comprehensive sweep in Wave 3.B #29.**

| Source | Instance |
|---|---|
| Wave 3.A #20 | §13 brand colors drift; "canonical 9 kinds" claim outdated (production has 12) |
| Wave 3.A #20 | BRIEFINGS_COVERAGE_L99.md May-10 stale (19 days) |
| Wave 3.A #18 | AP #51 catalog cites already-deleted InstallPrompt + WelcomeOverlay |
| Wave 3.A #19 | §16.5 Stream B drift (24h coverage vs T-4h+T-1h spec) |
| **Wave 3.B #10** | §5 stale table names (activities/rsvps vs events/event_rsvps) |
| **Wave 3.B #29** | §0 verification grep #4 FAILS today (3 new files >150) |
| **Wave 3.B #29** | §5 migration count stale by ~30 (141 vs 170) |
| **Wave 3.B #29** | §2 tech stack version drift (React 18→19, Vite→8, Tailwind→4) |
| **Wave 3.B #29** | 8 lingering AP #50 textual references post-PR #564 retirement |
| **Wave 3.B #29** | SKYFIRE_BUILD_QUEUE_v2.md filename missed PR #549 rename sweep |
| **Wave 3.B #29** | §8 "⬅ NEXT unbuilt" line stale (says QR codes; §4.0 ledger says 3-B shipped, 6-A shelved) |

**PATTERN STALE-DOC + PATTERN AP-RETIREMENT-RESIDUE both PROMOTION-READY.**

### CROSS-PATTERN 3 — Single-tenant assumptions baked across multiple surfaces

**Wave 3.B #28 named the 5 specific blockers for St. Patrick's onboarding.** Cumulative cross-confirmation:

| Source | Surface |
|---|---|
| Wave 1 #12 | 4 public RLS policies hardcoded Legacy UUID (closed in PR #559) + staff_profiles qual=true (closed in PR #558) |
| **Wave 3.B #28 P0-1** | `user_roles_user_id_key UNIQUE(user_id)` blocks multi-org users (mig 010 comment flags this exact need) |
| **Wave 3.B #28 P0-2** | No admin onboarding path (only invite-parent exists) |
| **Wave 3.B #28 P0-3** | Email FROM/reply-to hardcoded `@legacyhoopers.org` across 10 files — St. Patrick's parents would literally see "Legacy Hoopers" in every email |
| **Wave 3.B #28 P0-4** | `public_listing_enabled DEFAULT true` — wrong default for pilot orgs |
| **Wave 3.B #28 P0-5** | unsubscribe-handler hardcodes "Legacy Hoopers" UX copy |
| **Wave 3.B #28 PATTERN BETA** | DB columns exist but no admin UI (brand_colors, logo_url, public_listing_enabled, organization_settings) |
| **Wave 3.B #28 PATTERN GAMMA** | UNIQUE constraints assume single membership |

**Estimated onboarding cost today:** 10-15 hours per org. **After P0 closures:** ~1.5 hours.

### CROSS-PATTERN 4 — Compliance + governance gaps for youth-sports SaaS

**Wave 3.B #27 surfaces the compliance reality.**

| Source | Gap |
|---|---|
| #27 P0-1 | No data subject deletion path — iOS App Store §5.1.1(v) requires for PWA install; CCPA + GDPR-best-practice |
| #27 P0-2 | **No privacy policy or ToS published.** Cannot launch GA / second-tenant |
| #27 P0-3 | **No guardian consent ledger.** All imported guardians + manual creates land in DB with zero consent record |
| #27 P1 | `players.notes text` free-form PII sink (this corrects Wave 2.A #13's prior `medical_notes` mention — the actual risk surface is `notes`) |
| #27 P1 | `team_feed_token` permanent bearer exposes event titles containing kid names (compounds Wave 2.A #15 P0-2) |
| #27 P1 | `team_achievements.photo_url` arbitrary URLs with no consent check |
| #27 P1 | pii_audit_log admin-readable plain text (old + new email values) |
| #27 P1 | No SafeSport-equivalent staff cert surface |
| #25 P0 | Compliance attestation needs DR runbook (none exists) |

**All Legacy Hoopers players grades 2-5 = 100% under 13 = 100% COPPA-eligible** if any child-facing surface opens.

### CROSS-PATTERN 5 — Audit-disciplined surfaces are CLEAN; un-audited surfaces have systemic gaps

**Wave 3.A CROSS-PATTERN 3 confirmed at scale.** Where audit tests + APs land, code is clean. Where they don't, gaps accumulate.

| Discipline-active surfaces (CLEAN) | Discipline-absent surfaces (gaps) |
|---|---|
| #6 — 53 active APs swept; 22 reconfirmed; 0 P0; 4.8% false-positive cascade caught | #25 — 0 of 10 DR scenarios catalogued |
| #10 app code — 100% §11.5 compliant; 0 new callers since Wave 1 | #25 — backup never restored to staging |
| #21 — 13/13 edge functions byte-match; 6/6 secrets in app_secrets | #27 — no privacy policy, no consent ledger, no deletion path |
| #20 engine — 0 AP #27/#28/#29/#34/#36/#37/#38 violations | #28 — 5 P0 single-tenant assumptions baked across email senders |
| AP #1, #2, #11, #19, #36 etc. all reconfirmed via grep | #29 — §0 verification grep #4 fails; 4 P0 doctrine drift |

---

## Wave 3.B P0 consolidated (17)

Ordered by fix-PR arc clustering.

### Second-tenant blockers (5 P0s — bundle into multi-PR onboarding-readiness arc)

1. **#28 P0-1** — `user_roles_user_id_key UNIQUE(user_id)` blocks multi-org users. Schema migration: drop + add `UNIQUE(user_id, organization_id)`.
2. **#28 P0-2** — Admin onboarding has no documented path. Generalize `invite-parent` or build `invite-admin`.
3. **#28 P0-3** — Email FROM/reply-to hardcoded across 10 files. Add `organizations.sender_email` + `contact_email` + `reply_to_email` + `website_url` + `public_logo_url` columns; `loadOrgEmailContext(orgId)` helper; sweep callers.
4. **#28 P0-4** — `public_listing_enabled DEFAULT true` wrong for pilot orgs. Flip default to false; admin opts in after content review.
5. **#28 P0-5** — `unsubscribe-handler` hardcodes "Legacy Hoopers" branding. Wire per-org via `loadOrgEmailContext`.

### Compliance (3 P0s — bundle into compliance-readiness arc)

6. **#27 P0-1** — No data subject deletion path. Add account-deletion + child-removal-request to `/account`.
7. **#27 P0-2** — No privacy policy or ToS published + signup-time acceptance + per-org acknowledgment row.
8. **#27 P0-3** — No guardian consent ledger. Add `guardian_consents` table + LeagueApps-backfill re-affirmation flow.

### DR / observability (3 P0s — bundle into DR-readiness arc)

9. **#25 P0-1** — No DR runbook. Create `docs/DISASTER_RECOVERY.md` covering 10 scenarios with documented RTO/RPO + rotation SQL + project ID + Vercel rollback steps.
10. **#25 P0-2** — Backups never restored to staging. One-time restore-to-new-Supabase-project drill; document RTO observed.
11. **#25 P0-3** — `supabase db reset` doesn't reproduce production. Materialize the 5 §5 documented ghosts as `.sql` files with canonical version strings.

### Data integrity (2 P0s — bundle with multi-tenant arc or ship standalone)

12. **#10 P0-1** — 5 live RLS policies reference `roster_members` directly (predate §11.5 doctrine lock). Refactor through `current_user_*()` SECDEF helpers.
13. **#10 P0-2** — Alignment trigger unidirectional (`team_players` only). Add reciprocal `roster_members` trigger OR refactor `useSeasonRollover` to write through team_players.

### Doctrine reconciliation (4 P0s — bundle into one doctrine PR + ledger)

14. **#29 P0-1** — §0 verification grep #4 FAILS today. 3 new files >150: kindMetadata.js 169, AuthContext.jsx 166, BriefingComposer.jsx 164. Split or document exceptions.
15. **#29 P0-2** — §5 migration count stale by ~30. AP #45 reconciliation owed.
16. **#29 P0-3** — §2 tech stack version drift. React 18→19, Vite→8, Tailwind→4. Doctrine prompts could conflict.
17. **#29 P0-4** — AP #51 catalog cites 4 of 11 surfaces that no longer exist. Confusing future Frank/CC.

---

## Wave 3.B P1 surface (35 total — summary)

**#6 (3 P1 clusters):** 6 hardcoded hex sites in 4 components; 5 non-test files at/over 150-line cap; 5 pre-doctrine-lock migrations missing explicit anon REVOKE (15 SECDEF functions)

**#10 (3 P1):** jersey_number type drift (text vs integer); `roster_members.payment_status` ready for drop; CLAUDE.md §5 table names stale

**#25 (6 P1):** Sentry source-map upload absent; project_id hardcoded in config.toml; LeagueApps source JSON not archived; no centralized SECRET_ROTATION.md; no rotation cadence; no Vercel deploy ID log

**#27 (8 P1):** `players.notes` PII sink; PostHog GeoIP ticket pending; `guardian_email_preferences` no UI; team_feed_token bearer URL exposes kid names; team_achievements.photo_url no consent gate; pii_audit_log admin-readable; no SafeSport cert surface; raw_user_meta_data exposure via get_org_user_profiles

**#28 (6 P1):** VAPID contact email hardcoded; no brand_colors admin UI; no bulk parent invite; no roster bulk import; stale PublicSchedulePage comment; cron dispatcher iteration scope unverified

**#29 (9 P1):** §8 ⬅ NEXT line stale; §13 brand color drift (recurring); §13 "canonical 9 kinds"; §16.5 Stream B; §16.10 bundle budget; §6 AdminHomePage; BRIEFINGS_COVERAGE_L99 refresh; SKYFIRE→EMBER filename rename; 8 lingering AP #50 references

---

## §17.5 calibration outcome (CAMPAIGN CUMULATIVE)

All 29 categories surfaced real findings. **0 demotions across 6 waves.** §17.5 hypotheses fully validated.

### Wave 3.B per-category split

| Category | P0 | P1 | P2 | Notes |
|---|---|---|---|---|
| #6 AP compliance | 0 | 3 | 3 | **Catalog healthy; 4.8% false-positive cascade caught by §16.15 addendum** |
| #10 Data integrity | 2 | 3 | 2 | App code 100% clean; RLS + trigger gaps surface |
| #25 DR/backup | 3 | 6 | 3 | No runbook; never tested |
| #27 Youth-sports compliance | 3 | 8 | 4 | No privacy policy + no consent + no deletion |
| #28 Onboarding playbook | 5 | 6 | 3 | All 5 second-tenant blockers named |
| #29 Doctrine drift | 4 | 9 | 10 | §0 verification grep fails today; 8 AP retirement-residue |

---

## Cumulative new AP candidates across all waves (~15+ promotion-ready)

Per Wave 3.B #29 promotion-readiness analysis:

**PROMOTION-READY (3+ instances confirmed):**
- **PATTERN OMEGA** — instrumentation without consumption (7+ instances)
- **PATTERN STALE-DOC** — doctrine drift unchecked (10+ instances cumulative)
- **PATTERN DELTA** — admin-toggle without enforcement (3 instances)
- **PATTERN COLD-SURFACE** — production infrastructure with 0 real exercise (4 instances)
- **PATTERN STALE-INITIAL** — `useState(true)+useState([])` (23 hooks)
- **PATTERN EPSILON** — Realtime channel hygiene gap (7 hooks)
- **PATTERN PSI** — console.error boilerplate at scale (108 sites)
- **isStaff → admin-path drift** (7 instances per #17)
- **AP candidate #65** — raw `error.message` in user UI (4 instances)
- **PATTERN AP-RETIREMENT-RESIDUE** (new) — retirement PRs must include exhaustive grep + cleanup

**HOLD (insufficient instances):**
- PATTERN HOTEL, PATTERN ZETA, PATTERN HOOK-FANOUT, AP candidate #63, #64, PATTERN BUDGET-DRIFT, "free-form text PII sink", "bearer-token URL with minor data", "bidirectional-invariant requires bidirectional trigger", PATTERN SIGMA (scattered SQL recipes)

---

## Per-agent findings (preserved for fix-PR routing)

### #6 Anti-pattern compliance sweep

- 53 active APs swept; 22 reconfirmed via prior wave audits
- 0 P0 / 3 P1 clusters / 3 P2 clusters
- §16.15 cascade caught 3 false positives (AP #38 slice-kinds, AP #3 React mount, AP #48 explanatory comments)
- **Catalog is in healthy compliance.**

### #10 Data integrity / canonical-source compliance

- App code 100% §11.5 compliant; 0 new callers since Wave 1
- 5 live RLS policies bypass `current_user_*()` helpers (P0-1)
- Alignment trigger unidirectional (P0-2)
- §5 doctrine has stale pre-rename table names

### #25 DR / backup testing

- Supabase Pro tier (daily backups + PITR available)
- 0 DR runbooks in docs/
- Backups never restored; 178 DB-registered vs 170 repo migrations (8-file gap)
- Vercel rollback path undocumented in repo
- 8 secrets in app_secrets all rotated; no rotation cadence
- PATTERN SIGMA: doctrinal SQL recipes scattered across feature docs

### #27 Youth-sports compliance

- Compliance frameworks: COPPA UNCAPTURED; SafeSport NO PLATFORM TOOLING; data retention UNDOCUMENTED; photo/video consent PRE-BUILD
- No privacy policy + no ToS published anywhere
- 3 P0 / 8 P1 / 4 P2
- All Legacy Hoopers players grades 2-5 = 100% under 13 = COPPA-eligible

### #28 Org onboarding playbook

- 17 onboarding steps cataloged
- 6 work / 11 manual or missing
- 5 specific second-tenant blockers named
- Current onboarding cost: 10-15 hours; target after P0 closures: ~1.5 hours
- LEGACY_HOOPERS_ORG_ID constant verified clean post-PR #560

### #29 Doctrine drift

- 24 CLAUDE.md sections audited
- 18 ledger entries reconciled
- 7 planning docs spot-checked
- 23 drift findings (4 P0 / 9 P1 / 10 P2)
- 8 AP candidate promotions identified
- §17.5 categories per §4.AR confirmed 24/29 BEFORE this wave; now 29/29

---

## Routing — fix-PR arcs queued (cumulative across all waves)

Wave 3.B adds 4 fix-PR arcs to the cumulative routing backlog:

**From Wave 3.B (4 new arcs):**

1. **Multi-tenant readiness arc** (closes #28 5 P0s + #10 P0-1 + #10 P0-2) — multi-PR sequence: schema reshape + admin invite path + per-org email plumbing + brand admin UI + RLS helper migration
2. **Compliance arc** (closes #27 3 P0s) — privacy policy + ToS + guardian_consents table + LeagueApps backfill + account deletion flow
3. **DR-readiness arc** (closes #25 3 P0s) — runbook + restore test + materialize 5 ghosts
4. **Doctrine reconciliation arc** (closes #29 4 P0s + cumulative STALE-DOC) — §0 grep fix + §5 count + §2 tech stack + AP #51 catalog refresh + AP #50 lingering references + §8 NEXT line + SKYFIRE→EMBER filename + BRIEFINGS_COVERAGE_L99 refresh

**Cumulative from prior waves:** 5 cross-pattern arcs from Wave 2.C + 7 from Wave 3.A + Wave 2.B Batch 2/3/4 + Wave 2.A deferred P0s.

---

## AP compliance

- **AP #45** — §4.AS ledger entry in same commit as `docs/AUDIT_*.md` ✓
- **AP #50** — RETIRED in PR #564; line-by-line methodology held throughout dispatch ✓
- **AP #56 + #59** — RETIRED in PR #572 ✓
- **AP #58** — cross-batch pattern check applied; 5 CROSS-PATTERNs ✓
- **AP #61** — pre-phase audit gate; **this is the 3rd instance** (Wave 1 + Wave 2.A + Wave 3.B) — promotion-ready per Wave 3.B #6 + #29
- **§17.8** — every agent reported §16.15 2-pass cascade-catch findings; campaign cascade rates averaged ~30-40% (Wave 3.B #6 surprised lower at 4.8%) ✓

---

**§17.5 audit campaign complete: 29 of 29 categories audited line-by-line with §16.15 2-pass deep-read addendum.** Per §17.7 step 5, multi-program build phase opens after all P0+P1 fix PRs land. Fix routing remains the next workstream.

**Next session opens with:** routing decisions on the 4 new Wave 3.B fix-PR arcs + cumulative backlog from Waves 2/3.A + Frank's call on which arc to dispatch first.
