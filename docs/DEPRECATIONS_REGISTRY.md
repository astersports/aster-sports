# DEPRECATIONS REGISTRY

One-page index of database substrate that is **present but not wired** — tables/columns
no shipped surface reads. Kept so discovery (`\d+`, `obj_description`) and `grep` surface
the warning automatically, and so the next session does not re-spec an editor against dead
config (the trap that produced the S3 + S4/S5 spend).

**Doctrine:** build an editor only when a shipped surface reads the value today, or when
multi-tenant onboarding needs it (CLAUDE.md §16.16, the two-bucket config rule). Everything
here is parked to Phase 4 (multi-tenant) or pending a consumer. **Do NOT drop** without a
fresh `grep` proving zero references first (per `ARCHITECT_RULING_DR-S3`).

Each row is also tagged in-DB via `COMMENT ON TABLE` (migration
`20260609225312_deprecate_unwired_config_relics`).

| Substrate | Named for | Status | Why deprecated | Un-park condition |
|---|---|---|---|---|
| `dashboard_section_visibility` | S3 Home Layout | RELIC | Pre-Phase-3 Home. Shipped Home is the 4-slot shell-contract-v2 (greeting/needsYou/comingUp/tail); the 7 section keys describe the retired card stack. Zero readers. | Phase-4 config-driven Home: reseed to the current shell + verified section→slot map, THEN a consumer. |
| `quick_actions_config` | S3 Home Layout | RELIC | `QuickActions.jsx` renders a hardcoded GROUPS array (9 tiles / 3 buckets); seed is 6 flat rows, stale routes, no group column. Zero readers. | Phase-4: reseed to the live 9 tiles + add a `group` column, THEN a consumer. |
| `circuit_rules` | S4 Records | UNWIRED | Standings compute from `game_results`; the Records tiebreaker copy is a static engine template (`tiebreakerExplainer` T3), not this table. Zero readers. | Make `tiebreakerExplainer` read `circuit_rules` (the consumer work), THEN an editor. |
| `division_fees` | S5 Programs | SUPERSEDED | Written at program creation (`useProgramSetup`) but read by nothing; the live fee path reads `registration_fees` + `division.base_fee_cents`/`fees` (`ProgramDetailPage`, `estimateCart`). | Re-spec S5 against the consumed source (`registration_fees`); or retire `division_fees` once proven unreferenced. |
| `user_preferences.notification_preferences` (column) | per-user push categories | RETIRED | Per-user per-category push prefs. UI (`NotificationPrefs.jsx`) **retired 2026-06-10** — the admin **Channels** matrix (`organization_settings.notification_channels`) is the single source for notification categories (operator decision). No reader/writer remains. Tagged via migration `20260610104432`; data + GIN index kept inert (not dropped). | A future per-user override wired into the send path (closes the long-open `AUDIT_WAVE_3A #19 P2-4`), if per-user control is ever wanted. |
| `user_preferences.quiet_hours` (column) | per-user quiet hours | RETIRED | UI (`QuietHoursCard`) **retired 2026-06-10**. The reminder send path uses a FIXED ET window (`isQuietHoursET`), never this column. No reader/writer. Tagged via migration `20260610114200`; inert, not dropped. | Wire per-user quiet hours into the send path (the deferred notifications PR). |
| `organization_settings.registration_open` (column) | admin Registration toggle | RETIRED | Vestigial org-wide toggle. UI row **retired 2026-06-10**. Registration is PER-PROGRAM (`programs.reg_opens_at`/`reg_closes_at` + `status` + `is_published`; `get_public_program` enforces). Drove nothing. Tagged via `20260610114200`. | A deliberate org-wide registration-freeze feature (AND it into `get_public_program`) — not the old toggle. |
| `organization_settings.futures_academy_enabled` / `carpool_enabled` (columns) | admin Features toggles | RETIRED | Cosmetic. UI row **retired 2026-06-10**. Zero consumers (Futures is roster_type-driven; ride board renders regardless). Tagged via `20260610114200`. | A real feature gate, if ever wanted. |
| `organization_settings.custom_domain` (column) | admin Custom domain | RETIRED | Cosmetic. UI row **retired 2026-06-10**. Zero consumers (email links use `app_config` base url). Tagged via `20260610114200`. | A real custom-email-domain feature (multi-tenant). |

### Aspirational (not even dormant tables — master-spec rows with no substrate)

These were named in the settings master spec but have **no table and no consumed key** —
do not tag a table (there isn't one); they are simply not built.

| Concept | Named for | Note |
|---|---|---|
| `organization_settings.roster_rules` (jsonb key) | S6 Roster Rules | No reader; not in `useOrgSettings` FIELDS. Park to Phase 4. |
| `organization_settings` reminder/rsvp/note (jsonb keys) | S8 Schedule | No reader (the only `*rsvp_lock*` hit is `tournament_rsvp_lock`, a briefing-kind label). Park to Phase 4. |

### Provenance

- Surfaced by the batch consumption audit: `docs/SETTINGS_CONSUMPTION_AUDIT_2026-06-09.txt`.
- DB tags: migration `20260609225312_deprecate_unwired_config_relics`.
- Ruling: `ARCHITECT_RULING_DR-S3` (descope S3) + the pillar-2/3/4 close-out, 2026-06-09.
