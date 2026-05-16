# Phase 3 Migration + Deploy Reconciliation Audit

**Date:** 2026-05-16 (Italy morning)
**Method:** Direct DB introspection (Supabase MCP) + git log + parallel Explore agent for mirror drift
**Coverage:** 146 registered migrations + 143 repo migration files + 10 edge functions + 7 known/probable mirror pairs
**Status:** Read-only inventory. Per Frank's "go deeper" directive, this phase did extensive re-investigation when the first-pass diff was misleading.

---

## Methodology correction (audit's own process bug, attempt 2)

My first-pass migration diff matched by VERSION PREFIX (`sed 's/_.*//' ` truncated filenames at the first underscore). Output was 26 "ghost migrations" — alarming, but mostly wrong. Re-diff by NAME (stripping any leading digit/underscore version prefix) gave a much cleaner picture: **8 real ghost data ops + 5 documented unregistered files** (the 5 known ghost migrations per CLAUDE.md §5).

**Process correction for any future audit work:** when diffing two sources of "migration identity," use the NAME column not the VERSION prefix. The version prefix has been inconsistent over the project's lifetime (sequential 023-033 → full-timestamp 20260425123711 → some hybrids), but the NAME is canonical.

---

## Severity tags

- **P0** — production divergence (deployed code differs from repo)
- **P1** — schema-reset risk OR known documentation drift
- **P2** — cosmetic / record-keeping

---

## P0 findings (1)

### P0-1: `scheduleGaps.js` ↔ `_scheduleGaps.ts` mirror drift

**Source:** `src/lib/briefings/scheduleGaps.js` (vitest source of truth)
**Mirror:** `supabase/functions/suggest-briefing-closer/_scheduleGaps.ts`

**Drift:** Source exports `describeScheduleGaps(events, { minGapMinutes = MIN_GAP_MINUTES } = {})` accepting an optional override for the gap threshold. Mirror hardcodes `if (gap >= 30) segments.push(...)` with no parameter — the override is dropped.

**Production impact:** Right now both default to 30-minute threshold so behavior matches. **The drift becomes a P0 the moment a caller passes a different `minGapMinutes` value** — vitest passes (parameter respected), deployed edge function silently ignores it.

Anti-pattern #30 was created to prevent exactly this. The mirror was created in PR 3b (the LLM closer); the parameterization on the source side might have been added later without mirror update.

**Fix scope:** ~3 lines on the Deno mirror to accept the same options parameter. Build mirror byte-near-identical except for TS annotations. CI redeploys the function on merge.

---

## P1 findings (5)

### P1-1 through P1-5: Five documented unregistered migration files

Per CLAUDE.md §5 "Ghost migrations": 5 SQL files exist in `supabase/migrations/` but are NOT registered in `supabase_migrations.schema_migrations`. Their schemas ARE live in production (applied via SQL editor, not MCP `apply_migration`). If anyone ever runs `supabase db reset`, these files are needed to recreate the schema.

The 5 files:
- `20260504_messaging.sql` — messages table + message_reads + RLS
- `20260504_dm_threads.sql` — dm_threads (user_a/user_b) + messages.dm_thread_id + RLS
- `20260504_ride_requests.sql` — event_ride_requests table + RLS
- `20260504_game_results_cascade_delete.sql` — FK CASCADE on game_results.event_id
- `20260504_rls_cleanup_dangling_policies.sql` — drops orphaned org_announcements/message_drafts policies

**Fix scope:** retroactively register each via `INSERT INTO supabase_migrations.schema_migrations (version, name, statements) VALUES (...);`. Mechanical but mildly invasive. Could be done as a single migration that registers all 5 retroactively. ~30 min.

**Defer-able:** yes, per CLAUDE.md these are known + documented. Frank's never run a db reset; the day he needs to, this becomes blocking.

---

## P2 findings (8 ghost data ops + filename mismatches)

### P2-1 through P2-8: Eight ghost data-correction migrations

DB-registered migrations with NO repo file. All 8 are one-off data corrections or backfills, NOT schema changes:

| Version | Name | Likely purpose |
|---|---|---|
| 20260426200358 | `data_integrity_fix` | Generic data correction |
| 20260426203347 | `data_corrections_resurrection_jersey` | Jersey assignment fix for "Resurrection" team |
| 20260426203943 | `resurrection_address_correction` | Venue address fix |
| 20260426205441 | `venue_address_corrections_and_canonical_urls` | Venue URL canonicalization |
| 20260426215822 | `rename_cardinal_spellman_to_cyo_spellman` | Venue rename |
| 20260426111421 | `tournament_times_correction` | Game time fix |
| 20260429020355 | `ship_x_backfill_author_names_from_guardians` | Author-name backfill |
| 20260429104058 | `y2b_backfill_spring_2026_game_results` | Game-results backfill |

**Risk:** zero schema impact. These ran once, did their thing, no recurrence. If `supabase db reset` ran, schema would rebuild without these data ops — but the data they corrected wouldn't be there to re-correct anyway (reset wipes data).

**Action:** could retroactively create empty `.sql` files in the repo with a one-line "applied via MCP without mirror file; data op, no schema impact" comment to satisfy the audit. Pure record-keeping. Low priority.

### P2-9: Filename version-prefix mismatches (5 cases)

Five migrations exist in BOTH the repo and the DB registry by NAME, but with different VERSION prefixes:

