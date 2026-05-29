# EMBER PLATFORM — Platform Priorities

**Status:** Iterates as Wave findings come in. Lower authority than CLAUDE.md doctrine. The audit taxonomy and category set are **hypotheses pending Wave 1 calibration** — they retain or get demoted/removed based on whether Wave 1 surfaces real findings against them.

**Origin:** Output of the cleanup-discipline Round 1 → Round 2 → Round 3 iteration (2026-05-28). See `docs/CLEANUP_DISCIPLINE_REVIEW_ROUND_{1,2,3}_2026-05-28.txt` for the iteration trail. Per CLAUDE.md operational rule #7, the doctrine layer (CLAUDE.md §11.7 + AP #60–62) was committed only after a fresh-context review pass approved it.

---

## §17.1 — Performance targets (measurable)

**Precondition met (2026-05-28):** RUM measurement infrastructure is live in prod via `@vercel/speed-insights` (installed in PR #554, mounted in `src/main.jsx` inside `BrowserRouter`).

**Targets** (enforceable once p75 distributions stabilize — needs ~2 weeks of traffic):

- **LCP < 1.5s p75** in prod, measured on Parent Home + Schedule + Briefing pages
- **INP < 200ms p75** across all tab-to-tab navigation
- **Sign-in to first meaningful paint < 2s p75**
- Targets reviewed monthly via Vercel Speed Insights dashboard
- PRs that regress p75 by **>10%** require explicit ack

The aspirational North Star — "user opens the app or transitions between tabs and sees content that gives them a reason to stay" — is a design principle, **not** an engineering measurement. It lives in §17.4 as a design-research backlog item.

---

## §17.2 — Architectural scope

### Multi-tenant (GROUNDED, soft commitment)

- **Live tenant:** Legacy Hoopers (basketball, ~63 active players, 175 guardians, ~$70K invoiced Spring 2026).
- **Second tenant identified:** St. Patrick's basketball (~24-25 winter teams, guardian overlap with Legacy Hoopers).
- **Target onboarding:** Spring 2027, contingent on Legacy Hoopers - LeagueApps platform readiness. Date TBD.

**Multi-tenant invariants** (apply now, regardless of St. Patrick's onboarding date — these protect against future bugs, not just future tenants):

- Every org-scoped table has `org_id` + RLS scoping by `current_user_org_id()` per §4 + §11.5 + AP #37.
- Every query touching an org-scoped table filters by `org_id` explicitly (AP #37 defense-in-depth).
- Every UI brand-token application resets to org defaults on login.
- No cross-org data leak path exists from any role on any surface.

### Multi-program (SCOPED OUT)

Multi-program polymorphism is **scoped out of the active architecture**. Re-add when a tenant's actual program structure requires it.

The 2026-05-28 LeagueApps walkthrough surfaced a polymorphic program taxonomy (Season / Camp / Class / Club Team / Event / League / Tournament / Booking, plus Tryouts, Waitlists, Practice Rosters, Group Training). That is observation about how LeagueApps structures programs, **not** validated observation about how Legacy Hoopers, St. Patrick's, or any other actual tenant runs theirs. Designing for the polymorphism today commits to architectural overhead that may never need to exist. Same logic as the multi-sport drop below.

### Multi-sport (SCOPED OUT)

No second-sport pilot identified. Re-add when a non-basketball tenant is named with a target date.

---

## §17.3 — Phase rigor & methodology

L99 per CLAUDE.md §16.15.

**Standing methodology (locked 2026-05-28, supersedes prior surface-dependent rules — AP #50 RETIRED):**

- **Line-by-line per category, all categories.** No "narrow-scope" framing — every category gets exhaustive coverage of its surface area.
- **§16.15 2-pass deep-read addendum per category** to close the cascade rate inherent to line-by-line at broad scope. First pass surfaces findings; second pass catches what first pass missed.
- **Pre-phase audit gate per AP #61.** All §17.6 audit categories close before any next-phase build engages — see §17.8.
- **Cross-batch pattern check per AP #58.** Each batch's findings include a pattern-continuation section referencing prior batches.

**Comfort over velocity.** "Clean code in current state" is the operative criterion before phase boundaries open — not perf budgets or architectural invariants alone.

---

## §17.4 — Backlog (architectural + UX + operational items deferred but tracked)

### Architectural

- Realtime channel dedupe context (replaces `Math.random()` suffix workaround across 7 hooks).
- SWR/TanStack Query layer for the home-feeder hook fleet (16+ hooks fire fresh on every mount).
- Blocking-gate decomposition with per-zone skeletons + AP #43 invariant tests.
- Aggregate cache strategy for read-heavy hooks.
- Test coverage uplift (ratio to be verified during Wave 1's category-#6 audit).

### UX / engagement

- Onboarding pipeline (bulk-invite + QR + status column + PWA install prompt + push opt-in promo).
- Per-kid spotlight strip on Parent Home.
- Tokenized RSVP from `weekly_digest` + Stream A reminder emails (mechanism exists for `rsvp_nudge` only).
- Payment-due card action surface (tel: / mailto: / external link).
- Reports Hub navigation surface (mirrors LeagueApps Reporting taxonomy).
- Mobile-specific gestures (swipe-to-RSVP, long-press context menus, pull-to-refresh).
- Offline-first / connection-loss UX (PWA framing implies this; not engaged with today).

### Operational

- Permissive policy consolidation on `event_comments` / `event_rsvps` / `event_duties` (60 advisor findings; deferred until multi-tenant scoping needs).
- Push reliability under app-closed scenarios > 24h.
- Email deliverability + DKIM / SPF / DMARC monitoring.
- Org-admin self-service tooling (gating for St. Patrick's onboarding).
- Audit log / "who changed this" surface.

### Design research (not engineering)

- "User opens the app and sees content that gives them a reason to stay" — qualitative North Star. Validated via design research + parent feedback loops, not perf metrics.

---

## §17.5 — Audit categories (HYPOTHESES pending Wave 1 calibration)

The following 31 categories were drafted from a combination of recent-session observation, competitor analysis (LeagueApps walkthrough), and security/compliance pattern recognition for multi-tenant SaaS handling minor data + financial transactions.

**This list is NOT claimed as a complete or observed set.** Wave 1 dispatches against the 5 highest-confidence categories below (§17.6). Categories that surface real findings in Wave 1 get retained for subsequent waves. **Categories that surface emptily get demoted or removed.** Wave 1 calibration is the gate; the count today is hypothesis.

### Code & architecture
1. Performance — initial paint / cold load
2. Performance — warm-cycle navigation
3. Bundle / code split
4. Realtime / channel hygiene
5. React hook hygiene
6. Anti-pattern compliance sweep

### Database & data
7. RLS correctness + performance
8. Schema integrity
9. Query contract sweep (AP #36, #37, #48, #25)
10. Data integrity / canonical-source compliance

### Security
11. Edge function auth + secrets
12. Cross-org / multi-tenant exposure
13. PII surface
14. Dependency security
15. Rate-limit / abuse surface

### UX (consolidated)
16. UX surface audit (design tokens + accessibility + microcopy + empty-state inventory)
17. Cross-role coverage matrix

### Engagement
18. Onboarding pipeline
19. Notification pipeline coverage
20. Briefing engine coverage

### Operational
21. Edge function deploy parity
22. Migration ledger consistency
23. pg_cron job health
24. Observability coverage
25. Disaster recovery / backup testing

### Money & legal
26. Financial reconciliation
27. Youth-sports compliance — guardian consent, data retention, photo/video consent, SafeSport, COPPA-adjacent

### Scale & migration
28. Data migration / org onboarding playbook — gating for St. Patrick's pilot

### Documentation / doctrine
29. Doctrine-vs-practice drift (CLAUDE.md + EMBER_PENDING_LEDGER reconciliation per AP #45)

---

## §17.6 — Wave 1 / 2 / 3 dispatch plan

### Wave 1 — P0 (must complete before cutover; 5 narrow-scope parallel agents)

Genuinely "blocks multi-program build" or "blocks any next phase":

- **#7** RLS correctness + performance (blocks multi-tenant invariants)
- **#8** Schema integrity (blocks any phase change involving schema additions)
- **#9** Query contract sweep AP #36 / #37 / #48 / #25 (blocks multi-tenant defense-in-depth)
- **#12** Cross-org / multi-tenant exposure (blocks multi-tenant by definition)
- **#26** Financial reconciliation (P0 by nature; financial data corruption at multi-org cutover is catastrophic)

### Wave 2 — P1 (run after Wave 1 lands; needs right but fixable alongside build)

- **#1 + #2** Performance audits — load-bearing per §17.1 but waits ~2 weeks for RUM p75 distributions to stabilize
- **#17** Cross-role coverage matrix
- **#11** Edge function auth + secrets
- **#22** Edge function deploy parity
- **#23** Migration ledger consistency
- **#20** Briefing engine coverage (post-Skyfire→Ember rename re-audit)
- **#27** Youth-sports compliance (important but separate workstream)
- **#28** Data migration / org onboarding playbook (gating for St. Patrick's pilot)
- **#25** Disaster recovery / backup testing

### Wave 3 — P2 (before multi-program build, gates the phase boundary per §17.8)

- #3 Bundle analyzer
- #4 Realtime channel hygiene
- #5 React hook hygiene exhaustive
- #6 Anti-pattern compliance sweep
- #10 Data integrity canonical-source compliance
- #13 PII surface
- #14 Dependency security
- #15 Rate-limit / abuse surface
- #16 UX surface audit (consolidated)
- #18 Onboarding pipeline
- #19 Notification pipeline coverage
- #21 pg_cron job health
- #24 Observability coverage
- #29 Doctrine-vs-practice drift

---

## §17.7 — Chat-split sequencing

1. **Current chat:** committed Layer 1 (CLAUDE.md doctrine additions in PR #555) and Layer 2 (this doc).
2. **Fresh chat:** opens by verifying both PRs landed on `main` (per CLAUDE.md operational rule #3 / source hierarchy item #1). Dispatches Wave 1 with this doc's §17.6 as the contract.
3. Wave 1 findings → routing → fix PRs.
4. Wave 2 dispatch + fix PRs (potentially separate chat).
5. **Audit-gate per §17.8 closes** (all 29 §17.5 categories audited line-by-line with §16.15 2-pass deep-read addendum, all P0+P1 fix PRs landed). Multi-program build phase opens in another fresh chat.

---

## §17.8 — Audit-gate enforcement (locked 2026-05-28)

**All 29 audit categories in §17.5 must complete line-by-line — with §16.15 2-pass deep-read addendum per category — before the multi-program build phase or any next-phase feature work engages.**

This supersedes the original §17.6 framing where Wave 3 ran "during multi-program build, not blocking cutover." Rationale: surface methodology (AP #50 retired 2026-05-28) let regressions slip — empirical example, the home page LCP regressed to ~5s (vs §17.1 1.5s target, 3.3× over budget) without surface audits catching it because perf was deferred to Wave 2 RUM-data availability.

The standing criterion is **"comfort level of clean code in current state"** — not perf budgets or architectural invariants, but the qualitative confidence that the codebase has been read end-to-end across every audit lens before next-phase build risks compounding new debt onto un-audited existing debt.

**Methodology per §17.3:** line-by-line per category, all 29 categories, §16.15 2-pass deep-read addendum per category. Cross-batch pattern check per AP #58 between batches.

**Gate state (as of 2026-05-29):**

- **Wave 1 (5 categories):** ✓ COMPLETE per §4.AK / §4.AL / §4.AM (PRs #557–#563). Methodology was breadth-parallel (predates the line-by-line lock). Worth a §16.15 addendum re-read at some point — flagged in §4.AN for routing.
- **Wave 2 (9 categories):** ✓ COMPLETE — 2A/2B/2C all dispatched + closed per §4.AO / §4.AP / §4.AQ (PRs #565–#573). Anchor finding (home page LCP ~5s, 3.3× over §17.1 budget) diagnosed in the 2.B perf audit (PR #569).
- **Wave 3 (14 categories):** ✓ COMPLETE — 3A/3B dispatched + closed per §4.AR / §4.AS (PRs #574–#576).
- **§17.5 audit campaign: 29/29 COMPLETE** (PR #575). All categories audited line-by-line with §16.15 2-pass deep-read addendum. **Active workstream: fix-PR routing** off the surfaced findings.

**Calibration:** §17.5's "categories that surface emptily get demoted/removed" rule remains. Per-wave evaluation. Wave 1 outcome: 5/5 surfaced findings, 0 demotions.

**Phase boundary signal:** when Wave 3 closes clean (all categories audited line-by-line with addendum, all P0+P1 fix PRs landed), §17.7 step 5 unblocks and multi-program build opens in a fresh chat.

---

**Iteration trail:**
- `docs/CLEANUP_DISCIPLINE_REVIEW_2026-05-28.txt` — Round 1 review request
- `docs/CLEANUP_DISCIPLINE_REVIEW_ROUND_2_2026-05-28.txt` — Round 2 after Round 1 critique integration
- `docs/CLEANUP_DISCIPLINE_REVIEW_ROUND_3_2026-05-28.txt` — Round 3 (tightened) after Round 2 "fix by addition" critique
- `CLAUDE.md` §11.7 + AP #60–62 — Layer 1 doctrine commit (PR #555)
- This doc — Layer 2 planning commit
