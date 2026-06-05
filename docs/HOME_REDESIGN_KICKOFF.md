# HOME PAGES REDESIGN — KICKOFF

> Handoff doc to seed the next Claude Code session. **Read `CLAUDE.md` first, then this.**
> Created 2026-06-05 at the close of the briefing-redesign phase. The new session has no
> memory of that work — this doc + CLAUDE.md are the grounding.

---

## Goal

Redesign the three role home pages — **Parent**, **Coach**, **Admin** — to the platform's
elite bar (Linear information density, Apple Calendar schedule clarity, Nike Run Club
engagement; NOT TeamSnap, NOT a default template). This is an L99 surface redesign:
follow **§16.15** exactly.

## Methodology — DO NOT skip the audit

Per **§16.15**, the **audit doc ships before any PR-A code**, with all five elements:

1. **(a)** Initial file-by-file audit of each home page's full mount tree, findings
   severity-tagged (P0/P1/P2/P3) with `file:line`.
2. **(b)** Deep-read addendum — a second pass across the full mount tree (~40% miss rate
   without it).
3. **(c)** Anti-pattern catalog cross-reference (§11) — tag every finding.
4. **(d)** Per-role wireframes — Parent / Coach / Admin **and** the view-as variants.
5. **(e)** Explicit out-of-scope list.

Line-by-line per category (PLATFORM_PRIORITIES §17.3/§17.8; AP#50's surface-dependent
methodology is RETIRED). Cross-batch pattern check per **AP#58**. The audit doc is the
canonical artifact; the PR sequence implements its locked decisions.

## The three surfaces + known starting state (verify in the audit — don't trust this blindly)

- **Parent home** — `src/components/parent-home/` is already decomposed into 3 zone
  components (AlertZone / SignalZone / Header), established 2026-05-21. `NowSection` reads
  `useDensity` (§16.2, MIN/MED/MAX variants).
- **Coach home** — `src/components/coach-home/` similarly decomposed (3 zones).
- **Admin home** — `src/pages/AdminHomePage.jsx` was at **146/150 lines** (2026-06-02) and is
  **NOT yet decomposed**. The §6 zone-decomposition trigger is primed: the next material
  change splits it into `src/components/admin-home/` (AlertZone / SignalZone / Header + a
  ~50-line wrapper). This redesign is that trigger — decompose as part of PR-A.
- **Routing** — `useHomeRole` decides which home renders (24h-expiry persistence to
  `user_preferences.role_preferences`). `useActiveRole` was a parallel system removed in
  PR #231 — **do not reintroduce it** (AP#42).
- **Alerts** — `useAlertEvaluator` feeds the AlertZones. Mind the loading-gate semantics:
  PR #241 / AP#44 (null sentinel for unfetched configs; an empty-configs early return can
  flip `loading=false` prematurely and flash the all-clear state).

## Load-bearing patterns to reuse (don't reinvent — AP#42)

- **§16.14** detail-page pattern (hero card + collapsible sections) — for any home→detail flow.
- **§6** zone decomposition — the parent/coach pattern is the template for admin.
- **§16.13** Elite Stack gate (the 10-point checklist) on every merge.
- **§16.10** perf budgets — **home-page LCP regressed to ~5s vs the 1.5s target** (flagged at
  AP#50's retirement). Performance is a **first-class concern** for this redesign, not
  deferred. FCP ≤1.5s / TTI ≤2.5s on 4G; long lists (>30) virtualize.
- **§16.2** density · **§16.7** privacy locks (streaks family-private, attendance per-role) ·
  **§16.4** accessibility (VoiceOver before any persona home passes) · **§16.3** microcopy.

## Cross-role discipline (the two that catch the most bugs here)

- **AP#43** — any value/label/render that appears on more than one home surface ships with a
  cross-surface invariant test.
- **AP#63** — same concept = one source + one scope across surfaces (the dominant platform
  bug class; the L99 cross-role audit found 14 bugs in 4 drift classes from exactly this).

## Out of scope (unless the audit promotes it with rationale)

- The **briefing system** — just completed this phase (built front-to-back, 3-stage audited,
  all P1s + security fixed, entry flows pre-scoped, 3 product decisions resolved, pilot-gated).
  Touch only where a home zone reads briefing/Radar data.
- Non-home surfaces (Schedule, Records, Teams detail) except where a home zone sources from them.

## First task for the new session

1. Read `CLAUDE.md` → read this doc.
2. Run the §9.1 three-item session pre-flight (branch-state check, advisors if prior schema
   changes, ledger reconciliation).
3. Produce the **L99 home-pages audit doc** (the five elements above) covering all three role
   homes + view-as. **No PR-A code until the audit lands and scope is locked.**

## Live-state note

Briefing **pilot mode is ON** — families receive nothing until it's deliberately flipped.
Unrelated to home pages, but it's the production context the new session is operating against.
