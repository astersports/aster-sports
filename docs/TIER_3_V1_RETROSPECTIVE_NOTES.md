# Tier 3 v1 — Retrospective Notes

Running scratch of architectural decisions whose payoff lies beyond
v1 ship. Each entry pins a v2 trigger condition so we don't carry
the concern as ambient anxiety.

## Polling cost — 60s client polling on home pages (PR 4 / PR 5)

60s client polling acceptable at Legacy scale. Migration trigger:
simultaneous-open spike load OR org with 500+ users. Migration paths
per Gap 8 (edge function with shared cache OR cron-cache table).

Reasoning + math: PR 4 review covered admin path (~25-50 queries/min
per active admin session). PR 5 review covered parent path (~60
families × 5 queries/min worst-case = ~5K queries/hour spike if all
simultaneous-open, well inside Supabase Pro tier headroom of ~10M
reads/day).
