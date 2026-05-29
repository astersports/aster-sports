# Audit Completeness Challenge + Home-Screen Bug Capture + Fix-PR Scoreboard
**2026-05-29 · Frank-triggered ("challenge the audit results; there are still loading issues")**

This doc does three things Frank asked for:
1. Captures the bugs visible in the 2026-05-29 admin-home + compose screenshots.
2. **Challenges** whether the 29-category §17.5 campaign was "the most comprehensive
   audit possible" — verdict + the structural blind spot, proven by a live bug.
3. A consolidated fix-PR scoreboard (every P0 arc, landed vs open) as a live tracker.

---

## 1. Home-screen bug capture (2026-05-29 screenshots)

### BUG-1 — Payment metric contradiction on admin home  **[P1 · data consistency · DB-verified]**
**Symptom:** "PROGRAM HEALTH → Payment collection **100%**" renders directly below an
alert "Payments overdue **$1,275.00 across 1 family**." Reads as a flat contradiction.

**Root cause (season-scoping mismatch):**
- `useProgramHealthMetrics` → `useSeasonFinancials(orgId, seasonId)` → **season-scoped to
  Spring 2026**. DB: Spring 2026 billed $70,242.97 = paid, **$0 outstanding, 0 owing** →
  100% is correct.
- `evaluator.js evalPaymentOverdue` → `getOverdueFamilyBalances(config.org_id, age_days, min$)`
  — **no `season_id`, org-wide all-seasons**. DB: the $1,275 / 1 family is a **Fall 2025**
  balance.

Both numbers are individually correct; they contradict only when rendered together with
real multi-season data. **This is the smoking gun for §2's audit-gap argument** — neither
file is buggy in isolation, so a line-by-line code read passes it.

**Fix options:** (a) scope the overdue alert to active season [hides legit prior-season
debt — rejected], (b) label the alert with its season ("Fall 2025 · $1,275"), (c) label
Program Health "this season." **Recommend (b)+(c): make scope explicit on both surfaces**,
never hide outstanding debt. Lock with an AP #43 cross-surface invariant test pinning that
every payment figure on a surface declares its season scope.

### BUG-2 — "1 thing to handle" hidden behind the density toggle  **[P2 · UX]**
In Compact density the single action item is replaced by "1 item needs your attention —
tap the density toggle to expand." The point of "1 THING TO HANDLE" is to surface the one
thing; hiding it behind a toggle defeats it. `src/components/home/ActionZone.jsx` /
`PendingQueuesLanes.jsx`. Recommend: in compact, still show the single item inline when
count == 1 (collapse only at 2+).

### BUG-3 — RSVP shortfall alert missing chevron  **[P2 · affordance consistency]**
"Weekly briefing overdue" and "Payments overdue" render a `›` drill-through; "RSVP
shortfall" does not. Either it's missing its navigation target or the chevron is applied
inconsistently. `src/components/alerts/AlertCard.jsx`. Cross-ref AP #43 — affordance should
be invariant across alert cards of the same tappability.

### BUG-4 — Home-screen loading  **[perf · Frank-reported, partially known]**
Matches the §4.AP Wave 2.B anchor (home LCP ~5s, 3.3× the §17.1 1.5s budget). The
**diagnosis** landed; the **fix** (Wave 2.B Batch 2 bundle reduction + lazy qrcode + manual
chunks) is queued and unlanded. Additional check: home fires `useProgramHealthMetrics`
(3 parallel) + `useSeasonFinancials` + the alerts evaluator — verify no request waterfall
layering on top of the bundle cost. Perf categories #1/#2 were **deferred for RUM data**
(§17.6) so this surface was never swept per-component — see §2.

