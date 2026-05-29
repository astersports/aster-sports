# Phase Beta — Expansion Audit Synthesis

**Date:** 2026-05-16 (afternoon Italy)
**Phases:** B1 → B3 → B6 → B2 → B4 → B5 (per Frank's recommended order)
**Status:** COMPLETE.

---

## Findings shipped (5 fix PRs + 1 mirror migration)

| PR | Sub-area | What | Severity |
|---|---|---|---|
| #210 | B1 UI Components | 5 hooks/pages add org_id defense-in-depth | P1 |
| #211 | B6 Error Handling | 16 anti-pattern #36 fixes across 5 briefing resolvers | P1 |
| #213 | B4 Storage | useWeather cache key includes lat/lon | P1 |
| #214 | B5 Data Integrity | Tournament event location rendering (Frank's Finding 1) | **P0 user-visible** |
| #215 | B5 Data Integrity | Backfill events.location from locations.name (mirror) | P1 |

Plus 1 docs PR (#212) shipping B1+B3 sub-area summaries.

## Sub-area verdicts

| Sub-area | Findings | Verdict |
|---|---|---|
| **B1 UI Components** | 5 P1 SELECTs | Shipped |
| **B3 Edge Functions** | 1 P2 cosmetic only | CLEAN |
| **B6 Error Handling** | 16 #36 fixes shipped | Closed for resolvers |
| **B2 Realtime** | 0 (1 P2 carryover) | CLEAN |
| **B4 Storage** | 1 P1 fixed + 2 P2 carryovers | Shipped |
| **B5 Data Integrity** | Finding 1 P0 fixed + 0 orphan rows + 3 P2s | Shipped |

## Sub-agent failure log (process correction enforced from B3 onward)

Three consecutive agent audits had high false-positive rates:

| Audit | Found | Valid | False+ rate |
|---|---|---|---|
| Morning org_id sweep | 9 | 4 | 55% |
| B1 hooks (Beta) | 9 | 0 | **100%** |
| B1 pages (Beta) | 6 | 3 | 50% |

Root cause: agents assumed every Supabase table queried needs org_id filter. When the table is FK-scoped (`events` via `team_id` → `teams.org_id`), the assumption produces false positives. Agents lack RLS-aware context.

**Correction enforced:** B3+ used inline-only audits with information_schema-first verification. Result: B3/B6/B2/B4/B5 all delivered crisp, verified findings.

## Systemic themes from Beta

### Theme 1: WRITE-side org_id story RESOLVED

Frank framed WRITE-side hardening as a Beta priority. After completing B1 + B3:
- B1 hooks agent claimed 9 events WRITE-side findings → **ALL INVALID** (events table has no org_id column; FK-scoped via team_id)
- B1 pages: no new WRITE-side findings beyond morning audit
- B3 edge functions: all writes are SAFE-BY-ID, RPC-validated, or use trusted-orgId-from-DB

The framing was sound; actual gap was smaller than the sub-agent suggested. RLS + correct INSERT payloads on org-scoped tables had already established the defense.

### Theme 2: Anti-pattern #36 was systemically violated in briefing resolvers

16 `const { data: x = [] }` callsites silently swallowed errors. PR #211 closed the class for resolvers. **Carryover:** 20+ `.maybeSingle()` no-error-destructure callsites — milder variant (data=null on no-row is commonly handled) but still warrants a follow-up sweep.

### Theme 3: Schema integrity is TIGHT (B5 surprise)

- **Zero orphan rows** in production across 9 spot-checks (event_rsvps, event_arrivals, team_players, events, comms_messages, etc.)
- **All org-scoped real tables** have NOT NULL org_id (only briefing_templates is nullable; table is empty)
- **6 views** appeared as "nullable org_id" but are false positives (views inherit from joins per anti-pattern from Phase 4 process log)
- **2 FKs without CASCADE** — both non-actionable today (org deletion + player hard-delete are anti-patterns)

The database has been disciplined. Application-layer issues account for nearly all real findings; schema is solid.

### Theme 4: Parser-era data leaves footprint in render layer

Finding 1 (tournament events) traces to the parser that imported tournament schedules: it set `events.location_id` (FK) but didn't populate `events.location` (text). The renderer was the wrong place to read the text column, but the schedule list was wired that way for years. Backfilled + renderer fixed both halves.

## What's deferred from Beta

| Carryover | Severity | Origin |
|---|---|---|
| 20+ `.maybeSingle()` no-error-destructure callsites | P1 | B6 sweep |
| useWeather localStorage fallback persists across users | P2 | B4 |
| BriefingComposer state doesn't reset on orgId change | P2 | B4 |
| useHasUnread channel name 'unread-badge' is global | P2 | B2 |
| RecordsPage.jsx game_results count cross-org | P2 | B1 (Alpha origin) |
| useAcademyCallupCandidates lacks useAuth context | P2 | Alpha |
| 2 FKs without CASCADE (org_id, player_of_game_id) | P2 | B5 |
| briefing_templates.org_id nullable (empty table) | P2 | B5 |
| Legacy renderer dead code removal | P2 | Morning audit |
| Anti-patterns #37 + #38 CLAUDE.md additions | P2 | Morning audit |

## Impact on Phase Gamma (PR 5 — Family Guide kind)

**B1 + B3 confirmed:** RLS + canonical patterns are healthy. Family Guide can wire through normal pipeline.

**B5 Finding 1 implications for PR 5:** Family Guide aggregates parent_id → players → teams → events. Events surface their location through the same `events.location` text column. With backfill complete (PR #215), Family Guide can safely render `event.location` directly. The renderer-side fallback (PR #214) provides additional defense.

**Anti-pattern #38 (renderer-emit parity):** PR 5 will introduce 3 new section renderers (vipHeader, kidColorPill, quickLinkNav). Per the morning audit's #38 work, ALL 3 renderers ship in the same PR as the resolver that emits them.

**No B-tier blocking changes to PR 5 scope.** Phase Gamma can proceed as planned.

## Honest time report — Phase Beta

| Item | Duration |
|---|---|
| B1 setup + agents + verification + fix + ship | ~30 min |
| B3 inline edge function audit | ~19 min |
| B6 anti-pattern #36 sweep + 16 fixes + tests + ship | ~25 min |
| B2 realtime audit (inline) | ~8 min |
| B4 storage audit + fix + ship | ~12 min |
| B5 schema/constraint audit + Finding 1 fix + backfill + ship | ~30 min |
| Sub-area doc writing | ~15 min |
| This synthesis | ~6 min |
| **Phase Beta total** | **~2h 25min wall-clock** |

Within the 2-4 hour budget. Self-correction overhead (sub-agent reclassifications) was real but offset by inline-only audits in B3-B5.

## Gate

Per Frank's gate rule, **proceed to Phase Gamma (PR 5 Family Guide)** unless Beta findings warrant scope adjustment for Gamma.

Recommended: take a short break before Gamma. Audit-day total now ~5+ hours.
