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

L99 per CLAUDE.md §16.15. By scope per AP #50:

- **Broad codebase audit** → breadth-via-parallel-agents (low cascade).
- **Specific surface audit** → line-by-line at narrow scope (high signal-to-noise).
- **Broad surface line-by-line** → ~40% cascade. **Don't do this.**

Pre-cutover audits run as parallel narrow-scope agents per AP #61. Cross-batch pattern check per AP #58 surfaces cross-cutting findings.

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

### Wave 3 — P2 (during multi-program build, not blocking cutover)

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
5. Phase boundary reached. Multi-program build phase opens in another fresh chat.

---

**Iteration trail:**
- `docs/CLEANUP_DISCIPLINE_REVIEW_2026-05-28.txt` — Round 1 review request
- `docs/CLEANUP_DISCIPLINE_REVIEW_ROUND_2_2026-05-28.txt` — Round 2 after Round 1 critique integration
- `docs/CLEANUP_DISCIPLINE_REVIEW_ROUND_3_2026-05-28.txt` — Round 3 (tightened) after Round 2 "fix by addition" critique
- `CLAUDE.md` §11.7 + AP #60–62 — Layer 1 doctrine commit (PR #555)
- This doc — Layer 2 planning commit
