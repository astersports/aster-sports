# CLAUDE Doctrine History (archive)

Last updated: 2026-06-19. This file holds historical / build-tracking content
extracted from `CLAUDE.md` during the doctrine-refresh slim (Pass B / B1) so the
live doctrine carries rules, not dated history. **Nothing here is a live rule.**
Each block is reachable from `CLAUDE.md` via a pointer stub of the form:
`Moved to docs/archive/CLAUDE_DOCTRINE_HISTORY.md → "<heading>"`. The headings
below match those pointers verbatim so the move is grep-verifiable in both
directions. Per the archive doctrine, this content is preserved as-is — the
record is not retroactively rewritten.

---

## §8 BUILD PROMPT ORDER (historical build-tracking)

> Extracted from CLAUDE.md §8 on 2026-06-19. Superseded as live tracking by
> `docs/EMBER_PENDING_LEDGER.md`. The per-player game-stats lock that §8's status
> note referenced is carried live by §16.12.

| # | Prompt | Status |
|---|---|---|
| 1-A | Skeleton + auth + layout + shared | ✅ DONE |
| 1-B | Admin home + season mgr + team mgr | ✅ DONE |
| RESET | Foundation Reset (token + visual fix) | ✅ DONE |
| 2-A | Roster + player/guardian CRUD | ✅ DONE |
| 2-B | Schedule + weather + density | ⚠ PARTIAL — schedule + density done; weather wired to coach/admin home |
| 2-C | Activity CRUD wizard | ✅ DONE |
| 2-D | RSVP + event detail + check-in | ✅ DONE |
| 2-D2 | Ride board + duties + comments | ✅ DONE |
| 2-D3 | Game day checklist + running late | ✅ DONE — arrival board, parent status buttons, coach checklist |
| 2-E | Availability heatmap | ✅ DONE — per-player attendance grid with streak fire icon |
| 3-A | Location + opponent mgr | ⚠ PARTIAL — locations seeded (9 venues), no mgmt UI |
| 3-B | Calendar sync + public schedule + QR | ✅ DONE — public schedule page; calendar sync (PR #342 V-23 iCal); QR SHIPPED (`qrcode.react` + `ShareScheduleButton.jsx`) |
| 3-C | Home dashboard + inline RSVP | ✅ DONE |
| 4-A | Team chat + announcements | ✅ DONE — channels, DM threads, unread badges, message deletion |
| 4-B | Save & Message Team + auto-notifications | |
| 5-A | Quick score entry + records | ✅ DONE — records page with standings + tournament scorebooks |
| 5-B | Live scoring interface | ✅ DONE — play-by-play, stats tab, subs sheet, fouls, undo toast |
| 5-C | Player stats + box score | |
| 6-A | Parent onboarding + QR invites | ⚠ PARTIAL — auto-link guardians done; QR invites not |
| 7-A | Financial dashboard | ✅ DONE — season picker, net-to-bank, LeagueApps import, record payment |
| 7-B | Multi-org + season rollover | ✅ DONE (7-B.2) — 5-step rollover wizard with atomic execution |
| 7-C | PWA + auth upgrades | ✅ DONE — sw.js, manifest, install prompt, apple-touch-icon |

#### Financial data loaded (May 5–6, 2026)
LeagueApps import across two waves: May-5 initial import (100 accounts), May-6 retrospective Fall 2025 top-up for families who joined Spring 2026 first (64 additional accounts). Current state: 164 accounts across 3 seasons (Fall 2025 + Winter 2025-26 + Spring 2026), 244 transactions, $166,910 billed, $165,635 gross / $160,244 net to bank. Email-first dedup. DeMasi: 2 legitimate co-guardian rows (no merge needed). KHOJASTEH: family correctly modeled with both parents linked to Aubtin via player_guardians; financial_accounts attached to mom (Anjella Teimoori).

⬅ Status (reconciled 2026-06-02 — see EMBER_PENDING_LEDGER §4.0 + §4.BV for the verified index): in-app QR **SHIPPED** (`qrcode.react` dep + `ShareScheduleButton.jsx`) — the 3-B/6-A QR arc is no longer unbuilt. Already DONE since this list was written: 2-B weather (Open-Meteo, wired), 3-A location mgr UI (`/admin/locations`), schedule-change notifications, coach_roundup briefing, QR, **4-B auto-notifications** (Stream A handler gates on `organizations.auto_notifications.reminders_enabled` per Wave 3.A #19 P0-3 closure, PR #643; the operator settings UI — `AutoNotificationSettingsForm` at `/admin/settings` → Communications — shipped 2026-06-09 with the admin-gated `set_org_auto_notifications` RPC). BLOCKED: 5-C player stats/box score — §16.12 forbids per-player game stats in 2026 (do not build).

---

## §5 SCHEMA ILLUSTRATIVE TABLES (foundation 001–012 + Wave + Ghost migrations)

> Extracted from CLAUDE.md §5 on 2026-06-19. These are illustrative / partly-stale
> dated tables; the source of truth for current schema is the migrations directory
> (`supabase/migrations/`). The live RLS patterns and "Key Field Decisions (locked)"
> remain in CLAUDE.md §5.

> The illustrative tables below capture the foundation (001–012) and select Wave migrations.
> They are NOT exhaustive, and the per-file 001–012 names below are partly stale (consult the directory for actual filenames). Actual count 190 files in `supabase/migrations/` (as of 2026-06-02).
> Source of truth for the full list is the migrations directory; consult it directly when
> reasoning about current schema.

| # | File | What It Does |
|---|---|---|
| 001 | foundation.sql | organizations, user_roles (membership; there is no `org_members` table), seasons, LH seed |
| 002 | programs_teams.sql | programs, team_staff, LH 5 teams seed |
| 003 | players_guardians.sql | players, guardians, player_guardians, roster_members, pricing_tiers, payment_plans, discount_codes, registrations, payments, form_fields, form_responses, waivers, waiver_signatures |
| 004 | activities.sql | events (was "activities" — table renamed mid-flight; migration filename retained per archive doctrine), event_change_audit |
| 005 | rsvp_checkin_interactions.sql | event_rsvps (was rsvps), check_ins, event_duties (was activity_duties), event_rides (was activity_rides), event_comments (was activity_comments), event_views (was activity_views), player_activations |
| 006 | messaging.sql | messages, message_reactions, message_reads |
| 007 | notifications.sql | notifications |
| 008 | locations_opponents.sql | locations, opponents, FK additions, LH venue seeds |
| 009 | invites.sql | team_invites |
| 010 | scoring.sql | game_results, game_plays |
| 011 | financials.sql | Phase 7 — TBD |
| 012 | indexes_views.sql | all performance indexes |

#### Wave migrations (May 4–5, 2026 — canonical version strings)
| Version | Name | What It Does |
|---|---|---|
| 20260504190331 | wave_1h_rls_with_check_hygiene_24_policies | WITH CHECK on 24 ALL/UPDATE policies |
| 20260504213434 | wave_3b_hardening_anon_column_grants | Column-level anon grants on events/game_results/tournaments |
| 20260504230402 | wave_5b_game_plays_table | game_plays for live scoring play-by-play |
| 20260505024916 | wave_2d3_event_arrivals_and_checklist_state | event_arrivals + coach_checklist_state on events |
| 20260505115253 | wave_7b2_season_rollover_schema | seasons.status + season_rollovers audit table |
| 20260505120640 | wave_7a_financials_schema | financial_accounts + financial_transactions + coach_payouts |
| 20260505140316 | wave_7a_add_processing_fee_cents | processing_fee_cents column + family_balances view |
| 20260505161540 | user_roles_self_privilege_escalation_fix | Split user_roles_self into SELECT + INSERT(parent only) |

#### Ghost migrations (applied via SQL editor, not registered — known divergence)
**Audit-day reconciliation (Wave 1+2.A, 2026-05-28):** 16 ghost migrations exist as repo files but are NOT registered in `supabase_migrations.schema_migrations` (the 5 originally documented below + 13 stale legacy-numbered `023_*`–`033_*` files that were renumbered to timestamp versions but never deleted from the repo — pre-PR-#566 state). Plus 29 orphan applied changes (DB-registered versions whose repo files were renamed to different timestamps, AP #21 mirror-discipline violations) — including 8 with NO repo mirror at all (backfilled in PR #566). Wave 2.A #23 reconciliation (PR #566): 6 AP #21 drift files renamed, 8 backfill mirrors written; the 13 stale files were slated for deletion but 6 (023_*–028_*) REMAIN present as of 2026-05-29 (deletion incomplete — D1-4). Schemas are live in production; if running `supabase db reset`, the 5 originally-documented ghosts are needed to recreate the schema.
- `20260504_messaging.sql` — messages table + message_reads + RLS
- `20260504_dm_threads.sql` — dm_threads (user_a/user_b) + messages.dm_thread_id + RLS
- `20260504_ride_requests.sql` — event_ride_requests table + RLS
- `20260504_game_results_cascade_delete.sql` — FK CASCADE on game_results.event_id
- `20260504_rls_cleanup_dangling_policies.sql` — drops orphaned org_announcements/message_drafts policies

---

## AP #50 RETIREMENT — rationale + cross-references

> Extracted from CLAUDE.md anti-pattern #50 on 2026-06-19. The live RETIRED line +
> standing rule remain in CLAUDE.md §11.

Rationale: comfort over velocity. Empirical signal that drove the
retirement — home page LCP regressed to ~5s (vs §17.1 1.5s target)
without the surface methodology catching it because perf was deferred
to Wave 2 RUM-data availability. "Comfort level of clean code in
current state" is the operative criterion before next-phase build
engages, not perf budgets or architectural invariants alone.

Cross-references that previously cited AP #50:
- AP #56, #58, #59 — principles stand (stop-conditions, cross-batch
  synthesis, close-when-exhausted); "narrow-scope" framing was not
  in their active rule language, so no edit needed.
- AP #61 — reworded to drop the "parallel narrow-scope agents per
  AP #50" methodology line; pre-phase audit gate principle remains.

---

## AP #56 RETIREMENT — rationale + cross-references

> Extracted from CLAUDE.md anti-pattern #56 on 2026-06-19. The live RETIRED line +
> standing rule remain in CLAUDE.md §11.

Rationale: every prior session where CC invoked AP #56/AP #59 to
close, Frank's actual signal was to continue. The discipline was
applying brakes the operator didn't want applied. Comfort over
velocity remains the §17.8 audit-gate criterion; capacity-pacing
inside a single session is not.

Cross-references that previously cited AP #56:
- AP #59 — also RETIRED in the same PR.
- AP #61 — "Stop conditions per AP #56 + AP #59" line dropped; the
  pre-phase audit gate principle remains.

See §4.AQ for the policy lock + Wave 2.C close.

---

## AP #59 RETIREMENT — rationale + cross-references

> Extracted from CLAUDE.md anti-pattern #59 on 2026-06-19. The live RETIRED line +
> standing rule remain in CLAUDE.md §11.

Rationale: in every prior session where CC invoked AP #59 to close,
Frank's actual signal was to continue. The discipline applied brakes
the operator didn't want applied. Comfort over velocity remains the
§17.8 audit-gate criterion (it governs whether next-phase build
opens); capacity-pacing inside a single session is not.

Cross-references that previously cited AP #59:
- AP #56 — also RETIRED in the same PR.
- AP #61 — "Stop conditions per AP #56 + AP #59" line dropped; the
  pre-phase audit gate principle remains.

See §4.AQ for the policy lock + Wave 2.C close.