| Name | Repo version | DB version |
|---|---|---|
| `tournament_messages_dispatcher_compat` | `20260508121500` | `20260508115128` |
| `expand_message_enums_for_dispatcher` | `20260508122000` | `20260508115315` |
| `wave_4_4_a1_engagement_schema` | `20260511175500` | `20260511182333` |
| `wave_4_4_b_5d_b_2_user_preferences_favorite_audiences` | `20260511180000` | `20260511232856` |
| `wave_4_4_c2_status_sent_at_consistency` | `20260511230000` | `20260512001618` |

Pattern: repo timestamps are rounded to 15-minute or hourly intervals; DB timestamps are exact-second. Suggests files were drafted with rounded names, then applied via MCP which stamped an exact-second version, then nobody renamed the repo file. **Functional risk:** if CI runs `supabase db push` and uses the file's version prefix as identity, it might try to re-apply (already-applied SQL = no-op or error depending on idempotency).

**Action:** rename the 5 repo files to match the DB version prefixes. 5 minutes of `mv` commands.

### P2-10: Sequential-numbered duplicates (023-033)

13 file pairs share a sequential version prefix (023, 024, 025, 026, 027, 028, 029, 030, 031, 032, 033) where TWO files exist per number — one being the original schema migration registered with that sequential version, the other being a later backfill/data-op registered with a full-timestamp version but kept under the sequential prefix for naming continuity.

Example: `023_attendance_trending_views.sql` (registered as `023`) and `023_backfill_opponent_names.sql` (registered as `20260429231004`).

Cosmetic only. CI would skip the second file because the version is already applied. **Action:** rename the second-of-pair files to their full-timestamp version prefix to match DB. ~13 mv commands. Defer indefinitely.

---

## Edge function deploy reconciliation — CLEAN

All 10 deployed functions verified: each function's deployed `updated_at` timestamp post-dates its directory's most recent git commit. None are behind repo HEAD. None are ahead in a way that risks drift on next merge (CI auto-deploys on merge).

| Function | Deployed v | Last git commit | Drift |
|---|---|---|---|
| briefing-auto-draft-tick | 11 | 2026-05-16 00:21 | none (deployed 22:42 UTC, same day) |
| briefing-cron-dispatch | 9 | 2026-05-10 19:26 ET | none |
| callup-token-handler | 5 | 2026-05-10 16:14 ET | none |
| invite-parent | 7 | 2026-05-13 00:15 ET | none |
| parse-tournament-schedule | 7 | 2026-05-16 00:21 | none (MCP deploy today) |
| resend-webhook-receiver | 7 | 2026-05-11 15:10 ET | none |
| rsvp-token-handler | 5 | 2026-05-09 18:05 ET | none |
| send-tournament-message | 19 | 2026-05-16 07:53 | none (PR #195 deploy this morning) |
| suggest-briefing-closer | 2 | 2026-05-16 00:34 | none (MCP deploy yesterday) |
| unsubscribe-handler | 3 | 2026-05-09 20:46 ET | none |

Note: this is a heuristic (timestamp comparison), not a hash diff. Exact sha comparison would require redeploying each function and observing whether Supabase returns "no change" — destructive (creates new versions). Heuristic suffices for "audit-day signal."

---

## Mirror inventory (4 pairs + 3 orphans)

| Source | Mirror | Status |
|---|---|---|
| `src/lib/cron/briefingCronHelpers.js` | `briefing-auto-draft-tick/_helpers.ts` | in sync |
| `src/lib/import/parseTournamentSchedulePrompt.js` | `parse-tournament-schedule/_helpers.ts` | in sync |
| `src/lib/briefings/suggestCloserPrompt.js` | `suggest-briefing-closer/_helpers.ts` | in sync |
| `src/lib/briefings/scheduleGaps.js` | `suggest-briefing-closer/_scheduleGaps.ts` | **DRIFT (P0-1 above)** |

Orphan Deno-only helpers (no src/lib counterpart needed — by design):
- `briefing-auto-draft-tick/_draftRow.ts` — extracted to keep _handlers.ts under 150 LOC
- `briefing-auto-draft-tick/_handlers.ts` — thin trigger dispatch; heavy logic in _helpers.ts (which IS mirrored)
- `send-tournament-message/_lib.ts` — Resend/RFC 8058 email formatting; Deno-only

---

## Trade-off — fix-as-you-go on P0-1 mirror drift

P0-1 (scheduleGaps mirror drift) is Class 6 (Migration/Deploy) per the audit framework. Fix-as-you-go ALLOWED for "edge function redeploys only; schema migrations gated." Mirror update + CI redeploy is the edge function redeploy path. ALLOWED.

Fix scope is tiny (~3 lines on the Deno mirror to accept the options parameter). Ship now OR fold into batch?

**Recommend ship now** — pure additive parameter, no behavior change at default values, would unblock any future caller passing a different threshold.

---

## Phase 3 status: COMPLETE

- **P0:** 1 (scheduleGaps mirror drift — recommend ship now)
- **P1:** 5 (documented unregistered files; defer per CLAUDE.md §5 acceptance)
- **P2:** 10+ (8 ghost data ops + 5 filename mismatches + 13 sequential-prefix duplicates; all cosmetic)
- **Edge function deploy reconciliation:** CLEAN, no drift
- **Process correction:** match migrations by NAME not VERSION prefix
- **Methodology meta:** "deeper investigation" framing produced a 3x cleaner picture than the first-pass alarming diff

Standing by for Frank's routing on P0-1 (ship now vs batch) and then to **Phase 4 — RLS / Security deep dive** (after the mandatory Italy break).
