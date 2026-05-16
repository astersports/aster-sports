# Phase Beta B1 — UI Component Layer Audit

**Date:** 2026-05-16 (afternoon Italy)
**Scope:** Hooks (src/hooks/), pages (src/pages/), components (src/components/ excluding briefings/), route guards
**Method:** 2 parallel sub-agents + manual cross-verification + manual supplemental grep
**Status:** COMPLETE. PR #210 shipped 5 P1 fixes fix-as-you-go.

---

## Findings shipped (PR #210)

| # | File:line | Table | Severity | Class |
|---|---|---|---|---|
| 1 | useDigestEvents.js:57 | tournaments | P1 | defense-in-depth |
| 2 | useAdminStats.js:98 | financial_transactions | P1 | defense-in-depth (P1-4 class) |
| 3 | useDmThreads.js:23 | messages | P1 | defense-in-depth |
| 4 | BriefingHistoryDetail.jsx:33 | comms_messages | P1 | SAFE-BY-ID + defense-in-depth |
| 5 | TournamentPlaceholderEventsModal.jsx:39 | teams | P1 | defense-in-depth |

All 5 add `.eq('org_id', orgId)` to SELECTs that were implicit-scoped via prior queries.

## Carryover pinned (P2, defer to next sweep)

- **RecordsPage.jsx:28** — `game_results` count is unscoped. Correct accidentally today (1 org); needs join through `events`→`teams`→`teams.org_id` when 2nd org provisions. Public page per migration 029 so anon RLS gates per-row but count aggregates across orgs.

## Sub-agent method failure log (process correction)

This is the SECOND time today a sub-agent had method bias. Pattern:

| Audit | Agent findings | Valid | Invalid | False+ rate |
|---|---|---|---|---|
| Morning org_id sweep | 9 | 4 | 5 | 55% |
| B1 hooks (Beta) | 9 | 0 | 9 | **100%** |
| B1 pages (Beta) | 6 | 3 | 3 | 50% |

**Root cause:** Sub-agents assume every Supabase table queried needs `org_id` filter. When the table is FK-scoped (e.g., `events` via `team_id` → `teams.org_id`), the assumption fails. Agents lack RLS-aware context.

**Method correction enforced for B3+:**
- Inline audits via direct file reads + targeted grep, not sub-agents, for org_id-class audits
- When sub-agents are needed for breadth (e.g., file enumeration), restrict their scope to enumeration only; verification happens inline

## Route guard audit (clean)

Pages agent verified `Protected` component wrapper enforces `allowedRoles` correctly on all admin routes (`/admin/seasons`, `/admin/teams`, `/admin/rollover`, `/admin/financials`, `/admin/import-schedule`, `/admin/briefings`, `/admin/engine-preview`). LiveScore route gated for `['admin', 'coach']`. No bypasses detected.

## Hook post-action staleness audit (clean)

All CREATE/UPDATE hooks examined use `.select()` to return fresh data or call `refetch()` post-mutation. No staleness findings.

## useAcademyCallupCandidates investigation (Alpha carryover)

Verified: hook does NOT call `useAuth()` (no auth context). Queries `team_players` via `teams!inner` join. team_players has no org_id column; FK-scoped via team_id → teams.org_id with RLS. **NOT exploitable today** — RLS gates the cross-team join. Cosmetic anomaly (unusual hook pattern, no auth import). **P2 — defer.**

## Time report

- Pre-flight + 2 agents spawn: ~3 min
- Hooks agent execution (background): ~1.5 min
- Pages agent execution (background): ~4.5 min
- Sub-agent verification + reclassification: ~15 min
- Supplemental hook grep + manual review: ~8 min
- Fix application + lint + commit: ~5 min
- This doc: ~3 min
- **B1 total: ~30 min wall-clock**

## Moving to B3

Per execution order, next is B3 (Edge Function Input Validation). Method correction applied: B3 will be inline-only, no sub-agent.