### BUG-5 — Duplicate "Tournament briefing" drafts  **[P3 · verify]**
Compose "Resume a draft?" shows two "Tournament briefing" drafts (22h + 1d ago). May be two
legitimate distinct tournaments, or a draft-dedup gap. §4.AI added drafts `expires_at` (#507);
verify dedup/expiry behavior. Low priority.

### BUG-6 — "Game recap" vs "Games recap" naming collision  **[P3 · content]**
Two adjacent compose kinds differ by one letter ("Game recap" = single-game writeup;
"Games recap" = multi-game digest). Easy to confuse. Recommend relabel the plural to
"Multi-game digest." Cross-ref §13 canonical 9 kinds.

---

## 2. Audit-completeness challenge — VERDICT

**Question:** was the 29-of-29 §17.5 campaign "the most comprehensive audit possible"?

**Verdict: it is the most comprehensive _code_ audit possible — but NOT the most
comprehensive audit possible. It has a structural blind spot for runtime / live-data /
visual issues, and the home screen proves it.**

The campaign methodology (§17.8) is line-by-line + §16.15 2-pass deep-read **of the source**.
That catches code-resident defects extremely well (53 APs reconfirmed, 13/13 edge functions
byte-match, app code 100% §11.5 compliant). But three defect classes live OUTSIDE the source
and were therefore systematically under-covered:

| Blind-spot class | Why a code read misses it | Proof on the home screen |
|---|---|---|
| **Live-data contradictions** | Each component is individually correct; the bug is an emergent cross-surface contradiction under real multi-season data | **BUG-1** (100% vs $1,275) |
| **Runtime / perf-as-experienced** | perf categories #1/#2 explicitly **deferred for RUM** (§17.6); LCP diagnosed as a single anchor, never swept per-surface | **BUG-4** (~5s LCP) |
| **Visual / affordance / interaction** | AP #46 already concedes code-only audits miss visual rhythm | **BUG-2, BUG-3** |

**This is not a reason to re-run the 29 code categories** — they are complete, durable, and
correct on what they cover. It is a reason to add the **missing lens**:

### Recommendation: Category #30 — Runtime / Live-Data / Visual audit pass (pre-build-gate)
A complementary pass that, for each primary surface (admin/coach/parent home, schedule,
records, teams, compose, event detail), with **production data loaded**:
1. **Cross-surface semantic consistency** — every metric/label that appears on >1 surface (or
   twice on one surface) uses the same scope + computation. (AP #43 applied at the data layer.
   BUG-1 is the archetype.)
2. **Per-surface runtime** — actual LCP/TTI on a real device against the §17.1 budget; query
   waterfall inspection.
3. **Visual / affordance consistency** — chevrons, density behavior, empty/loading/error
   states, microcopy, per the §7 + §16.14 system.

Feeds the **same fix-PR routing**. Per §17.5's calibration rule (retain categories that
surface findings), this one surfaces ≥6 findings on the home screen alone — it earns its
place. **It should run before the multi-program build gate opens**, because every blind-spot
class above multiplies under a second tenant with its own multi-season data.

---

## 3. Fix-PR scoreboard (P0 arcs — landed vs open)

Sourced from ledger §4.AK–§4.AS routing blocks + `git log origin/main`. P1/P2 detail lives
in the per-wave `docs/AUDIT_WAVE_*.md`; this tracks the P0 arcs that gate the build phase.

| Arc | Source | P0s | Status |
|---|---|---|---|
| Wave 1 DB-security P0s | §4.AK | ~10 | ✅ **landed** (#558/#559/#561/#562) |
| Wave 2.A token-handler hardening | §4.AO | 2 | ✅ landed (#566/#567); 2 deferred |
| Wave 2.B perf (bundle/LCP) | §4.AP | — | ⏳ partial — quick wins #570/#571; **Batch 2 bundle reduction OPEN (BUG-4)** |
| Wave 2.C reportError + observability | §4.AQ | 5 | ⏳ partial — reportError foundation #573; ~100 sites + admin observability OPEN |
| Wave 3.A notification pipeline | §4.AR | 9 | ⏳ barely started — dispatcher P0-1 #576 (held); #18 onboarding 5 P0s + #19 P0-2/P0-3 OPEN |
| Wave 3.B multi-tenant readiness | §4.AS | 5 | 🔲 **not started** (parked: post design-review) |
| Wave 3.B compliance (COPPA/ToS/consent) | §4.AS | 3 | 🔲 not started |
| Wave 3.B DR-readiness | §4.AS | 3 | 🔲 not started |
| Wave 3.B doctrine reconciliation | §4.AS | 4 | 🔲 not started |
| Wave 3.B data integrity (#10 RLS/trigger) | §4.AS | 2 | 🔲 not started |
| **NEW: Category #30 runtime/live-data** | this doc | 6+ | 🔲 not started (BUG-1…6) |

**Gate status (§17.7 step 5 / §17.8):** multi-program build opens only after all P0+P1
fix-PRs land. Wave 1 cleared; Waves 2–3.A partial; **all of Wave 3.B + the new runtime
category are open.** The build gate is firmly shut.

**Routing note:** BUG-1 (payment scope) + BUG-3 (affordance) are small, high-confidence,
shippable now without a design call. BUG-4 (loading) already has a queued arc. BUG-2/5/6 are
low priority. The Category #30 pass should run before the gate regardless of arc order.
