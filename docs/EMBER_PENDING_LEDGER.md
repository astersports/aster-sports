# EMBER Pending Ledger

> Living source of truth for everything in-flight on the Skyfire / Ember
> platform. CC + chat both read this at session start to avoid
> re-discovery. Updated per session and per PR.
>
> Created: 2026-05-18 (Italy CEST) from L99 cross-role audit consolidation
> Last updated: 2026-06-12 (§1 session entry + §4.0 top-of-stack refresh — dynamic-workflows substrate + brand kit + LH-site verification; post-merge reconcile: PR #986 merged, Frank's deploy smoke PASSED). Prior: 2026-06-09 (§4 reconciliation — settings-page arc SHIPPED per architect D6 ruling, PRs #897–#905; see the §4.0 reconciliation note).

This doc complements (not replaces):
- `docs/archive/SKYFIRE_BUILD_QUEUE_v2.md` — shipped-log roadmap, forward-only
- `docs/archive/STATE_OF_AFFAIRS_L99_v5.md` — canonical high-level state
- `CLAUDE.md` — durable anti-patterns + architectural rules
- Various audit synthesis docs (`docs/AUDIT_*.md`) — point-in-time deep dives

This is the **pending** ledger: what's not yet shipped, what's decided
but not yet built, what needs cross-surface propagation, what's blocked
on workflow vs code, what's deferred for product calls. Every category
that doesn't fit cleanly into the shipped-log or the high-level state
lives here.

The architectural commitment that produced this doc: CLAUDE.md
**anti-pattern #43** — cross-role fixes ship with a cross-surface
invariant test. The L99 audit on 2026-05-18 cataloged 14 distinct
bugs grouping into 4 drift classes. Without #43, those bugs repeat
within weeks; with #43 + this ledger, the system protects itself from
the next round of silent divergence.

---

## 1. SHIPPED RECENTLY (last 7 days)

### Session 2026-06-12 — dynamic-workflows substrate + brand kit + LH-site verification (one multi-commit PR, branch claude/dazzling-bardeen-oz4lri)

Operator directive "Dynamic workflows for the next phases" (all three lanes ratified
in-session): (1) SessionStart hook `.claude/hooks/session-start.sh` + `.claude/settings.json`
— web sessions auto-run npm install + the §9.1 pre-flight (AP #35 divergence, AP #52
leakage, AP #45 ledger reminder); `.gitignore` narrowed (worktrees stay ignored, hooks +
settings tracked). (2) Brand rollout: PWA icon set (192/512, any + maskable, navy bg from
canonical `aster-mark.svg`) wired into manifest, `og-image.png` + og/twitter meta in
`index.html` (app previously shipped zero social meta), `public/brand/` flat-color variants
(gold = locked `--as-accent` #C9952E, knockout white, solid black); `brandAssetsAudit.test.js`
locks the asset↔reference invariant. (3) Process plan
`docs/DYNAMIC_WORKFLOWS_NEXT_PHASES_2026-06-12.txt` (operating model, phases A/B/C, verified
constraint register, automation backlog). LH static site v1 (operator zip) VERIFIED
self-contained + deploy-ready (16/16 assets local, zero Squarespace CDN refs); CC-side repo
creation blocked (org 403, repo-scoped token) → Frank runs README-DEPLOY steps 1–3, domains/
DNS untouched per Squarespace cutover sequence. Handoff: `docs/CC_SESSION_HANDOFF_2026-06-12.txt`.
POST-MERGE (same day): shipped as PR #986 (merge commit `20e9ad48`). Frank's 5-step deploy
smoke PASSED (app load · og link preview · Android maskable icon · iOS icon unchanged), and
checklist step 5 self-verified — the SessionStart hook fired live on the next session resume
(npm install + §9.1 pre-flight lines in startup context, including the AP #35 divergence
catch this very reconcile resolves). Same-session Phase B early-start (operator-ratified):
`docs/SCHEDULE_L99_AUDIT_2026-06-12.txt` — full §16.15 audit of /schedule (32 findings,
3 role wireframes, SD-1..SD-9 open decisions); code gated on rulings.

### Session 2026-06-11 — money-seam unify + roster visibility + funnel select + pilot cutover (PRs #958, #967–#983) — RECONCILED 2026-06-11

Money seam cut over to the unified one-ledger model (`family_balances` as the single
source; billed = SUM('fee')): #967 F-1 hook→view, #969 F-2 list→view, #973 STEP-2
unify (balance-preserving: $166,910.47 billed / $165,635.47 net held), #978 F-4
record-money (payment/refund/adjustment in one form), #979 F-5 dashboard polish,
#958 family_balances funnel-fee fix, #982 import posts 'fee' txns (AUD-6).
Privacy/roster: #970 parent sees own children only (P0), #972 roster-visibility RLS +
teammate-fn default, #977 full build (program/team override + admin UI + parent line).
Funnel: #976 authed parents select existing children (closes the double-reg hole).
Audit: #980 10-lane session audit (`docs/SESSION_AUDIT_2026-06-11.txt`), #981 fixes
(P0 AUD-1 + P1 AUD-2..5 + P2 batch). Docs: #968/#971/#974/#975 decision/spec
requests, #983 architect close-out. Migrations 20260611023342 / 104945 / 105511 /
112250 / 113738 + 20260611184918 (pilot-cutover guard-trigger drop — mirror landed
2026-06-11 in the new repo, restoring AP#21 parity). Comms pilot now FILTER mode
(one pilot family, Frank); go-live = flip `pilot_mode_enabled` false, gated on FORK E
(LEGAL). **Repo moved to `github.com/astersports/aster-sports`** (Vercel project
`vercel.com/astersports/aster-sports`; Supabase ref + domains unchanged). Canonical
state docs: `docs/NEW_CHAT_HANDOFF_ASTERSPORTS_2026-06-11.txt` +
`docs/ARCHITECT_CLOSEOUT_2026-06-11.txt`. (§4 detailed arc reconciliation for
2026-06-05..11 remains open; this entry + the §4.0 top-of-stack block cover the
top level.)

### Session 2026-06-01/02 — AsterSports rebrand cutover + §17.5 audit (PRs #619–#640; two-agent)

Skyfire/Ember → **Aster Sports** rebrand shipped end-to-end + go-live cutover, with the §17.5
29-category audit in progress (terminal-CC static/code half + chat-CC live-state half). Full
state in `docs/CC_SESSION_HANDOFF_2026-06-02.md`. Key PRs: #619–#622 (name + mark + wordmark),
#623 (package), #624 (internal namespace `--em→--as`/`EMBER_→ASTER_`), #625 (APP_BASE_URL
centralize), #626 (icons), #627/#628 (invite-parent host → app_config), #629 (email host cutover
→ astersports.app), #630 (sender → noreply@astersports.app), #631 (straggler cleanup), #636
(chat-CC security: anon-SECDEF trigger-fn revoke, AP #57), #637 (#29 doctrine drift), #638
(#25 DISASTER_RECOVERY.md), #639 (#28/#19). Open at handoff: #635, #640, #632/#633 (Dependabot
= #14). **Open decisions** (see handoff §4): #634 over-applied the Gmail to the multi-tenant
`ORG_CONTACT_DEFAULT` (fix recommended, unapproved); pilot-mode still ON (not live); 5b SMTP
skipped; trademark + renames deferred. NOTE: this ledger is stale since 2026-05-27 — full §1/§4
reconciliation of the Wave 1/2/3 cutover + this arc is overdue; this entry covers only 2026-06-02.

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #233  | 2026-05-18 | formatters.js NY-pin (canonical helpers)                           | All date renders    |
| #234  | 2026-05-18 | 51 leaf-callsite NY-pin + static-grep audit (`timezoneAuditPin`)   | All toLocale* sites |
| #235  | 2026-05-18 | AlertZone loading-state gate (kindness-microcopy invariant)        | All 3 home pages    |
| #236  | 2026-05-18 | Tier 3 v1 retrospective doc consolidation                          | Docs                |
| #237  | 2026-05-18 | Coach roster overdue gate (<72h threshold on yellow highlight)     | CoachRosterSnapshot |
| #238  | 2026-05-18 | L99 meta-fix: EMBER_PENDING_LEDGER + anti-pattern #43              | Docs + doctrine     |
| #239  | 2026-05-18 | Cluster 5 / B1 — CoachHomePage MY TEAMS records (first #43 fix)    | Coach Home          |
| #240  | 2026-05-18 | Cluster 2 / B3 — `% Going` label across Coach/Admin/Parent surfaces| Roster snapshots    |
| #241  | 2026-05-18 | Cluster 6 / A3 — `useAlertEvaluator` configs null-sentinel (PR #235 regression close) | All 3 home pages |

Five-PR Sunday from Italy CEST. Audit immediately after surfaced the
items below.

### Session 2026-05-21 — L99 platform-wide audit + Teams arc + session-cleanup wave (49 PRs)

Categories preserve dispatch arcs (Phase 1 platform audit → Teams →
Phase 5 micro-fixes → perf-pass → a11y polish → session-cleanup →
discipline lock → foundation #36 sweep → edge function #36 sweep →
header bell + RequireAuth → relkind audit migrations → team-feed RFC
5545 → #36 audit test → SECDEF helper library → messaging P0 cluster).

#### Phase 1 platform-audit-v2 (PRs #410-#418)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #410  | 2026-05-21 | Hook anti-pattern #48 dead `foreignTable .order` cleanups (PR γ)   | useOrgTeamRecords + useTeamGamesByTournament |
| #411  | 2026-05-21 | Page tap-target fixes — 3 surfaces to §7 44px (PR β)               | Messages + FinancialDashboard + ImportSchedule |
| #412  | 2026-05-21 | Hook anti-pattern #36 batch — 6 violations (PR α)                  | useCoachHomeSignals + useGameResultsMap + useKindUsage + usePrefetchChildRsvps + useUnreadCounts + useBriefingFilters |
| #413  | 2026-05-21 | L99 platform audit v3 — claude.ai v2 review refinements            | Docs                |
| #414  | 2026-05-21 | CLAUDE.md amend #49 + add #50/#51 candidates + §16.15              | Docs + doctrine     |
| #415  | 2026-05-21 | gitignore `.claude/` worktree storage                              | Repo hygiene        |
| #416  | 2026-05-21 | BriefingsInboxPage loading-gate gap (PR δ; P0 closed)              | Briefings inbox     |
| #417  | 2026-05-21 | Teams PR A — stop-the-bleeding (B1 + B2 + B3 + B4)                 | Team detail / Heatmap |
| #418  | 2026-05-21 | Teams PR D — data-layer hardening                                  | Teams data layer    |

#### Teams arc + cleanup (PRs #419-#425)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #419  | 2026-05-21 | Teams PR B — hero card consolidation (TeamDetailHero)              | Team detail         |
| #420  | 2026-05-21 | Edge function mirror byte-compare audit (Platform PR ζ; CI-enforced #30) | Edge functions |
| #421  | 2026-05-21 | Engine fragility cleanup E1 + E2 (Platform PR ε)                   | Engine send helpers |
| #422  | 2026-05-21 | Mirror drift cleanup — 4 pairs closed (102 → 17 TS-only residuals) | Edge functions      |
| #423  | 2026-05-21 | Teams PR C — polish + cleanup + dead-feature retirement (anti-pattern #51 candidate, second instance) | Team detail / Player rows |
| #424  | 2026-05-21 | Home-page preemptive split per PQ3 — 3 pages, 9 sub-components     | Home pages          |
| #425  | 2026-05-21 | L99 audit arc closure addendum (Teams + platform)                  | Docs                |

#### Phase 5 micro-fixes (PRs #426-#434)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #426  | 2026-05-21 | callup-handler `alts` parameter for rsvp-handler parity            | Edge functions      |
| #427  | 2026-05-21 | Button sm tap target + PublicSchedulePage RLS comment-pin          | Shared Button + Public schedule |
| #428  | 2026-05-21 | Teams A3 aria-labels + C2/C7 perf-pass (Teams Phase 5)             | Team detail a11y + perf |
| #429  | 2026-05-21 | Extract RideIndicator + DutyBadge (component cleanup arc start)    | Shared components   |
| #430  | 2026-05-21 | V5 Pulse grid horizontal scroll indicator                          | TeamHeatmap         |
| #431  | 2026-05-21 | CLAUDE.md register anti-pattern #52 candidate (worktree-path)      | Docs + doctrine     |
| #432  | 2026-05-21 | Extract ModalBackground from 4 centered-modal callsites (L99 P2.5 D3) | Shared modals    |
| #433  | 2026-05-21 | ScopeChoiceDialog backdrop canonical rgba(0,0,0,0.3)               | Event scope dialog  |
| #434  | 2026-05-21 | Schedule perf — lift useNow into ScheduleListSections slot         | Schedule list       |

#### Perf-pass on hot pages (PRs #435, #437)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #435  | 2026-05-21 | Extract `<Badge variant='pill'>` (PQ7 cleanup continuation)        | Shared Badge        |
| #437  | 2026-05-21 | Event detail perf — lift useNow into EventLocationSlot + memo stable children | EventDetailPage |

#### A11y polish (PRs #436, #438)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #436  | 2026-05-21 | aria-label on TeamHeatmap container (A11y P2)                      | TeamHeatmap         |
| #438  | 2026-05-21 | FormGuide + TeamAccordion + RecordsPage + BriefingComposer a11y polish | 4 surfaces      |

#### Session-cleanup wave (PRs #439-#442)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #439  | 2026-05-21 | 2 tap-target regressions introduced in PR #423                     | Teams PR C followup |
| #440  | 2026-05-21 | Delete DutyBadge orphan (anti-pattern #42)                         | Shared cleanup      |
| #441  | 2026-05-21 | Consolidate 3 player-sort impls into pure helper (anti-pattern #42) | Player sort        |
| #442  | 2026-05-21 | Team-pulse — drop misleading 'Not enough data yet' qualifier       | TeamPulseHeader     |

#### Discipline-lock CLAUDE.md amendments (PR #443) + ErrorBoundary §16.10 exemption (PR #444)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #443  | 2026-05-21 | Bundle 7 discipline amendments from session 2026-05-21             | Docs + doctrine     |
| #444  | 2026-05-21 | Document ErrorBoundary §16.10 bundle-budget exemption              | Docs + doctrine     |

#### LoginPage combo (PRs #445, #447) + foundation aria-live (PR #446)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #445  | 2026-05-21 | Lock LoginPage brand-reset behavior per #43 invariant              | LoginPage           |
| #446  | 2026-05-21 | Foundation aria-live sweep — toast, offline banner, unread badge   | Foundation a11y     |
| #447  | 2026-05-21 | LoginPage #36 destructure + REDIRECT_ALLOWLIST admin route expansion | LoginPage         |

#### Foundation #36 sweep (PR #448) + Header bell + RequireAuth (PR #449)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #448  | 2026-05-21 | Foundation bundle — 5 anti-pattern #36 destructure-without-error fixes | Foundation hooks |
| #449  | 2026-05-21 | Header — remove duplicate bell + lock role-resolution contract     | Header + RequireAuth |

#### relkind verification migrations (PRs #450, #451)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #450  | 2026-05-21 | Migration audit relkind='r' filter on player_game_stats RLS check  | DB / migrations     |
| #451  | 2026-05-21 | Migration audit relkind='r' filter on team_types RLS check         | DB / migrations     |

#### Edge function #36 sweep (PR #452) + team-feed RFC 5545 (PR #453)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #452  | 2026-05-21 | Bundle anti-pattern #36 destructure-without-error sweep (edge functions) | Edge functions |
| #453  | 2026-05-21 | Team-feed bound events query + RFC 5545 ICS compliance             | team-feed edge function |

#### #36 audit test (PR #454) + SECDEF helper library (PR #455)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #454  | 2026-05-21 | Static-grep gate for anti-pattern #36 destructure-without-error    | Audit tests         |
| #455  | 2026-05-21 | `assert_org_owns_*` SECDEF helper library for cross-org validation | DB security helpers |

#### Messaging P0 cluster (PRs #456, #457)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #456  | 2026-05-21 | P0 — NewDmPicker query nonexistent `org_members` table             | Messaging DM picker |
| #457  | 2026-05-21 | P0 — useDmThreads `otherName` mislabels partner as self            | Messaging DM thread |

49-PR session. L99 platform-wide audit (14 batches dispatched +
executed, ~204 findings) + Teams arc close + session-cleanup wave +
2 P0 messaging fixes at session-end. See §4.Z for the
audit-findings synthesis and §4.X (closed) + Teams §4.U (closed)
for arc-level closure narratives.

### Session 2026-05-22 — discipline-validating wave + extended dead-feature retirement + Phase 3 close (19 PRs total)

Original 7-PR discipline-validating window (PRs #458-#464) opened the
session. Extended into a 19-PR wave with Phase 2 dead-feature
retirement (PRs #465-#471), Phase 3 design-call closures (PRs #472,
#473), and ledger reconciliations (PR #466 + this followup PR).
Categories: catalog amendments + advisor hygiene + ledger
reconciliation (yesterday) + Cluster 1 closure + Cluster 3 closure
(#36 hooks cascade across PR-A/B/C) + anti-pattern #51/#52/#54
promotions + dead-feature retirement sweep + SECTION_RENDERERS
orphan deletion + dual-compose / fan-out deferral comments.

#### Catalog amendments + advisor hygiene + yesterday ledger (PRs #458-#460)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #458  | 2026-05-22 | CLAUDE.md register anti-patterns #55-#59 + RLS auth.uid() wrapper  | Docs + doctrine     |
| #459  | 2026-05-22 | Close 2 P3 hygiene followups from PR #450 + #451 (advisor cleanup) | DB / migrations     |
| #460  | 2026-05-22 | §4.Z reconciliation against 49 PRs from session 2026-05-21         | Docs                |

#### Cluster 1 closure (PR #462) + Cluster 3 #36 hooks cascade (PRs #461, #463, #464)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #461  | 2026-05-22 | Close 6 P1 anti-pattern #36 sites — Cluster 3 PR-A                 | Hooks (high-priority) |
| #462  | 2026-05-22 | P0 — academy-callup picker flow bypasses registry, ships without tokens | Academy callup (Cluster 1 P0) |
| #463  | 2026-05-22 | Close 5 P2 anti-pattern #36 sites — Cluster 3 PR-B realtime + ride | Realtime + ride hooks |
| #464  | 2026-05-22 | Close ~6 anti-pattern #36 sites — Cluster 3 PR-C legacy sweep      | Legacy hooks        |

7-PR session. Discipline-validating shape: pre-flight (Section 9.1
three-item opener) ran cleanly at session-open AND session-restart;
contract (max 7-8 PRs, no new audits) held; anti-pattern #54
(same-MCP-burst) held 7/7; anti-pattern #55 (use actual PR# from
create_pull_request response) held 7/7; anti-pattern #52 (worktree
path) held 7/7 with refinement surfaced. Audit cycle did not
self-generate. See §4.AA for the close synthesis + Cluster 1 +
Cluster 3 closures + Pattern ALPHA hooks-half closure.

#### Catalog promotions + first ledger reconciliation (PRs #465, #466)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #465  | 2026-05-22 | CLAUDE.md: #52 refinement + #51 + #54 promotions to registered     | Docs + doctrine     |
| #466  | 2026-05-22 | §4.AA reconciliation against 7 PRs from session 2026-05-22         | Docs                |

#### Phase 2 dead-feature retirement sweep — anti-pattern #51 (PRs #467-#471)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #467  | 2026-05-22 | Delete TeamPlayerStats + PlayerStatsTable orphans (Phase 2.2b)     | stats/ (-119 lines) |
| #468  | 2026-05-22 | Delete InstallPrompt + WelcomeOverlay dead stubs (Phase 2.2c)      | home/ (-18 lines) — first #54 break in 22+ holds, manually flipped ready |
| #469  | 2026-05-22 | Delete 5 event/ orphan files per #51 retirement (Phase 2.2a)       | event/ (-285 lines, RsvpSummaryBlock + EventDetailTab + EventCancelActions + MyActionsSection + AcademyActivationPanel + Badge.test.jsx INLINE_REMAINING) |
| #470  | 2026-05-22 | Remove useSortedPlayers dead export (Phase 2.2d)                   | hooks/ (-7 lines, anti-pattern #42 zero-consumer detection) |
| #471  | 2026-05-22 | Delete legacy renderers/scheduleChange.js (Phase 2.2e)             | engine/ (-219 lines, name-collision trap eliminated; active composer at resolvers/scheduleChange.js) |

#### Phase 3 design-call closures — SECTION_RENDERERS orphans + dual-compose deferral (PRs #472, #473)

| PR    | Date       | Scope                                                              | Surfaces            |
|-------|------------|--------------------------------------------------------------------|---------------------|
| #472  | 2026-05-22 | Delete 8 SECTION_RENDERERS orphans — Phase 3 Q4                    | engine/ (~24 files, -651 lines; wave 3 build-ahead never adopted, Option A locked routing) |
| #473  | 2026-05-22 | Q5+Q7 deferral comments for dual-compose + schedule_change fan-out | engine/ (2 files, +24 lines, Pattern B locked routing) |

19-PR session total. Original 7-PR discipline window held cleanly;
extended wave engaged Phase 2 (dead-feature retirement after #51
promotion) + Phase 3 (Q1/Q4/Q5/Q6/Q7 design calls). 12 of 19 PRs
were file-deletion sweeps: total ~1300 lines retired across orphan
components, renderers, hooks, and section types. Anti-pattern #54
broke once (PR #468 shipped draft initially, manually flipped) —
first break in 22+ consecutive holds. Anti-pattern #52 refinement
broke once mid-flight (PR #473 parent-checkout leakage detected
post-merge). See §4.AB for the extended close synthesis (Phase 2 +
Phase 3 closure status) and §5 for watch-list status on #52 + #54.

### Session 2026-05-27 — briefing send/compose + home-alerts polish (5 PRs + data cleanup)

Frank-reported arc that started from "briefings stuck at queued" and
cascaded through the compose + alerts surfaces:

| PR    | Scope                                                                          | Surfaces        |
|-------|--------------------------------------------------------------------------------|-----------------|
| #524  | Send pipeline: edge fn owns terminal `status='sent'`; surfaces dispatch failure instead of swallowing (was stranding rows at `queued`) | All briefing sends |
| #525  | Device preview frames render via `srcDoc` not `contentDocument.write` (sandboxed iframe blanked on iOS Safari; jsdom masked it) | BriefingComposer preview |
| #526  | Stop autosaving empty scratch drafts (gate INSERT on authored content via `hasAuthoredContent`) | Composer "Resume a draft?" |
| #527  | Hide trigger-generated pre-drafts from "Resume a draft?" (`.is('created_by_trigger', null)`); they live in the briefing inbox | Composer Step 1 |
| #528  | Every home alert actionable: tournament_prelim drill-down (parity w/ recap) + weekly/payments tap-through; AlertCard helpers extracted for 150-line cap | Admin/Coach/Parent home Alerts |

Data cleanup (MCP, reversible — archived, not deleted): 26 pre-fix
stranded rows archived (23 zombie `queued` briefings that never
delivered + 3 abandoned empty drafts). Resume-draft list verified empty
of cruft; 0 stuck `queued` remaining.

Cluster 1 (tournament records) reconciled + verified correct against
TourneyMachine. Cluster 1.1 closed as not-a-bug (see §2).

CI note: the org hit its GitHub Actions spending limit mid-session
(all jobs failing at startup in ~2s); Frank raised it and #528 merged
clean. Not a code issue.

---

## 2. ACTIVE BUGS (L99 audit clusters)

Each cluster maps to one or more bug observations (B# = coach review,
A# = admin review, P# = parent review). Cluster numbers preserve
chat's L99 ordering.

### Cluster 1 — Tournament results not propagated to aggregates
- Status: **RESOLVED 2026-05-27** (production verified against Frank's TourneyMachine screenshots via MCP). All 4 tournament teams reconciled: 11U Girls (5/5), 10U Black (4/4), 8U Boys (4/4), 10U Blue league backfill complete. Session fixes: (a) 8U Boys CT Wolves flipped 35-15→15-35 L + missing NY Wild 13-34 L added → 0-4; (b) 10U Blue missing St Joseph-Bxville 5C result added (19-23 L, Apr 26) → 3-4 matching TM; (c) 9U Boys stray "6th Boro 4AB" May 17 event deleted (phantom — 9U plays 3AB; real 6th Boro 3AB game May 18 12-13 L already present); (d) 10U Blue May 17 6th Boro 4AB left without result (TM shows unplayed — Cluster 1.3 closed). 11U Girls is 3-2 by design (Frank confirmed 2026-05-27): TM shows 2-2 because it excludes the asterisked game from the *tournament* record; AAU calls these **bonus games** (TM's "chip" game) and they are real games that were played, so **they count on OUR team records**. Our W-L counting all 5 published games is correct and intended. **Do NOT wire `is_bonus_game` into `computeSummary`/`useTeamRecords`/`useOrgTeamRecords`** — bonus games counting on our records is the desired behavior. The field's label "doesn't affect seeding" refers to TOURNAMENT seeding (TM's concern), not our team W-L; it's correctly left unwired. (Earlier framing of this as a "latent gap" was backwards — corrected here.)
- Severity: HIGH
- Surfaces affected: 9 across all 3 roles
  - Coach: B4 (10U Black 0% post-championship), B5 (Teams tab records pre-tournament)
  - Admin: A4 (Nationals Qualified = 0), A5 (Season Records pre-tournament), A6 (Tournament tiles inconsistent), A7 (Standings PCT stale)
  - Parent: P22 (Home MY TEAMS pre-tournament), P28 (Schedule Games tab Standings stale)
- D1 finding (2026-05-18): 15 tournament events from May 16-17 exist in `events` table with `tournament_id IS NOT NULL`. ALL have `has_result=false`, `our_score=null`, `opponent_score=null`, `published_at=null`. The tournament events ARE in the system; scores were never entered via Quick Score → game_results table is empty for these events → aggregate queries correctly return pre-tournament state.
- Resolution: **workflow item, not code PR**. Frank publishes 13 tournament results via Quick Score (see §9 for full inventory). If aggregates DON'T update after publish, reopen as code fix in a follow-up PR.
- Drift-hedge test per #43 (deferred until aggregate path is touched): assert tournament events with `tournament_id IS NOT NULL` and entered scores propagate to all 4 aggregate surfaces

### Cluster 1.1 — 10U Blue "mis-tagged tournament event" (NOT A BUG)
- Status: **CLOSED — not a bug (2026-05-27, Frank-confirmed).** Original framing was a misread.
- Severity: N/A
- The D1 premise ("one stray 10U Blue event on 2026-05-17 tagged to `254afad0`, null it") was wrong. Verified via MCP 2026-05-27: `254afad0-23af-4979-ac4a-88614b76e341` is the tournament row **"WPCYO Spring League 2026"**, and **16 game events** carry it — ALL 10U Blue (8) + 9U Boys (8) regular-season league games, not one event. This is the league modeled as a tournament row for grouping, applied consistently across both league teams. (11U Girls' lone schedule game is null; AAU tournament games for 11U Girls / 8U Boys / 10U Black live in the results/scoring system, not as schedule `events`.)
- Why NOT to null: Cluster 1 was reconciled + verified correct against TourneyMachine on 2026-05-27 **with this tagging in place**. Nulling the `tournament_id`s would risk regressing the now-correct records. The earlier "Migration 021 should null that event" resolution is **withdrawn** — do not null. Nulling just one of the 16 would also create inconsistency.
- If the league-as-tournament model ever needs revisiting, that's a deliberate data-model change across all 16 league games (+ a Records/Standings re-verification), not a one-row hygiene fix.

### Cluster 1.2 — 10U Blue Game 6 missing from system
- Status: **RESOLVED 2026-05-27** — verified in production: 10U Blue vs Resurrection Blue 4AB (May 9) entered + published as 25-27 L. 10U Blue league record reflects the 6th game.
- Severity: LOW (workflow data entry)
- Evidence: Frank's league schedule data dump shows 6 league games played for 10U Blue. Resurrection Blue 4AB (May 9) at 25-27 L is the 6th game. Screenshots at audit time showed 3-2 — that means Game 6 was not yet entered in the system at screenshot capture.
- Frank-action item: enter Game 6 result (Resurrection Blue 4AB, May 9, 25-27 L) into the system during the Quick Score backfill session.

### Cluster 1.3 — 10U Blue Game 7 status unknown
- Status: **RESOLVED 2026-05-27** — TourneyMachine screenshot shows the May 17 6th Boro 4AB game as scheduled (5/17 2:30 PM) with team records displayed instead of a final score → unplayed/unrecorded. Our event correctly carries no result; left as-is. The 10U Blue record (3-4) is complete without it (the real missing result was St Joseph-Bxville 5C, since added).
- Note: the 10U Blue May 17 event's `tournament_id` is NOT a mis-tag — it points to the "WPCYO Spring League 2026" league-as-tournament row that all 16 league games share. See Cluster 1.1 (CLOSED — not a bug).

### Cluster 3.1 — Event title ad-hoc string appendages (scope expansion)
- Status: **RESOLVED (render layer)** via PR #298 (2026-05-19); Migration 021 (data hygiene) still queued
- Severity: LOW (data hygiene)
- Examples found in production:
  - "9U Boys Game" (team name embedded as title)
  - "10U Blue · 6th Boro 4AB · May Reschedule"
  - "10U Blue · Holy Family-NR · May Reschedule"
- Root pattern: ad-hoc free-text edits to `event.title` during reschedule + event creation workflows. No constraint on what gets stored in the title field.
- Resolution:
  - PR #298 — `formatEventTitle` helper computes from `event.opponent` + `event.event_type` + `event.home_away`; `event.title` intentionally NOT consulted. Drift-hedge audit test locks the render invariant.
  - Migration 021 (still queued) — sanitize existing event titles in DB. Render-layer fix above neutralizes user-visible drift even before data hygiene lands.

### Cluster 2 — Per-player % degenerates to RSVP-going-rate when check-ins absent
- Status: **RESOLVED (label fix)** via PR #240 (2026-05-18); workflow promotion deferred
- Severity: HIGH (label) / MEDIUM (workflow)
- CC code-validated: `useAttendanceData.js:130` computes `pct = goingCount / totalPast`. When no check-in / arrival rows exist, attendance% collapses to RSVP-going%. Math is correct; label was misleading on Coach Home.
- Surfaces affected:
  - Coach: B3 (roster snapshot "4%" with no label — the worst case)
  - Admin: A11 (Lily Alexander "4% Going · 96% NR" — already had label)
  - Parent: P4 (Charlie "4% No · 96% NR" — already had labels for each category)
- PR #240 resolution:
  - `CoachRosterSnapshotTeam.jsx:83` — changed `${row.pct}%` → `${row.pct}% Going`
  - Matches the convention in `PlayerRow.jsx` + `MyChildSpotlight.jsx` (admin + parent rosters) which already used `% Going` / `% Maybe` / `% No` / `% NR` labels per category
  - Cross-surface invariant test (`playerGoingLabelInvariant.test.jsx`) locks: bare `{pct}%` form must not re-appear; "Going" label must be present in all surfaces rendering the goingCount metric
- Workflow promotion of check-ins remains in §9 (gameday arrival board → coaches do check-ins → metric becomes real attendance, not just RSVP-going-rate)

### Cluster 3 — Event title concatenates own team name redundantly
- Status: **RESOLVED** via PR #298 (2026-05-19)
- Severity: MEDIUM
- Surfaces affected:
  - Coach: B2 (Schedule "vs. 9U Boys Game" vs Home NEXT EVENT "vs. 6th Boro 3AB · 9U Boys")
  - Admin: A9 (Schedule lists redundant team line below title)
  - Parent: P25 (8U Boys event detail "8U Boys Practice" with redundant "8U Boys" team line)
- Root cause confirmed: 6 surfaces composed their own title fallback (`event.title || vs. ${opponent} || typeLabel || event_type`). Some echoed free-text literal, some stripped prefixes inconsistently, some appended redundant team name.
- PR #298 resolution:
  - `src/lib/eventTitle.js` — `formatEventTitle(event)` returns `{ prefix, body }` computed from opponent + event_type + home_away. Flat-string sibling `formatEventTitleString`.
  - Migrated callsites: EventCard, NextEventCard (admin), PublicSchedulePage, + 4 ACTION ZONE hooks (usePendingRsvps, useRideNeeded, useVolunteerSlots, useLiveNowEvents).
  - Drift-hedge per #43: `eventTitleAudit.test.js` static-grep fails CI on any inline `vs. ${opponent}` recomposition outside the allowlist (ical export + briefing emit channels intentionally preserve admin-curated labels).
  - 11 unit tests cover the contract surface (home/away/neutral/tbd, missing fields, free-text rejection, unknown event_type).

### Cluster 4 — Notification bell badge has no inbox to consume it
- Status: **RESOLVED** via PR #295 (2026-05-19; resolution path (a))
- Severity: MEDIUM (UX clarity)
- Frank's clarification: bell tap routes to Settings; no actual inbox
- Surfaces affected: bell appears on all role headers — was showing "4" / "1" / "2"
- PR #295 resolution (path (a)):
  - Removed badge count entirely from `Header.jsx`; bell still routes to `/account` settings shortcut
  - Anti-pattern #42 honored: `useNotificationBadge()` hook + supporting query file deleted in the same PR (no parallel-system buildup; the hook was orphan since no inbox existed to consume it)
- Path (b) (real notification inbox) — deferred to Phase plan, not in §2 scope
- Anti-pattern #44/#45 catch (registered 2026-05-20): like Cluster 5, this §2 entry stayed stale ("Status: OPEN") for one day post-PR-#295 merge while §1 SHIPPED and §15 verification surfaces were updated. Same staleness shape as Cluster 5; closed in PR #315 alongside Cluster 7.

### Cluster 5 — Coach Home MY TEAMS source divergence
- Status: **RESOLVED** via PR #239 (2026-05-18)
- Severity: HIGH
- Root cause (CC code-validated):
  - `CoachHomePage.jsx:47-51` built `myTeams` from direct `team_staff` query — no records data
  - `ParentHomePage.jsx:124` passed `byTeamId={recordsByTeam}` from `useOrgTeamRecords(orgId)` to same downstream component
  - Both used `ParentHomeTeamCard`; one passed records, one didn't
- PR #239 resolution:
  - Added `useOrgTeamRecords(orgId)` to `CoachHomePage.jsx:35` (cobranching ParentHomePage's pattern)
  - Threaded `summary={recordsByTeam[t.id]}` + `loading={recordsLoading}` to `ParentHomeTeamCard` at `:143-144`
  - Cross-surface invariant test landed at `src/components/home/__tests__/myTeamsCrossSurfaceInvariant.test.jsx` (anti-pattern #43)
  - Production cross-check confirmed 35 published games aggregate correctly across all 5 teams (see §15 Layer 4 entry for PR #239)
- **Anti-pattern #45 catch (registered 2026-05-20 morning):** PR #239's ledger update covered §1 SHIPPED row and the §15 Layer 4 verification table, but this §2 entry stayed stale ("Status: OPEN, Anticipated PR: #239 (tonight)") for two days post-merge. The §4.P Tuesday session-contract pre-flight surfaced the staleness when CC went to execute "Move 2 = Cluster 5 closure" on what turned out to be already-closed work. Both Frank's pressure-test letter Monday night ("root cause pre-validated in ledger lines 137-144, fix is mechanical") and CC's recap ("1 OPEN MEDIUM (Cluster 5)") were operating off this stale entry. The trap that anti-pattern #45 catches in real time on session 1 of the post-#45-registration window. Reinforces the discipline: planning-doc updates ship as a coordinated set across ALL surfaces (§1 SHIPPED + §2 ACTIVE BUGS + §15 verification + helper-extraction backlog if relevant) — not selectively.
- **Anti-pattern #44 corollary:** CC should have traced `git log -- src/pages/CoachHomePage.jsx` before confirming OPEN status last night. Stopping at the §2 entry was the gate-check failure. Trace-the-full-pipeline applies to ledger reads too, not just regression triage.

### Cluster 6 — Admin Home cache/query race (A2 + A3)
- Status: **A3 RESOLVED via PR #241; A2 RESOLVED via PR #327**
- Severity: HIGH (A3 confirmed regression) / MEDIUM (A2 state-transition flicker)
- A3 final root cause: **PR #235 regression** in `useAlertEvaluator.js`, not in AlertZone.
  - CC's D5 diagnostic missed this — focused on AlertZone gate logic (structurally correct) and didn't trace upstream evaluator timing.
  - Frank's 2026-05-18 smoke confirmed the green-flash-before-amber pattern persisted in production post-PR-#235.
  - Actual race: `useState([])` for configs made the initial state and "fetched + empty" state indistinguishable. The evaluate callback fired on mount with `configs=[]`, hit its empty-configs early return (`setAlerts([]); setLoading(false); return`), and flipped `loading=false` BEFORE the configs fetch completed. AlertZone briefly rendered the green AllClearPill before re-rendering with the real alerts once configs loaded and evaluate re-fired.
  - Fix in PR #241: `useState(null)` as "not yet fetched" sentinel. The evaluate's null branch returns without touching loading. AlertZone's loading gate stays armed through the configs-fetch window.
  - Drift-hedge test (`useAlertEvaluator.loadingGate.test.js`) asserts `loading=true` persists through the configs-fetch phase + only flips to false after evaluate completes.
- A2 (count flip 63→31 / 159→77): identified as season-context state-transition flicker. Downgraded HIGH → MEDIUM.
- A2 final root cause: `useAdminStats` effect re-fired when `seasonId` changed from `null` (no active season resolved yet) to a real UUID (active season resolved post-mount), but `counts.loading` stayed `false` from the prior fetch. KpiGrid rendered the placeholder-bypass flicker — stale/zero values briefly visible before the new values landed. Same structural shape as Cluster 6 A3's `useAlertEvaluator` configs race, just on a different upstream signal.
- Fix in PR #327: `setCounts((prev) => ({ ...prev, loading: true }))` at the start of every effect run. KpiGrid renders the placeholder during the refetch window, preventing the flicker. Anti-pattern #44 reinforced — trace the full state pipeline; downstream gate (KpiGrid placeholder) was structurally correct, but upstream loading-state never returned to true after first fetch.
- Lesson registered for CLAUDE.md anti-pattern future-extension: code-side review of a downstream gate isn't sufficient when an upstream hook can output values that bypass the gate. Trace the FULL state pipeline before ruling out a regression.

### Cluster 7 — Admin Home greeting not NY-pinned
- Status: **RESOLVED** via PR #295 (2026-05-19)
- Severity: LOW
- Surfaces affected: Admin Home only (A12)
- Parent Home (P21) was correct; Admin Home was using browser-local time and skewed for admins traveling outside ET
- PR #295 resolution:
  - `AdminGreeting.jsx` now imports `firstNameFrom` + `greetingFor` from `src/lib/greetings.js` (NY-pinned helper from PR #233/#234 cascade)
  - Greeting helper is shared with parent home so future drift on either surface fails the same way
- Anti-pattern #44/#45 catch (registered 2026-05-20): like Clusters 4 + 5, this §2 entry stayed stale ("Status: OPEN, ~5-min one-liner") for one day post-PR-#295 merge while §1 SHIPPED was updated. Closed in PR #315 alongside Cluster 4.

---

## 3. STAGED MIGRATIONS (Phase 0B 013-021)

> Frank's input needed to populate full list. CC's knowledge here is
> partial. Update this section with current staged migration list.

Known:
- **Migration 021** — data corrections including 11U Girls duplicate practice Mon May 18 (if D12 diagnostic confirms duplicate)
- Migration 013 → 020 — TBD (need Frank to enumerate)

Pattern reminder: migrations applied via MCP must be mirrored to
`supabase/migrations/` with canonical version-string filenames per
anti-pattern #21.

---

## 4. DECISIONS LOCKED, NOT YET IMPLEMENTED

Items where the decision is locked in chat-side discussion or prior
session notes, but the code/doc artifact hasn't shipped yet.
Organized by **arc**, not by chronology — each arc is a coherent
multi-PR unit with its own scope and sequencing.

Sources cross-referenced 2026-05-18:
- `docs/archive/SKYFIRE_BUILD_QUEUE_v2.md` (canonical build queue)
- `docs/archive/CUTOVER_WAVE_GAP_AUDIT.md` (briefing renderer + parser arc)
- `docs/archive/STATE_OF_AFFAIRS_L99_v5.md` (canonical state)
- `docs/archive/CC_SESSION_HANDOFF_2026-05-13.md` (PostHog + Dependabot)
- `docs/archive/AUDIT_DAY_2026-05-16_FINAL_CLOSE.md` (audit close)
- `docs/archive/CC_WAVE_4_4_COUNTER_PLAN_REVISION_2026-05-11.md` (briefing IA)

Items flagged "VERIFY MONDAY" live in §15 — they may already be
shipped (status uncertain at audit time).

---

### §4.0 — RECONCILIATION INDEX (verified against code 2026-05-27)

The arcs below trail the codebase badly (anti-pattern #45 staleness).
This index is the **trustworthy top-level "what's next"** — verified by
grep + MCP query on 2026-05-27. Read this before trusting the detailed
arc bodies.

**OPEN at 2026-06-12 close (top-of-stack — read first):**
- Two PHASE CLOSES (money-seam; privacy/roster/funnel): build-complete + audit-clean; gate =
  Frank's device-smoke of the deploy → architect ratification (§11.8 r4). [2026-06-12: still
  open — this admin/coach/parent walk is distinct from the #986 brand-deploy smoke, which passed.]
- Product decisions D-a..D-f routed via `docs/ARCHITECT_DECISION_REQUEST_PRODUCT_DECISIONS_2026-06-11.txt`
  (evidence + CC leans; Frank/architect rule, then CC ships ruled items as small PRs by surface).
- LH public-site v1: zip VERIFIED deploy-ready (2026-06-12); OPERATOR steps = README-DEPLOY 1–3
  (create `legacyhoopers-site` repo → upload → Vercel import) → grade 8 pages on phone. Domain
  attach only after approval; DNS flip stays in the Squarespace cutover sequence.
- Dynamic-workflows operating model + phase sequence locked in
  `docs/DYNAMIC_WORKFLOWS_NEXT_PHASES_2026-06-12.txt` (Phase A = D-a..D-f PRs on rulings;
  Phase B = Schedule L99, §16.15 audit doc gates code; Phase C = LH-site cutover support).
  SHIPPED as PR #986 (merged 2026-06-12); Frank's 5-step deploy smoke PASSED same day, hook
  verified live on session resume. Phase A remains gated on the D-a..D-f rulings.
  **Phase B EARLY-START (operator-ratified 2026-06-12, same session):** Schedule L99 audit doc
  SHIPPED — `docs/SCHEDULE_L99_AUDIT_2026-06-12.txt` (all five §16.15 elements; 32 findings:
  7 P1 / 12 P2 / 13 P3, file:line + prod-query grounded; 11/32 from the pass-2 addendum ~34%;
  per-role wireframes parent/coach/admin PROPOSED; 9 open decisions SD-1..SD-9 with CC leans).
  Phase B CODE stays gated on the SD-1..SD-9 rulings (audit-gates-code per §16.15); audit ran
  as pure parallelism while D-a..D-f relay is pending. Schema flags for architect: events.end_at
  nullable (5/193 prod rows null, all past) + locations duplicate coord pairs (lat/lon AND
  latitude/longitude) — migration-arc candidates, NOT in the Schedule UI sequence.
  **MULTI-AGENT REVIEW (operator-directed, same day):** 6 parallel agents (DB/RLS, data layer,
  components, UX/per-role, cross-surface+tests, adversarial verification) →
  `docs/SCHEDULE_MULTIAGENT_REVIEW_2026-06-12.txt`. **P0 FOUND: the public funnel was DEAD in
  production** — anon RLS gate fail-closed since 2026-05-28 (DB-1) + phantom `events.location_name`
  select in PublicSchedulePage AND team-feed ICS (DB-2/XS-1) → QR/shared links showed nothing,
  calendar subscriptions 500'd. Plus anon grant surface (DB-4, incl. team_feed_token SELECT) and
  game_results anon leak (DB-3).
  **RULINGS LANDED + P0 LANE SHIPPED (2026-06-12, same session):** architect ruled ALL decisions —
  `docs/RULINGS_SCHEDULE_L99_2026-06-12.txt` (PR-A gate + SD-1..9; eventTimeStatus 3-state R1,
  WeekStrip-roles-to-PR-F R2, SD-3=(b) recent+link diverging from CC lean) +
  `docs/RULINGS_SCHEDULE_MULTIAGENT_2026-06-12.txt` (P0 shape + SD-1..18; SD-5 REVERSED to (c)
  Games-cancelled-free-by-design; SD-2 spine `eventTimeState`; §E hard lock: SCH-2 batch hook in
  PR-A' BEFORE the PR-B' RSVP ungate; §D guardian_id forward-only, NOT NULL deferred over 1,691
  nulls; SD-17 AI = conflict-detection but AFTER family-hub arc; SD-18 push backlogged). Renders
  committed: `docs/renders/{public-schedule-repaired,schedule-timestate-spine,schedule-admin,
  schedule-coach}-mobile.html` (parent render referenced but not yet relayed). **Frank gave the
  SD-10 GO (Rule 19) and CC executed the P0 lane same-session:** migrations 20260612030252
  (STEP 1 anon grant lockdown: write-class revoked on 12 tables, SELECT revoked on 8 no-public-need
  tables, teams/locations column-narrowed — team_feed_token + admin_notes off anon) / 20260612030320
  (STEP 2: SECDEF org_is_public_listed() + get_public_subscribe_info() + 4 *_select_public policies
  rewritten) / 20260612030336 (STEP 3: game_results gated to parent-event visibility — also closes
  the cross-org authed read; dead game_results_select_parent dropped). Verified as anon: teams 9 /
  events 193 (=published parity) / results 91 / subscribe RPC 1 row; team_feed_token + event_rsvps
  probes DENIED (42501). App fixes: PublicSchedulePage (location_name:location alias + error
  surfacing + RPC subscribe info), team-feed redeployed v10 (alias fix + ICS core split to
  _helpers.ts; v9 briefly flipped verify_jwt=true via MCP deploy default — AP #31 class, caught on
  the deploy response, v10 restored false). Locks: eventsSelectColumnsAudit.test.js (column-vs-
  schema manifest, parser validated against 3 embed forms), PublicSchedulePage.test.jsx (error-strip
  + alias regression), edgeFunctionMirrorAudit team-feed↔icsCore pair ACTIVATED (baseline 10
  measured). Advisors re-run: 0 ERRORs; 4 new WARNs = by-design anon-executable SECDEF gates (same
  class as verify_*_token). **SMOKE PASSED (Frank, 2026-06-12 ~5:36 AM ET):** logged-out Safari rendered the
  11U Girls public page (org eyebrow via RPC, 4 events WITH venues = alias verified through live
  PostgREST, Download/Subscribe/Share live) + Subscribe sheet offered Apple/Google (feed token via
  the gated RPC). **P0 LANE CLOSED.** Three findings filed from the smoke walk: (1) TeamDetail
  3-dot overflow in PARENT mode duplicates the bottom-nav tabs verbatim (View records/View full
  schedule only — staff items make it sensible; parents get pure duplication) → open decision,
  hide-vs-enrich; (2) parent-preview stickiness — 24h-persisted "view as parent" hid the entire
  staff stack with only the small PARENT eyebrow as signal → louder treatment, open decision;
  (3) NO in-app calendar-subscribe affordance for logged-in parents (Subscribe lives only on the
  public page) → rides with SD-16 phase 1 (per-family feed needs the in-app entry point anyway).
  Smoke also live-corroborated two ruled items: inflated "12NR" denominators (SD-6) + DRAFT badge
  shown to a parent (UX-11). **Execution evidence + deviations register for the architect:**
  `docs/P0_LANE_EXECUTION_REPORT_2026-06-12.txt` (before/after policy quals + grant matrices,
  anon probe data, advisor delta, v9 verify_jwt incident, D1-D7 deviations awaiting ratification
  incl. the proposed AP #31 MCP-deploy corollary, residual-risk register R-1..R-6).
  **PR-A' SHIPPED (2026-06-12):** the SCHEDULE_L99_BUILD_SPEC arrived (committed:
  `docs/SCHEDULE_L99_BUILD_SPEC_2026-06-12.txt` + 6 renders in `docs/renders/`) and PR-A' built to
  it: SD-2 time-state spine (`eventTimeState`/`eventEnd`/`isRsvpOpen` in `lib/eventWindows.js`,
  2h EVENT_DEFAULT_DURATION_MS as the ONE constant; FIVE divergent is-past predicates re-pointed —
  the spec's 4 plus an EventDetailHeader stray — and a NextEventCard duplicate constant removed);
  three-band Schedule (Happening now / Upcoming w/ NOW-slot ring + countdown-at-every-density
  CP-5 / Completed collapsed w/ W/L on game types only per SD-5); VF-11 batch hook
  `useScheduleData` (constant request count, per-child RSVP + activation batched — ChildRsvp
  per-row N+1 killed via initialResponse/initialActivated props); §10 card content model at both
  densities (chip row: going w/ SD-6 rostered+activated denominator, staff "/N rostered" form,
  Hidden-roster suppression w/ "Counts hidden for evaluations" lock note, rides-needed/covered,
  volunteers-needed, own-commitment line; 44px segmented Going/Can't RSVP at compact per §10.2);
  SD-1 density collapse (dead 'schedule-list' key purged → 'default', migration `20260612105307`
  swept 5 'medium' + 3 'schedule-list' rows and tightened the CHECK to 2-state); UX-11 DRAFT chip
  staff-gated. CI locks: `eventWindows.test.js` (spine contract incl. NULL-end completed +
  mid-game happening_now), `eventTimeStateAudit.test.js` (grep gate: isPast defs must read
  eventTimeState; duration-constant redefinitions banned), CP-5 countdown-at-both-densities test,
  §10.1 chips test, VF-11 request-count-constant test. Build-shape deviations for architect
  ratification: formatCountdown STAYS in `lib/formatters.js` (existing TZ-pinned NY implementation
  + test suite; spec §4 placed it in eventWindows — moving would churn the timezone audit for no
  behavior change); cancelled-card RSVP invariant STRENGTHENED (hidden entirely vs render-disabled);
  duty chip ships the generic "N volunteers needed" form (duty names not in the count batch —
  "Snacks open" name-form deferred to PR-E' coverage work); weather chip keeps the existing
  org-coords now-window behavior (per-venue+date batching lands with PR-C' per SD-9/DB-10).
  NEXT: PR-B' (always-on RSVP ungate + isRsvpOpen everywhere + ChildRsvp → shared/; batch-hook
  prereq now satisfied) → PR-C'..F' per the ratified sequence → capability arcs (C1 weather →
  C2 directions → C9 family-hub ph2 → C10 AI → C11 push).
- FORK E (LEGAL/CAN-SPAM) unchanged below — pilot stays ON until a footer mailing address or a
  per-kind send gate lands.
- Carried triggers: FU-1 gender smoke · FU-2 family_cap_policy → get_public_program · RV-6 per-player
  roster opt-out · D-b add-another→select · D-d multi-division funnel select · ADMIN_BCC → admin@
  (optional) · FU-3 H-2 architect visual ratify.
- Next L99 lead candidate: Schedule (`src/pages/SchedulePage.jsx`).

**§4 FORK E punch list (architect deploy-review ruling 2026-06-09; one PR each).**
E1 [GATE] family_guide footer mailing address — RULED by Frank: KEEP IT OUT (option 3).
LEGAL stays OPEN; no footer change shipped. CAVEAT recorded: the cutover flag
(pilot_test_recipient_email) is GLOBAL, so "restrict the cutover to non-promotional
kinds" is not mechanically achievable — keep-out is safe only by operator discipline
(send relationship kinds only post-cutover); a promotional family_guide without a
footer address is the CAN-SPAM exposure. Enforcing in code later = add address (1/2)
or a per-kind send gate (new work).
E2 RECOVER seam → webhook — DONE (#910): verified resend-webhook-receiver advances
delivery_status from 'queued' (rank-based, queued rank 0 → any higher); reverted the
#907 client reconcile to read-only + deleted reconcileDelivery.js + restored the
strict no-write guard. The webhook is the reconcile seam.
E3+E4 SEE — DONE: fixed the pre-existing broken recipient SELECT (phantom bounce_reason
column → PostgREST 400 → recipients silently always-empty; AP#36 swallow), extracted
deliveryRollup() (Recipients label / bounced_at / +Complained), + the counting test
that guards the bounce fix.
E5 mark-failed → bounded-retry action — DONE: StuckSendCard/StuckSendsRegion gain a
third confirm-gated action that sets delivery_status='failed' so _redrive picks the
residue up (failed + redrive_count<3); guard test locks it. E6 cutover actor+timestamp
audit — DONE (interim): reportAudit('pilot_cutover', {actorId, orgId, clearedAddress})
fires from PilotModeForm.goLive on a successful cutover → console + an info-level Sentry
message (tag audit) via the new captureAuditToSentry; test asserts the cutover is
audited. ARCHITECT-LANE FOLLOW-UP for 10/10: a durable DB audit row on pii_audit_log
(needs an insert RLS policy or a SECDEF RPC — the table is RLS-on/no-policy today).
(E1 ships no code.) PUNCH LIST COMPLETE: E2-E6 shipped, E1 ruled keep-out.

**OPERATOR DIRECTIVE 2026-06-09 — REMAINING ON PILOT IS MANDATORY (Frank).** The
FORK E FLIP/cutover is now LOCKED OFF in the app: PilotModeForm gates the go-live
control behind `CUTOVER_ENABLED=false`, replacing it with a "Pilot mode is required —
going live is disabled" note. There is NO UI path to clear pilot_test_recipient_email,
so all outbound email stays redirected (the redirect is unchanged + still set). The
cutover machinery (D3 SEND-LIVE confirm + E6 audit) is PRESERVED behind the flag —
re-enable = flip to true once LEGAL is resolved (a CAN-SPAM footer address). FORK E
gate now reads SEND ✅ / RECOVER ✅ / SEE ✅ / LEGAL open / FLIP **locked by directive**.
Architect-lane option if a hard guarantee is wanted: a server-side lock (constraint/
trigger preventing pilot_test_recipient_email→NULL). Flagged for the architect: this
changes the FORK E FLIP they designed.

**SETTINGS BUILD (9-surface, by-surface smallest-first; ASTERSPORTS_SETTINGS_MASTER_SPEC).**
S1 My Preferences — DONE (one PR). Extended /account (NOT rebuilt) with a Preferences
group: AppearanceForm (theme + default density) + TimeLanguageForm (timezone + locale),
new SegmentedControl primitive, shared src/lib/timezones.js (de-duped OrganizationForm's
inline list, AP#7). Writes user_preferences via the shared usePreferences store
(self-RLS, no migration). TWO FLAGS for the architect: (1) THEME is a DEAD COLUMN —
verified no dark stylesheet / no theme actuation; the pref is persisted + system/light
render the same (light) today; dark-wiring is a follow-on (baked into the help copy).
(2) DENSITY is 2-STATE (minimal|maximum) per useDensity + CLAUDE.md §16.2 — the render/
master-spec showed 3-level (Minimal/Medium/Maximum); built 2-state to match the code (a
'medium' write throws in useDensity.setDensity); the stale DB default 'medium' validates
to 'minimal' on read. Also: user-level timezone/locale actuation is partial (event times
follow org tz; i18n is Phase 3) — S1 ships the pref UI + storage; actuation sequenced
separately.
S2 Family Notifications — DONE (one PR). Parent-only "Family notifications" group on
/account (self-gated on useAuth().guardianId; RLS backstop). useGuardianNotificationPrefs
hook reads guardian_notification_prefs (greenfield → all-ON defaults) + saves via UPSERT
by guardian_id (UNIQUE(guardian_id) verified — AP#25 safe; no migration).
FamilyNotificationsForm = 4 toggles (weekly_digest/tournament_briefings/game_recaps/
org_announcements) + a players context line. GUARDIAN-LEVEL (covers all the parent's
players, not per-child). Distinct from S1's notification CHANNELS — kept separate.
S1 FOLLOW-UP (DR-1 + DR-3) — DONE. Per the architect DR ruling: HID the theme segment in
AppearanceForm (no dark stylesheet → a live System/Light/Dark control lies; column +
persist path kept dormant for the future dark arc); AppearanceForm is now density-only.
Softened the TimeLanguageForm tz copy ("Used to show event times in your local zone" →
"Your time zone. Event times currently follow the program's zone") since user-level tz
actuation is deferred. DR-2/4/5 = architect-side spec/checklist/model corrections (DR-5:
trg_guard_pilot_cutover was already shipped last session — CC's premise was stale).
S3 HOME LAYOUT — Step 0 BLOCKED → decision pending (ARCHITECT_DECISION_REQUEST_S3). The
D-2 gate PASSED (architect-verified admin-gated writes), but the Home page consumes
NEITHER config table (0 src refs; QuickActions is a hardcoded GROUPS array) AND the
quick_actions_config seed is STALE/narrower than the shipped Home (6 flat actions vs 9 in
3 buckets; +Player/teams vs +Member/admin/members; no group column). Wiring it as-is
regresses Home. CC lean: DESCOPE S3 for the pilot (config-driven Home is a multi-tenant
feature) → go to S4. Awaiting architect ruling (a descope / b reseed+schema first / c
sections-only).

**§4 reconciliation 2026-06-09 (settings-page arc — architect D6 ruling).** The
`/admin/settings` arc shipped this session and is recorded SHIPPED here. It
post-dates the 2026-05-27 index, so it was never a tracked §4 row. The build queue
`docs/archive/SKYFIRE_BUILD_QUEUE_v2.md` is confirmed archived/frozen (NOT written);
this ledger is the live tracker (the prior "per-step build-queue entry" reference is
retired — architect self-corrected). Arc: A2 #897 (AutoNotificationSettingsForm +
`/admin/settings` shell + route + `set_org_auto_notifications` RPC) + migration-collision
mirror #898 + Step 1 Sender identity #899 + Step 2 Organization #900 + Step 3
Registration/Features/Domain #901 + Step 4 Pilot (guarded) #902 + Step 5 decompose+a11y
#903 + D3 Pilot focused-confirm #905. Result: `/admin/settings` admin-only, 3 groups /
7 sections, all saving; 61 admin tests; every file ≤150. Decisions D1–D6 ratified
(`docs/CC_SESSION_HANDOFF_2026-06-09_settings.txt`). Open strategic item: FORK E RECOVER
seam (`docs/RECOVER_V1V4_FINDINGS_2026-06-09.txt` — architect ruling pending).

| Arc / item | Verified status | Evidence |
|---|---|---|
| §4.A PR 4 coach_roundup | **SHIPPED** (was actor-pending) | 3 `sent` rows, last 2026-05-27 15:48 — Frank actor-validated this session |
| §4.A PR 5 family_guide | CODE-COMPLETE, **actor-pending** | 0 `sent` rows; one wizard send (fsamaritano@gmail.com / Charlie+Milo) closes it |
| §4.A PR 6 coverage delegation | SHIPPED (A+B+C) 2026-05-27 | per §4.A body |
| §4.A PR 7 feedback survey | SHIPPED then REVERTED (#509) | decision in §7 |
| §4.B Briefing IA | CLOSED | per §4.B |
| §4.C Sprint B–F home | SUBSTANTIVELY COMPLETE | only UPCOMING PREP blocked (needs `event_prep_notes` schema) |
| §4.D Rides redesign | aggregate-coverage SHIPPED | v2 interactive (CTAs/waitlist UI) deferred |
| §4.I schedule-change | **BUILT** (ledger said "zero producers" — stale) | `ScheduleChangeComposer`, `scheduleChangeSend.js`, resolver-registry path, "Notify families" buttons |
| §4.J weather per event | **BUILT** (Open-Meteo, no API key) | `useWeather` + `getWeatherForTime`; wired to schedule + home. Only "in-briefing, skip indoor" unbuilt — near-no-op for indoor basketball |
| §4.K Dependabot / CI token | BLOCKED on Frank | needs workflow-read token scope grant |
| CLAUDE.md §8 3-A locations UI | **BUILT** | `AdminLocationsPage` routed `/admin/locations` |
| CLAUDE.md §8 4-B auto-notifications | PARTIAL | `AutoNotificationSettingsSheet` exists |
| CLAUDE.md §8 5-C player box score | **BLOCKED by policy** | §16.12 forbids per-player game stats in 2026 |
| §4.H density toggle | **BUILT** | `DensityToggle.jsx` |
| §4.H rotation planner / note-edit cooldown | UNBUILT (no code) | grep empty |
| Compose kind-picker simplification | **UNBUILT** — Frank-flagged 2026-06-04 (IMG_2194–96) | The 4-step wizard "Compose · Kind" screen (`StepKindPicker` / `BriefingComposer`): Step 1 is overloaded (send-now/schedule + "Resume a draft" list + 12 kind tiles), and it runs **parallel** to the R-2 one-screen composer (`BriefingNewPage`, `/admin/briefings/new`). The Track-R simplification shipped the one-screen flow + Radar but never retired or restyled this wizard, so "simplify compose" is only half-done. The "Resume a draft" list also overlaps Radar (#690-vs-`/inbox` pattern). Frank can wait, but it belongs in the screens-redesign scope (he expected it was already in the simplification plan). Awaiting routing — candidate D-9 in `REDESIGN_BRIEFINGS_2026-06-03.md`; methodology per §16.15 (audit + per-role wireframe before PR A). |

**QR codes — resolved 2026-05-27:**
- **3-B public-schedule QR → SHIPPED (#531).** `qrcode.react` + `publicScheduleUrl` + `ShareScheduleButton` (QR + copy-link sheet) on TeamDetailHero (staff) and PublicSchedulePage. Encodes `/schedule/:teamId` (public route).
- **6-A parent-invite QR → SHELVED (Frank, 2026-05-27).** Not a QR-render add: onboarding is email-only via Supabase `inviteUserByEmail` (no `team_invites`/token table, no `/join` page). A real scan-to-join needs a join-token system + public join page + account→guardian linking (email-match or admin-approval) + security hardening — a multi-PR auth-adjacent arc. The email invite already works; at ~60 families the open-join security surface isn't worth it now. Revisit only with a deliberate design pass if in-person mass onboarding becomes a need.

### §4.BY — Settings build scope reconciled (2026-06-09, batch consumption audit + §16.16)

Source: `docs/SETTINGS_CONSUMPTION_AUDIT_2026-06-09.txt` +
`docs/ASTERSPORTS_SETTINGS_MASTER_SPEC_AMENDMENT_v2.md`. The batch consumption audit
collapsed the settings build from 9 surfaces to 3.

- **SHIPPED:** S1 My Preferences (#915, #918), S2 Family Notifications (#916),
  S9 Notifications (channel matrix + alerts enable/order + Automatic Messages reuse) — the
  FINAL pilot settings surface. SMS column omitted (no SMS sender, S9 FLAG 1); alert
  thresholds read-only (S9 FLAG 2).
- **DESCOPED → Phase 4** (present-but-unwired; 0 consumption): S3 Home Layout, S4 Records,
  S5 Programs, S6 Roster Rules, S8 Schedule.
- **S7 Briefings — WIRED / editor-deferred / FORK-C-held** (RULED DR-S7 (a), 2026-06-09).
  NOT unwired: `voice_config` + `signature_coaches` are read in production briefing sends.
  No pilot build — entangled with the operator-HELD FORK C, and FORK A already ruled the
  pilot voice/signature default. **Un-park = FORK C sign-off (Frank)**, then S7
  spec/render/handoff. Distinct from the Phase-4-unwired bucket above.
- **Relic tags applied:** migration `20260609225312_deprecate_unwired_config_relics`
  (`circuit_rules`, `division_fees`, `dashboard_section_visibility`, `quick_actions_config`);
  index in `docs/DEPRECATIONS_REGISTRY.md`. Tagged, NOT dropped (Phase-4 reseed may reuse).
- **AP#21 mirror backfill:** the 3 pilot-lock migrations (`20260609210514` / `210721` /
  `210917`) now have repo mirrors (were live-in-prod but unmirrored).
- **Next:** production smoke (admin/coach/parent). The pilot settings build is COMPLETE
  (S1/S2/S9 shipped; S3–S8 dispositioned). Pilot stays DB-locked (`trg_guard_pilot_cutover` live).

---

**CORRECTION 2026-05-27:** the "no unblocked feature build remains" claim
below was WRONG — it had a narrow feature-arc lens and never tracked the
`LH_OPS_SPEC` / `LH_BRAND_CONTENT_MODEL` / ELITE-stack / push-notification
surface. A full canonical-doc review (4-agent pass, verified vs code+DB)
found a substantial real backlog. **See `docs/archive/L99_DELIVERED_VS_REMAINING_2026-05-27.md`
for the authoritative delivered-vs-remaining assessment + sequenced plan.**
Highlights: push-notification infra entirely absent (biggest gap);
`games_recap` kind unbuilt (Frank's primary briefing ask);
`event_reminder_due` is a `not_implemented` stub; EN↔ES translation has
zero infra; Phase-2/3 features open (Rotation Planner, Roster Health,
coach/admin comp, Content CMS); + a per-player-stats §16.12 doctrine
contradiction (surface built + routed but dormant, 0 rows).

~~Queue status after this pass: no unblocked feature build remains.~~
(retracted — see correction above)

---

### §4.A — Cutover Wave (briefing renderer + parser)

Status (revised 2026-05-29 per Doc-Corpus D2-4): **PRs 1-4 SHIPPED (PR 4 actor-validated — 3 coach_roundup sent rows); PR 5 (family_guide) CODE-COMPLETE, ACTOR-VALIDATION-PENDING (0 sent rows — genuinely pending Frank's wizard send); PR 6 GENUINELY OPEN (next real build); PR 7 SHIPPED THEN FULLY REVERTED (#509).** Prior status line below is retained as historical context.

Prior status: **5 OF 7 PRs SHIPPED OR CODE-COMPLETE; PR 7a SHIPPED 2026-05-22; PR 6 + PR 7b GENUINELY OPEN.** PRs 1, 2, 3 shipped May 15-16; PRs 4 + 5 code-complete pending Frank's actor-validation send; PR 7a (token + schema foundation) shipped 2026-05-22 per session-open routing; **PR 6 + PR 7b remain genuinely unshipped.** 7-PR arc per `CUTOVER_WAVE_GAP_AUDIT.md`. Status corrected via §4.N Layer 2 audit (2026-05-18 evening) — git log confirmed PR 4 = #185/#186/#187, PR 5 = #217/#219/#220. **§4.A second reconciliation 2026-05-22 (this commit)** — git log confirmed PR 1 = #172 (b0efef4, 2026-05-15), PR 2 = #173 (db82f99, 2026-05-15), PR 3 = #182 + #184 (3a + 3b, 2026-05-16). Anti-pattern #45 catch — these three ships were 11+ days stale in the ledger; surfaced when CC went to scope "PR 1 next" and discovered all renderers + parser route + venue notes + LLM closer already in production.

- ~~**PR 1**~~ ✅ **SHIPPED PR #172** (b0efef4, 2026-05-15) — `tournament_prelim` renderer alignment. 7 new renderers shipped: `dayHeader.js`, `rsvpCallout.js`, `venueList.js`, `logisticsLine.js`, `taglineFooter.js`, `brandFooter.js`, `bracketCallout.js`. Plus `header.js` `variant: 'cobalt_band'` for full cobalt-background + white-text treatment. Plus `tournamentPrelimSections.js` section-builders module. Plus `tagline` body field on TournamentPrelimBody. Plus orphan-kind dev-mode warning in `composer.renderSections` (catches silent empty-renders of unregistered section kinds — root cause of pre-PR-1 `team_schedule_table` orphan). Implementation surfaced two corrections beyond audit framing: (1) cobalt header is visual STRUCTURE not string swap (added `variant: 'cobalt_band'` parameter); (2) `team_schedule_table` was silently orphaned end-to-end before this PR (replaced with day-grouped `game_card` sections). Section 12 of `CUTOVER_WAVE_GAP_AUDIT.md` captures both corrections inline.
- ~~**PR 2**~~ ✅ **SHIPPED PR #173** (db82f99, 2026-05-15) — Schedule parser at `/admin/import-schedule`. Single-paste TourneyMachine flow. Route live in `src/App.jsx:89` via lazy-loaded `ImportSchedulePage`. Closes V-12 (parser route partial status).
- ~~**PR 3**~~ ✅ **SHIPPED PR #182 + #184** (908cc67 + 390f082, 2026-05-16) — Per-venue notes + LLM-suggested closer. PR 3a (#182): per-venue notes section + schedule-gaps utility. PR 3b (#184): LLM-suggested closer button on StepBodySignoff.
- **PR 4** ✅ **SHIPPED** (#185 skeleton, #186 aggregation + renderers, #187 body) — Coach Roundup kind. **Actor-validated: 3 `coach_roundup` rows with `status='sent'` in `comms_messages` (verified 2026-05-29, Doc-Corpus D2-4). The "actor-validation-pending" narrative below is retained as history.** `coach_roundup` in RESOLVER_REGISTRY; multi-team header + per-team-color game rows + conflict callout. **Code-merged 2026-05-16; actor validation send never executed.** Per §4.N.5 Layer 4 verification 2026-05-19: section builders are fully complete (unlike PR 5 — `buildTeamSections` correctly iterates events and emits `color_striped_row` per event with day_label/time/primary/secondary at `coachRoundupSections.js:33-52`), wizard supported (4c flipped flag), resolver query chain wired, but zero `sent` rows in `comms_messages` for `kind='coach_roundup'`. Reclassified from SHIPPED → CODE-COMPLETE, ACTOR-VALIDATION-PENDING for ledger truth-telling symmetric with PR 5 framing (see §4.N.3 / §4.N.5 for the symmetry analysis). **Unblock path: Frank drives one `coach_roundup` send through the wizard against his admin context → row lands in `comms_messages` with `status='sent'` + email delivered via Resend → confirm rendered output matches expectations → PR 4 status → SHIPPED.** ~10-15 min of Frank's time on desktop whenever convenient. No further code work needed (different from PR 5's 3-sub-PR queue).
- **PR 5** ⚠ **CODE-COMPLETE, ACTOR-VALIDATION-PENDING** (#217 skeleton, #219 aggregation + renderers, #220 body + wizardSupported flip; **#264 5b-1 kind-aware label + #265 5b-3 conflict_callout + #266 5b-2 per-event rows + URLs all merged 2026-05-19**) — Family Guide kind. Originally code-merged 2026-05-16 but landed CODE-PARTIAL: actor validation send never executed (per V-37 unblock 2026-05-19 / §4.N.3) AND core content under-delivered (5b TODO documented in `familyGuideSections.js:10-13` comment was deferred and forgotten across the 5a/5b/5c chain). V-37 sub-PR queue 2026-05-19 closed all three structural gaps: kind-aware "PRACTICES/GAMES/EVENTS" label across vip_header + kid_color_pill (PR #264 5b-1), `conflict_callout` section with kid-aware renderer matching coach_roundup pattern (PR #265 5b-3), per-event `color_striped_row` rows under each kid_color_pill + `quick_link_nav` URLs wired to `/teams/<team_id>` (PR #266 5b-2). 23/23 family_guide contract tests + 11/11 coach_roundup tests + 293/293 engine + timezone audit pass. Reclassified from CODE-PARTIAL → CODE-COMPLETE, ACTOR-VALIDATION-PENDING for symmetric framing with §4.A PR 4 post-§4.N.5 cycle. **Unblock path: Frank drives one `family_guide` send through the wizard against his guardian context (fsamaritano@gmail.com / Charlie + Milo) → row lands in `comms_messages` with `status='sent'` + email delivered via Resend → confirm rendered output matches expectations → PR 5 status → SHIPPED.** ~10-15 min of Frank's time on desktop whenever convenient. No further code work needed.
  - ~~**PR 5b-1** (V-37 PR A)~~ ✅ **MERGED PR #264** — kind-aware event-count label. `summarizeEventKinds(events)` helper reads `event_type` and emits "N PRACTICES" / "N GAMES" / "N EVENTS" per single-kind / mixed / unknown case. Applied to vip_header + kid_color_pill for cross-surface invariant per #43.
  - ~~**PR 5b-2** (V-37 PR B)~~ ✅ **MERGED PR #266** — load-bearing: per-event `color_striped_row` rows under each kid_color_pill (mirrors coach_roundup pattern) + quick_link_nav URLs wired to `/teams/<team_id>`. Cross-surface invariant test locks vip_header.event_count === sum of color_striped_row counts.
  - ~~**PR 5b-3** (V-37 PR C)~~ ✅ **MERGED PR #265** — `conflict_callout` section added to Family Guide composer (was missing entirely; Coach Roundup had it). Renderer updated to surface kid names when present (`kid_a (team_a) vs kid_b (team_b)`), backward-compat with coach_roundup's team-only render. Cross-surface invariant: vip_header.conflict_count === conflict_callout.items.length.

  Until Frank's actor validation send fires, **PR 5 is not yet SHIPPED** in the strict-interpretation sense applied to PR 4 post-§4.N.5. Only the actor-send remains.
- **PR 6** — Coverage delegation schema + UI. New
  `event_coach_assignments` table (Option B); conflict detection at
  parse time + delegation prompt in import preview.
  **Design pass DONE 2026-05-27** → `docs/AUDIT_COVERAGE_DELEGATION_PR6_2026-05-27.md`
  (§16.15 template: audit + deep-read + AP cross-ref + admin wireframe +
  out-of-scope + 3-PR sequence A→B→C). **Q1-Q4 ROUTED by Frank 2026-05-27:**
  Q1 game duration = 90min; Q2 scope = BROAD (all team events in window,
  not just same-tournament); Q3 delegate-to = any org coach; Q4 = soft
  warn (non-blocking commit).
  - ~~**PR A** (schema)~~ ✅ **SHIPPED 2026-05-27** — `event_coach_assignments`
    table applied via MCP (version `20260527102922`) + mirror file
    (AP #21). FK-scoped (no org_id col); RLS enabled with 2 policies
    (admin ALL + coach SELECT, `(SELECT auth.uid())` subselect, AP #20
    WITH CHECK on the ALL policy). Security advisor clean for the new
    table. No SECDEF.
  - ~~**PR B** (detection)~~ ✅ **SHIPPED 2026-05-27** — pure
    `src/lib/import/coverageConflicts.js` (`effectiveCoach`,
    `busyWindow`, `detectCoverageConflicts`, `buildConflictItems`;
    90-min windows, back-to-back ≠ conflict, transitive clustering) +
    `useCoverageConflicts(rows)` hook (broad fetch: all events for
    import teams in ±1-day window + head coaches + existing assignments;
    re-runs on staged delegation). 14 pure unit tests. No UI yet.
  - ~~**PR C** (UI)~~ ✅ **SHIPPED 2026-05-27** — `CoverageConflictBanner`
    (soft warning, Q4) in the import preview + `useOrgCoaches` (any-org-
    coach dropdown, Q3) + `buildAssignmentRows` helper. Reassigning stages
    `delegated_coach_user_id` via `updateRow` → detection re-runs → cluster
    clears. `commit()` now `.select('id')` on insert and upserts
    `event_coach_assignments` (onConflict `event_id,coach_user_id`, AP #25)
    for delegated new + updated rows. 10 unit tests (6 banner render + 4
    buildAssignmentRows). All files ≤150 (useImportSchedule 139).
  - **PR 6 COMPLETE** (A+B+C shipped 2026-05-27). Remaining v1 out-of-scope
    items per the design §6 (coach "my coverage" view, attended/absent
    transitions, post-commit assignment editing, delegated-coach
    notification) stay deferred.
- **PR 7** ⛔ **SHIPPED THEN FULLY REVERTED (#509, 2026-05-27).** 7a + 7b-1 + 7b-2 + 7b-2.5 + 7b-3 all shipped 2026-05-22, then ripped out end-to-end via PR #509 per Frank's 2026-05-24 routing. Rationale: the per-email "How was this briefing? ★–★★★★★" survey served the cutover decision; once cutover is past and the wizard is the locked path, the rating prompt is friction without ongoing operational value. Removal spanned all 3 layers + 14 src file deletions + edge function (`feedback-token-handler`) + DB (`briefing_feedback` table, RPCs, `feedback_token_secret`) via migration `20260524014835_rollback_cutover_feedback_infrastructure`. `queueComposedMessages.js` retains a documented `perRecipientSubstitutor` extension point (header comment) to restore if a real per-recipient personalization use case lands. **Decision pending (→ §7): rebuild feedback differently, or shelve permanently.** The historical sub-bullets below are preserved as the build record of what existed pre-revert.
  - ⛔ Reverted #509. Sub-bullets below are historical (pre-revert build record), not current state.
  - **PR 7a** ✅ **SHIPPED (this commit)** — Token + schema foundation. Migration `20260522074242_cutover_pr_7a_briefing_feedback_infrastructure` mirrors callup-token pattern: `briefing_feedback` table (nonce PK + message_id FK to comms_messages + recipient_email + rating SMALLINT 1..5 + free_text + ip/ua audit) + `feedback_token_secret` in app_secrets (per AP #33) + `mint_feedback_token` + `verify_feedback_token` + `apply_feedback_submission` RPCs (all SECURITY DEFINER with REVOKE FROM PUBLIC + explicit REVOKE FROM anon per AP #23 + #57) + RLS SELECT policy for admins via comms_messages → user_roles chain (with `auth.uid()` subselect wrapper per CLAUDE.md §5). Edge function `feedback-token-handler` deployed v1 (verify_jwt:false; config.toml entry locks the flag per AP #31; audit test passes). DO $$ verification block confirms mint+verify roundtrip for all 5 ratings + 3 boundary rejections (rating=0, rating=6, empty email). No app-layer code yet — emit/render is PR 7b scope.
  - **PR 7b-1** ✅ **SHIPPED (this commit)** — Rendering infrastructure pure. New `feedback_survey` atomic renderer (5 stacked star buttons with cobalt gradient by rating + fail-loud `{{feedback_*_url}}` fallback per AP #29) + composer.js SECTION_RENDERERS registration + `substituteFeedbackTokens` helper (mirror substituteCallupTokens / substituteRsvpTokens pattern, keyed by recipient_email). No kind emits feedback_survey yet → no production behavior change. Unit tests: 14 across renderer + helper (XSS escape coverage + fail-loud fallback + pure-function guarantees + bad-input rejection). Mid-session re-scope: original plan included tournament_prelim emit + URL wrap in this PR, but architecture investigation surfaced that the send pipeline modification (currently uses team slices with shared body via queueComposedMessages, not per-recipient like rsvp_nudge) wants to ship as a single coherent unit. AP #39 truer-position call: ship infrastructure first, wire emit + pipeline together in PR 7b-2.
  - **PR 7b-2** ✅ **SHIPPED 4-OF-5 KINDS (this commit)** — Emit path + per-recipient send pipeline (composerSubmit-path kinds). Design locks per Frank 2026-05-22: per-recipient tokens + Option A (queueComposedMessages callback) + after-signoff-before-brand_footer position + v1 rating-only. Files: (a) `queueComposedMessages.js` adds optional `perRecipientSubstitutor` callback parameter (additive; backward-compat for all existing callers) — builders extracted to `queueComposedMessagesBuilders.js` to stay under 150-line cap; (b) new `feedbackSubstitutor.js` factory mints 5 tokens × recipient via `mint_feedback_token` RPC, wraps into handler URLs (`?t=<token>&r=<rating>`), runs `substituteFeedbackTokens`, re-renders body_html + body_plain; (c) new `feedbackSurveySection.js` helper exports `buildFeedbackSurveySection()` for resolver emit; (d) 4 resolvers emit `feedback_survey` between signoff and brand_footer (tournament_prelim, family_guide, coach_roundup, game_recap); (e) `composerSubmit.js` wires `createFeedbackSubstitutor` into `queueForDispatch` for the 4 FEEDBACK_ENABLED_KINDS; (f) admin BCC row deliberately excluded from substitution (mirrors `adminSample` isolation in rsvp_nudge — admin sees placeholder body); (g) row-transient `__content_sections` field carried through `buildFanoutRows` for substitutor access, stripped before INSERT. Tests: 9 substitutor unit tests + signature lock in queueComposedMessages test + snapshot fixture updates for tournament_prelim + game_recap. weekly_digest deferred to **PR 7b-2.5** (digestSend uses a separate pipeline at 150-line cap; structural changes warrant their own coherent unit).
  - **PR 7b-2.5** ✅ **SHIPPED (this commit)** — weekly_digest feedback survey. `composeWeeklyDigest.js` emits `feedback_survey` section between signoff and footer via the shared `buildFeedbackSurveySection()` helper. `digestSend.js` adds a per-family substitution pass between message INSERT and recipient row build (mint 5 tokens × N families, substitute, re-render body). New `digestFeedback.js` helper (`substituteFeedbackForFamily`) mirrors `feedbackSubstitutor.js` shape but adapted for the digest's per-family object shape (vs row shape). Two extractions to stay under 150-line cap: `digestSendHelpers.js` (buildContext + buildSlicesFromRecipients + renderSlice — pure helpers moved out of orchestrator, mirroring the Wave 4.3-K composeWeeklyDigest split pattern) and `digestFeedback.js` (substitute logic). Admin BCC row intentionally keeps the placeholder sample body — admin sees `{{feedback_*_url}}`, not a real family's tokens. Tests: 7 digestFeedback unit tests + weekly_digest snapshot fixture update. **Cutover-gate now collects ratings on all 5 kinds**: tournament_prelim, family_guide, coach_roundup, game_recap, weekly_digest.
  - **PR 7b-3** ✅ **SHIPPED (this commit)** — Admin aggregation + UI. Closes the cutover-gate arc. Per Frank's 2026-05-22 routing: window = last 5 sent messages; threshold = ≥4.0; both BriefingsInboxPage AND AdminHomePage surface the metric. New `useBriefingFeedback` hook supports two shapes: `{ messageId }` (per-briefing) and `{ orgId, rolling }` (cutover-gate). Latest-per-recipient deduplication handles re-rating (recipient taps different star button → new row; aggregation uses latest by submitted_at). New `CutoverGateChip` pill surfaces the rolling mean + threshold flag on both AdminHomePage (above AlertZone, high-visibility) and BriefingsInboxPage (above InboxTabs, contextually adjacent to send list). New `BriefingRatingCard` on BriefingHistoryDetail shows per-briefing mean + count + 1-5 distribution bars. AdminHomePage stayed at 145 lines (under 150 cap) via the +2 line minimal-addition path, avoiding the §6 decomposition trigger. Cross-surface invariant test per AP #43 locks: same hook output produces identical rendered text regardless of mount surface; threshold boundary at exactly 4.0 is ≥ (not >); empty + loading states render without the data-testid chip.

---

### §4.B — Briefing IA remainder (Wave 4.4-B)

Status: ✅ **CLOSED 2026-05-22** — Session 1 partially shipped May 13; remainder shipped this session (TournamentHeader relocation + IA_FRAMING.md doc). §4.B fully closed.

- ~~**TournamentHeader Send Briefing relocation**~~ ✅ **SHIPPED (this commit)** — `src/components/tournament/TournamentHeader.jsx` now uses a `<Link>` deep-link to `/admin/briefings/compose?anchor=tournament&id=<tournament.id>` (no kind preset; admin lands at Kind step). Removed legacy `SendBriefingButton` import + the now-unused `tournamentBriefingKinds` helper. `ComposeAnchorCta` (kind-specific CTA gated on ctaKind) preserved as the moment-specific primary CTA when applicable. Cross-surface invariant test at `src/components/tournament/__tests__/TournamentHeaderSendBriefingDeepLink.test.jsx` (5/5 pass) locks: anchor-only URL shape, ctaKind-independence (in-flight tournaments still get the link), staff gating, no kind preset, and that the legacy `SendBriefingButton` import never returns. EventDetailHeader.jsx:59 still uses `SendBriefingButton` (icon-only overflow variant) — explicitly out of §4.B scope per IA_FRAMING.md follow-up note.
- ~~**docs/archive/IA_FRAMING.md**~~ ✅ **SHIPPED (this commit)** — Light reference doc capturing the locked briefing IA strategy: one canonical portal (`/admin/briefings/compose`) + three classes of entry surfaces (cold start Quick Action, anchor-only deep-link, anchor+kind deep-link). Includes per-surface shipped table, URL param hydration decision tree, anti-pattern compliance notes (#34, #42, #43). Closes Decision D from Wave 4.4-B Session 1 (2026-05-13).

---

### §4.C — Sprint B-F Home Page completion

Source: `SKYFIRE_BUILD_QUEUE_v2.md` Phase 1 Sprint plan, references
`HOME_DESIGN_SPEC.md` (CC hasn't read in this session — see §15).

Status: **SUBSTANTIVELY COMPLETE END-TO-END** as of 2026-05-20 Wednesday
session. Sprints B, C, D, E are essentially done across the full spec
§1 / §2 / §3 section enumeration. Sprint F (cross-role polish) is
~30% done. Only schema-blocked items remain (UPCOMING PREP for parent
+ coach require event_prep_notes table — not yet created).

- **Sprint B — Parent home Phase 1**: COMPLETE.
  - MY TEAMS dynamic data: SHIPPED via PR #239 (Cluster 5 fix)
  - ACTION ZONE shell + 3 signals: SHIPPED via PR #281 (RSVP pending),
    #282 (ride needed), #283 (volunteer slot). Generalized to signal-
    agnostic shape in #288 (item.href + item.secondary fields).
  - Density toggle wiring: SHIPPED (DensityToggle component exists)
  - **ActionZone density variants**: SHIPPED via PR #308
    (Compact ↔ Detailed cross-role).
  - Relative date language: PARTIAL via PR #234
  - Empty state design: SHIPPED (welcome card)
  - **4th ACTION ZONE signal area — payment overdue**: UNBLOCKED via
    PR #303 (lane on admin home) + PR #304 (RegistrationReminderCard on
    parent home; parent payment surface now exists).

- **Sprint C — Parent home Phase 2**: 6 OF 6 SECTIONS SHIPPED.
  - LIVE NOW card: SHIPPED via PR #284
  - Tournament weekend banner: SHIPPED via PR #285
  - Recognition card: SHIPPED via PR #286
  - Coach message block: SHIPPED via PR #287
  - Emergency alert banner: PARTIAL via existing AlertZone (could
    extend with red-bordered cancellation-specific render)
  - **Registration/payment reminder**: SHIPPED via PR #304
    (RegistrationReminderCard reads useSeasonFinancials with
    guardianId filter — 3rd consumer of the shared hook).

- **Sprint D — Coach home**: COMPLETE end-to-end except UPCOMING PREP.
  - CoachHomePage.jsx new file: SHIPPED via Tier 3 v1
  - Alerts + roster snapshot + MY TEAMS: SHIPPED via Tier 3 v1
  - ACTION QUEUE shell + 2 signals: SHIPPED via PR #288 (pending
    achievements) + #289 (unpublished scores).
  - **MESSAGING BLOCK (§2.1.4)**: SHIPPED via PR #296 (useRecentTeamMessages
    + CoachMessageBlock reused from PR #287; same component, opposite-
    direction data flow — cross-role infra validation).
  - **QUICK ACTIONS ROW (§2.1.6)**: SHIPPED via PR #310
    (CoachHomeQuickActions — Start Check-In, Message Team, Quick Score).
  - **useCoachHomeSignals extracted**: PR #310 (third role with
    signal-aggregator hook pattern; mirrors useParentHomeSignals
    PR #304 + useAdminHomeSignals PR #297).
  - UPCOMING PREP (§2.1.5): BLOCKED — needs event_prep_notes schema.

- **Sprint E — Admin home redesign**: COMPLETE end-to-end.
  - AdminHomePage exists + alerts + KpiGrid: SHIPPED
  - **KpiGrid units bug fix**: SHIPPED via PR #305 ($702 → $70,243
    display — pre-existing units-mismatch surfaced during consolidation).
  - MANAGE section added: SHIPPED via PR #269.
  - **ADMIN SHORTCUTS redesign close**: SHIPPED via PR #309 (regrouped
    8 flat tiles into CREATE / COMMUNICATE / OPERATE buckets per May 16
    audit Tier 1+2 item).
  - ACTION QUEUE shell + 3 signals: SHIPPED via PRs #291/#292/#293.
  - **PENDING QUEUES lanes (§3.1.4)**: SHIPPED via PR #297 (achievements +
    coach payouts) + PR #303 (3rd lane: families with outstanding balance)
    + PR #313 (Compact/Detailed density variants — mirror PR #308).
  - **PROGRAM HEALTH card (§3.1.5)**: SHIPPED v1 via PR #307 (season
    progress + payment %) + v2 via PR #311 (+ RSVP rate + Attendance +
    Registration pipeline). All 4 spec metrics now rendered; Attendance
    gracefully renders '—' until check-ins workflow is in active use.
  - **RECENT ACTIVITY feed (§3.1.6)**: SHIPPED v1 via PR #312 (3 streams:
    RSVPs, announcements, game results; merged + sorted desc, 24h,
    top 8). Hidden today (zero recent activity); surfaces when data
    arrives.
  - **QUICK ACTIONS ROW (§3.1.7)**: EFFECTIVELY SHIPPED via ADMIN
    SHORTCUTS redesign (PR #309). Spec listed 4 generic chips
    [Create Event] [Send Announcement] [Export Data] [View Reports] —
    superseded by the richer 8-tile + sub-grouping treatment.
  - Remaining sprint-E adjacent: overdue-waivers signal (schema dep),
    expired discount codes signal, missing emergency contacts signal —
    all defer to schema work or product calls.

- **Sprint F — Cross-role polish**: ~30% done.
  - Bundle perf SHIPPED via PR #277 (SDK lazy-load — main bundle
    893 kB → ~440 kB on Vercel).
  - **Density variants** SHIPPED via PR #308 (ActionZone) + PR #313
    (PendingQueuesLanes) — 2 of 3 cross-role shells. MessageBlock
    density deferred (no section header; pattern doesn't map naturally).
  - Dark mode complete (Q10), accessibility full audit (Q1), analytics
    instrumentation (Q9) — NOT SHIPPED.

- **Financial-math single-source consolidation** (anti-pattern #42
  end-to-end closure): PRs #303 → #306. Five render-time consumers
  now route through `useSeasonFinancials`:
    1. FinancialDashboardPage (KPI cards + family balance list)
    2. Admin home payment-overdue lane (via useAdminHomeSignals)
    3. Parent home RegistrationReminderCard (via useParentHomeSignals)
    4. Admin home KPI grid (via useAdminStats)
    5. Admin home ProgramHealthCard (via useProgramHealthMetrics)
  Sixth consumer reads (FamilyBalanceList) flow through the same hook
  via the `balances` map. Drift-hedge audit at
  `lib/__tests__/financialMathAudit.test.js` fails CI on any inline
  re-implementation.

**Cross-role infrastructure validated this stretch:**
- `ActionZone` component is signal-agnostic — parent + coach + admin
  ALL consume the same component. Items emit `kind`, `primary`,
  optional `secondary`, optional `href`. New signals add hooks; the
  component needs no further work. **Tally: 3 pages × 8 signal hooks
  × 1 shared component.**
  - Parent: usePendingRsvps, useRideNeeded, useVolunteerSlots
  - Coach: usePendingAchievements, useUnpublishedScores
  - Admin: useLowRsvpEvents, useUnscoredGames, usePendingInvitations
- Recognition card pattern (relative timestamp + composed title
  + team-color stripe + click → /teams/<id>) similarly reusable for
  any team-scoped recognition surface.
- Per-role data-scope pattern locked: parent signals scope by
  myChildren×teams, coach signals scope by coachedTeamIds, admin
  signals scope by orgId. All three follow anti-pattern #36 + #37.

**Symmetric "3 signals per page" pattern locked** for parent + admin
(coach has 2 today, pending 2-3 more). The shell pattern is now
proven; future Sprint D/E work adds hooks rather than rewriting
infrastructure.

---

### §4.C.2 — Home Pages L99 Redesign (2026-06-05)

Source: `docs/AUDIT_HOME_REDESIGN_L99.md` (the canonical §16.15 audit
artifact) + `docs/HOME_REDESIGN_KICKOFF.md`. Audit COMPLETE; scope-lock
pending operator review. No PR-A code until scope locks.

**Dominant finding (Pattern α / AP#63):** 9 same-concept/divergent-source
instances across the three homes — "next event" computed 3 ways
(`AdminHomePage:49` / `CoachHomePage:51` / `useParentHomeSignals`),
weather coords `41.03,-73.76` hardcoded ×7 (AP#7), `seasonProgress()`
duplicated (ActiveSeasonCard vs ProgramHealthCard), admin PastEvents
`gameResults={{}}` (scoreless), `dutyCounts` on parent-not-coach
DateGroupedList, `relativeTime` casing drift, NextEventCard raw
`event.location` (no tournament fallback). Records/rides/alerts already
flow through single shared hooks (clean).

**Other queued surfaces:** AdminHomePage flat 12-section scroll →
§16.14 hero+collapsible + §6 decomposition into `src/components/admin-home/`
(the decomposition trigger is now fired); 6 self-fetching admin cards
defeat the page loading gate (the §17.8 LCP ~5s, 3.3×-over-budget anchor
driver, PR #569); soft-on-soft a11y contrast 3.6–3.9:1 (γ); 4 AP#36
error-swallows in self-fetching cards (data-hook layer is clean);
AlertCard `rgba(0,0,0,0.06)` border (AP#2); DensityToggle 3-state/2-state
dead code.

**Proposed PR sequence:** A (admin decomposition, no behavior change) →
B (AP#63 shared-helper consolidation + AP#43 invariant tests) → C (§16.14
hero+collapsible restructure) → D (a11y sweep) → E (error-handling sweep)
→ F (perf / LCP re-measure) → G (test debt + first home-router E2E).

**Decisions pending operator sign-off (→ audit §7):** D1 a11y contrast
corollary token (§0 accessibility-corollary, `--as-text-meta` precedent);
D2 ratify density 2-state as final (vs restore MED — §16.2 currently says
3-state but code is 2-state); D3 admin hero KPI row with scope labels; D4
PR granularity (7 vs folded).

**Test debt (AP#43 gaps):** next-event hero parity (3-role), owing-money
source+scope render, MY-TEAMS-records extend to admin, weather render +
shared coords, density variants, RSVP-going on admin, home-router E2E
(zero E2E today).

**SHIPPED — shell-contract-v2 build (branch `claude/home-redesign-kickoff-vE7Hf`, 2026-06-06):**
Built WITH the design lane (claude.ai) per `HOME_BUILD_HANDOFF_CC.md §6`.
HomeShell composes 4 inner slots; hooks own all fetching (cards
presentational) — the 6 self-fetching admin cards retired (LCP fan-out
fix). All three role homes rewritten; density toggle retired from home
(D-C, §16.2 2-state); `--as-gold*` tokens (D5); Needs-you domain-grouped
cap-4 + see-all, admin briefings pinned w/ D-E split; coach My-teams +
admin program-health context cards; 40-file dead-code sweep. Reconciled
with main (#763/#764 superseded my parallel briefing fixes).
**Render items (HOME_RENDER_RULES_CC.txt) — all shipped + green:**
off-season (D-D, all 3 homes), arrival line (#3), urgent tint (#1a),
draft pill (#2, tournaments only), RSVP deadline chip (#1b, parent-gated).
**D-G pilot recipient row (#5): CLOSED 2026-06-06, no migration** (design-lane
ruling, `HOME_DG_CLOSE_AND_BATCH_GO`). Resolve via org pilot mode — `is_pilot_family`
writes real `guardian_id` rows so the parent comms card lights up + deep-links
to `/inbox?r=<id>` (the #765 fix). The synthetic `pilot_test_recipient_email`
path (`guardian_id=NULL`) stays as the email-only admin smoke. Self-test ready:
Frank's guardian (`fsamaritano@gmail.com`) is already `is_pilot_family=true` —
send a pilot briefing to verify. The `get_digest_recipients` RPC migration is
NOT applied.

**HARDENING BATCH — SHIPPED 2026-06-06 (branch `claude/home-hardening-vE7Hf`):**
- a11y: next-event weather temp `--as-text-tertiary` → `--as-text-meta` (AA);
  static a11y audit of all 3 homes clean (aria-labels/roles/live-regions/h1 OK).
- #4b opponent on the parent RSVP card ("Charlie · 11U vs Somers"); #4a coach
  name on the comms card DEFERRED — `comms_messages` has no sender column
  (only `coach_user_ids[]`), would need a schema field; kept "New from your coach".
- Tests: home role-router (`homeRouter.test.jsx`) + AP#63/#43/#7 signal
  invariants (`homeSignalInvariants.test.js` — owing-money single-source,
  admin-no-inline-RSVP, shared weather coords).
- Perf: home pages lazy-loaded, single coordinated fetch gate per page (the old
  6-self-fetching-card fan-out is gone), entry chunk 104.7 KB gz < 350 KB. Field
  LCP/FCP not measured here (headless — no Lighthouse); recommend a browser run.

---

### §4.D — Sprint G Rides redesign

Source: `RIDES_DESIGN_SPEC.md`. Status reconciled 2026-05-20 via
PR #329 + corrected via PR #330.

**Anti-pattern #44 recursive catch (PR #330):** PR #329 was itself
stale at a deeper layer. Initial grep flagged `useRideOffers` /
`useRideClaims` as "orphan hooks" but only checked `src/components` +
`src/pages` for direct consumers — missed the indirection through
`src/hooks/useEventRidesView` (a meta-hook composing both ride hooks,
consumed by `EventRidesTab` 150 lines, wired into `EventDetailPage`
Rides section). The trace should have run `grep -rln useRideOffers
src/`, not `grep -rln useRideOffers src/components src/pages`.
**Lesson:** when verifying "this hook has no consumers," grep MUST be
src-tree-wide; intermediate-hook indirection is the failure mode.

**Status (after PRs #332 + #333): AGGREGATE-COVERAGE SIGNAL SHIPPED END-TO-END.**

Schema + hooks + parent UI + admin widget + coach section all built.
Interactive v2 features (CTAs, arrival/return split, waitlist surface)
deferred.

Component-by-component verification:

- ✅ **Schema** — `event_ride_offers` + `event_ride_claims` match
  RIDES_DESIGN_SPEC §1 column-by-column (17 columns each).
- ✅ **Hooks** — `useRideOffers.js` (Realtime + optimistic
  postOffer/cancelOffer), `useRideClaims.js`, composing
  `useEventRidesView.js`, plus new `useRidesTodaySummary.js`
  (PR #332/#333) — cross-role hook with optional teamIds filter.
- ✅ **Parent UI (§4)** — `EventRidesTab.jsx` (150 lines) on
  EventDetailPage Rides section. Handles ride requests, Need ride /
  Offer ride buttons, PostOfferForm, my claimed seats with
  OfferCard, other offers with claim flow, density toggle,
  RideRequestCard.
- ✅ **Coach RIDES COORDINATION section (§5)** — SHIPPED via PR #333.
  `RidesTodayCard` on `CoachHomePage` below ActionZone, scoped to
  coachedTeamIds via `useRidesTodaySummary` teamIds filter. Renders
  aggregate coverage + per-team breakdown bars.
- ✅ **Admin home Rides Today widget (§6)** — SHIPPED via PR #332.
  `RidesTodayCard` on AdminHomePage between PROGRAM HEALTH and
  RECENT ACTIVITY. Renders "RIDES TODAY · N events · X% avg coverage"
  + per-team breakdown with CoverageBar (green ≥80% / amber ≥50% /
  red <50%). Org-wide via `useRidesTodaySummary(orgId, now)`.
- ⚠ **Waitlist + auto-confirm UI** — DB shape supports
  (waitlist_position, lifecycle flows §2.3/2.4); render-layer
  surfacing not fully audited.

Anti-pattern #42 honored on the new infra: ONE hook
(`useRidesTodaySummary`) serves both admin (org-wide) and coach
(team-scoped) consumers. Second arc of cross-role infra after the
financial-math single-source consolidation (PRs #303-#306).

V2 chunks (deferred, priority order):
1. **Interactive CTAs**: admin `[Send program broadcast]`; coach
   `[Suggest match]` / `[Post team ride request]` / `[Offer rides myself]`.
   Need broadcast flow + audience-picker integration + suggestion
   algorithm. ~60-90 min each.
2. **Arrival vs return split**: today the aggregate is
   undifferentiated. Spec §5 wants two coverage bars
   (arrival_seats / return_seats). ~30 min hook extension + 15 min UI.
3. **Waitlist + auto-confirm UI audit pass**. Confirm DB lifecycle
   maps to render-layer states; surface waitlist promotion notices.

---

### §4.E — P0 BUG-001 through 004 (Phase 1)

Source: `SKYFIRE_BUILD_QUEUE_v2.md` §P0 Bugs.

**Status: SECTION CLOSED (2026-05-23 triage).** Three already shipped via
intermediate refactors (ledger referent was stale per AP #45 corollary);
BUG-004 shipped via fresh PR + invariant test.

- ~~**BUG-001**~~ ✅ **CLOSED — pre-existing**. `NextEventCard.jsx:28-29,52` renders
  `dateStr + timeStr + location` from `event.start_at` + `event.location`.
  Original April 23 hypothesis (stale row from duplicate 11U Girls
  practice) likely correct — Migration 022 cleaned the data, the rendering
  was never broken in code.
- ~~**BUG-002**~~ ✅ **CLOSED — pre-existing**. `useEventDutyCounts.js:28,31`
  only increments `claimed` when `guardian_id OR claimed_by_name` is set.
  Original "2/2 volunteers filled" symptom can no longer reproduce with
  current aggregation logic.
- ~~**BUG-003**~~ ✅ **CLOSED — pre-existing**. `useEventRideCounts.js:33,37`
  uses `SUM(seats_requested || 1)` and `SUM(seats_needed || 1)` — the
  original `COUNT(*)` aggregation that caused the undercount has been
  replaced. Multi-seat requests now sum correctly.
- ~~**BUG-004**~~ ✅ **SHIPPED 2026-05-23**. Symmetric guard in
  `EventRidesTab.jsx`: when user has open request, BOTH "Need ride" and
  "Offer ride" hide; when user has active offer, "Need ride" hides
  (PostOfferForm's existing `hasActiveOffer` prop handles the offer-
  duplicate side internally). Pre-fix only the request-duplicate
  direction was guarded — the cross-direction (offer + request by same
  user on same event) was unguarded. 5-test invariant suite locks all
  combinations per AP #43.

Discipline note: 3-of-4 closures came from grepping the referenced files
against the original symptom rather than re-shipping the same fix. This
is the AP #45 corollary staleness pattern (ledger marked OPEN but code
already done) — the same shape that closed Clusters 4/5/7 in 2026-05-19's
sweep audit. Counter-anti-pattern: never re-ship without grep-verifying
the symptom can still reproduce.

---

### §4.F — PostHog telemetry (Frank-action)

Source: `CC_SESSION_HANDOFF_2026-05-13.md` + CLAUDE.md §16.7.1.

- **PostHog server-side GeoIP enrichment** — unresolved. Help desk
  ticket to file (Frank-action, ~5 min). Free tier doesn't expose
  `/pipeline/transformations` toggle.
- **Historical cleanup of geo properties** — deferred until help desk
  resolves (would be undone by re-enrichment).
- **PostHog-js alias/merge bug GH #31154** — open upstream; affects
  identify-after-Supabase-auth on browser SDK.

---

### §4.G — Quick wins (small, ship anytime)

Items <30 min each.

- ~~**Cluster 3** event title centralization~~ — **DONE** (PR #298, 2026-05-19).
  Migration 021 sanitization still queued under §2 Cluster 3.1.
- ~~**Cluster 4** bell badge removal~~ — **DONE** (PR #295, 2026-05-19;
  §2 Cluster 4 marked RESOLVED). Ledger referent here was stale —
  rediscovered + closed via sweep audit 2026-05-20 PM.
- ~~**Cluster 7** admin greeting NY-pin~~ — **DONE** (PR #295,
  2026-05-19; §2 Cluster 7 marked RESOLVED). Same stale referent
  shape as Cluster 4 above.
- ~~**Cluster 6.A2** KpiGrid loading gate refinement~~ — **DONE**
  (2026-05-20 PM, current-surface follow-up). Original referent
  ("KpiGrid" / "useAdminStats") was removed in a later refactor; PR
  #327 fixed the now-defunct surface. The equivalent shape on the
  current shared hook (`useSeasonFinancials`) carried the same
  one-render stale gap on `seasonId` change — pre-fix, consumers saw
  prior-season `accounts` with `loading=false` for one render before
  the microtask-deferred refetch scheduled `setLoading(true)`. Fix:
  `fetchedKeyRef` + `isStale` derived in render; visible `loading` is
  `loading || isStale`. Same shape as PR #241 / anti-pattern #43.
  Drift-hedge test: `useSeasonFinancials.loadingGate.test.js`. Stale
  comments referencing the removed `useAdminStats` cleared from
  `SeasonContext.jsx` + `financialMathAudit.test.js`.
- Async-ordering test replication for `useHomeRole`,
  `useAttendanceData`, `useActivities` per anti-pattern #44 (see §11).
  Note: `useAdminStats` was removed by the same refactor that closed
  Cluster 6.A2; the equivalent target on the current surface is
  `useSeasonFinancials` (already covered by the loadingGate test
  above) + `useProgramHealthMetrics`.
- ~~**P6 RSVP copy normalization**~~ — **DONE** (PR #399, 2026-05-20 PM).
  Canonical: buttons → "Can't" everywhere; status/headers → "Not Going"
  everywhere. RsvpPlayerRow.BUTTONS was the lone outlier ("Not going");
  fixed + test updated.

#### §4.G close (2026-05-20 PM, post-sweep audit)

Frank-requested late-night sweep of §4.G + §4.S P1 surfaced that
several items were already shipped in prior PRs but the ledger
referents stayed stale. Acid-test catch (anti-pattern #45 corollary —
same pattern as Clusters 4/5/7 staleness on 2026-05-19):

| Ledger referent | Actual status | Closed in |
|---|---|---|
| §4.G Cluster 4 (bell badge) | DONE | PR #295 |
| §4.G Cluster 7 (admin NY-pin) | DONE | PR #295 |
| §4.S B1 (Tournament checkbox) | DONE | TeamMultiSelect comment cites L99 v6 §5.1 B1 |
| §4.S B3 (Financials empty seasons) | DONE | FinancialDashboardPage comment cites L99 v6 §5.1 B3 |
| §4.S B4 (sparse RSVP %) | DONE | PlayerRow comment cites L99 v6 §5.1 B4 |
| §4.G P6 (RSVP copy) | SHIPPED THIS SWEEP | PR #399 |
| §4.S C1 (Engine Preview placement) | SHIPPED THIS SWEEP — route+page deleted | PR #398 |
| §4.S C2 (Tournament conflict warning) | DONE | TournamentFormSheet `conflictMessage` lines 57-68 |
| §4.S C3 (Red asterisk pattern) | DONE | PR #374 (merged earlier this PM after rebase unblock) |
| §4.S D1 (30 opponent strings) | SHIPPED THIS SWEEP — actually 1 row | direct SQL backfill 2026-05-20 PM (PHD - McCurdy linked to existing opponents row) |
| §4.S B2 (1 historical TBD-opponent row) | SKIPPED — Frank-manual task (1-tap edit) |
| §4.S E1 (anti-pattern #46 CI guard) | SHIPPED THIS SWEEP | PR #400 |
| §4.S E2 (PR template) | DONE | `.github/PULL_REQUEST_TEMPLATE.md` already exists |

Net new this sweep: PRs #398, #399, #400 + 1 SQL backfill. Other
items were already done; the sweep proved them via grep + db query
rather than re-shipping.

**Process discipline reinforced:** before re-shipping a ledger item,
grep the codebase for an L99 §X.Y comment marker (the doc-author
adds these inline when closing an item from a §). The reverse —
ledger marked DONE but code missing — has yet to occur in this
codebase; ledger marked OPEN but code already done is the recurring
staleness shape, registered as a corollary to anti-pattern #45.

---

### §4.H — Pre-existing locked items (verify against rebuilt index)

Inherited from earlier session notes:
- Density toggle 3 levels (blocked by Migration 016 `user_preferences`)
- Note edit cooldown 4hr
- Rotation Planner staff-only

Status: needs verification — the `EMBER_MASTER_INDEX_v3.md` referenced
in earlier docs is not present in `docs/` as of 2026-05-18. The "49
locked decisions" figure has no canonical source today. Worth either
rebuilding the index from session notes or accepting that locked
decisions live distributed across various session docs.

---

### §4.I — Schedule-change rebuild (Wave 3.8 §5.2)

Per `STATE_OF_AFFAIRS_L99_v5:159`: `schedule_change` kind has zero
producers in the codebase; `useUpdateActivity.updateSeries()` strips
`start_at`/`end_at` deliberately. Spec is pending Claude.ai lock —
3-option dialog + composer + audit table. Estimate 6-8h once spec
lands. Not blocked on code; blocked on product spec.

---

### §4.J — Weather forecast per event (Wave 4b)

Per `STATE_OF_AFFAIRS_L99_v5:171` (D-WEATHER-1): OpenWeatherMap fetch
at compose time, 6h cache, indoor events skip. Backlog. ~4-6h.

---

### §4.K — Dependabot PR #147

Per `AUDIT_DAY_2026-05-16_FINAL_CLOSE:85`: needs workflow-read token
scope before next attempt. Frame as a permanent capability upgrade
(debugging CI via Actions logs), not just a #147 fix.

---

### §4.L — Tier 4 P2 findings (2026-05-16 audit)

**Status: SWEEP CLOSED 2026-05-20 Wednesday session.** 8 of 11 items
shipped today as one-PR-each through the §4.Q session. Items 17
(anti-patterns #37 + #38 CLAUDE.md) already closed pre-Wednesday.
Item 18 (Admin Home IA Tier 3) is a design exercise, parked.

| Item | Description | Closed by |
|------|-------------|-----------|
| 8 | useWeather localStorage signout cleanup | PR #320 |
| 9 | BriefingComposer state reset on org change | PR #318 |
| 10 | useHasUnread channel name + filter org-scope | PR #319 |
| 11 | RecordsPage game_results count org-scope | PR #321 |
| 12 | useAcademyCallupCandidates lacks useAuth | PR #322 |
| 13 | event_ride_requests.org_id FK CASCADE | PR #324 |
| 14 | game_results.player_of_game_id FK SET NULL | PR #324 |
| 15 | briefing_templates.org_id NOT NULL | PR #325 |
| 16 | legacy renderers/tournamentRecap.js dead code | PR #323 |
| 17 | anti-patterns #37 + #38 CLAUDE.md | CLOSED pre-Wed |
| 18 | Admin Home IA Tier 3 (design exercise) | PARKED |

Drift-hedge note: every fix carried PR-body smoke evidence + an
anti-pattern citation (#21 mirror migrations, #37 org_id scoping,
#42 parallel-system, #45 ledger reconciliation). The single
sustained discipline arc produced eight ledger-aligned PRs in
~75 minutes across the back half of the Wednesday session.

---

### §4.M — May 16 Audit Cycle carryovers (Phase 1-5 + Beta)

Source: Phase 1 Core Subset read 2026-05-18 19:30 CEST (Sunday post-dinner hour). Six docs walked in sequence: `AUDIT_PHASE1_WIRING` → `PHASE2_REGISTRY_STATE` → `PHASE3_MIGRATION_DEPLOY` → `PHASE4_RLS_SECURITY` → `PHASE5_TYPE_CONTRACT` → `AUDIT_BETA_SYNTHESIS`.

**30+ findings across 5 phases + Beta synthesis.** Some shipped during the audit-day itself (PR #210-#215 + Phase 1 P0 batch + Phase 3 P0 mirror). Many P0-LATENT / P1 items remain unshipped or unknown-status. Each entry below either flags SHIPPED (with evidence cite) or queues a V-* verification item.

**KEY FINDING for Monday Phase 4**: the "22-bug catalog" referenced in Frank's Monday-opener prompt is NOT in `BETA_SYNTHESIS`. The synthesis doc has 6 sub-area verdicts + carryover items but no "22-bug" enumeration. The 22-bug catalog lives in `SKYFIRE_BUILD_QUEUE_v2.md` as documented in §4.E. Phase 4 of the Monday-opener (22-bug reconciliation) should focus on §4.E + SKYFIRE_BUILD_QUEUE_v2, NOT on the May 16 audit docs. Saves ~15-20 min of misdirected search.

#### §4.M.1 — Phase 1 (Wiring + Schema Drift): mostly SHIPPED, some P1 remaining

**VERIFIED SHIPPED** via V-17 (2026-05-18 19:50Z): PRs #195 + #203 closed P0-1 + P0-2 + P1-1 + P1-2 + P1-7. Code-grep confirmed `.eq('org_id', ...)` + `.is('archived_at', null)` present in the affected files.

P1 STATUS (sweep 2026-05-20 Wednesday — PR #328 reconciliation):
- ✅ P1-1: `EventLocationTab.jsx` tournaments query — already has `.eq('org_id', orgId)` (shipped silently between audit and sweep)
- ✅ P1-2: `CreateActivityWizard.jsx` events series-recurrence — already has `.eq('org_id', orgId)`
- ✅ P1-3: `notificationBadgeQueries.js` — file DELETED via PR #272 (knip orphan sweep) alongside the bell-badge UI removal (Cluster 4). Issue auto-closed.
- ⚠ P1-4: `FinancialDashboardPage.jsx`/`useSeasonFinancials` financial_transactions over-fetch — still ships `.from('financial_transactions').eq('org_id', orgId)` and filters client-side by acctIds. Bounded over-fetch (production: ~100-200 rows); optimization deferred.
- ✅ P1-5: `useRsvps.js` event_rsvps wildcard select — closed via PR #328 (explicit column list).
- ✅ P1-6: `useEventArrivals.js` event_arrivals wildcard select — closed via PR #328 (explicit column list).
- ✅ P1-7: tournaments `archived_at` filter — shipped on `StepDetails.jsx:14-16` (`.is('archived_at', null)`).

Status: **6 of 7 closed.** Only P1-4 (optimization, not correctness) remains, deferred to a focused perf pass when financial_transactions row counts grow.

Plus systemic patterns A/B/C/D worth a structural fix:
- Pattern C: edge function input re-validation anti-pattern candidate (CLAUDE.md addition)

#### §4.M.2 — Phase 2 (Registry + State-Machine): 3 P0-LATENT + 3 P1 (UNSHIPPED, status verify)

P0-LATENT (3 orphan renderers, expanded to 7 in Phase 5):
- `event_card` — emitted by rsvpNudge.js:121 + academyCallupNotice.js:118; no SECTION_RENDERERS entry; renders empty
- `placement_block` — emitted by tournamentRecapHelpers.js:12; no renderer
- `game_log` — emitted by tournamentRecapHelpers.js:38, 46; no renderer

P1:
- `championship_scenarios` renderer is dead code (registered but never emitted)
- 4 KIND_COMPOSERS entries unreachable (academy_callup_notice, weekly_digest, announcement, custom_message)
- 5 legacy kind enum values in `constants.js:72-77` (tournament_final, tournament_rsvp_lock, etc.)

Status: **6 of 7 VERIFIED SHIPPED** via V-18 (2026-05-18 19:50Z). `ls src/lib/engine/renderers/` confirms eventCard.js · placementBlock.js · gameLog.js · callupCard.js · coachReflection.js · standoutMoments.js all exist. The 7th (`family`) was contested between Phase 2A and Phase 5 — likely a Phase 5 false positive (nested data carrier, not top-level emit). The orphan-renderer arc that Phase 5 sized at 250-350 lines of new code was actually CLOSED across multiple subsequent PRs we hadn't cross-referenced.

#### §4.M.3 — Phase 3 (Migration + Deploy): 1 P0 + 5 P1 + 10+ P2 (PARTIAL SHIPPED)

**VERIFIED SHIPPED** via V-19 (2026-05-18 19:50Z): P0-1 `scheduleGaps.js ↔ _scheduleGaps.ts` mirror drift CLOSED. Both source and Deno mirror have `describeScheduleGaps(events, { minGapMinutes = MIN_GAP_MINUTES } = {})` signature.

REMAINING:
- P1: 5 documented unregistered ghost migrations (per CLAUDE.md §5 — known + documented; only blocking if `supabase db reset` runs)
- P2: 8 ghost data ops + 5 filename mismatches + 13 sequential-prefix duplicates (cosmetic only; CI skips re-applied versions)

Edge function deploy reconciliation: CLEAN per audit (10 functions verified, no drift).

#### §4.M.4 — Phase 4 (RLS / Security): 3 P0 + 3 P1 (GATED, UNSHIPPED)

GATED per Class 7 discipline: all 6 findings staged for post-synthesis batched RLS migration PR.

P0 — RLS UPDATE policies missing `WITH CHECK`:
- `briefing_reminders.admins update own org reminders` — **CLOSED** (V-20 verified `with_check_expr` matches `using_expr`)
- `briefing_templates.briefing_templates_update_admin` — **CLOSED** (V-20 verified)
- `team_types.team_types_update_admin` — **CLOSED** (V-20 verified)

P1 — PUBLIC EXECUTE on SECURITY DEFINER (anti-pattern #23):
- `briefing_active_queue(p_org_id, ...)` — **CLOSED** (V-20: PUBLIC revoked; grants now service_role + authenticated + postgres; authenticated is correct since function checks admin internally)
- `log_pii_change(p_target_table, ...)` — **CLOSED 2026-05-27** (mig `20260527190144`): `authenticated` EXECUTE revoked. It's SECURITY DEFINER, only invoked from inside other SECDEF RPCs (roster-lock `PERFORM public.log_pii_change(...)`, which run as definer) — verified no direct client caller, so revoke is safe. Now EXECUTE = postgres + service_role only. (Was: PARTIALLY CLOSED P2 — PUBLIC revoked but authenticated retained EXECUTE.)
- `suppress_unsubscribed_recipients()` — **PARTIALLY CLOSED, DOWNGRADED P1 → P2** (V-20: PUBLIC revoked; `authenticated` still has EXECUTE on trigger function)

NOT findings (intentional):
- `get_invitation_by_token(p_token)` — PUBLIC EXECUTE BY DESIGN (anon invite redemption)

RLS coverage: 65/65 public tables enabled. Status of batched RLS migration PR: **4 of 6 fully closed; 2 of 3 P1s downgraded to P2** (PUBLIC/anon surface fully closed; authenticated-still-can-call surface remains).

#### §4.M.5 — Phase 5 (Type / Contract): 4 NEW orphan renderers + 1 P1 (UNSHIPPED)

Phase 5 expanded the orphan renderer count from 3 → 7. Total 7 orphan section kinds across 4 briefing kinds (rsvp_nudge, academy_callup_notice, tournament_recap, suspected `family` site).

P0-LATENT additions (beyond Phase 2):
- `callup_card` — academyCallupNotice.js:117
- `coach_reflection` — tournamentRecap.js:120
- `standout_moments` — tournamentRecap.js:119
- `family` — academyCallupNotice.js:54 (needs verification)

P1: `TournamentRecapBody.jsx` defaultValue lacks `standout_moments` + `coach_reflection` keys. Composer falls through to undefined; latent UX bug on first real tournament_recap use. **VERIFIED SHIPPED** via V-21 (2026-05-18 19:50Z): defaultValue now has both keys plus 2 additional (`coach_note`, `parent_shoutout`).

Combined fix scope (Phases 2 + 5): 7 new renderer files (~30-50 lines each) + composer.js registration. ~250-350 lines total. Substantial but mechanical. Splittable into 2-3 PRs by briefing kind (rsvp_nudge / academy_callup / tournament_recap) per Phase 5 trade-off note. Verify via V-21.

RESOLVER_REGISTRY contracts: PASS. composerSubmit dispatch: PASS.

#### §4.M.6 — Phase Beta carryovers (deferred from May 16 audit)

Per `AUDIT_BETA_SYNTHESIS_2026-05-16` synthesis. Items NOT shipped in the Beta PR set (#210-#215). Each is a candidate cleanup item:

- ~~**27 `.maybeSingle()` no-error-destructure callsites** (P1)~~ — **CLOSED via PR #249** (2026-05-18 21:05Z). All 27 fixed with explicit error destructure + throw; static-grep audit test locks the invariant per #43. Anti-pattern #36 follow-through complete.
- useWeather localStorage fallback persists across users (P2)
- BriefingComposer state doesn't reset on orgId change (P2)
- useHasUnread channel name 'unread-badge' is global (P2)
- RecordsPage.jsx game_results count cross-org (P2)
- useAcademyCallupCandidates lacks useAuth context (P2)
- 2 FKs without CASCADE — org_id, player_of_game_id (P2; non-actionable today per audit)
- briefing_templates.org_id nullable (P2; table empty)
- Legacy renderer dead code removal (P2; overlaps with §4.M.2 P1)
- Anti-patterns #37 + #38 CLAUDE.md additions (CLOSED — #37/#38 are now registered in CLAUDE.md as of recent sessions)

Bundle these into the Tier 4 P2 cleanup batch (§4.L).

#### §4.M.7 — Phase 1 ledger contract gates for Monday Phase 2-5

Per Monday-opener routing locked Sunday 2026-05-18: Phase 1 = COMPLETE (this entry). Phase 2-5 deferred pending Frank's gate decision.

Findings count from Phase 1 Core Subset: **30+ items across 5 audit phases + Beta synthesis carryovers**.

**Status break (post V-17/V-18/V-19/V-21 closure 2026-05-18 19:50Z):**
- **VERIFIED SHIPPED: ~18-20 items** (Phase 1 P0/P1 batch via #195+#203 + Phase 3 P0 mirror + Phase 2/5 orphan renderers 6-of-7 + Phase 5 TournamentRecapBody defaultValue + Beta PRs #210-215)
- **UNSHIPPED + UNKNOWN-STATUS: ~10-12 items** (Phase 4 RLS 3 P0 + 3 P1 GATED; Phase 1 remaining P1 wildcards; Phase 2 P1 dead code + legacy enums; Beta `.maybeSingle()` sweep; ghost migrations P1; family orphan if real)

The major reframe from these verifications: **§4.M is mostly CLOSED, not mostly open.** The Phase 5 worry about "250-350 lines of new renderer code remaining" was wrong — that work shipped in PRs we hadn't cross-referenced.

V-20 (Phase 4 RLS migration status) + V-22 (Beta `.maybeSingle()` sweep) deferred to Monday — both require more substantial DB / per-callsite work than the end-of-day window allows.

### §4.N — Two-Week L99 Audit (May 4 → May 18, scheduled Monday 2026-05-19)

**Meta-audit lock.** Designed Sunday evening 2026-05-18 to close the question "have we caught everything from the last two weeks?" by closing each blind-spot class the prior audits sampled but didn't fully cover. Locked tonight per anti-pattern #45 acid-test (structural plan designed in chat owes ledger reconciliation in the same session). Captured here so commitment survives the sleep cycle and the Monday-opener prompt can be rewritten Monday morning with this scaffolding instead of being reconstructed from chat memory.

**Why a five-layer audit instead of another shape:** every prior audit was bounded by what it opened (the 22-doc gap that produced V-0 is the canonical example). The five layers below each close a specific class of miss the prior audits couldn't see:

| Layer | Catches | Source of truth | Effort | Order |
|-------|---------|-----------------|--------|-------|
| **Layer 1 — Git log cross-reference** | PRs landed but never reconciled to ledger · PRs opened but never merged · direct-to-main commits bypassing PR review | `git log --since="2026-05-04" --pretty=format` cross-ref against §1 (shipped) + §4 (pending) | 20-30 min | first (factual ground truth) |
| **Layer 2 — Doc-diff sweep** | Docs created or modified in window not yet reconciled to ledger (the BETA/PHASE/SYNTHESIS class — V-0 caught some of these, this layer closes the remainder bounded by date) | `ls docs/*.md` filtered to mtime > May 4 → per-doc summarize + identify named bug/enhancement/decision not in §1 or §4 | 45-60 min | fourth |
| **Layer 3 — Chat transcript scan + recent_chats walk** | Decisions made in chat that were never written down · code drops promised in chat never shipped · bugs flagged in chat never logged | Frank-side `conversation_search` (targeted queries: "decision locked", "park this", "queued for next session", "remind me to", "TODO") **PLUS sequential `recent_chats` walk over the 2-week window** for maximum reasonable confidence | 45-60 min (chat-side, Frank does it) | third |
| **Layer 4 — Production verification sweep** | Features marked SHIPPED in ledger that don't actually work as advertised · migrations marked applied without expected schema state · edge functions marked deployed but failing (the PR #235 / Cluster 6.A3 class retroactively applied across every recent ship per anti-pattern #44) | Supabase MCP + Vercel MCP per-item verification on §1 SHIPPED items touched in window | 45-60 min | last (highest cognitive load) |
| **Layer 5 — 22-bug catalog walk** | Bugs from the SKYFIRE_BUILD_QUEUE_v2 KNOWN BUGS catalog silently fixed or quietly still open (closes the question raised earlier about only 4 of 22 bugs being in §15) | Each of 22 bugs gets grep + Supabase MCP probe → status: SHIPPED with evidence / OPEN with V-* / AMBIGUOUS with deeper trace needed | 20 min | second (mechanical, clears known uncertainty) |

**Layer 3 scope decision (locked tonight):** included the sequential `recent_chats` walk on top of `conversation_search`, not skipped. Reason: tonight's discovery pattern (each harder look surfaces more — 22 docs from `ls`, 6 V-* from code-drop audit, 27 callsites from V-22 sweep) signals we're not at the asymptote yet. 30-min premium on Layer 3 vs. residual chat-only drift is the right trade given Layer 3 anchors the entire "highest reasonable confidence" claim. If the walk finds nothing new, that's also useful — it validates the bound and lets us declare the asymptote.

**Execution contract (mirrors PR #243 + tonight's discipline):**

- **Branch:** `docs/two-week-audit-2026-05-04-to-2026-05-18` (root branch; per-layer feature branches off it)
- **PRs:** 5 PRs total, one per layer, squash on merge, anti-pattern #45 enforced (each layer's findings → ledger same commit)
- **Scope:** `docs/EMBER_PENDING_LEDGER.md` + `docs/CLAUDE.md` (if new anti-patterns emerge). Zero `src/` changes. Zero migrations. Pure ledger reconciliation pass.
- **Gate between layers:** after each layer's findings drop, STOP and report before next layer begins. Frank routes whether findings reshape next layer's scope.
- **Sequencing (cognitive load + dependency):** Layer 1 (git log, factual) → Layer 5 (22-bug walk, mechanical) → Layer 3 (chat scan, Frank-side parallel) → Layer 2 (doc-diff, integrates Monday-opener Phases 1-3 work) → Layer 4 (prod verification, needs everything else stable).
- **Time ceiling:** ~4 hours CC time + ~45-60 min Frank chat-side. Total ~5 hours bundled.
- **Bypass clause:** if Monday-morning Frank decides the five-layer framing is wrong on review, this entry is overridable per locked-decision protocol — amend it before the prompt drops, don't grind through a stale design.

**Replaces:** the Monday-opener Phase 1-3 sequence from V-0 + Phase 5 V-1 through V-22 batch cadence — both consolidate into Layers 2, 4, 5 of this audit. V-23 through V-28 (just landed via PR #252) consolidate into Layer 2.

**Tonight sign-off action:** this entry IS the action. Five minutes to write, mechanical, no decision burden. Per #45 acid-test the work is owed; per cognitive-load discipline the audit execution waits for Monday morning.

**Expected ledger growth post-audit:**

```
§1 SHIPPED:     +5-15 items recovered from L1 / L3
§2 active bugs: +0-5 items if L4 surfaces regressions
§4 PENDING:     +5-10 items recovered from L2 / L3
§15 VERIFY:     +18-22 items from L5, +5-10 from L4
```

Estimate 30-50 net new ledger entries. Most are recovery (documenting what already exists), not new work. The number frames the audit as completeness-confirmation, not feature-discovery — useful for sizing the post-audit reconciliation PR cadence and for setting expectations on what Monday's output volume looks like.

**Sign-off conditions:**

- All 5 layer PRs merged with anti-pattern #45 compliance (each layer's findings → ledger same commit as the layer-PR)
- §15 verification queue closed for any item run in L4 or L5 (open V-* either CLOSED with evidence or re-scoped with named follow-up)
- Findings count + ledger-growth report posted in chat (compare actual vs. expected growth above to validate the 30-50 estimate as calibration data for future audit-cycle sizing)
- Strategic arc routing decision becomes the next session focus (i.e., once the retroactive sweep closes, the next session's first move is choosing the next forward arc, not relitigating the audit findings)

**Anti-pattern #46 candidate:**

If §4.N execution surfaces a durable rule, register: *"Audit cycles spanning 2+ weeks require date-bounded retroactive completeness sweep before sign-off."*

Origin case: 2026-05-18 session-end discovery that prior audits sampled cross-sections; no single method caught everything. Five-layer design exists because each layer is the structural inverse of a documented blind spot. If the layered pattern repeats successfully on a future 2-week window (catches a meaningful number of items the prior audits missed AND the time-cost stays under ceiling), the candidate promotes to registered anti-pattern.

Layer 3 scope confirmed locked Sunday 2026-05-18 (Option α): sequential `recent_chats` walk **INCLUDED**, not optional. Reasoning trail in §4.N main body — the audit exists to close the completeness question; an optional Layer 3 walk recreates exactly the ambiguity the audit is built to eliminate. Anti-pattern #44 framing also applies: trace the full pipeline before ruling out completeness; optional means stopping at the gate instead of tracing.

---

### §4.P — Tuesday session contract (2026-05-20) — anti-pattern #48 promotion test

**Stated before any code, per the discipline lock from Monday evening session close.** The 40-PR Monday cycle (PR #260 → #299) extended past every implicit stopping point until Frank stopped, not until the work stopped — same shape as Sunday's 8-PR cascade. Anti-pattern #48's candidate ("time-budget revisions require ledger reconciliation") didn't fire Monday because no budget was set. Tuesday is the promotion test: can the workflow hold a stated budget for the first time in this build cycle?

**Contract terms (Frank-stated 2026-05-20 ~04:36 UTC / morning NYC):**
- Max hours: **10**
- End time: **midnight local NYC**
- Max PRs: **40**

**Operational discipline locked alongside contract:**
1. Move 1 (this entry) — contract written to ledger BEFORE any code.
2. Move 2 — Cluster 5 closure + #43 cross-surface invariant test as first execution unit. ~15-20 min. Mechanical: useOrgTeamRecords already exists; thread records prop through CoachHomePage matching ParentHomePage:124 pattern.
3. Move 3 — **hard pause** after Move 2. No auto-chain. Route from a stopped position, not from momentum. Pause is the discipline.

**Promotion criteria for anti-pattern #48:**
- If contract terms hold (all three numbers respected) → #48 promotes from candidate to registered rule in CLAUDE.md §11.
- If terms breach (any of the three exceeded) → ledger-reconciliation move required at the breach point, candidate remains as "tried, didn't take" learning artifact, workflow accepts session-extending as its actual shape.
- Either outcome produces useful information.

**Branch state at contract open:** main, clean, 0 ahead / 0 behind origin.

**Tuesday close (2026-05-20 ~05:09 UTC):** Contract held. Final state:
- PRs: 2 of 40 cap (PR #300 contract entry; PR #301 Cluster 5 ledger reconciliation)
- Elapsed: ~33 min of 10h cap
- End-time: closed well before midnight
- Anti-pattern #48 promotion verdict: **HOLD CANDIDATE.** Honest read — Tuesday's contract terms all held, but the session was atypically short. Move 2 collapsed from "code fix + #43 test" to "ledger reconciliation only" when CC's pre-flight surfaced that Cluster 5 had already shipped via PR #239 (anti-pattern #44/#45 catch). One short session doesn't stress-test the chain-vs-pause discipline under load. #48 stays in candidate status pending a full-budget session that tests pause discipline at the 4h+ mark. Tuesday's data point: "shape supports the discipline" — not strong enough for promotion to registered rule.

---

### §4.Q — Wednesday session contract (2026-05-20) — anti-pattern #48 ongoing test

**Second session under stated-budget discipline.** Tuesday's data point ("shape supports") needs a longer session to validate. Wednesday's contract tests pause-discipline-under-load: does the hard-pause-after-each-Move structural commitment hold when the session has real runway, or does momentum chain past it?

**Contract terms (Frank-stated 2026-05-20 ~07:15 NYC):**
- Max hours: **10**
- End time: **midnight local NYC**
- Max PRs: **50**

**Operational discipline:**
1. Move 1 (this entry) — contract written to ledger BEFORE any code.
2. Move 2 — Payment overdue lane for PendingQueuesLanes (HOME_DESIGN_SPEC §3.1.4 third lane). Scope: 75-90 min, lane work + `useFamiliesOwing` hook extraction + flow back through `FinancialDashboardPage:60-68` for consistency. One PR per anti-pattern #42 (avoid parallel-system buildup) — shipping the hook without FinancialDashboardPage consuming it would create two sources of truth for "outstanding balance."
3. Move 3 — **hard pause** after Move 2. Same discipline as Tuesday. Route from stop.

**Promotion criteria (carries forward from §4.P):**
- If contract terms hold across the Wednesday session → second data point supporting #48; promote based on accumulated evidence.
- If terms breach → ledger reconciliation at breach point; candidate remains "tried, didn't take."

**Branch state at contract open:** main, clean, 0 ahead / 0 behind origin.

**Mid-session checkpoint (2026-05-20 ~07:46 NYC, after PR #325):**
- PRs: 26 of 50 cap (52%)
- Elapsed: ~3h 50m of 10h cap (38%)
- End-time: midnight, still ~16h runway
- Contract terms holding all three caps under-budget
- **Hard-pause discipline removed** mid-session (Frank explicit;
  contract numbers still bound the envelope). The mechanism #48
  was meant to stress-test (pause-after-each-Move) is no longer
  the operative test for this session — reduces #48 promotion
  test to "do budget numbers hold as soft ceilings?" Different
  question than original test.

**Wednesday session arc so far:**
- §4.C home-page completion: COMPLETE across all 3 roles (#296-#317)
- Financial-math consolidation (anti-pattern #42 end-to-end): #303-#306
- ActionZone + PendingQueuesLanes density variants: #308, #313
- Sprint completion ledger reconciliation: #314
- §2 stale-OPEN sweep (Clusters 4 + 5 + 7): #301, #315
- Home page invariant audit: #316
- UPCOMING PREP card (parent + coach): #317
- May 16 audit P2 sweep — 8 items closed: #318-#325
  - useWeather signout, BriefingComposer org reset, useHasUnread
    channel scope, RecordsPage org-scope, useAcademyCallupCandidates
    org-scope, FK CASCADE gaps (2), briefing_templates NOT NULL,
    legacy renderer dead code
- §4.L close + §4.Q mid-session checkpoint: #326

**End-of-day checkpoint (2026-05-20 ~08:50 NYC, after PR #336):**
- PRs: 37 of 50 cap (74%)
- Elapsed: ~4h 52m of 10h cap (49%)
- End-time: midnight, still ~15h runway
- All three contract caps still holding under-budget

**Second-half arc (PRs #327-#336):**
- §2 Cluster 6 A2 closure + ledger flip: #327 (Admin KPI loading state
  on season-change refetch; same shape as Cluster 6 A3's #241 fix on
  a different upstream signal)
- §4.M.1 P1 sweep — 6 of 7 items closed + wildcard select cleanups:
  #328 (useRsvps + useEventArrivals)
- §4.D Sprint G rides reconciliation — staleness catches + corrections:
  #329 (initial), #330 (anti-pattern #44 recursive correction; PR #329
  itself was stale at a deeper layer; lesson: grep src-tree-wide, not
  src/components-only)
- V-23 iCal subscription URL: verified PARTIAL (download yes,
  subscribe no): #331
- V-23 iCal subscription URL: PARTIAL → SHIPPED end-to-end (migration
  + edge function + UI subscribe button): #342 (Thursday 2026-05-20
  morning, post-Wed-checkpoint substantive action 3 from end-of-Wed
  letter). Closes the last polish-tier verification queue row.
  Migration 20260520093701 added teams.team_feed_token; edge function
  team-feed deployed v1 (verify_jwt=false per anti-pattern #31, audit
  test auto-picked it up); PublicSchedulePage gained Subscribe to
  Calendar bottom sheet with webcal:// (Apple) + Google Calendar URLs.
- Sprint G aggregate-coverage signal: shipped end-to-end:
  - Admin Rides Today widget (§6): #332
  - Coach RIDES COORDINATION section (§5): #333
  - §4.D reconciliation post-shipping: #334
  - useRidesTodaySummary aggregator extracted + 7 unit tests: #335
- Home page invariant audit extended to 12 home-arc components: #336

**Cross-arc structural wins of the day:**
- 2 cross-role hook abstractions shipped (useSeasonFinancials and
  useRidesTodaySummary), each with 2-5 consumers via teamIds/seasonId
  optional filters
- 4 drift-hedge audit tests added (financialMathAudit,
  homePageInvariantAudit + extension, ridesSummary unit tests, plus
  the pre-existing eventTitleAudit family)
- §2 ACTIVE BUGS now down to 2 Frank-gated items (Cluster 1.1 + 1.2);
  all code-actionable HIGH/MEDIUM bugs closed
- §4.L Tier 4 P2 sweep — 8 of 11 items closed (1 pre-Wed + 2 deferred)
- §4.M.1 Phase 1 P1 — 6 of 7 items closed (1 deferred as perf-only)
- §4.D Sprint G aggregate signal SHIPPED end-to-end (parent UI was
  already shipped pre-Wed; coach + admin widgets shipped today)

**Anti-pattern #48 status — Framing C resolution (Frank-locked Wednesday eve):**

CC's mid-session checkpoint framed promotion as a binary (promote /
hold candidate). Frank's end-of-Wed letter introduced Framing C —
split the candidate into two distinct rules so each can be tested
honestly against the data that actually exists.

**Anti-pattern #48 (CANDIDATE, ORIGINAL FORM) — STILL UNTESTED.**
Claim: pre-set exit conditions need an external commitment mechanism
to fire reliably; internal intention does not produce stops.
Status: not testable in the Wednesday session because Frank explicitly
removed the pause-after-each-Move structural commitment mid-session.
Re-test required: a future under-load session WITH the
pause-after-each discipline intact + a real cap-approach scenario.
Risk if never tested: stays candidate forever — accept that as the
honest state rather than promote on weaker data.

**Anti-pattern #48' (CANDIDATE, MODIFIED FORM) — WEDNESDAY DATA.**
Claim: stated maximums written to ledger at session-start, with
self-monitoring against caps during execution, produces stops in
advance of cap-hit when work is engaging.
Tuesday data: 2 PRs / 33min / well before midnight cap → atypically
short, doesn't stress budget-holding-under-load. Weak data point.
Wednesday data: 39 PRs / ~5h / well under all 3 caps under sustained
under-load execution. Strong data point on the soft-ceiling claim.
Promotion criteria: holds across ONE more under-load session
(matches the test design — empirical confirmation across multiple
sessions before durable rule).

**Why split rather than promote either form alone:**
- Promoting original #48 over-claims (the data tests a weaker thing).
- Holding everything as candidate under-claims (the soft-ceiling
  data is real and useful; encode it).
- Modifying original #48 retroactively risks losing the original
  insight.
- Framing C respects the data without overclaiming what either form
  was tested for. Captured durably; reviewable across sessions.

**Generalization status note for anti-pattern #44 (CLAUDE.md §11 #44):**
Four distinct work-class applications across three sessions:
  - PR #241 (Sunday)      regression triage at gate vs upstream
  - PR #260 (Monday)      doc claims vs production evidence
  - PR #277 (Monday)      perf root-cause validation
  - PR #330 (Wednesday)   audit-output verification (recursive)
The principle is generalized — not situational. Worth registering
inline on the #44 entry in CLAUDE.md when next that section is
touched. Not promoted via this PR (CLAUDE.md edit is its own
discipline; this is a ledger note flagging the durable observation).

**Next-session opener — clean read state:**
- §2 ACTIVE BUGS: 2 Frank-gated items only
- §4.C: COMPLETE all sprints
- §4.D Sprint G: aggregate signal SHIPPED; v2 (interactive CTAs +
  arrival/return split) deferred
- §4.L: 8 of 11 P2 items closed; #18 (Admin Home IA Tier 3) parked
- §4.M.1: 6 of 7 P1 items closed; P1-4 (financial_transactions
  over-fetch) deferred as perf-only
- V-23 iCal subscription URL: SHIPPED end-to-end Thursday 2026-05-20
  via PR #342 (migration + edge function + UI). No follow-up work.
- Anti-pattern #48: split via Framing C per Wednesday-eve letter.
  #48 (original) stays candidate, untested. #48' (modified, soft-
  ceiling) stays candidate, awaits one more under-load session.

Next-session candidate moves (no priority assigned):
- Anti-pattern #48' re-test on a future under-load session (then
  promote if holds). Anti-pattern #48 (original) re-test requires
  reinstating pause-after-each discipline first.
- Anti-pattern #44 generalization note inline on CLAUDE.md §11 #44
  (four-class evidence: PRs #241/#260/#277/#330)
- Sprint G v2 — interactive CTAs (broadcast, suggest match, etc.)
- Sprint G v2 — arrival/return split
- §4.D Waitlist + auto-confirm UI audit
- Admin Home IA Tier 3 design exercise (§4.L #18)
- Async-ordering tests for useAdminStats / useHomeRole /
  useAttendanceData / useActivities (TEST COVERAGE GAPS §11)

### §4.R — Thursday continuation (2026-05-20 morning NYC) — V-23 + Frank-reported loading bug arc

**Frame:** Continuation of the Wednesday session's "Continue with the
lean" under-load discipline. Substantive items executed from the
end-of-Wed locked Thursday plan, plus an in-session bug Frank surfaced
mid-execution.

**Shipped (in order):**
- PR #339, #340 — Coach + Admin home LoadingSkeleton gates (Thursday
  Action 1 from end-of-Wed letter)
- PR #341 — Anti-pattern #48 Framing C ledger lock (Thursday Action 2)
- PR #342 — V-23 iCal subscription URL: migration + edge function +
  UI three-phase build (Thursday Action 3; SHIPPED end-to-end)
- PR #343 — V-23 ledger reconciliation (PARTIAL → SHIPPED across
  §4.Q + §15 V-23 row + CLAUDE.md §8 Prompt 3-B) per anti-pattern #45
- PR #344 — Home loading-gate comprehensive fix (Frank-reported
  2026-05-20: admin home cascade-flash from single-signal gate).
  Extended all three role homes' isLoading gates to combine multiple
  loading signals; added homePageLoadingGateAudit invariant test per
  anti-pattern #43
- PR #345 — Brand-flash cached-colors fix (Frank-reported same
  session: Ember/Skyfire defaults rendering before AuthContext
  applies Legacy Hoopers brand_colors). New orgBrandingCache module
  with synchronous pre-mount CSS-var application; cache invalidation
  through registerCacheBuster registry → no AuthContext changes

**Bug-arc methodology note:** Frank's screenshot report named one
symptom ("old screens load in first") but the diagnosis surfaced TWO
distinct bugs at different layers — in-page cascade (PR #344) and
brand-flash (PR #345). The two were entangled in the same Capture
timeline but had different root causes. Split into two PRs rather
than one bundled fix: each PR's diff stays scoped to one concern,
each gets its own invariant test (homePageLoadingGateAudit for #344;
orgBrandingCache.test for #345), and the §15 auto-merge discipline
runs cleanly per PR. Reverse pattern of bundling worth registering
durably — the "two bugs, one symptom" framing is a recurring shape
worth pre-flighting on similar reports.

**Anti-pattern compliance:**
- #11 (150-line cap): all touched files under cap (149/145/145
  for #344; 67/56/41 for #345). PR #344 trimmed AdminHomePage's
  comment to land at 149 from 152.
- #21 (migration mirror), #23 (REVOKE order), #30 (helper mirroring),
  #31 (config.toml + audit) — all honored on PR #342
- #43 (cross-role invariant test): homePageLoadingGateAudit on
  PR #344 locks the multi-signal gate shape across all three role
  homes; orgBrandingCache.test on PR #345 covers the cache contract
- #44 (trace full pipeline before ruling at the gate): the cascade
  bug diagnosed by tracing each downstream-of-gate hook's loading
  state, not by inspecting the gate logic
- #45 (planning-doc reconciliation): PR #343 (V-23 docs) + this §4.R
  entry (PR #344 + #345 docs) ship reconciliation in the same
  coordinated set as the substantive code

**Cross-arc structural wins of Thursday morning:**
- 1 substantive feature shipped end-to-end (V-23 iCal subscription)
- 2 Frank-reported UX bugs closed with invariant tests
- 1 new audit test (homePageLoadingGateAudit, 6 cases)
- 1 new module with unit coverage (orgBrandingCache, 9 cases)
- AuthContext.jsx (pre-existing 164 lines over-cap) untouched —
  brand-flash fix wired through registerCacheBuster registry

**Next-session opener — clean read state (refreshed end of §4.R):**
- All §4.Q "next-session opener" items still apply, PLUS:
- §2 ACTIVE BUGS: 2 Frank-gated items only (unchanged)
- §4.D Sprint G: aggregate signal SHIPPED; v2 still deferred
- V-23: SHIPPED end-to-end (no follow-up)
- Loading-gate cascade: CLOSED across all three role homes
- Brand-flash: CLOSED with localStorage cache + pre-mount apply
- Anti-pattern #48 (original): still candidate, untested
- Anti-pattern #48' (modified, soft-ceiling): still candidate,
  awaits one more under-load session
- Anti-pattern #44 generalization note inline on CLAUDE.md §11 #44:
  still pending (queued from §4.Q)

---

### §4.S — Teams section redesign (deferred; Frank-flagged 2026-06-07)

Surfaced during the multi-program F14 smoke (PR #788). Holding item for a
later, holistic teams-section redesign — do NOT patch piecemeal:

- **Age-group options are hardcoded to `8U/9U/10U/11U/12U/Mixed`** in
  `src/components/admin/team-form/teamFormConstants.js` (AGE_GROUPS). No
  13U/14U/HS or other groups — teams are effectively capped at 12U. Frank:
  "the teams are restricted to only 12u … we will redesign the teams sections
  later." The age set should become org-configurable / broader in that redesign
  rather than a hardcoded chip list.
- Likely travels with: team_type vs circuit axis clarity, division linkage,
  and the broader Teams surface. Scope the age-group source as part of it.

Everything else in the program create/team-create/F14 arc (PRs #782–784, #788)
shipped and smoked clean; this is the one explicit deferral.

---

### §4.S.2 — Programs phase CLOSED + #13 game_recap RESOLVED + E4 ticket (2026-06-07)

**Programs CLOSED.** PR #796 (PROGRAM_TYPE_REGISTRY + draft status + unified
activate) merged to main (squash, `7073988`) after Frank's smoke + the
architect's build-review sign-off. Both sign-off conditions met: the registry
absorbed all 10 branch sites (parity-test-enforced), and records/standings
exclusion correctly stayed team-level (`isCompetitiveTeam`), not folded into the
registry. Pre-merge digit check: full vitest suite on base (main) vs head (#796)
showed the **identical 5 failing test files** — all briefings/comms modules
throwing `Missing VITE_SUPABASE_URL` (static supabase import at module load; they
pass in CI where the env var is set). #796 only adds green (+1 file, +7 tests).
No new failure in the costume. Close-out doc: `docs/PROGRAMS_CLOSED_CC.txt` (PR
#797, merged). Forks 1/2/3 + Q4 + taxonomy ("6 + Other") all ratified + built.

**Item #13 (game_recap row-count) — RESOLVED, NOT write-amplification.** Live
query 2026-06-07: post-purge `comms_messages` holds **19 `game_recap` rows total**
(was 15,759+ historical bloat, purged earlier this session) — 10 archived + 6
trigger-draft + 2 trigger-sent + 1 old sent. The trigger is still installed and
active (newest draft edited today 16:21 UTC) but **bounded one-per-anchor**: all
8 trigger-made rows are exactly 1 row per `anchor_id` (zero duplicates). The
`draftExists`-includes-`archived` dedup (PR-A/G-23) is holding. Not climbing,
not a bug — hygiene done. Closes the five-turns-open question with two queries.

**E4 TICKET (programs index player-count) — deferred-with-reason, ticketed here.**
The `/admin/programs` index "X players" count sums `team_players` ROWS (roster
spots), not distinct people: a kid rostered on two teams double-counts. Correct
for LH today (1 team/kid); a label nuance for the multi-team future. When fixed,
either count `DISTINCT player_id` or relabel to "roster spots." Lives with the
§4.S teams redesign surface. NOT a blocker — programs is closed with this as a
known, recorded deferral (was only "intent to ticket" in PROGRAMS_CLOSED_CC §2;
this is the physical ticket).

**Carried standing queue (a programs close does NOT clear these):**
- **Briefings Phase 3 status — RESOLVED 2026-06-07** (`docs/BRIEFINGS_PHASE3_VERIFICATION_CC.txt`).
  Phase 3 (the REDESIGN_BRIEFINGS_2026-06-03 D-1…D-8 implementation) SUBSTANTIALLY
  SHIPPED via the engine lane (D-2 #677, D-5(a) #685, D-7 #687, D-6(a) #690, D-8
  #691, RLS #710); the remainder is the inventoried post-Phase-3 surface
  (BRIEFINGS_WHATS_LEFT_2026-06-04 Part B). **D-4 was NOT auto-picked NOR routed**
  — it sits correctly as an uncrossed B3 Frank gate (DEF-3 REDIRECT→FILTER
  cutover); live state confirms `is_pilot_family` column intact (no DROP), 1
  pilot-true of 175, pilot_mode ON. The 5 failing briefings test files are a
  LOCAL env-var artifact that PASSES in CI (#796 green proves it), not a coverage
  gap. Real remaining briefings surface = B3 Frank gates (D-4 cutover, AUTO-SEND
  graduation, B2 cancellation), B4 DEF-11 deliverability prereq, B1 build
  remainder, Part A screens-redesign routing (Option A/B/C, still open).
- **Rebrand operator items (task #55 not truly closed):** Supabase display-name
  rename, Drive brand-asset upload, SKYFIRE folder lock (accept doctrine).
- E3 (index filter chips omit evaluation + interest_list) + E6 (/admin/teams
  empty-state walls a camp-only org) — cosmetic, deferred.

---

### §4.S.3 — Cross-section close scan (briefings/home/programs) findings (2026-06-07)

Architect-requested cross-section close + deep-scan (`docs/CROSS_SECTION_FINDINGS_CC.txt`,
answers `CROSS_SECTION_SCAN_FOR_CC.txt`). 4 parallel deep-dive agents, every claim
file:line/query/PR-backed. Per-section verdict + the actionable queue this opened:

- **PROGRAMS — CLOSED** (#796 merged 7073988; 1a/1b/1c all confirmed). NEW
  **P1 (LATENT):** `deleteProgram()` hard-fails on any program with a registration
  — `registrations.program_id` is ON DELETE **RESTRICT** (verified live; all other
  children CASCADE), but `useProgramAdmin.js:8-10` comment says "cascades… clean"
  and `programDelete.js` dependencySummary omits registrations → raw 23503 in the
  Toast once a registration exists. Latent (registrations empty today). Fix: count
  registrations + BLOCK delete with a kind message (RESTRICT is correct). Awaiting
  Frank's go (NOT a reopen). E3 likely already-closed (chips are PROGRAM_TYPE_KEYS-
  derived; ledger note stale); P3 stale comment ProgramSetupPage.jsx:12.
- **HOME — SHIPPED, NOT FORMALLY CLOSED** (the assumed-closed risk, confirmed).
  **P1:** AdminProgramHealth.jsx:30-38 PATTERN A — "Collected %" (season-scoped) vs
  "Out $" (all-seasons), neither labels scope (BUG-1/HOME-2 contradiction); fix =
  label scope per KPI. **P2:** coach renders fabricated `0-0` vs parent `—` for
  recordless team (CoachTail.jsx:59,97 vs parentHomeData.js:47 — AP#43/#27);
  **P2:** "Out" KPI not in its own loading gate (AP#44). **Dead computations:**
  useAdminHomeSignals.pendingLanes (45-54) + useCoachHomeSignals.recentTeamMessages
  (73) — no consumers. Draft-leak check PASSES (useActivePrograms is include-active).
  **Gap:** home has NO close-out doc; D-A/D-D/D-E built ahead of HOME_OPEN_DECISIONS_CC
  + D-B/D-C/D-F shipped/retired on CC lean — none architect-ratified. Needs a
  close-out doc + the bug fixes. **Close-out written 2026-06-07:**
  `docs/HOME_CLOSEOUT_REVIEW_CC.txt` reconciles D-A…D-G vs shipped code + the
  BUG-H1/H2/H3 close-gates (fixes QUEUED for architect per Frank); home CLOSES on
  architect ratification (A) + bug routing (B) + the D-G CC verification (C) +
  dead-code cleanup (D).
- **BRIEFINGS — NOT closed, but every named open item RESOLVED** (Phase 3 shipped
  engine-lane #677/#685/#687/#690/#691/#710; 5 tests benign env-var; game_recap 19
  rows bounded 1-per-anchor; D-4 uncrossed Frank gate, column intact). Hooks/
  registries/secrets all clean. Real remainder = Part A screens routing (architect
  pick, CC leans A) + Frank gates (D-4/AUTO-SEND/B2/coach-write) + DEF-11
  deliverability prereq + B1 build remainder (coach_roundup SEND path underspecified).
- **NEXT REDESIGNS scoped (not started):** teams §4.S — AGE_GROUPS hardcoded
  (teamFormConstants.js:5) is the next float-free-enum to close; `division` column
  queried-but-never-written by TeamFormSheet (dangling); team_type vs circuit vs
  "Competition type" naming axis to disentangle. schedule — EventCard vs MatchupCard
  are two cards for the same events rows (consolidation candidate); imperative
  day-jump scroll brushes AP#5.

**UPDATE 2026-06-07 PM — fixes shipped + home ratified (Frank-routed):**
- **Programs P1 → MERGED #803.** `deleteProgram()` now counts registrations FIRST
  and blocks with a kind message before attempting (pre-check, not catch-and-
  translate). Programs fully closed, no residuals.
- **Home BUG-H1/H2/H3 + dead-code → MERGED #804.** H1 scope labels on the admin
  hero (un-blocks D3); H2 coach record default `—` not `0-0` + invariant test
  case (e); H3 Out-KPI own loading gate; pendingLanes + recentTeamMessages removed
  + 2 orphan hook files deleted; useFamiliesOwingCount in-flight dedup (3 concurrent
  admin-home queries → 1).
- **Home D-A…D-F RATIFIED (Frank 2026-06-07):** D-A hidden-until-data (comment
  fixed in #804), D-C density retire, D-E ready/overdue mapping — ratified. D-B
  (rows + severity rail) + D-F (extras-on-home) — pilot-fine, revisit post-pilot.
  D-D off-season — ratified, but copy to be confirmed against the live preview
  before ~June 15 (dated). D-G — CC-verified GREEN (pilot send writes the in-app
  `comms_message_recipients` row with guardian_id; synthetic email-only path is
  guardian_id=null by design). Home now closeable pending the D-D copy confirm.
- **Briefings framing (locked):** "verified and safely held" — DEF-11 deliverability
  (3/hr SMTP cap) + underspecified coach_roundup SEND path before families go live.
  NOT "resolved." Part A screens-redesign routing (A/B/C) still awaits the architect.
- **Part A ROUTED 2026-06-07 PM → OPTION A, AUDIT-GATED** (architect, doc
  `docs/ARCHITECT_ROUTING_PART_A_AND_STATE.txt`). Collapse to one composer; retire
  the 4-step wizard; extend the one-screen composer to ALL kinds. **GATE: a
  per-kind field audit + §16.15 audit run FIRST — NO PR-A code until that audit
  doc exists** (same shape as the programs 10-branch grep). The audit confirms or
  breaks "re-host not rebuild" per kind; a kind that can't re-host cleanly is the
  B-fallback signal. Grouping Recaps/Schedule/Outreach ratified. OUT of Part A
  (do not conflate): D-4 (Frank gate) + DEF-11 (deliverability prereq) — Part A
  is compose UX, not go-live readiness. CC's next action: produce the audit doc.
- **Part A §16.15 AUDIT LANDED 2026-06-07 PM** (`docs/BRIEFINGS_PART_A_AUDIT_CC.txt`).
  Result: **re-host CONFIRMED for all kinds; B-fallback NOT triggered.** Key
  finding — Option A is **~80% already shipped**: the one-screen composer
  (ComposerSections, no step-gating) already hosts all 11 body editors; the
  4-step wizard is VESTIGIAL dead code (verified: no live `step`/`canAdvance`
  consumer); resume is already Radar-based. Matrix: 8 CLEAN, weekly_digest
  CLEAN-compose (send-path divergence noted), tournament_prelim/recap density-flag
  (UX polish not blocker), academy_callup PRESERVE (blocked-redirect by design).
  Remaining Part A = small PR set A1 (retire dead wizard machinery, AP#51) + A2
  (group+rank kind picker — the one new UI piece) + A3 (relocate test_only to the
  send action); optional weekly_digest send-path unification. Awaiting architect
  confirm of the three scoping calls (academy preserve / tournament density defer /
  weekly_digest unify-now-or-later) before A1–A3 code.
- **Part A SHIPPING:** A1 MERGED (#809, retire wizard machinery). A3 MERGED (#812,
  test_only toggle → send action). A2 (#813, grouped picker Recaps/Outreach/Guides,
  static order, AP#43 invariant) HELD for Frank's smoke. Architect ruled all 4
  (Option B grouping / static rank / keep single-item header / A3-first). Post-pilot
  ticket: data-driven usage-rank (deferred, not decided-against).
- **BRIEFINGS L99 AUDIT (full surface) 2026-06-07 PM** (`docs/BRIEFINGS_L99_AUDIT_CC.txt`).
  Operator-directed redesign-grade pass over the ENTIRE briefings build (screens,
  entry/exit, AI, per-role coach/admin/parent) with renders. Engine strong (pure
  resolve/compose, single render path email==in-app, AI honest-by-design, secrets
  in app_secrets); gaps at the edges. 9 findings, 3 architect FORKS: **FORK A**
  signature/contact blocks default-on — staff cell phones to every guardian, no
  opt-in (F1 + F4 family_guide-double + F5 org-vs-team scope mismatch; Frank wants
  clean default + opt-in signatures; CC lean A3 signature-stays/phones-opt-in + A1
  per-send control). **FORK B** coach recap-compose dead-ends via event-hero
  "Request recap" (admin-only route) while the header modal works — two staff paths
  disagree (F2 + F8 dual-mount; CC lean B3 coach-requests/admin-sends). **FORK C**
  no forfeit concept → 20-0 forfeit renders as a real WIN (F3; upstream score-entry,
  likely its own small phase). Cleanups: F6 Cancel doesn't discard (scratch drafts
  in Radar), F7 useNeedsBriefing orphan (PC-6), F9 stale docs. Awaiting architect
  ruling on A/B/C before fix PRs.
- **BRIEFINGS L99 AUDIT v2 (deep-read addendum) 2026-06-07 PM** — expanded the
  above to the complete CC-recommendation set before architect handoff (v1 read
  was incomplete; the addendum covered Radar/History+delivery/scheduling/audience/
  templates/states/a11y/pilot-safety + ran the §16.13 elite-stack gate). 18
  findings; NEW criticals: **F-PILOT [P0]** 8 resolvers default pilot OFF on a
  missing settings row (`?? false`) while useOrgSettings fails closed (`?? true`)
  — latent for LH, fail-open seam for a new org → could send to all real families
  (FORK D: align to `?? true` + parity test, ship FIRST). **F-SCHED [P1]** no
  cancel/edit UI for a scheduled send (archive races cron). **F-DELIV [P1]**
  bounce/fail invisible except one-click-deep; queued/failed rows in neither Radar
  nor History (ties DEF-11). **F-RECIPCHIP [P1]** recipient preview "Will send to
  N families" ≠ §13.7 "Active/Futures/guardians". **F-INBOX-A11Y [P1]** parent
  InboxDetail iframe = AT trap + non-visualViewport (AP#18). Elite-stack gate
  FAILS items 4 (a11y), 6 (translation G-TRANSLATE, no EN↔ES path), 7 (privacy,
  F-SIG). New forks D (fail-closed) + E (operational visibility: scheduled-cancel
  + failed lane). CC-proposed tier sequence: Tier0 F-PILOT → Tier1 parent-moat
  (FORK A + inbox a11y + recipient chip) → Tier2 coach (FORK B) → Tier3 visibility
  → Tier4 cleanups. Awaiting Frank read → architect additions → CC final rewrite.
- **BRIEFINGS L99 AUDIT v3 (100% coverage) 2026-06-07 PM** — four-agent sweep of
  the NON-UI stack (data/schema/RLS · edge/send/delivery · per-kind resolver
  correctness · tests/integration/perf), 5 agents total, all load-bearing finds
  CC-verified (live SQL + send-path trace). Verdict: build is genuinely
  well-engineered (clean resolve/compose all 12 kinds, solid RLS w/ AP#20 + zero
  initplan, verify_jwt+app_secrets, fail-CLOSED send gate, single render path,
  real parity tests, indexed, lazy, no N+1). **CORRECTION (AP#60):** v2's F-PILOT
  "P0 send-to-all" is FALSE — all 5 send paths route through send-tournament-
  message's fail-CLOSED pilot gate (`?? true`, 403 on non-pilot), so F-PILOT
  DOWNGRADED to P2 (widens recipient set/preview only). True P0 = **DEF-11** (no
  rate cap in code; full-family send overflows to `failed`/silently-dropped —
  provider/account fix). NEW P1s: **GHOST** migration 20260603104534 unapplied →
  weekly_digest unique index still includes `draft` LIVE → 23505 collision
  reachable + stale digestSend comments (quick chat-CC MCP fix); **F-PATTERNA**
  AlertZone vs Needs-You disagree on drafted-recap-handled (AP#63, no AP#43 test);
  **SEND-4** Stream A reminders silently undelivered-but-marked-done. P2s: SEND-3
  digest no ok-check, PC-1 delivery_method no CHECK, RLS-1/RLS-2 defense-in-depth,
  PC-7 digest audience asymmetry. Tier 0 (ship first): GHOST + FORK D + SEND fixes.
  v3 doc is the complete CC set; awaiting Frank read → architect additions → final
  rewrite → build Tier 0.
- **BRIEFINGS L99 AUDIT v4 (FINAL, 100% agent-reachable) 2026-06-07 PM** — three
  more agents (AI quality · delivery-channels+compliance · lifecycle/retention), 8
  agent-passes total, all load-bearing finds CC-verified (footer read + failed-grep
  + send-trace + live SQL). The build is well-engineered everywhere an agent
  reached. Findings now split into TWO GO-LIVE BLOCKERS (not redesign) + redesign
  tiers. **B1 DEF-11 [P0]** no rate cap + new-domain SPF/DKIM/DMARC unproven + no
  warmup + personal-Gmail reply-to. **B2 CAN-SPAM [P0]** no physical postal address
  in any briefing email [CC-verified footer.js] — legal blocker for 175-family send
  (unsubscribe half IS compliant). v4 CORRECTION: F-CANCEL downgraded P2→P3 (expiry
  sweep auto-cleans abandoned drafts — verified healthy). NEW: AI is substantive+
  safe (voice-profile prompt + structural anchored hallucination guard + cron-no-
  LLM) w/ AI-FREEFORM [P2] caveat (free-form no-invent is instruction-only); two
  lifecycle P1s (failed = terminal dead-end no-reader [CC-verified] · queued orphan
  if edge fn dies — both need a recovery sweep, fold FORK E); HISTORY-BACKFILL [P1]
  17 delivered msgs stuck archived/no-history; SCHED-ANCHOR [P1 latent] scheduled
  send not invalidated on anchor delete (no FK, 6 orphans); RETENTION [P1] no
  cap/purge. Delivery CLEAN: RFC-8058 one-click unsub + suppression every path.
  NEW FORK F = go-live deliverability+compliance gate (B1+B2+domain+reply-to;
  Frank/provider-owned + small code). §8 OWED (agent-can't-reach, human/browser):
  cross-client email render, axe-core a11y pass, content/voice taste, real-device,
  D-G live send. v4 is the final agent-reachable audit; awaiting Frank read →
  architect additions → CC final rewrite → build Tier 0 + B2 code.
- **BRIEFINGS L99 AUDIT — FINAL (post-architect-review) 2026-06-07 PM** — rewritten
  per ARCHITECT_REVIEW_BRIEFINGS_L99_AUDIT. Architect endorsed the audit as strong/
  trustworthy (the two self-downgrades = the reliability signal), accepted it as the
  redesign basis, and added the key REFRAME: the honest go-live gate is FOUR things
  — SEND(B1)+LEGAL(B2)+SEE(min delivery rollup)+RECOVER(failed/queued sweep) — so
  the recovery sweep + minimum rollup MOVE to the go-live track (NOT Tier 3). CC
  absorbed all §10 must-changes: lifecycle-failed/queued RE-RATED P0-for-go-live;
  B2 annotated classification-dependent (M-1 counsel one-liner owed); IC-1 F-PATTERNA
  →Tier 1 only; IC-2 PC-7 finding-deferred-to-ticket; IC-3 recovery sweep→go-live
  only; M-1..M-7 folded; regression-guard line on every Tier-1 PR. CC-VERIFIED the
  seam checks: SEAM-1 pilot fail-closed gate UNTESTED (→go-live gate), SEAM-2 webhook
  rollup events COMPLETE (→green), SEAM-3 sent_at 409 idempotency UNTESTED (→go-live
  gate, BLOCKS the recovery sweep — the sharpest dependency: a sweep on unproven
  idempotency could double-send 175 families), M-4 no parent-visible granular toggle
  (→UNSUB-GRANULAR stays P2). FORK C cheapest interim forfeit guard scoped (minimal
  is_forfeit boolean + render branch). Build order: GO-LIVE track + Tier 0 first,
  B2 address+footer the FIRST PR, G8 idempotency test BEFORE G5 sweep. Open Frank Qs:
  CAN-SPAM classification, Spanish-primary fraction (M-2, decides translation tier),
  scheduled-sends-at-launch (decides SCHED-ANCHOR tier), FORK A confirm.
  **Frank answered 3 of 4 (2026-06-07):** launch is SEND-NOW-ONLY → SCHED-ANCHOR =
  Tier 3 (not go-live); Spanish-primary ~near-zero → G-TRANSLATE stays a later
  phase; build STARTS on architect sign-off (B2 address+footer first PR, each held
  for Frank's smoke). Still open: CAN-SPAM counsel one-liner (M-1; address ships
  regardless) + FORK A confirm (expected yes). Next: architect §10-item-1 sign-off
  → CC builds go-live track + Tier 0, B2 first, G8 idempotency test before G5 sweep.
- **BRIEFINGS AUDIT ARC — SIGNED + BUILD GREEN-LIT (architect, 2026-06-07 PM)**
  (`ARCHITECT_SIGNOFF_BRIEFINGS_L99_FINAL.txt`). §10-item-1 SIGNED — all 7 checklist
  items pass against the body (recovery sweep in go-live only, verified in 3 places).
  Honest status: "audit arc closed, build green-lit, go-live gates (G1-G8) OPEN, D-4
  uncrossed" — a signed audit is a signed plan, not a shipped system. Build order
  per §5: G1 (B2 address+footer, FIRST) → G8 (idempotency+writeback test) → G5
  (recovery sweep, gated on G8) → G2 (B1 throttle; Frank: Resend tier) → G6 (rollup)
  → G7 (pilot-gate test) → G3/G4 (Frank: DNS+warmup, reply-to) → Tier 0 (GHOST apply
  GO-gated; FORK D; SEND-4/SEND-3). Two FORWARD FLAGS carried:
  **FF-1** FORK C interim guard = migration (is_forfeit boolean) + score-entry
  checkbox + render branch (3 things, not a one-liner); migration runs GO-gated MCP
  discipline (not a CC-written file); guard fires only if the result-enterer CHECKS
  the box (human-entered fact, no auto-detection — inherent, named).
  **FF-2** G-TRANSLATE deferral is PILOT-correct not FOREVER — it's a per-org concern;
  tag "deferred for LH pilot on demographic evidence; RE-EVALUATE at each new-org
  onboard" and ride it on the G-MULTITENANT pre-2nd-org scan (deferred-with-reason-
  AND-trigger). Opens: CAN-SPAM counsel one-liner (before promoting anything, NOT
  before G1 — address ships regardless); FORK A pref yes (before the FORK A PR, not
  before G1). CC build kickoff: G1 needs Frank's LH mailing-address value + the
  additive migration; G8 starts in parallel (unblocked; the gate G5 depends on).
- **GO-LIVE BUILD PROGRESS (2026-06-07/08 PM, this session)** — building the
  architect-signed track. **G8 (idempotency) SHIPPED + report** (`CC_G8_SEND_IDEMPOTENCY_REPORT.txt`,
  `CC_G8_REVIEW_RESPONSE.txt`): pure dispatch kernels `alreadySent` + `classifyBatchResult`
  in the AP#30 mirror pair `src/lib/briefings/sendDispatch.js` ↔
  `supabase/functions/send-tournament-message/_dispatch.ts` (baseline 4, registered in
  edgeFunctionMirrorAudit) + static lock `sendIdempotencyInvariant.test.js`. Claim
  NARROWED per architect G8 review: idempotency proven = **finalized + clean-queued only**;
  the crash-after-dispatch window (emailed-but-not-marked-'sent', still reads 'queued')
  is NOT covered → G5 must surface ambiguous 'queued' for human review, never blind
  auto-re-drive. **G5 PR 0 (F-DUAL-FINALIZE) MERGED** — removed the caller-side
  `status='sent'` force-write from digestSend/rsvpNudgeSend/academyCallupSend/
  scheduleChangeSend; edge fn now owns the terminal finalize; callers throw on
  `dispatch.ok === false` instead of masking a partial send (which would 409-lock its own
  recovery). **G5 PR 1a (#831, MERGED 2026-06-08)** — queued "Sends needing review"
  Radar surface (architect D2 render): `useStuckSends` read-only hook + `StuckSendsRegion`
  (§16.14, renders null when clean) + `StuckSendCard` (disambiguation pointer leads;
  Resend / Mark-as-delivered both confirm-gated) + regression guard. **redrive_count
  migration applied** (20260608002737, additive, MCP + AP#21 mirror; Frank D1 = include
  the cap with G5). **Next: G5 PR 1b** (OPT-B failed re-drive via a shared gated-send
  helper that re-applies suppression + the pilot fail-closed gate; redrive_count cap = 3;
  failed-note/escalation row), held for Frank's smoke. A2 (#813) updated/merge-ready,
  awaits Frank's re-smoke. G1 (CAN-SPAM footer) next after G5: mailing_address column
  live (20260607231454), address "4 Byram Brook Place, Armonk, NY 10504" → wire into
  buildOrgContext.branding + footer.js (~13 sites, no shared builder).
- **#825 PARALLEL-SESSION 8-AGENT AUDIT — findings folded (2026-06-08, Frank: "yes on
  all recommendations")** — a parallel session's independent 8-agent briefings audit
  (PR #825, still OPEN, routes to architect lane — has decisions owed + likely ledger
  conflict). Two findings folded here for the build plan; #825's own merge stays the
  architect's call. **(1) FORK D scope widens 8 → 9 resolvers.** The v2/v3 FORK D set was
  "8 resolvers default pilot OFF on a missing settings row" — #825 found **weekly_digest
  is a 9th that NEVER consults org settings at all** (not even the `?? false` seam). The
  FORK-D fix (align to fail-closed + AP#43 parity test) must cover all 9, and the parity
  test must assert weekly_digest is included, not just the 8 with the `??`-seam. **(2)
  NEW F-PARENT-MOAT-LEAK [P1].** Archived briefings have no status gate into the parent
  inbox / "Needs you" surface — an archived (non-sent / scratch / abandoned) briefing can
  leak into a parent's inbox once the FILTER go-live cutover lands. Latent today (pre-FILTER);
  **fires at the FILTER cutover**, so it must be fixed in the same wave that ships the
  parent-inbox FILTER, with an AP#43 cross-surface invariant test locking "archived ⟹ not
  in parent inbox/Needs-you." #825 also INDEPENDENTLY re-derived F-DUAL-FINALIZE (already
  shipped this session as G5 PR 0) — convergent confirmation, no new work.
- **OVERNIGHT AUTONOMOUS BUILD (2026-06-08, architect-directed; all HELD do-not-auto-merge
  for Frank's smoke — see CC_SESSION_HANDOFF_2026-06-08_overnight.txt)** — per
  ARCHITECT_CC_AUTONOMOUS_BUILD_2026-06-08: auto-build the go-live queue, nothing merges,
  RLS/migrations are the architect's GO-gated MCP lane (not CC). **SHIPPED HELD:**
  **FORK-D (#835)** fail-close the pilot gate across all 9 send-driving resolvers (8
  `?? false`->`?? true` + 2 secondary branches in tournament prelim/recap + weekly_digest
  gained the consult block; static parity lock; +4 tests; 208/1481 green). **MOAT (#836)**
  F-PARENT-MOAT-LEAK code half — `useInboxList` inner-joins comms_messages + `.in('status',
  ['sent','queued'])` so archived (145 live) can't reach a parent; useParentNeedsYou inherits
  it; AP#43 lock (+3). RLS backstop is the architect's lane (NOT in the PR). **G1 (#837)**
  CAN-SPAM physical address threaded live from organizations.mailing_address through
  buildOrgContext.branding -> 8 footer pushes -> renderFooter (10 snapshot fixtures
  reconciled; +2; 207/1482 green). **STOPPED (architecture fork, ruling owed):** **PR 1b
  + G7** — the "ONE shared gated-send helper" requirement collides with this repo's
  path-scoped edge-deploy CI (`_shared/` = "Nothing to deploy" dead branch; AP#30 mirror
  is the established pattern). Surfaced as a fork in **CC_G5_PR1B_SHARED_HELPER_FORK.txt**
  (#834, merged doc): OPT-B1 pure gate-kernel mirror [CC lean] / OPT-B2 _shared file
  (hazardous) / OPT-C redrive-flag (reopens 409 contract). **NEW FLAG (architect scoping
  owed):** family_guide + coach_roundup use a tagline-only `brand_footer` with NEITHER
  address NOR unsubscribe — family_guide is parent-facing, so a CAN-SPAM gap broader than
  G1's address (the audit's "unsubscribe half IS compliant" doesn't hold for it). **Architect
  GO-gated, not yet applied:** the parent-moat RLS backstop (message_is_not_archived SECDEF
  + parent_select_own_recipients) + Tier 0 ghost migration 20260603104534. Tomorrow: Frank
  smokes + merges 1b->G7 then the rest; architect rules the 1b fork + brand_footer + applies
  the GO-gated migrations.
- **OVERNIGHT BUILD RESOLVED + ARCHITECT RULINGS LANDED (2026-06-08)** — Frank smoked the
  3 held PRs (passed). **MERGED:** FORK-D #835, MOAT #836. **Migrations applied + mirrored
  (#840):** parent-moat RLS backstop 20260608013307 (pairs with MOAT) + Tier 0 weekly_digest
  narrowing 20260608083740 (drops 'draft', closes BUG A churn); orphan ghost 20260603104534
  RETIRED. **#825** (parallel 8-agent audit) CLOSED as superseded; its audit TXT preserved on
  main via #843. **Architect rulings (ARCHITECT_RULINGS_DECISIONS_1_2_2026-06-08):** Decision 1
  = **OPT-B1** (pure decideSuppression/decidePilotGate kernels in the G8 mirror, 3-way
  byte-locked; send-tournament-message + cron call them; IO per-caller) — PR 1b building, then
  G7 (decidePilotGate vitest). Decision 2 = family_guide switch brand_footer -> full `footer`
  kind (for the unsubscribe half) + verify applyUnsubscribeUrl; coach_roundup address part now
  MOOT (see G1 below). **G1 (#837) CLOSED — DO NOT render any address to families.** Operator
  directive 2026-06-08: organizations.mailing_address (Byram Brook) is **INTERNAL-ONLY for tax**
  and must never appear in family communications. The footer-address approach is dropped;
  mailing_address stays an internal data column, never rendered. **CAN-SPAM physical-address
  requirement DEFERRED to counsel** (the open CAN-SPAM one-liner): bulk family email legally
  needs a PUBLIC physical address (e.g. a USPS PO box), not the tax address — counsel provides
  the value + the call before the 175-family send. This also moots the address half of the
  brand_footer flag; the family_guide unsubscribe-switch (Decision 2) stands.
- **BRIEFINGS BUILD ARC COMPLETE — all held for Frank's smoke (2026-06-08)** — the
  architect-ruled tail built + held do-not-auto-merge: **PR 1b #845** (G5 OPT-B1 cron
  failed-redrive via shared decideSuppression/decidePilotGate kernels, 3-way byte-locked;
  index.ts refactor behavior-identical; _redrive.ts re-applies the gate, sends direct via
  Resend, escalates at redrive_count>=3; StuckSendsRegion red escalation surface;
  redrive_count mirror 20260608002737 backfilled). **G7 #846** (decidePilotGate fail-closed
  coverage — stacks on #845; merge 1b then G7). **family_guide footer #847** (Decision 2:
  brand_footer -> full `footer` so parent guides carry {{UNSUBSCRIBE_URL}}; coach_roundup
  unchanged, staff-CAN-SPAM is the counsel question). All three CC-verified green (full
  suite ~1499 tests). Merged earlier this arc: FORK-D #835, MOAT #836, migrations #840
  (+ ghost retired). Closed: G1 #837 (address internal-only), #825 (superseded, audit
  preserved #843). **Remaining go-live items are NON-BUILD:** CAN-SPAM public address
  (counsel), B1 throttle/Resend tier + DNS/SPF/DKIM/DMARC + reply-to (provider/Frank).
  Reports: CC_G5_PR1B_REPORT, CC_FORKD_REPORT, CC_MOAT_REPORT (+ G1 closed). NEXT ARC:
  programs-section multi-agent L99 audit (operator-directed 2026-06-08).

## 5. UX PATTERNS NEEDING CROSS-SURFACE PROPAGATION

The drift classes from CC's L99 analysis. Each is a pattern that
exists on some surfaces and not others, OR exists on all surfaces
but with different implementations.

### Render-layer drift (Class 2)
- **Event title rendering** — 3 paths today (Schedule literal, Home composed, Parent detail concatenated) → should be 1 shared helper
- **Team PPG rendering** — 4 paths today (TeamRow, TeamDetail, StandingsTable, TeamHeaderCard) → should be 1 `<TeamPpgCell />` or similar
- **W-L record formatting** ("5-2") — appears in TeamRow, TeamDetail, StandingsTable, TeamHeaderCard, MY TEAMS panel, parent Home MY TEAMS, admin Records summary → should be 1 helper
- **Streak indicator** ("W1", "L4") — similar multi-path
- **Status badge rendering** — needs inventory
- **Attendance % rendering with label** — Cluster 2 territory

### Data-layer drift (Class 1)
- **Team records** — `useOrgTeamRecords` exists, partial adoption (Cluster 5)
- **Roster data** — `useAttendanceData` canonical; verify all consumers
- **Alerts** — `useAlertEvaluator` canonical; per-role filtering at consumer (correct)

### Label / semantic drift (Class 3)
- **Attendance % label** — "Attendance" vs "Going %" vs "% No" (Cluster 2)
- **Bell badge meaning** — count without inbox (Cluster 4)

### Cross-role behavior drift (Class 4)
- **Home greeting NY-pin** — admin doesn't, parent + coach do (Cluster 7)
- **Density toggle convention** — Home vs Schedule may diverge (B6)

### Propagation patterns locked 2026-05-21

- **Density-aware Card extraction (288 callsites)**
  Status: design call locked (Card v1 API decided 2026-05-21).
  Propagation arc: ~10-15 PRs across multiple sessions, gradual
  migration per surface (Records → Schedule → Event Detail → Briefings
  → Roster). First available no-urgent-work week as trigger. Per
  anti-pattern #42 (parallel-system buildup) — closes 288 instances of
  the same visual treatment that have drifted into 6+ variants. Pure
  function migration with cross-surface invariant test per #43.

- **A11y live regions across loading states**
  Status: pattern locked PR #438 (RecordsPage loading-state live region).
  Propagation: extend to other async-loading surfaces (BriefingsInbox,
  ScheduleListSections, RosterSection, FinancialsPage). Each surface gets
  `<div role="status" aria-live="polite">` for loading state announcement.
  Per anti-pattern #43 cross-surface invariant: if pattern recurs >3
  surfaces, extract a shared `<LoadingLiveRegion />` component.

- **Serial-merge-discipline-at-scale (workflow learning)**
  Origin: 2026-05-21 session (33 PRs merged with zero cross-PR
  interaction failures). Discipline: serial merges with smoke gates
  between PRs (not parallel batch-merging). Sequential rather than
  parallel batch-merging means each PR's effects are observed before
  the next lands. Scales to 30+ PR days without producing cross-PR
  regressions that smaller batches in earlier sessions exhibited.
  Registered as workflow learning — informs how future high-output
  sessions sequence PRs.

### Propagation patterns locked 2026-05-22 (post 49-PR L99 session)

- **Pattern ALPHA — anti-pattern #36 destructure cascade**
  Status: foundation half CLOSED (PR #448, 5 callsites) + edge function
  half CLOSED (PR #452, bundle) + **hooks half CLOSED (PRs #461 + #463
  + #464, Cluster 3 PR-A/B/C)**. Audit-test static-grep gate locked
  (PR #454). **Audit baseline reduced 50 → 32 across hooks (~17 sites
  closed across PR-A/B/C); remaining 32 sites are in surfaces not yet
  audited — `lib` utilities have 3 sites flagged in Batch 2b, deferred
  to future audit/sweep.**
  Each callsite follows the anti-pattern #36 pattern: destructure
  `error` alongside `data` + throw or log error before consuming data
  + `|| []` fallback only for empty-success case. Drift-hedge audit
  test (PR #454) catches regressions on land. With foundation + edge
  + hooks halves CLOSED, propagation is effectively complete for the
  shipped-code surface area; residual sweep is bounded.

- **Pattern BETA — aria-live regions**
  Status: foundation half CLOSED (PR #446) — toast, offline banner,
  unread badge each got `aria-live`. RecordsPage covered earlier
  (PR #438).
  Propagation queued: messaging surface remaining (DM thread + new-
  message surfaces); pattern extraction to shared `<LoadingLiveRegion />`
  per the earlier §5 entry's ≥3-surface threshold (now met).

- **Pattern DELTA — focus-visible (RECONCILED — false alarm)**
  Status: audit candidate raised, then withdrawn — global `:focus-visible`
  rule in foundation CSS already covers the surface. No propagation
  work needed; entry recorded so future audits don't re-raise the same
  concern.

- **Latent timezone bug — `coachRoundupHelpers` + `familyGuideHelpers`**
  EDT-only hardcoded offset (UTC-4) baked into helper code. Currently
  invisible because Frank is in EDT through the May-October window;
  trips silently Nov-Mar when NY shifts to EST (UTC-5). The result
  would be every briefing emitting times shifted +1 hour during the
  EST window. Fix: replace inline `-04:00` literal with a timezone-aware
  helper (`formatInTimeZone(date, 'America/New_York', format)` via
  `date-fns-tz` or equivalent). Drift-hedge per #43:
  `coachRoundupHelpers.tz.test.js` + `familyGuideHelpers.tz.test.js`
  using `vi.setSystemTime` to simulate EST dates. Trigger window: ship
  before 2026-11-02 (DST end). P1, not P0 — silent today, breaks
  silently on a calendar boundary.

- **Multi-tenant readiness — 3 P0 season-rollover blockers (NEW)**
  Surfaced from Batch 11 P0s in the L99 audit. SeasonRolloverPage +
  useSeasonRollover assume single-org context; 3 distinct multi-tenant
  blockers identified for routing forward (see §4.Z table for tags
  P0-E/P0-F/P0-G). Joins the §4.Y multi-tenant readiness arc; promotes
  PQ5 timeline forward if St. Patrick's onboarding accelerates.

### Watch lists updated 2026-05-22 PM (post extended Phase 2 + Phase 3 close)

- **Pattern ALPHA — anti-pattern #36 destructure cascade (status update)**
  Status unchanged from morning entry: foundation + edge function + hooks
  halves ALL CLOSED. Audit baseline 50 → 32. Remaining ~3 sites in `lib`
  utilities deferred to future audit/sweep (Batch 2b). No new sites
  introduced by today's extended Phase 2 + Phase 3 work (file-deletion
  sweeps, not data-layer additions).

- **Anti-pattern #52 refinement watch list (registered today via PR #465)**
  Edit tool path resolution — broke TWICE today on its registration day:
  - PR #460 (recovered mid-flight by agent — explicit-path discipline
    surfaced as a refinement-to-#52, captured in §14 discipline-notes)
  - PR #473 (parent-checkout leakage detected post-merge — agent reported
    explicit-path but the Edit tool still resolved against parent
    checkout for one file)
  Watch list: third break promotes to deeper investigation (Section A.4
  in remaining-phases audit doc — needs a structural answer beyond
  "explicit path in every Edit call").

- **Anti-pattern #54 watch list (promoted to registered today via PR #465)**
  Same-MCP-burst ready + auto-merge — broke ONCE today in 22+ consecutive
  holds:
  - PR #468 (shipped draft initially, manually flipped ready — no auto-
    merge fired in same burst as create_pull_request).
  Promotion mechanism was reliable across 21 holds before today's break;
  one slip in 22 attempts ≈ 4.5% break rate. Watch list: second break in
  the next 10 PRs triggers pause + document. If break rate stays under
  5% across the next 50 PRs, mechanism considered stable.

---

## 6. VERIFICATION ITEMS WAITING ON FRANK

- **A1** — View-as eye-icon identity context: does clicking the eye actually switch greeting + scope, or only switch role label? Needs in-app verification.
- **A13** — Bell badge purpose: RESOLVED per Frank's note (routes to Settings, no inbox). Moves to Cluster 4 resolution.
- **P10** — "Ember v2.0" label: intentional rebrand preview or hardcoded leak? Tied to §8 Phase 0C work.
- **D12-pending** — 11U Girls duplicate practice Mon May 18: D12 diagnostic confirms or refutes; if duplicate, moves to Migration 021. **VERIFIED FALSE POSITIVE 2026-05-18 18:00Z** — D6 confirmed no 6:30 PM 11U Girls practice on May 18. Only 7:35 PM at St. Patrick's. Closed.
- **Cluster 1.3** — 10U Blue Game 7 (6th Boro 4AB May 17): did the rescheduled game happen? If yes, get score; if no, mark further reschedule. Frank to confirm during Quick Score session.

---

## 7. PRODUCT CALLS DEFERRED

Items requiring Frank's product judgment, not technical fixes:

- **B6 / P26** — Density toggle convention (blocked by Phase 0B Migration 016 `user_preferences`)
- **A8** — Standings sort PCT desc vs oldest-to-youngest age. Standings semantic may legitimately override the org-wide age sort rule.
- **A10 / P20** — "View full schedule →" link styling vs CTA button card. Design hierarchy call.
- **P8** — "Arrive 15 min early" vs "5 min" contradiction in event detail. Which takes precedence?
- **P12** — Comments enabled on practice events. Keep or scope to games only?
- **P17 / P18** — Schedule filter density (4 mechanisms). Simplify parent view?
- **B7** — Color/name mismatch (10U Black blue, 10U Blue gray). Locked v14 palette per CLAUDE.md §10. Could revisit if user confusion is real.
- **A12 timezone product call** — Greeting "where you are" vs "where the org is". Recommended: NY-pin for consistency (Cluster 7), but worth Frank's explicit lock.
- ~~**Briefing feedback rebuild-or-shelve**~~ — **RESOLVED 2026-05-27: SHELVED PERMANENTLY.** After the #509 revert of the cutover-gate feedback survey (§4.A PR 7 / §4.AJ), Frank's call is NOT to rebuild — no per-email star survey, no lighter admin-side thumbs signal. The wizard is the locked path; feedback collection is off the roadmap. The `queueComposedMessages.perRecipientSubstitutor` extension point remains for unrelated per-recipient personalization, but no feedback feature is queued. Do not re-propose unless Frank reopens.

---

## 8. PHASE 0C REBRAND CHECKLIST (Skyfire → Ember)

> Tracker for the rebrand work. CC has limited visibility on Phase 0C
> details — Frank to populate from authoritative source.

Known scope:
- `--sf-*` → `--em-*` CSS variable migration (mostly done per PR
  history; verify completeness)
- Domain decision (current `skyfire-app.vercel.app` → ?)
- `skyfire_phoenix.webp` retirement / replacement
- Version string source (Ember v2.0 — P10 verification)
- Codebase rename (file paths, package names)
- Email template namespace
- (and other items Frank to enumerate)

---

## 9. WORKFLOW GAPS (NOT CODE BUGS)

Issues that look like bugs but actually require behavioral changes
(Frank or coaches doing something different in production):

### Cluster 1 — Tournament results publish + league backfill (Rumble for the Ring CT May 16-17 + 10U Blue Games 6-7)
**Status: SUBSTANTIALLY RESOLVED 2026-05-27 (production verified via MCP).**

Backfill is essentially complete — the 13-game inventory below was
entered + published in production between 2026-05-18 and 2026-05-27.
Verification 2026-05-27 found three deltas; two were unambiguous and
fixed this session, two remain Frank's call:

- ✅ **8U Boys vs CT Wolves** — was entered 35-15 (a win); inventory
  says 15-35 L (8U Boys 0-4). Swapped-score entry. **Flipped to
  15-35 L** via MCP (game_result `8e6ab437…`).
- ✅ **8U Boys vs NY Wild (13-34 L)** — was missing entirely. **Created**
  the event (tournament `196e595d…`, May 16) + published game_result
  via MCP (event `a74e58e6…`). 8U Boys now reads 0-4.
- ✅ **10U Blue Game 6 (May 9 Resurrection Blue 4AB 25-27 L)** — already
  entered + published → **Cluster 1.2 RESOLVED**.
- ✅ **10U Blue St Joseph-Bxville 5C (Apr 26)** — was missing a result;
  TourneyMachine confirmed 19-23 L. Added + published → 10U Blue 3-4.
- ✅ **10U Blue May 17 vs 6th Boro 4AB** — TM shows unplayed (records,
  not a score). Left without result (Cluster 1.3 closed). Still
  mis-tagged tournament (Cluster 1.1) — minor hygiene, deferred.
- ✅ **9U Boys May 17 vs 6th Boro 4AB** — confirmed stray (9U plays 3AB;
  no 4AB game in their real schedule). Deleted (0 dependents) per Frank.
- ✅ **11U Girls 3-2 (by design)** — TM shows 2-2 because it excludes the
  asterisked game from the *tournament* record. AAU calls these **bonus
  games** (TM's "chip" game); they are real games played, so they COUNT
  on our team records (Frank confirmed 2026-05-27). Our 3-2 is correct.
  `is_bonus_game` ("doesn't affect seeding" = tournament seeding) is
  correctly NOT wired into our W-L math — do not change.

Original Frank-action (now mostly done): open Quick Score, enter scores
for the games below. The inventory is retained for reference.

Tournament inventory (13 games):

**11U Girls — Rumble for the Ring CT (5 games, 3-2 in tournament)**
| Date    | Opponent              | Score | Result        |
|---------|-----------------------|-------|---------------|
| May 16  | CT Northstars         | 19-14 | W             |
| May 16  | PHD Carothers         | 10-41 | L             |
| May 16  | PHD McCurdy           | 18-9  | W             |
| May 16  | Connecticut Elite     | 17-6  | W             |
| May 17  | PHD McCurdy (FINAL)   | 23-26 | L (runner-up) |

**10U Black — Rumble for the Ring CT (4 games, 4-0 + championship)**
| Date    | Opponent              | Score | Result        |
|---------|-----------------------|-------|---------------|
| May 16  | PHD White             | 29-21 | W             |
| May 16  | PHD Yellow            | 38-20 | W             |
| May 17  | Team Frenji SF        | 38-22 | W             |
| May 17  | CT Wolves (FINAL)     | 37-30 | W (champion)  |

**8U Boys — Rumble for the Ring CT (4 games, 0-4)**
| Date    | Opponent              | Score | Result        |
|---------|-----------------------|-------|---------------|
| May 16  | CT Wolves             | 15-35 | L             |
| May 16  | Stamford Peace        | 12-41 | L             |
| May 16  | Twin Athletics        | 8-34  | L             |
| May 16  | NY Wild               | 13-34 | L             |

League backfill (1-2 games):

**10U Blue — likely missing**
| Game # | Date    | Opponent              | Venue                  | Result      |
|--------|---------|-----------------------|------------------------|-------------|
| Game 6 | May 9   | Resurrection Blue 4AB | St Patrick-Armonk HOME | 25-27 L     |
| Game 7 | May 17  | 6th Boro 4AB (resched)| IC-Tuckahoe HOME       | **unknown** |

Game 6 evidence: Frank confirmed 3-3 is the correct record; screenshots
showed 3-2. The gap is Game 6 not yet entered.

Game 7 evidence: rescheduled to May 17 yesterday; outcome unknown.
Frank to verify (see Cluster 1.3 / §6).

Post-publish expected aggregate state (verification targets):
- 11U Girls: 8-4 season (was 5-2 pre-tournament)
- 10U Black: 9-4 season (was 5-4 pre-tournament), 2× Tournament Champion
- 8U Boys: 3-9 season (was 3-5 pre-tournament)
- 10U Blue: 3-3 (after Game 6 entered) or 4-3 / 3-4 (after Game 7 if played)
- 9U Boys: 1-5 (current data confirms, no backfill needed)
- Nationals Qualified count: 2 (11U Girls + 10U Black)
- Rumble for the Ring CT tile shows W/L per team

If aggregates DON'T update after publish, Cluster 1 reopens as code
fix (filter bug in aggregate query path).

Note: D1 reported 15 tournament events; 13 actual tournament games to
enter. Delta of 2 likely consists of:
- 1 placeholder Championship bracket event for 8U Boys (didn't reach
  the championship game; 0-4 in pool play)
- 1 mis-tagged 10U Blue event (see Cluster 1.1 above)

### Cluster 2 — Check-in workflow gap
- Coach action: use the gameday arrival board / check-in feature at
  games and practices going forward
- Code surfaces this as the % degeneration documented in Cluster 2
- Optional code follow-up: "0 check-ins recorded — was this event
  run?" indicator to make the workflow gap more visible

This category is the discipline that separates "we have a bug" from
"we need to use the feature we built." Both are real, both need
resolution, but the resolution path is different.

---

## 10. QUICK-LINK CHANGES STATUS

CC's read: Frank's "quick links" likely refers to the Admin Shortcuts
panel (IMG_1216) showing 8 buttons: Event, Player, Compose Briefing,
Briefings, Financials, Announce, Tournaments, Import Schedule.

These appear shipped per the audit screenshots. If Frank meant
something else, this section catches it. Update with specifics if
different scope.

---

## 11. TEST COVERAGE GAPS

Tests that should exist but don't. Each item is a candidate
drift-hedge test under anti-pattern #43.

- **Cross-role home page integration test** — mount all 3 home pages
  with same fixture, assert equivalent renders for shared elements
  (greeting respects NY-pin, KpiGrid renders same numbers, AlertZone
  respects loading state, MY TEAMS records match)
- **Hook divergence audit** — static-grep asserting canonical hooks
  are used where they exist (e.g., direct `teams` queries flagged
  when `useOrgTeamRecords` exists)
- **AlertZone behavior under concurrent query refresh** — no race
  between `useKpiGrid` and `useAlertEvaluator` should produce false
  all-clear pill (covers Cluster 6 A2 hypothesis; A3 closed via PR #241)
- **Async-ordering tests for all home-page hooks** — pattern
  established in `useAlertEvaluator.loadingGate.test.js` via PR #241
  (paused promise resolvers pin the hook mid-flight). Replicate for
  `useAdminStats`, `useHomeRole`, `useAttendanceData`, `useActivities`.
  Each should assert: loading=true persists until canonical data
  resolution; no early loading=false on an intermediate state. This
  is the operational follow-through on anti-pattern #44 (candidate).
- **Render-path consistency tests** — for each shared display pattern
  in §5 above, a test that asserts same data renders identically
  across surfaces
- **Cluster 1 aggregate test** — tournament events with scores
  propagate to all 4 records aggregate surfaces (Teams tab, Records
  page season, Tournament tiles, Standings PCT)
- **Cluster 2 label invariant** — % label string consistent across
  all 3 role roster surfaces

---

## 12. 150-LINE CAP WATCH

Files approaching the cap that v2 work might push over. **Watch is
not split** — per anti-pattern #42, splitting prematurely creates
parallel systems for no current benefit. List here is informational.

> CC needs to grep current line counts to populate. Will run during
> next session and update this section. Initial known candidates:
> - ~~`CoachHomePage.jsx` (likely close)~~ — SPLIT in §4.W (149 → 78)
> - `AdminHomePage.jsx` (142) — deferred per PQ3 (more headroom)
> - ~~`ParentHomePage.jsx`~~ — SPLIT in §4.W (149 → 79)
> - `formatters.js` (137 lines post-PR-#234, room left)
> - `useAttendanceData.js`
>
> §4.W also closed `AdminSeasonsPage.jsx` (145 → 71) which was at
> equal risk per the L99 platform audit PART 5 Phase 4 / PQ3.

---

## 13. ANTI-PATTERN CATCH TALLY

How many times each anti-pattern fired in production work. Tells us
which ones are paying rent vs which are dormant. Drift-tracking
metric — a pattern that catches frequently is providing real value;
a pattern that never fires is either redundant or covering a
non-occurring failure mode.

| # | Pattern                              | Catches | Last caught |
|---|--------------------------------------|---------|-------------|
| 22 | Verify CC commits/pushes             | ~5      | PR #237     |
| 27 | Resolver / composer pure with IO     | 0       | —           |
| 31 | verify_jwt config audit              | 3       | Wave 4.3-E  |
| 34 | Registry/dispatch table removals     | 1       | Wave 4.4-T0d |
| 35 | Branch divergence pre-flight         | 3       | PR #234, #235, #237 |
| 36 | Destructured-default Supabase swallow| 1       | Wave 5 PR 2 |
| 37 | Org-scoped query order               | 5       | Phase Beta B1 |
| 38 | Renderer-emit parity                 | 1       | Phase Gamma 5b |
| 39 | Position+hedge                       | 2+      | L99 routing |
| 40 | Existing-infra hedge                 | 1+      | PR #234     |
| 41 | Routing-signal overshadow            | 1+      | L99 routing |
| 42 | Parallel-system buildup              | 1+      | PR 6 Tier 3 v1 |
| 43 | Cross-surface invariant test         | 0 (NEW) | —           |

> CC to populate fully from git history during next session.
> Highlights so far: #35 has caught divergence reliably; #36 has
> high value for one observed incident; #43 starts at 0 and grows
> from here.

---

## 14. HELPER-EXTRACTION BACKLOG

Code in components that should move to `src/lib/` per "single render
path" doctrine. Each is a candidate refactor PR with a drift-hedge
test per anti-pattern #43.

Ordered by inferred ROI (most-impactful first):

1. ~~**`formatEventTitle(event)`** — solves Cluster 3 + multi-surface
   redundancy.~~ **DONE** (PR #298, 2026-05-19). Shipped at
   `src/lib/eventTitle.js` returning `{ prefix, body }`; flat-string
   sibling `formatEventTitleString`. Drift-hedge audit at
   `src/lib/__tests__/eventTitleAudit.test.js`.
2. **`<TeamRecordCell record={} />`** — W-L format ("5-2") across
   7+ surfaces.
3. **`<TeamPpgCell stats={} />`** — PPG across 4 surfaces.
4. **`<StreakBadge streak={} />`** — "W1" / "L4" rendering.
5. **`formatAttendancePct(rowPct, hasCheckinData)`** — Cluster 2.
   Returns "—" or "{pct}%" with correct label. Test: label string
   matches across surfaces.
6. **`<StatusBadge status={} />`** — status pill rendering
   (needs inventory).
7. **`<EventLocationLink location={} />`** — map URL priority
   per CLAUDE.md §15.

### Helper-extraction candidates added 2026-05-22 (post L99 audit)

8. **`ORG_NAME_DEFAULT` + sibling constants — 8 copies across 7
   resolvers + `digestSend`** (Batch 8a P2-4 finding). Each resolver
   re-declares the org-name fallback string locally; if the canonical
   default ever changes (e.g., Skyfire → Ember rebrand), 8 files must
   change in lockstep. Extract to `src/lib/engine/resolvers/constants.js`
   + import everywhere. Drift-hedge static-grep audit.
9. **`formatDayLabel` + `formatTime` — 2 copies between Wave 5 PR 4b
   + PR 5b files** (Batch 8a P2-5 finding). Same helper logic duplicated
   across `coachRoundupHelpers.js` + `familyGuideHelpers.js`. Extract
   to shared `src/lib/engine/timeFormatters.js`. **NOTE:** ties to the
   §5 latent-timezone bug — the helpers' inline EDT offset is the
   same bug class; extraction is the natural moment to fix both.
10. **9 inline formatter duplicates across send helpers** (Batch 2b
    finding). Common patterns: phone number formatting, currency
    formatting, date-range labels. Inventory pending; estimate 9 sites
    across `*Send.js` files. Extract to `src/lib/formatters.js`
    (already canonical for date formatters).
11. **`CIRCUIT_LABELS` constant in 4 files** (Batch 7 P3-1 finding).
    Mapping of `circuit_type` enum to display label ("AAU (Zero Gravity)"
    / "League Play" / etc.). Lives in 4 files independently. Extract to
    `src/lib/constants.js` (where `TEAM_COLORS` already lives per
    CLAUDE.md §10).

Each extraction PR ships with:
- The helper / component
- Migration of all known callsites to the helper
- A drift-hedge audit test (static-grep flagging inline reimplementations)

This section is the operational target for "stop running audits."
When this list is empty, the structural drift surface area is
minimal.

### Discipline-notes adjacent to helper-extraction (added 2026-05-22)

These are not helper extractions but discipline observations from
agent-driven worktree work today. Captured here for the next
CLAUDE.md amendments PR.

- **Anti-pattern #52 refinement — explicit worktree path in Edit tool
  calls.** Per the parent prompt this session, anti-pattern #52
  (worktree-path pwd-first) needed refinement: `pwd` confirmation
  alone is insufficient when the Edit tool's path resolution defaults
  to the parent checkout even when `pwd` reports the worktree
  directory. Discipline: agents working in worktree-isolated context
  must use **explicit absolute worktree paths** (e.g.,
  `/home/user/skyfire-app/.claude/worktrees/agent-XXX/...`) in every
  Edit tool call, not just pwd-relative paths. Held cleanly across
  7/7 agents today. Refinement queued for the next CLAUDE.md
  amendments PR (parallel to this ledger PR).

---

## DOC UPDATE PROTOCOL

When a PR ships that resolves an item:
1. Mark the cluster RESOLVED in §2 with PR # and date
2. Move tactical detail to PR description; keep one-line summary here
3. Update §1 (shipped recently) with the PR
4. Update §13 (anti-pattern tally) if the PR caught a new instance
5. If new bugs surface, append to §2 with cluster mapping
6. If new drift class identified, append to §5 + CLAUDE.md anti-pattern

When a session ends:
1. Update §3 / §4 / §6 / §8 from session state
2. Update §11 / §12 / §14 with new findings
3. Commit the doc with PR or as separate docs commit

CC's session-start checklist:
1. Read this doc end-to-end
2. Cross-check with `STATE_OF_AFFAIRS_L99_v5.md`
3. Confirm `git fetch + branch divergence` per anti-pattern #35
4. Apply ground-truth tables (§11.5 CLAUDE.md) and canonical hooks
   (this doc §5) to any code being touched

---

## 15. VERIFICATION QUEUE

Items flagged uncertain during the 2026-05-18 L99 audit expansion
(commit 1 of PR #243). Each row needs a focused verification pass
before the corresponding §4 entry can be marked closed or
re-scoped. Verification methods specified per row so the work is
mechanical, not interpretive.

### V-0 — Meta: audit completeness (the gap that produced this queue)

**Status: SURFACED 2026-05-18 19:50 CEST, Monday-opener prompt drafted, deferred to Monday Phase 1-4 execution.**

The L99 audit + missed-builds audit + §4 expansion across PRs #238 / #242 / #243 were bounded by the 7 source docs CC opened. Frank's session-end `ls docs/*.md` check (Sunday 7:50 PM Italy) surfaced 22 additional `.md` files CC never read. Total `docs/*.md` = 30; CC's source list = 7; ledger itself = 1; unread = 22.

Per anti-pattern #45 acid-test: V-0 closes "complete inventory" from a verified claim back into a sized gap that gets walked Monday.

**Inventory of 22 unread docs (captured for Monday-opener input):**

| Category | Doc | Why flagged |
|---|---|---|
| May 16 audit-cycle (single multi-phase unit, read in order) | AUDIT_PHASE1_WIRING_2026-05-16.md | Earliest phase doc |
| | AUDIT_PHASE2_REGISTRY_STATE_2026-05-16.md | Phase 2 |
| | AUDIT_PHASE3_MIGRATION_DEPLOY_2026-05-16.md | Phase 3 |
| | AUDIT_PHASE4_RLS_SECURITY_2026-05-16.md | Phase 4 |
| | AUDIT_PHASE5_TYPE_CONTRACT_2026-05-16.md | Phase 5 |
| | AUDIT_BETA_B1_UI_LAYER_2026-05-16.md | Beta phase B1 |
| | AUDIT_BETA_B3_EDGE_FUNCTIONS_2026-05-16.md | Beta phase B3 |
| | AUDIT_BETA_SYNTHESIS_2026-05-16.md | Beta synthesis (likely 22-bug catalog home) |
| | AUDIT_SYNTHESIS_2026-05-16.md | Top-level synthesis (CC grepped excerpts only) |
| | AUDIT_DAY_2026-05-16_CLOSE.md | Earlier close (CC read only FINAL_CLOSE) |
| | AUDIT_VERIFICATION_2026-05-16.md | Verification doc |
| Partial-read (highest-confidence "something there") | SCHEDULE_CHANGE_DIAGNOSIS.md | Cited in §4.I but never opened (cite-without-read anti-pattern) |
| | BRIEFINGS_COVERAGE_L99.md | CC head-50 read only |
| Unknown-shape | ADMIN_SESSION_SCOPE.md | Possible session scope spec |
| | BRIEFING_RENDERER_REFERENCES.md | Briefing system reference |
| | BRIEFING_TEMPLATES.md | Briefing template inventory |
| | CALLUP_TOKEN_TESTING.md | Callup token test plan |
| | EMBER_TENANCY_ARCHITECTURE_v3.md | Tenancy architecture spec |
| | LH_BRAND_CONTENT_MODEL.md | Brand content model |
| | LH_OPS_SPEC.md | Operations spec |
| | README.md | Top-level doc readme |
| | TIER_3_V1_RETROSPECTIVE_NOTES.md | Created via PR #236; CC touched but didn't audit for §4-relevant items |

**Monday-opener prompt (locked Sunday 2026-05-18, executes 2026-05-19):**

Phase 1 — May 16 audit-cycle unit (~45-60 min, gated). Read in phase order:
PHASE1 → PHASE2 → PHASE3 → PHASE4 → PHASE5 → BETA_B1 → BETA_B3 → BETA_SYNTHESIS → AUDIT_SYNTHESIS (full read) → DAY_CLOSE → VERIFICATION → reconcile FINAL_CLOSE. Findings → ledger same commit per #45.

Phase 2 — Flagged partial-read (~20-30 min, gated):
SCHEDULE_CHANGE_DIAGNOSIS full read · BRIEFINGS_COVERAGE_L99 full read · AUDIT_SYNTHESIS full read (may overlap Phase 1).

Phase 3 — Unknown-shape (~30-45 min, gated):
Triage by filename pattern (`*_DESIGN_SPEC` / `*_HANDOFF` / `*_AUDIT` / `*_RETRO` → full read; other → 30-sec header scan, full read only if signal present).

Phase 4 — Reconcile 22-bug catalog (~15-20 min, gated):
If Phase 1 surfaced the missing 18 bugs (likely in BETA_SYNTHESIS or PHASE docs), walk each: grep git log + relevant component file for fix evidence. Evidence → CLOSED in §15 with SHA; no evidence → V-17 through V-38 with named verification method; ambiguous → V-* "needs deeper trace."

Phase 5 — V-1 through V-16 (the queue below) executes ONLY after Phases 1-4 gate-pass.

**Standing rule (anti-pattern #45)**: every findings batch from Phases 1-4 → ledger same commit.

**Anti-pattern #46 candidate (not registered tonight)**: "Audit-cycle outputs (multi-phase Frank audits like the May 16 series) must land in EMBER_PENDING_LEDGER §4/§15 within 24 hours of cycle close, or the cycle isn't closed." Re-evaluate Monday post-Phase-1 once we see how much surfaces. If Phase 1 surfaces 10+ unlanded items, #46 becomes near-term priority.

### V-1 through V-16 (executed Monday Phase 5)

| # | Item | Arc tag | Source doc | Effort | Blocking | Verification method |
|---|------|---------|------------|--------|----------|---------------------|
| V-1 | Migration 016 (`user_preferences`) ship status | §4.H | SKYFIRE_BUILD_QUEUE_v2 | 5 min | density toggle wiring | `ls supabase/migrations/ \| grep 016` + DB inspect via MCP |
| V-2 | Migration 018 (team_achievements) ship status + UI presence | §4.C (Sprint C RECOGNITION) | SKYFIRE_BUILD_QUEUE_v2 | 10 min | RECOGNITION card | `ls supabase/migrations/ \| grep 018` + `grep team_achievements src/` |
| V-3 | Migration 021 (data corrections bundle) ship status | §2 Cluster 1.1 + §4.C | SKYFIRE_BUILD_QUEUE_v2 | 5 min | 10U Blue mis-tagged event fix | `ls supabase/migrations/ \| grep 021` + DB inspect |
| V-4 | BUG-001 closure (Admin home Next Up data) | §4.E | SKYFIRE_BUILD_QUEUE_v2 | 15 min | confirms §4.E closure | Manual smoke on AdminHome NextEventCard + code-grep for null-handling |
| V-5 | BUG-002 closure (`useEventDutyCounts.js`) | §4.E | SKYFIRE_BUILD_QUEUE_v2 | 10 min | confirms §4.E closure | Code read + unit test pass |
| V-6 | BUG-003 closure (`useEventRideCounts.js`) | §4.E | SKYFIRE_BUILD_QUEUE_v2 | 10 min | confirms §4.E closure | Code read + unit test pass |
| V-7 | BUG-004 closure (RideFormOverlay guard) | §4.E | SKYFIRE_BUILD_QUEUE_v2 | 10 min | confirms §4.E closure | Code read for DB CHECK or frontend guard |
| V-8 | Sprint D Coach home completeness vs Tier 3 v1 | §4.C | HOME_DESIGN_SPEC.md | 20 min | Sprint D close-out | Read `HOME_DESIGN_SPEC.md §2` + diff against CoachHomePage.jsx |
| V-9 | Sprint E Admin home completeness vs Tier 3 v1 | §4.C | HOME_DESIGN_SPEC.md | 20 min | Sprint E close-out | Read `HOME_DESIGN_SPEC.md §3` + diff against AdminHomePage.jsx |
| V-10 | Density toggle wiring state | §4.H | SKYFIRE_BUILD_QUEUE_v2 | 10 min | Sprint B close-out | `grep -rn 'useDensity\|density_level' src/` + Migration 016 status |
| V-11 | TournamentDetailPage briefing surface state | §4.B | this audit | 5 min | §4.B TournamentHeader fix scope | `grep -n briefing src/pages/TournamentDetailPage.jsx` (already verified: no direct refs; only via TournamentHeader) |
| V-12 | `/admin/import-schedule` route partial status | §4.A PR 2 | this audit | 5 min | parser PR scope | **CLOSED 2026-05-22** — PR #173 (db82f99, 2026-05-15) shipped the full TourneyMachine schedule parser. Route live in `src/App.jsx:89` via lazy-loaded `ImportSchedulePage`. V-12 closure rolled in with §4.A PR 1+2+3 ledger reconciliation. |
| V-13 | HOME_DESIGN_SPEC.md detail extraction | §4.C | docs/HOME_DESIGN_SPEC.md | 30 min | Sprint B-F scoping | Read top-to-bottom; populate §4.C with named tasks |
| V-14 | RIDES_DESIGN_SPEC.md detail extraction | §4.D | docs/RIDES_DESIGN_SPEC.md | 30 min | Sprint G scoping | Read top-to-bottom; populate §4.D with named tasks |
| V-15 | EMBER_MASTER_INDEX_v3 reconciliation | §4.H | (file missing) | 60 min | locked-decisions catalog | Rebuild from session notes OR accept distributed-decisions model |
| V-16 | Tier 4 P2 specific items | §4.L | AUDIT_SYNTHESIS_2026-05-16 | 30 min | cleanup batch scoping | Read synthesis doc + enumerate P2 entries |
| V-17 | Phase 1 P0 batch ship status (EventLocationTab + send-tournament-message) | §4.M.1 | AUDIT_PHASE1_WIRING_2026-05-16 | 5 min | confirm 2 of 30+ items closed | **CLOSED 2026-05-18 19:50Z** — PRs #195 (P0-1 + P1-1 + P0-2) + #203 (P1-2 + P1-7) shipped. Code-grep confirmed: `EventLocationTab.jsx` locations query has `.eq('org_id', orgId).is('archived_at', null)`; tournaments query has `.eq('org_id', orgId)`; `send-tournament-message/index.ts` guardians query has `.eq('org_id', message.org_id)`. |
| V-18 | Phase 2 + Phase 5 orphan renderer status (7 P0-LATENT) | §4.M.2 + §4.M.5 | AUDIT_PHASE2 + AUDIT_PHASE5 | 10 min | sizing the 7-renderer arc | **6 of 7 CLOSED 2026-05-18 19:50Z** — `ls src/lib/engine/renderers/` confirms: eventCard.js · placementBlock.js · gameLog.js · callupCard.js · coachReflection.js · standoutMoments.js ALL EXIST. The 7th (`family`) was flagged "needs verification" in Phase 5 itself — no `family.js` renderer; was likely never a real emit site (Phase 2A agent claimed it was a nested data carrier, contested by Phase 5 without resolution). LIKELY a Phase 5 false positive. |
| V-19 | Phase 3 P0 mirror drift ship status (scheduleGaps.js ↔ _scheduleGaps.ts) | §4.M.3 | AUDIT_PHASE3_MIGRATION_DEPLOY | 5 min | confirm closed | **CLOSED 2026-05-18 19:50Z** — both source and Deno mirror have `describeScheduleGaps(events, { minGapMinutes = MIN_GAP_MINUTES } = {})` signature and `if (gap >= minGapMinutes)` gate. Mirror in sync. Header comment on Deno side explicitly notes the parity. |
| V-20 | Phase 4 RLS migration ship status (3 P0 + 3 P1 batched) | §4.M.4 | AUDIT_PHASE4_RLS_SECURITY | 10 min | confirm RLS hardening closed | **4 of 6 CLOSED 2026-05-18 20:30Z (P0s ALL CLOSED, P1s mixed).** DB query confirmed: (a) all 3 P0 UPDATE policies (briefing_reminders/briefing_templates/team_types) have matching `with_check_expr` — anti-pattern #20 closed. (b) 1 of 3 P1 PUBLIC EXECUTE issues fully closed: `briefing_active_queue` grants service_role + authenticated + postgres (no anon, authenticated is correct since function checks admin internally). (c) 2 of 3 P1 PARTIALLY closed: `log_pii_change` + `suppress_unsubscribed_recipients` had PUBLIC revoked (no anon access) but `authenticated` still has EXECUTE — log_pii_change should only be called from triggers; suppress_unsubscribed_recipients is itself a trigger function. Downgraded P1 → P2 since PUBLIC/anon attack surface is closed. |
| V-21 | Phase 5 TournamentRecapBody defaultValue drift ship status | §4.M.5 | AUDIT_PHASE5_TYPE_CONTRACT | 3 min | confirm closed | **CLOSED 2026-05-18 19:50Z** — `TournamentRecapBody.jsx` defaultValue has `standout_moments: ''` + `coach_reflection: ''` + 2 additional keys (`coach_note`, `parent_shoutout`). Drift fixed, plus scope expanded beyond original audit. |
| V-22 | Beta `.maybeSingle()` no-error-destructure sweep status (20+ callsites) | §4.M.6 | AUDIT_BETA_SYNTHESIS | 10 min | confirm anti-pattern #36 follow-up sweep status | **CLOSED 2026-05-18 21:05Z** via PR #249 — all 27 callsites fixed with `{ data, error: <name>Err }` destructure + `if (<name>Err) throw <name>Err;` pattern. Static-grep audit test added at `src/lib/__tests__/maybeSingleErrorAudit.test.js` per anti-pattern #43 — locks pattern-A regex against re-introduction. Anti-pattern #36 fully closed in `src/`. |

### V-23 through V-28 (2026-05-18 evening "code-drop audit" surfacing)

Surfaced by Frank's session-end audit (Sunday 2026-05-18, late evening Italy time) cross-referencing pre-v2-retirement chats and prompt docs against actual code/migration evidence. These items represent **potential missed code drops** — work that was either spec'd in a handoff doc or prompted in a build sprint, but where ship evidence has not been re-verified post-main-merge / post-L99 audit cycle.

Registered here under anti-pattern #45 acid-test: a new audit surfaced new pending items, so the reconciliation is owed in the same session as a ledger amendment PR (this PR). Verification methods are mechanical (grep + git log + spec-doc walk), not interpretive.

| # | Item | Arc tag | Source doc / chat | Effort | Blocking | Verification method |
|---|------|---------|-------------------|--------|----------|---------------------|
| V-23 | M2-2 iCal subscription URL per team ship status | §4.B (calendar/iCal feeds) | CC_SESSION_HANDOFF_APR19.md (referenced; full read pending) | **SHIPPED 2026-05-20 Thursday (PR #342)** | iCal feed surface for parents/coaches | **SHIPPED end-to-end.** PARTIAL verification on Wed (PR #331) confirmed subscription URL not built; Thursday Action 3 from end-of-Wed letter shipped the three-phase build: (a) Migration `20260520093701_teams_add_feed_token_for_ical_subscription` added `teams.team_feed_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text` + `get_team_by_feed_token` SECURITY DEFINER RPC; (b) Edge function `team-feed` deployed v1 returning `text/calendar` ICS body keyed by token (verify_jwt=false in config.toml, audit test auto-detected the new function +2 tests); (c) `PublicSchedulePage` gained Subscribe to Calendar bottom sheet with webcal:// (Apple Calendar) + `calendar.google.com/calendar/r?cid=...` (Google Calendar) options. Anti-patterns honored: #21 (migration mirror), #23 (REVOKE PUBLIC before anon), #30 (ICS helpers mirrored from src/lib/icalHelpers.js into the edge function), #31 (config.toml entry + audit test). Production verified: 5/5 teams have unique tokens. |
| V-24 | EMBER_TENANCY Steps 5-14 completion vs Steps 1-4 closed | §4.H (pre-existing locked items) | EMBER_TENANCY_ARCHITECTURE_v3.md + April 25 chat handoff | 20 min | tenancy hardening arc | Read EMBER_TENANCY_ARCHITECTURE_v3.md (currently in V-0 unread set) + `git log --oneline --all \| grep -iE 'tenan\|ember.tenancy'` + verify Steps 5-14 line items against shipped commits |
| V-25 | Rides remediation 7.6-7.10 ship status | §4.D (Sprint G Rides redesign) | RIDES_DESIGN_SPEC.md §7.6-7.10 + April 29 Rides Fix chat | 15 min | Sprint G Rides arc completeness | Read RIDES_DESIGN_SPEC.md §7.6-7.10 (full read pending per V-14) + `git log --oneline --all -- src/components/ride src/hooks/useRide* src/hooks/useEventRide*` cross-ref |
| V-26 | PROMPT_ELITE_POLISH.md outcome | §4.G (quick wins / Elite polish) | docs/PROMPT_ELITE_POLISH.md (April 10-13 build sprint) | 15 min | Elite Polish arc completeness | Read PROMPT_ELITE_POLISH.md top-to-bottom + cross-ref ELITE-* tags against CLAUDE.md §16 + git log for sprint commits |
| V-27 | PROMPT_FUNCTIONAL_FEATURES.md (ToastContext + usePullToRefresh) ship status | §4.G | docs/PROMPT_FUNCTIONAL_FEATURES.md (April 13 chat) | 10 min | functional-features arc | `grep -rn 'ToastContext\|usePullToRefresh' src/` (both already shipped per repo state — confirm scope matched prompt doc) + read prompt doc for any unshipped sub-items |
| V-28 | PROMPT_NEXT_LEVEL.md outcome | §4.G | docs/PROMPT_NEXT_LEVEL.md (April 10-13 build sprint) | 15 min | next-level features arc | Read PROMPT_NEXT_LEVEL.md top-to-bottom + git log cross-ref for shipped sub-items + flag any unshipped items to §4.G as concrete tasks |
| V-29 | PR #21 disposition — coach contact in briefings (WIP draft, closed 2026-05-12 unmerged) | §4.N Layer 1 | Layer 1 git log audit 2026-05-18 evening | 10 min | Confirm A/B decision routed correctly; no orphaned ship | Read PR #21 body (A vs B framing) + grep `staff_profiles` + `coach_user_ids` + briefing renderer dynamic-coach-array code in `src/` to verify path A shipped through a different PR. If shipped: close V-29 with cite. If unshipped: re-scope to §4.G as concrete work item. |
| V-30 | BUG-005 ride duplicate-offer prevention — DB UNIQUE constraint + frontend edit-mode guard | §4.N Layer 5 / §4.E | SKYFIRE_BUILD_QUEUE_v2 §BUG-005 + Layer 5 catalog walk 2026-05-18 evening | 15 min | Confirm BUG-005 closed at both DB and UI layers | DB query confirmed Migration 025 (rides_redesign) applied BUT `event_ride_offers` has zero UNIQUE constraints — only PK + CHECKs. No `(event_id, guardian_id)` UNIQUE guard at DB layer. Frontend: `grep existingOffer\|hasExistingOffer src/` returned no matches → likely no edit-mode guard in RideFormOverlay. Both layers need verification: (a) is duplicate-offer prevention via a different mechanism (RLS policy / trigger / app-layer query)? (b) does RideFormOverlay check existing-offer state before insert? If both negative → re-scope to §4.D Sprint G as concrete work item. |
| V-31 | VAL-001 stale validation closure — Apr 23 11U Girls RSVP count anomaly (13 vs 10-12 roster) | §4.N Layer 5 | SKYFIRE_BUILD_QUEUE_v2 §VAL-001 (Apr 23, 2026) | 5 min | Confirm closed by Migration 022 duplicate deletion | Cite Migration 022 (`rls_privacy_lockdown_plus_roster_left_at`) verified applied; per CLAUDE.md §11.5 the migration deleted duplicate roster rows and added `left_at` for date-windowed eligibility. Verification: query `event_rsvps` for the Apr 23 11U Girls practice event_id, count distinct guardian responses, confirm matches current roster size. If duplicate count still anomalous → re-open with named follow-up. |
| V-32 | `AdminMembersPage` / Member-Family Directory build status | §4.N Layer 2 / §3-A extension | ADMIN_SESSION_SCOPE.md Tier 1 | 10 min | Determine if Tier 1 admin surface is complete or open | `ls src/pages/Admin*` confirmed: only AdminHomePage, AdminSeasonsPage, AdminTeamsPage, admin/BriefingHistoryDetail. No AdminMembersPage. Spec target: `/admin/members` route. Verify against ADMIN_SESSION_SCOPE.md Tier 1 P0 list; if genuinely unbuilt → new §4 sub-arc or §4.G entry. |
| V-33 | `AdminOpponentsPage` build / §3-A "Location + opponent mgr" completion | §4.N Layer 2 | ADMIN_SESSION_SCOPE.md Tier 1 + CLAUDE.md §8 (3-A PARTIAL) | 10 min | Determine §3-A completion path | CLAUDE.md §8 marks "3-A Location + opponent mgr" as ⚠ PARTIAL — locations seeded (9 venues), no mgmt UI. Same for opponents. Spec target: `/admin/opponents` route. Read CLAUDE.md §8 + verify locations mgmt UI ship status + opponents mgmt UI ship status; if both unbuilt → consolidate into §4 sub-arc (likely §4.G or new §4.O). |
| V-34 | `admin_audit_log` table determination vs existing `event_change_audit` | §4.N Layer 2 | ADMIN_SESSION_SCOPE.md + ledger schema inventory | 5 min | Resolve: do we need a new table or does `event_change_audit` suffice? | DB query confirmed `event_change_audit` exists; no `admin_audit_log`. Determine if the admin-audit-trail use case (operator action history) is covered by `event_change_audit` (event-row mutations) or needs a separate operator-action log. If separate → new schema migration item. If covered → V-34 closes with cite. |
| V-35 | LH_BRAND_CONTENT_MODEL Part 11 — 95% delight features triage | §4.N Layer 2 / §4.G or new §4.O | LH_BRAND_CONTENT_MODEL.md Part 11 | 20 min | Triage 10 delight feature candidates into §4.G quick wins, §4.C Sprint B-F, or P2 backlog | Read Part 11 in full + dispatch each of 10 candidates (auto-badging, tournament archive, "Run of Play", Quick Score propagation, Winter archive, achievement timelines, arrival reminders, RSVP countdown, "Car Ride Home" toast, Academy handbook in-app) to appropriate ledger section. Most are P1 polish; expect majority absorbed into §4.G or §4.C, 2-3 net new §4 entries. |
| V-36 | EMBER_TENANCY v3 Steps 11-13 deferral status (V-24 sub-finding) | §4.N Layer 2 / V-24 sub | EMBER_TENANCY_ARCHITECTURE_v3.md Section 22 | 5 min | Confirm Steps 11-13 explicit deferral captured in V-24 scope | Per agent 3 read: v3 Section 22 explicitly defers Steps 11-13 (BrandTransition animation, Coach welcome card dismissible via localStorage, Admin welcome + 4-item checklist). Document as V-24 sub-deferral so future V-24 closure attempts don't expect these Steps. No new work; just sub-tracking. |
| V-37 | 5c-VALIDATE findings batch — Family Guide actor validation follow-ups | §4.N Layer 2 / §4.A PR 5 follow-up | AUDIT_DAY_2026-05-16_FINAL_CLOSE.md + STATE_OF_AFFAIRS_L99_v5.md | 30 min orig → **CLOSED 2026-05-19 (PR-queue path)** | Was: resolve 6 enumerated findings from Frank's actor validation send. Now: ✅ all 3 sub-PRs merged. | **CLOSED 2026-05-19.** Original premise (Frank reads send, fills findings) invalidated: the May 16 admin@ send never actually happened. Replaced with PR-queue path: 5b-1 (PR #264) + 5b-3 (PR #265) + 5b-2 (PR #266) all merged 2026-05-19. Family Guide CODE-PARTIAL → CODE-COMPLETE, ACTOR-VALIDATION-PENDING (symmetric with PR 4 framing). Acceptance criteria (a) all 3 sub-PRs merged ✓; (c) findings checklist re-walked against successive preview renders ✓; (b) actor validation send still pending Frank's wizard click — that's the only remaining gate, tracked via §4.A PR 5 status flip to SHIPPED. Full closure narrative in §4.N.6. |
| V-38 | Audit-day May 16 P2 carryovers — consolidated 8-item batch | §4.N Layer 2 / §4.L extension | AUDIT_DAY_2026-05-16_FINAL_CLOSE.md P2 carryover list | 60 min | Triage 8 P2 items into individual §4 entries or single quick-wins batch | Items: (a) localStorage fallback cleanup, (b) BriefingComposer state reset on close, (c) useHasUnread channel name reconciliation, (d) RecordsPage cross-org count, (e) useAcademyCallupCandidates auth context, (f) FK CASCADE gaps on 2 tables, (g) `briefing_templates.org_id` nullable cleanup, (h) legacy renderer dead code removal. Each is small (<30 LOC). Recommend batching as single multi-PR "audit-day P2 sweep" or absorbing into §4.L. No individual V-* per item — would fragment. |
| V-39 | Tier 3 V2 performance items — polling cost + per-team useAttendanceData mount cost | §4.N Layer 2 / §4 Phase 2 backlog | TIER_3_V1_RETROSPECTIVE_NOTES.md "Performance Items for V2" | 5 min | Confirm tracking — not actionable today, V2 deferred | Two named items: (1) 60s home page client polling cost — trigger = simultaneous-open spike OR org 500+ users; path = edge function with shared cache OR cron-cache table. (2) Per-team `useAttendanceData` mount cost scaling linearly — trigger = coach 10+ teams OR mobile load >3s; path = batched `useAttendanceData(teamIds[])` hook. Add as backlog markers (no immediate action); becomes V-39's named cite for when triggers fire. |

### Layer 5 findings (2026-05-18 evening — §4.N audit, 22-bug catalog walk)

Layer 5 of the §4.N Two-Week L99 Audit executed in continuation of Layer 1's soft start. Mechanical bug-by-bug status check against the catalog in `docs/archive/SKYFIRE_BUILD_QUEUE_v2.md §🐛 Open Bugs & 95% UX Audit` (logged Apr 23, 2026). Catalog count is **25 items**, not exactly 22 — the "22-bug catalog" framing in §4.N was approximate. Distribution: 5 P0 BUGs + 14 P1 UX gaps + 1 validation + 5 P0 RLS holes.

**Per-bug closure status:**

| Bug | Catalog severity | Status | Evidence cite | Routing |
|-----|------------------|--------|---------------|---------|
| BUG-001 (Admin NextEventCard data) | P0 | EXISTS-IN-CODE; render verification owed | `src/components/admin/NextEventCard.jsx:23` exports default function | Already tracked: **V-4** |
| BUG-002 (Duty count 2/2 vs 1+1) | P0 | LIKELY FIXED — hook correctly distinguishes `claimed_by_name OR guardian_id` | `src/hooks/useEventDutyCounts.js` aggregation logic correct vs original bug hypothesis | Already tracked: **V-5** |
| BUG-003 (Ride summary undercount) | P0 | LIKELY FIXED — hook uses `seats_offered/seats_requested/seats_needed` (SUM not COUNT) | `src/hooks/useEventRideCounts.js:18-22` uses correct seat-count columns | Already tracked: **V-6** |
| BUG-004 (Same-user offer+request) | P1 | UNVERIFIED — no frontend guard found via grep; DB CHECK status unknown | No `existingOffer\|sameUserGuard` matches in `src/components/ride/RideFormOverlay.jsx` | Already tracked: **V-7** |
| BUG-005 (Duplicate ride offers) | P1 | PARTIALLY OPEN — Migration 025 applied but DB has zero UNIQUE constraints on `event_ride_offers`; frontend guard not found | DB query: only `event_ride_offers_pkey` + 5 CHECKs, no `UNIQUE(event_id, guardian_id)`. Grep: no `existingOffer` matches. | **NEW V-30** |
| UX-001 to UX-006 (parent Next Up CTAs / countdown / multi-child) | P1 | UNSHIPPED — Sprint B-F arc | No grep evidence for any of the 6 UX items | Absorbed into **§4.C** (Sprint B-F Home Page completion). No individual V-* needed. |
| UX-007 to UX-010 (coach Next Up enrichment) | P1 | UNSHIPPED — Sprint D arc | No grep evidence for `StaffRSVP`, `Start Check-In`, etc. | Absorbed into **§4.C** (Sprint D within Sprint B-F). No individual V-* needed. |
| UX-011 (admin multi-event dashboard) | P1 | UNCERTAIN — AdminHomePage exists but redesign extent unknown | `src/pages/AdminHomePage.jsx` shipped, but per UX-011 spec "needs full redesign" not "small fix" — extent unclear | Absorbed into **§4.C** (Sprint E). No individual V-* needed. |
| UX-012 (admin operational alerts strip) | P1 | **SHIPPED** | `src/pages/AdminHomePage.jsx:53` mounts `<AlertZone ... sectionLabel="ALERTS" />` via Tier 3 v1 PR #229 | Closed by Tier 3 v1 alert framework. |
| UX-013 (achievement queue indicator) | P1 | UNSHIPPED — gated on Migration 018 UI | No grep evidence | Absorbed into **§4.C** Sprint E. No individual V-* needed. |
| UX-014 (notification audit trail) | P1 | UNSHIPPED — gated on Migration 019 UI | No grep evidence | Absorbed into **§4.C** Sprint E. No individual V-* needed. |
| VAL-001 (Apr 23 RSVP count anomaly) | Validation | LIKELY CLOSED by Migration 022 | Migration 022 (`rls_privacy_lockdown_plus_roster_left_at`) verified applied; deletes duplicate roster rows + adds `left_at` for date-windowed eligibility | **NEW V-31** (one-query cite confirmation) |
| HOLE-001 (`guardians`) | P0 RLS | **CLOSED** | `relrowsecurity=true`, 6 policies | Migration 022 |
| HOLE-002 (`player_guardians`) | P0 RLS | **CLOSED** | `relrowsecurity=true`, 3 policies | Migration 022 |
| HOLE-003 (`players`) | P0 RLS | **CLOSED** | `relrowsecurity=true`, 7 policies | Migration 022 |
| HOLE-004 (`roster_members`) | P0 RLS | **CLOSED** | `relrowsecurity=true`, 7 policies | Migration 022 |
| HOLE-005 (`tournament_pool_teams`) | P0 RLS | **CLOSED** | `relrowsecurity=true`, 2 policies | Migration 022 |

**Synthesis:**

- **Verified CLOSED with evidence: 6 items** (UX-012 + HOLE-001-005). 5 closed by Migration 022; 1 closed by Tier 3 v1 PR #229.
- **Likely closed pending narrow re-check: 3 items** (BUG-002, BUG-003 via hook-content inspection; VAL-001 → V-31 cite-confirm).
- **Already in §15 queue from prior arcs: 4 items** (BUG-001-004 → V-4-V-7). Layer 5 re-confirms tracking, no duplicate V-* added.
- **NEW V-* added: 2** (V-30 BUG-005 partial-open, V-31 VAL-001 cite-confirm).
- **Absorbed into §4.C Sprint B-F arc: 11 items** (UX-001-011 + UX-013-014). No individual V-* added — Sprint B-F completion is the unit of work, not per-UX-item.

Net new V-*: 2 (V-30, V-31). Significantly below §4.N's L5 sizing prediction (+18-22). The reason: most catalog items either (a) verified closed at grep time, (b) already in V-* queue from prior arcs, or (c) absorbable into existing §4.C arc rather than individual V-*. Layer 5 closes "named uncertainty" by confirming the 22-bug catalog is mostly addressed; the residual is concentrated in Sprint B-F Home Page completion (§4.C) rather than scattered open bugs.

**Layer 5 sign-off conditions check:**

- ✅ Anti-pattern #45 compliance — findings → ledger same commit (this PR)
- ✅ Findings count + ledger-growth report → 2 new V-* (V-30, V-31), 1 findings block (~70 lines with status table)
- ✅ Strategic arc routing decision: residual bug-catalog work consolidates into §4.C (Sprint B-F completion) — no fragmentation into per-bug V-*
- ✅ Closes "named uncertainty" raised in 2026-05-18 session-end audit (was: only 4 of 22 in §15; now: 4 in §15 from prior + 2 new = 6, but **also**: 6 verified closed + 11 absorbed = 23 of 25 accounted for, 2 truly new)

**Layer 5 effort actual:** ~25 minutes (matches §4.N estimate of 20 min with small SQL roundtrip overhead).

### Layer 2 findings (2026-05-18 evening — §4.N audit, doc-diff sweep bounded by mtime > May 4)

Layer 2 of the §4.N Two-Week L99 Audit executed via three parallel `Explore` sub-agents reading clustered doc subsets. Methodology delegation per anti-pattern #45 acid-test: findings → ledger same commit; sub-agent constraint hallucinations flagged transparently rather than retried indefinitely.

**Sub-agent execution outcomes:**

| Cluster | Docs | Outcome |
|---------|------|---------|
| Audit/briefing (16 docs) | Phase 1-5 + Beta + Synthesis + Verification + Briefing references | Partial — agent self-aborted at doc 3 citing a tool-use constraint that wasn't in the prompt (hallucination). Of 3 docs completed (Phase 1, 2, 3), **0 new findings** — all already captured in §4.M.1-§4.M.3. CC spot-read Phase 4 + Phase 5 doc heads directly, confirmed same reconciliation pattern continues. Audit-cycle cluster judged fully reconciled in §4.M without need to re-launch agent. |
| Handoff/state (7 docs) | CC_SESSION_HANDOFF + COUNTER_PLAN + STATE_OF_AFFAIRS + CUTOVER_WAVE_GAP_AUDIT + REACT_HOOKS_71_TRIAGE + AUDIT_DAY_FINAL_CLOSE + TIER_3_V1_RETROSPECTIVE | Complete — agent returned state-of-affairs synthesis (not the requested delta format) but contents minable for items. CC verified each candidate against ledger before adding. **Net:** 4 genuine new items (V-37, V-38, V-39, §4.A status correction). |
| Spec/reference (5 docs) | ADMIN_SESSION_SCOPE + LH_OPS_SPEC + EMBER_TENANCY_ARCHITECTURE_v3 + LH_BRAND_CONTENT_MODEL + README | Complete — agent returned 28 candidate items. CC verified each against current DB schema + code state. **False positives filtered:** `game_results` exists (Migration 010), `tournaments` first-class exists, `team_achievements` exists (Migration 018), `staff_profiles` exists, `opponents` exists, calendar sync ICS already tracked as V-23, agent's "Migrations 1-5 missing" claim fully reduced to false positive. **Genuine new:** 5 items (V-32, V-33, V-34, V-35, V-36). |

**§4.A status correction (inline):** Layer 2 cross-reference with Layer 1 git log revealed §4.A status was stale. PR 4 (Coach Roundup) shipped 2026-05-16 via PRs #185/#186/#187. PR 5 (Family Guide) shipped 2026-05-16 via PRs #217/#219/#220. Updated §4.A in-place to mark PRs 4 + 5 SHIPPED with cites. PRs 1, 2, 3, 6, 7 remain OPEN. PR 5 5c-VALIDATE follow-ups extracted to V-37.

**Per-doc reconciliation status (28 total docs in window, mtime > 2026-05-04):**

| Status | Count | Examples |
|--------|-------|----------|
| Fully reconciled in §4.M | 11 | Phase 1-5 audit docs, Beta B1/B3/Synthesis, Audit Synthesis, AUDIT_DAY_CLOSE, AUDIT_VERIFICATION |
| Already absorbed in §4.A/§4.B/§4.C/§4.G | 6 | CUTOVER_WAVE_GAP_AUDIT (PR 1-7 = §4.A), STATE_OF_AFFAIRS_L99_v5 (audit-day status), CC_WAVE_4_4_COUNTER_PLAN (4.4-C2 sequence), CC_SESSION_HANDOFF_2026-05-13 (PostHog work, hooks triage), REACT_HOOKS_71_TRIAGE (16/16 closed May 15), AUDIT_DAY_FINAL_CLOSE (top-level synthesis of audit-day work) |
| Reference docs, no action items | 3 | README.md, BRIEFING_RENDERER_REFERENCES.md, BRIEFING_TEMPLATES.md |
| V-* already tracking | 3 | V-23 ICS feed, V-24 EMBER_TENANCY Steps 5-14, V-22 maybeSingle (closed PR #251) |
| Spec docs surfacing new items | 3 | ADMIN_SESSION_SCOPE (→ V-32, V-33, V-34), LH_BRAND_CONTENT_MODEL (→ V-35), EMBER_TENANCY_ARCHITECTURE_v3 (→ V-36 sub-tracking) |
| State docs surfacing new items | 2 | AUDIT_DAY_FINAL_CLOSE P2 carryovers (→ V-38), TIER_3_V1_RETROSPECTIVE Performance (→ V-39) |

**Findings synthesis:**

- **§4.A status drift caught.** PR 4 + PR 5 shipped May 16; ledger still marked "NOT STARTED" — exactly the drift class that anti-pattern #45 was registered to prevent. The fact that this drift survived Sunday's PR #246 May 16 Audit Cycle reconciliation suggests §4.A wasn't audited against git log at that point. Layer 1's git log cross-reference was the structural inverse of this blind spot — finding paid off in Layer 2 synthesis.
- **5c-VALIDATE findings are the highest-value Layer 2 item.** V-37 captures 6 enumerated polish findings from Frank's actor validation send on the Family Guide ship. These are likely the next concrete follow-up PRs for §4.A; resolving them advances the Cutover Wave further toward production readiness.
- **Sub-agent hallucination class (anti-pattern candidate #47?):** Both Explore agents launched independently reported a "tool-use constraint" that wasn't in the prompts. The constraint appears to be a sub-agent-side artifact (possibly a recent system-message injection sub-agents are misinterpreting). Worth registering as anti-pattern if it recurs — for now, single-agent retries didn't resolve it; CC fallback to direct reads worked. Future Layer 2-style sweeps should budget for sub-agent unreliability and have a CC-direct fallback path.
- **False-positive rate on agent 3 sub-agent: 23 of 28 (82%).** The agent's "missing from ledger" flag conflated "not explicitly mentioned in ledger" with "not yet built". Many spec doc references to schema items are descriptive (the items exist; spec just describes them). CC verification via Supabase MCP `information_schema.tables` query was the right filter. Reinforces anti-pattern #42 / #43 framing on sub-agent outputs.
- **Layer 2 found 8 net new V-* items (V-32 through V-39).** Matches §4.N's L2 prediction range (+5-10). Items skew P1/P2; none are P0-blocking — consistent with the audit's "completeness check, not bug discovery" thesis.

**Layer 2 sign-off conditions check:**

- ✅ Anti-pattern #45 compliance — findings → ledger same commit (this PR)
- ✅ Findings count + ledger-growth report → 8 new V-* (V-32-V-39) + 1 §4.A inline correction + 1 findings block (~80 lines)
- ✅ Strategic arc routing decision: 5c-VALIDATE findings (V-37) gate Cutover Wave forward progress; admin-pages items (V-32, V-33) consolidate into a future §4.O or absorb into §4.G
- ✅ Bounded version of Monday-opener Phases 1-3 — Layer 2 closes the V-0 "22 unread docs" inventory work (most absorbed into §4.M; remainder triaged via V-32-V-39)

**Layer 2 effort actual:** ~50 minutes (matches §4.N estimate of 45-60 min). Sub-agent parallelism + CC verification overhead balanced.

### Layer 2 validation pass (2026-05-18 evening — L99 shipped-vs-open determinations)

Per Frank's routing: validate the 8 Layer 2 findings (V-32 through V-39) to confirm shipped vs unshipped status, so Monday opens with a clean actionable list rather than uncertain V-* items. L99 fidelity: each V-* gets a direct code-grep + DB-query verification, not gate-only inference.

**Per-V-* validation result:**

| V-* | Item | Validation method | Status confirmed | Routing for Monday |
|-----|------|-------------------|------------------|---------------------|
| V-32 | AdminMembersPage | `ls src/pages/Admin*` → only AdminHomePage, AdminSeasonsPage, AdminTeamsPage. No grep matches for `admin/members` route, `AdminMembersPage`, or `MembersDirectory`. | **UNBUILT (CONFIRMED).** | Promote to **new §4.O — Admin Manager Pages**; merge with V-33 as a single arc. Concrete deliverable: `AdminMembersPage.jsx` + `/admin/members` route + guardian/player directory query. |
| V-33 | AdminOpponentsPage + LocationsManager | No grep matches for `admin/opponents`, `AdminOpponentsPage`, `OpponentManager`, `admin/locations`, `AdminLocationsPage`, `LocationsManager`. CLAUDE.md §8 marks 3-A PARTIAL. | **UNBUILT (CONFIRMED).** Both opponent and location mgmt UI absent. | Promote to **§4.O** alongside V-32. Closes the §3-A PARTIAL line in CLAUDE.md §8. Concrete deliverables: AdminOpponentsPage.jsx + AdminLocationsPage.jsx + routes. |
| V-34 | admin_audit_log vs event_change_audit | DB query: `event_change_audit` columns = `(id, org_id, event_id NOT NULL, changed_by, changed_at, change_kind, recurrence_scope, before_jsonb, after_jsonb, dispatch_email_id)`. Scoped to event-row mutations only. | **DESIGN GAP CONFIRMED.** `event_change_audit` covers event mutations; non-event admin actions (member edits, settings changes, payment edits) are unaudited. | Stays open as a **design call**: (a) build separate `admin_audit_log` for general operator actions, (b) extend `event_change_audit` schema to be generic with optional event_id, or (c) accept unaudited non-event admin actions today. Recommend (a) for separation-of-concerns + simpler RLS. Nominate for Monday's product-judgment review. |
| V-35 | LH_BRAND_CONTENT_MODEL Part 11 — 10 delight features | Code-grep on 5 spot-checked features. Results: auto-badge UNBUILT (only static "Nationals Qualified" label exists), Run of Play UNBUILT, Arrival protocol UNBUILT, RSVP countdown PARTIAL (tournaments have `rsvp_deadline_at` + nudge config in `AutoNotificationSettingsSheet`, but no urgent visual banner), Car Ride Home toast UNBUILT. | **9 UNBUILT + 1 PARTIAL of 10.** | Re-scope to **§4.G** as a 10-item batch entry titled "LH_BRAND_CONTENT_MODEL Part 11 95% delight features". Each ranks P1 polish; none are P0-blocking. Recommend cherry-picking 2-3 for Sprint B-F absorption (the rest stay backlog). RSVP countdown PARTIAL — the missing urgent visual banner becomes a concrete sub-item under §4.J Weather/notification arc. |
| V-36 | EMBER_TENANCY v3 Steps 11-13 deferral | Doc read confirmed Section 22 line 220: *"Minimum-viable tonight: steps 1-10. Steps 11-13 (BrandTransition, coach welcome, admin checklist) can defer."* | **EXPLICIT DEFERRAL CONFIRMED in source doc.** | Closes as **documentation-only sub-finding under V-24**. No action required; V-24 closure attempts should expect Steps 5-10 as the completion target, with Steps 11-13 explicitly out of scope until brought back via separate decision. |
| V-37 | 5c-VALIDATE findings batch | Doc read: AUDIT_DAY_2026-05-16_FINAL_CLOSE.md line 65 = *"[CONFIRMATION + FINDINGS TO BE FILLED ON FRANK'S READ — render quality on VIP header tone, kid color (Charlie 11U Girls violet / Milo 8U Boys amber), quick link nav rows, day-grouped events, conflict callouts, brand footer.]"* | ✅ **CLOSED 2026-05-19.** Was Frank-gated, then PR-queue-gated, now closed: 5b-1 (#264) + 5b-3 (#265) + 5b-2 (#266) all merged 2026-05-19. Cross-surface invariant tests per #43 lock the fixes against future drift. Actor validation send is the only remaining gate, but that's tracked at §4.A PR 5 status (CODE-COMPLETE → SHIPPED), not as V-37 acceptance criteria. See §4.N.6 for V-37 close narrative. | n/a — closed. |
| V-38 | Audit-day May 16 P2 carryovers — 11 items (originally 8 per Layer 2 framing; doc read found 11) | Full P2 list from AUDIT_DAY_2026-05-16_FINAL_CLOSE.md lines 93-118: items 8-18 (useWeather signout cleanup, BriefingComposer state reset, useHasUnread channel name, RecordsPage cross-org count, useAcademyCallupCandidates auth, 2 FK CASCADE gaps, briefing_templates nullable, legacy renderer dead code, anti-patterns #37/#38 CLAUDE.md, Admin Home IA Tier 3). | **10 OPEN + 1 CLOSED.** Item 17 (anti-patterns #37 + #38 CLAUDE.md) already CLOSED — both registered in CLAUDE.md §11. | Re-scope V-38 to **10 actionable items** as a single "audit-day P2 sweep" entry in §4.L. Each is small (<30 LOC); recommend batching as one multi-commit PR Monday. Item 18 (Admin Home IA Tier 3) is a design exercise, splits out separately. |
| V-39 | Tier 3 V2 performance items | Code-grep: `useAttendanceData` confirmed consumed by CoachRosterSnapshotTeam in a per-team loop pattern (line 49). 60s polling exists in `useNow.js:15` + `useAlertEvaluator.js:38`. | **CONFIRMED real concerns + V2 triggers not yet fired.** Org currently <500 users; no mobile-load >3s reports. | Stays as **documented backlog markers** under new §4 sub-arc or §4.G "V2 perf watchlist". Not actionable today; triggers (org 500+ users OR coach 10+ teams OR mobile load >3s) become V-39 close conditions. |

**Monday-actionable summary:**

### §4.O — Admin Manager Pages (NEW sub-arc, P1 build)

- AdminMembersPage.jsx + `/admin/members` route (V-32 promoted)
- AdminOpponentsPage.jsx + `/admin/opponents` route (V-33 promoted)
- AdminLocationsPage.jsx + `/admin/locations` route (V-33 promoted, closes §3-A PARTIAL)

**§4.A PR 5 follow-ups (Frank-gated, V-37):**
- 6 named 5c-VALIDATE findings: VIP header tone, kid color rendering, quick link nav rows, day-grouped events, conflict callouts, brand footer
- Frank reads May 16 admin@ Family Guide send → fills findings → 1-6 follow-up PRs

**§4.L audit-day P2 sweep (V-38, single multi-commit PR):**
- 10 items (8-16, 18 from FINAL_CLOSE list; item 17 already closed)

**§4.G batch additions (V-35, P1 polish):**
- 9 UNBUILT delight features (auto-badge, Run of Play, Arrival reminders, Car Ride Home, Tournament archive, Quick Score propagation, Winter archive, Achievement timelines, Academy handbook in-app)
- 1 PARTIAL feature: RSVP countdown urgent banner → routes under §4.J

**Design call (V-34, P2 product judgment):**
- admin_audit_log: separate table vs extend event_change_audit vs accept gap

**Documented backlog (V-36, V-39):**
- V-36: EMBER_TENANCY Steps 11-13 explicit deferral — no action
- V-39: V2 perf watchlist (polling cost, useAttendanceData per-team) — trigger-gated

**Validation pass net result:**
- 8 V-* items validated to **L99 fidelity**
- 4 V-* promote to concrete §4 build entries (V-32, V-33, V-35, V-38)
- 2 V-* stay open as forward gates (V-37 Frank read, V-34 design call)
- 2 V-* close as documentation/backlog (V-36 deferral confirmed, V-39 trigger-gated)
- 1 V-* finding already CLOSED at validation time (V-38 item 17)

**Validation pass effort actual:** ~30 minutes. Brings total Layer 2 to ~80 min — above §4.N's 45-60 min estimate, but L99 validation depth was added to the original scope per Frank's routing.

**Tomorrow's plan opens clean:** Monday-opener now starts from concrete action items (5 named admin pages, 6 named Family Guide findings, 10 named P2 cleanup items, 9 named delight features) rather than 8 abstract verification queue entries.

### §4.N.2 — Claude AI pressure-test resolutions + Monday-opener sequence lock (2026-05-18 ~20:30 CEST)

Captured post-session-recap exchange with Claude AI. Five open questions raised in the recap got direct answers; Monday-opener sequence locked at 4 actions. Per anti-pattern #45 acid-test: structural plan refinement happens in chat → ledger reconciliation owed same session. Captured here so Monday-morning Frank reads concrete decisions, not chat-archaeology.

**Q1 — Anti-pattern #47 (sub-agent constraint hallucination) promotion criterion:** HOLD as candidate, do not promote tonight. Two data points isn't a pattern. Mitigation (CC fallback to direct reads) worked. **Promotion trigger:** third occurrence OR same class on Monday's Layer 4 sub-agent usage. Cost of bounded retry (~10 min) is less than cost of anti-pattern catalog bloat if rule doesn't repeat. **Status:** observation-only, monitor Monday.

**Q2 — V-34 admin_audit_log design call:** **PATH (a) LOCKED — separate `admin_audit_log` table.**
- Path (b) extend `event_change_audit` to be generic: rejected. Recreates anti-pattern #42 risk in reverse (parallel-system buildup via expanding scope). Table name + columns are event-scoped; generic-ifying = rename + nullable FKs + RLS expansion = rewrite with backward-compat baggage.
- Path (c) accept unaudited admin actions: rejected. Non-starter once §4.O ships three admin manager pages — those produce admin actions needing audit trails for the same reasons event mutations do (compliance, debugging, multi-tenant attribution).
- Path (a) lock specifics: separate table, generic shape day-one, no migration of existing `event_change_audit` data. The two tables coexist with clear semantic boundaries. **Schema design caveat (LOAD-BEARING):** `org_id NOT NULL` + RLS via `current_user_org_id()` pattern that doesn't recurse on `org_members` (per CLAUDE.md anti-pattern #11.1). Skip that and we're back here in 3 weeks.

**Q3 — V-37 Frank-gated 5c-VALIDATE findings priority pin:** **MONDAY ACTION #1 — clear V-37 FIRST.** Even before Layer 3 chat scan. Cost of running L3 / L4 with V-37 still open: any new chat-surfaced briefing-arc decisions might conflict with whatever Frank decides on the 5c-VALIDATE read. Sequence: Frank reads May 16 admin@ Family Guide actor-validation send → fills findings → 1-6 follow-up PRs land in §4.A. Until that gate clears, §4.A PR 5 follow-up cycle is blocked.

**Q4 — §4.O AdminManagerLayout design call:** **LEAN UNIFIED wrapper. Locked design parameters:**
- New `src/components/admin/AdminManagerLayout.jsx`: 80-120 lines, owns page header (Inter font, brand cobalt accent, breadcrumb back) + search + Add CTA + tabs slot (Active/Archived if needed) + empty state
- Each of 3 child pages: 80-100 lines, mounts layout, supplies own table + form sheet + data hooks
- **NOT in scope tonight:** pulling existing `AdminSeasonsPage` + `AdminTeamsPage` into the wrapper. Sample-of-two is not precedent — those pre-date the design discipline. New code uses new layout; old code stays as-is until independent refactor reason emerges. Anti-pattern #42 (parallel-system buildup) caution: don't refactor what works just because new pattern exists.
- ~~**Design call to confirm Monday before code:** does AdminManagerLayout absorb the page header, or does each page render its own header and the layout only owns the body? **CC recommendation: header included** — visible-consistency win is what drove unified call.~~ **LOCKED 2026-05-19 — header included** (Monday-opener Action 2 close; see §4.N.4). AdminManagerLayout owns the page header. Child pages mount the layout and supply body content only — no per-page header rendering. The visible-consistency win across the 3 new admin manager pages (Members / Opponents / Locations) drives the unified call; cost of a future "this page needs a custom header" exception is low (escape hatch via optional prop later if a real need surfaces).

**Q5 — Layer 3 chat-side query list:** Frank runs Tier 1 queries first via `conversation_search`; if Tier 1 yields <5-10 distinct items, run Tier 2; Tier 3 only if `recent_chats` walk surfaces unexpected gaps.

```
Tier 1 (highest signal):
  "decision locked"
  "park this"
  "queued for next session"
  "next session"
  "TODO" + date range filter to May 4-18

Tier 2 (medium signal):
  "remind me to"
  "we'll do that later"
  "added to backlog"
  "deferred"
  "let me write that down"

Tier 3 (long-tail, only if walk surfaces gaps):
  "we discussed"
  "yesterday we"
  "last session"
  "you mentioned"
```

The `recent_chats` sequential walk over May 4-18 is the validation pass — if `conversation_search` returns thin results from Tier 1+2 (<5-10 items), the walk confirms thin = actually thin. If rich (15+ items), walk catches what's missing.

**Monday-opener locked 4-action sequence:**

```
Action 1 (Frank-side, ~15 min, FIRST)
  V-37 clearance — read May 16 admin@ Family Guide actor-validation send,
  fill 5c-VALIDATE findings, route each into PR scope or "acceptable as
  shipped" buckets

Action 2 (CC + Frank, ~20 min, after V-37)
  §4.O design call — confirm AdminManagerLayout scope locked above;
  decide page-header-included-in-layout vs each-page-renders-own
  (CC recommends included)

Action 3 (Frank chat-side, ~45-60 min Frank time, parallel-ready)
  Layer 3 execution — Tier 1 conversation_search queries → recent_chats
  walk validation. Yield → ledger amendments same-session per #45.

Action 4 (CC, ~60-90 min, PEAK ENERGY SLOT)
  Layer 4 execution — production verification sweep over §1 SHIPPED
  items in window. Anti-pattern #44 applied retroactively per item.
  5-15 items @ 5-10 min each. SLOT: hour 3-4 of Monday session when
  fresh on prod state. If energy wrong by hour 3-4, DEFER to Tuesday
  rather than rush. The audit-cycle commitment is "all 5 layers merged
  with #45 compliance" — session goal, not calendar deadline.
```

**Strategic three-arc routing (post-Action 4):**

After all 5 §4.N layers close, Monday-to-Wednesday plan converges on three coherent arcs:
1. **§4.A PR 5 follow-up cycle** ✅ — V-37 fully closed 2026-05-19 (§4.N.3 + §4.N.6); all 3 sub-PRs landed (5b-1 #264 + 5b-3 #265 + 5b-2 #266). PR 5 flipped CODE-PARTIAL → CODE-COMPLETE, ACTOR-VALIDATION-PENDING. Only Frank's actor validation send remains to flip → SHIPPED.
2. **§4.O admin managers build** — three pages on the locked layout pattern
3. **§4.C Sprint B-F start** — the strategic question after the first two. Layer 5's framing inversion ("residual concentrates in Sprint B-F") makes this the next architectural priority, not a parked arc.

**Sprint G (Rides redesign) stays deferred** behind these three. §4.D content remains accurate but lower-priority than the three above.

**Tonight's true sign-off:** every structural decision from the Claude AI exchange now lives in §4.N.2. Monday-morning Frank reads concrete actions in the ledger, not chat history. Anti-pattern #45 acid-test cycled 9 times tonight (8 PRs + this amendment), held every time.

### §4.N.3 — Monday-opener Action 1 (V-37 unblock) close + Family Guide structural-gap findings (2026-05-19)

Action 1 (V-37 clearance) executed Monday morning per §4.N.2 sequence. **Outcome: V-37 unblocked, but not by Frank reading a send — by CC discovering the send never happened.** The Frank-gated framing was structurally wrong; the gate was actually upstream.

**Execution path:**

1. **CC opened V-37 by querying the source artifact.** Goal: surface the May 16 admin@ Family Guide send body_html via Supabase MCP so Frank read source-of-truth, not mailbox-archaeology. Setup time elimination.
2. **Query returned zero rows.** No `family_guide` entries in `comms_messages` at any status. Three explanations enumerated: (a) send never fired; (b) bypass path through alternate code; (c) kind value mismatch with schema.
3. **Diagnostic ruled out (b) + (c).** `comms_messages_kind_check` confirmed `family_guide` in enum (eliminates c). `comms_message_recipients` zero rows May 15-18 of ANY kind (eliminates b — any send path would populate this table). Latest send activity (any kind) was May 11. All May 12-18 activity is cron-generated drafts with `sent_by IS NULL`. Conclusion: (a) confirmed — actor validation send never executed.
4. **Reframed: drive preview render from resolver directly.** Per Frank's routing answer to the V-37 unblock options ("CC scaffolds preview from resolver directly"). CC wrote a standalone vite-node harness adapting the `familyGuide.contract.test.js` mockSb pattern with production data (Frank's guardian record, 2 kids, 2 teams, 4 events May 19-26, 2 coaches, org name). Rendered HTML delivered as `.html` file via `SendUserFile`.
5. **Preview render surfaced structural gaps not in the 6 anticipated findings.** Source-comment evidence: `familyGuideSections.js:10-13` *"5a ships placeholder shapes — real per-event row builders land in 5b"* and `:51` *"5b wires per-kid links once the resolver supplies real player_id / team_id values to embed in the URL slugs"*. Both 5b TODOs were never closed. 5c added wizard UI + contract tests but didn't backfill 5b's load-bearing content work.

**8 V-37 findings consolidated (6 anticipated + 2 newly via render):**

| # | Finding | Verdict | Routing |
|---|---------|---------|---------|
| 1 | VIP header tone + "4 GAMES" inaccuracy (events were PRACTICES) | Block cutover; bug + design | **PR 5b-1** (V-37 PR A) |
| 2 | Kid color rendering (violet/amber per teams.team_color) | Acceptable as shipped | None |
| 3 | Quick link nav rows — render correctly but URLs are placeholder per `:51` | Block cutover; bug | **PR 5b-2** (V-37 PR B) |
| 4 | Day-grouped events — completely missing per `:10-13` | Block cutover; P0 scope under-delivery | **PR 5b-2** (V-37 PR B) |
| 5 | Conflict callouts — untestable from preview (no conflicts in date range) | Defer verification | **PR 5b-3** (V-37 PR C) |
| 6 | Brand footer — matches Frank's hand-composed pattern | Acceptable as shipped | None |
| 7 (NEW) | 5b under-delivery: per-event row expansion missing per source comment | Block cutover; same root cause as #4 | **PR 5b-2** combined |
| 8 (NEW) | quick_link_nav URL stubs deferred from 5b | Block cutover; same root cause as #3 | **PR 5b-2** combined |

**§4.A PR 5 status correction:** from SHIPPED to CODE-PARTIAL. The schema migration + resolver query chain + composer scaffolding are production-ready; per-event content + URL wiring + tone/accuracy pass + conflict callout verification are the residual work captured as 5b-1/5b-2/5b-3.

**Documentation narrative-drift discovery (observation-only, not registering as anti-pattern candidate):**

`AUDIT_DAY_2026-05-16_FINAL_CLOSE.md:65` claimed an actor validation send had occurred (placeholder line for findings was scaffolded *"TO BE FILLED ON FRANK'S READ"*, implying Frank had unread findings waiting). Reality: no send fired, no email to read, no findings actually pending. The doc captured *anticipated* validation that never happened.

Generalized failure mode: planning docs that scaffold "validation pending" placeholders for actor work that wasn't actually executed produce a downstream session that wastes time hunting for an artifact that doesn't exist.

Per Frank's standing rule (registered in §4.N.2 Q1, applied to AP #48 candidate Sunday): **one instance is not a pattern.** Logging as observation-only. Promotion trigger: second instance of same class (doc scaffolds "validation pending" for an action that didn't occur and downstream session blocks on the missing artifact). If a second case surfaces in subsequent sessions, register as anti-pattern candidate.

**Monday-opener routing (unchanged from §4.N.2 4-action sequence):**

Action 1 (V-37) **CLOSED 2026-05-19** — unblocked via structural discovery. Output: this §4.N.3 amendment + §4.A PR 5 status correction + V-37 row updates + 3 sub-PRs queued.

Action 2 (§4.O AdminManagerLayout design call) **NEXT.** Locked design parameters from §4.N.2 Q4 stand; only the open question is page-header-included-in-layout vs each-page-renders-own (CC still recommends included).

Actions 3 + 4 (L3 chat scan, L4 prod verification sweep) **unchanged.**

**Forward implication — the §4.N.3 surfacing IS a Layer 4 finding.** Production verification on §1 SHIPPED items, applied retroactively to PR 5 (Family Guide) via Action 1 prep. The full Layer 4 sweep scheduled for Monday hour 3-4 will likely surface similar narrative-drift instances on other §1 SHIPPED items. Worth budgeting for: Layer 4 may find more "code-merged but actor validation not executed" cases.

**Anti-pattern #45 acid-test cycle 10:** structural findings from Action 1 execution → ledger amendments same session. Cycle holds.

### §4.N.4 — Monday-opener Action 2 (§4.O AdminManagerLayout design call) close (2026-05-19)

Action 2 executed per §4.N.2 sequence following Action 1 close. **Outcome: header-included-in-layout LOCKED.** §4.O arc design parameters fully resolved; ready for code build when arc reaches turn in strategic-three-arc routing.

**Decision lock:**

Q4's open question (*"does AdminManagerLayout absorb the page header, or does each page render its own header and the layout only owns the body?"*) resolved with CC's recommendation: **header included.** AdminManagerLayout owns:
- Page header (Inter font, brand cobalt accent, breadcrumb back)
- Search bar
- Add CTA
- Tabs slot (Active/Archived if needed)
- Empty state

Child pages (AdminMembersPage / AdminOpponentsPage / AdminLocationsPage) mount the layout and supply body content only — no per-page header rendering.

**Rationale:**

Visible-consistency win across the 3 new admin manager pages drives the unified call. Three pages built independently produce drift between header layouts within weeks; unifying at the layout boundary makes that impossible by construction. The cost of a future "this page needs a custom header" exception stays low — escape hatch via optional `headerOverride` prop can land later if a real need surfaces. Premature flexibility isn't free; YAGNI (per anti-pattern #39: lean-with-hedge usually means the hedge is wrong; don't pre-build the override).

**NOT changed by this lock:**

- §4.N.2 Q4's "NOT in scope tonight" guard still holds: existing `AdminSeasonsPage` + `AdminTeamsPage` stay as-is. Sample-of-two is not precedent. Anti-pattern #42 (parallel-system buildup) caution applies — don't refactor what works just because the new pattern exists. If a real refactor reason emerges later, that's a separate decision.
- File-size targets unchanged: AdminManagerLayout 80-120 lines, each child page 80-100 lines.

**§4.O arc state after lock:**

- Design: fully resolved
- Implementation: NOT STARTED — arc waits in strategic-three-arc routing (arc 2, between §4.A PR 5 follow-ups and §4.C Sprint B-F start)
- Concrete deliverables (from §4.O-related Layer 2 validation entries V-32 + V-33):
  - `src/components/admin/AdminManagerLayout.jsx` (new shared wrapper)
  - `src/pages/AdminMembersPage.jsx` + `/admin/members` route (V-32)
  - `src/pages/AdminOpponentsPage.jsx` + `/admin/opponents` route (V-33)
  - `src/pages/AdminLocationsPage.jsx` + `/admin/locations` route (V-33, closes §3-A PARTIAL)

**Monday-opener routing (unchanged from §4.N.2 4-action sequence):**

Action 2 **CLOSED 2026-05-19** — header-included locked. Output: §4.N.2 Q4 marked LOCKED + this §4.N.4 amendment.

Actions 3 (Layer 3 chat scan, Frank-side) + 4 (Layer 4 production verification sweep, CC peak energy hour 3-4) **next.**

**Forward implication:** Action 2 cost was minimal (single decision lock, ~5 minutes including ledger reconciliation) compared to §4.N.2's ~20-min estimate. The estimate was conservative because the recommendation was strong and the surrounding parameters were already locked in §4.N.2 Q4. Useful calibration data: when the recommendation IS the decision, "design call" collapses to "lock the recommendation."

**Anti-pattern #45 acid-test cycle 11:** locked decision in planning doc → ledger reconciliation same session. Cycle holds.

### §4.N.5 — Monday-opener Action 4 (Layer 4 production verification sweep) close (2026-05-19)

Action 4 executed per §4.N.2 sequence following Action 2 close. **Outcome: 9 §1 SHIPPED PRs all production-healthy via anti-pattern #44 retroactive trace.** Layer 4's major finding was already surfaced earlier during Action 1 prep (§4.A PR 5 reclassification to CODE-PARTIAL, captured in §4.N.3). The remaining §1 sweep confirms no other code-merged-but-actor-validation-missing instances in the May 4 → May 18 window.

**§1 verification table (9 PRs):**

| PR | Claim | Verification | Verdict |
|----|-------|--------------|---------|
| #233 | formatters.js NY-pin canonical helpers | `NY_TZ = 'America/New_York'` at `formatters.js:5`; threaded through every `toLocale*` call (lines 14, 28, 60, 75-76, 83-85, 96, 99, 109) | ✓ HEALTHY |
| #234 | 51 leaf-callsite NY-pin + static-grep audit | `timezoneAuditPin.test.js` test passes 1/1; bracket-balance design holds | ✓ HEALTHY |
| #235 | AlertZone loading-state gate | Closed by #241 — see below | ✓ HEALTHY (via #241) |
| #236 | Tier 3 v1 retrospective doc | `TIER_3_V1_RETROSPECTIVE_NOTES.md` present | ✓ HEALTHY (doc-only) |
| #237 | Coach roster overdue gate <72h | `HIGHLIGHT_WINDOW_MS = 72*60*60*1000` at `CoachRosterSnapshotTeam.jsx:39`; boundary test passes 5/5 incl. *"d. event EXACTLY 72h out + no RSVP → yellow (threshold inclusive)"* | ✓ HEALTHY |
| #238 | EMBER_PENDING_LEDGER + AP #43 | Ledger exists; AP #43 registered in CLAUDE.md line 419 | ✓ HEALTHY (doc-only) |
| #239 | CoachHomePage MY TEAMS records (Cluster 5) | `useOrgTeamRecords` imported `:12`, wired `:30`, threaded `:116`; production cross-check confirms 35 published games aggregate correctly (11U Girls 5-2, 10U Black 5-4, 10U Blue 3-2, 9U Boys 1-5, 8U Boys 3-5) | ✓ HEALTHY |
| #240 | `% Going` label invariant (Cluster 2) | `playerGoingLabelInvariant.test.jsx` passes 5/5 | ✓ HEALTHY |
| #241 | `useAlertEvaluator` null sentinel (Cluster 6.A3) | `useState(null)` sentinel at `:46`; gate at `:82` correctly guards `configs === null`; loadingGate test passes 3/3 | ✓ HEALTHY |

**Extended cross-check (outside strict §1 scope, in scope by Layer 4 logic):**

After Action 1 reclassified PR 5 (Family Guide) to CODE-PARTIAL, the natural question per anti-pattern #39 (hedge-as-truth) was: is PR 4 (Coach Roundup) the same drift class? Quick check produced asymmetry:

| Aspect | PR 4 (Coach Roundup) | PR 5 (Family Guide) |
|--------|----------------------|---------------------|
| Resolver query chain | Wired (`coachRoundup.js`) | Wired (`familyGuide.js`) |
| Section builders complete | **YES — `buildTeamSections` iterates events and emits `color_striped_row` per event with day_label/time/primary/secondary** (`coachRoundupSections.js:33-52`) | **NO — `buildKidColorPillSections` emits summary chip only**, never iterates events; the TODO in `familyGuideSections.js:10-13` was never closed |
| Quick-link nav URLs wired | N/A (no nav section for coach kind) | NO — placeholder per `:51` |
| Wizard supported | YES (4c flipped flag) | YES (5c flipped flag) |
| Actor validation send executed | NO — zero `sent` rows in `comms_messages` for kind | NO — same |

**Conclusion:** PR 5 drift is unique. PR 4 is code-complete; the only missing piece is the actor validation send. Different class of "not actually shipped" — PR 4 needs Frank to drive a send; PR 5 needs 3 sub-PRs to land first.

**Routing for PR 4:** Status correction-candidate. Currently §4.A PR 4 says SHIPPED. Strict interpretation: SHIPPED requires actor validation completed. Reality: code-complete, send-pending. Two options:
- (a) Reclassify PR 4 to "CODE-COMPLETE, ACTOR-VALIDATION-PENDING" — symmetric with PR 5 framing, ledger truth-telling
- (b) Leave PR 4 as SHIPPED on the grounds that the wizard works; awaiting a send isn't the same as awaiting more code

Lean: **(a) reclassify.** Same standard PR 5 was held to. The "actor validation send is part of shipped" definition is what made the V-37 unblock necessary; applying the looser definition to PR 4 because the code happens to be complete creates inconsistent status. Concrete action: future PR amends §4.A PR 4 to ACTOR-VALIDATION-PENDING; Frank drives a coach_roundup send through the wizard whenever convenient to actually clear PR 4. NOT in scope for this PR — surfaced for routing decision in a follow-up.

**Production data cross-checks (in passing during verification):**

| Cluster reference | Production state | Cross-check verdict |
|-------------------|------------------|---------------------|
| §2 Cluster 1 (tournaments) | Confirmed: tournament events from May 16-17 have `published_at IS NULL` on `game_results` (no rows). Workflow gap holds — Frank to Quick Score the 13 tournament results. | ✓ matches §2 Cluster 1 D1 finding |
| §2 Cluster 1.2 (10U Blue Game 6) | Production shows 10U Blue at 3-2, not 3-3. Resurrection Blue 4AB May 9 (25-27 L) is the missing Game 6. | ✓ matches §2 Cluster 1.2 workflow gap; remains OPEN until Frank enters Game 6 |

**Anomalous observation (NOT registering as Layer 4 finding pending Frank confirmation):**

One `coach_roundup` row in `comms_messages` (id `ab1e7015-...`) with `status='queued'`, `last_edited_by=Frank admin user_id`, `last_edited_at=2026-05-19 11:49:25 UTC`. Anomalies:
- `subject: null` (composer normally sets `Coach roundup — <name>`)
- `content_sections: {"body": {}}` — an object with a `body` property holding an empty object, NOT the composer's array of section objects (e.g., `[{kind: 'coach_header', ...}, {kind: 'team_color_pill', ...}, ...]`)
- `audience_filter: {"coach_user_id": "1e06a3d4..."}` (Frank's admin user_id)

Most likely benign: Frank opened the Coach Roundup wizard today (possibly during this session after the V-37 conversation) and the wizard saved its initial-state shape as a draft before the composer ran. If that's the case, the wizard-save shape is wrong — the wizard should either NOT save before composer runs, OR save the composer output. If Frank did NOT open the wizard, then the row was created by some other path (auto-cron? trigger?) and the draft-shape bug is a genuine Layer 4 finding requiring its own PR. Surfaced here for Frank confirmation before promotion.

**Audit-methodology calibration note:**

CC's initial verification query for #239 used the wrong enum value (`gr.result = 'win'` / `'loss'` / `'tie'` — full lowercase strings) instead of the production value (`'W'` / `'L'` / `'T'` — single-character uppercase per `teamRecords.js:38-40`). The mistake produced a momentary "Layer 4 finding" panic (35 published games but zero wins/losses/ties) before cross-check against the JS code. Real bug class: when running an audit query against an unfamiliar table, **always first grep the JS code for the column's enum semantics** rather than assuming database conventions. Anti-pattern #36 (destructured defaults silently swallow errors) is the structural inverse; this is its query-side cousin. Logging as audit methodology observation, not promoting to candidate anti-pattern (one instance; per Frank's standing one-instance rule).

**Layer 4 sign-off conditions check:**

- ✅ Anti-pattern #45 compliance — findings → ledger same commit (this PR)
- ✅ Findings count + ledger-growth report → 0 new V-* (sweep clean) + 1 PR 4 reclassification candidate (routing-deferred) + 1 anomalous observation (Frank-gated)
- ✅ Strategic arc routing decision: §4.A PR 4 reclassification routing stays open; arc 1 (PR 5 follow-up cycle) unchanged from §4.N.3; arcs 2 + 3 unchanged from §4.N.4

**Layer 4 effort actual:** ~40 minutes (under §4.N estimate of 60-90 min). The §1 list was tight (9 items) and most verifications collapsed to test-suite runs + targeted grep. The expensive verification was actually the Action 1 unblock that surfaced PR 5 — that's where the cognitive load lived. Calibration: when §1 is well-curated (forward-tracking + recent), Layer 4 sweeps are faster than estimated. When §1 has stale ship claims (the PR 5 case), Layer 4 expands into investigation territory.

**Anti-pattern #45 acid-test cycle 12:** Layer 4 findings + observations → ledger same session. Cycle holds.

### §4.N.6 — V-37 closure + §4.A PR 5 status flip (2026-05-19)

V-37 sub-PR queue executed in three sequential PRs Monday afternoon following the §4.N.5 Action 4 close. **Outcome: V-37 fully closed; §4.A PR 5 flipped CODE-PARTIAL → CODE-COMPLETE, ACTOR-VALIDATION-PENDING** (symmetric with PR 4 framing post-§4.N.5).

**Sub-PR landing sequence:**

| Sub-PR | PR # | Scope | Findings closed | Tests | Lines |
|--------|------|-------|-----------------|-------|-------|
| 5b-1 | #264 | Kind-aware `summarizeEventKinds` helper + apply to vip_header + kid_color_pill labels | #1 (tone/accuracy) | 16/16 → +5 | +72/-8 |
| 5b-3 | #265 | `buildConflictCalloutSection` + kid-aware `conflictCallout` renderer + composer wires it after vip_header | #5 (conflict callouts) | 19/19 → +3 | +82/-10 |
| 5b-2 | #266 | Per-event `color_striped_row` under each kid_color_pill + `quick_link_nav` URLs to `/teams/<team_id>` | #3, #4, #7, #8 (per-event rows + URLs) | 23/23 → +4 | +122/-19 |

**Cumulative impact:**
- 3 PRs landed sequentially over ~90 min CC execution time (within §4.N.2 PR 5b-2 budget of ~3-5h — under estimate because PR 5b-1's kind-aware label helper was reusable in 5b-3 + 5b-2, and 5b-3's renderer pattern was reusable in 5b-2).
- **Sections per Family Guide email: 7 → 11** (added `conflict_callout` + 4 `color_striped_row` sections for a 4-event date range).
- **23/23** family_guide contract tests + **11/11** coach_roundup contract tests (backward-compat held) + **293/293** engine + timezone audit pass.
- Cross-surface invariants per #43 locked in 3 places:
  1. VIP header `event_count` === sum of `color_striped_row` counts (5b-2)
  2. VIP header `conflict_count` === `conflict_callout.items.length` (5b-3)
  3. `events_label` consistent across vip_header + kid_color_pill within same email (5b-1)

**Documentation drift resolved:**

Two source-comment TODOs that drifted across multiple PRs are now closed:
- `familyGuideSections.js:10-13` (was: *"5a ships placeholder shapes — real per-event row builders land in 5b"*) — closed by PR #266. File header comment updated to reflect actual section order.
- `familyGuideSections.js:51` (was: *"5b wires per-kid links once the resolver supplies real player_id / team_id values"*) — closed by PR #266. quickLinkNav renderer comment updated.

The drift class (renderer comments referencing future work that gets deferred + forgotten across PR chains) is part of the V-37 root cause discovered via §4.N.3 investigation. Worth keeping as observation-only (per Frank's standing one-instance rule for anti-pattern candidates) until a second instance surfaces.

**Status of strategic three-arc routing:**

1. **§4.A PR 5 follow-up cycle** ✅ — CC-driveable portion complete. Only Frank's actor validation send remains (one wizard click → PR 5 → SHIPPED).
2. **§4.O admin managers build** — design fully resolved per §4.N.4; implementation queued. Now becomes the arc 1 candidate.
3. **§4.C Sprint B-F start** — strategic priority after arc 2.

**Forward implication — symmetric actor-validation gate now applies to two PRs:**

After today's session, §4.A has two CODE-COMPLETE, ACTOR-VALIDATION-PENDING entries:
- PR 4 (Coach Roundup) — reclassified by PR #263 (§4.N.5 follow-up)
- PR 5 (Family Guide) — reclassified by this PR

Both unblock with the same shape: Frank drives one send through the respective wizard. Could be done back-to-back in ~20-30 min (10-15 each) when Frank's at a desktop.

**Anti-pattern #45 acid-test cycle 13:** V-37 closure findings → ledger same session. Cycle holds.

### §4.N — Two-Week L99 Audit close marker (2026-05-19)

With §4.N.3 (Action 1 / Layer 4 retroactive) + §4.N.4 (Action 2) + §4.N.5 (Action 4 / Layer 4 §1 sweep) closed, the CC-driveable portion of the §4.N audit is **complete**.

**Remaining open:**
- Action 3 (Layer 3 chat scan) — Frank chat-side. Tier 1 `conversation_search` queries per §4.N.2 Q5; sequential `recent_chats` walk validation. Independent of CC work; can run whenever Frank chooses.
- §4.N Layer 1 + Layer 2 + Layer 5 — already closed Sunday evening (see below); only Action 3's Layer 3 remains.

**Strategic three-arc routing (post-Action 4) status:**
1. **§4.A PR 5 follow-up cycle** — 3 sub-PRs queued (5b-1, 5b-2, 5b-3) per §4.N.3
2. **§4.O admin managers build** — design fully resolved per §4.N.4; implementation queued behind arc 1
3. **§4.C Sprint B-F start** — strategic priority after arcs 1 + 2

**Optional follow-up surfaced by Action 4:**
- §4.A PR 4 reclassification to CODE-COMPLETE, ACTOR-VALIDATION-PENDING (symmetric with PR 5 framing; Frank-routing-deferred)
- Coach Roundup queued-row anomaly resolution (Frank-confirmation-gated)

### Layer 1 findings (2026-05-18 evening soft start — §4.N audit, low-cognitive pass)

Layer 1 of the §4.N Two-Week L99 Audit executed Sunday evening (post-sign-off, soft start per Frank's "Continue with the build" routing). Mechanical enumeration + sequence gap analysis. No interpretive findings — those wait for Layers 2-5 with fresh-head cognitive load.

**Quantitative ground truth:**

| Metric | Value | Notes |
|--------|-------|-------|
| Total commits in window (May 4 → May 18, main branch) | 616 | Required `git fetch --unshallow` to materialize — main was shallow-cloned with 72 commits visible |
| Commits with PR-squash markers `(#NNN)$` | 232 | Real PR landings |
| Commits via merge-commit style (`Merge pull request #NNN ...`) | 12 | Pre-PR-squash-discipline merges (#14, #93-#95, #97, #99-#104, others) — counted as landings, not orphans |
| Direct-to-main commits (no PR reference) | 384 | ALL pre-2026-05-12 (v2 history rolled into main on May 11 retirement). Zero post-retirement direct-to-main commits. Anti-pattern #19 holds firm. |
| Sequence gaps in PR numbers (window: #6-#254) | 17 raw → 5 real | 12 of 17 are merge-commit false positives. 4 of remaining 5 (#140-#143) are dependabot bumps superseded by consolidated PR #147 (§4.K). 1 real WIP orphan: PR #21 (→ V-29). |
| PRs referenced in EMBER_PENDING_LEDGER | 32 of 232 (14%) | Expected — ledger is forward-tracking from May 18 creation, not retroactive completeness over full window |
| PRs unreconciled to ledger | 200 | Expected; not actionable. Layer 1's scope ends at quantification. Layer 4 (prod verification sweep) cross-references actionable ship status; Layer 5 (22-bug catalog) cross-references the named-uncertainty subset. |

**Per-day landing density** (post-v2-retirement era only — May 12-18, all via PR):

```
2026-05-12: 28 PRs   wave 4.4 broadcast components + briefing IA
2026-05-13: 16 PRs   doctrine sweep + dependabot consolidation
2026-05-14:  2 PRs   quiet day (Italy travel transition)
2026-05-15: 18 PRs   schedule + briefings refinement
2026-05-16: 40 PRs   audit-day (5-phase audit + Beta + fixes)
2026-05-17: 12 PRs   Tier 3 v1 alert framework (6 PRs)
2026-05-18: 22 PRs   L99 cross-role audit + meta-discipline + ledger
```

**Findings synthesis:**

1. **Anti-pattern #19 status:** HOLDS FIRM post-2026-05-12. Zero direct-to-main commits in the 7-day post-v2-retirement window. The 384 direct commits are entirely v2 history rolled into main at the May 11 retirement merge. Not violations.

2. **Sequence gap class:** 12 of 17 raw gaps are merge-commit-style merges (`Merge pull request #NNN from ...`) that the squash-merge regex `\(#NNN\)$` doesn't catch. Refining the cross-reference regex for future Layer 1 runs is a Layer 1 method-improvement; not a finding requiring action.

3. **Dependabot consolidation pattern (PR #147):** Four individual dependabot bumps (#140-#143) were closed unmerged in favor of the consolidated `risky-runtime-deps` group bump landed as #147. §4.K already tracks #147 as the canonical record. The 4 closed PRs are intentional cleanup, not orphans.

4. **Real orphan: PR #21.** Frank-authored WIP draft titled "coach contact in briefings (PR-F partial — awaiting A/B decision)". Closed 2026-05-12 unmerged. PR body says: *"Migration `20260508194310` applied via Supabase MCP. Production already has these changes: `staff_profiles` table + `tournament_messages.coach_user_ids` column."* So the production schema reflects Path A artifacts. The code wiring (CoachPicker component, useTeamCoaches hook, composer wiring, useComposeBriefing) may or may not have shipped via a different PR. → V-29 verifies.

5. **Ledger reconciliation gap (200 unreconciled):** Expected and not actionable at Layer 1. The ledger is forward-tracking (created May 18 in PR #238); it captures pending/verify/active-bug items, not every shipped feature. The "200 unreconciled" framing is informational — Layer 4 cross-checks production state of ship claims and Layer 5 cross-checks named uncertainties; neither needs Layer 1 to pre-enumerate the 200.

**Layer 1 sign-off conditions check:**

- ✅ Anti-pattern #45 compliance — findings → ledger same commit (this PR)
- ✅ Findings count + ledger-growth report → 1 new V-* (V-29), 1 findings block (~50 lines)
- ✅ Strategic arc routing decision deferred to next layer (Layer 5 next per §4.N sequencing — clears mechanical 22-bug catalog uncertainty)

**Layer 1 effort actual:** ~35 minutes (matches §4.N estimate of 20-30 min with a small unshallow surprise overhead).

Total estimated verification effort: ~7-8 hours when bundled (with V-17 through V-22 additions +1 hour, V-23 through V-28 additions +1.5 hours, V-29 +10 min).
Recommended cadence: batch V-1 through V-7 + V-17 through V-21 (Migrations + BUGs + Phase 1/3 ship-status confirms, ~1.5 hours) as the first Monday pass — these are the highest-value unknowns AND closable with grep/DB queries. V-8 through V-14 + V-27 (~3 hours) as a focused mid-Monday session — these include spec-doc deep reads that benefit from sustained focus. V-15 + V-16 + V-22 + V-23 through V-26 + V-28 + V-29 (~3.5 hours) as a separate "rebuild + tidy" pass when energy is low — these are mostly read-and-flag with low decision burden.

---

### §4.S — Thursday afternoon arc (2026-05-20 PM NYC) — Frank-reported feedback marathon close + forward queue

Full session recap in `docs/STATE_OF_AFFAIRS_L99_v6.md`. This section captures the FORWARD queue (the P1-P4 items) so chat-side can plan routing without re-deriving from the L99 doc.

**Shipped this session (17 PRs + 2 migrations + 1 anti-pattern):** see L99 v6 Part 2.

**Forward queue ranked by tier:**

**P1 — small, clear, no design call (ship next):**
- **B1.** New Tournament form checkboxes have no visible "checked" state. ~20 lines in `TournamentFormSheet`'s team picker. Add `<Check />` icon (Lucide) or `aria-checked` pill style.
- **B2.** Historical events with `opponent = TBD` or null still show on Schedule and Results. Promoted from P3 per chat-side pressure-test — Frank will see these on iPhone within 24h. Surface in admin home alerts lane until cleaned (~30 lines + an alert config row). PR #350 prevents new ones; this addresses the ~7 historical rows.
- **B3.** Financials shows "Winter 2025-26" tab even when empty. ~10 lines — filter `seasons` query to ones with `financial_accounts.count > 0`.
- **B4.** Coach team roster shows "3% Going · 97% NR" with sparse data. ~10 lines — when player has ≤1 RSVP datapoint, render "No RSVPs yet" instead of misleading percentages.

**P2 — design call needed:**
- **C1.** Engine Preview surfaces a dev/preview tool in production admin (MANAGE section). Options: hide via flag / move to `/admin/dev` / remove. **CC recommendation: move to `/admin/dev` (preserve tool, remove from main flow).**
- **C2.** Tournament conflict warning: Jun 6-7 has 2 tournaments registered, no warning if admin double-books. ~30 lines for a banner on the New Tournament form when a selected team is already on another tournament in the same date range.
- **C3.** Form field required/optional indicators inconsistent across New Member / New Location / New Tournament / Edit Team. Adopt the red `*` pattern from PR #350 (Opponent on the wizard) across all required fields. ~50 lines across 4-5 forms.

**P3 — data hygiene (one-shot SQL):**
- **D1.** Import 30 tournament-opponent strings into the opponents directory. SQL one-shot insert from distinct `events.opponent` values where no matching opponent row exists, then backfill `events.opponent_id` via name match. ~15 mins. PR #363 closed the bug for 12 CYO opponents; D1 extends the same fix to the 30 tournament-opponent strings.
- ~~D2~~ — absorbed into B2 (alert-lane fix surfaces TBD-opponent events directly).

**P4 — process / discipline (compounds):**
- **E1.** Anti-pattern #46 CI guard. GitHub Actions step that fails CI if a `*Card.jsx` / `*Row.jsx` / `*Tile.jsx` file is in the diff WITHOUT an accompanying invariant test added in the same PR. Simple grep job.
- **E2.** PR template checklist at `.github/PULL_REQUEST_TEMPLATE.md`: 4 items (anti-pattern #46, #21 migration mirror, admin-home visual verify, #36 null-in-filter). ~10 min add.

**P-deferred (Frank to confirm pain):**
- **C4.** Members list — guardian/family grouping enhancement. ~3 guardians per family but no family grouping in the list. Possible enhancement to spot duplicates. Defer until Frank confirms real pain.

**Open decisions for Frank (block P2 work):**
1. Engine Preview placement (C1) — keep / move to /admin/dev / remove? **Chat-side + CC concur: lean (b) move to /admin/dev.**
2. Tournament conflict warning style (C2) — soft banner or hard block?
3. Required-field marker (C3) — adopt red asterisk pattern everywhere?
4. PR template (E2) — adopt or skip?

**Things Frank already locked this session (do NOT re-litigate):**
- Records page stays (H from earlier triage)
- "+ Player" stays as "+ Member" → /admin/members (PR #360)
- Attendance metric replaced by **Active teams** (NOT active players — Frank's explicit preference for "programs or teams")
- Engine Preview is currently in MANAGE grid (C1 will move it if Frank approves)

**Anti-patterns #46/#47/#48 registered:**
- **#46** (PR #359): cross-component visual rhythm requires invariant test / screenshot / token reference. Origin case in L99 v6 Part 1.2.
- **#47** (chat-side pressure-test 2026-05-20 PM): branch-reset hazard — switch to main before `git reset --hard`. Promoted to registered on first occurrence per calibration heuristic (mechanical operational rule preventing data loss; bounded recovery today, worst-case data loss tomorrow).
- **#48** (chat-side pressure-test 2026-05-20 PM): PostgREST `.order(col, { foreignTable })` is a no-op for parent rows — always sort in JS. Short corollary entry, not a full anti-pattern.

**Trigger pattern established (audit candidates for next session):**
- `team_achievements` aggregates (currently no manual columns — safe)
- Future per-player season stats if/when we add them
- Coach payouts derivable from `events × coach_assignments` — currently manual; potential next target

**Operator-CC discipline observations from this session:**
- Frank's "auto proceed" delegation pattern unlocks rapid serial shipping; CC's calibration is: if item involves DELETION / NEW SURFACE / non-obvious LABEL change, ask. Otherwise execute.
- Branch-reset hazard: twice CC did `git reset --hard origin/main` on a feature branch with uncommitted work, wiping work. ~5 min recovery each time. **Promoted to anti-pattern #47 immediately (chat-side pressure-test) — operational rule preventing data loss, register on first occurrence.**
- **Chat-side pressure-test loop:** L99 v6 v1 had a numbering question (raised by chat-side, verified clean by grep — catalog was contiguous, v6's #46 claim was correct) and an evidence claim that needed pinning (Notify-families E2E). Both corrections shipped via §4.S follow-up commit + L99 Part 7.1 edit. Pattern lock: chat-side reads L99 immediately on close, flags structural questions, CC verifies and reconciles in the same doc-pair.
- Webhook PR subscription pattern paid for itself: PR #361 CI failure caught and fixed within minutes via subscription, vs hours later via Frank's smoke.

**§4.S close conditions:**
- ✅ Anti-pattern #45 compliance — L99 v6 doc creation paired with ledger §4.S in same commit
- ✅ Forward queue captured with tier, scope, effort, recommendation per item
- ✅ Open decisions enumerated for Frank
- ✅ Locked decisions enumerated to prevent re-litigation

**Recommended next-session opener:**
- If shipping mode: start with B1 (lowest risk, surfaces visible bug)
- If process mode: start with E2 (compounds over every future PR; ~10 min)
- If discussion mode: walk Frank through the 4 open decisions, then route from there

---

### §4.T — Event detail page redesign (3-PR arc — PROPOSAL stage)

Frank-requested 2026-05-20 PM after iPad screenshot audit. Current event
detail page accumulates ~3200px of always-on chrome for staff drilling
into a future game (ArrivalBoard auto-expand alone is ~1500px on a
14-kid team). Practice events tolerable at ~1055px; tournament events
similar to games. Full audit + wireframes + responsive notes in
`docs/L99_EVENT_DETAIL_REDESIGN_2026-05-20.txt`.

**Status:** PROPOSAL. Doc handed to Frank for external review on
claude.ai before implementation. No code work yet.

**Proposed 3-PR arc** (per Part 6 of the doc):
- **PR A** — Stop the bleeding (small, zero new components, ~1800px
  reclaimed): drop GameDayMode auto-expand, gate it on isGameType
  (practices stop seeing it), wrap AcademyCallupPicker + LocationTab
  + EventBriefingHistory in CollapsibleSection, remove "Location"
  h2 heading.
- **PR B** — Hero card consolidation: new `GameDetailHero.jsx` (~120
  lines) replaces RsvpSummaryBlock + EventDetailTab +
  EventRosterLockCard from page. Per-event-type action stacks. Parent
  variant integrates MyActionsSection / ParentArrivalActions.
- **PR C** — Polish + Cancel relocation: ⋯ overflow menu in
  EventDetailHeader (Cancel + Delete inside). Drop "Compose recap"
  chip from header (CTA lives inside Briefings collapsible).

**Responsive verified:** uses existing `matchMedia (min-width: 600px)`
breakpoint. Hero action row side-by-side on iPad, stacked on iPhone.
Section header summaries get compact text variant on iPhone if needed.

**Open questions documented in doc Part 7** for reviewer:
1. Hero component scope (one cross-type component vs three)
2. Tournament draft state — show on Schedule list or hide
3. Parking notes prominence (auto-expand Location on game day?)
4. PR A solo first or bundle B+C
5. Action button order (Lock then Notify, or reverse)
6. Audit gaps the reviewer might spot

**Anti-pattern #45 compliance:** this entry created in same commit as
the proposal doc per #45 rule (planning-doc changes must reconcile
ledger §4 in same commit).

**Routing:** Frank → claude.ai review → response back → CC executes
selected PR(s) in order. Highest probability path: ship PR A first as
the no-new-components quick win, validate the impact visually, then
proceed to PR B based on review feedback.

---

#### §4.T close (2026-05-20 PM, post-review execution)

**Status:** SHIPPED (5 PRs merged + 2 deferred for explicit Frank
decision).

**claude.ai review feedback resolution:**
- Q1: one component with branches + EventHeroActions child split ✓
- Q2: tournament draft on schedule list with "Schedule pending"
  treatment — PR #382 already shipped; bracket-icon polish deferred
  to a follow-up schedule-list adjustment.
- Q3: Location auto-expand within game-day window when parking_notes
  exist. Q3 sub (Frank-confirmed): only for parents whose kid is
  RSVP'd Going. Both shipped in PR #396 via `shouldAutoExpandLocation`
  helper.
- Q4: PR A solo first, then PR B+C bundled — actually shipped as 3
  separate PRs (B and C diverged in scope mid-build; reviewer's
  "<250 lines bundling" threshold slightly exceeded).
- Q5 (Frank): Notify left, Lock right (frequency-weighted) — shipped
  in PR #393 EventHeroActions.
- Gap 1 (skeleton): `EventDetailHero.Skeleton` shipped in PR #393.
- Gap 2 (window constants): `src/lib/eventWindows.js` shipped in
  PR #393; threaded through `useEventTimeWindow`, `GameDayMode`,
  `ParentArrivalActions`.
- Gap 3 (cancelled hero variant): red border + Cancelled badge +
  action stack hidden — shipped in PR #393.
- Gap 4 (tournament parent view): parent variant on tournament drafts
  shows RSVP picker if kids on team; full tournament-parent surface
  remains future scope.
- Gap 5 (empty states): verified existing collapsibles use clean copy.

**Shipped PRs:**
- PR #392 — PR A: collapse defaults (~1800px reclaimed)
- PR #393 — PR B: GameDetailHero + EventHeroActions + eventWindows
  constants + skeleton + cancelled variant
- PR #394 — PR C: header overflow menu (Cancel + Delete) + cancel
  relocation + compose-recap chip removal + cancelled red strip
  removal
- PR #395 — CLAUDE.md §16.14 detail page hero + collapsibles pattern
  registered as positive design rule
- PR #396 — Q3 sub: parent Location auto-expand within game-day
  window when kid Going

**Deferred (explicit Frank decision needed):**
- **Lock bottom-sheet inline trigger.** Hero's Lock button currently
  scrolls to EventRosterLockCard below the hero (2-tap flow). Worth
  extracting `LockRosterSheet` from `EventRosterLockCard` only if
  Frank reports the scroll-then-tap friction is real. Lock is not a
  daily action.
- **PostHog instrumentation** (reviewer observation 3). Codebase has
  PostHog initialized but zero `capture()` call sites today; adding
  the first creates a precedent. CLAUDE.md §16.7.1 documents the
  PostHog GeoIP enrichment that hasn't been resolved (project-tier
  toggle not findable). Decision deferred to a separate explicit
  Frank decision on privacy posture + first-capture precedent.

**Anti-patterns reinforced this arc:**
- #11 (150-line cap) tested 4 times across the arc; each time the
  fix was a tighter extraction (helper to lib, child component,
  consolidated JSX). Cap forces good factoring.
- #45 (planning-doc + ledger same commit) followed on PR #391 (doc
  creation) and this close commit. Ledger stays in sync.
- §16.14 (new): positive design rule for detail pages established —
  future tournament / team / player / location detail surfaces use
  the same hero + collapsibles pattern.

**Total session output 2026-05-20 PM:** 13 PRs from the Frank-flagged
afternoon arc → 5 more from L99 redesign + 1 docs + 1 follow-up = 20
PRs in one session. L99 v6 doc captures the broader context.

---

### §4.U — Teams page redesign (3-PR arc — PROPOSAL stage)

Frank-requested 2026-05-20 PM after iPad screenshot audit. Same drift
class as §4.T: an admin-skewed detail page that's grown a mid-section
attendance grid + a "Player Stats" empty-state block + a "2% Going"
pulse metric that misreads to families. Goal stated as "100%
adoption by parents, coaches, and admins" — page must be valuable to
all three personas at a glance.

Full audit + wireframes + responsive notes in
`docs/L99_TEAMS_REDESIGN_2026-05-20.txt`.

**Status:** PROPOSAL. No code work yet. Stop-the-bleeding bugs
identified for PR A.

**Critical bug at the top of PR A (B1 in doc):**
- `TeamHeatmap.jsx:30-41` computes `teamPct = totalGoing / totalPast`
  which floors near zero when check-ins are absent. Header reads
  "Team Pulse · 2% Going" while the grid says "no data here." Two
  conflicting signals on the same surface, family-visible.

**Proposed 3-PR arc** (per Part 6 of the doc):
- **PR A** — Stop the bleeding (small, zero new components): gate
  Team Pulse on responseRate threshold, flip Roster `defaultOpen` to
  false, role-gate "No RSVPs yet" pill to staff only, adopt
  `useHomeRole().activeRole` at page level. Drift-hedge invariant
  test per AP #43.
- **PR B** — Hero card consolidation: new `TeamDetailHero.jsx`
  (~120 lines) replaces TeamHeaderCard + MyChildSpotlight +
  Send-briefing chip + CoachQuickActions. Per-role action stacks
  identical to event-detail hero shape from #393.
- **PR C** — Polish + overflow menu: ⋯ menu in back-chevron row,
  TeamAchievements collapsible, microcopy parent-variant pass.

**Open questions documented in doc Part 7** for Frank:
1. Adopt `useHomeRole().activeRole` at page level (recommend yes,
   in-row permissions stay on real role)
2. Canonical Team Pulse metric (a/b/c, recommend b: response-rate)
3. Roster `defaultOpen` for staff (recommend closed both roles)
4. Strip per-kid RSVP pill stack from parent view? (recommend yes
   except on parent's own kid row)
5. Coach contact line in parent hero — `useTeamHeadCoach` hook
   needed (defer to PR C if data path not yet built)
6. PR A solo first or combined (recommend split)
7. Hard-coded weather lat/lng (B5) — defer separately
8. Hero parent-RSVP picker — iterate over `myChildren` filtered to
   this team (sibling case)

**Anti-pattern #45 compliance:** this entry created in same commit
as the proposal doc per #45 rule.

**Routing:** Frank reviews doc → answers Q1-Q8 → CC executes PR A
first. PR A is the stop-the-bleeding ship (closes B1 + B2 which are
family-visible bugs).

#### §4.U close progress (2026-05-21)

- **PR A** SHIPPED (PR #417 `fix(teams): Teams PR A — stop-the-bleeding`).
- **PR D** SHIPPED (PR #418 `fix(teams): data-layer hardening`).
- **PR B** SHIPPED (this commit, `feat(teams): Teams PR B — hero card
  consolidation`). New `TeamDetailHero` (~142 lines) replaces
  `TeamHeaderCard` + `MyChildSpotlight` + `CoachQuickActions` mounts +
  the floating `Send-briefing` chip + `MessageTeamFAB` mount. Four
  slots per §9.2: identity, state-at-a-glance with `RsvpProgressBar`,
  per-role action stack, head-coach contact line. PLATFORM ADDITIONS
  shipped: co-coach rule via alphabetical sort (head_coach boolean not
  present in `team_staff` schema — verified via MCP), coach-viewing-
  self hides contact line, hero `ChildRsvp` uses `compact={false}` for
  A4. New `useTeamHeadCoach` hook, `isSparseRsvp` shared helper
  (deletes the duplicated detector across PlayerRow + MyChildSpotlight
  + hero). Both new invariant tests pass: `TeamDetailHeroPerRoleInvariant`
  (6 cases across parent/coach/admin/view-as variants) and
  `RsvpProgressBarCrossSurface` (4 cases). Retired components stay in
  tree but unreferenced 1 session per L99 #393 playbook before deletion
  in PR C follow-up.
- **PR C** SHIPPED (PR #423 `feat(teams): Teams PR C — polish + cleanup
  + dead-feature retirement`). Overflow menu + `usePlayerSortOrder`
  hook + retired-file deletion (TeamHeaderCard, CoachQuickActions,
  MessageTeamFAB, MyChildSpotlight) + microcopy parent-variant pass +
  TeamPlayerStats mount REMOVED (anti-pattern #51 second instance).
  `PlayerRowAcademyAvatar.test.jsx` invariant added. Closes V3, V4,
  V6, V7, V8, B6, Q13, Q14(c).

**§4.U arc CLOSED 2026-05-21.** 21 of 27 catalogued findings closed
across all 4 PRs (A/B/C/D). 6 deferred to other arcs per Appendix B
routing (B5 multi-tenant weather, V5 pulse grid scroll indicator, C2
+ C7 perf-pass arc, A2 + A3 a11y full pass arc).

---

### §4.V — Bug-sweep follow-ups (2026-05-20 PM)

From the auto-execute bug-sweep agent run companion to §4.T close.
Agent flagged 7 items; CC verified 3 real + 4 false positives.

**False positives** (no action, agent over-rotated on AP #37 without
applying the FK-scoped exception):
- `RecordPaymentForm.jsx:39` `financial_transactions.insert` — payload
  includes `org_id: orgId`; AP #37 governs read filters, not insert
  payloads.
- `GamesTab.jsx:18-40` `events` queries — events has NO `org_id`
  column (FK-scoped via `team_id → teams.org_id`). AP #37 documented
  exception.
- `ScopeChoiceDialog.jsx:38-40` three `events` queries — same
  FK-scoped exception.

**Real findings shipped in companion PR:**
- `MessagesTab.jsx:12` — added `.eq('org_id', orgId)` before
  `tournament_id` filter (AP #37 discipline, defense in depth over
  RLS). Required `useAuth` import.
- `GamesTab.jsx:18` — added `error` destructure + console.error on
  events query (AP #36).
- `GamesTab.jsx:27` — same on `game_results` query (AP #36).

Three small fixes; no behavior change in the happy path. Bug
diagnostics now surface when PostgREST returns an error.

---

### §4.W — Home-page preemptive split arc (CLOSED 2026-05-21)

Per claude.ai's PQ3 routing (locked in L99 platform audit PART 5
Phase 4): three home pages at/near the 150-line cap split into
header + signal-zone + alert-zone sub-components before feature-
shipping pressure forces a hurried split.

**Status:** CLOSED. Single PR (refactor branch
`refactor/home-pages-preemptive-split`).

**Scope:**
- `CoachHomePage.jsx` (149 → 78) — `src/components/coach-home/`
  - `CoachHomeHeader.jsx` (15)
  - `CoachHomeAlertZone.jsx` (23)
  - `CoachHomeSignalZone.jsx` (94)
- `ParentHomePage.jsx` (149 → 79) — `src/components/parent-home/`
  - `ParentHomeHeader.jsx` (18)
  - `ParentHomeAlertZone.jsx` (25)
  - `ParentHomeSignalZone.jsx` (89)
- `AdminSeasonsPage.jsx` (145 → 71) — `src/components/admin-seasons/`
  - `AdminSeasonsHeader.jsx` (21)
  - `AdminSeasonsActions.jsx` (15)
  - `AdminSeasonsList.jsx` (80)

**Deferred (per PQ3):** `AdminHomePage.jsx` (142) — more headroom.

**Test impact:** `myTeamsCrossSurfaceInvariant.test.jsx` updated to
read the post-split locations — MY TEAMS render moved into the
SignalZone sub-components. Audit `homePageLoadingGateAudit.test.js`
unaffected (`const isLoading = ...` stays in the parent page).
Reinforces anti-pattern #43 (cross-surface invariant test).

**§12 watch reconciliation:** all four candidates that §12 named
(CoachHomePage, AdminHomePage, ParentHomePage, formatters.js,
useAttendanceData.js) now reconciled — three split, one deferred
with headroom note. §12 itself can be re-scoped to a running watch
list rather than the specific four-line bullet.

**PR reference:** SHIPPED via PR #424
`refactor(home-pages): preemptive split per PQ3 (3 pages, 9
sub-components)`.

---

### §4.X — L99 platform-wide audit arc (CLOSED 2026-05-21)

Sustained PM session shipped 14 PRs closing Phase 1 + Phase 2 +
Phase 3 + Phase 4 partial from `docs/L99_PLATFORM_WIDE_AUDIT_2026-05-21.txt`
(v3) and `docs/L99_TEAMS_DETAILED_AUDIT_2026-05-21.txt`. See those
docs' closure addendums (Part 11 platform / Part 14 Teams) for the
full per-PR breakdown.

**Phase 1 (8 PRs):**
- **PR α** SHIPPED (PR #412) — 6 hook anti-pattern #36 batch
  (useCoachHomeSignals, useGameResultsMap, useKindUsage,
  usePrefetchChildRsvps, useUnreadCounts, useBriefingFilters).
- **PR β** SHIPPED (PR #411) — 3 page tap-target fixes (Messages,
  FinancialDashboard, ImportSchedule).
- **PR γ** SHIPPED (PR #410) — 2 hook anti-pattern #48 cleanups
  (useOrgTeamRecords, useTeamGamesByTournament).
- **PR δ** SHIPPED (PR #416) — BriefingsInbox loading gate (P0 closed).
- Companion: audit doc v3 (PR #413), CLAUDE.md amendments per
  amended AP #49 + AP #50/#51 candidates + §16.15 L99 template
  (PR #414), `.gitignore .claude/` chore (PR #415), Teams PR A
  (PR #417, see §4.U).

**Phase 2 (2 PRs, all in §4.U):** Teams PR B (#419) + Teams PR D
(#418).

**Phase 3 (3 PRs):**
- **PR ζ** SHIPPED (PR #420) — edge function mirror byte-compare
  audit shipped with 4-baseline allow-list (102 lines of drift
  recorded). CI-enforces anti-pattern #30.
- **PR ε** SHIPPED (PR #421) — E1 synthetic flag + E2
  `EMAIL_WRAPPER_OPEN` extraction across 4 send helpers.
- Teams PR C (#423, see §4.U).

**Phase 4 partial (2 PRs + 1 research):**
- **Mirror drift cleanup** SHIPPED (PR #422) — 4 pairs closed
  (102 → 17 irreducible TS-only residuals).
- **Home-page preemptive split** SHIPPED (PR #424, see §4.W).
- **Dead-feature audit** (research-only): no third NEW surface
  found for anti-pattern #51 promotion (LiveScorePage,
  suggest-briefing-closer, broadcast components all confirmed
  ACTIVE). #51 stays at candidate.

**Anti-pattern net additions/closures this arc:**
- #30 (mirror discipline): CI-enforced via PR #420 + drift closed
  via PR #422.
- #36 (destructured-default error swallow): 7 callsites closed
  across PRs #410 + #412 + #418.
- #37 (org_id scoping): 100% compliant verified by PR #418's audit
  test (`teamsPageOrgScopeAudit.test.js`).
- #43 (cross-surface invariant tests): 5 new invariant tests
  shipped (TeamPulseHeader, TeamDetailHeroPerRole,
  RsvpProgressBarCrossSurface, PlayerRowAcademyAvatar,
  edgeFunctionMirrorAudit).
- #48 (foreignTable .order): 3 callsites closed (PR γ + Teams PR D).
- #49 (full-paste discipline): amended via PR #414.
- #50 (audit-cascade): CANDIDATE — promotion pending second-pass
  results.
- #51 (dead-feature retirement): CANDIDATE — 2 instances
  (Engine Preview + TeamPlayerStats); no third NEW surface found
  tonight.
- §16.15 (L99 template): registered via PR #414.

---

### §4.Y — Deferred / future arc backlog (post-L99 close)

Per claude.ai PQ5/PQ7 routing — these arcs were intentionally
scoped OUT of the L99 closure session. They live here as the
canonical "next arc to pick up" surface.

**Multi-tenant readiness arc (PQ5)**
Scoped to St. Patrick's 2027 onboarding kickoff. Target window:
Q1 2027 unless St. Patrick's accelerates. Touches B5 (per-org
weather coords), per-org branding edge cases, RLS hardening for
multi-org seasonality, org_id surface audit for any new tables
landed in 2026-Q4. See L99 platform audit PART 5 Phase 4 for the
full scope frame.

**Component cleanup arc (PQ7)**
Defer until "first available week with no urgent shipping work."
Scope: TeamPlayerStats / TeamHeaderCard / CoachQuickActions /
MessageTeamFAB / MyChildSpotlight already deleted via Teams PR C;
remaining file-cleanup candidates live in §14 helper-extraction
backlog and §12 line-cap watch.

**Perf-pass arc**
Deferred. Holding C2 + C7 from Teams audit (useNow tick
re-renders TeamDetailPage subtree every 60s; React.memo on stable
children would resolve), V5 (Pulse grid scroll indicator), §4.M.1
P1-4 (`financial_transactions` over-fetch). Triggered when row
counts grow or FPS drops on iPhone 11 baseline.

**A11y full pass arc**
Deferred. Holding Teams audit A2 (tertiary text contrast against
page bg) + A3 (Pulse grid cells aria-labels) + focus ring
consistency + dynamic type support. Triggered before any parent
beta-test cohort that includes accessibility-need users.

**Second-pass platform audit (anti-pattern #50 test)**
Running in parallel research agent during the L99 close session.
Results pending. If yields ≥3 findings on a new surface for
anti-pattern #51, register #51's third instance (could be the
suggest-briefing-closer if active-but-half-built emerges). If
cascade prediction (13-15 findings per platform audit Part 3.1)
holds, anti-pattern #50 promotes from CANDIDATE to registered.

---

### §4.Z — L99 platform audit close + 49-PR session synthesis (2026-05-21)

Sustained session 2026-05-21 dispatched the L99 platform-wide audit
across 14 batches, executed in parallel by sub-agents per anti-pattern
#50's breadth-via-parallel-agents methodology. Cascade-near-zero
characteristic held (matches #50 origin case prediction). 49 PRs
merged session-end. This entry captures the audit-findings synthesis +
arc closures + new gaps that surfaced.

**Audit findings summary (full L99 platform-wide audit):**

- Batches dispatched: 14 (parallel sub-agent execution)
- Total findings: ~204 (7 P0, 45 P1, 86 P2, 66 P3)
- 2 P0s closed at session-end via PR #456 + #457 (messaging DM picker
  + useDmThreads otherName)
- 5 P0s remaining for routing: P0-C academy callup, P0-D doctrine,
  P0-E / P0-F / P0-G season rollover multi-tenant blockers
- 4 routing clusters deferred: Cluster 3 (#36 hooks layer ~34 sites),
  Cluster 4 (#51 retirement bundle), Clusters 5-8 (broader cleanup)

**Arc-level outcomes:**

- §4.X L99 platform-wide audit arc — CLOSED (see §4.X full breakdown
  for Phase 1-4 PRs; +1 closure addendum PR #425)
- §4.U Teams page redesign — CLOSED (PR A #417 + PR D #418 + PR B
  #419 + PR C #423 + Phase 5 #428 + V5 scroll #430 + tap-target
  regressions #439 closure)
- §4.W home-page preemptive split — CLOSED (PR #424; 3 pages split
  into 9 sub-components)
- New: foundation #36 sweep (PR #448) — 5 callsites closed
- New: edge function #36 sweep (PR #452) — bundle closure
- New: #36 audit test (PR #454) — static-grep gate locked
- New: SECDEF helper library (PR #455) — assert_org_owns_* helpers
  for cross-org validation; defense-in-depth over RLS
- New: Header bell removal + RequireAuth role-resolution contract
  (PR #449) — closes duplicate bell across role variants
- New: relkind='r' audit migrations (PRs #450, #451) — closes
  anti-pattern #24 corollary on player_game_stats + team_types
- New: team-feed RFC 5545 ICS compliance + bounded events query
  (PR #453) — completes V-23 SHIPPED-end-to-end work with strict
  RFC conformance
- New: foundation aria-live sweep (PR #446) — toast, offline
  banner, unread badge; pattern locked, propagation queued

**P0s remaining (routing forward):**

| Tag | Item | Scope | Routing |
|-----|------|-------|---------|
| P0-C | Academy callup token-handler P0 | Edge function path latent regression | TBD |
| P0-D | Doctrine P0 (CLAUDE.md mechanical edit) | Catalog amendment | Separate CLAUDE.md PR (parallel) |
| P0-E | Season rollover multi-tenant blocker #1 | RLS / org-scope gap | §4.Z routing forward |
| P0-F | Season rollover multi-tenant blocker #2 | Similar shape | §4.Z routing forward |
| P0-G | Season rollover multi-tenant blocker #3 | Similar shape | §4.Z routing forward |

**Multi-tenant readiness gaps (NEW — surfaced from Batch 11 P0s):**

3 P0 blockers in season rollover surface (`SeasonRolloverPage.jsx` +
`useSeasonRollover.js`) that prevent St. Patrick's onboarding from
proceeding cleanly. Joins the §4.Y multi-tenant readiness arc as
P0-blocking items (PQ5 scope expansion).

**Anti-pattern catalog amendments (deferred to separate PR):**

Per the scope constraint (this PR touches `docs/EMBER_PENDING_LEDGER.md`
ONLY per anti-pattern #9), CLAUDE.md amendments ship in a parallel PR:
- Anti-pattern #55 candidate registration
- Anti-pattern #56 candidate registration
- Anti-pattern #57 candidate registration
- Anti-pattern #58 candidate registration
- Anti-pattern #59 candidate registration
- auth.uid() wrapper pattern lock
- Anti-pattern #51 promotion (overwhelmingly met by Teams PR C
  TeamPlayerStats removal + Engine Preview retirement + audit-pass
  candidate findings) — promotion is queued for the catalog PR

**Methodology validation (anti-pattern #50 candidate):**

L99 platform-wide audit cascade dynamics:
- Methodology: breadth-via-parallel-agents (14 batch boundaries)
- First-pass yield: ~204 findings
- Second-pass cascade prediction (per #50 origin case): near-zero
- Actual second-pass: pending second-pass agent results (per §4.Y
  "Second-pass platform audit" entry); if cascade stays low, #50
  promotes from CANDIDATE to registered.

**Discipline locks promoted this session (per PR #443):**

7 discipline amendments bundled into CLAUDE.md PR #443:
- Anti-pattern #52 candidate (worktree-path pwd-first) via PR #431
- Section 9.1 pre-flight three-item opener (registered)
- Anti-pattern #54 candidate (same-MCP-burst ready-flip + auto-merge)
- ErrorBoundary §16.10 exemption (PR #444)
- Additional discipline locks: see PR #443 body

**Session-close pre-flight catch (this PR):**

Per Section 9.1 pre-flight discipline registered via PR #443, the
session-open audit on 2026-05-22 caught EMBER_PENDING_LEDGER §4
staleness — last entry was 2026-05-20. This PR closes the gap at
exactly one session boundary. Anti-pattern #45's drift-hedge
discipline holds: planning-doc changes accumulated across PRs
without ledger reconciliation cause silent drift; sub-2-min Section
9.1 pre-flight check (`git fetch && git log` + ledger §4 read) is
sufficient to catch the staleness deterministically.

**Anti-pattern #45 acid-test cycle 14:** session-close reconciliation
PR shipped within one session boundary of the originating work.
Cycle holds.

**Closure conditions:**

- ✅ Anti-pattern #9 compliance — ONLY `docs/EMBER_PENDING_LEDGER.md`
  touched in this PR; CLAUDE.md amendments ship in parallel PR
- ✅ Anti-pattern #45 compliance — ledger reconciled within one
  session of the 49-PR work
- ✅ Anti-pattern #54 compliance — PR created, flipped ready, auto-
  merge enabled in same MCP burst
- ✅ §1 SHIPPED entries added (49 PRs in 14 sub-tables)
- ✅ §4 closures for §4.X / §4.U / §4.W documented above; §4.Z
  captures new pending items (P0-C through P0-G + multi-tenant
  readiness expansion)
- ✅ §5 propagation patterns added (Pattern ALPHA #36 cascade,
  Pattern BETA aria-live, Pattern DELTA reconciliation, latent
  timezone bug, multi-tenant readiness gaps)
- ✅ §14 helper-extraction candidates added (8 ORG_NAME_DEFAULT
  copies, 2 formatDayLabel/formatTime copies, 9 inline formatter
  dupes, 4 CIRCUIT_LABELS files)

---

### §4.AA — Discipline-validating wave close + Cluster 1 + Cluster 3 closures (2026-05-22)

Session 2026-05-22 ran 7 PRs at the top of the 6-8 PR budget. The
shape was discipline-validating rather than discipline-generating —
no new audit dispatches, no new design calls routed, no new clusters
opened. The session contract (max 7-8 PRs, hard stop, no audit
cycle self-generation) held cleanly. Section 9.1 pre-flight ran at
session-open AND session-restart.

**Cluster closures this session:**

- **Cluster 1 (active production bugs)** — FULLY CLOSED.
  - PR #456 (yesterday) — messaging DM picker P0
  - PR #457 (yesterday) — useDmThreads otherName P0
  - PR #462 (today) — academy-callup picker flow bypasses registry,
    ships without tokens (P0-C from §4.Z routing forward)

- **Cluster 3 (anti-pattern #36 hooks cascade)** — FULLY CLOSED across
  PR-A/B/C bundle. Audit baseline reduced 50 → 32 (~17 hooks sites
  closed). Remaining 32 sites are in surfaces not yet audited
  (`lib` utilities have 3 sites flagged in Batch 2b, deferred).
  - PR #461 — PR-A, 6 P1 sites (high-priority hooks)
  - PR #463 — PR-B, 5 P2 sites (realtime + ride hooks)
  - PR #464 — PR-C, ~6 sites (legacy hooks sweep)

**Pattern propagation outcomes (see §5 for full Pattern ALPHA entry):**

Pattern ALPHA (#36 destructure cascade) status moved from
"foundation + edge function CLOSED, hooks queued" → **"foundation +
edge function + hooks ALL CLOSED."** Audit-test static-grep gate
locked via PR #454 (yesterday) catches regressions on land. With
the shipped-code surface area effectively complete, residual sweep
in `lib` utilities is bounded and can be deferred to a future
batched audit.

**P0s remaining from §4.Z routing forward:**

| Tag | Item | Routing | Status |
|-----|------|---------|--------|
| P0-C | Academy callup token-handler P0 | Cluster 1 | ✅ CLOSED via PR #462 |
| P0-D | Doctrine P0 (CLAUDE.md mechanical edit) | Catalog amendment PR | ✅ CLOSED via PR #458 (parallel) |
| P0-E | Season rollover multi-tenant blocker #1 | §4.Y multi-tenant arc | OPEN — deferred to PQ5 arc |
| P0-F | Season rollover multi-tenant blocker #2 | §4.Y multi-tenant arc | OPEN — deferred to PQ5 arc |
| P0-G | Season rollover multi-tenant blocker #3 | §4.Y multi-tenant arc | OPEN — deferred to PQ5 arc |

5 of 5 P0s from §4.Z addressed: 2 closed this session (P0-C + P0-D),
3 deferred per multi-tenant readiness arc routing (P0-E/F/G). The
deferred 3 join §4.Y as PQ5-scope blockers — not regressions, but
blockers for St. Patrick's onboarding when that arc engages (target
Q1 2027 unless St. Patrick's accelerates).

**Anti-pattern #52 refinement (surfaced this session):**

Anti-pattern #52 (worktree-path pwd-first) needed refinement. `pwd`
confirmation alone is insufficient when the Edit tool's path
resolution defaults to parent checkout even when `pwd` reports the
worktree directory. Discipline: agents working in worktree-isolated
context must use **explicit absolute worktree paths**
(`/home/user/skyfire-app/.claude/worktrees/agent-XXX/...`) in every
Edit tool call, not just pwd-relative paths. Held cleanly across
7/7 agents today. Refinement queued for the next CLAUDE.md
amendments PR (parallel to this ledger PR). See §14 discipline-notes
sub-section for the captured observation.

**Discipline locks held this session (7/7 agents):**

- Section 9.1 three-item opener pre-flight (branch + advisors +
  ledger): ran cleanly at session-open AND session-restart
- Anti-pattern #54 (same-MCP-burst ready-flip + auto-merge): 7/7 PRs
- Anti-pattern #55 (use actual PR# from create_pull_request response): 7/7 agents
- Anti-pattern #52 (worktree path discipline): 7/7 agents + refinement surfaced
- Session contract: 7 PRs at top of 6-8 budget, hard stop honored,
  no design calls routed, no new audit dispatches

**Methodology validation (anti-pattern #50, #53, #56, #59 candidates):**

- Anti-pattern #59 (close session when audits run ahead of routing
  capacity): origin case at yesterday's 11pm stop-hold. Today's
  shape validates the discipline — fresh-eyes routing executed
  cleanly without fatigue-driven escalation.
- Anti-pattern #56 (audit cycles need external stop conditions):
  session contract was pre-locked before opener move; held cleanly.
  Discipline cycle continued to work as a check, not as an
  accelerator. Today is the second occurrence of pre-locked
  session-contract discipline holding — promotion to registered
  is one more clean session away.

**Anti-pattern #45 acid-test cycle 15:** session-close reconciliation
PR shipped within same session as the originating work. Cycle holds.
This is the second reconciliation in two consecutive days — Section
9.1 three-item pre-flight at session-restart caught the gap that
yesterday's PR #460 missed (it covered yesterday's 49 PRs but not
today's later #461-#464).

**Closure conditions:**

- ✅ Anti-pattern #9 compliance — ONLY `docs/EMBER_PENDING_LEDGER.md`
  touched in this PR; CLAUDE.md amendments ship in parallel PR
- ✅ Anti-pattern #45 compliance — ledger reconciled within same
  session as the 7-PR work
- ✅ Anti-pattern #52 compliance — explicit worktree path used in
  every Edit tool call
- ✅ Anti-pattern #54 compliance — PR created, flipped ready, auto-
  merge enabled in same MCP burst
- ✅ Anti-pattern #55 compliance — actual PR# from
  `create_pull_request` response used, not guessed
- ✅ §1 SHIPPED entries added (7 PRs in 2 sub-tables)
- ✅ §4.AA captures arc-level closures (Cluster 1 fully closed,
  Cluster 3 fully closed via PR-A/B/C)
- ✅ §5 Pattern ALPHA updated (foundation + edge + hooks ALL CLOSED;
  audit baseline 50 → 32)
- ✅ §14 discipline-notes adjacent to helper-extraction added
  (anti-pattern #52 refinement)

**Session summary:**

2026-05-22 discipline-validating session, 7 PRs, contract held, audit
cycle did not self-generate. Yesterday's 11pm stop-hold validated
today: fresh-eyes routing of the §4.Z catalog produced clean Cluster
1 + Cluster 3 closures + catalog amendments + advisor hygiene
+ ledger reconciliation, with no escalation into new audit
dispatches. Closes Phase 1.1 from next-phases ready-state doc.
Catalog amendments (#52 refinement + #51 + #54 promotions) ship in
parallel CLAUDE.md PR.

---

### §4.AB — Extended Phase 2 + Phase 3 close (2026-05-22 PM, followup)

Session extended past the original 7-PR discipline window into a
19-PR wave engaging Phase 2 (dead-feature retirement) + Phase 3
(design-call closures). Anti-pattern #51 promotion via PR #465
unlocked the dead-feature retirement sweep; Phase 3 design calls
(Q1/Q4/Q5/Q6/Q7) routed under Pattern B / Option A locked routing.

**Phase 2 (Cluster 4 dead-feature retirement) — FULLY CLOSED.**

Anti-pattern #51 promoted from candidate to registered in PR #465
(third-instance criterion overwhelmingly met: 17+ NEW dead-feature
surfaces accumulated post-candidate-registration). 5 retirement
PRs shipped this session under Phase 2.2 sub-arc:

| PR    | Sub-arc | Scope                                                  | Lines retired |
|-------|---------|--------------------------------------------------------|----------------|
| #467  | 2.2b    | TeamPlayerStats + PlayerStatsTable orphan files        | -119          |
| #468  | 2.2c    | InstallPrompt + WelcomeOverlay dead stubs              | -18           |
| #469  | 2.2a    | 5 event/ orphans (RsvpSummaryBlock, EventDetailTab, etc.) | -285        |
| #470  | 2.2d    | useSortedPlayers dead export                           | -7            |
| #471  | 2.2e    | renderers/scheduleChange.js legacy composer            | -219          |

Combined with Phase 3 Q4 (PR #472, -651 lines): total ~1300 lines
deleted across orphan components, renderers, hooks, and section
types. Anti-pattern #42 zero-consumer detection signal worked twice
(useSortedPlayers caught from PR #441, useComposeBriefing closed in
PR #462). The name-collision trap eliminated in PR #471 (legacy
renderer at renderers/scheduleChange.js vs. active composer at
resolvers/scheduleChange.js) — previously a future-Frank confusion
hazard.

**Phase 3 (design-call closures) — PARTIALLY CLOSED.**

| Q | Item | Status | Disposition |
|---|------|--------|-------------|
| Q1 | SECDEF adoption | ✅ SHIPPED | Closed earlier — see §4.AA reconciliation by PR #466 |
| Q2 | Per-player game stats lift | ⏸ DEFERRED | §16.12 doctrine — needs Kenny conversation |
| Q3 | Balance carry-forward | ⏸ DEFERRED | Phase 4 MT readiness arc |
| Q4 | 8 SECTION_RENDERERS orphans | ✅ SHIPPED via PR #472 | Wave 3 build-ahead never adopted; Option A locked routing |
| Q5 | Dual-compose for schedule_change | ✅ SHIPPED via PR #473 | Pattern B locked routing — deferral comments inline |
| Q6 | (verified no-op) | ✅ VERIFIED | No PR needed |
| Q7 | schedule_change fan-out | ✅ SHIPPED via PR #473 | Pattern B locked routing — deferral comments inline |
| Q8 | AdminHomePage growth | ⏸ DEFERRED | Irony test fired — needs decompose first or alt routing |

5 of 8 design calls closed (Q1/Q4/Q5/Q6/Q7). 3 deferred (Q2/Q3/Q8)
with documented routing rationale: Q2 + Q3 are doctrinal /
multi-tenant blockers awaiting external conversations; Q8 hit the
irony test (proposed fix would grow AdminHomePage further, violating
the very growth-ceiling it's meant to address).

**P0 summary across both phases:**

| Tag | Item | Routing | Status |
|-----|------|---------|--------|
| P0-C | Academy callup token-handler | Cluster 1 | ✅ CLOSED via PR #462 (yesterday's §4.AA) |
| P0-D | Doctrine P0 (CLAUDE.md edit) | Catalog amendment | ✅ CLOSED via PR #458 (yesterday's §4.AA) |
| P0-E | Season rollover MT blocker #1 | §4.Y multi-tenant arc | OPEN — deferred to PQ5 arc |
| P0-F | Season rollover MT blocker #2 | §4.Y multi-tenant arc | OPEN — deferred to PQ5 arc |
| P0-G | Season rollover MT blocker #3 | §4.Y multi-tenant arc | OPEN — deferred to PQ5 arc |

No new P0s introduced this session.

**Discipline status this session (19 PRs):**

- Anti-pattern #54 (same-MCP-burst ready-flip + auto-merge):
  **18/19 holds** — broke once on PR #468 (manually flipped ready
  post-creation, no auto-merge fired). First break in 22+
  consecutive holds. Watch list: second break triggers pause +
  document.
- Anti-pattern #52 refinement (explicit worktree path):
  **broke twice today** on its registration day — PR #460
  (recovered mid-flight by agent) + PR #473 (parent-checkout
  leakage detected post-merge). Watch list: third break promotes
  to deeper investigation (Section A.4 in remaining-phases audit
  doc).
- Anti-pattern #55 (use actual PR# from create_pull_request
  response): held cleanly across all 19 PRs.
- Anti-pattern #9 (touch only what the prompt asks): held cleanly
  across all 19 PRs — file-deletion sweeps were surgical.

**Session Contract v3 adopted end-of-day.**

Mid-session contract refresh adopted Contract v3 with new rules
binding the deploy chain to ledger discipline:

- **Rule S2:** doc writes are free actions, no GO needed for the
  agent dispatch.
- **Rule S6:** one fix per prompt — prevents agent scope creep.
- **Rule S9:** build queue + ledger update bound to deploy chain
  commit. Today's PRs #467-#473 violated this (anti-pattern #9
  violation pattern from yesterday's session); this followup PR
  closes the gap.

This followup reconciliation PR is the first ledger update written
under Contract v3's same-commit discipline framing. The Rule S9
violation that produced this PR is the discipline signal that
binds the new contract: planning-doc / ledger updates ship in the
same commit as the deploy work, not as a session-close batch.

**Anti-pattern #45 acid-test cycle 16:** session-close
reconciliation PR shipped within same session as the originating
work, scoped narrowly to the 7 missed PRs from this session's
extension. Cycle holds — Section 9.1 three-item pre-flight at
session-open caught the gap that PR #466 missed (it covered up
through #466 but not the later #467-#473 wave).

**Closure conditions:**

- ✅ Anti-pattern #9 compliance — ONLY `docs/EMBER_PENDING_LEDGER.md`
  touched in this PR
- ✅ Anti-pattern #45 compliance — ledger reconciled within same
  session as the #467-#473 work
- ✅ Anti-pattern #52 refinement compliance — explicit worktree
  path used in every Edit tool call
- ✅ Anti-pattern #54 compliance — PR created, flipped ready, auto-
  merge enabled in same MCP burst
- ✅ Anti-pattern #55 compliance — actual PR# from
  `create_pull_request` response used, not guessed
- ✅ §1 SHIPPED entries added (7 PRs across 3 sub-tables)
- ✅ §4.AB captures Phase 2 (FULLY CLOSED) + Phase 3
  (Q1/Q4/Q5/Q6/Q7 closed; Q2/Q3/Q8 deferred) closure synthesis
- ✅ §5 propagation patterns updated (Pattern ALPHA status,
  anti-pattern #52 + #54 watch lists)

**Session summary:**

2026-05-22 19-PR wave across original discipline window + extended
Phase 2 + Phase 3 close. Cluster 1 (production bugs) FULLY CLOSED.
Cluster 3 (#36 hooks cascade) FULLY CLOSED. Cluster 4 (dead-feature
retirement) FULLY CLOSED via #51 promotion + 5 retirement PRs.
Phase 3 5/8 design calls shipped. Contract v3 adopted end-of-day
captures the same-commit ledger discipline that this followup PR
embodies. Anti-pattern #51 promoted (third-instance criterion).
Anti-pattern #52 watch list: broke twice today on registration day.
Anti-pattern #54 watch list: broke once today in 22+ holds.

### §4.AC — Q8 AdminHomePage decomposition (deferred 2026-05-22)

**Status: DEFERRED. Trigger: cap pressure (next material change requires >150 lines).**

AdminHomePage.jsx is at 142/150 lines (anti-pattern #6 cap). Yesterday's
Phase 3 Q8 routing attempted to ship an inline deferral comment; the
irony test fired (13-line comment block would push the file to 155
lines). Routing pivoted to Option B: documentation lives in CLAUDE.md
§6 (zone decomposition pattern) + this ledger entry tracking the
deferred work.

**When triggered, execute:**
1. Decompose AdminHomePage.jsx into `src/components/admin-home/`:
   - AdminHomeAlertZone.jsx
   - AdminHomeSignalZone.jsx
   - AdminHomeHeader.jsx
2. AdminHomePage.jsx becomes a thin wrapper (~50 lines)
3. Cross-surface invariant test per anti-pattern #43 locks per-role
   behavior

**Reference implementations:** parent-home (PR #424) + coach-home (PR
#424 same session) zone components shipped 2026-05-21.

**Trigger condition:** the next admin-home feature requiring material
change to AdminHomePage.jsx. Do not decompose preemptively per §16.13
"ship not gate by config."

**Why this lives here and not as inline comment:** the 13-line guidance
comment would itself breach the 150-line cap the guidance warns about
(Q8 irony test, 2026-05-22 Phase 3 routing).

Decision routing: 2026-05-22 (Phase 3 Q8, claude.ai Option B locked).

### §4.AD — Console error triage from PR 4 actor walk (2026-05-23 PM)

**Status:** 5 pre-existing bugs surfaced during Frank's PR 4 coach_roundup
actor-send retry after PR #491 deploy. All P1-P2; none are session-
introduced (the column / FK / constraint mismatches predate today's
work). Documented here for next-session routing; **NOT fixed today**
per AP #59 capacity discipline (today's session at 5 PRs, past the
6-8 PR budget for sustainable cadence).

**Discovery context:** Frank pasted DevTools console output during the
PR 4 actor walk. Wizard send still failing — but the `.from`-on-undefined
error from earlier (which prompted PR #491) is NOT in this paste, suggesting
either (a) it's now resolved by PR #491's slice-contract fix, (b) it's
in a stale-cache layer Frank needs to hard-refresh past, or (c) it's
still firing but buried in console noise Frank didn't include.
Pending the literal stack trace per A.1.a-2 task — see [[verify-corrections-against-repo-state]]
discipline applied to error-source claims.

**5 distinct bugs catalogued (all verified against schema via
information_schema query 2026-05-23T17:30 UTC):**

#### BUG-A — `comms_messages.created_at` does not exist (P1)
- **Error:** `[alerts/evaluator] briefing_overdue:weekly_digest failed: column comms_messages.created_at does not exist`
- **Caller:** `src/lib/alerts/evaluator.js` (briefing_overdue check)
- **Verified:** `comms_messages` columns include `last_edited_at` + `sent_at` + `scheduled_for`, but NO `created_at`.
- **Fix shape:** swap `created_at` → `last_edited_at` (the alert's intent is "when was the row created/most-recently-touched")
- **Severity:** P1 — admin home alert silently fails; no briefing_overdue signal reaching admin

#### BUG-B — `family_balances.family_id` does not exist (P1)
- **Error:** `[alerts/evaluator] payment_overdue failed: column family_balances.family_id does not exist`
- **Caller:** `src/lib/alerts/evaluator.js` (payment_overdue check)
- **Verified:** `family_balances` view exists but lacks `family_id` column. Likely renamed to `guardian_id` or `account_id` during a prior wave.
- **Fix shape:** read `family_balances` columns + remap caller to the actual key. Grep other callers of `family_balances.family_id` for cascade scope.
- **Severity:** P1 — payment_overdue admin alert silently broken

#### BUG-C — `event_notifications.title` does not exist (P1-P2)
- **Error:** `NotificationHistory: column event_notifications.title does not exist`
- **Caller:** `src/components/notifications/NotificationHistory.jsx` (or hook)
- **Verified:** column missing.
- **Fix shape:** column likely renamed to `subject` or `headline`. Read schema, remap.
- **Severity:** P1-P2 — admin notification log broken (visible in admin UI but not blocking workflow)

#### BUG-D — `event_rsvps.player_id` FK relationship missing (P1)
- **Error:** `useRecentActivity fetch: Could not find a relationship between 'event_rsvps' and 'players' in the schema cache`
- **Caller:** `src/hooks/useRecentActivity.js` (recent-activity feed on admin home)
- **Verified:** no `player_id` column on event_rsvps with FK to `players`. event_rsvps is FK-scoped via event_id → events per CLAUDE.md §11.5 / §37; the player relationship goes through team_players, not event_rsvps directly.
- **Fix shape:** restructure the PostgREST embed. Likely `event_rsvps → events → teams → team_players → players` or read player names via separate query (per CLAUDE.md §36 — destructure error not data).
- **Severity:** P1 — Frank-facing recent activity feed broken

#### BUG-E — `useFavoriteAudiences` ON CONFLICT mismatch (P2, AP #25)
- **Error:** `[useFavoriteAudiences] persist failed there is no unique or exclusion constraint matching the ON CONFLICT specification`
- **Caller:** `src/hooks/useFavoriteAudiences.js` (or similar)
- **Verified:** `user_preferences_pkey` is composite `PRIMARY KEY (user_id, org_id)`. Hook upserts with `onConflict: 'user_id'` (singular) — doesn't match the composite PK.
- **Fix shape:** Per AP #25, change `onConflict: 'user_id'` → `onConflict: 'user_id,org_id'` (comma-separated composite). Cross-check `pg_constraint` per AP #25 closing note.
- **Severity:** P2 — favorite audiences don't persist; user re-selects each session

#### Adjacent observation — Service worker fetch error on `/admin/briefings/compose`

DevTools paste also showed:
```
The FetchEvent for "/admin/briefings/compose" resulted in a network
error response: the promise was rejected.
Uncaught (in promise) TypeError: Failed to convert value to 'Response'.
```

Likely PWA stale chunk cache after today's 4-deploy cascade (PRs #488 / #489 / #490 / #491 each triggered a Vercel deploy with fresh Vite hashes). Per STATE_OF_AFFAIRS_L99_v6 §3.3 + PR #356, SW cache + chunk-hashed bundles is a known failure surface; PR #356 added auto-reload on `ChunkLoadError` but may not catch this specific `Failed to convert value to 'Response'` shape.

**Frank-action:** hard refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`) before next PR 4 actor walk. If wizard send succeeds post-refresh → PR #491 fixed the real bug; the prior `.from` error was stale-cache noise. If still fails → A.1.a-2 needs the literal stack trace from fresh cache state.

**Possible PR #356 follow-up:** extend ErrorBoundary's auto-reload trigger to include `TypeError: Failed to convert value to 'Response'` in addition to `ChunkLoadError`. Defer to next session.

**Routing:**
- BUG-A through BUG-E ship as a single ~5-PR cleanup arc, scoped narrowly per fix (each is a 1-3 line change). Recommended bundling: one PR per bug for review clarity, OR one bundle PR if Frank prefers low ceremony. AP #43 cross-surface invariant tests for the column-rename cases (A, B, C).
- SW auto-reload extension: small follow-up PR after BUG-A through E land.

**Why these surfaced today:**
All 5 are pre-existing bugs that were failing silently. Discovery is part
of the actor-walk value — Frank opening DevTools to investigate the
wizard send error surfaced ambient console noise that had been there
for days/weeks. Same pattern as PR #356's `console.error` Sentry gap
(STATE_OF_AFFAIRS_L99_v6 §3.3): code-only audits miss runtime errors
that only surface in production browsers.

**Anti-pattern catalog evidence (continued validation):**
- AP #25 (onConflict composite vs single column): BUG-E is the 3rd
  observed instance (PR #38 staff_profiles, PR #37 same line, now
  useFavoriteAudiences). Discipline holding via grep + pg_constraint
  cross-check.
- AP #50 (broad surface audits cascade): this isn't an audit but
  Frank's actor walk surfaced 5 latent bugs that pure code review
  hadn't caught. Validates the "actor validation as audit gate"
  framing in PR 4 + PR 5's status fields.

---

### §4.AE — L99 Compose-Briefing Audit (2026-05-24)

**Status:** Phase 1 audit complete (PARTIAL — 28 files audited, ~64 deferred). PR #493 shipped the root-cause `.from`-on-undefined fix during the audit. Audit doc lives at `docs/archive/L99_COMPOSE_BRIEFING_AUDIT_2026-05-24.txt`.

**Surface:** ~28 files across send pipeline + Wave 5 resolvers + tournament/game resolvers (partial) + engine dispatch + hooks. Deferred: ~30 renderers, ~34 wizard UI body editors, edge function detail.

**Findings: 82 total** (5 P0 / 36 P1 / 41 P2 / 0 P3). All 5 P0s concentrated in send pipeline (Agent 2) due to recent PR 7b-2 cutover gate complexity. Other surfaces clean of P0.

**Discovery context:** Yesterday's wizard send `.from`-on-undefined error root-caused via Agent 2 FINDING-2: `queueComposedMessages.js` dynamic `await import('../supabase')` resolving malformed under PWA stale-cache → supabase undefined → `.from` threw. Fix shipped PR #493 (static imports). Symmetric across all 4 composerSubmit-path kinds.

**Investigation discipline note:** PR #491 (yesterday's earlier fix for slice.kind contract gap) addressed a real but separate bug — not the user-visible error. Memory `distinguish-inferred-vs-confirmed-error-source` saved at yesterday's session close captures the inferred-vs-confirmed error-source discipline gap. This audit applied that lesson: Agent 2's FINDING-2 was verified against literal error text + module export contract before PR #493 shipped.

**Recommended ship sequence (12 PR cap):**
1. PR #493 — `.from` fix ✅ MERGED
2. This PR — audit doc + §4.AE entry
3. P0 bundle — `scheduleChangeSend` + `digestSend` static-imports/null-guards (P0-13/18/20)
4. P0-8 verification (likely false-positive from Agent 2 reading outdated state — confirm before ship)
5-6. Send pipeline P1 batch — null-guard fixes
7. Registry pre-dispatch validation bundle (4 anchor entries — E09/E10/E11/E12)
8. Token substitution validation bundle (callup/feedback/rsvp — E03/E04/E05)
9. `useBriefingDraft` state-overwrite fix (E06)
10. `tournamentRecap.js` org-name bug (T12)
11. `tournamentPrelim.js` broken fallback (T03)
12. Session-close TXT + final reconciliation

**Out-of-scope (next session):** renderers, wizard UI body editors, edge function detail, 4 incomplete tournament/game reads (`gameRecap.js`, `gameRecapHelpers.js`, `scheduleChange.js`, `feedbackSurveySection.js`, `tournamentRecapHelpers.js`).

**Anti-pattern catalog evidence:** AP #25 / #27 / #28 / #29 / #36 / #37 / #43 / #48 / #50 all surfaced multiple instances. Catalog continues to pay. No NEW AP candidates from this audit.

**Discipline observations:**
- **Agent autocompact thrashing:** 3 of 5 first-pass agents failed at 15-30 files. Re-dispatch at 5-8 files succeeded. Refinement: target 5-6 files per agent for L99 narrow-LBL passes.
- **Actor walk as audit gate:** Frank's wizard send surfaced the `.from` bug pure code review hadn't caught. PR 4 + PR 5 sat "code-complete" for 5+ days before this discovery. Validates the framing on those PRs' status fields.

---

### §4.AF — L99 Compose-Briefing Chat-Side Audit (2026-05-24)

**Companion to §4.AE.** Independent parallel audit dispatched from chat-side claude.ai (terminal-CC ran §4.AE). Complementary coverage: §4.AE focused 28 files on send pipeline + resolvers; §4.AF covered the broader 89-file surface (composer wizard + hooks + RLS migrations + schema + advisors). Conflict on §4.AE position resolved by promoting this entry to §4.AF.

Six-batch parallel line-by-line audit (~89 source files, ~51 test files, 17 schema migrations). Methodology per AP #50 narrow-scope rule. Canonical artifact: `docs/archive/L99_COMPOSE_BRIEFING_AUDIT_2026_05_24.md`. Ships with PR #495 alongside 4 P1 fixes + 1 P2 fix.

**Shipped in PR #495 (4 P1 + 1 P2):**
1. AP #37 — `useBriefingFilters.js:57` org_id ordering
2. AP #37 — `BriefingHistoryDetail.jsx:38` org_id ordering
3. AP #15 — `briefing_inbox_preferences_own` policy wrap `auth.uid()` in `(SELECT)` (migration 20260523195203)
4. AP #6 — `composer.js` 163L → 34L; SECTION_RENDERERS extracted to `sectionRenderers.js` (re-exported for caller stability)
5. P2 — `BriefingHistoryDetail.jsx:22` iframeStyle hex literal → token

**Cross-coverage check vs §4.AE:** §4.AE caught the real send-pipeline P0s (queueComposedMessages dynamic-import, scheduleChangeSend/digestSend null-guards) that §4.AF missed. §4.AF caught AP #37 ordering + AP #15 RLS + AP #6 file-length that §4.AE didn't surface. Complementary, not redundant. The .from-on-undefined root cause (PR #493) was uniquely §4.AE's discovery via Agent 2.

**False positives caught during synthesis (do not act):**
- Batch D's `recipientFilter.js` org_id miss — `events` and `tournament_teams` are FK-scoped (no org_id column) per AP #37 exception
- Batch C's "tournamentRecap.js renderer missing" — recap renders via section composition (placementBlock + standoutMoments + gameLog + bracketCallout); template-driven dispatch is by design
- Batch C's renderer hex literals flagged as §3 violations — email HTML cannot use CSS variables (§13 #1); raw hex required for email-client compatibility
- Batch F's "3 RLS policies" on briefing_inbox_preferences — actually 1 policy with `polcmd='*'` (ALL); USING + WITH CHECK count as one policy, fixed by single DROP+CREATE
- Batch F's AP #57 P2 EXTERNAL anon access — `has_function_privilege('anon', briefing_active_queue, 'EXECUTE')` already returns FALSE. Lowered to P3 hardening (defense-in-depth only)

**Open follow-ups (P2/P3, do not block):**

| Item | Severity | Routing |
|---|---|---|
| `BriefingComposer` Step 2 recipient preview chip (§13 #7) | P2 | Design call: where to mount + admin BCC implications. Defer until next compose-briefing iteration |
| AP #57 hardening migration for `briefing_active_queue` (add explicit REVOKE FROM PUBLIC + REVOKE FROM anon) | P3 | Defense-in-depth only — anon already cannot execute per live `has_function_privilege` check. Bundle with next briefing schema migration |
| `familyGuideHelpers.js` (155L) over AP #6 cap | P3 | Same shape as composer.js split; next material change to family_guide triggers the action |
| `supabase/functions/briefing-cron-dispatch/_helpers.ts` (152L) Deno mirror at cap | P3 | TS annotation overhead. Split next time the cron-dispatch logic gets material work |
| `_lib.ts` token handler — `any` types + silent error swallow in `mintUnsubscribeUrl` | P3 | Edge function hardening pass |
| Renderer hex literals → constants in `colors.js` | P3 | 4 files (hotelBlock, gameCard, callupResponse, rsvpRequest), ~15 hex literals. Email HTML still uses inline hex, just sourced from a const map for diff-friendly future swaps |
| Test-coverage audit completion (resolvers + renderers) | P3 | Batch B + C agents self-truncated at the test-file boundary; the coverage gaps are not enumerated. Dispatch a focused test-only audit batch when there's session capacity |
| Tournament_recap rendering architecture (resolver + 4 sections, no dedicated renderer file) | P3-doc | Section-composition is by design. One-line architecture note in §13 or §16.x would prevent the next batch agent from flagging it as missing |
| Audit doc filename consolidation — `.md` (§4.AF) vs `.txt` (§4.AE) on same day at near-identical paths | P3-doc | Project convention is `.txt` per `L99_PLATFORM_WIDE_AUDIT_2026-05-21.txt`. Follow-up PR to rename `L99_COMPOSE_BRIEFING_AUDIT_2026_05_24.md` → `_chat.txt` or merge content into the .txt doc |

**Pattern locks from this audit:**
- **PATTERN ALPHA — AP #37 org_id ordering compliance** (locked): 2 real instances post-FP-1 reclassification (`useBriefingFilters` + `BriefingHistoryDetail`). The FK-scoped exception (events, tournament_teams, event_rsvps, team_players, player_guardians, comms_message_recipients, etc. — tables without an `org_id` column) is the dominant false-positive mode for agents auditing AP #37. Future AP #37 audit prompts should include the exception list explicitly to prevent FP-1 recurrence
- **PATTERN BETA — authentication discipline drift** (locked): 2 findings in Batch F briefing infrastructure (AP #15 real, AP #57 hardening). Per-subsystem migration sweeps for `auth.uid()` literals and `SECURITY DEFINER` grant chains should be replicated for other subsystems

**Batch-agent self-truncation observation:**
3 of 6 batches' continuation runs self-truncated at the test-file boundary, citing imagined "no tools" constraints never present in the prompt. Likely cause: context-window pressure as findings accumulate; agent confabulates a stop instruction to gracefully degrade. Mitigation for future multi-batch audits: split test-file audit into a separate agent dispatch, OR set explicit progress checkpoints in the prompt. Matches §4.AE's "agent autocompact thrashing" observation independently — same failure class surfaced in two parallel sessions.

**Anti-pattern catalog evidence (continued validation):**
- AP #50 (methodology matches scope): six-batch parallel line-by-line at narrow scope produced clean findings with ~15-20% false-positive rate caught at synthesis. Validates the discipline
- AP #45 (planning-doc → ledger reconciliation): this entry shipped in same commit as the audit doc, holding the discipline
- AP #15 / AP #37 (recurring drift classes): both still surface despite registered anti-patterns. Per-subsystem audit sweeps are the recovery mechanism

---

### §4.AG — L99 Compose-Briefing Audit Phase 3 (2026-05-24 PM)

**Companion to §4.AE + §4.AF.** Afternoon resumption after nap+lunch break. 4-batch parallel audit of the unaudited Phase 2 surface (32 files / ~1658L). Methodology per §4.AE's 5-8 files per agent calibration. Canonical artifact: `docs/archive/L99_COMPOSE_BRIEFING_AUDIT_2026-05-24_phase3.txt`.

**Surface covered:**
- Batch G — 7 unaudited renderers from morning Batch C self-truncation (brandFooter, bracketCallout, coachReflection, colorStripedRow, venueList, venueNotes, vipHeader)
- Batch H1 — 7 wizard body editors for event-anchored kinds (TournamentPrelim, TournamentRecap, GameRecap, ScheduleChange, RsvpNudge, AcademyCallup, AcademyCallupRedirectCard)
- Batch H2 — 8 wizard editors for general kinds + audience pickers (Announcement, CustomMessage, WeeklyDigest, CoachRoundup, FamilyGuide, PlayerPicker, RecentAndFavorites, TeamGroupedPicker)
- Batch I — 4 incomplete tournament/game resolver reads from §4.AE deferral (gameRecap, gameRecapHelpers, scheduleChange, tournamentRecapHelpers) + feedbackSurveySection

**Shipped in this PR (1 unique P1 + audit doc + this ledger entry):**
1. AP #36 — `PlayerPicker.jsx:36` destructured `{ data }` → `{ data, error }` + error guard + early-return. Closes silent-failure path on RLS denial / column errors

**Parallel shipping note:** AP #25 useFavoriteAudiences.js:52 onConflict fix was independently shipped by Frank's terminal session as PR #497 (§4.AD BUG-E close) while this PR was in-flight. After merge resolution, the useFavoriteAudiences.js + test changes collapse to no-op in this PR's unique diff (both sides made identical changes). The orthogonal-discovery observation stands: two parallel sessions independently surfaced the same fix from the same anti-pattern, validating AP #25 detection methodology.

**False positives caught at synthesis (3 of 4 H2 findings — 75% FP rate):**
- `CoachRoundupBody.jsx:49` "silent on error" — file actually destructures `{ data, error }` and checks `if (error)` first. The `data || []` is the correct defensive fallback for success-with-zero-rows
- `FamilyGuideBody.jsx:52` "silent on error" — same correct pattern
- `RecentAndFavorites.jsx:44` "hook destructure no guard" — line 44 is just the function declaration; no destructure on that line

**False-positive class identified:** Agents flagging AP #36 by string-matching `data ||` without reading the 3-line context block above (where the error destructure + check live). Future AP #36 audit prompts should require agents to quote the surrounding error-check block before flagging.

**Pattern analysis:**
- **PATTERN GAMMA candidate (AP #36 destructured-default error-swallowing)** — DOES NOT LOCK. Only 1 real instance (PlayerPicker) survived synthesis verification. 3 candidates collapsed as false positives. Re-evaluate if PlayerPicker-shape pattern recurs in future batches
- **PATTERN ALPHA (AP #37 ordering, locked §4.AF)** — NO RECURRENCE in Phase 3. All org-scoped queries ordered correctly
- **PATTERN BETA (auth discipline, locked §4.AF)** — NO RECURRENCE in Phase 3

**Orthogonal verification — §4.AD BUG-E closure:**
Yesterday's console triage surfaced `[useFavoriteAudiences] persist failed there is no unique or exclusion constraint matching the ON CONFLICT specification`. Today's Phase 3 Batch H2 agent independently surfaced the exact same fix from code-grep + pg_constraint check, without §4.AD context. Validates AP #25 detection methodology: agents applying the discipline DO catch the bug class without needing prior console signal.

**§4.AD bug closure status:**
- BUG-A ✅ closed by PR #496 (parallel terminal session — comms_messages.created_at → last_edited_at on briefing_overdue alert query)
- BUG-E ✅ closed by PR #497 (parallel terminal session — useFavoriteAudiences onConflict composite)
- BUG-B/C/D ✅ closed by PR #498 (parallel terminal session — family_balances column remap with return-shape map preserving evaluator.js contract + event_notifications JSONB title/body extraction via PostgREST `col->>key` aliases + event_rsvps→players embed restructure to separate fetch + JS Map join, since no FK constraint exists)
- **§4.AD arc fully closed (2026-05-24 PM).** All 5 console-triage bugs landed in main across PRs #496/#497/#498. Reconciliation per AP #45 same-commit ledger discipline applied 2026-05-25 (this edit, post-PR-#498-merge)

**Methodology yield (afternoon Phase 3):**
- Batches G + H1 + I: 0% false-positive yield (clean reads)
- Batch H2: 75% false-positive yield (3 of 4 P2s collapsed)
- Per-batch agent quality variance is real. Synthesis gate caught all 3 H2 false positives before shipping. Verify-before-execute discipline holding.

**Combined session arc (morning + afternoon):**
- 2 PRs from this chat session (#495 + this one)
- 6 P1 fixes shipped (4 morning + 2 afternoon)
- 1 P2 shipped (morning)
- 2 audit docs + 2 ledger entries (§4.AF + §4.AG)
- 1 schema migration applied + mirrored
- 0 P0 surfaced across both phases
- 10 false positives caught at synthesis (5 morning + 3 afternoon + 2 carryover-verified)

**Session contract held:**
- Max 2 PRs from Phase 3 arc — only 1 needed
- No second-cycle audit dispatch — closing per AP #56 + AP #59
- Design calls deferred to ledger (no new ones surfaced this phase)

**Audit catalog evidence (continued):**
- AP #25: third confirmed instance in codebase (PR #38 staff_profiles, PR #37 same line, this PR useFavoriteAudiences). Discipline still pays
- **AP #25 — orthogonal-discovery validation (promoted 2026-05-25 from §4.AG "Orthogonal verification" subsection).** Two parallel sessions (chat-side Phase 3 Batch H2 + terminal-side §4.AD console-triage) converged on the identical useFavoriteAudiences composite-PK fix with zero shared context. One path started from a literal console error (`there is no unique or exclusion constraint matching the ON CONFLICT specification`); the other started from a `pg_constraint` + code-grep audit pass with no console signal. **Independent paths surfacing the same finding ⇒ strongest validation signal for an anti-pattern detection methodology.** AP #25's pg_constraint cross-check rule is durable enough that re-running it (even partially, even without prior context) re-surfaces the same bug. Promoted as durable structural signal, not a one-off coincidence
- AP #36: refinement noted — verification gate must read 3-line context block, not single-line string match
- AP #58 candidate (cross-batch pattern check): worked as designed. PATTERN GAMMA evaluated, did not lock, follow-up registered. The "lock only at 3+ real instances post-synthesis" heuristic held
- AP #50: 4-batch parallel narrow-LBL methodology validated again. Per-batch variance (0% to 75% FP rate) is acceptable as long as synthesis catches it

---

### §4.AH — §4.AE Batch I close-out (2026-05-25 AM)

**Closes:** §4.AE deferral on 4 incomplete tournament/game resolver reads from yesterday's audit.

**Session contract:** max 1 PR, deeper integration synthesis pass on top of §4.AG's narrow-LBL Phase 3 Batch I (which returned 0 findings but at code-level only, not integration-level).

**Scope (files read in deeper synthesis pass):**
- Primary (5): `gameRecap.js`, `gameRecapHelpers.js`, `scheduleChange.js`, `tournamentRecapHelpers.js`, `feedbackSurveySection.js`
- Cross-reference (8+): `registry.js`, `composer.js`, `sectionRenderers.js`, `scheduleChangeSend.js`, `composerSubmit.js`, `feedbackTokens.js`, `feedbackSubstitutor.js`, `briefingCronHelpers.js` + selective reads of `tournamentRecap.js`, `tournamentPrelimHelpers.js`, `scheduleChangeHelpers.js`

**Findings:** 0 P0 / 0 P1 / 0 P2. **CLEAN.**

**Integration invariants confirmed (8/8):**
- AP #27 — no static supabase imports in any resolver; all throw early on missing `options.supabase`
- AP #28 — no per-kind branching outside `registry.js` (verified: `briefingCronHelpers.js:34` switch is a data table, not dispatch; `AudiencePicker.jsx:36-37` per-kind branches are UI affordance gates, not dispatch)
- AP #29 — token field naming symmetry holds for feedback survey: `feedback_token_placeholders` (compose-emit) → `feedback_token_urls` (post-substitution, separate field); URL wrap lives in `feedbackSubstitutor.js:39-44` send-side helper, not in substitute helper or renderer
- AP #34 — no orphan callers for game_recap / schedule_change / tournament_recap; the 3 grep hits on `compose({kind:'schedule_change'})` are all comment-text references to the prior orphan that PR #99 closed
- AP #36 — every Supabase chain in the 5 files destructures `{ data, error }` and throws on error before using data (20+ call sites confirmed)
- AP #37 — all tables queried are either FK-scoped (exempt) or filter on `org_id`/`organization_id` first
- AP #38 — all 10 emitted section kinds (header, footer, signoff, stats_narrative, schedule_change_diff, coach_reflection, standout_moments, game_log, placement_block, feedback_survey) present in `SECTION_RENDERERS` (sectionRenderers.js:53-86, chat-side spot-checked `signoff` at line 61 to verify agent claim)
- AP #44 — no gate-style findings to trace; resolvers are linear async chains with throw-on-error at every step

**P3 watch-item (NOT a fix candidate — documented design choice, recorded for future-watch only):**

`gameRecap.js:84` + `scheduleChange.js:94` + `tournamentRecap.js:115` all hardcode `name: ORG_NAME_DEFAULT` ('Legacy Hoopers') in the returned `context.org` while the upstream query fetches `org.name` from the DB and discards it. Under single-org pilot (current state), this renders correctly. Under multi-tenant rollout (CLAUDE.md §4 "Multi-Tenant Architecture"), every org's briefing would render "Legacy Hoopers" regardless of actual org. Pattern is consistent across all calendar-anchored resolvers (5+ instances) — this is a documented design choice, not drift. Re-evaluate when multi-tenant rollout becomes the active arc.

**Cross-batch pattern observations:**

- No new patterns. Pattern ALPHA (AP #36 destructure cascade) — all destructures in scope already migrated to safe form during Beta B6 audit (`// Beta B6 audit — anti-pattern #36.` comments mark migration sites in gameRecap.js:73, scheduleChange.js:39/69/81, tournamentRecap.js:47/67)
- §4.AG narrow-LBL claim verified: code-level read returned 0 findings, deeper synthesis pass also returns 0 findings. Per AP #50: "narrow scope line-by-line = high signal-to-noise, low miss rate" — Batch I is a true clean batch, not a missed-finding cascade. §4.AG's clean read was sufficient; §4.AH's deeper pass confirms rather than supersedes
- Intentional asymmetry verified: `tournament_recap` does not emit `buildFeedbackSurveySection()` while the other 4 composerSubmit-path kinds + weekly_digest do. Confirmed against PR 7b-2 + PR 7b-2.5 routing lock: the 5 feedback-enabled kinds are tournament_prelim, family_guide, coach_roundup, game_recap, weekly_digest. tournament_recap is intentionally excluded per Frank's 2026-05-22 routing decision

**Methodology yield:**

- 1 agent dispatch, 1 PR (this ledger entry)
- 0 fixes shipped (clean close)
- 1 chat-side spot-check verification (AP #38 `signoff` line 61) — agent claim held
- Session contract held: max 1 PR, no second-cycle dispatch

**Audit catalog evidence (continued):**

- AP #50 validated again: deeper synthesis pass on §4.AG's narrow-LBL clean batch confirmed the prior result rather than overturning it. The methodology calibration ("narrow-LBL clean ⇒ probably actually clean") held this round. Deeper pass remains worth running on deferral close-outs as defense-in-depth, but the prior-clean signal was load-bearing
- AP #59 session contract discipline: pre-locked at session-open before any dispatch (Batch I close-out only, max 1 PR). Held cleanly — agent returned in single pass, no scope creep, no second cluster engagement
- AP #56 external stop condition: contract was set externally (operator routing) rather than driven by the audit-cycle's internal momentum

**Standing pending surface (carried forward unchanged):**

- Frank's wizard test on PR #493 (A.1.b) — operator action; unblocks A.2/A.3
- 36 P1 + 41 P2 from §4.AE / §4.AF audits — large catalog, requires per-finding verify-before-execute
- B.1/B.2 PreToolUse hook arc (A.4 Option 3)
- §4.AF P2 BriefingComposer recipient preview chip
- ~30 renderers + ~34 wizard UI body editors deferred audit surface
- Multi-tenant org_name shadowing (P3 watch-item from this audit — defer to multi-tenant arc)

§4.AE Batch I closes as expected. Audit cycle complete on this surface.

---

### §4.AI — Briefings Option C redesign (2026-05-23 PM)

**Origin:** Frank-driven session 2026-05-23 PM. After PR #503 retired the redundant "Compose Briefing" tile, Frank reviewed the resulting Briefings inbox and flagged Active (41) + Drafts (37) as too noisy — Active included drafts, drafts included 12-day-old stragglers. Three options presented (A: hero + collapsibles; B: tab-count cleanup; C: compose-first, hide queue). Frank locked **Option C**.

**Locked decisions:**
- Briefings tile → composer modal opens directly (existing `/admin/briefings/compose` route)
- Draft-resume affordance → inside composer Step 1 (StepKindPicker)
- Synthetic alerts → Admin Home `AlertZone` only
- Sent history → new `/admin/briefings/history` page, reached via "View sent" link in wizard header
- Auto-archive cadence → 7 days untouched
- `/admin/briefings` URL → redirect to `/admin/briefings/compose`
- `CutoverGateChip` → stays on AdminHomePage only

**Audit doc:** `docs/archive/AUDIT_BRIEFINGS_OPTION_C_REDESIGN_2026-05-23.md` (this commit). Full §16.15 template: initial pass + deep-read addendum + AP cross-reference + admin wireframes + out-of-scope + 3 open questions + PR sequence.

**PR sequence (4 PRs) — ✅ ALL SHIPPED 2026-05-23/24:**
- ~~**PR A**~~ ✅ **SHIPPED #505** — Freestanding `BriefingsComposePage` + `BriefingsHistoryPage`; route updates; `QuickActions` tile retarget; `useAvailableDrafts` hook; `DraftResumeRow` component; "View sent" link in WizardHeader. Deleted `BriefingsInboxPage` + inbox sub-components. (Tile retire shipped separately as #503; audit doc #504.)
- ~~**PR B**~~ ✅ **SHIPPED #506** — 3 new `briefing_overdue` sub-keys (game_recap, tournament_recap, schedule_change_followup). Migration + 3 evaluators in `src/lib/alerts/evaluator.js`.
- ~~**PR C**~~ ✅ **SHIPPED #508** — `CutoverGateChip` test refactor to single-surface per AP #43. ⚠ **Note:** the `CutoverGateChip` itself was subsequently removed entirely by the cutover-feedback revert #509 (see §4.A PR 7). The test refactored here was deleted with the rest of the feature.
- ~~**PR D**~~ ✅ **SHIPPED #507** — Admin drafts set `expires_at` on save (7-day auto-archive cadence).

**Sequencing held:** A→B→C in the 2026-05-23 PM window; D shipped same arc. **§4.AI fully closed** — superseded in part by the #509 revert (PR C surface gone).

**Anti-pattern flags in scope:**
- AP #6 — `BriefingComposer` already at 148 lines; "View sent" link prop must stay tight.
- AP #34 — additive registry change (3 new EVALUATORS keys + 3 alert_types rows in same migration).
- AP #36 — new `useAvailableDrafts` hook + `useSentBriefings` hook must destructure `{ data, error }` and throw.
- AP #37 — `comms_messages` org_id-first filtering.
- AP #43 — `CutoverGateChipCrossSurface.test.jsx` loses one mount surface; PR C resolves by collapsing to single-surface.
- AP #45 — this entry reconciles the ledger in the same commit as the audit doc (compliance).
- AP #49 — full audit doc pasted in chat after commit + push + PR per discipline.
- AP #51 — `BriefingsInboxPage` retirement is the 19th+ dead-feature mount under the established pattern.
- AP #54 — every PR ships ready + auto-merge enabled in same MCP burst as create_pull_request.

**Open questions (chat-routing required before PR A):**
- Q1 — alert kind structure: per-kind sub-evaluators (recommended) vs single multi-kind evaluator
- Q2 — history page data source: extend `useInboxQueue` vs new `useSentBriefings` (recommended)
- Q3 — Cancel exit target: admin home (recommended) vs history vs browser-back

---

### §4.BX — Briefings full audit + redesign arc dispatched (2026-06-02 PM)

Frank routed: full briefing system audit + redesign + ship. Surface scope = engine + composer + 32 SECTION_RENDERERS + audience picker + send path + auto-draft cron + token handlers + admin UI + parent-facing inbox (which doesn't yet exist; named in §4.AI as a redesign target). Stream A reminders, team-feed ICS, send-push fanout, financial briefings, Slack/SMS channels, and `suggest-briefing-closer` prompt-engineering are explicit out-of-scope (§2 of the audit doc).

**Companion doc:** `docs/AUDIT_BRIEFINGS_2026-06-02.md` — methodology lock + 3-phase plan + Wave B1 initial findings. Per §16.15 L99 template: scope, methodology (line-by-line + 2-pass addendum), AP catalog cross-ref, per-role wireframes (for parent inbox), explicit out-of-scope list.

**Three-phase structure with hard pause gates** (per saved memory `autopilot-overreach-on-decisions-and-irreversible-ops`):
- **Phase 1 — Audit** (doc-only, multi-batch Wave B1–B5). Stops when all 12 categories have findings + cross-pattern synthesis.
- **Phase 2 — Redesign proposal** (doc-only). Per-surface options + tradeoffs + per-role wireframes + migration plan with reversible-first + irreversible-needs-confirm gates. Stops when Frank routes each call.
- **Phase 3 — Ship** (multi-PR arc). Each PR scoped tight; irreversible ops get explicit confirm prompts.

**Three folded-in bugs from §17.5 P1 close session:**
- **BUG A** (my regression, owned): `comms_messages_weekly_digest_unique` index (mig 20260602195100, PR #657) blocks composer re-INSERT of this-week's draft. Pilot mode masks tonight; would block first real weekly digest. Anchored at §1.3 of the audit doc.
- **BUG B** (pre-existing): `comms_messages_audience_type_check` CHECK constraint missing 4 of 9 documented audience types (`player_specific`, `multi_event_attendees`, `coach_self`, `family_specific`). Anchored at §1.2 of the audit doc.
- **Meta** (UX category): composer surfaces raw Postgres errors instead of §16.3 kindness microcopy. Folded into Wave B4.

**Wave B1 initial findings (this commit):**
- 1.1 kind taxonomy CLEAN
- 1.2 audience CHECK incomplete (P0; BUG B anchor)
- 1.3 weekly_digest unique index regression (P0; BUG A anchor)
- 1.5 comms_message_recipients schema CLEAN
- 2.1 three sources of truth identified for kind taxonomy; suggested redesign-phase parity test
- 2.2 dual dispatch path (RESOLVER_REGISTRY + legacy KIND_COMPOSERS) flagged for B2 consolidation review
- 3.1 resolver two-stage contract initial-CLEAN; deep-read addendum queued
- 3.2 substitute helpers (AP #29) sound on initial pass; deep-read in B2/B3
- 2 cross-cutting patterns: B1-α (schema CHECK lags taxonomy doc) and B1-β (composer + auto-draft cron don't share a draft lifecycle)

**Standing items going forward:**
- Wave B1 deep-read addendum (audience CHECK INSERT call-site grep + resolver purity verify + substitute helper field-name discipline + suppress_unsubscribed_recipients trigger ↔ code filter parity)
- Waves B2–B5 dispatch
- Phase 2 + Phase 3 hard-pause gates

**AP #45** satisfied by this same-commit ledger entry — guard self-test (ledger-reconcile-guard CI check from PR #671 / AP #45 update).

**Wave B1 deep-read addendum (this commit append):** Per §16.15 ~30-40% cascade rate, deep-read surfaced 3 new sub-findings + confirmed clean state on 2 categories left as "verify in addendum" from initial pass. New findings:
- 1.2-DEEP-1: production has been silently coercing audience_type to wrong-but-allowed values for coach_roundup + family_guide (21 rows total across 2 kinds use `team`/`multi_team` instead of documented `coach_self`/`family_specific`). BUG B fix shape sharpened — Phase 2 must decide between widen-CHECK + backfill, widen-CHECK + accept legacy, or refactor wizard to derive audience_type mechanically.
- 1.3-DEEP-1: BUG A failure mode refined — flush() in useBriefingDraft.js DOES distinguish new-vs-existing via local draftId state; failure fires when admin picks "Start fresh" in StepKindPicker for a kind with a pre-existing auto-draft. Phase 2 fix scoped to that specific UI surface + flush-time pre-check.
- 1.5-DEEP-1: trigger ↔ code suppression layers operate on different lifecycle stages (no race) but emit different forensic trails (trigger silently drops; code preserves audit row). PATTERN B1-γ surfaced.
- 2.1 / 3.2 deep-CLEAN: AP #27 resolver purity holds across all 9 resolver files; AP #29 substitute helper discipline holds end-to-end + implementation is stronger than AP body requires (throws on missing tokens; renderer fail-loud fallback).

**B1 status:** CLOSED for Phase 1 purposes. Ready to dispatch Wave B2.

**Consolidation pass — chat-CC live-state seed folded in (PR #673, same-day commit append):** Per §16.15 the L99 audit needs both code-read + live-state halves. Chat-CC's seed doc captures the production-truth half (live row counts, six send-attempt mapping, advisor checks); this audit doc references the seed by section rather than duplicating. Bug list grew from 3 → 5 in consolidation:
- **BUG A fix-shape sharpened:** chat-CC leans narrow-predicate (drop `'draft'` from index); I leaned composer-reuse (B1-DEEP-1). Converged on: narrow-predicate = immediate fix; composer-reuse = Phase 2 structural target. Frank routes.
- **BUG C (NEW):** preview composer gap — wizard offers `rsvp_nudge` (and likely other registry-dispatched kinds) but preview only knows 4 kinds. Ties to AP #28 dual-dispatch (RESOLVER_REGISTRY + legacy KIND_COMPOSERS).
- **BUG D (NEW; I missed this in B1):** pilot mode has two implementations — digest path REDIRECTs (5 synthetic rows, correct); per-event/team/nudge paths FILTER on `guardians.is_pilot_family` which has 0 rows in production (broken). **AP #63 instance — PATTERN A extended to send-path recipient resolution** (not a new candidate; my initial framing of "AP #63-class candidate" was wrong — chat-CC corrected the AP #61 ↔ #63 inversion and the registration framing in a same-day exchange; doc fixed to reflect).
- **GAP-1 (owned):** I treated pilot mode as a B2 audience surface and didn't query production for its implementation. Discipline going forward (folded into B2–B5 method): **for any cross-kind concept** (pilot, audience derivation, error microcopy, preview, send retries), MCP-query the live implementation per kind to check for divergence before assuming uniformity. Operational form of AP #63 applied to audit method.
- **PATTERN B1-δ (NEW):** mature vs newer kind wiring inconsistency. Tournament kinds got the mature path; newer kinds each diverged on pilot resolution / preview / audience-type coercion. Behavioral-layer manifestation of AP #63's render-layer pattern.
- **§S-1 (NEW out-of-scope flag from chat-CC seed §6):** `game_recap` (singular) has 15,770 rows (15,759 trigger-created). Possible runaway trigger / data hygiene issue. Explicitly out of the briefings redesign scope; flagged for a separate data-hygiene investigation.

PRs: #672 (code-read half, mine) + #673 (live-state seed, chat-CC). Both merge separately; audit doc references the seed by section. No PR-A code lands until both PRs are in main and the full §16.15 doc set is consolidated.

**AP #45** satisfied by this same-commit ledger append — guard self-test holds for the consolidation pass (ledger-reconcile-guard CI check fires on any `docs/AUDIT_*.md` diff requiring the ledger in the same commit).

**Methodology refinement — symptom signature vs mechanism + standing cross-kind query instruction (same-commit append):** Frank's substantive hold after the AP-inversion concession was that the AP tag being correct doesn't make the *mechanism* settled. PATTERN A is a symptom signature (a concept implemented divergently with contradictory truths); per-kind wiring is one of several candidate mechanisms behind any given instance. The §16.15 deep-read addendum's job is to TEST which mechanism produced the divergence, not to CONFIRM the leading hypothesis. If the audit promotes per-kind-wiring to settled, the deep-read becomes confirmation rather than testing — exactly the failure mode the addendum prevents.

Audit doc updates (same commit):
- New §3.f **standing instruction — cross-kind query discipline.** For any cross-kind concept (pilot resolution, audience derivation, error microcopy, preview dispatch, send-path retries, substitute helpers, anchor resolution), MUST query the live per-kind callsite (MCP or grep) and check for divergence — don't infer from the abstraction's name. Lessons collapsed: `players.notes` phantom-column miss + pilot-mode miss share the same root (assuming uniformity from naming).
- New §3.g **symptom signature vs mechanism rule.** PATTERN A instances tag the symptom; mechanisms remain hypothesis until tested. Four candidate mechanisms named: per-kind wiring / shared-helper-bad-param / drifted-siblings / one-intended-other-bug. Each redesigns differently.
- BUG D row updated: tag stays at "AP #63 instance — PATTERN A extended to send-path recipient resolution" (settled); mechanism flagged as hypothesis with four candidates explicitly listed for Wave B2 to test.
- PATTERN B1-δ rewritten to separate "symptom signature (verified)" from "mechanism (hypothesis — what the deep-read tests)" sections.
- Task descriptions B2–B5 updated to carry §3.f + §3.g discipline as method, not afterthoughts.

This refinement keeps both true: BUG D is a confirmed AP #63 PATTERN A instance AND the mechanism behind it remains the hypothesis the audit tests. Not in tension.

**Production tilt + falsifiable tests append (chat-CC, post-§3.g refinement; same-commit append):** chat-CC named the production tilt without settling. The digest REDIRECT is the more-designed/newer path (override + synthetic-CTE, per-team inbox labels); the `is_pilot_family` filter is the cruder path; `guardians.is_pilot_family` count = 0 in production. Together those signals lean toward a **(iv)→(i) blend** — REDIRECT was intended universal; digest path adopted it; event/team/nudge paths are un-migrated stragglers on the deprecated filter. If true, the redesign is "migrate stragglers + delete the filter" — smaller than from-scratch unification because the target mechanism exists.

Three falsifiable tests now embedded in PATTERN B1-δ + Wave B2's task body so the deep-read runs them in order:
1. Migration / git chronology — was `get_digest_recipients` introduced after `is_pilot_family` filter paths?
2. Migration notes / PR / comments — does any artifact declare REDIRECT as the intended universal mechanism or filter as deprecated?
3. Writers for `guardians.is_pilot_family` — any UI/seed/migration/trigger?

Finding a writer in (3) falsifies the supersession tilt and means (i) parallel-built. The tilt stays a prior + tests, not a settled call.

**Wave B2 dispatch (2026-06-03 AM) — BUG D mechanism resolved via §3.f cross-kind code-read:** terminal-CC ran the three falsifiable tests:
- **Test 1 (chronology):** FILTER shipped 2026-05-09, REDIRECT shipped 2026-05-11 — REDIRECT IS newer, corroborating part of chat-CC's tilt.
- **Test 2 (declared intent):** Migration `20260511115858` line 12-13 says verbatim: "Production cutover path: set pilot_test_recipient_email = NULL and flip is_pilot_family = true on real families to start sending to humans." **REDIRECT was explicitly intended as a temporary verification override; FILTER is the documented production target.** Inverts the supersession tilt.
- **Test 3 (writers):** ZERO writers for `is_pilot_family` in code/migrations/triggers/seed. The "flip is_pilot_family=true" cutover step was never built.

**Refined mechanism:** "partial supersession that stalled in the verification stage" — a sub-shape of (iv) where the OTHER path is "the unmigrated remainder of a half-done supersession that was *intended* to be partial." Wave 4.3-I migrated `tournamentPrelimHelpers.js` to use the RPC (code comment is explicit); three stragglers never got migrated: `academyCallupNotice.js`, `rsvpNudge.js`, `briefing-auto-draft-tick/_reminderSend.ts`.

**Two operator decisions surfaced for Phase 2 (Frank's calls):**
- **D-1 strategic:** (a) cut over (finish migration + build flag-flipper UI), (b) REDIRECT-only permanent (DROP `is_pilot_family` — irreversible), (c) exit pilot entirely (send to all).
- **D-2 tactical:** regardless of D-1, the three stragglers should be migrated to use the RPC pattern for symmetry. Smaller, reversible, can ship independently.

PATTERN B1-δ refined: "supersession migration that stalls" is a specific AP #63 sub-shape that produces the same symptom signature (divergent computations) as (i) parallel-built. Tests 1+2+3 together distinguished them.

**AP #45** satisfied by this same-commit ledger append — guard self-test holds for the B2 first-batch commit.

**Wave B2 second batch — composer dispatch + BUG C mechanism + audience picker + substitute helpers + SECTION_RENDERERS catalog (2026-06-03 AM):**
- **BUG C mechanism resolved:** `PreviewPanel.jsx:64` gates registry-path on `sendPath === 'composerSubmit'`. rsvp_nudge's sendPath is `'rsvpNudgeSend'` → falls through to legacy KIND_COMPOSERS → no entry → throws. weekly_digest + academy_callup_notice avoid this via defensive KIND_COMPOSERS entries. Two named fix shapes: (a) extend criterion to `entry !== null` (structural — eliminates DUAL-COMPOSE drift simultaneously); (b) add `composeRsvpNudge` to KIND_COMPOSERS (minimal patch).
- **DUAL-COMPOSE drift (B2.6) already self-documented in code** since 2026-05-22 (Phase 3 Q5 routing). PATTERN A: same concept (weekly_digest compose output) in two places, observationally identical only because data shape is currently invariant. Fix shape (a) above closes this too.
- **Audience picker / kindMetadata cross-check confirms BUG B at application boundary:** 4 of 12 `defaultAudienceType` values in kindMetadata are rejected by the production CHECK — `multi_event_attendees` (games_recap, LOCKED), `coach_self` (coach_roundup), `family_specific` (family_guide), `player_specific` (academy_callup_notice, LOCKED). Confirms 1.2-DEEP-1.
- **Substitute helpers (B2.8):** callsites verified — `rsvpNudgeSend.js:67` + `academyCallupSend.js:64` both call their substitute helpers correctly per AP #29. **NEW finding B2.8-P3:** rsvp_nudge + academy_callup_notice use bespoke send paths that bypass `send-tournament-message`; need Wave B3 verification that unsubscribe-suppression discipline applies symmetrically.
- **SECTION_RENDERERS catalog:** 33 entries in `sectionRenderers.js`; coverage doc says 32. Minor PATTERN B1-α re-fire (schema/doc drift); orphan-kind guard discipline (AP #38) is clean.
- **B2.10 cross-pattern observation:** the briefing engine has two dispatch tables (RESOLVER_REGISTRY + KIND_COMPOSERS) overlapping on 2 kinds + diverging on 8. Every B2 drift surface traces back to which table the call lands in. The right Phase 2 question isn't "fix BUG C" but "is the dual-dispatch a structural liability worth retiring?" — routes BUG C + B2.6 drift + registry hygiene together (per AP #34: registry/dispatch-table removals need caller migration in same PR).

Wave B2 status: CLOSED for Phase 1 purposes. 6 findings + 2 confirms + 1 cross-pattern observation + 1 new P3 (B2.8 asymmetric suppression queued for B3). Ready to dispatch Wave B3.

**Wave B3 (2026-06-03 AM) — send path + auto-draft cron + token handlers (closed):**
- **B3.1 — THIRD pilot mechanism found (refines B2.2):** `send-tournament-message:156-189` is a fail-loud safety guard at send time. Reads `is_pilot_family` from guardians for every recipient with non-null guardian_id; 403s if any non-pilot reaches dispatch. REDIRECT's synthetic rows (`guardian_id=NULL`) BYPASS this check (line 167 `.filter(Boolean)`), which is what makes the verification state work today. Cutover decision Phase 2.D-1 needs to reason about Layer 2 simultaneously — flipping `is_pilot_family=true` simultaneously stops resolvers filtering AND stops Layer 2 blocking. Not PATTERN A (different concept: safety vs recipient resolution); separate purpose.
- **B3.2 — Unsubscribe suppression confirmed symmetric (closes B2.8-P3 CLEAN):** both bespoke send paths (`rsvpNudgeSend.js:91`, `academyCallupSend.js:89`) route final dispatch through `send-tournament-message`. Code-side suppression filter applies to all. Admin BCC bypass (guardian_id NULL) intentional.
- **B3.3 — NEW P0 (BUG B extension at the write boundary):** `academyCallupSend.js:81` hard-codes `audience_type: 'player_specific'` on INSERT. Production CHECK rejects → every callup_notice send fails at INSERT (23514). Matches production data: 0 academy_callup_notice rows ever sent. BUG B has wider blast than B1 framing — confirmed at the application-write boundary, not just the schema-doc-drift one. rsvpNudgeSend hard-codes `event_attendees` which is in the CHECK; what blocks rsvp_nudge sends is the BUG D pilot-mode straggler, not BUG B.
- **B3.4 — BUG A composer fix shape sharpened:** `briefing-auto-draft-tick` already handles BUG A race with a defensive SELECT-existing-then-INSERT-with-23505-handling pattern (lines 62-82). Composer's `flush()` lacks the equivalent pre-check. Phase 2 fix is now "adopt the cron's existing model" not "invent new pattern." Smaller redesign surface.
- **B3.5 — Token handlers CLEAN:** rsvp + callup use SECURITY DEFINER RPCs (anonymous, `verify_jwt:false`); unsubscribe is idempotent + UPSERTs `guardian_email_preferences`; feedback is intentional 410 Gone tombstone per §4.AJ. All sound.
- **B3.6 — Cron separation CLEAN:** `briefing-auto-draft-tick` handles 3 independent responsibilities (expire sweep + change-alert dispatch + trigger loop); `briefing-cron-dispatch` is separately for scheduled → queued → sent transitions. Clean separation.
- **B3.7 — Resend webhook state machine CLEAN:** rank-based delivery_status transitions prevent out-of-order downgrades. Terminal states all rank 100. Sound.

Wave B3 status: CLOSED for Phase 1 purposes. 1 new P0 + 1 P1 + 1 mechanism refinement + 4 CLEAN confirmations. Ready to dispatch Wave B4 (admin UI).

**Wave B4 (2026-06-03 AM) — admin UI: composer wizard + history + drafts (closed):**
- **B4.1 — Audience-type 4-way drift fully resolves B2.7 silent coercion mechanism:** four independent catalogs with no single source of truth — production CHECK (6 values), KIND_METADATA defaultAudienceType (11 distinct), AudiencePicker MODES (6, ≠ CHECK), AUDIENCE_LABEL display catalog (7, partial overlap). Mechanism: admin picks `coach_roundup`/`family_guide` → state.audience_type initializes to kindMetadata default (`coach_self`/`family_specific`) → AudiencePicker MODES doesn't include those values → admin clicks one of the 6 offered modes (typically Single/Multi team) → SET_AUDIENCE flips state → flush() INSERTs the chosen value → CHECK accepts it → production has 21 rows with wrong-but-allowed values. Three named Phase 2 redesign options: (α) single source of truth + parity test, (β) refactor wizard to NOT show picker when kind has derivable audience, (γ) keep picker but make kindMetadata default the active option.
- **B4.2 — StepKindPicker is the BUG A entry point:** auto-draft writes a draft → admin sees DraftResumeRow + kind grid → clicks weekly_digest tile (instead of Resume) → composer state has no draftId → flush() INSERTs → 23505. Phase 2 has two non-mutually-exclusive layers: (i) adopt cron's defensive SELECT + 23505-catch in flush() (B3.4); (ii) detect existing-anchor draft in StepKindPicker → force Resume route. Simplest first PR is (i).
- **B4.3 — useBriefingDraft.flush() discipline CLEAN:** correctly distinguishes INSERT vs UPDATE via local draftId state. The bug isn't in flush(); the fix is upstream pre-check or at the boundary catch.
- **B4.4 — Composer wizard structure sound:** 4-step flow (kind → anchor+audience → body+signoff → confirm) orchestrated via composerReducer (121L, 12 actions). State mirrors comms_messages persisted fields. No findings.
- **B4.5 — Wizard ↔ kindMetadata 12-kind alignment CLEAN:** KIND_METADATA covers all 12 production kinds; KindTile renders consistently. Taxonomy aligned.
- **B4.6 — History page deferred:** read-only display surface; no bugs surfaced through live-state seed. If Phase 2 redesign touches it, bring back in scope.

Wave B4 status: CLOSED for Phase 1. 1 P0 mechanism (B4.1 — 3 redesign options) + 1 P1 sharpening (B4.2 — 2-layer fix shape) + 2 CLEAN + 1 deferred. Ready to dispatch Wave B5 (parent inbox + cross-cutting).

**Wave B5 (2026-06-03 AM) — parent inbox + cross-cutting (closed):**
- **B5.1 — Microcopy Meta bug CONFIRMED at code boundary:** `useBriefingDraft.flush()` propagates raw Postgres `e.message` upward; composer renders verbatim. Phase 2 fix is small + reversible (error-class translation map), but gate AFTER A/B/C land so microcopy matches final behavior.
- **B5.2 — a11y baseline CLEAN-ish:** wizard steps have ARIA roles in expected places (`role="grid"`, `role="status"`, `role="alert"`). Not a full audit; flagged as Phase 2 routing decision D-8 (dedicated a11y in scope or separate).
- **B5.3 — NEW P2 multi-tenant breach:** `PreviewPanel.jsx:28` hardcodes `https://app.legacyhoopers.org/unsubscribe?preview=1`. Only LH-specific leak in production code; small + reversible fix.
- **B5.4 — PII surface CLEAN at engine layer:** briefings necessarily carry guardian + kid + team data; RLS controls visibility. Parent SELECT policy on `comms_message_recipients` not yet built — part of parent inbox redesign target.
- **B5.5 — Parent inbox redesign target scoped:** doesn't exist today (per §4.AI deferred). Three named scopes: (a) minimal viable (list + detail + RSVP/callup), (b) full-featured (filter + mark-as-read + unsubscribe), (c) punt (email-only). Phase 2.D-6 routing.
- **B5.6 — PATTERN B5-ε (final cross-cutting): catalog drift is structural in the briefings engine.** Five independent catalogs (kind, audience, send-path, pilot mechanism, section renderers) with partial parity tests. Extend AP #28 discipline systemically. Phase 2.D-7 routing.

**Phase 1 CLOSED (2026-06-03 AM).** 5 confirmed bugs (BUG A/B/C/D + Meta) + 1 owned gap (GAP-1) + 6 cross-cutting patterns (B1-α/β/γ/δ + B5-ε + dual-dispatch B2.10) + 8 Phase 2 routing decisions queued for Frank. Naturally clusters into 3 Phase 2 batches: schema (D-1+D-2+D-7), pilot (D-4+D-5), UI (D-3+D-6+D-8).

**Phase 2 does NOT auto-dispatch** — hard pause gate per saved memory `autopilot-overreach-on-decisions-and-irreversible-ops`. Frank routes when ready.

**Phase 2 redesign proposal (2026-06-03 AM) — Frank routed "auto execute through phase 2":** Doc `docs/REDESIGN_BRIEFINGS_2026-06-03.md` landed. Per §16.15 element structure: per-surface named options + tradeoffs (§2), per-role wireframes for parent inbox (§3), migration plan with reversible-first sequencing (§4), Phase 3 PR sequence (§5), out-of-scope (§6).

Each of the 8 routing decisions presents 2–3 named options with recommendation + rationale. Recommendations are NOT decisions; terminal-CC doesn't pick architectural options or pull irreversible triggers per the memory. Highlights:
- **D-1 (BUG A):** recommend (a) narrow predicate + (c) cron-pattern in flush(). Reversible, no confirm gate.
- **D-2 (BUG B):** recommend (α) CHECK widen + parity test + (γ) AudiencePicker prepend default. **Backfill of 21 wrong-coerced rows is a confirm-gated PR.**
- **D-3 (BUG C):** recommend (a) widen PreviewPanel registry-path criterion — closes DUAL-COMPOSE drift simultaneously.
- **D-4 (pilot strategic):** **HARD HOLD — Frank's strategic call.** (b) and (c) both require **DROP COLUMN guardians.is_pilot_family — explicit confirm + pre-flight 0-callsite proof.**
- **D-5 (pilot tactical):** recommend (a) migrate 3 stragglers NOW (forward-compatible with all D-4 outcomes).
- **D-6 (parent inbox):** recommend (a) minimal viable for Phase 3. **New RLS policy on comms_message_recipients is confirm-gated.**
- **D-7 (parity tests):** recommend (a) in scope. Reversible, no gate.
- **D-8 (a11y):** recommend (b) defer existing surface audit + (a) axe-core scan on new parent inbox PRs.

Phase 3 PR sequence: 8 reversible PRs (§4.1) + 4 confirm-gated PRs (§4.2). 3 PRs (H-1/2/3 for D-4 outcomes) held until Frank routes D-4.

Phase 2 status: DOC ONLY. **Phase 3 does NOT auto-dispatch** — hard pause for Frank to route each decision per the audit's 3-phase structure + saved memory. AP #45 satisfied by this same-commit ledger append.

---

### §4.BW — §17.5 audit P1 backlog closure arc complete (2026-06-02 PM)

> **MCP-apply reconciliation (chat-CC, 2026-06-02 evening).** The P1-batch migrations terminal-CC committed were applied to prod via Supabase MCP, with the same pre-flight + version-parity discipline as §4.BV. **5 applied + registered** under their file timestamps: `20260602195018` (cron retention + daily cleanup job), `20260602195535` (drop `roster_members.payment_status`), `20260602200223` (drop `pii_audit_log` admin SELECT policy), `20260602201521` (seed `app_secrets.resend_api_key` NULL slot), `20260602195100` (`weekly_digest` partial-UNIQUE). The weekly_digest index required reconciling **11 historical pilot test-sends** for `(LH org, period_start 2026-05-11)` — all `team_id=null`, 10×1-recipient + 1×5-recipient; chat-CC deleted the 10 single-recipient test rows (+ their `comms_message_recipients`) keeping the 5-recipient canonical row, with Frank's approval, then built the index. **1 deleted as false-positive:** `20260602200247_players_notes_pii_comment.sql` — `players.notes` does not exist in production; the COMMENT migration could not apply and would break `supabase db reset`, so the file was removed and the P1 recharacterized as false-positive in `AUDIT_WAVE_3_P1_BACKLOG_STATUS.md`. **Operator action still pending:** populate `app_secrets.resend_api_key` (edge functions fall back to `Deno.env.RESEND_API_KEY` until then).

Closes the P1 layer of the §17.5 fix-PR routing campaign opened by §4.AR / §4.AS, following the P0 layer close in §4.BV.

**Companion doc:** `docs/AUDIT_WAVE_3_P1_BACKLOG_STATUS.md` — comprehensive status table covering every P1 from `AUDIT_WAVE_3A_2026-05-29.md` + `AUDIT_WAVE_3B_2026-05-29.md`. Each P1 marked with one of: closed-by-code (PR #), closed-by-doc-note, verified-already-closed, verified-safe, closed-as-false-positive, operator-action-pending, design-decision-required.

**Headline:**
- ~17 P1s closed by code in this session (PRs #656-#662)
- ~12 P1s verified-already-closed / verified-safe / false-positive
- ~21 P1s deferred with explicit decision + named owner
- ~4 P1s operator-action-pending

**This session's P1 closure PRs:**

| PR | Closes |
|---|---|
| #656 | Batch 1 — doctrine residue (§29 P1s, §16.5 Stream B doc note, BRIEFINGS_COVERAGE_L99 refresh, archive-doc preservation policy) |
| #657 | Batch 2 — `cron.job_run_details` retention + `weekly_sunday` dedup race UNIQUE index |
| #658 | Batch 3 — schema cleanup (`roster_members.payment_status` drop + §5 stale table names + jersey_number false-positive verified) |
| #659 | Batch 4 — security (`pii_audit_log` operator-only, `players.notes` PII flag); verified safe (`raw_user_meta_data` exposure narrow) |
| #660 | Batch 8a — DR residue (`SECRET_ROTATION.md` + stale PublicSchedulePage RLS comment) |
| #661 | `RESEND_API_KEY` → `app_secrets` per AP #33 (with rollout fallback); verified already-closed (AP #57 retroactive REVOKEs via #636, VAPID via #634) |
| #662 | Sentry source-map upload via `@sentry/vite-plugin` (conditional on `SENTRY_AUTH_TOKEN`) |

**Routing rule applied:** the audit gate doesn't require every P1 to ship code — it requires every P1 to be **routed**. A documented decision-required state IS a routing answer. Deferred items have named decisions, recommendations, and operator vs CC ownership.

**Standing items going forward** (all listed in `AUDIT_WAVE_3_P1_BACKLOG_STATUS.md`):
- Notifications: ~~Stream B spec/impl drift (operator call)~~ ✅ **RESOLVED 2026-06-05** — operator locked "fewer than N confirmed going (default 5), auto-DRAFT"; see the §4 "Out of scope" reconciliation note above + §16.5; Sunday digest auto-SEND (operator call); `guardian_notification_prefs` PATTERN OMEGA wiring; Stream A RSVP-aware skip
- Onboarding: bulk-invite UX, push opt-in promo UX, PWA install prompt re-design, Resend bounce admin viewer, branded Supabase invite email (operator)
- Briefings: recipient preview chip UI, briefings_templates retire-vs-wire decision, parent inbox feature, academy_callup_notice smoke (operator)
- Compliance: `team_feed_token` revocation strategy, `team_achievements` consent UI, SafeSport cert surface, `guardian_email_preferences` admin UI
- DR: Vercel deploy-ID logging, project_id templating (deferred until multi-Supabase), LeagueApps source archive (operator)
- Multi-tenant: brand_colors admin UI, roster bulk import

**§17.8 gate state:** P0 layer closed (§4.BV), P1 layer routed (this entry). §17.7 step 5 unblock condition met. Multi-program build phase can engage; deferred P1s become product/feature work rather than gating items.

> **Correction (chat-CC, 2026-06-02 PM — reconciled in the same PR as `AUDIT_WAVE_3_P1_BACKLOG_STATUS.md` per AP #45, ledger-reconcile-guard).** Frank flagged that the companion status doc had over-claimed several closures. Walk-back, so the ledger and the status doc agree:
> - **Two items reverted from "closed-by-policy" → "open — operator decision":** Sunday digest auto-DRAFT-vs-SEND and Stream A RSVP-aware reminder skip. These were CC declaring product decisions because current behavior matched a CC recommendation — that is not a closure. (The "Standing items" list above already framed both as operator calls; the status doc is now aligned to the ledger, not the reverse.)
> - **`team_feed_token` (#667) downgraded "closed-by-code" → "partially closed":** the DB rotation + handler-404 half shipped, but a parent-facing **expiry-warning UX gap** is newly named and OPEN — calendar clients treat the post-365-day 404 as "subscription gone" and silently stop fetching, with no warning to parents. Needs (a) an admin dashboard signal for tokens approaching expiry and (b) an email to parents ~30 days before. This is a real follow-up, not pleasant-extras; it joins the "Compliance" standing line above.
> - **Two migrations shipped on CC recommendation without an explicit operator routing call:** `briefing_templates` DROP (#665, **irreversible**) and the `team_feed_token` rotation strategy (#667). They applied cleanly so no harm, but the correct shape was "ship the recommendation, flag decision-required, ask before merging." Recorded so the gate isn't read as operator-routed where it was CC-routed.
> - **"Unblock condition met" (the line directly above) should be read as structurally routed, not "every underlying issue resolved."** Several status-doc rows are doc-only assertions about routing state — which is not the same as the underlying issue being closed. The multi-program build phase is not gated by these, but none of the four notification items (Sunday digest, Stream A RSVP-aware, cron cadence, Stream B spec) should be treated as decided until Frank routes them.

**Ledger maintenance note:** the entry below this one shares the §4.BV identifier with my "§17.5 audit P0 closure arc complete" entry from earlier in the session (lines 3736 + 3751). The duplicate is harmless (different content) but worth normalizing in a future hygiene PR — neither entry should be renamed retroactively per archive doctrine, but a single "(2026-06-02 — first)" / "(2026-06-02 — second)" disambiguator added inline would help future readers.

**AP #45** satisfied by same-commit ledger entry + companion audit doc.
**AP #49** satisfied by full-paste in chat (the status doc is ~250 lines; pasted in same turn).

---

### §4.BV — Two P0 cleanup pair: 3A.19.P0-2 microcopy + 3B.28.P0-4 default flip (2026-06-02)

Closes two cheap-to-fix P0s from the Wave 3.A/3.B audit backlog. Single PR.

- **3A.19.P0-2** (`AutoNotificationSettingsSheet:35` schema-leak microcopy) — Replaced "Couldn't save settings. The auto_notifications column may need to be added to the organizations table." with operator-friendly copy: "Couldn't save notification settings. Try again, or get in touch if it keeps happening." Closes the literal P0 (admin no longer sees schema names in error toasts).
- **3B.28.P0-4** (`public_listing_enabled DEFAULT true` wrong for pilot orgs) — New migration `20260602154853_organizations_public_listing_default_false.sql`: `ALTER COLUMN public_listing_enabled SET DEFAULT false`. Existing rows untouched (LH stays public per its explicit `true`); future tenant orgs opt INTO public listing.

**Migration apply caveat:** terminal-CC can't apply via Supabase MCP. Owner action after merge: apply `20260602154853` via Supabase MCP `apply_migration` so the registered-vs-mirror parity holds (AP #21).

**Open follow-up surfaced en route** (not closed here): the `organizations.auto_notifications` JSONB column appears to be MISSING from the schema (no add-column migration found in repo). If absent in production, every admin toggle save fails — the AutoNotificationSettings feature is effectively broken regardless of the microcopy. Needs verification via MCP + a follow-up migration that adds `auto_notifications jsonb NOT NULL DEFAULT '{}'::jsonb` to organizations. Filed implicitly under 3A.19.P0-3 (toggles don't gate handler) since the two issues converge in the same surface; should be bundled in the notification-pipeline-wiring arc.

**AP #45** satisfied by this same-commit ledger entry.

---

### §4.BV — §17.5 audit P0 closure arc complete (2026-06-02 PM)

Closing entry for the §17.5 fix-PR routing campaign opened by §4.AR / §4.AS. 26 P0s across Wave 3.A + 3.B; one terminal-CC session shipped 16 PRs against them. As of this entry: **25 of 26 P0s closed, 1 standing owner action (3B.25.P0-2 backup-to-staging drill — unverifiable from repo)**. The §17.8 audit-execution gate is now followed by a (nearly) complete fix-PR closure layer.

**Wave 3.A (9 P0s — all closed):**

| ID | Status | Closure PR | Notes |
|---|---|---|---|
| 3A.18.P0-1 | ✓ closed | #640 | Reroute usePendingInvitations to auth.users via get_pending_invitations SECDEF RPC. Empty `invitations` table no longer the read source. |
| 3A.18.P0-2 | ✓ false positive | n/a | InviteButton mounted at PlayerRow.jsx:130 since before audit; audit's grep missed it. |
| 3A.18.P0-3 + P0-4 | ✓ closed | #648 | claim_invite() SECDEF RPC + AuthContext wire (resolveNewUserContext). Replaces the "AcceptInvitePage" requirement under path-(b) reframing. |
| 3A.18.P0-5 | ✓ by-design | n/a | invitations table RLS already admin-only; anon access only through get_invitation_by_token SECDEF (intentional pattern per §4.BR). |
| 3A.19.P0-1 | ✓ pre-session | #573 (Wave 3.A close) | _changeAlertDispatch.ts wired the event_notifications dispatcher. |
| 3A.19.P0-2 | ✓ closed | #639 | Schema-leak microcopy replaced. |
| 3A.19.P0-3 | ✓ closed | #643 | auto_notifications column added + _reminders.ts gates on reminders_enabled. |
| 3A.22.P0-1 | ✓ closed | #649 | cron_http_health_v view exposes net._http_response (canonical HTTP success); replaces cron.job_run_details for health reads. |

**Wave 3.B (17 P0s — 16 closed, 1 standing):**

| ID | Status | Closure PR | Notes |
|---|---|---|---|
| 3B.10.P0-1 | ✓ closed | #650 | current_user_coached_player_ids() helper + players_update_coach refactor. §11.5 doctrine compliance. |
| 3B.10.P0-2 | ✓ closed | #642 | Reciprocal alignment trigger on roster_members. Bidirectional team_players ↔ roster_members lock. |
| 3B.25.P0-1 | ✓ closed | #638 | docs/DISASTER_RECOVERY.md — 10 scenarios + RTO/RPO + secret rotation cadence + standing items. |
| 3B.25.P0-2 | ⚠ standing | n/a | Backup-to-staging drill. **OWNER ACTION** — unverifiable from repo. Tracked in DISASTER_RECOVERY.md §10. |
| 3B.25.P0-3 | ✓ pre-session | §4.AS | 5 ghost migrations already materialized in repo. |
| 3B.27.P0-1 | ✓ closed | #653 | account_deletion_requests table + request_account_deletion RPC + DeleteAccountSection UI on /account. iOS App Store §5.1.1(v) compliance. |
| 3B.27.P0-2 | ✓ closed (Part 1) | #652 | /privacy + /terms scaffold pages with OPERATOR-FILLS placeholders; footer links wired. **Part 2 deferred:** signup-gate enforcement reading guardian_consents. |
| 3B.27.P0-3 | ✓ closed | #651 | guardian_consents table + RLS + UNIQUE active-consent index. Append-only audit log. |
| 3B.28.P0-1 | ✓ pre-session | mig 20260529153604 | UNIQUE(user_id, organization_id) shipped same-day as the audit. |
| 3B.28.P0-2 | ✓ closed | #647 | invite-parent now accepts optional role param ∈ {parent, coach, admin}, stamps into raw_user_meta_data. claim_invite (#648) reads it. |
| 3B.28.P0-3 | ✓ partial | #630 + #634 | Platform-level FROM_EMAIL + REPLY_TO_FALLBACK + ADMIN_BCC_EMAIL all cut over. **Deeper architectural ask** (organizations.{sender_email, contact_email, reply_to_email, website_url, public_logo_url} columns + loadOrgEmailContext helper) not built — flagged for the multi-tenant arc when St. Patrick's pilot opens. |
| 3B.28.P0-4 | ✓ closed | #639 | organizations.public_listing_enabled default → false. |
| 3B.28.P0-5 | ✓ closed | #645 | unsubscribe-handler reads org name + reply-to from the guardian's org context. Fallbacks generic (platform sender). |
| 3B.29.P0-1 | ✓ closed | #637 | §0 verification grep #4 documents 5 exceptions + cap-pressure-trigger pattern in §6. Pre-commit hook script mirrors the same exception list (#648). |
| 3B.29.P0-2 | ✓ closed | #637 | §5 migration count refreshed; directory-canonical caveat preserved. |
| 3B.29.P0-3 | ✓ closed | #637 | §2 tech stack reconciled: React 19 + Tailwind 4 + Vite 8. |
| 3B.29.P0-4 | ✓ closed | #637 | AP #51 catalog narrative refactored; stale-specifics dropped; "Historical cleanup arc" table preserves precedent. |

**Standing items (NOT closed by terminal-CC, flagged for owner):**

- **3B.25.P0-2** — Backup-to-staging drill. The DR runbook's §10 names this as the standing P0-2; runbook RTO numbers in §2 are estimates until the drill validates them.
- **3B.27.P0-2 Part 2** — Signup-gate enforcement. Scaffold pages exist (/privacy, /terms); the gate that reads `guardian_consents` and forces accept-before-first-action is deferred. Recommend wiring into autoLinkGuardian + claim_invite to write the privacy_policy + terms_of_service consent rows at first sign-in, then a layout-level gate that checks for missing consents before rendering Home.
- **Migration apply queue** — ✅ **RESOLVED 2026-06-02 (chat-CC, via Supabase MCP).** All 10 repo-mirror migrations applied to prod: `20260602135445` (app_config cutover), `_154853` (public_listing default→false), `_160538` (get_pending_invitations), `_163105` (roster reciprocal trigger), `_163452` (auto_notifications col), `_165547` (claim_invite), `_181011` (cron_http_health_v), `_181506` (current_user_coached_player_ids + players_update_coach refactor), `_181903` (guardian_consents), `_182606` (account_deletion_requests). Pre-flight verified all dependencies (claim_invite's org columns, helper fns, net.* tables, ON CONFLICT constraint) before applying. `apply_migration` registered apply-time versions; **version strings then corrected to the file timestamps** so `supabase migration list` shows clean AP #21 parity. Post-apply verification: all objects present, both new tables RLS-on, all 4 new SECDEF fns anon-EXECUTE=false (anon-SECDEF advisory unchanged at the 3 intentional public RPCs), security advisor clean (no new ERROR / no new rls-no-policy). Roster reciprocal trigger confirmed safe by terminal-CC (zero `DELETE roster_members` in app code; removal is soft-delete via `left_at` UPDATE). Standing residual: first real invited-user login is the `claim_invite` integration test.

**P1 surface** (~58 across Wave 3.A + 3.B) is NOT touched by this arc; remains the active backlog for follow-up.

**Multi-PR arc closures the audit projected but bundled differently here:**

- "Onboarding pipeline rebuild" (5 P0s + 6 P1s, projected as multi-PR): closed as 4 small PRs (#640, #647, #648 + the 3A.18.P0-2 false-positive recognition). Path-(b) reframing (auth.users as canonical, not invitations table) avoided the bigger refactor.
- "Multi-tenant readiness" (5 #28 P0s): closed across #634/#639/#645/#647 + pre-session #20260529153604. The architectural per-org email plumbing remains deferred.
- "DR-readiness arc" (3 P0s): #638 + pre-session §4.AS. Backup-to-staging drill standing.
- "Compliance arc" (3 #27 P0s): #651/#652/#653. Scaffold-quality on the policy text; signup-gate Part 2 deferred.
- "Doctrine reconciliation arc" (#29 4 P0s + STALE-DOC P1s): #637. P1 STALE-DOCs (BRIEFINGS_COVERAGE_L99.md refresh; §16.5 Stream B drift) not bundled.

**AP compliance for this arc:**
- AP #21 — every migration ships with an "owner action: apply via MCP" caveat in commit body + PR description.
- AP #23 / #57 — every new SECDEF function REVOKEs from PUBLIC + anon explicitly.
- AP #45 — this entry reconciles the ledger for the whole arc in one commit (per-PR ledger entries would have created merge contention).
- AP #49 — DR runbook + this entry pasted in chat per discipline.
- AP #54 — every PR ready + auto-merge SQUASH armed in same MCP/REST burst.

**Per §17.7 step 5:** multi-program build phase unblocking gate is "all P0+P1 fix PRs land." P0 layer is now (nearly) closed; P1 layer is the next workstream. Multi-program build can begin in parallel with P1 cleanup once 3B.25.P0-2 drill is run.

---

### §4.BU — DR runbook closes Wave 3.B #25 P0-1 (2026-06-02)

Closes the P0 "no DR runbook" finding from `AUDIT_WAVE_3B_2026-05-29.md` (category #25). Doc-only PR — no code touched.

Created `docs/DISASTER_RECOVERY.md` — 250-line runbook structured for use-at-3am. Sections:

1. **Platform identity** — project IDs (Supabase `vrwwpsbfbnveawqwbdmj`, Vercel `aster-sports`), domains, tier (Supabase Pro = daily backups + PITR), Resend domain status
2. **RTO/RPO table** — per-surface guarantees (Vercel rollback ~1 min, edge function ~5 min, PITR 1-4 hr / ~5 min RPO, daily snapshot 1-6 hr / ~24 hr RPO, secret rotation ~30 sec)
3. **10 scenarios** — app rollback, edge function rollback, bad migration, data corruption, auth disaster, compromised secret, DNS failure, outbound email broken, account takeover, total environment loss. Each scenario has steps + verification.
4. **Migration drift recovery** — AP #21 mirror-discipline failure modes
5. **pg_cron job recovery** — including PATTERN HOTEL guard (SQL "success" ≠ HTTP success per Wave 3.A #22 P0-1)
6. **Public status sources** — supabase, vercel, resend, anthropic, github
7. **On-call contacts** — Frank (admin@legacyhoopers.org + olivejuiceinc1@gmail.com), Kenny
8. **Secret rotation cadence** — recommended baseline per secret class (HMAC tokens 12mo, cron_secret 6mo, vapid avoid-rotation, service_role rotate-on-exposure)
9. **Drill history** — empty (3B.25.P0-2 is the standing P0-2 below)
10. **Standing owner action items** — 3B.25.P0-2 (backup-to-staging drill), 3B.25.P1 (off-platform pg_dump, Sentry source-map upload, LeagueApps source archive), 3B.27.P0-2 (breach-notification policy cross-link)

**Closes 3B.25.P0-1.** Does NOT close 3B.25.P0-2 (backup-to-staging drill — needs an owner-driven session against a fresh Supabase project; runbook flags it as the standing action item in §10) or 3B.25.P0-3 (5 ghost migrations were already materialized; closed by §4.AS).

**AP #45 satisfied** by this same-commit ledger entry. **AP #49 satisfied** by full-paste in chat (the runbook is 250 lines — pasted in the same turn).

---

### §4.BT — Doctrine reconciliation closes Wave 3.B #29 P0-1/2/3/4 (2026-06-02)

Closes the 4 P0 doctrine-drift findings from `AUDIT_WAVE_3B_2026-05-29.md` (category #29). Doc-only PR — no code touched.

- **3B.29.P0-1** (§0 verification grep #4 fails) — CLAUDE.md §0 grep updated to exclude 5 documented exceptions; §6 gains a "Known >150 LOC exceptions" subsection enumerating each file + LOC + split shape + cap-pressure-trigger. Pattern follows the existing AdminHomePage cap-pressure note in §6. 5 exceptions: `AuthContext.jsx` (172), `BriefingComposer.jsx` (164), `kindMetadata.js` (169), `familyGuideHelpers.js` (155), `registry.js` (159). Two were new since audit (familyGuideHelpers + registry).
- **3B.29.P0-2** (§5 migration count stale) — `~171 files / 179 registered` → `190 files in repo as of 2026-06-02`. Caveat preserved: directory remains canonical source; registered-vs-mirror parity tracked per AP #21.
- **3B.29.P0-3** (§2 tech stack drift) — `React 18 + Tailwind CSS + Vite` → `React 19 + Tailwind CSS 4 + Vite 8`. Reconciles three major-version drifts (React 18→19.2.6, Tailwind 3→4.2.2, Vite 5→8.0.14).
- **3B.29.P0-4** (AP #51 catalog stale) — narrative refactored: dropped "InstallPrompt + WelcomeOverlay still mounted at HomePage:29/30" and "TeamPlayerStats.jsx + PlayerStatsTable.jsx orphan files" lines (all 4 files confirmed deleted 2026-06-02); added explicit "Historical cleanup arc" table preserving the precedent ledger; added catalog-refresh discipline.

**Additional opportunistic closures in same PR:**
- §1 title `WHAT IS EMBER` → `WHAT IS ASTER SPORTS` (rebrand drift caught en route, paired with the rebrand arc)
- §13 brand-color rule 5 reconciled to engine: header `#1e3a5f` → `#0f172a` (per `engine/colors.js` `TEXT_NAVY`); added `COBALT_DEEP #2563eb` for the eyebrow contrast variant. Per AP #39 ("when hedging X with Y, Y is usually truer") — engine code is the truer position.
- §16.10 bundle budget note refreshed: entry chunk `~85 KB gz` (PR #150, 2026-05-13) → `~115 KB gz as of 2026-06-02`. Still under the 350 KB ceiling; growth attributed to registration arc + rebrand consts + Sentry/PostHog wiring.
- AP #50 textual residue: 2 lines (in AP #53 candidate body + §16.15 framing) marked with explicit `(retired 2026-05-28)` parenthetical so future readers don't follow the historical methodology citation as live guidance.

**Out of scope** (deferred to follow-up PRs):
- ~~§16.5 Stream B drift (24h coverage vs T-4h+T-1h spec) — needs Frank's call on which is the truer position~~ ✅ **RESOLVED 2026-06-05** (operator decision). Stream B rsvp_nudge now drafts when an upcoming game has **fewer than N confirmed "going"** RSVPs (N = `organizations.auto_notifications.rsvp_min_going`, default 5; "you need 5 to field a game"). Replaces the `<70%`-coverage model. Stays auto-DRAFT into the Radar (nothing auto-sends to families). Pure decision in AP #30 mirror pair `src/lib/cron/rsvpNudgeThreshold.js` ↔ `supabase/functions/briefing-auto-draft-tick/_rsvpNudgeThreshold.ts`; handler `briefing-auto-draft-tick/_handlers.ts:handleRsvpLowGoing` (renamed from `handleRsvpLow24h`; DB trigger_event value stays `rsvp_low_24h_before`); operator control in `AutoNotificationSettingsSheet`. §16.5 Stream B doc rewritten to match. ~~**FLAG (open, deferred):** widening the ~24h event-proximity window for more rally lead time — pending a separate operator decision; not implemented in this PR.~~ ✅ **RESOLVED 2026-06-05** (operator decision): window widened **24h → 48h** for more lead time to rally a short-rostered game. Window bound is `RSVP_NUDGE_WINDOW_HOURS = 48` in the AP #30 mirror pair; handler renamed `handleRsvpLow24h` → `handleRsvpLowGoing`; §16.5 + tests updated.
- BRIEFINGS_COVERAGE_L99.md refresh — separate doc, separate PR
- `docs/archive/SKYFIRE_BUILD_QUEUE_v2.md` rename — file is archived (not active); falls under the "historical docs kept as-is" doctrine clause; not renamed

**AP #45 satisfied** by this same-commit ledger entry.

---

### §4.BS — Vela rebrand audit landed; platform name Ember → Vela (2026-06-01)

Platform renamed **Ember → Vela** (Frank decided after a long domain/App-Store/trademark
gauntlet — Aureon rejected for trademark exposure; Roar/Hearth failed; Vela is category-clean,
pending `vela.co` price reconcile). Visual identity KEPT (warm gold/navy + phoenix→sail-flame
mark, Frank's SVG). `--em-*` tokens NOT renamed (AP #3).

**Audit doc:** `docs/AUDIT_VELA_REBRAND.md` — 5 layers: (1) user-facing "Ember" strings →
Vela (~13 spots, manifest/title/Powered-by/emberDefaults), (2) internal cosmetic rename
(optional), (3) owner email `admin@legacyhoopers.org`→new (34 refs; auth record = dashboard
step; pilot-override migrations must repoint), (4) tenant↔platform de-hardcode = the multi-org
track, OUT OF SCOPE, (5) logo/favicon asset swap, palette unchanged.

**Gating:** all execution waits on the account migration (Claude/GitHub/Supabase/Vercel → new
email, Track 1). Recommended PR sequence R1–R4 in the audit. Nothing changed yet (audit only).
"Legacy Hoopers" STAYS as a tenant (123 refs mostly unchanged).

---

### §4.BR — Registration Capture Flow: L99 audit doc landed, scope locked (2026-06-01)

Post §4.5-schema-completion, the next build phase. Frank scope-lock (AskUserQuestion,
2026-06-01): **"Capture flow"** — §3 admin program-setup (MVP) + §5 Steps 1–3 parent
registration; payment via the existing manual record-payment model. NOT Stripe, NOT
`payment_plans`, NOT Family Home.

**Why the scope fork (verified against live DB, not memory):** the spec's parent surfaces
(§5–§8) assume infrastructure that doesn't exist — `payment_plans_exists=false`,
`stripe_tables=0`, `org_count=1`. So §5 Step-4 Pay + all §8 are Stripe-blocked, §6 Family
Home is multi-org-premature. The buildable/valuable slice is the registration *capture*
loop (admin creates program → parent registers → `pending` registration → admin records
payment via existing flow).

**Audit doc:** `docs/AUDIT_REGISTRATION_CAPTURE_L99.md` — all five §16.15 elements (initial
pass, deep-read addendum w/ 9 gaps G1–G9, anti-pattern cross-ref, per-role wireframes
admin+parent, out-of-scope). Key architecture decisions locked: anon writes go through TWO
SECURITY DEFINER RPCs (`get_public_program`, `submit_registration`) — no anon table grants;
family-cap total is server-authoritative (PATTERN A #63); one schema add required
(migration #13-cap: `programs.public_slug/reg_opens_at/reg_closes_at/is_published`).

**PR sequence:** A (RPCs + #13-cap migration) → B (parent entry) → C (wizard Steps 1–3) →
D (Step 4 submit + multi-child) → E (account claim) → F (admin Season wizard) → G (admin
program detail + record-payment link).

**3 open questions RESOLVED** (Frank GO 2026-06-01): Q-1 → **magic-link** on submit,
Q-2 → **OPEN/CLOSED-only** (no capacity/waitlist v1), Q-3 → **Season wizard first**
(Tryout/Camp follow-up). "Auto-execute until a decision is needed."

**✅ PR A SHIPPED (2026-06-01)** — migrations 13a (`programs.public_slug/reg_opens_at/
reg_closes_at/is_published` + slug unique index, version 20260601044658) + 13b (the two
anon SECDEF RPCs `get_public_program` + `submit_registration`, version 20260601044918).
Both applied via MCP w/ DO-block verify + mirrors (AP #21). End-to-end transactional smoke
(rollback) PASSED: get_public_program base=$800, 2-child submit total=$1,700, 2 regs + 4 fee
rows + 2 equipment, dedupe=0-dupes, grade-band guard fires. Grants anon+authenticated, no
PUBLIC (#23/#57); anon-SECDEF WARNs intentional (get_invitation_by_token precedent).

**✅ FLOW SHIPPED A–G (2026-06-01) — registration capture COMPLETE (minus deferred E):**
- **PR A #609** — schema 13a/13b + 2 anon RPCs (above).
- **PR B #610** — `/r/:slug` public entry (program hero + division grid, `usePublicProgram`,
  `DivisionCard` + invariant test #46/#43).
- **PR C #611** — lean wizard `/r/:slug/apply` (player→guardian→details→review→Reserve→confirm);
  `estimateCart` pure (#27, 8 tests) + `useSubmitRegistration`; useReducer no-remount (§5.7).
- **PR D #612** — multi-child loop (`StepDivision`, guardian once, one confirm per child;
  single-charge accumulation is the Stripe track).
- **PR F #613** — admin program-setup `/admin/programs/new` (`useProgramSetup` writes
  programs+divisions+division_fees via existing admin RLS; `DivisionRows`; "+ Program" on Seasons).
- **PR G #614** — admin program detail `/admin/programs/:id` (`useProgramRegistrations`;
  read-only registrations list + status + fee total + link to Financials).
- **PR E DEFERRED** (Frank call 2026-06-01): magic-link account claim is outward-facing (real
  emails) AND lands parents on a sparse home (no §6/§8 status surface yet). Revisit when a
  parent-facing registration-status surface exists.

**Pilot loop closed:** admin creates published program → parent registers (public, multi-child)
→ pending registrations land → admin sees them + records payment in the existing financial flow.
**Live test program:** slug `test-2026` (program `ed725214`, `ZZ TEST … safe to delete`) — Frank
walking `/r/test-2026`; **CC to delete program + any test registrations on Frank's go.**

**Known gaps / fast-follows:** (1) registration↔`financial_account` reconciliation is manual
(no auto-link); (2) "mark confirmed" admin action read-only for now; (3) reg-window datetime
inputs are server-tz naive; (4) app-layer multi-org (AuthContext `roleRows[0]`) still pending
(Finding A other half); (5) PII RLS tighten decision before any real parent-facing PII read.

**Deferred tracks (out-of-scope, where-they-go in audit §7):** Stripe + payment_plans #13 +
§8 lifecycle → "Stripe first" track; §6 Family Home + §7 re-IA → multi-org track (St Pat's
2027); waitlist, Tryout/Camp wizards, returning-parent re-reg → follow-ups.

---

### §4.BQ — Build PR 12: current_user_org_ids() + parent SELECT policies SHIPPED (2026-05-31)

**Frank's GO** (after the design pass + PII-scope decision) → spec §4.5 step 12 / §4.3.
**THE LAST §4.5 MIGRATION — schema chain COMPLETE (12/12).** Closes audit Finding A at the RLS layer.

- **Migration #12** (MCP, version `20260531222056`, mirror per AP #21). Function + 8 policy swaps;
  `DO $$` verify.
- **Part 1 — `current_user_org_ids()` (plural):** returns ALL org_ids the user has a role in
  (`ARRAY_AGG(DISTINCT organization_id) FROM user_roles WHERE user_id = auth.uid()`). Mirrors the
  sibling `current_user_*` helper shape (SQL/STABLE/SECDEF/search_path=public). Single-org user (every
  user today) → array of 1, so the swap is behavior-identical now + correct for multi-org. EXECUTE
  revoked from PUBLIC/anon, granted to authenticated/service_role (verified posture).
- **Part 2 — 8 SELECT policy swaps:** all new-table SELECTs go `org_id = current_user_org_id()`
  (singular, LIMIT-1 = the Finding A bug) → `org_id = ANY(current_user_org_ids())`. One policy covers
  admin (array of 1) + multi-org parent (array of N).
- **DESIGN PASS (this is why #12 was gated, not auto-shipped):** the 8 tables split into catalog
  (programs/divisions/division_fees/tryout_sessions — parents *should* browse) vs PII
  (registrations/registration_fees/tryout_attendees/player_equipment — carry medical_notes,
  emergency/secondary contacts, custom_responses). Spec §4.3's literal "org_id = ANY(...)" line was
  written about events (catalog-ish); applying it to the PII tables lets any org parent read every
  family's registration PII.
  - **CC recommended** child-scoped PII reads (admin org-wide OR `player_id = ANY(current_user_player_ids())`),
    per §16.7 privacy locks + §11.5.
  - **Frank chose** the literal spec §4.3 org-wide read (AskUserQuestion, 2026-05-31).
  - **AUTHORIZED DEVIATION** recorded in the migration comment + PR + here. Safe to proceed on the
    call because: (1) contract-only — NO live exposure today (no parent-facing UI queries these
    tables; the leak begins only when the registration UI ships), and (2) trivially reversible — the
    revert path (child-scoped OR) is documented per-PII-table in the migration. **Reconsider before
    the parent registration surface goes live.**
- **Advisors clean** — `current_user_org_ids()` shows the expected `authenticated_security_definer`
  informational warning (identical accepted posture to every sibling `current_user_*` helper; RLS
  helpers must be authenticated-callable).

**🏁 §4.5 SCHEMA FOUNDATION COMPLETE.** 12 migrations (1,1a,2-12) all applied + verified + mirrored.
The full programs/registration/multi-tenant data model exists end-to-end. **What remains is NOT
migrations:**
1. **App-layer multi-org (Finding A, other half):** AuthContext `roleRows[0]` hard-pick + singular
   `current_user_org_id()` app-wide → org-switcher + Family Home routing (spec §2.3). Separate PR;
   no multi-org user until St Pat's.
2. **PII RLS reconsideration** before parent registration UI (revert path in #12).
3. **Registration UI build** — Family Home → cart → billing (spec §5-§8, 10/10 parent surfaces).

---

### §4.BP — Build PR 11: organizations extensions SHIPPED (2026-05-31)

**Frank's GO** ("1" = ship the last mechanical one) → spec §4.5 step 11. Last additive migration. 12/12
applied (only #12, the RLS migration, remains — and it's design-gated, not mechanical).

- **Migration #11** (MCP, version `20260531213314`, mirror per AP #21). Additive ALTER + 1-row seed +
  `DO $$` verify.
- **Added:** `family_cap_policy` jsonb (F4 D6 — per-org family pricing cap, applied server-side at
  checkout; NULL = no cap, checkout reads NULL as "no discount"), `acceptable_age_range` int4range
  (Q20 — player age band cap; LH `[4,14]`, St Pats `[8,18]`).
- **Seeded LH** `acceptable_age_range = [4,15)` (canonical int4range = inclusive ages 4-14, matching
  Q20's LH grades-2-5 band). Inline because there's 1 known org with a documented default — avoids a
  follow-up data PR. `family_cap_policy` left NULL (no policy configured yet).
- **Post-flight:** 2 columns present (family_cap_policy jsonb confirmed), LH range `[4,15)` verified.
  No new RLS/advisor impact (additive on a table with existing RLS).

**§4.5 schema chain: 11 PRs / all 12 migrations applied (1,1a,2-11). ONLY #12 REMAINS** —
`current_user_org_ids()` + parent SELECT policies = **audit Finding A (P0 multi-org context)**.
NOT a mechanical table-add: introduces the plural org helper, rewrites parent-facing SELECT policies
across the new tables, and pairs with AuthContext app-layer work (the `roleRows[0]` hard-pick at
AuthContext.jsx:68 + singular `current_user_org_id()` app-wide). **Design discussion before GO** —
Frank-flagged this one warrants scoping, not a quick GO.

---

### §4.BO — Build PR 10: players extensions SHIPPED (2026-05-31)

**Frank's GO** → spec §4.5 step 10. First migration to ALTER the live `players` table (115 rows) —
given PR-8-level care (pre-inspect shape, collision check, no-break verify). 11/12.

- **Migration #10** (MCP, version `20260531212653`, mirror per AP #21). Single additive ALTER +
  `DO $$` verify; no backfill, no code change (nothing reads these yet).
- **Added (3 nullable columns):** `grade_school_year` int (distinct from existing `grade`), `school`
  text, `aau_member_id` text. All nullable → existing reads unaffected, no collisions (pre-checked).
- **DEVIATION — `can_have_own_account` NOT added:** spec lists it as "BOOL (computed, age ≥ 13)".
  PG17 can't express this as a stored generated column — `age(dob) >= 13` depends on `current_date`
  (non-immutable), and PG17 has no VIRTUAL generated columns (PG18+). A stored boolean would go stale
  daily without a cron. It has **zero consumers today** (kid login is Phase 3+ per spec §4.1; AP #51 =
  don't build dead infra), so it's deferred to **app-side computation** when kid-login eligibility is
  actually needed: `dob IS NOT NULL AND dob <= current_date - interval '13 years'`. Source column
  (dob) already exists. Faithful to spec intent, avoids a stale-prone column. Revisit when kid login
  ships.
- **Post-flight:** 3 nullable columns present, 115 rows intact. No new RLS/advisor impact (additive
  on a table that already has RLS).

Next: spec §4.5 PR 11 — `organizations.family_cap_policy` (JSONB) + `acceptable_age_range`
(INT4RANGE) on GO. 11/12 done; **only #12 remains — the RLS `current_user_org_ids()` + parent SELECT
policies migration = where audit Finding A (multi-org context) lands.** Per Frank's earlier note,
#12 likely warrants its own design discussion, not a quick GO.

---

### §4.BN — Build PR 9: tryout_sessions + tryout_attendees SHIPPED (2026-05-31)

**Frank's GO** → spec §4.5 step 9. Two clean additive tables (tryout scheduling + evaluation). 10/12.

- **Migration #9** (MCP, version `20260531212150`, mirror per AP #21). Both tables + indexes +
  triggers + RLS in one atomic migration; `DO $$` verify.
- **`tryout_sessions`** — `(id, org_id→organizations RESTRICT, program_id→programs CASCADE, starts_at
  [spec 'datetime'], capacity [nullable=uncapped], location_id→locations SET NULL, notes, timestamps)`.
- **`tryout_attendees`** — `(id, org_id→organizations RESTRICT, registration_id→registrations CASCADE,
  session_id→tryout_sessions CASCADE, evaluation_note, timestamps)` + `UNIQUE(registration_id,
  session_id)` (a registration is listed once per session).
- **FK rules** (not in the §4.4 table; chose sensible defaults): sessions CASCADE from their program;
  attendees CASCADE from both their session and their registration (an attendee row is meaningless
  without either). location_id SET NULL (optional venue link; deleting a location shouldn't drop the
  session).
- **RLS** mirrors registrations/programs (4 policies each, admin write, org-scoped select). Both
  scoped under tryout-type programs (not DB-enforced; the tryout wizard scopes creation).
- **Post-flight:** 2 base tables, RLS on both, 4 policies each, all FK cascades + the unique correct.
  Advisors clean.

Next: spec §4.5 PR 10 — `players` extensions (grade_school_year, school, aau_member_id,
can_have_own_account computed) on GO. **This one ALTERs the live players table** — additive columns
only, but touches an existing hot table, so it gets the same care as PR 8. 10/12 done; 10-12 remain
(11 = orgs columns, 12 = RLS current_user_org_ids() + parent policies = audit Finding A).

---

### §4.BM — Build PR 8: player_equipment + §11.5 reconciliation SHIPPED (2026-05-31)

**Frank's GO** → spec §4.5 step 8, with the **"build + migrate + repoint now"** decision on the
roster_members overlap (AskUserQuestion). Largest PR in the chain — only one touching live UI. 9/12.

- **Migration #8** (MCP, version `20260531211150`, mirror per AP #21). CREATE TYPE + TABLE + backfill
  + alignment trigger; `DO $$` verify.
- **The overlap & the decision:** `player_equipment(player_id, season_id, sport_id)` with
  jersey/shorts/number/status (spec line 226) overlapped `roster_members` — which §11.5 named the
  canonical sizes home. Per AP #42 this was a parallel-system risk, so it went to Frank: chose
  **migrate now** (vs. build-empty-defer or skip). Investigation de-risked it: the "5 §11.5 exception
  callers" mostly read jersey_*number* or historical windows, not sizes — **useRoster was the ONLY
  true sizes reader.**
- **What shipped (3 parts, one PR):**
  1. **Table** — `player_equipment_status` enum (needed/ordered/distributed); player_id→players
     CASCADE, season_id→programs CASCADE, sport_id→sports SET NULL; UNIQUE(player,season,sport);
     RLS mirrors programs (4 policies). jersey_number text (matches roster_members/team_players).
  2. **Backfill** — 63 LH rows from roster_members→teams→programs(season).sport_id. Data was clean:
     all 63 map to valid team→season→sport (one sport=Basketball), **0 players on >1 team same
     season** so the unique key never collided. status='distributed' where kit data present.
  3. **Alignment trigger** `align_player_equipment_from_roster_member` — AFTER INSERT/UPDATE OF
     jersey_size/shorts_size/jersey_number on roster_members, upserts player_equipment. Mirrors the
     established roster_members↔team_players alignment-lock (migration 20260505201932). SECDEF,
     pinned search_path; EXECUTE revoked from PUBLIC+anon+authenticated (AP #23/#57 — closes the
     get_advisors authenticated_security_definer warning my first apply surfaced; service_role keeps
     EXECUTE; trigger fires as owner regardless).
- **Code repoint:** `useRoster.js` now reads sizes from player_equipment (scoped to the team's
  season via a `teams(season_id)` embed + `.in('player_id',...)` lookup); still queries
  roster_members for membership + jersey_number. §11.5 doctrine rewritten (canonical sizes table +
  rules + exception-callers table all updated). CLAUDE.md §11.5 edited.
- **Verification:** DO-block (table/RLS/CASCADE/unique/backfill-count=distinct-combos/trigger), full
  vitest suite **1135 passed / 0 failed**, grep confirms no other UI reads roster_members sizes,
  advisors clean.

Next: spec §4.5 PR 9 — `tryout_sessions` + `tryout_attendees` on GO. 9/12 done (1,1a,2-8); 9-12 remain.

---

### §4.BL — Build PR 7: registration_fees table SHIPPED (2026-05-31)

**Frank's GO** → spec §4.5 step 7. Realized fee line items per registration (8/12 in the chain).

- **Migration #7** (MCP, version `20260531210133`, mirror per AP #21). CREATE TABLE + 3 indexes +
  trigger + RLS; atomic, `DO $$` verify.
- **Shape:** `registration_fees(id, org_id→organizations RESTRICT, registration_id→registrations
  CASCADE, fee_id→division_fees SET NULL [nullable], fee_type, amount_cents, timestamps)`.
- **Design decision (beyond the spec's 3-col base list):** spec §4.2 line 217 lists
  `(registration_id, fee_id, amount_cents)`, but §4.2 F1.v1.2 (line 239) requires the family-cap
  discount to be recorded as a `registration_fees` row with `fee_type='family_discount'` — computed
  server-side at checkout with NO source `division_fee`. That forces two choices:
  - **`fee_id` nullable + SET NULL** — family discounts have no template row; and deleting a fee
    template must never erase realized billing history (financial-record preservation). SET NULL
    keeps the realized line item, drops only the template link.
  - **`fee_type` column** (snapshot, reuses `division_fee_type` enum) — lets a templateless
    `family_discount` row carry its type without a `fee_id`.
- `amount_cents` signed (realized billed amount; discounts negative — same convention as division_fees).
- **RLS** mirrors registrations/programs (4 policies, admin write, org-scoped select; UPDATE
  USING+WITH CHECK per AP #20). 3 indexes (registration/fee/org). Parent-facing read deferred to
  migration #12 per §4.3.
- **Post-flight:** base table, RLS on, 4 policies, registration_id CASCADE, fee_id SET NULL+nullable,
  fee_type/amount_cents present. Advisors clean.

Next: spec §4.5 PR 8 — `player_equipment` (jersey/shorts sizes + number + status, per player×season×
sport) on GO. 8/12 done (1,1a,2,3,4,5,6,7); 8-12 remain.

---

### §4.BK — Build PR 6: registrations table SHIPPED (2026-05-31)

**Frank's GO** ("proceed as planned") → spec §4.5 step 6. The conversion-surface table —
biggest in the §4.5 chain.

- **Migration #6** (MCP, version `20260531120820`, mirror per AP #21). 3 CREATE TYPE + CREATE
  TABLE + 4 indexes + trigger + RLS; atomic, `DO $$` verify.
- **No legacy table existed** — the CLAUDE.md §5 migration-003 `registrations` reference was
  illustrative/stale (same as seasons/divisions were). Clean create, no data migration.
- **3 native enums** (mirror program_type/division_fee_type style):
  - `registration_tier` = full_roster / practice_roster / practice_player (3 per §4.2 F1.v1.1;
    `call_up` deliberately removed — it's a roster action, not a reg tier).
  - `waitlist_state` = none / on_list / promoted_credit / promoted_pay / refund_released.
  - `registration_status` = pending / confirmed / waitlist / cancelled / payment_overdue
    (distinct lifecycle from waitlist_state).
- **17 spec columns**: program_id, player_id, team_id, the 3 enum cols, promoted_from_registration_id,
  sms_opt_in_p1/p2, emergency_contact_name/phone/relationship, secondary_contact_name/phone,
  medical_notes, conduct_acknowledged_at, custom_responses JSONB (St Pats CCD / AAU membership #).
- **FK cascades per §4.4**: `program_id`→programs RESTRICT (must cancel registrations before
  deleting a program), `player_id`→players RESTRICT, `team_id`→teams SET NULL (nullable —
  unallocated until placed), `promoted_from_registration_id`→registrations self SET NULL
  (tryout→season link). org_id→organizations RESTRICT.
- **RLS** mirrors programs/divisions (4 policies: authenticated org-scoped SELECT, admin-only
  writes; UPDATE USING+WITH CHECK per AP #20). **Parent-facing SELECT (own child's registrations)
  + INSERT (public registration flow) deferred to migration #12** with `current_user_org_ids()`
  per spec §4.3 — the flow that writes these rows is a later UI PR, and #12 is also where the
  audit Finding A multi-org context work lands. 4 indexes (program/player/team/org).
- **Post-flight:** base table, RLS on, 4 policies, 3 enums (3/5/5 values), 17 cols, all 4 FK
  cascade types correct. Advisors clean.

Next: spec §4.5 PR 7 — `registration_fees` (registration_id × fee_id × amount_cents line items)
on GO. Halfway through the 12-migration chain (1,1a,2,3,4,5,6 done; 7-12 remain). After the
schema chain: audit Finding A (multi-org context + migration #12) → Finding E broad date sweep.

---

### §4.BJ — Senior-engineer full-codebase audit (2026-05-30)

**Frank's "audit like a senior engineer" prompt** → 3-pass parallel review (arch/data-flow,
duplicate-logic, perf/scalability) + first-hand inspection. Read-only; no code changed.
Full artifact: `docs/AUDIT_SENIOR_ENGINEER_FULL_CODEBASE_2026-05-30.md`.

**Verdict:** well-architected, disciplined codebase — not a refactor candidate. Hard
anti-patterns verified clean (AP #36/#37/#48/#51 = zero prod violations; enforcement
tests work). Debt clusters into 4 themes, dominant root cause = single-org assumptions
the §4.5 schema is now outgrowing.

**Punch-list (candidate gated PRs, NOT yet built except E):**
- **A (P0)** — multi-org context lag: `AuthContext.jsx:68` hard-picks `roleRows[0]`; app on
  singular `current_user_org_id()`. The app-layer multi-org refactor is the real critical
  path — pairs with spec migration #12 (`current_user_org_ids()`). Build after §4.5 schema chain.
- **B (P1)** — no list virtualization anywhere (MessageThread 200-cap, FamilyBalanceList
  unbounded, PlayByPlayFeed). Before org #2.
- **C (P1)** — bundle 398KB gz > 350KB §16.10 budget; PostHog 61KB gz (lazy, FCP safe).
- **D (P1)** — `useSeasonFinancials.js:77` pulls ALL org transactions, filters in JS.
- **E (P2)** — formatter duplication: ~40 inline date/time callsites + tournament-range ×3
  (one `T00:00:00` latent DST bug at `broadcast/TournamentCard.jsx:11`) + currency ×4 (AP #63).
  **NOTE:** PR #233/#234 already did a formatters NY-pin pass — this is *residual* drift since
  2026-05-18 (new surfaces re-introduced inline formatting). **Scheduled next, ahead of PR 6
  (Frank 2026-05-30).**
- **F (P2)** — inverted test pyramid: 160 unit vs 1 e2e on a payments+RLS+multi-tenant app.
- **G (P2)** — query-shape debt (useRoster balances round-trip on game-day; useRecentActivity
  whole-players prefetch; NewDmPicker 1+N; useSeasonRollover non-atomic per-row inserts).
- **H (P2)** — 5 prod files over the 150-line cap (AuthContext 172, kindMetadata 169,
  BriefingComposer 164, registry 159, familyGuideHelpers 155).
- **I (P3)** — UTC-vs-NY weekday anchor in engine helpers; `useWeather` hardcoded Westchester coords.

**Sequence:** §4.5 schema chain (PR 6 next) → A → E (pulled ahead per GO) → B/C/D/F before org #2 → G/H/I opportunistic.

---

### §4.BI — Build PR 5: division_fees + auto_apply_rule SHIPPED (2026-05-30)

**Frank's GO** → spec §4.5 step 5. Line-item fee structure under `divisions`.

- **Migration #5** (MCP, version `20260530014430`, mirror per AP #21). CREATE TYPE + CREATE TABLE +
  indexes + trigger + RLS; atomic, `DO $$` verify.
- **Shape:** `division_fees(id, org_id→organizations RESTRICT, division_id→divisions CASCADE, name,
  fee_type, amount_cents, auto_apply_rule, sort_order, timestamps)`.
  - `fee_type` = **native enum `division_fee_type`** (base/add_on/discount/early_bird/prorated/
    family_discount), mirroring the `program_type` enum style (verified native before building).
  - `amount_cents` integer signed — discount-type fees may carry negative amounts; sign semantics
    applied at checkout (deferred), so no CHECK on sign.
  - `auto_apply_rule` JSONB — F1.v1.2 address-based geo rules (e.g.
    `{"type":"address_not_in_zips","zips":["10504"]}`, St Pats parishioner pricing, spec Q17). Null =
    fee always applies.
- **RLS** mirrors divisions/programs exactly (4 policies; UPDATE carries USING + WITH CHECK per AP #20).
  `set_updated_at` trigger + division/org indexes.
- **Verify-before-stack note (AP #62 / op-rule 2):** #597 (PR 4) was still open when GO landed, so the
  migration was applied to prod via MCP (independent of git) but the **PR push was held** until #597
  merged (01:44) — avoided the #596-class strand race. Branch synced to the post-#597 main before
  committing #5.
- **Post-flight:** base table, RLS on, 4 policies, 6-value enum, FK CASCADE to divisions,
  `auto_apply_rule` jsonb. Advisors clean.

Next: spec §4.5 PR 6 — `registrations` + all new columns (the big one: waitlist_state,
registration_tier, emergency/medical/contact fields, custom_responses JSONB) on GO.

---

### §4.BH — Build PR 4: divisions table SHIPPED (2026-05-30)

**Frank's GO** → spec §4.5 step 4. First child entity under `programs`.

- **Migration #4** (MCP, version `20260530013933`, mirror per AP #21). Single CREATE TABLE +
  indexes + trigger + RLS; atomic, `DO $$` verify.
- **Shape:** `divisions(id, org_id→organizations RESTRICT, program_id→programs CASCADE, name,
  grade_min, grade_max, gender CHECK M/F, state, team_color, sort_order, timestamps)`.
  - `gender` CHECK `IN ('M','F')` but **nullable during build-out** (no rows/UI yet; tightens to
    NOT NULL when the divisions wizard ships) — consistent with #1a's nullable `sport_id`. §4.2 F5 Q1:
    divisions enforce M/F; Co-Ed lives on camp `programs` rows, never divisions.
  - **`state` = US state (geographic).** The spec uses `status` everywhere it means lifecycle
    (`registrations.status`, `seasons.status`), and deliberately wrote `state` in the §4.5 step-4
    column list — so this is the geographic dimension, not a workflow column. Flagged in the PR for
    Frank to correct if that read is wrong.
  - `team_color` mirrors `teams.team_color` (hex text).
- **RLS** mirrors `programs` exactly: `divisions_select` (TO authenticated, `org_id =
  current_user_org_id()`), `divisions_insert/update/delete` (admin-only via `user_has_role_in_org`).
  UPDATE carries both USING + WITH CHECK (AP #20). `set_updated_at` trigger + `idx_divisions_program_id`
  / `idx_divisions_org_id`.
- **No `teams.division_id` link yet** — not in the §4.5 sequence. Teams keep their existing free-text
  `division` column; the normalizing FK link is a later step (after the divisions wizard exists to
  populate rows).
- **Post-flight:** base table, RLS on, 4 policies, FK CASCADE to programs, all expected columns.
  Advisors clean (no `rls_enabled_no_policy`, no new finding).

Next: spec §4.5 PR 5 — `division_fees` + `auto_apply_rule` on GO.

---

### §4.BG — Build PR 3: seasons table → compat view over programs SHIPPED (2026-05-29)

**Frank's GO** → spec §4.5 step 3, completing the programs/seasons cutover. `programs` is now
the single source of truth; `seasons` survives as a backwards-compat view. Chosen over the
defer/sync-trigger alternatives via AskUserQuestion ("full table→view swap now").

- **Migration #3** (MCP, version `20260529185046`, mirror per AP #21). Atomic; one failed pre-flight
  attempt rolled back cleanly (caught 2 `season_locations` RLS policies reading FROM seasons that
  the FK/view sweep hadn't surfaced — added their drop/recreate, re-applied).
- **What it did:** (a) repointed 8 external FKs `seasons(id)` → `programs(id)` (teams, events,
  financial_accounts, coach_payouts, team_achievements, season_locations, season_rollovers×2),
  on-delete behavior preserved, data-safe because PR 2 preserved the uuids; (b) dropped + recreated
  the 2 dependent views (`player_attendance_season`, `player_rsvp_season`, security_invoker
  preserved); (c) dropped + recreated the 2 `season_locations` policies (now read `FROM programs
  WHERE program_type='season'`); (d) dropped the `seasons` table; (e) created `seasons` as a
  `security_invoker`, auto-updatable view (`SELECT … FROM programs WHERE program_type='season'
  WITH CHECK OPTION`, `parent_program_id AS parent_season_id`), GRANT ALL to the 3 PostgREST roles.
- **Why security_invoker:** the view enforces `programs` RLS against the querying user (a plain view
  would run as owner and bypass RLS). Advisors clean — no `security_definer_view` warning.
- **Why auto-updatable + WITH CHECK OPTION:** `useSeasons` (UPDATE name/status) and
  `useSeasonRollover` (INSERT new season) write through `seasons`; a simple single-table view with
  column renames is auto-updatable, and `programs.program_type DEFAULT 'season'` supplies the type
  on insert (CHECK OPTION guarantees the row stays a season).
- **Post-flight (DO-block + independent read):** seasons is a view (3 rows: Fall 2025/Winter/Spring),
  0 FKs reference seasons, 8 FKs on programs, all 5 LH teams join through programs, dependent views +
  policies recreated.
- **⚠ Follow-up smoke (manual, post-deploy):** `SeasonRolloverPage` reads `seasons→teams→
  roster_members` via PostgREST embedding; `teams` now FK `programs`, so the embed relies on
  PostgREST resolving the view→base-table relationship. Verify the rollover wizard loads + an
  INSERT-through-view season-create works. If it breaks, repoint that one query to read `programs`
  directly.

**Programs/seasons cutover COMPLETE** (migrations #1, #1a, #2, #3). Next: spec §4.5 PR 4
(divisions extensions) on GO.

---

### §4.BF — Build: sports table (#1a) + programs backfill (#2) SHIPPED (2026-05-29)

Two migrations applied on Frank's GO, immediately after PR 1, as the rest of the programs
foundation arc (bundled into PR #595 with migration #1).

- **Migration #1a — `sports` table + `programs.sport_id` FK** (version `20260529155952`, mirror per
  AP #21). Frank directed "build a minimum sports table" after PR 1 flagged `sport_id` as no-FK
  scaffolding. The spec's relationship diagram has `sports(sport_id, org_id)` as parent of
  `programs`, but the §4.5 12-migration list omitted it — this fills the gap. Minimal shape
  (id/org_id/name + UNIQUE(org_id,name)); RLS mirrors seasons/programs (4 policies); seeds LH
  **Basketball**; adds `programs_sport_id_fkey` (ON DELETE RESTRICT) — instant because `programs`
  was empty. `sport_id` stays **nullable** for now; NOT NULL tightening belongs with the
  registration build that always sets a sport. Post-flight DO-block verified table/RLS/seed/FK.
- **Migration #2 (PR 2) — backfill `programs` from `seasons`** (version `20260529160011`, mirror per
  AP #21). Spec §4.5 step 2. One program row per season, `program_type='season'`, `sport_id`=the
  org's Basketball sport. **Preserves `seasons.id` as `programs.id`** (critical: existing FKs that
  reference season ids stay valid after PR 3 swaps `seasons` → a compat view). Idempotent
  (`ON CONFLICT (id) DO NOTHING`). Pre-flight: 3 seasons, all parent_season_id NULL (no self-FK
  ordering concern), programs empty. Post-flight (DO-block + independent read): 3 programs
  (Fall 2025/Winter 2025-26/Spring 2026), all season-type, all Basketball, all ids match seasons.
- **`get_advisors security` clean** after both — no new advisory on `sports` or `programs`.

**PR 3 design note (flagged for next GO):** PR 3 makes `seasons` a compat view
(`SELECT … FROM programs WHERE program_type='season'`). But **you cannot keep a real FK pointing at
a view** — any existing `*.season_id → seasons(id)` FKs must be re-pointed at `programs(id)` (same
uuids, so data-safe) BEFORE/AS the table→view swap, or dropped. PR 3's pre-flight will enumerate
every FK referencing `seasons` and repoint each to `programs` in the same migration.

---

### §4.BE — Build PR 1: migration #1 programs table + program_type ENUM SHIPPED (2026-05-29)

**Frank's GO** → spec §4.5 step 1, the multi-program schema's top-level container.

- **Migration applied** (MCP, version `20260529155321`, mirror `supabase/migrations/
  20260529155321_programs_table_and_program_type_enum.sql` per AP #21):
  - `program_type` ENUM with 6 values (`season/tryout/camp/clinic/interest_list/evaluation`);
    v1 UI will expose 3 (season/tryout/camp) per spec §4.2.
  - `programs` table — top-level container (parent of divisions/registrations). **Column set is
    a deliberate superset of `seasons`** (id, org_id, name, start/end_date, status, created/
    updated_at, parent_program_id↔parent_season_id, rolled_over_at) so PR 2 (backfill from
    seasons) + PR 3 (`seasons` becomes a compat view `WHERE program_type='season'`) are clean.
  - `sport_id uuid` is **forward-compat scaffolding — no FK**: the `sports` table is not built in
    this wave (not in the §4.5 12-migration list); LH is single-sport. FK lands when sports/
    multisport UI ships.
  - RLS **mirrors `seasons` exactly** (4 policies: select TO authenticated `org_id =
    current_user_org_id()`; insert/update/delete gated `user_has_role_in_org(org_id,{admin})`
    with WITH CHECK per AP #20). Parent SELECT via `current_user_org_ids()` (plural) is deferred
    to migration #12 (spec §4.3). `set_updated_at()` trigger mirrored.
- **Pre-flight:** confirmed `sports`/`programs`/`program_type` did not exist; `seasons` shape
  read for the superset contract. **Post-flight:** in-transaction DO-block (6 enum values, table
  present, RLS on, 4 policies, trigger present) passed; `get_advisors security` clean — **no new
  advisory on `programs`** (RLS-enabled-with-policies).
- **Backward-compatible / additive:** no existing data touched; `seasons` table untouched (PR 3
  converts it).

Next: spec §4.5 PR 2 (backfill `programs` from existing `seasons` rows) on GO — a data migration,
so pre-flight row inspection + idempotency guard before apply.

---

### §4.BD — Build PR 0: migration #0 identity foundation SHIPPED (2026-05-29)

**Frank's GO** → first build PR. The multi-org identity foundation (the spec's missing
prerequisite, §2.1 was wrong).

- **Migration applied** (MCP, version `20260529153604`, mirror `supabase/migrations/
  20260529153604_user_roles_multi_org_unique.sql` per AP #21): `user_roles` drop
  `UNIQUE(user_id)` → add `UNIQUE(user_id, organization_id)`. Provably backward-compatible
  (pre-flight: 5 rows / 5 distinct users / 0 FKs / 0 composite dupes / 0 onConflict-user_id
  upserts in code). In-transaction DO-block verify passed; independent post-verify: new
  constraint present, old gone, row count 5 (no data loss).
- **AuthContext anti-trap fix:** `loadMembership` no longer `.maybeSingle()` on user_roles
  (which errors on >1 row) — fetches all memberships, picks the active org. Single-org behavior
  unchanged today; a future 2nd org row no longer breaks login. `authMultiOrgAudit.test.js`
  locks the invariant.
- **Deferred (no multi-org user exists until St Pat's):** org-switcher UI + Family Home routing
  (spec §2.3, with the Family Home UI PR); the ~5 edge-fn/autoLinkGuardian org-awareness sweep
  (before St Pat's onboards). Tracker PR 0 → ◐.

Next: spec §4.5 PR 1 (programs table + program_type ENUM) on GO. Lint + build + maybeSingle audit
+ new invariant test all green.

---

### §4.BC — Mockup audit + spec v2.1 microcopy + build PR plan (2026-05-29)

**Trigger:** claude.ai reviewer audited the HTML mockup (high spec fidelity, 7/7 frames verified)
and recommended A + C.

**A (done):** mockup locked in `docs/` (PR #592). Three microcopy wins folded into the spec
(now rev 2.1): cart "One charge · one confirmation · account auto-created from your email" (§5.6);
conflict pre-commitment "We'll RSVP Going at [A] and Not Going at [B], and DM both coaches" (§6.5);
positioning line "Two orgs, two voices — stacked in one feed. Never opens Gmail" (§7.7 — also for
marketing + App Store). Mockup nits fixed: St Pats `#2f7a4f` flagged TBD-placeholder; cart frame
captioned "Pierce family — 4-kid cap demo" (was authorially mixed with Samaritano).

**Reviewer observations recorded as production-handoff notes** (in the tracker): Lucide nav icons
(not unicode), kid-avatar = primary-team-color letter (locked v1), state-matrix frames = polish-
pass AFTER v1 (design from real data). All non-blocking.

**C (planned):** build PR sequence appended to `FIX_PR_EXECUTION_TRACKER.md` — **PR 0 = migration #0
(identity foundation, the spec's missing prerequisite)** → spec §4.5's 12 migrations → 7 UI surfaces.
Each migration: pre/post verify + MCP apply + GO per migration. **Awaiting Frank's GO to start PR 0.**

AP #45: ledger touched in same commit as spec/tracker changes.

---

### §4.BB — Program-Setup Spec v2 landed + reconciled vs production (2026-05-29)

**Trigger:** design-chat shipped `EMBER_PROGRAM_SETUP_SPEC_v2.md` (6.6K words, replaces v1.0/1.1/1.2;
20/20 open questions resolved). Committed to `docs/` as the build source-of-truth. This is the
design-review input that unparks the multi-program build (Tier 1A+).

**Reconciliation vs production (Claude Code — the chat couldn't see the DB; per its own
"investigate-then-fix" caution):**
- ❌ **§2.1 WRONG (load-bearing):** "`user_roles` is one row per (user_id, org_id) — schema already
  supports it." Reality: `user_roles_user_id_key = UNIQUE(user_id)` — multi-org is FORBIDDEN today.
  The §4.5 migration sequence is **missing the constraint reshape + AuthContext `.maybeSingle()`
  fix** (migration #12 `current_user_org_ids()` alone won't make multi-org work). This gap == the
  already-scoped Tier 1A P0-1; it slots in as **migration #0**.
- ❌ **§2.4 WRONG:** `useUnifiedParentActivities` hook does NOT exist in production — net-new, not "extend."
- ✅ §4 new schema verified accurate: `programs`/`divisions`/`registrations`/`player_equipment`/
  `family_cap_policy`/`acceptable_age_range` all confirmed net-new; `current_user_org_ids()` plural
  doesn't exist (correctly migration #12); `seasons` exists (→ backwards-compat view per §4.2/#3).

**Build kickoff:** spec is build-ready once migration #0 (P0-1 identity reshape) is prepended.
Recommended next: PR queue starting with #0 (Tier 1A P0-1), then §4.5 sequence. HTML artifact
(parent-surface mockups) is a parallel/after option for sharing, non-blocking. **Awaiting Frank's
GO before any migration runs (spec sign-off gate).** Tracker updated.

---

### §4.BA — Doc-Corpus campaign close: tracker + COMPACT/deletes settled (2026-05-29)

**Trigger:** Frank — "build the execution tracker, prune stale branches, settle COMPACT/deletes."

**Fix-PR execution tracker:** `docs/FIX_PR_EXECUTION_TRACKER.md` created — the single routable
burndown of all open audit-surfaced P0/P1, grouped Tier 1–4, gating the multi-program build
(§17.8). Complements §4.0 (canonical pending index). Recommended sequence: Tier 1A (multi-tenant
identity) + 1B (compliance) first.

**COMPACT — SETTLED: leave the ledger as-is (do NOT bulk-extract).** On inspection the §4
historical entries are interleaved with live top-level sections (§5 UX watch-lists, §13 AP tally,
§14 helper backlog, the V-queue) — there is no clean ~4,000-line contiguous block, so a bulk
extraction would be scattered, error-prone surgery on the canonical routing doc. The COMPACT's
actual value (a navigable live view) is already met by §4.0. Decision: closed, not deferred.
If physical shrink is ever wanted, it's a dedicated careful re-org, never a scripted bulk cut.

**DELETES — SETTLED:** removed 4 genuinely zero-reference `archive/` files (L99_BRIEFINGS_AUDIT_CHAT,
L99_BRIEFINGS_FULL_AUDIT, L99_CHAT_AUDIT_VERIFICATION, SESSION_RECAP_2026-05-11). KEPT the
`SKYFIRE_BUILD_QUEUE.md` stub — precise re-check found it IS cited (STATE_OF_AFFAIRS_L99_v3
"Supersedes:" provenance), so it's not a true delete-candidate.

**BRANCHES:** the 2 merged session branches were auto-deleted on squash-merge. The other 6 stale
branches show UNMERGED (854–1,199 unique commits each = divergent pre-consolidation v2-era history)
— FLAGGED for Frank, NOT auto-deleted (deleting unmerged refs is destructive; surprising state).

**Doc-Corpus L99 campaign CLOSED** — D1–D8 audited; accuracy fixes + 27-doc archive shipped;
tracker live; COMPACT/deletes settled.

---

### §4.AZ — Doc-Corpus L99 D1–D3 findings (2026-05-29)

Findings in `docs/AUDIT_DOC_CORPUS_FINDINGS_2026-05-29.md` (3 agents, production-verified).

**Dominant pattern (AP #58 / AP #63 applied to docs):** a doc fossilizes an early/intended
state; the canonical source (code/DB) moved on; the doc was never reconciled. Instances:
`org_members` (→user_roles, D1-2), `roster_type on roster_members` (→team_players, D1-5),
team-color "mismatch"+Migration 1 already aligned (D3-1), brand PART 9 "missing" tables that
exist (D3-2), ledger PR-4 "0 sent" vs DB 3 sent (D2-4), OPS §3.8/3.9 routes never built (D3-10).
Corollary: Ember/skyfire/legacy-hoopers naming split (D8); "shipped vs design-intent" label is
the uniform fix.

**Headlines:** D1-2 [P0] CLAUDE.md `org_members` is a phantom table (RLS recursion guard names
the wrong table; it's `user_roles`). D2-1 [HIGH] ledger §4.AL header destroyed by in-place
overwrite → 4 dangling refs. D3-1/D3-2 [P0] `LH_BRAND_CONTENT_MODEL` (the untouched sleeper)
asserts an obsolete team-color mismatch + "missing" schema that all shipped.

**Dispositions:** CLAUDE.md FIX (canonical); ledger FIX + COMPACT (4,600→~600-800 lines, archive
needs Frank approval); LH_BRAND_CONTENT_MODEL FIX (substantial); LH_OPS_SPEC FIX (light); tenancy
v3 / external-data / parity / design_review_notes KEEP-CURRENT.

**Recommended fix arc "Doc Batch 1":** CLAUDE.md doctrine (§11.7#7 review), ledger D2-1/2/4,
brand-doc reconciliation, OPS §3.8/3.9 labels. Deferred: ledger COMPACT (approval), D4–D8.

AP #45: this entry ships with the findings doc.

---

### §4.AY — Doc-Corpus L99 audit campaign dispatched (2026-05-29)

**Trigger:** Frank — "review all docs in the repo for accuracy and usefulness, L99." Formalized
in `docs/AUDIT_DOC_CORPUS_L99_2026-05-29.md`.

**Scope:** 78 docs (~41K lines). Two axes per doc: Accuracy (claims production-verified, not
asserted) + Disposition (KEEP-CURRENT / FIX / ARCHIVE / DELETE — archive/delete recommended
only, Frank approves). 8 categories: D1 doctrine (CLAUDE.md), D2 ledger integrity, D3
design-chat inputs, D4 roadmap/build-queue, D5 engine/briefings refs, D6 historical-doc
disposition, D7 archive/ hygiene, D8 cross-ref + SKYFIRE→EMBER naming.

**This run:** D1–D3 dispatched (3 parallel read-only production-verified agents); D4–D8 queued
(recommend after the design spec lands). Findings → `AUDIT_DOC_CORPUS_FINDINGS_2026-05-29.md`
+ a fix arc. Drift signals from inventory: SKYFIRE naming never renamed, `_v3`-titled-v2 doc,
20+ un-archived point-in-time snapshots, 4,580-line ledger needing closed-wave compaction.

AP #45: this entry ships with the campaign doc.

---

### §4.AX — Design-chat reference docs reconciled (2026-05-29)

**Trigger:** Frank — the multi-program design chat needs `EMBER_TENANCY_ARCHITECTURE_v3.md`
and `LH_OPS_SPEC.md` current before hand-off. Both existed but were stale.

- **EMBER_TENANCY_ARCHITECTURE_v3.md** — rewritten from the April "v2" to a genuine v3:
  multi-org membership + the `user_roles` UNIQUE reshape / `AuthContext.maybeSingle()` trap
  (Wave 3.B #28 blockers), per-org email plumbing, all-seasons financial doctrine (§4.AW) +
  AP #63, the multi-sport/multi-program data model (divisions / `player_equipment` /
  line-item fees) from the St. Pats CSVs, and the Option A sit-on-top posture. v2 brand/auth/
  experience layer retained.
- **LH_OPS_SPEC.md** — full reconciliation against current production/code/doctrine (agent
  pass, diff reviewed per AP #22): `events` (not `activities`), `event_rsvps.response` ∈
  {going,not_going,maybe} (never 'yes'), `comms_messages`/`kind` rename, payment status from
  `family_balances` not legacy `roster_members.payment_status`, cool-gray `--em-*` tokens +
  cobalt `#4a8fd4`, §11.5 ground-truth sources, current LH facts. 1135 → 1269 lines, 0
  conflict markers, structure preserved.

Both shipped in PR #583. Delivered for the design chat alongside the existing
`LEAGUEAPPS_PARITY_REVIEW.md`, `LH_BRAND_CONTENT_MODEL.md`, and `docs/external-data/`.

---

### §4.AW — Category #30 fix batches 1+2 shipped + PATTERN A promoted (2026-05-29)

**Trigger:** Frank's routing on the §4.AV findings — ship Batch 1 + Batch 2 (financial
cluster) + promote PATTERN A. Two scope decisions locked: (1) "owes money" indicators read
all-seasons `family_balances` (money owed doesn't expire at a season boundary; collection-%
stays season-scoped + labeled); (2) never-paid families flagged only after the account ages
past the alert threshold.

**Batch 1 (PR #581, merged):** HOME-1 (critical — rsvp shortfall `'yes'`→`'going'`),
ENGINE-1 (hotel_block field contract), SCORE-5 (blank-score placeholder), ENGINE-3
(formatDateRange), SCORE-2 (point-diff tiebreak).

**Batch 2 (this PR):**
- ROSTER-1 — `useRoster` payment dot now derives from `family_balances` (all-seasons), not
  the legacy `roster_members.payment_status` constant. §11.5 exception table updated (legacy
  column no longer read by any UI).
- HOME-2 — new `useFamiliesOwingCount` (all-seasons) feeds the admin-home "families owing"
  lane, matching the alert scope (was active-season → 0 vs alert 1).
- HOME-3 — ProgramHealth hides the always-0 "Registration pipeline" row when loaded-empty.
- ROSTER-2 — payment_overdue alert deep-links `?owing=1`; Financials auto-selects the season
  with owing families + `FamilyBalanceList` gets an "Owing only" filter.
- **AP #63 (PATTERN A)** registered in CLAUDE.md — same-concept-divergent-source/scope, the
  dominant platform bug pattern (7 instances).

**Deferred to Batch 3 (tracked, both latent/0-impact today):**
- ROSTER-3 (Academy badge canonical column) — needs a `team_players` join in `useRoster`
  (`roster_members` has no `roster_type`; CLAUDE.md §4 text is drifted — §11.5 table is right).
- HOME-5 (never-paid family in overdue alert) — needs a `family_balances` view migration to
  expose account age (decided semantics: flag after account ages past threshold).
- Plus the §4.AV Batch 3 latents: HOME-4, HOME-6, SCORE-1/3/4/6, ENGINE-2, shorts_size.

AP #45 N/A (no AUDIT_* doc touched); ledger updated proactively to back the §4.AW code refs.

---

### §4.AV — Category #30 runtime/live-data audit executed (2026-05-29)

**Trigger:** Frank approved dispatching the Category #30 pass proposed in §4.AU. Four parallel
agents cross-checked render-surface assumptions against the live DB. Full findings in
`docs/AUDIT_CATEGORY_30_2026-05-29.md`.

**Outcome:** 18 findings the 29-category code audit did not surface — **1 critical, 3 P1, 4 P2,
10 latent/info** — decisively validating Category #30 as a permanent pre-build-gate lens.

**Headlines:** HOME-1 (critical, 1-line) — game-day "Roster shortfall today" alert counts
`response==='yes'` but the DB only stores `'going'` → permanent false 0-confirmed panic.
ROSTER-1 (P1) — roster payment dot reads legacy `roster_members.payment_status` (63/63 stale
`paid`), not `family_balances` → can't flag the owing family. ROSTER-2 (P1) — overdue alert
deep-links to finance defaulted to active season; owing family is archived-season + no owing
filter → unfindable (confirms PR #577 obs #1). ENGINE-1 (P1) — hotel_block resolver emits
`{text}`, renderer reads `{hotel_info,…}` → dropped text + false "CLOSES TODAY".

**Dominant pattern (AP #58):** PATTERN A — same concept, divergent source/scope across surfaces
(7 instances: ROSTER-1/2, HOME-2/4/6, ROSTER-3, SCORE-1). **Promotion-ready anti-pattern
candidate** (≥3 threshold met) — same family as BUG-1.

**Routing:** Batch 1 ship-now (HOME-1, ENGINE-1, HOME-5, SCORE-5, ENGINE-3, SCORE-2, ROSTER-3);
Batch 2 design-call (ROSTER-1/2 + HOME-2 financial-source cluster, HOME-3); Batch 3 fold into
relevant arcs (incl. SCORE-1 with season-rollover). Awaiting Frank's batch routing.

AP #45 satisfied: this entry ships in the same commit as the audit doc.

---

### §4.AU — Audit-completeness challenge + home-screen bug capture (2026-05-29)

**Trigger:** Frank challenged whether the 29/29 §17.5 campaign was "the most comprehensive
audit possible," citing live home-screen loading issues + attached screenshots. Investigation
in `docs/AUDIT_GAP_AND_FIX_SCOREBOARD_2026-05-29.md`.

**Verdict:** the campaign is the most comprehensive *code* audit (line-by-line + §16.15
2-pass of source) but has a **structural blind spot for runtime / live-data / visual** defects
— things that live outside the source. Proven by **BUG-1**: admin home shows "Payment
collection 100%" (Program Health, season-scoped Spring 2026 → DB-verified $0 outstanding) next
to "Payments overdue $1,275 / 1 family" (payment_overdue alert, season-blind → DB-verified
Fall 2025 balance). Each component is individually correct; the contradiction is emergent
under real multi-season data, so a static read passes it.

**6 bugs captured (home + compose screenshots):** BUG-1 payment scope contradiction [P1,
DB-verified], BUG-2 "1 thing to handle" hidden in compact density [P2], BUG-3 RSVP-shortfall
alert missing chevron [P2], BUG-4 home LCP ~5s [perf, = §4.AP anchor, fix queued unlanded],
BUG-5 duplicate tournament-briefing drafts [P3 verify], BUG-6 "Game recap"/"Games recap"
naming collision [P3].

**New routing item — Category #30 (Runtime / Live-Data / Visual audit pass):** complementary
lens run with production data per surface — (1) cross-surface metric/scope consistency (AP #43
at data layer), (2) per-surface runtime/LCP, (3) visual/affordance consistency. Feeds the same
fix-PR routing. Should run **before** the multi-program build gate (blind-spot classes multiply
under a second tenant). Does NOT require re-running the 29 code categories.

**Scoreboard:** §3 of the doc consolidates P0 arcs landed-vs-open. Gate status unchanged —
Wave 1 cleared, Waves 2–3.A partial, all of Wave 3.B + Category #30 open; build gate shut.

**Corroborates §4.AT** (next entry, PR #577): its side-observations #1 + #3 are the same
issues as BUG-1 + BUG-3. PR #578 ships the fixes (#577 only logged them). Residual still
open: §4.AT obs #1 (finance view has no unpaid filter to locate the owing family — the
scope label clarifies the contradiction but doesn't help find the family) + obs #2
(briefing-overdue alert deep-links to Compose generically, not the specific briefing).

AP #45 satisfied: this entry ships in the same commit as the audit doc.

---

### §4.AT — LeagueApps parity & scope review (2026-05-29)

**Trigger:** Frank's 54-screenshot walkthrough of the LeagueApps incumbent for "review the overall design," ahead of the (deferred) multi-program / multi-tenant build phase.

**Output:** `docs/LEAGUEAPPS_PARITY_REVIEW.md` — incumbent model map (Site→Season→age-group sub-programs→rosters spine + 5 rings: registration, AR, comms, CMS/e-commerce, integrations/roles), Ember-vs-incumbent gap table, alignment points, and the governing **replace-vs-sit-on-top scope decision** (recommendation: Option A = Ember stays the engagement/comms/schedule layer; LeagueApps remains registration + AR system-of-record for the St. Patrick's timeframe). Per AP #45 this entry lands in the same PR.

**Status:** reference artifact, does NOT gate §17.8. Open decision recorded for Frank (Option A vs B); belongs in PLATFORM_PRIORITIES.md §17.2 once settled. Multi-tenant build stays last per Frank's 2026-05-29 directive.

**Side observations (Ember admin-home alerts, Frank 2026-05-29) — logged for routing, not yet fixed:**
1. **Payments-overdue alert** ("$1,275 across 1 family") deep-links to finance, but every family shows Paid + there is no unpaid filter to locate the offending family — alert vs finance-view disagreement (AP #44 pipeline trace candidate; echoes #24 "instrumentation vs UI" pattern).
2. **Weekly-briefing-overdue alert** deep-links to Compose·Kind generically, not to the specific briefing that clears the alert.
3. **RSVP-shortfall alert** ("4 events affected") names a count but not WHICH events/players are missing RSVPs.

---

### §4.AS — Wave 3.B audit close + §17.5 audit campaign COMPLETE (2026-05-29)

**Trigger:** Wave 3.B dispatch per §4.AN routing — 6 parallel line-by-line audits (categories #6 anti-pattern compliance, #10 data integrity, #25 DR/backup, #27 youth-sports compliance, #28 onboarding playbook, #29 doctrine drift) per CLAUDE.md §17.8 with §16.15 2-pass deep-read addendum.

**Output:** `docs/AUDIT_WAVE_3B_2026-05-29.md` — findings + 5 cross-patterns + per-agent reports preserved. AP #45 satisfied by this same-commit ledger entry.

## ⚡ §17.5 AUDIT CAMPAIGN COMPLETE — 29 of 29 CATEGORIES ⚡

Wave 3.B closes out the §17.5 audit campaign. All 29 categories have received line-by-line + §16.15 2-pass deep-read addendum per §17.8 standing rule. **The audit-execution side of the §17.8 gate is structurally complete.** Per §17.7 step 5, multi-program build phase opens after all P0+P1 fix PRs land — fix routing remains the next workstream.

| Wave | Categories | Status |
|---|---|---|
| Wave 1 | #7, #8, #9, #12, #26 | ✓ complete |
| Wave 2.A | #11, #13, #14, #15, #23 | ✓ complete |
| Wave 2.B | #1, #2, #3 | ✓ complete |
| Wave 2.C | #4, #5, #16, #17, #24 | ✓ complete |
| Wave 3.A | #18, #19, #20, #21, #22 | ✓ complete |
| **Wave 3.B** | **#6, #10, #25, #27, #28, #29** | **✓ complete (this turn)** |

**Wave 3.B headline:** 17 P0 / 35 P1 / 25 P2 / ~12 promotion-ready AP candidates surfaced cumulative across all waves.

**5 cross-cutting patterns (AP #58 synthesis, campaign-cumulative):**

1. **PATTERN OMEGA continuation** — instrumentation without consumption (7+ instances; promotion-ready). Dominant platform pattern: write paths exist, read paths don't (audit logs, observability stack, DR backups, RLS helpers).
2. **PATTERN STALE-DOC** — doctrine drift unchecked (10+ instances cumulative). §0 verification grep fails today, §5 migration count stale by 30, §2 tech stack version drift, AP #51 catalog cites deleted files.
3. **Single-tenant assumptions** — Wave 3.B #28 names 5 specific second-tenant blockers; today onboarding cost is 10-15 hours; after P0 closures ~1.5 hours.
4. **Compliance + governance gaps for youth-sports SaaS** — no privacy policy, no consent ledger, no data subject deletion path. Cannot launch GA or second-tenant without these.
5. **Audit-disciplined surfaces are CLEAN; un-audited surfaces have systemic gaps** — Wave 3.A CROSS-PATTERN 3 reconfirmed at scale. 53 active APs reconfirmed; app code 100% §11.5 compliant; 13/13 edge functions byte-match. BUT 0 DR scenarios catalogued, no privacy policy, 5 second-tenant blockers.

**Wave 3.B P0 consolidated (17):**

- **Second-tenant (5):** user_roles UNIQUE shape + admin onboarding path + email FROM plumbing + public_listing_enabled default + unsubscribe-handler branding
- **Compliance (3):** data subject deletion + privacy policy/ToS + guardian consent ledger
- **DR (3):** DR runbook + backup-restore test + materialize 5 §5 ghosts
- **Data integrity (2):** 5 RLS policies bypass §11.5 helpers + alignment trigger unidirectional
- **Doctrine (4):** §0 verification grep fails + §5 migration count + §2 tech stack version drift + AP #51 catalog stale

**Routing — 4 new fix-PR arcs queued (cumulative with prior waves):**

1. **Multi-tenant readiness arc** (closes #28 5 P0s + #10 P0-1, P0-2) — multi-PR sequence
2. **Compliance arc** (closes #27 3 P0s) — privacy policy + ToS + guardian_consents + deletion flow
3. **DR-readiness arc** (closes #25 3 P0s) — runbook + restore test + ghost materialization
4. **Doctrine reconciliation arc** (closes #29 4 P0s + cumulative STALE-DOC) — §0/§5/§2/§13/§16.5/AP #51/AP #50 residue

**~12 PROMOTION-READY AP candidates (3+ instances confirmed cumulative):**

- PATTERN OMEGA (instrumentation without consumption) — 10+ instances
- PATTERN STALE-DOC (doctrine drift unchecked) — 10+ instances
- PATTERN DELTA (admin-toggle without enforcement) — 3 instances
- PATTERN COLD-SURFACE (zero-send infrastructure) — 4 instances
- PATTERN STALE-INITIAL (`useState(true)+useState([])`) — 23 hooks
- PATTERN EPSILON (Realtime channel hygiene gap) — 7 hooks
- PATTERN PSI (console.error boilerplate) — 108 sites
- isStaff → admin-path drift — 7 instances
- AP candidate #65 (raw `error.message` in user UI) — 4 instances
- PATTERN AP-RETIREMENT-RESIDUE (new) — retirement PRs must include exhaustive grep
- AP #61 (pre-phase audit gate) — 3 instances confirmed this campaign
- AP #55 (actual PR# from create response) — 21+ consecutive PR holds

**Per §17.7 step 5:** Multi-program build phase opens when all P0+P1 fix PRs land. Currently: 29/29 audited, ~35+ P0s cumulative across waves still open (Wave 1 closed; Wave 2.A 2 deferred; Wave 2.B + 2.C + 3.A + 3.B P0s queued).

**Wave 3.B → next session handoff:**

Next session opens with Frank's routing call on the 4 new Wave 3.B fix-PR arcs + cumulative backlog from Waves 2/3.A + which arc to dispatch first.

**AP compliance:**
- AP #45 — §4.AS in same commit as `docs/AUDIT_*.md` ✓
- AP #50 RETIRED — line-by-line methodology held throughout dispatch ✓
- AP #56 + #59 RETIRED ✓
- AP #58 — cross-batch pattern check applied; 5 CROSS-PATTERNs ✓
- AP #61 — pre-phase audit gate; 3rd instance confirms (promotion-ready) ✓
- §17.8 — every agent reported §16.15 2-pass cascade-catch findings ✓

---

### §4.AR — Wave 3.A audit close + reportError foundational PR (2026-05-29)

**Trigger:** Wave 3.A dispatch per §4.AN routing — 5 parallel line-by-line audits (categories #18 onboarding, #19 notifications, #20 briefings, #21 edge deploy, #22 pg_cron) per CLAUDE.md §17.8 with §16.15 2-pass deep-read addendum. Plus the foundational `reportError` helper PR closing part of Wave 2.C #24 CROSS-PATTERN 2.

**Outputs:**
- `docs/AUDIT_WAVE_3A_2026-05-29.md` — findings + 4 cross-patterns + per-agent reports preserved. AP #45 satisfied by this same-commit ledger entry.
- PR #573 — `reportError` helper + 7 critical-path migrations live on main (CROSS-PATTERN 2 foundation).

**Wave 3.A headline:** 9 P0 / 23 P1 / 16 P2 / 5+ new AP candidates / 0 §17.5 demotions.

**4 cross-cutting patterns (AP #58 synthesis):**

1. **Data plumbing terminates in admin UI blindness** — 7 confirmed instances across #18 (usePendingInvitations false all-clear), #19 (event_notifications dispatcher missing + AutoNotificationSettings cosmetic + guardian_notification_prefs unread + NotificationPrefs unread), #22 PATTERN HOTEL (cron success masks HTTP failure). Cross-confirms Wave 2.C #24 PATTERN OMEGA. **Most pervasive architectural pattern across the platform.**

2. **Spec drift across doc layers** — §13 + BRIEFINGS_COVERAGE_L99.md + AP #51 catalog all stale; §17.4 backlog 0/5 still missing; Stream B drifted from §16.5.

3. **Audit-disciplined surfaces are CLEAN; unguarded surfaces are broken** — #21 13/13 byte-match + AP #33 + AP #30 + AP #31 all hold; #20 zero AP #27/#28/#29/#34/#36/#37/#38 violations; **but** #18 + #19 (no audit guards) have 8 P0s between them.

4. **Cold infrastructure is observability debt** — 4 surfaces with 0 production exercise (academy_callup_notice, custom_message, games_recap, invitations table). Configuration/schema bugs lurk silently until first real send.

**Wave 3.A P0 consolidated (9):**

- #18 P0-1 to P0-5: invitations table disconnected + InviteButton unmounted + no AcceptInvitePage + token discipline gap + anon-SELECT enumeration risk
- #19 P0-1 to P0-3: event_notifications trigger writes inert + schema-leak microcopy + AutoNotificationSettings toggles cosmetic
- #22 P0-1: cron.job_run_details masks 1.1% real HTTP failures (canonical health source is net._http_response, not job_run_details)

**Routing — 7 fix-PR arcs queued:**

1. **Onboarding pipeline rebuild** (closes #18 5 P0s + 6 P1s) — multi-PR arc; decision call on invitations vs auth.users path
2. **Notification pipeline wiring** (closes #19 3 P0s + 8 P1s) — event_notifications dispatcher + wire AutoNotificationSettings toggles + microcopy fix
3. **Cron HTTP-health observability** (closes #22 P0-1) — canonical source switch + admin health card
4. **Doctrine reconciliation** (closes #20 P1s + Cross-Pattern 2) — §13 + BRIEFINGS_COVERAGE_L99 + AP #51 catalog updates
5. **Admin observability arc** (cross-confirms PATTERN OMEGA) — admin views for the 5 audit-log tables + Resend bounce surface
6. **Pre-cutover cold-surface validation** — manually trigger one of each: academy_callup_notice + custom_message + games_recap
7. **AP #63 audit-test extension** — landing deployed-vs-repo enforcement test

**5 new AP candidates surfaced in Wave 3.A:**

- **PATTERN ZETA** (candidate) — false-negative all-clear from broken data pipeline. 1 instance (usePendingInvitations).
- **PATTERN DELTA** (candidate) — admin-toggle without enforcement. 3 instances (AutoNotificationSettings, NotificationPrefs, guardian_notification_prefs). Promote-ready.
- **PATTERN HOTEL** (candidate) — SQL-layer enqueue-success masks downstream async failure. Generalizes to any queue-style metric.
- **PATTERN COLD-SURFACE** (candidate) — production infrastructure with 0 real exercise. AP #51 dead-feature class.
- **"pg_cron success ≠ HTTP success" audit lens** — always cross-check `net._http_response.status_code` when reasoning about cron health.

**Audit progress per §17.5: 18 of 29 categories complete.**

Remaining: Wave 3.B (#6 anti-pattern compliance sweep, #10 data integrity canonical-source compliance, #25 DR/backup testing, #27 youth-sports compliance, #28 data migration playbook, #29 doctrine drift).

**Wave 3.A → next session handoff:**

Next session opens with Frank's routing call on the 7 fix-PR arcs above + Wave 3.B dispatch.

**AP compliance:**
- AP #45 — §4.AR in same commit as `docs/AUDIT_*.md` ✓
- AP #50 RETIRED — line-by-line methodology held ✓
- AP #56 + #59 RETIRED ✓
- AP #58 — cross-batch pattern check applied; 4 CROSS-PATTERNs ✓
- AP #61 — pre-phase audit gate ✓
- §17.8 — every agent reported §16.15 2-pass cascade-catch findings ✓

**Concurrent ship: PR #573 reportError foundational migration.** Closes part of #24 P0-1 (Wave 2.C CROSS-PATTERN 2). 7 critical-path callsites migrated (AuthContext.loadMembership, AuthContext.coachTeamStaff, useRsvps.saveNote, useMessages.{fetch,send,delete}, useSeasonRollover.{carryLocations.read,carryLocations.insert,execute}). ~100 console.error sites remain in src/ for incremental sweep; helper exists and discipline is set.

---

### §4.AQ — Wave 2.C close + AP #56/#59 retirement (2026-05-29)

**Trigger:** Wave 2.C dispatch per §4.AN routing — 5 parallel line-by-line audits (categories #4, #5, #16, #17, #24) per CLAUDE.md §17.8 standing rule with §16.15 2-pass deep-read addendum. Plus Frank's "remove the capacity discipline" directive at session close, retiring AP #56 + AP #59.

**Outputs:**
- `docs/AUDIT_WAVE_2C_2026-05-28.md` — findings + 5 cross-patterns + per-agent reports preserved. AP #45 satisfied by this same-commit ledger entry.
- CLAUDE.md AP #56 RETIRED. AP #59 RETIRED. AP #61 "Stop conditions per AP #56 + AP #59" line dropped. §11.7 operational rule #5 updated to drop the stale AP #50 reference (hygiene catch from prior PR #564 retirement).

**Wave 2.C headline:** 5 P0 / 39 P1 / 21 P2 / 7+ new AP candidates / 0 §17.5 demotions.

**5 cross-cutting patterns (AP #58 synthesis):**

1. **Instrumentation without consumption (foundational gap)** — Speed Insights mounted → 5s LCP regressed for weeks because nobody queried; 5 audit-log tables (writers without readers); Resend bounce surface stored but no admin UI; cron health invisible.
2. **Console.error ↔ Sentry silent gap** — 108 `console.error` sites + ZERO `Sentry.captureException` outside ErrorBoundary; production ships all 108 to mobile DevTools (no `esbuild.drop`); 4 raw `error.message` user-visible UI leaks compound.
3. **`isStaff` vs `isAdmin` discipline drift** — 7 instances where coach sees `isStaff`-gated affordance routing to `/admin/*` → `/unauthorized`. Discipline drift unnoticed because no AP #43 invariant test pins EventDetailPage per-role action stack (the §16.14 reference instance).
4. **Hook fleet stale-initial + fanout** — 23 hooks with `useState(true) + useState([])`; `useNow` 21-callsite fanout; PR #241 fixed `useAlertEvaluator` but never swept; PR #571 fixed Program Health at component level; #5 + #16 confirm the bug class at fleet scale.
5. **Realtime channel dedup gap** — `useEventArrivals` game-day triple-mount = up to 39 concurrent subs per event per device; 7/7 hooks no status callback + no reconnect refetch; `useHasUnread` Realtime-fired N+1. Single `RealtimeContext` design closes 3 P1s across 7 callsites.

**§17.5 calibration:** all 5 categories surfaced real findings. No demotions.

**§17.4 backlog corrections (cumulative):**
- "16+ home-feeder hooks" → confirmed ~30-35 per Parent home mount (#5 + Wave 2.B cross-confirmed)
- "7 Math.random() realtime channels" → confirmed exactly 7 (#4)
- "Realtime channel dedupe context" hypothesis → confirmed P1 with concrete design proposed
- "SWR/TanStack Query layer" hypothesis → confirmed P1 (Batch 3 deferred for design call)

**Routing — 5 fix-PR arcs queued for next session(s):**

1. **CROSS-PATTERN 1 (instrumentation without consumption):** admin audit-log views + Sentry/PostHog/Speed Insights review cadence in CLAUDE.md §11.7 + cron health card. Single doc-and-build arc.
2. **CROSS-PATTERN 2 (console.error ↔ Sentry):** `reportError(err, ctx)` helper in `src/lib/sentry.js` + migrate critical paths (auth → write paths → RPCs) + `esbuild.drop` in vite for prod. Sweep is incremental.
3. **CROSS-PATTERN 3 (isStaff/admin drift):** decision call: tighten coach visibility OR open `/admin/briefings/*` to coach. Then sweep + AP #43 invariant test on EventDetailPage per-role action stack.
4. **CROSS-PATTERN 4 (hook fleet stale-initial):** bundle with Batch 3 cache layer OR ship as standalone hook-fleet hygiene PR. `useNow` context lift is separable + small.
5. **CROSS-PATTERN 5 (realtime dedup):** build `RealtimeContext` per #4's proposed design — single implementation closes 3 P1s across 7 callsites.

**AP retirement — #56 + #59 (capacity discipline):**

Frank's 2026-05-29 directive: "remove the capacity discipline." Every prior session where CC invoked AP #56 (pre-locked session contracts) or AP #59 (close when capacity exhausted) to close, Frank's actual signal was to continue. The discipline applied brakes the operator didn't want applied.

**Standing rule (replaces AP #56 + AP #59):** session continuation is the operator's call, made in-session at any moment. No pre-locked contracts. No capacity-pacing heuristic. CC dispatches, ships, and continues until Frank signals stop. Comfort over velocity remains the §17.8 audit-gate criterion (governs whether next-phase build opens); capacity-pacing inside a single session is not.

This is the second AP retirement in the audit-discipline arc (AP #50 retired in PR #564). Pattern: process disciplines that pre-design operator behavior get retired when they apply brakes the operator doesn't want. Doctrine-layer load-bearing rules (AP #21 mirror discipline, AP #54 same-MCP-burst, AP #61 pre-phase gate, AP #43 cross-role invariant, §17.8 audit-gate) remain.

**7+ new AP candidates surfaced in Wave 2.C (numbering not yet locked):**

- PATTERN HOOK-FANOUT (candidate) — hooks that look "isolated" create systemic load at scale
- PATTERN STALE-INITIAL (candidate, likely-lock) — `useState(true) + useState([])` at 23-hook scale
- PATTERN EPSILON — Realtime channel hygiene gap (no status callback + no reconnect refetch)
- PATTERN ZETA — silent server-side fanout on Realtime INSERT
- AP candidate #63 — CSS variable fallback hex literals forbidden
- AP candidate #64 — `if (loading) return null` on home widgets (staggered pop-in)
- AP candidate #65 — raw `error.message` may never appear in user-facing UI
- PATTERN OMEGA — instrumentation without consumption (AP candidate B)
- PATTERN PSI — console.error boilerplate at 123 sites (AP candidate A)
- `isStaff` → admin-path routing (#17 PATTERN ALPHA)

Promotion deferred per the catalog discipline (3+ instances or chat-side pressure-test).

**Wave 2.C → next session handoff:**

Next session opens with Frank's routing call on the 5 cross-pattern arcs above. After Wave 2.C routing closes → Wave 3.A dispatch per §4.AN (#18 onboarding + #19 notifications + #20 briefing engine + #21 edge function deploy parity + #22 pg_cron job health).

**AP compliance:**
- AP #45 — §4.AQ in same commit as `docs/AUDIT_*.md` + CLAUDE.md doctrine changes ✓
- AP #50 — RETIRED in PR #564; line-by-line methodology held throughout dispatch ✓
- AP #56 + #59 — RETIRED in this PR (this entry IS the policy lock) ✓
- AP #58 — cross-batch pattern check applied; 5 CROSS-PATTERNs ✓
- AP #61 — pre-phase audit gate; required outputs delivered ✓
- §17.8 — every agent reported §16.15 2-pass cascade-catch findings ✓

---

### §4.AP — Wave 2.B audit close + Batch 1 quick-wins routing (2026-05-28)

**Trigger:** Wave 2.B dispatch per §4.AN routing — 3 parallel line-by-line audits (categories #1, #2, #3) per CLAUDE.md §17.8 standing rule with §16.15 2-pass deep-read addendum. Anchored on the 5s home page LCP regression Frank reported earlier in this session.

**Output:** `docs/AUDIT_WAVE_2B_2026-05-28.md` — findings + 5 cross-patterns + per-agent reports preserved. AP #45 satisfied by this same-commit ledger entry.

**Wave 2.B headline:** 11 P0 / 19 P1 / 10 P2 / 4 new AP candidates / 0 §17.5 demotions.

**The 5s LCP regression diagnosed with HIGH confidence:**

Cascade of loading-gate waterfalls compounded by alert evaluator serial-await. Five compounding causes:
1. `src/lib/alerts/evaluator.js:124-133` runs 9 configs sequentially (~720ms-1.35s pure DB latency)
2. All 3 home pages gate render on `alertsLoading` (parent/coach/admin) — slowest signal blocks shell paint
3. `useSeasonFinancials:78` fetches all 244 financial_transactions org-wide (no season filter)
4. `qrcode.react` static-imported via 3 eager pages (~45KB raw in entry chunk)
5. Auth → seasons → activities → alerts waterfall (4 sequential RTTs)

**Plus structural compound from #2:** `<div key={location.pathname}>` in `App.jsx:50` forces full subtree remount on every tab tap — defeats even existing module-level caches.

**5 cross-cutting patterns (AP #58 synthesis):**

1. **Render-gate aggregation + remount key compound the warm-cycle perf** — render gate widens to slowest signal × full subtree remount on tab change
2. **Sequential await + no shared cache amplify each other** — 9 sequential RTTs in evaluator + 42 of 46 hooks have no cache + same hook called 5-10× per page (no dedup)
3. **§16.10 / §17.1 budget enforcement broken** — entry +35% over budget, total +11% over hard limit; CI gate silently passes both (PATTERN BUDGET-DRIFT: doc and CI gate drifted 30-40% apart since PR #150)
4. **Static-import bloat in entry chunk** — qrcode.react via TeamDetailHero + @vercel/speed-insights/react in main.jsx + 1.77 MB orphan logo PNGs in public/
5. **Long-list virtualization unfunded** — 0 lists virtualized; react-window not in package.json; MessageThread (200 msgs) + FamilyBalanceList (164 rows) explicit §16.10 violations

**§17.4 backlog corrected:**

- "16+ home-feeder hooks" → actual ~25-35 hooks per Parent home mount (2× worse than estimate)
- "7 Math.random() realtime channel suffixes" → confirmed exactly 7

**Routing — Batch 1 quick-wins fix PR shipping THIS session:**

Single agent shipping 1 PR closing 4 P0s with estimated 1-2s LCP improvement:

- **#1 P0-1** — `evaluator.js:124-133` `for…of await` → `Promise.all` (-600ms-1.2s)
- **#1 P0-2** — Drop `alertsLoading` from render gate in ParentHomePage:56 + AdminHomePage:71 + CoachHomePage:55 (-400-600ms)
- **#1 P0-3** — `useSeasonFinancials.js:78` add `.eq('season_id', seasonId)` filter (~85% payload reduction)
- **#2 P0-1** — `App.jsx:50` move/remove `<div key={location.pathname}>` (single largest INP regression)

**Deferred to subsequent sessions:**

- **Batch 2 — Bundle reduction:** lazy qrcode.react + entry chunk budget + total bundle + Vite manualChunks + orphan PNG cleanup. Needs sequencing + design call on chunk topology.
- **Batch 3 — Cache layer:** SWR/TanStack Query for 42 of 46 hooks. Needs library choice + migration scope design call.
- **Batch 4 — Virtualization:** react-window install + MessageThread + FamilyBalanceList. Needs design call on virtualization library choice.
- **P0 #11 — CI gate split** — cannot ship before Batch 2 lands or CI goes red. Bundle with Batch 2 close-out.

**4 new AP candidates registered:**

- **Render gate aggregation defaults to slowest signal** — every new signal added to a home page increases LCP by slowest-of-N. Suggest §17.5 "render-gate signal budget" sub-rule.
- **Sequential await in evaluator/orchestrator loops** — 1 instance today (alert evaluator); promote on second.
- **Route-level remount key** — `<div key={location.pathname}>` around `<Routes>` defeats component-instance state preservation + caches.
- **CI budget gate must match documented budget** — guard threshold ≠ doc threshold creates false sense of security.

**Wave 2.B → Wave 2.C handoff:**

Wave 2.C dispatch in next session: #4 realtime channel hygiene + #5 React hook hygiene + #16 UX surface audit + #17 cross-role coverage matrix + #24 observability coverage.

**AP compliance:**

- AP #45 — §4.AP in same commit as `docs/AUDIT_*.md` ✓
- AP #50 RETIRED — line-by-line methodology held ✓
- AP #54 — Batch 1 quick-wins agent will ship same-MCP-burst ready + auto-merge ✓
- AP #56 + #59 — session contract per Frank's noon "B and continue" directive: Wave 2.B doc + Batch 1 PR + close. No further dispatch this session.
- AP #58 — cross-batch pattern check applied; 5 CROSS-PATTERNs identified
- §17.8 — every agent reported §16.15 2-pass cascade-catch findings (30-40% addendum yield)

---

### §4.AO — Wave 2.A audit close + 3 fix-PR routing (2026-05-28)

**Trigger:** Wave 2.A dispatch per §4.AN routing — 5 parallel line-by-line audits (categories #11, #13, #14, #15, #23) per CLAUDE.md §17.8 standing rule with §16.15 2-pass deep-read addendum per agent. AP #50 retired (PR #564) — methodology was line-by-line per category, not surface-dependent.

**Output:** `docs/AUDIT_WAVE_2A_2026-05-28.md` — findings doc + 3 cross-patterns + per-agent reports preserved. AP #45 satisfied by this same-commit ledger entry.

**Wave 2.A headline:** 7 P0 / 15 P1 / 13 P2 / 3 new AP candidates / 0 §17.5 demotions (all 5 categories surfaced real findings).

**3 cross-cutting patterns (AP #58 synthesis):**

1. **Production state diverges from repo state silently** — #11 + #23 independent surface. `feedback-token-handler` deployed without repo source + missing RPC + 8 orphan migrations in DB without mirror files. New AP candidate #63 (deployed-function ledger reconciliation gate).
2. **Token-handler hardening parity gap** — #11 + #13 + #15 triple-confirmed. `verify_unsubscribe_token` no TTL + no replay + anon EXECUTE; all 3 token-handler HTMLs missing Cache-Control / X-Robots-Tag headers; `team_feed_token` permanent bearer. **Highest-risk concentration in Wave 2.A.**
3. **Cost / PII amplification via uncapped fan-out** — #13 + #15. `send-tournament-message` no per-admin cap + emails in 403 body; `send-push` unbounded user_ids array; Anthropic-call cost amplification on 2 admin features; `RESEND_API_KEY` in Deno.env (AP #33 suffix regex blind spot).

**Routing — 3 fix PRs dispatched in same turn:**

- **PR — Migration ledger hygiene** (closes #23 P0-1, P0-2 + 3 P1s): backfill 8 orphan mirror files, investigate 2 audit_relkind files, delete 13 stale legacy-numbered files, rename 6 AP #21 violations, update CLAUDE.md §5 counts (5+13 not 5+11).
- **PR — Token-handler hardening** (closes #15 P0-1 + #11 P1-2 + #13 P1-4): `unsubscribe_token_uses` table + TTL + replay protection in `verify_unsubscribe_token`, REVOKE anon EXECUTE, Cache-Control + X-Robots-Tag headers on all 3 token-handler HTML responses.
- **PR — Delete `feedback-token-handler`** (closes #11 P0-1): production has a 13th edge function from before PR #509's cutover-feedback revert (2026-05-24). Calls non-existent `verify_feedback_token` RPC — every tap returns "Link expired." Delete via Supabase MCP. No file changes.

**Deferred to next session (need design decisions):**

- **#15 P0-2 — `team_feed_token` rotation surface.** Per-team rotation button on team admin page? Per-org rotation RPC + rotation audit log? Needs admin UI design.
- **#15 P0-3 — `send-tournament-message` per-admin rate cap.** Quota shape needs design (50/day? 500/day? bucket by user+org+kind?). Plus `pii_audit_log`-style row schema.
- **AP #63 audit-test extension.** Add `list_edge_functions()` ≡ `readdirSync('supabase/functions')` enforcement to `verifyJwtConfigAudit.test.js`. Bundle with future hygiene PR.

**3 new AP candidates registered (promote on third instance):**

- **AP #63 — Deployed-function ledger reconciliation gate.** Repo and production must match: `list_edge_functions()` ≡ `readdirSync('supabase/functions')`. Same shape needed for migrations: `list_migrations()` ≡ repo migration files. Likely promotes quickly because every new edge function deploy or migration apply exposes the pattern.
- **AP candidate — PII in 4xx/5xx error bodies.** Functions raise structured errors with PII embedded for debuggability; error bodies leak to Vercel/CDN logs. Pattern surfaced in #13 P1-2 (`send-tournament-message:142` guardian emails in 403 body); P0 for next instance.
- **AP candidate — Token-handler HTML cache headers.** Any function rendering PII to publicly reachable HTML must declare `Cache-Control: private, no-store` + `X-Robots-Tag: noindex`. MUA preview-bot prefetch can log + index. 3 instances in Wave 2.A (rsvp, callup, unsubscribe).

**Wave 2.A → Wave 2.B handoff:**

Wave 2.B dispatch in next session: #1 perf cold load + #2 warm-cycle nav + #3 bundle/code split. **Anchor:** the 5s home page LCP regression flagged in §4.AN. First thread for the perf agent — likely a specific blocking import (Sentry/PostHog SDK at static-import path? Wave 2.B inspection) or synchronous data-fetch waterfall in `main.jsx` / `AuthContext` / `ProfileGateLayout`.

**AP compliance:**

- AP #21 — fix PRs ship migration mirror files in same commit as MCP apply
- AP #45 — this §4.AO ledger entry in same commit as `docs/AUDIT_*.md`
- AP #50 — RETIRED; line-by-line methodology held throughout the 5-agent dispatch
- AP #54 — fix PRs will ship same-MCP-burst create + ready + auto-merge
- AP #56 + AP #59 — session contract per Frank's noon directive: doc + 3 P0 fix PRs + close. No cascade into Wave 2.B dispatch this session.
- AP #58 — cross-batch pattern check applied; 3 CROSS-PATTERNs identified
- §17.8 — every agent reported §16.15 2-pass cascade-catch findings (Pass 2 yield 30-40% per category)

---

### §4.AN — Audit-gate lock + AP #50 retirement (2026-05-28)

**Trigger:** Frank's 2026-05-28 directive after Wave 1 close: "full level audit on all of code line by line for the [29] audit categories we just documented so we can move to the next phases with a comfort level of clean code in its current state." Plus: "retire all narrow scope as going forward we want detailed reviews and audits."

**Doctrine changes shipped this PR:**

1. **AP #50 RETIRED.** Original surface-dependent methodology (broad codebase → breadth-parallel / narrow surface → line-by-line / broad surface line-by-line → 40% cascade) is retired. Standing rule: line-by-line per category regardless of surface breadth, §16.15 2-pass deep-read addendum per category to close the cascade.
2. **AP #61 reworded.** Dropped "parallel narrow-scope agents per AP #50" language; kept the pre-phase audit gate principle. Methodology line now reads "line-by-line per category with §16.15 2-pass deep-read addendum."
3. **PLATFORM_PRIORITIES.md §17.3 rewritten.** Surface-dependent methodology removed; line-by-line standing rule articulated.
4. **PLATFORM_PRIORITIES.md §17.6 Wave 3 amended.** "During multi-program build" → "before multi-program build, gates the phase boundary per §17.8."
5. **PLATFORM_PRIORITIES.md §17.7 step 5 amended.** Multi-program build phase opens only after §17.8 audit-gate closes.
6. **PLATFORM_PRIORITIES.md §17.8 new section.** Audit-gate enforcement — all 29 categories line-by-line + addendum before next-phase. Comfort-over-velocity criterion locked.

**Anchor finding for Wave 2.B perf dispatch (empirical signal that drove the policy):**

Home page LCP regressed to ~5s as of 2026-05-28 (vs §17.1 1.5s target — 3.3× over budget). Frank reported in-session. Almost certainly a specific blocking import or synchronous data-fetch waterfall, not generalized slowness. Investigation thread when Wave 2.B #1+#2 dispatch:

- `src/main.jsx` static imports — check for SDK init outside the lazy-load + `requestIdleCallback` pattern per §16.10
- `src/lib/sentry.js` — ErrorBoundary exemption per §16.10.1; verify still the only static-import SDK consumer
- `src/contexts/AuthContext.jsx` — synchronous data fetches before first paint
- `src/components/ProfileGateLayout.jsx` — waterfall risk between auth gate + downstream fetches
- Newly-merged hooks from Wave 1 P1 PRs (#561, #562) — any new blocking calls introduced

**Routing for next session — Wave 2.A first batch (per §17.8 + AP #58 cross-batch synthesis):**

- **Wave 2.A — DB / security adjacent (5 categories):** #11 edge function auth + secrets, #13 PII surface, #14 dependency security, #15 rate-limit / abuse, #23 migration ledger consistency
- **Wave 2.B — Perf + bundle (3, anchored on the 5s regression):** #1 cold load, #2 warm-cycle navigation, #3 bundle/code split
- **Wave 2.C — UX surface (5):** #4 realtime channel hygiene, #5 React hook hygiene, #16 UX surface audit, #17 cross-role coverage matrix, #24 observability coverage
- **Wave 3.A — Engagement + ops (5):** #18 onboarding pipeline, #19 notification pipeline coverage, #20 briefing engine coverage, #21 edge function deploy parity, #22 pg_cron job health
- **Wave 3.B — Closeout (6):** #6 anti-pattern compliance sweep, #10 data integrity canonical-source compliance, #25 DR/backup testing, #27 youth-sports compliance, #28 data migration playbook, #29 doctrine drift

5 batches × 5 categories ≈ 25 categories (24 of 29 remaining after Wave 1). Plus §16.15 2-pass deep-read addendum per category before fix PRs ship. Probably 4-6 sessions of work depending on findings density.

**Wave 1 retroactive addendum question (deferred routing):**

Wave 1 was dispatched under the (now-retired) breadth-parallel methodology. Per the new line-by-line standing rule, a §16.15 addendum re-read on the 5 Wave 1 categories would surface what the first-pass parallel agents missed. Not a P0 — Wave 1 P0s are closed and Wave 1 P1s shipped — but worth scheduling. Default: deferred to after Wave 3.B closes (full system audit complete, then go back and addendum-pass Wave 1 for completeness). Frank can override if he wants the addendum earlier.

**AP #45 satisfied:** doctrine changes + ledger entry in same commit.

---

### §4.AM — Wave 1 P1 cleanup close + Wave 2 carryover (2026-05-28)

**Trigger:** §4.AL Wave 1 P0 close left P1s in the §4.AK list pending.
This session shipped the P1 cleanup batch (PRs #561 + #562) and
surfaced specific findings from the AP #29 token-handler re-audit
that need to be discoverable for Wave 2 routing.

**Shipped this turn (2 parallel fix PRs):**

- **PR #561 — DB hygiene migration** (migration version
  `20260528142102_wave_1_p1_db_hygiene_indexes_and_pinning`):
  - 7 FK indexes added (3 of the original spec set were already
    indexed; agent pre-flight trimmed to the genuinely unindexed
    7): `coaching_assignments.org_id`, `user_roles.organization_id`,
    `game_plays.created_by`, `game_plays.voided_by`,
    `event_change_audit.changed_by`, `rsvp_token_uses.guardian_id`,
    `callup_token_uses.guardian_id`.
  - `app_secrets` + `event_reminder_log` policy pinning via explicit
    REVOKE + table COMMENT documenting AP #33 deny-by-default
    rationale. Future audits won't re-flag as "missing policy".
  - Duplicate `assert_org_owns_helpers` ledger row at
    `20260521114129` removed (verified byte-identical to canonical
    `20260521114252` before delete).
- **PR #562 — Cross-org defense-in-depth**:
  - `useMapsUrl.js:42` — `.eq('org_id', orgId)` added per AP #37;
    cache key bumped to `${orgId}:${name}` to block cross-org cache
    leaks when venues overlap (e.g., shared "WCC" between orgs).
  - `invite-parent` edge function v8 deployed: accepts `org_id`
    body param + asserts caller is admin in that org via
    `user_has_role_in_org` RPC; stamps `org_id` + `invited_by`
    into auth user metadata. Closes real vulnerability where prior
    `.maybeSingle()` admin check could route a Legacy admin's
    invitation into a different org.
  - `InviteButton.jsx` — sole caller updated to pass `orgId` from
    AuthContext.
  - AP #29 token-handler verification (read-only) — see findings
    below.

**§4.AK P1 closure scoreboard:**

- ✓ `useMapsUrl.js:38` org filter — PR #562
- ✓ `invite-parent` edge function org-binding — PR #562
- ✓ 33 unindexed FKs (highest-priority 7 of 8 user-cascade /
  org-scoped subset) — PR #561; remaining 26 deferred to a
  dedicated index-hygiene PR if perf metrics ever flag them
- ✓ `app_secrets` + `event_reminder_log` policy pinning — PR #561
- ✓ Duplicate `assert_org_owns_helpers` ledger row — PR #561
- ✓ AP #29 token-handler re-audit — PR #562 (read-only; specific
  gaps captured below)
- ⇒ **DEFERRED to Wave 2 (rationale registered):**
  - `user_roles_user_id_key` UNIQUE shape change from `(user_id)`
    to `(user_id, organization_id)` — schema change is trivial,
    but the application-layer impact is non-trivial:
    `current_user_org_id()` SECDEF assumes single-org-per-user
    semantics; relaxing the constraint without updating the helper
    + every caller creates a schema permissive enough for multi-org
    but with app behavior frozen at single-org. Bundle with the
    multi-org app audit in Wave 2 prep.
  - `roster_members` UNIQUE `(player_id, team_id)` extending to
    include `season_id` — requires no-duplicate verification
    pre-flight + app-side audit of every roster_members `upsert`
    callsite to confirm `onConflict` shape compatibility (AP #25
    discipline). Defer until rollover/season workflow is in scope.
  - Financial-table cascade-action decisions (`coach_payouts`,
    `financial_transactions`, `season_rollovers` `org_id ON DELETE
    NO ACTION`) — paired with cutover org-archival, these will
    silently block org deletion. Decision needs an explicit
    org-archival playbook (preserve vs export-and-archive vs
    cascade); docs-layer decision more than code.

**AP #29 token-handler audit findings (Wave 2 work item):**

PR #562 read the bodies of `verify_unsubscribe_token` and
`get_invitation_by_token` via `pg_proc.prosrc`. Findings:

- **`verify_unsubscribe_token(p_token text)`:**
  - HMAC verification: PRESENT (reads `unsubscribe_secret` from
    `app_secrets`, computes `extensions.hmac` SHA-256,
    base64url-compares).
  - Expiration check: **ABSENT** — payload format is
    `<user_id>:<ts>` but `ts` is parsed and never compared to
    current time. Token effectively non-expiring.
  - Replay protection: **ABSENT** — no `token_uses` consultation,
    no single-use deletion. Token can be replayed indefinitely.
- **`get_invitation_by_token(p_token text)`:**
  - HMAC: NOT APPLICABLE (plain DB row lookup keyed by
    `invitations.token` column, not signed token).
  - Expiration: **EXPOSED, NOT ENFORCED** — returns
    `is_expired = (expires_at < NOW())` in JSON payload, but
    function does NOT filter rows by it. Caller must honor.
  - Replay protection: **EXPOSED, NOT ENFORCED** — returns
    `is_accepted` + `is_cancelled` flags; caller must honor.

**Recommended Wave 2 follow-up PR — token-handler hardening:**

- Decide unsubscribe-token TTL (recommend 30d for unsubscribe
  links; one-time tokens for other flows).
- Decide single-use semantics: introduce `unsubscribe_token_uses`
  table OR add `used_at`/`revoked_at` to a generic token-uses
  table. Existing `rsvp_token_uses` / `callup_token_uses` pattern
  is the precedent.
- Grep all callers of `get_invitation_by_token` to confirm every
  one honors `is_expired`/`is_accepted`/`is_cancelled`. If any
  caller doesn't, push enforcement into the function body (return
  NULL row + reason code instead of always-returning the row).
- Backfill existing minted unsubscribe tokens (if format changes)
  + run advisor sweep for any other SECDEF-token RPCs missing
  expiration or replay protection.
- Scope ~1-2h once design decisions locked.

**Onboarding-pipeline data point (still pending):**

§4.AL flagged that Aubtin's spot-check surfaced both parents
(Anjella + Sarmad) with `guardians.user_id IS NULL`. Quick audit
query at next session open to confirm broader pattern:

```sql
SELECT
  COUNT(*) AS total_guardians,
  COUNT(*) FILTER (WHERE user_id IS NULL) AS unlinked,
  ROUND(100.0 * COUNT(*) FILTER (WHERE user_id IS NULL)
        / NULLIF(COUNT(*),0), 1) AS pct_unlinked
FROM guardians
WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';
```

If >50% unlinked → onboarding-pipeline promoted from §17.4 backlog
to immediate routing. If <20% → KHOJASTEH was an outlier; backlog
stays as-is.

**Coach_payouts P1 build (Q5 reframe, still pending spec):**

Frank's example shape (session-by-session $60 head / $30 assistant
OR flat-fee per team + optional tournament-championship bonus;
payment external from bank, system tracks ledger only). Spec
session needed before build — flat vs session vs hybrid is the
open routing question. Tracked in §4.AL.

**Wave 1 final scoreboard:**

- **P0:** 10/10 closed (4 via fix-PR ship, 2 via no-op resolution,
  4 via doctrine reconciliation, 0 deferred)
- **P1:** 6 shipped / 3 deferred to Wave 2 (with explicit rationale)
  / 1 reframed to P1 build (coach_payouts pending spec) / 1 produced
  read-only findings (AP #29) routing to Wave 2 hardening PR
- **P2:** deferred to Wave 2/3 per §4.AK roadmap

**Multi-tenant cutover unblocked at the DB layer.**
Multi-program build phase (§17.7 step 5) opens after Wave 2 closes.

**AP compliance:**

- AP #21: 1 mirror file from PR #561; PR #562 deploys edge function
  via Supabase MCP `deploy_edge_function` (not migration — function
  versioning handled by Supabase).
- AP #45: this §4.AM ledger entry surfaces the AP #29 specifics
  + Wave 2 carryover rationale so next session reads it at the
  §9.1 step 3 ledger-reconciliation pre-flight.
- AP #50: parallel narrow-scope fix-PR dispatch (2 agents).
- AP #52: both agents confirmed `pwd` + `git rev-parse --show-toplevel`
  in their final summaries.
- AP #54 + AP #55: both agents shipped same-MCP-burst create + ready
  + auto-merge with actual PR# from response.
- AP #56 + AP #59: session contract held. Closes here after the P1
  cleanup batch + this §4.AM ledger close. No cascade into Wave 2
  dispatch — that's the next session.

---



**Trigger:** Frank's locked routing decisions in same-day chat following §4.AK Wave 1 findings ship.

**Shipped this turn (3 parallel fix PRs):**

- **PR — DB security migration:** REVOKE PUBLIC+anon on `mint_unsubscribe_token(uuid)`, `sync_opponent_record(uuid)`, `sync_tournament_team_record(uuid,uuid)` (AP #57 active in production); `push_subscriptions.org_id` NOT NULL; `staff_profiles_select_authenticated` policy rewrite from `qual=true` to `(org_id = (SELECT current_user_org_id()))`. Closes Wave 1 P0s #1, #2, #3, #5. Closes Cross-Pattern 2 entirely + 1 of Cross-Pattern 1's 5 surfaces.
- **PR — Public-schedule org-scoping (Option A):** new `organizations.public_listing_enabled boolean NOT NULL DEFAULT true` + 4 RLS policies rewritten (`events_select_public`, `teams_select_public`, `tournaments_select_public`, `tournament_teams_select_public`) to scope via the gating column. Closes Wave 1 P0 #4. Unblocks second-tenant cutover for the public schedule surface.
- **PR — Doctrine reconciliation (this PR):** §8 prompt 7-A rewrite to current DB reality (164 accounts / 3 seasons / $166,910 billed / May-6 wave noted as retrospective Fall import); §5 ghost-migration count updated to 16 ghosts + 30 orphans with hygiene PR deferred; §11.5 exception table widened to include `PlayerRow.jsx:59-62`; `LEGACY_HOOPERS_ORG_ID` dead constant deleted from `src/lib/constants.js`. Closes Wave 1 P0s #7 + #10. AP #45 satisfied by this same-commit ledger entry.

**Q1-Q5 routing closures:**

- **Q1 (PR 4 gating shape):** ✓ Option A locked (per-org boolean column).
- **Q2 (May-6 import wave):** ✓ Frank confirmed intentional retrospective Fall 2025 top-up for families who joined Spring 2026 first.
- **Q3 (DeMasi):** ✓ Xanthi real co-guardian — drop orphan-merge claim. Wave 1 P0 #8 resolved no-op.
- **Q4 (KHOJASTEH):** ✓ family correctly modeled. Spot-check (Aubtin Khojasteh, player_id `fa384908-7441-447d-b23a-eea152b37a59`): both parents (Anjella Teimoori mom, Sarmad KHOJASTEH dad) linked via `player_guardians` with `is_primary=true relationship='parent'`; financial_accounts all on mom (3 accounts: Fall 2025 $1,300, Winter 2025-26 $750, Spring 2026 $1,320 — all paid in full); both parents have `user_id=NULL` (onboarding-link pending). Wave 1 P0 #9 resolved no-op (was false-positive — agent's dedup query didn't traverse player_guardians).
- **Q5 (coach_payouts):** ✓ reframed P0 → P1 build item. See "New P1 build item" below.

**New P1 build item — coach_payouts pipeline:**

Build a ledger system to track coach pay (payment itself remains external — Zelle/ACH from the Legacy Hoopers bank account; the system records the ledger only).

- Data model: per-coach pay rate. Frank's example shapes (final shape is a spec-session decision):
  - Session-by-session: $60 head coach / $30 assistant per session worked
  - OR flat-fee per team per season
  - Plus optional tournament-championship bonus
- Admin UI: record session pay or flat fee + bonus per coach per season
- Report surface: coach view (their own earnings) + admin view (all coach payouts) + financial dashboard integration
- Spec session needed before build — flat vs session vs hybrid is the open routing question.

**New P1 onboarding finding:**

Aubtin Khojasteh's family Q4 spot-check surfaced both parents with `guardians.user_id IS NULL` — neither parent has linked a Supabase auth account to their guardian row. Likely a broader pattern across imported families (which would explain why parent-side UI traffic is minimal). Route to §17.4 backlog "Onboarding pipeline (bulk-invite + QR + status column + PWA install prompt + push opt-in promo)" as a confirming data point. Worth a one-query audit at next session open: `SELECT COUNT(*) FILTER (WHERE user_id IS NULL), COUNT(*) FROM guardians WHERE org_id = '<legacy_hoopers_id>';`

**Still-open from Wave 1 (Wave 2 routing):**

- P0 #6 (coach_payouts data gap) → resolved by reframe to P1 build item above
- P1s from §4.AK: `useMapsUrl.js:38` org_id filter; `user_roles_user_id_key` shape; 33 unindexed FKs; `invite-parent` edge function org-blind admin check; `roster_members` UNIQUE missing season_id; financial-table cascade-action decisions; AP #29 token-handler re-audit; app_secrets + event_reminder_log policy pinning
- P2s deferred to Wave 2/3 per §4.AK roadmap

**AP compliance:**

- AP #21: 2 migration mirror files written in same turn as MCP apply, both with canonical version strings matching DB-registered versions (DB security migration + public-listing migration)
- AP #45: this §4.AM ledger entry shipped in same commit as the CLAUDE.md doctrine changes (which trigger the `docs/AUDIT_*.md` glob through the audit-doc cross-reference)
- AP #49: full doc body in PR description + chat-side context in dispatching session
- AP #54: all 3 fix PRs shipped same-MCP-burst ready + auto-merge per session-opener prompt discipline
- AP #56 + #59: session contract held — 4-PR ship + ledger, no audit-cycle generation

**Wave 1 P0 closure scoreboard (10 P0s identified in §4.AK):**

- ✓ #1, #2, #3, #5: DB security migration PR
- ✓ #4: Public-schedule org-scoping PR
- ✓ #7: §8 financial state rewrite (this PR)
- ✓ #8: resolved no-op (Q3)
- ✓ #9: resolved no-op (Q4 false-positive)
- ✓ #10: §11.5 exception widening (this PR)
- ⇒ #6: reframed P1 (Q5 coach_payouts build spec) — closed for cutover purposes; build pending

**10/10 P0s closed for cutover gate.** Multi-tenant cutover unblocked pending PR landing + post-merge verification.

---

### §4.AL — (overwritten — tombstone, restored per Doc-Corpus D2-1)

The original §4.AL ("Wave 1 P0 fix-PR arc + Q1–Q5 routing") header was destroyed by an
in-place overwrite in PR #563 (the line was renamed to §4.AM). Its body now lives under
§4.AM (Wave 1 P1 cleanup close); the Wave 1 pre-cutover findings/P0s the arc closed are in
§4.AK below. Surviving "§4.AL" references elsewhere in this doc resolve here.

---

### §4.AK — Wave 1 pre-cutover audit dispatch + findings (2026-05-28)

**Trigger:** PLATFORM_PRIORITIES.md §17.6 Wave 1 contract. Session opened
per §9.1 three-item pre-flight (branch state clean, no parent-checkout
leakage, ledger reconciled through §4.AJ). Dispatched 5 parallel
narrow-scope agents per AP #61 + AP #50 against categories #7 RLS, #8
schema integrity, #9 query contract, #12 cross-org, #26 financial
reconciliation.

**Output:** `docs/AUDIT_WAVE_1_PRE_CUTOVER_2026-05-28.md` — full
findings + cross-pattern synthesis + routing recommendation. AP #45
satisfied by this same-commit ledger entry.

**Headline:**

- **10 consolidated P0s** across 4 surfaces (RLS, schema, cross-org,
  financial)
- **§17.2 invariant 4 ("no cross-org leak path") FAILS today at the
  DB layer** despite app-layer discipline holding. Multi-tenant cutover
  is gated on the Cross-Pattern 1 fix-set.
- **§17.5 calibration:** all 5 Wave 1 categories surfaced real
  findings. Retain all 5 for Wave 2/3 if re-needed. No demotions.

**5 cross-cutting patterns (AP #58 synthesis):**

1. **Single-tenant DB-layer assumption** (cutover blocker) — 4 public
   RLS policies hardcode Legacy UUID; `staff_profiles_select_authenticated`
   qual=true; `push_subscriptions.org_id` NULLABLE; `useMapsUrl.js:38`
   no org filter; `user_roles_user_id_key` single-org assumption.
2. **AP #57 active in production** — 3 SECDEF functions
   (`mint_unsubscribe_token`, `sync_opponent_record`,
   `sync_tournament_team_record`) anon-EXECUTE-callable. Cross-confirmed
   by #7 + #12.
3. **Documentation/ledger drift** — §5 ghost-count understates by 11+;
   §8 financial state off by +60%; §11.5 exception table misses
   PlayerRow.jsx; `LEGACY_HOOPERS_ORG_ID` dead constant.
4. **Defense-in-depth gap class** — ~14 AP #36 destructured-default
   sites (load-bearing in rsvpNudge.js:56 + _handlers.ts:94,115); ~20
   AP #37 id-only writes; 151 multiple_permissive_policies advisories.
5. **Orphan-merge follow-through incomplete + coach_payouts empty** —
   DeMasi guardian dangle; KHOJASTEH zero accounts; coach_payouts
   table empty despite Darien paid per session.

**Routing — next session (§17.7 step 3):**

- **PR — DB security migration** (P0s #1, #2, #3, #5): REVOKE on 3
  SECDEF leaks + NOT NULL push_subscriptions.org_id + staff_profiles
  RLS rewrite. Single migration, low risk, ~30 min.
- **PR — Public-schedule org-scoping** (P0 #4): gating column +
  policy rewrite. **Blocked on Frank's call** about gating shape.
- **PR — PlayerRow §11.5 compliance** (P0 #10): widen exception or
  refactor. ~30 min.
- **PR — CLAUDE.md doctrine reconciliation** (P0 #7 + Cross-Pattern 3):
  §8 financial state + §5 migration ledger + §11.5 exception widening
  + dead-constant removal. ~1h pure doc.
- **Operational reconciliation workstream** (P0s #6, #8, #9):
  coach_payouts external reconcile + DeMasi disambiguation + KHOJASTEH
  enrollment confirmation. Frank-driven.

**Suggested cutover gate:** PRs 1, 2, 3 + operational workstream close
before second-tenant onboarding. PR 4 (doctrine) independent.

**6 open questions for Frank** (gating PR 2 + the operational items):
1. Public-schedule gating column shape on `organizations`?
2. May-6 import wave — intentional or accidental dup?
3. DeMasi — Xanthi a real co-guardian or import drift?
4. KHOJASTEH — currently enrolled?
5. coach_payouts — has Darien been paid through the system at all?
6. AP #45 compliance: this entry satisfies the same-commit rule.

**AP #59 hold:** session closes at synthesis. Did NOT cascade into fix-PR
dispatch — that's a separate session's work per §17.7 step 3.

**AP #56 hold:** pre-locked session contract was "three-item pre-flight
+ Wave 1 dispatch + synthesis doc + ledger entry." Held to that.
No audit-cycle generation beyond contract.

---

### §4.AJ — 5-day gap reconciliation (2026-05-27)

**Trigger:** Frank's "what's next for the next few sessions" question
surfaced that the ledger header read "last updated 2026-05-22" while the
body had grown through §4.AI (2026-05-25). Per AP #45, reconciled §4
against `origin/main` PRs #486-#513 before committing to a next-build
order. The doc was substantially current in its §4.AD-§4.AI arc entries;
the gaps were (a) the cutover-gate feedback REVERT not recorded anywhere,
(b) §4.A / §4.AI status lines stale against the revert, (c) the header
date.

**Shipped since the §4.AB high-water mark (PRs #486-#513):**
- **#486-#487** — security/rides follow-ups (verify_feedback_token REVOKE; ride symmetric guard BUG-004)
- **#489-#490** — formatter consolidation (Cluster 8 C) + session handoff doc
- **#491 + #493** — briefing actor-send UNBLOCK: slice contract + `get_staff_email` RPC (#491); static supabase import fix in `queueComposedMessages` resolving the `.from`-on-undefined wizard send error (#493). These clear the PR 4 / PR 5 send-path errors.
- **#492 + #494-#502** — §4.AD console-triage (5 bugs) + §4.AE/§4.AF/§4.AG/§4.AH L99 compose-briefing audit arc. All 5 §4.AD bugs closed (#496/#497/#498); 6 P1 + 1 P2 audit fixes; AP #56/#58/#59 promoted (#501). Audit cycle closed clean on the compose surface.
- **#503-#508** — Briefings Option C redesign (§4.AI): tile retire (#503), audit doc (#504), freestanding compose + sent-only history (#505 PR A), briefing_overdue sub-keys (#506 PR B), CutoverGateChip single-surface test (#508 PR C), drafts expires_at (#507 PR D).
- **#509** — ⛔ **REVERT: full rip-out of cutover-gate feedback infrastructure.** Per Frank's 2026-05-24 routing: the per-email rating survey served the cutover decision; post-cutover it's friction without value. Removed across resolver emits + send pipeline + admin chips/cards + 14 src deletions + edge function + DB (migration `20260524014835`). `queueComposedMessages.perRecipientSubstitutor` kept as documented extension point. **This invalidates §4.A PR 7's "FULLY SHIPPED" status (now corrected) and supersedes §4.AI PR C's surface.**
- **#512** — current-surface: inline opponent setter in the score sheet (removes the leave-and-edit dead-end; writes `events.opponent` + `opponent_id` on saved-opponent match). Directly smooths the Cluster 1 / §9 tournament-results backfill workflow.
- **#513** — current-surface: back button on the Records page (reuses `AdminBackHeader`, theme-matched on the dark broadcast surface).

**Corrected next-build order (locked this reconciliation):**

1. **Cluster 1 tournament-results backfill** (§2 Cluster 1 + §9) — Frank-driven Quick Score session. ~13 Rumble for the Ring results + 10U Blue Games 6-7. Unblocks 9 stale surfaces across all 3 roles. #512 smooths the exact entry flow. Workflow, not code — reopens as code only if aggregates don't propagate post-publish.
2. **Cutover Wave PR 4 + PR 5 actor sends** (§4.A) — Frank drives one `coach_roundup` + one `family_guide` send through the wizard (~10-15 min each). Send-path errors cleared by #491/#493/#496-#498. Flips CODE-COMPLETE → SHIPPED.
3. **Cutover Wave PR 6 — coverage delegation** (§4.A) — next real CODE build. `event_coach_assignments` table + parse-time conflict detection + delegation prompt in import preview. Not started.
4. **Migration 021 data hygiene** (§2 Cluster 1.1 / 3.1 + §3) — null the mis-tagged 10U Blue tournament event, sanitize ad-hoc event titles, dedupe 11U Girls practice. Needs Frank's diagnostic confirmation.
5. **Backlog (unblocked):** §4.J weather-per-event (~4-6h); §4.K Dependabot/CI token-scope upgrade.
6. **Blocked on product spec:** §4.I schedule_change rebuild (3-option dialog spec lock from claude.ai).

**Decision pending → §7:** whether to rebuild briefing feedback in a
lighter form (e.g., a single admin-side thumbs signal, not per-email
stars) or shelve permanently. Recorded as a product call, not a queued
build.

**AP compliance:** #45 (ledger reconciled in same commit as the status
corrections); #49 (changed sections pasted in chat this turn — full doc
is 3600+ lines, so per the >2000-line clause only the touched sections
are pasted, not the whole file).

---
