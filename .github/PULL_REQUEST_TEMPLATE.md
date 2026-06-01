<!--
Aster Sports PR template — discipline checklist per CLAUDE.md anti-patterns
#21, #36, #46. Lightweight, no infra needed. Adopted 2026-05-20 (L99 v6
chat-side pressure-test recommendation E2). Auto-merge per §15 still
fires when CI is green; this checklist is for the PR author's own
spot-check before opening, plus a visible trail for reviewers.
-->

## Summary
<!-- 1-3 bullets: what changed and why. -->

## Discipline checklist

- [ ] Touched `*Card.jsx` / `*Row.jsx` / `*Tile.jsx`? Invariant test, before/after screenshot, OR typography token reference attached (anti-pattern #46)
- [ ] Touched `supabase/migrations/`? Mirror file matches the MCP-applied version (anti-pattern #21)
- [ ] Touched admin home hooks (`useAdminHomeSignals`, `useProgramHealthMetrics`, etc.) or shortcut grid? Visual verification noted in the manual checklist below
- [ ] Used `.in(...)` / `.eq(...)` with values that could be null? Filtered with `Boolean` or null-guarded before the query (anti-pattern #36 corollary)
- [ ] Removed a registry entry (`KIND_COMPOSERS`, `RESOLVER_REGISTRY.<kind>`, `SECTION_RENDERERS`, etc.)? Caller-migration grep proves zero callers, OR every caller migrated in the same PR (anti-pattern #34)
- [ ] Used PostgREST `.order(col, { foreignTable: 'X' })` for parent-row sort? Used JS-side sort instead (anti-pattern #48)

## Manual verification checklist
<!-- Numbered steps Frank can walk through in the app to confirm the change works. -->
