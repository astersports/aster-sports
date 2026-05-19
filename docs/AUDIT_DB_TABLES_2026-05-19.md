# DB-Table Orphan Audit — 2026-05-19

Class #9 in the orphan-code taxonomy (anti-pattern #42 corollary applied
across the database surface).

**Tooling**: Supabase MCP `information_schema.tables` (public schema,
base tables only) × `grep -rln "from('<table>')\|from(\"<table>\")"` over
`src/` and `supabase/functions/`.

**Method limitation**: detects direct `.from('<table>')` references only.
Does NOT detect:
- PostgREST nested-select joins (`from('events').select('...teams(...)')`)
- RPC function bodies (SQL inside Postgres functions)
- Trigger-written tables (audit logs etc.)
- Edge function direct SQL (rare; most go through supabase-js)

Joined-via-nested-select and RPC paths were spot-checked for each zero-ref
table; none surfaced as false positives in this audit.

## Summary

**68 tables total** in `public` schema.
**53 with ≥1 direct `.from()` reference** — actively used.
**15 with zero direct references** — candidates for triage below.

## Triage by category

### Bucket A: Intentional (lookup / trigger-written) — KEEP

| Table | Rows | Reason |
|-------|------|--------|
| `alert_types` | 5 | Lookup table; referenced via FK on `alert_configurations.alert_type_id`. No direct `.from()` needed. |
| `circuit_rules` | 2 | Lookup table for tournament circuit rules. Likely read via JOIN from queries on parent tables. |
| `team_types` | 6 | Lookup table for `teams.team_type_id`. Same pattern as alert_types. |
| `pii_audit_log` | 0 | Trigger-written audit table. Written via Postgres triggers on PII columns; never read by application code (intentional — accessed via direct DB inspection only). |

**Action**: none. Document the convention so future audits exempt these as expected.

### Bucket B: Orphan-with-data — INVESTIGATE BEFORE DELETING

These tables have production data but zero application references. Either
the code that wrote them was removed (was-used-then-abandoned) or the
intent was admin-only data that should be wired into a manager surface.

| Table | Rows | Hypothesis | Suggested follow-up |
|-------|------|------------|---------------------|
| `dashboard_section_visibility` | 7 | Admin-configurable visibility for home page sections. Possibly orphaned by the Tier 3 v1 home redesign. | Spike: confirm if the 7 rows are stale config or load-bearing. If stale → drop the table. If meant for an admin UI → schedule a wire-up PR. |
| `location_rooms` | 11 | Pre-existing concept replaced by `locations.sub_locations` (jsonb ARRAY column already present). Production locations use sub_locations; rooms table is the older shape. | Verify zero-FK from current code. If clean → DROP TABLE; update CLAUDE.md ground-truth table (§11.5). |
| `player_tags` | 63 | Player categorization tags (e.g., dietary, medical, attendance pattern). Substantial data — was wired at some point. | Investigate git log for `player_tags` usage history. If removed in a recent refactor and no replacement → either restore the UI or drop the table + 63 rows (after confirming no operational value). |
| `quick_actions_config` | 6 | Likely an admin-configurable variant of the hardcoded `QuickActions` component. The component currently hard-codes its 8 tiles. | Decision: either wire QuickActions to read this table (closes V-something open in §4.G) or drop. |

**Action**: 4 separate spike PRs (one per table). Each ≤30 min.

### Bucket C: Future-feature / scaffold-only — DELETE OR WIRE

These tables have 0 rows AND 0 application references. Schema landed but
the consuming code never shipped.

| Table | Hypothesis | Suggested follow-up |
|-------|------------|---------------------|
| `briefing_reminders` | Per-recipient reminder scheduling for briefings. Probably pre-cron-architecture. Replaced by `briefing_triggers` (1 ref) + `pg_cron` schedule. | Confirm pg_cron + briefing_triggers cover the use case; DROP TABLE briefing_reminders. |
| `briefing_templates` | Pre-Wave 5 template-based briefing composer. Replaced by the resolver+composer engine (`src/lib/engine/`). | Confirm; DROP TABLE. |
| `event_changes` | Possibly the precursor to `event_change_audit` (which has 3 refs). | Diff schemas with event_change_audit; if event_changes is the older shape → DROP TABLE. |
| `guardian_notification_prefs` | Pre-Wave 4.3 notification preference shape. Possibly replaced by `guardian_email_preferences` (1 ref). | Diff with guardian_email_preferences; consolidate or drop. |
| `invitations` | Possibly replaced by `team_invites` (CLAUDE.md §5 migration 009 references team_invites). | Confirm team_invites is the canonical surface; DROP TABLE invitations. |
| `org_briefing_contacts` | Probably the parent-of-multiple-contacts shape for briefings. May be future feature. | Spike: is this on any roadmap? If no → DROP. |
| `tournament_pool_teams` | Pool-play structure for tournament brackets. May be future scaffolding for bracket-aware tournament features. | Confirm against tournament feature roadmap. If no concrete plan → DROP. |

**Action**: 7 separate decision-then-DROP-migration PRs OR one consolidated "Wave 5 schema cleanup" PR.

## Forward routing

1. **Bucket A** — closes by documentation (this file). No code/schema change.
2. **Bucket B** — 4 follow-up spike PRs. Recommended order: `location_rooms` (cleanest replacement story per CLAUDE.md sub_locations) → `quick_actions_config` (wire vs drop call) → `dashboard_section_visibility` → `player_tags` (most data, deepest investigation).
3. **Bucket C** — 7 schema-cleanup decisions. Recommended: bundle into one migration PR after confirming each. Lower risk to ship as one DROP TABLE migration than 7 separate.

## CI enforcement (future)

This audit is one-shot. Going forward, automating detection of new orphan
tables would require either:

- (a) **Hardcoded expected-tables JSON** in repo, with each table marked
      SEEN / EXEMPT / ORPHAN. Vitest assertion compares production schema
      against the JSON. Drift cost: schema changes need JSON updates in
      same PR.
- (b) **Periodic re-run** of this audit (quarterly). Documentation
      artifact lives in `docs/AUDIT_DB_TABLES_<date>.md`.
- (c) **Skip mechanical enforcement** — accept that DB-table orphans
      surface less frequently than code orphans and tolerate manual
      re-audit on schema-design milestones.

Lean: **(c) for now**. The cost of (a) (drift discipline) outweighs the
value at current cadence. Re-run this audit when the next major schema
wave lands (likely tied to the next strategic arc — Wave 6 or Phase 2).

## Source of truth

- Tables enumerated: Supabase MCP query 2026-05-19 ~17:30Z
- Grep methodology: `grep -rln "from('<table>')\|from(\"<table>\")" src/ supabase/functions/`
- Production data project: `vrwwpsbfbnveawqwbdmj`
- Audit author: CC session (anti-pattern #42 corollary work)
