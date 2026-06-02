# BRIEFINGS COVERAGE — L99 AUDIT

**Written:** May 10, 2026
**Last refresh:** 2026-06-02 (Wave 3.A #20 PATTERN STALE-DOC P1 closure — §4.AR / §4.BV-batch-1). Wave 5 closures (`games_recap`, `academy_callup_notice` surface, cancellation gate) are already documented in the body sections below; production `comms_messages_kind_check` has 12 canonical kinds (CLAUDE.md §13 rule 8 lists them). The original "9 canonical" framing is superseded.
**Verified against production:** post-PR #59 + #60 merge (sha `bf80c13`); subsequent rebrand + audit-arc PRs (#619-#655) did not alter the kind taxonomy or renderer contract.
**Source-of-truth files:**
- `src/lib/engine/resolvers/registry.js` — `RESOLVER_REGISTRY` (the kind authority: resolver+composer mapping + `sendPath` per kind; 11 calendar-anchored kinds)
- `src/lib/briefings/kindMetadata.js` — KIND_ORDER (12 kinds) + KIND_METADATA
- `src/lib/engine/composer.js` — `KIND_COMPOSERS` (legacy `compose()` path, 4 composers only: announcement, custom_message + defensive weekly_digest, academy_callup_notice). No longer the kind authority.
- `src/lib/engine/sectionRenderers.js` — `SECTION_RENDERERS` (32 section renderers; split out of composer.js 2026-05-24 to hold the 150-line cap)
- `src/components/briefings/AudiencePicker.jsx` — MODES + modesAvailableFor
- `src/lib/briefings/recipientFilter.js` — audience-type → team_ids resolver

This document is the canonical coverage map for parent-facing briefings. When a new event/game scenario is proposed, check it against §3 cross-product matrix below. When a kind is added or surfaced, update this file in the same PR.

---

## 0. Resolver Layer (wave 4.2-A — calendar-as-spine)

Two-stage contract locked in wave 4.2-A-1. Every kind in 4.2-A follows it:

```
resolveX(anchor, options = {}) -> { context, slices }
composeX(context, slice, overrides = {}) -> { subject, content_sections }
```

Properties:
- **Pure.** Same input → same output. No side effects, no DB writes.
- **`options.now`** is the time-injection point (default `new Date()`).
- **`options.supabase`** is the client (required; pass mock in tests).
- **`anchor`** is one positional arg (UUID for single-key, object for multi-key).
- **`slices` is deterministically ordered.** Family slices ORDER BY guardian_id ASC; team slices ORDER BY teams.sort_order ASC then teams.id ASC. This stabilizes `slices[0]`, which existing code stores as the "sample" content_sections on the message row.

Per-kind anchor + slice taxonomy:

| Kind | Anchor | Slice (kind) | Slice ordering | Status |
|---|---|---|---|---|
| weekly_digest | `{ orgId, period, pilotOnly }` | family | guardian_id ASC | ✅ shipped 4.2-A-1 |
| game_recap | `{ eventId, pilotOnly }` | family (event team) | guardian_id ASC | ✅ shipped 4.2-A-2 |
| tournament_prelim | `{ tournamentId, pilotOnly }` | team (recipient_guardians embedded) | teams.sort_order ASC, teams.id ASC | ✅ shipped 4.2-A-3 |
| tournament_recap | `{ tournamentId, pilotOnly }` | team (recipient_guardians embedded) | teams.sort_order ASC, teams.id ASC | ✅ shipped 4.2-A-4 |
| schedule_change | `{ eventId, pilotOnly }` | family (event team) | guardian_id ASC | ✅ shipped 4.2-A-5 |
| rsvp_nudge | `{ eventId, pilotOnly }` | family (unresponded) | guardian_id ASC | ✅ shipped 4.2-A-6 |
| academy_callup_notice | `{ eventId, playerId, pilotOnly }` | family (player guardians) | guardian_id ASC | ✅ shipped 4.2-A-7 |
| coach_roundup | `{ coachUserId, dateRange }` | coach (one briefing, multi-team, conflict-aware) | n/a (single recipient) | ✅ shipped Wave 5 PR 4 |
| family_guide | `{ parentUserId, dateRange }` | parent (one briefing, multi-kid, conflict-aware) | n/a (single recipient) | ✅ shipped Wave 5 PR 5 |
| games_recap | `{ eventIds, pilotOnly }` (anchor_kind=`multi_event`, anchor_id null) | family (union across selected games' teams) | guardian_id ASC | ✅ shipped Wave 5 PR B/C |
| announcement | (free-form) | n/a | n/a | not calendar-driven |
| custom_message | (free-form) | n/a | n/a | not calendar-driven |

Reference implementation: `src/lib/engine/resolvers/weeklyDigest.js`.

## 1. Briefing kind taxonomy

**12 kinds** — the full set in `KIND_ORDER` (kindMetadata.js) AND production `comms_messages_kind_check`. The kind authority is `RESOLVER_REGISTRY` (11 calendar-anchored kinds) + `KIND_METADATA`; `composer.js KIND_COMPOSERS` holds only 4 legacy `compose()` composers (announcement, custom_message + defensive weekly_digest, academy_callup_notice). All 12 are surfaced in the kind picker except `academy_callup_notice` (discoverable but `wizardSupported: false` — the canonical flow is EventDetail → AcademyCallupPicker, see §3). The 7 transitional/legacy `kind_check` values (`tournament_preliminary`, `tournament_final`, `tournament_rsvp_lock`, `tournament_recap_interim`, `tournament_recap_final`, `multi_team_notice`, `custom`) have been **dropped** — production `kind_check` now allows exactly these 12 and nothing else (verified via Supabase MCP, 2026-05-29).

| # | Kind | Surfaced? | Anchor (default) | Audience (default) | Status |
|---|------|-----------|------------------|---------------------|--------|
| 1 | weekly_digest | ✅ | org / team / multi_team | org_all | shipped |
| 2 | schedule_change | ✅ | event (locked) | event_attendees (locked) | shipped |
| 3 | game_recap | ✅ | event | event_attendees | shipped wave 4.1d-1 |
| 4 | games_recap | ✅ | org / multi_event (anchor_id null) | multi_event_attendees (locked) | shipped Wave 5 (G1) |
| 5 | tournament_prelim | ✅ | tournament | tournament_attendees | shipped wave 4.1d-1 |
| 6 | tournament_recap | ✅ | tournament | tournament_attendees | shipped wave 4.1d-1 |
| 7 | coach_roundup | ✅ | org (coach_user_id in audience_filter) | coach_self | shipped Wave 5 PR 4 |
| 8 | family_guide | ✅ | org (parent_user_id in audience_filter) | family_specific | shipped Wave 5 PR 5 |
| 9 | announcement | ✅ | team / org | org_all | shipped wave 4.1d-1 |
| 10 | rsvp_nudge | ✅ | event | event_attendees (locked) | shipped wave 4.0 |
| 11 | academy_callup_notice | ✅ discoverable (wizard not supported) | event | player_specific (locked) | shipped wave 4.1d-2 (G2) |
| 12 | custom_message | ✅ | any | any | shipped wave 4.1d-1 |

Picker order follows `KIND_ORDER`: weekly_digest, schedule_change, game_recap, games_recap, tournament_prelim, tournament_recap, coach_roundup, family_guide, announcement, rsvp_nudge, academy_callup_notice, custom_message.

## 2. Audience taxonomy

| Audience type | Filter logic | Used by |
|---|---|---|
| org_all | All families in org | weekly_digest, announcement, custom_message |
| team | Single team | weekly_digest, announcement, game_recap, custom_message |
| multi_team | List of teams (`audience_filter.team_ids`) | weekly_digest, custom_message |
| event_attendees | Families on event's team | schedule_change (locked), rsvp_nudge (locked), game_recap |
| tournament_attendees | Families across `tournament_teams.team_id` | tournament_prelim (locked), tournament_recap (locked) |
| player_specific | Guardians of selected players (`audience_filter.player_ids`) via `player_guardians` | academy_callup_notice (locked) — shipped wave 4.1d-2 |
| multi_event_attendees | Union of attendees across N selected events (`audience_filter.event_ids`), deduped by guardian_id | games_recap (locked) — shipped Wave 5 (G1) |
| coach_self | The single coach (`audience_filter.coach_user_id`) the roundup is built for | coach_roundup (derived) — shipped Wave 5 PR 4 |
| family_specific | The single parent (`audience_filter.parent_user_id`) the guide is built for | family_guide (derived) — shipped Wave 5 PR 5 |

**Missing modes (gaps):** none. `multi_event_attendees` (formerly the G1 gap) shipped with games_recap in Wave 5; `coach_self` / `family_specific` added with coach_roundup / family_guide.

## 3. Event × Briefing cross-product matrix

Event lifecycle states pulled from migrations 003-005 + CLAUDE.md §5 field decisions.

| Event lifecycle | Pre-event briefings | Post-event briefings | Coverage |
|---|---|---|---|
| Practice (regular) | weekly_digest, schedule_change, rsvp_nudge | — | ✅ |
| Practice (cancelled) | schedule_change | — | ✅ |
| Game — regular season | weekly_digest, schedule_change, rsvp_nudge | game_recap | ✅ |
| Game — scrimmage (`is_scrimmage=true`) | weekly_digest, schedule_change, rsvp_nudge | game_recap | ⚠️ E1 (subject doesn't say "scrimmage") |
| Game — tournament pool play | weekly_digest, schedule_change, tournament_prelim | game_recap or tournament_recap | ✅ |
| Game — tournament bracket | tournament_prelim, schedule_change | game_recap or tournament_recap | ✅ |
| Game — bonus / consolation (`is_bonus_game=true`) | weekly_digest | game_recap | ⚠️ no copy differentiation |
| Game — cancelled (`status='cancelled'`) | schedule_change | — | ⚠️ E2 (recap composable but produces awkward email) |
| Game — bracket placeholder (`is_bracket_placeholder=true`, unseeded) | — | — | ⚠️ E3 (synth may surface as needs-recap) |
| Game — no score logged yet | — | game_recap (renders without score) | ✅ graceful |
| Tournament (multi-day, all your team's games) | tournament_prelim | tournament_recap | ✅ |
| **Multi-game weekend (mixed teams or non-tournament)** | weekly_digest | **games_recap** (multi_event, union audience) | ✅ shipped Wave 5 (G1) |
| Per-coach week-ahead (all of a coach's teams, conflict-aware) | **coach_roundup** | — | ✅ shipped Wave 5 PR 4 |
| Per-parent week-ahead (all of a parent's kids, conflict-aware) | **family_guide** | — | ✅ shipped Wave 5 PR 5 |
| Tournament with mid-tournament standings update | — | custom_message | ⚠️ no dedicated kind |
| League standings change (post-game shift) | — | custom_message | ⚠️ no dedicated kind |
| Roster change (player added/dropped) | — | announcement | ✅ |
| Org-level news | — | announcement | ✅ |
| **Academy call-up (futures → roster for one game)** | — | **academy_callup_notice (player_specific)** | ✅ shipped wave 4.1d-2 (G2) |
| Photo / media drop | — | announcement | ⚠️ no image-block-first kind |
| Tryouts / season selections | — | announcement / custom_message | ✅ |

## 4. Edge cases observed

| ID | Edge case | Severity | Behavior today | Fix scope |
|---|---|---|---|---|
| E1 | Scrimmage recap subject reads "Recap —", not "Scrimmage recap —" | minor copy | works | wave 4.2 (renderer change) |
| E2 | Cancelled game allows game_recap composition | low | synth excludes; kind picker gate deferred to wave 4.2 | ✅ shipped wave 4.1d-2 (synth side, G3) |
| E3 | Bracket placeholder games surface in game_recap synth | medium | now excluded from synth | ✅ shipped wave 4.1d-2 (G4) |
| E4 | tournament_recap on tournament with `schedule_status='preliminary'` | low | synth requires schedule_status IN ('complete','live','final') | ✅ shipped wave 4.1d-2 (G5) |
| E5 | game_recap CTA hides silently when event has no parent tournament with `tourney_url` | medium | CTA label field hidden when no parent tournament | ✅ shipped wave 4.1d-2 |
| E6 | Multi-team event (joint practice) + game_recap | low | composer assumes single team; renders with one team's color | wave 4.2 |
| E7 | Game with `is_scrimmage=true` AND `tournament_id` set (tournament scrimmage) | edge | currently treated as tournament game — probably right | leave as-is |
| E8 | League play game vs AAU — same renderer | by design | wave 4.5 will split via circuit-aware composers | wave 4.5 |
| E9 | comms_messages.status stayed 'queued' even after sent_at populated (dispatcher path missing flip) | medium | composerSubmit now flips status='sent' after edge fn returns | ✅ shipped wave 4.1d-2 (§6.1) |
| E10 | Scheduled-send messages had 0 comms_message_recipients rows (would 400 when cron eventually fires) | high (wave 4.3 blocker) | scheduled-send now inserts recipients at compose time (audience snapshot) | ✅ shipped wave 4.1d-2 (§6.2) |
| E11 | PlayerPicker for `academy_callup_notice` searched ALL org players — wrong-team call-up surface | medium | scoped to `member_type='futures_academy'` only; D-COVERAGE-2 ratifies (widening requires new kind variant) | ✅ shipped wave 4.1d-3 |

## 5. Identified gaps — priority order

### G1. games_recap kind (Frank's primary ask) — ✅ SHIPPED Wave 5 (PR B/C)

Multi-game digest covering 1+ teams across N selected events. Use cases: tournament weekend, double-header, "this week we played 4 games" summary. Shipped:
- `resolveGamesRecap` + `composeGamesRecap` (`src/lib/engine/resolvers/gamesRecap.js`), registered in `RESOLVER_REGISTRY` with `sendPath: 'composerSubmit'`.
- `anchor_kind='multi_event'` — `event_ids: [uuid, ...]` stored in `audience_filter`; `anchor_id` left NULL. `anchorFromState` reads `state.audience_filter.event_ids`.
- `audience_type='multi_event_attendees'` (locked) — union of team_ids across event_ids, deduped by guardian_id, in `recipientFilter.js`.
- KIND_METADATA entry (`GamesRecapBody`, `wizardSupported: true`), KIND_ORDER between game_recap and tournament_prelim, production `kind_check` allows `games_recap`.
- No template file yet (body editor `GamesRecapBody.jsx` only — see §field-shape note in BRIEFING_TEMPLATES.md).

### G2. academy_callup_notice surfacing — ✅ SHIPPED wave 4.1d-2 (PR #62)

Renderer at `src/lib/engine/renderers/academyCallupNotice.js` was 78 lines, ready. Now surfaced:
- Added to `KIND_ORDER` between `rsvp_nudge` and `custom_message`.
- `KIND_METADATA` entry: icon `UserPlus`, label "Academy call-up", description "Invite an Academy player to play up with a team for one event", `audienceLocked: true`, `defaultAudienceType: 'player_specific'`.
- `AudiencePicker.MODES` includes `player_specific` ("Specific player(s)") with `modesAvailableFor('academy_callup_notice')` locked to that mode only.
- `recipientFilter.resolvePlayerSpecificAudience(playerIds)` queries `player_guardians` joined with `guardians` and `players` to dedupe by guardian_id and return the audience shape `{ guardian_id, email, team_ids }`.
- Body editor `AcademyCallupBody.jsx` (73 lines) collects player picker selection, coach name, jersey color, RSVP URL, and an optional intro note. Player picker is a 84-line modal that searches across all org players (Academy badge surfaces `member_type='futures_academy'`).

### G3. Cancellation gate — ✅ SHIPPED wave 4.1d-2 (synth side; PR #62)

Synth (`useNeedsBriefing.fetchGameRecapItems`) now excludes events with `status='cancelled'` from the game_recap needs-attention list. Tournament-side gate folded into G5. Kind-picker gate (admin still composing a recap for a cancelled event) deferred to wave 4.2 — synth is the higher-leverage fix.

### G4. Bracket placeholder synth filter — ✅ SHIPPED wave 4.1d-2 (PR #62)

`useNeedsBriefing.fetchGameRecapItems` now excludes events with `is_bracket_placeholder=true` from the synth list. Production has 0 today but the filter is cheap and prevents future regressions when bracket placeholders are added during real tournaments.

### G5. tournament_recap status gate — ✅ SHIPPED wave 4.1d-2 (PR #62)

`useNeedsBriefing.fetchTournamentRecapItems` now requires `tournaments.schedule_status` to be NULL or one of `('complete', 'final', 'live')` before synthesizing a recap-due card. Defensive against recapping a not-yet-started tournament.

### G6. Scrimmage subject differentiation

Tiny copy tweak in `gameRecap.js` `buildSubject`: prefix "Scrimmage" when `is_scrimmage=true`.

- ~3 lines in renderer
- **Scope: wave 4.2** (lives in renderer; bundle with templates rebuild)

### G7. standings_update kind (deferred)

Mid-tournament/mid-season standings shift. Use case: "After Sat games, 10U Blue is now 5-2 in CYO."

- v1 workaround: custom_message + cta_buttons section
- **Scope: defer to wave 4.3+**

### G8. photo_drop kind (deferred)

Image-first email with photo gallery.

- v1 workaround: announcement + paste image URL into body
- **Scope: defer to wave 4.3+**

## 6. Scope assignments (ratified May 10, 2026)

**Wave 4.1d-2 (UX polish + small fixes) — SHIPPED PR #62**
- ✅ Filter chip context-aware (header subtitle hides on Drafts/History tabs)
- ✅ Default time window now "Last 14 days" (was "All time"; legacy NULL prefs upgrade in fromRow)
- ✅ Synth filters event_type='game' for game_recap (already in place; confirmed in audit)
- ✅ FAB z-index lowered 1000→30 + bottom shifted 16→80 (no longer covers Messages icon)
- ✅ Team picker dropdown auto-closes on selection
- ✅ Audience picker "0 families" race eliminated via recipientsLoading guard
- ✅ Kind picker stable order (sortKinds now returns spec order regardless of usage data)
- ✅ Label drift "Tournament prelim" → "Tournament briefing" everywhere (synth + metadata)
- ✅ E5 CTA-field UX: hide league/bracket CTA label field when event has no parent tournament
- ✅ G3 cancellation gate (synth side)
- ✅ G4 bracket placeholder synth filter
- ✅ G5 tournament_recap status gate
- ✅ G2 academy_callup_notice surfacing
- ✅ §6.1 (E9) status='sent' flip after edge fn returns
- ✅ §6.2 (E10) scheduled-send recipients inserted at compose time (audience snapshot)
- ✅ §1.5 TOURNAMENT_RECAP_WINDOW_MS broadened 7d→30d
- ✅ §4.4 NEEDS RECAP test-send copy split (recipient_count > 1 splits real send vs test)

Deferred from wave 4.1d-2 to wave 4.2:
- Pilot mode "Settings → Communications" deeplink — copy updated to be direct, but no settings UI exists yet.
- Anchor picker stability memoization — deferred to wave 4.2 (renderer rebuild touches the picker).
- Cancellation gate in StepKindPicker (admin compose flow) — synth side covers the high-leverage case.

**Wave 4.2 (templates + renderer rebuild):**
- briefing_templates seeding per (org × team_type × kind)
- DB-driven body section schemas; JS engine reads templates from DB
- Rich rendering (hero blocks, score cards, photo blocks, structured highlight pills)
- Per-recipient personalization (player_first_name etc.)
- games_recap kind (G1)
- Scrimmage subject differentiation (G6)
- Multi-team event renderer support (E6)

**Wave 4.3 (auto-draft engine — shipped):**
- ✅ 4.3-A: weekly_sunday trigger handler + briefing-auto-draft-tick edge function
- ✅ 4.3-D: callup token mint infrastructure
- ✅ 4.3-E: P0 hotfix — verify_jwt config drift
- ✅ 4.3-F: cron secret → app_secrets architectural fix
- ✅ 4.3-G: JWT secret → app_secrets (closes Deno.env shared-secret surface)
- ✅ 4.3-B: 5 remaining trigger handlers (game_completed, tournament_approaching, tournament_completed, schedule_changed, rsvp_low_24h_before) + force-fire ops override + comms_messages body_html/body_plain NOT NULL fix
- ⏳ 4.3-C: inbox UI for auto-drafts (deferred)
- ⏳ event_reminder_due trigger handler (not_implemented stub remains; deferred until ops need surfaces)

**Wave 4.5+ (deferred):**
- standings_update kind (G7)
- photo_drop kind (G8)
- Circuit-aware composer split (wave 4.5 stub: weekly_digest_aau vs weekly_digest_league)

## 7. Process — keeping this doc honest

When adding a new kind:
1. Update §1 table (Surfaced? + Anchor + Audience defaults).
2. Update §3 matrix if it covers a new event-lifecycle state.
3. Update §6 with which wave shipped it.
4. PR description must reference this file.

When closing a gap:
1. Move the entry from §5 to a "shipped" subsection (or delete and reference in §6).
2. Update §3 matrix coverage column from gap → ✅.

When adding an edge case to §4:
1. Assign a fresh E# ID (next sequential).
2. Reference it in the matrix Coverage column.

---

**Document trail:**
- v2.0: May 29, 2026 — Wave 5 reconciliation against current engine code. Taxonomy moved from a 10-kind/9-surfaced/1-deprecated world to **12 kinds**, all in production `comms_messages_kind_check` (verified via Supabase MCP). Added `coach_roundup`, `family_guide`, `games_recap`; all 7 transitional/legacy `kind_check` values dropped. Source-of-truth header corrected: kind authority moved from `composer.js KIND_COMPOSERS` (now 4 legacy composers only) to `resolvers/registry.js RESOLVER_REGISTRY` + `kindMetadata.js`; `sectionRenderers.js` (32 renderers) split out of composer.js 2026-05-24. §0 / §1 / §2 / §3 / §5-G1 updated. `multi_event_attendees` gap closed; `coach_self` / `family_specific` audiences added. The §0 resolver contract, §4 edge-case table, and audience-filter mechanics were verified still accurate and left unchanged.
- v1: May 10, 2026 — initial audit post-wave 4.1d-1 ship + Frank's May 10 production verification.
- v1.1: May 10, 2026 — wave 4.1d-5: legacy `tournament_preliminary` and `custom` code emit sites retired (8 sites migrated). `comms_messages.kind_check` still allows transitional legacy values until wave 4.1d-6 backfills + tightens.
- v1.2: May 10, 2026 — wave 4.2-A-1: §0 Resolver Layer added with two-stage contract. `resolveWeeklyDigest` + `composeWeeklyDigest` shipped as the reference implementation. Snapshot test locks parity against production row 3b431eb1.
- v1.3: May 10, 2026 — wave 4.2-A-2: `resolveGameRecap` + `composeGameRecap` shipped. Anchor `{ eventId, pilotOnly }`. `GameRecapNotPublishedError` thrown when `published_at IS NULL`. Compose UI replaces score / POG / coach_highlight inputs with read-only displays + Quick Score edit-links. Snapshot anchor: hand-authored expected output for event a0b2d68a (10U Blue vs Resurrection White 4AB, 2026-05-02 W 2-0). Production unlock: 32 published-but-unrecapped games no longer require manual retyping.
- v1.4: May 10, 2026 — wave 4.2-A-3: `resolveTournamentPrelim` + `composeTournamentPrelim` shipped. Anchor `{ tournamentId, pilotOnly }`. Slice = team, recipient_guardians embedded. d-7 parity (per-day schedule table, survival guide, coach keys, per-game map links) folded into the new pipeline. Deprecated `tournamentPreliminary.js` deleted. Override-merge precedence rule: override beats data when both present.
- v1.5: May 10, 2026 — wave 4.2-A-4: `resolveTournamentRecap` + `composeTournamentRecap` shipped. Same anchor + slice shape as 4.2-A-3. Walks game_results joined to events for per-team game_log + final placement. content_sections shape: header + placement_block + game_log + (override-only: standout_moments, coach_reflection) + signoff + footer. Hallucination guards: published_at null → "Result not published" status, null POG/empty highlight → key omitted, null final_place → block omitted. Snapshot anchor: ZG Chase for the Chain NY (Apr 11–12, 2026, 3 teams: 11U Girls + 10U Black Champions, 8U Boys Finalists). whats_next walk deferred.
- v1.6: May 10, 2026 — wave 4.2-A-5: `resolveScheduleChange` + `composeScheduleChange` shipped. Walks `event_change_audit` (NOT `schedule_change_audit_table` as previously misnamed). Computes `changed_fields` under timezone-normalized comparison (Date.getTime() rather than string equality), fixing a production bug where the legacy compose rendered "moved from 7:35 PM to 7:35 PM" gibberish for fields that differed only in timezone-string format (`+00:00` vs `Z`). Throws `NoScheduleChangeError` (no audit row) or `NoActualScheduleChangeError` (changed_fields empty). Cancellation kind + `recurrence_scope='series'` covered. Snapshot locks the corrected output for the May 9 production audit row 0820aa1a.
- v1.7: May 10, 2026 — wave 4.2-A-6: `resolveRsvpNudge` + `composeRsvpNudge` shipped. Anchor `{ eventId, pilotOnly }`. Slice = family with `unresponded_kid_first_names` + `unresponded_kid_player_ids` (filters to guardians with at least one unresponded kid via NOT EXISTS against event_rsvps). Personalized subject `"RSVP needed for {kids} — {event}"` with Oxford comma. RSVP token URLs are NOT minted in resolver/compose; literal `{{rsvp_*_url}}` placeholders emitted, send-time renderer substitutes via existing token mint infrastructure. Urgency formatter: Today / Tomorrow (Weekday) / Weekday / Month Day. Throws `EventHasNoTeamError` or `EventAlreadyStartedError`.
- v1.8: May 10, 2026 — wave 4.2-A-7: `resolveAcademyCallupNotice` + `composeAcademyCallupNotice` shipped. **First two-ID anchor in the wave**: `{ eventId, playerId, pilotOnly }`. Slice = family with single `kid_first_name` + `player_id` (the called-up player's guardians ONLY). Cross-team vs same-team narrative branches on receiving == home team identity. Sanity guards: `EventNotFoundError`, `PlayerNotFoundError`, `PlayerNotAcademyError`, `EventHasNoTeamError`, `EventAlreadyStartedError`, `PlayerNotCalledUpError`. Response window: `min(now+2h, start-30min)` capped so recipient always has ≥30 min. Callup token URLs NOT minted — literal `{{callup_accept_url}}` / `{{callup_decline_url}}` placeholders; mint infrastructure deferred. **All 7 calendar-anchored kinds now have resolver pairs.** Wave 4.2-A is one PR away from completion (4.2-A-8 atomic send-pipeline switch).
- v1.19: May 11, 2026 — wave 4.3-B: 5 remaining auto-draft trigger handlers wired into `briefing-auto-draft-tick`. (1) `handleGameCompleted` selects `game_results.published_at` within last 7 days, joins to events→teams for org scope, inserts `kind='game_recap'` placeholder draft per event. (2) `handleTournamentApproaching` selects `tournaments.start_date` within `lead_time_hours` (default 72h) for the org, kind=`tournament_prelim`. (3) `handleTournamentCompleted` selects `tournaments.end_date` in last 14 days, kind=`tournament_recap`. (4) `handleScheduleChanged` walks `event_change_audit` within last 24h, kind=`schedule_change`; per-audit-row idempotency (drafts older than this audit row's `changed_at` are stale — fresh one created). (5) `handleRsvpLow24h` selects events starting within next 24h, kind=`rsvp_nudge` (heuristic = window-based; coverage threshold refinement deferred). Handler module extracted to sibling `_handlers.ts` (≤150 LoC lock preserved); index.ts dispatch switch maps each `trigger_event` → handler. Per-org collapse refactored from per-(org, team_type) to per-(org, trigger_event) — eliminates fan-out across team_type duplicates. **Force-fire override:** `POST /briefing-auto-draft-tick?force_trigger_event=<event>&force_now=<ISO>` bypasses weekly_sunday TZ gate and overrides Date.now() for handler windows. Idempotency still applies. **NOT NULL bug surfaced + fixed:** `comms_messages.body_html` + `body_plain` are NOT NULL with no defaults; 4.3-A's `buildWeeklyDigestDraftRow` and the new `placeholderDraft` both omitted them (NULL content_sections passed in 4.3-A also). First post-deploy cron tick returned `null value in column "body_html"` for game_recap inserts; weekly_sunday's TZ gate had masked the same latent bug since 4.3-A. Both builders fixed to emit `body_html: ""`, `body_plain: ""`, `content_sections: []` — empty strings stay placeholders until admin previews via the resolver path (wave-4.2-A-8a). Mirror lock (anti-pattern #30): change applied to both `src/lib/cron/briefingCronHelpers.js` and `supabase/functions/briefing-auto-draft-tick/_helpers.ts`; vitest assertion updated to match. End-to-end smoke via 6 force-fire HTTP calls (game_completed + replay, tournament_approaching, tournament_completed, schedule_changed, rsvp_low_24h_before, weekly_sunday bypass): 6 game_recap created → 6 already_drafted on replay, 1 schedule_change created, 3 rsvp_nudge created, 1 weekly_digest created; 0 tournament_prelim / tournament_recap (no anchors in window). Inserted rows verified shape-correct in DB. v6 active. event_reminder_due remains stubbed.
- v1.18: May 10, 2026 — wave 4.3-G: closes the last Deno.env shared-secret surface. 4.3-F's auth pass exposed that `briefing-cron-dispatch` 500'd with `{"error":"SUPABASE_JWT_SECRET missing"}` — function reads JWT_SECRET from Deno.env to mint impersonation JWTs for `send-tournament-message` (verify_jwt:true target), and that env var had never been set. 4.3-G mirrors 4.3-F's pattern: secret moves to `app_secrets.supabase_jwt_secret`, dispatch reads via service-role SELECT at request time. **Delivered:** (1) Migration `20260510232037` drops `NOT NULL` constraint on `app_secrets.value` (existing rows unaffected) and provisions a `supabase_jwt_secret` row with NULL value. Admin populates value once via SQL UPDATE post-merge with the project's JWT secret from Supabase dashboard (Settings → API → JWT Settings). (2) `briefing-cron-dispatch` refactored: extracted shared `getAppSecret(sb, name)` helper used for both `cron_secret` (auth check) and `supabase_jwt_secret` (downstream JWT minting). Fail-loud on NULL value with diagnosable error referencing `app_secrets.<name> is NULL — admin must populate` (distinct from generic 401 / 500). (3) Audit test extended: 4.3-F's JWT_SECRET exemption retired; ANY shared-secret function matching `Deno.env.get('*_SECRET')` now fails CI. Negative-tested. (4) CLAUDE.md anti-pattern #33 expanded to enumerate all 4 shared secrets in app_secrets + the architectural seam flag (dispatcher JWT-minting can be eliminated by refactoring send-tournament-message's auth model in a future wave; out of scope for 4.3-G). **POST-MERGE ADMIN ACTION:** after CI completes function redeploy, dispatcher will 500 with `app_secrets.supabase_jwt_secret is NULL` until admin runs:
  ```sql
  UPDATE public.app_secrets
  SET value = '<jwt_secret_from_supabase_dashboard>', rotated_at = now()
  WHERE name = 'supabase_jwt_secret';
  ```
  JWT secret is found at Supabase Dashboard → Settings → API → JWT Settings → JWT Secret. After the UPDATE, next cron tick returns 200; dispatcher ready for scheduled briefings when any exist. **Tests:** 465 → 465 (audit test count unchanged; existing 15 tests still pass after JWT_SECRET exemption removed). **Cron secret rotation runbook:** all four shared secrets (cron_secret, rsvp_token_secret, callup_token_secret, supabase_jwt_secret) rotate via SQL UPDATE on the app_secrets row. Zero Deno.env shared-secret surface remains in this codebase (`resend-webhook-receiver` exempted per platform-managed SVIX signing key).
- v1.17: May 10, 2026 — wave 4.3-F (architectural fix): cron secret moves from `Deno.env` to `app_secrets`. The dashboard-twice provisioning path (one click for DB GUC + one click for function env var) had been blocked for hours by environment mismatch — Supabase CLI unavailable in CC's environment, no MCP `set_function_secret` tool, and the dashboard halves kept being deferred. **Architectural fix:** stop using Deno.env for shared secrets entirely. Follow the existing token-handler pattern (rsvp_token_secret, callup_token_secret) where the secret lives in `app_secrets` and is settable via SQL. **What ships:** (1) Migration `20260510225122` provisions `app_secrets.cron_secret` with server-side `encode(gen_random_bytes(32), 'hex')` (idempotent — no regen on re-apply), then `cron.unschedule + cron.schedule` rewrites both `briefing-dispatch-tick` and `briefing-auto-draft-tick` job commands to read Bearer from `app_secrets` instead of the GUC. Migration verification block confirms secret length=64 + cron commands reference `app_secrets`. (2) Both edge function sources (`briefing-cron-dispatch/index.ts` and `briefing-auto-draft-tick/index.ts`) refactored: extract `readCronSecret(sb)` helper that does a service-role `SELECT value FROM app_secrets WHERE name = 'cron_secret'` at request time; auth check compares Bearer against the read value. (3) Audit test extended for new anti-pattern #33: shared-secret functions matching `Deno.env.get('*_SECRET')` fail CI (with `SUPABASE_JWT_SECRET` and `resend-webhook-receiver` exempted — JWT_SECRET is for impersonation on JWT-verified functions; webhook secrets are platform-managed by SVIX/Resend). 15 audit tests now (was 8 in 4.3-E) — 7 directories × 2 anti-patterns + 1 sanity. (4) `docs/CRON_SECRET_SETUP.md` deleted (obsolete; dashboard path no longer applies). (5) CLAUDE.md anti-pattern #33 added with rotation note. **Cron secret rotation runbook:** `UPDATE app_secrets SET value = encode(gen_random_bytes(32), 'hex'), rotated_at = now() WHERE name = 'cron_secret';` — immediate, no dashboard, no CLI, no redeploy required. **Tests:** 458 → 465 (+7). Anti-pattern #33 adds 7 per-function-dir assertions to the existing audit. **Wave 4.3 status post-merge:** weekly_digest auto-draft engine fires on next Sunday 8am ET tick after CI redeploys both functions to v4 (no longer gated on dashboard work). 4.3-B unblocked.
- v1.16: May 10, 2026 — wave 4.3-E (P0 hotfix): edge function `verify_jwt` config drift + zombie draft cleanup + audit lock. Two functions shipped earlier this session — `briefing-auto-draft-tick` (4.3-A) and `callup-token-handler` (4.3-D) — were both deployed via MCP with `verify_jwt: false` (v1) but were missing from `supabase/config.toml`. CI's auto-deploy from GitHub Actions runner (`/home/runner/work/skyfire-app/...` entrypoint paths) subsequently redeployed both at v2 with defaults (`verify_jwt: true`), blocking every invocation at the Supabase gateway with `UNAUTHORIZED_INVALID_JWT_FORMAT`. **Implication uncovered:** the auto-draft engine has never had a chance to fire (4.3-A blocked); no parent has been able to click an accept/decline link from a callup notice (4.3-D blocked end-to-end). RPC-layer verification in 4.3-D's migration `DO $$` block tested SQL semantics only — never the HTTP gateway path. **Delivered:** (1) `supabase/config.toml` adds 2 entries declaring `verify_jwt = false` for both functions; CI's next deploy on merge will redeploy with correct flags. (2) Cleanup migration `20260510213602` deletes 3 zombie drafts (`9218f14f`, `c4e85879`, `f3ff0abc`) created by BriefingComposer autosave during pre-hotfix admin testing — defensive criteria check inside `DO $$` aborts if drift detected. (3) New vitest audit at `src/lib/__tests__/verifyJwtConfigAudit.test.js` enforces the shared-secret → config.toml linkage; detects via grep for `CRON_SECRET`-style env vars, `searchParams.get('t'|'token')`, and `verify_*_token` RPC references. Negative-test verified: removing either new config entry fails the audit. (4) CLAUDE.md anti-patterns #31 (shared-secret functions need config.toml + audit test) and #32 (DO $$ confirms SQL only, not gateway) locked. **Bug scan (Frank's combined plan from chat-side MCP audit):** 6 issues total this session — 1 fixed in 8d (P0 wizard test-send), 2 fixed in 8e (this PR: verify_jwt drift), 1 fixed in 8e (this PR: zombie cleanup), 2 cosmetic remaining (PreviewPanel weekly_digest stub + pre-existing file-length violations). **Tests:** 450 → 458 (+8). 1 sanity + 7 function-dir assertions in the new audit test. **NOT included (intentional):** no MCP redeploy of either function (would race CI's next deploy and create v3+); no fold of `send-tournament-message` 185-line violation. **Wave 4.3 status post-hotfix:** code paths for 4.3-A + 4.3-D were correct; gateway block now removed. Cron secret dashboard work remains the gate to end-to-end fire of 4.3-A's auto-draft engine. 4.3-B + 4.3-C still queued behind that.
- v1.15: May 10, 2026 — wave 4.2-A-8d: P0 hotfix. The "Send test to admin@" button on the Compose · Body screen for weekly_digest was triggering the 4.2-A-8a dispatch guard ("weekly_digest sends via digestSend directly; should not reach composerSubmit"), blocking Frank's weekly briefing test-send workflow via the generic BriefingComposer wizard. Discovery surfaced that the wizard's weekly_digest path was half-wired — kind exposed in `TEAM_BRIEFING_KINDS` (TeamDetailPage.jsx) + body editor present, but the data-gathering layer that DigestComposer uses (period, events, tournaments, teams, rsvpCountsByEvent via useDigestEvents) was never replicated for the wizard. The dispatch guard was the right architectural backstop; the bug was the wizard over-claiming support for a kind whose data-gathering it didn't replicate. **Fix (Path A):** new pure helper `sendWeeklyDigestFromWizard` translates wizard state shape → sendWeeklyDigest's expected args. New `useWizardDigestData` hook bundles the digest-specific data gathering (period defaults to `defaultPeriod()`; admin uses DigestComposer for non-default periods). BriefingComposer.onSend short-circuits kind=weekly_digest to call the helper directly; composerSubmit's dispatch guard remains intact as the defensive backstop. Real-send via the wizard ALSO works (testOnly=false flows through identically). **Bug scan (Frank's request):** ran 8 pattern classes — zero other dispatch-guard regressions; URL wrapping clean across all three token mints (rsvp/callup/unsubscribe) post 4.2-A-8c URL-wrap fix; no half-wired kinds in event/tournament header entry points; migration drift unchanged from CLAUDE.md §5 ghost migrations baseline; test coverage solid. Only the P0 surfaced. **Tests:** 444 → 450 (+6) in `sendWeeklyDigestFromWizard.test.js`. Existing composerSubmit dispatch test (weekly_digest → throws) stays green — guard is intact, the wizard just no longer routes there. **File-length lock side-quest:** my 8c edits left composerSubmit.dispatch.test.js at 154 lines (4 over); compacted to 146. My 8d BriefingComposer edits initially landed at 170; compacted via hook extraction + comment trim to 148. Pre-existing weeklyDigest.js (152) and send-tournament-message/index.ts (185) untouched (out of scope, documented throughout session).
- v1.14: May 10, 2026 — wave 4.2-A-8c: the final PR of wave 4.2-A. Wires the callup token infrastructure from 4.3-D into the academy_callup_notice send path. **Wave 4.2-A is now COMPLETE at 7/7 calendar-anchored kinds on registry path.** Delivered: (1) new pure helper `substituteCallupTokens(content_sections, tokenMapByPlayer)` mirroring substituteRsvpTokens — per-player tokenMap keying preserved for symmetry even though callup is always single-player; field rename `callup_token_placeholders` → `callup_token_urls`; throws on missing player_id (defense in depth). (2) new atomic renderer `callup_response` in `composer.js` SECTION_RENDERERS — 2 stacked buttons (accept = green, decline = neutral), fail-loud literal `{{callup_*_url}}` fallback when urls absent. (3) new send helper `sendAcademyCallupNotice({state, supabase, now})` — registry resolve → per-slice loop with 2 mints per slice (accept + decline) → URL wrap via callup-token-handler base → substitute → comms_messages INSERT → queueComposedMessages with adminSample → send-tournament-message invoke → status='sent'. (4) registry update: academy_callup_notice `sendPath: 'blocked'` → `'academyCallupSend'`; `blockedReason` field removed; `NoCallupTokenInfrastructureError` class retained for test imports but no longer thrown at dispatch time. (5) composerSubmit: 'blocked' branch removed; 'academyCallupSend' short-circuit added (mirrors 'rsvpNudgeSend' pattern); PreviewPanel dead 'blocked' code paths removed. (6) AcademyCallupBody cleanup: `introNote` renamed to `coach_note` (flows into overrides.coach_note via bodyOverrides, picked up by composeAcademyCallupNotice's narrative loop); stale fields (`jerseyColor`, `coachName`, `rsvpUrl`) dropped from defaultValue + validate; `coachName` no longer required (signoff auto-populated from org coaches). (7) **Latent bug fix in 8b-b sendRsvpNudge:** `mintRsvpToken` was returning the raw signed token instead of the full handler URL — would have rendered `<a href="<raw_token>">` as a broken relative link the first time anyone sent rsvp_nudge. Fixed by wrapping into `${RSVP_HANDLER_BASE}?t=<token>&action=<response>` (mirrors legacy `mintLinksForPlayer` pattern). Bug hadn't manifested because no rsvp_nudge has been sent via the new pipeline yet. (8) Compose contract fix: 4.2-A-7 composeAcademyCallupNotice was emitting `callup_response` section without `player_id`; added 1-line fix + updated snapshot fixture. Tests: 429 → 444 (+15). New: substituteCallupTokens (6), callupResponse renderer (4), sendAcademyCallupNotice integration (4). Updated: composerSubmit dispatch test (academy_callup_notice → short-circuits to sendAcademyCallupNotice instead of throws); registry test (sendPath assertion). **Wave 4.2-A status: COMPLETE.** 7 of 7 calendar-anchored kinds on registry path: weekly_digest → digestSend, game_recap/tournament_prelim/tournament_recap/schedule_change → composerSubmit fan-out, rsvp_nudge → rsvpNudgeSend, academy_callup_notice → academyCallupSend. Wave 4.3 status: 2 of 4 sub-waves shipped (4.3-A + 4.3-D); 4.3-B (5 trigger event handlers) and 4.3-C (inbox UI) still gated on Frank's cron secret dashboard setup.
- v1.13: May 10, 2026 — wave 4.3-D: callup token mint infrastructure shipped as a parallel-track PR (no dependency on the cron secret gating 4.3-B/C). Mirror of the rsvp-token pattern for academy callup responses. **What ships:** (1) `callup_token_uses` table — nonce single-use audit, mirror of `rsvp_token_uses`. (2) `mint_callup_token(p_event_id, p_player_id, p_guardian_id, p_response)` SECURITY DEFINER RPC — HMAC-signed JWT with 30-day expiry, payload `{e, p, g, r ∈ {accept, decline}, n, x}`. (3) `verify_callup_token(p_token)` SECURITY DEFINER RPC — HMAC verify + nonce reuse check, returns payload jsonb (with `_already_used: true` flag if nonce in callup_token_uses). (4) `apply_callup_decline(p_event_id, p_player_id)` service-role-only RPC — `array_remove` on `events.academy_callup_player_ids`. (5) `callup_token_secret` row in `app_secrets` (provisioned with random 32-byte base64 at migration time; rotate via SQL UPDATE on the row — NO dashboard sync required, distinct from the `CRON_SECRET` deadlock). (6) `callup-token-handler` edge function — verify_jwt: false (token is the auth), HMAC verify → nonce lock → upsert `event_rsvps` (accept→'going', decline→'not_going') → on decline, `apply_callup_decline` removes from callup array → confirmation HTML. (7) Pure helper `src/lib/callup/tokenPayload.js` (`parseCallupTokenPayload` for client-side preview). (8) Migration verification block confirms accept + decline roundtrips end-to-end. **STOP-gate finding from Step-1 discovery:** `log_pii_change` is not callable from the handler's service-role context (`auth.uid()` returns NULL; `pii_audit_log.actor_user_id` is NOT NULL). Mitigation: skip pii_audit_log for token-driven declines; `callup_token_uses` row is the audit trail. Matches rsvp-token-handler precedent (rsvp also doesn't audit to pii_audit_log). Admin-flow `add_academy_callup` / `remove_academy_callup` continue to write pii_audit_log for human-driven changes. **Tests:** 423 → 429 (+6) for the pure helper. RPC + edge function smoke tests documented in `docs/CALLUP_TOKEN_TESTING.md` (chat-side runbook). **Wave 4.2-A status: unblocked.** 4.2-A-8c is the last PR remaining (compose wire-up + dispatch unblock + substituteCallupTokens helper); after it ships wave 4.2-A is fully complete (7/7). **Wave 4.3 status:** 2 of 4 sub-waves shipped (4.3-A weekly_digest auto-draft + 4.3-D callup token infra). 4.3-B and 4.3-C still gated on cron secret dashboard work.
- v1.12: May 10, 2026 — wave 4.3-A: auto-draft engine end-to-end for weekly_digest. **Premise correction:** the auto-draft engine did not exist prior to this PR. Pre-existing infrastructure (briefing_triggers config table with 22 rows, pg_cron + pg_net extensions, briefing-dispatch-tick cron job firing every minute since 2026-05-09) was scaffolding for a service that was never built. The existing briefing-cron-dispatch function is a scheduled-send dispatcher (wave 3.17) that reads `comms_messages WHERE status='scheduled'` and forwards to send-tournament-message — it has zero reference to briefing_triggers and has never been a draft-creation surface. This PR builds the auto-draft engine from scratch as a SEPARATE function (`briefing-auto-draft-tick`) on its own pg_cron job (`briefing-auto-draft-tick`, every minute). The existing scheduled-send dispatcher is untouched. **Two-function split intentional** for blast-radius isolation: scheduled-send is stable+narrow; auto-draft is new and grows across 4.3-B/C. Both share the same `CRON_SECRET` (DB GUC `app.settings.cron_secret` + function env var) per `docs/CRON_SECRET_SETUP.md`. **Trigger event coverage in 4.3-A:** weekly_sunday IMPLEMENTED (TZ gate Sunday 08:00-08:59 NY tz + idempotency check on `(org_id, kind, period_start)` + draft insert with subject/content_sections NULL — resolver runs fresh at preview/send time per the wave-4.2-A-8a locked behavior). Other 5 trigger events stubbed (return `{skipped: 'not_implemented'}`); 4.3-B fills them in. **Q3 lock:** weekly_sunday triggers collapse to one org-wide weekly_digest per Sunday (anchor_kind='org', anchor_id=org_id, ignores team_type_id; the 6 seeded weekly_sunday triggers act as a boolean "is at least one active for this org" gate). Per-team_type variation deferred. **Helpers extracted to `src/lib/cron/briefingCronHelpers.js`** (vitest-covered source of truth) with a Deno-runtime mirror at `supabase/functions/briefing-auto-draft-tick/_helpers.ts` (CLAUDE.md anti-pattern #30 added: keep mirrors in sync). Cross-tree imports from src/ aren't guaranteed to resolve in Supabase Edge Function deploys; mirror is pragmatic. Logic uses only standard ES + Intl, so the two files are near-identical apart from TS annotations. Manual invocation tool: `scripts/trigger-cron-dispatch.sh`. Tests: 408 → 423 (+15) — all in briefingCronHelpers.test.js (TZ gate, period computation, idempotency key, draft shape). **Cron secret coordination required:** until Frank sets both `app.settings.cron_secret` (DB GUC) and `CRON_SECRET` (function env var) via Supabase dashboard, every cron tick 401s — fail-loud and harmless. Same blocker applies to the existing briefing-cron-dispatch (still 401'ing pre-secret).
- v1.11: May 10, 2026 — wave 4.2-A-8b-b: rsvp_nudge migrated to RESOLVER_REGISTRY as one cohesive PR with 7 coupled changes. (1) `resolveRsvpNudge` slice shape v2: `unresponded_kids: Array<{player_id, first_name}>` ASC by first_name, replacing the v1 parallel arrays (`unresponded_kid_first_names` ASC by name + `unresponded_kid_player_ids` ASC by player_id) — those had different sort orders, breaking positional indexing. (2) `composeRsvpNudge` v2: emits one `rsvp_request` section PER unresponded kid (instead of one section with a names array). Each section carries singular `kid_first_name` + `player_id` + literal `{{rsvp_*_url}}` placeholder triple. Subject ordering preserved (Oxford comma) and now matches section order (alphabetical by first_name). (3) New pure helper `substituteRsvpTokens(content_sections, tokenMapByPlayer)` walks rsvp_request sections and replaces `rsvp_token_placeholders` with `rsvp_token_urls` keyed by section.player_id. Throws on missing player_id key (defense in depth). (4) New `rsvp_request` atomic renderer registered in `composer.js` SECTION_RENDERERS — closes the gap surfaced in 8b-a discovery (renderer was missing, sending rsvp_nudge → registry would have rendered buttonless emails). Heading + sub-context + 3 stacked buttons (going/maybe/not_going) with inline styles for Resend compatibility. Fail-loud fallback: if `rsvp_token_urls` is absent, hrefs render literal `{{rsvp_*_url}}` strings — smoke-test signal. (5) `sendRsvpNudge` rewritten on registry path: resolve → per-slice loop → per-kid mint (3 RPCs per kid via existing `mint_rsvp_token` per-(event, player, guardian, response) RPC) → substitute → INSERT comms_messages (sample = first slice's UN-substituted compose; admin BCC inherits placeholder buttons via new `adminSample` param on `queueComposedMessages` so an admin tap doesn't accidentally RSVP for the first family) → `queueComposedMessages` with adminSample → invoke `send-tournament-message` → mark sent. Legacy `mintLinksForPlayer`, `fetchPlayersForGuardianOnTeam`, and the legacy whole-email `composeRsvpNudge` (`engine/renderers/rsvpNudge.js`) all deleted. (6) `queueComposedMessages` now accepts optional `adminSample` to pin admin BCC body to a sample distinct from messages[0] (no-op for the 4 calendar-anchored kinds whose content_sections is invariant across slices). (7) `composerSubmit` call-site signature update: from legacy 8-arg shape to `{state, supabase, now}`; redundant pre-call event lookup deleted. Token semantics: per-(event, player, guardian, response) — Option A locked. mint_rsvp_token RPC unchanged; rsvp-token-handler edge function unchanged; no DB migrations. Tests: 401 → 408 (+7 net: substituteRsvpTokens 6 + rsvpRequest renderer 4 + sendRsvpNudge integration 4 - legacy whole-email composer test 7). **Wave 4.2-A status: 6/7 calendar-anchored kinds fully on registry path.** Only academy_callup_notice remains on the blocked path (→ 4.2-A-8c, gated on wave 4.3 callup token mint). KIND_COMPOSERS now retains only the 2 free-form kinds (announcement, custom_message) plus weekly_digest (defensive, production via digestSend) and academy_callup_notice (preview only, sends blocked).
- v1.10: May 10, 2026 — wave 4.2-A-8b-a: per-slice fan-out for the 4 composerSubmit kinds (game_recap, tournament_prelim, tournament_recap, schedule_change). New helper `src/lib/briefings/queueComposedMessages.js` accepts `{messageId, messages: [{slice, subject, content_sections}], testOnly}` and writes per-recipient `comms_message_recipients` rows with `body_html_rendered` keyed per recipient. Family slices expand to one row per slice; team slices expand to N rows per `slice.recipient_guardians[i]`. Multi-team families on tournament fan-out are deduped by guardian_id (first team wins). Per the wave-locked contract, content_sections is invariant across slices for these 4 kinds — fan-out produces identical bodies today, no recipient-visible change. The win is architectural symmetry: when a future kind needs per-recipient personalization (kid-name in subject etc.), no further pipeline changes required. composerSubmit refactored to lift `composeViaRegistry` → `resolveAndComposePerSlice` (returns `{messages, sample}`) and routes the registry path through queueComposedMessages while free-form kinds (announcement, custom_message) keep the legacy single-body queueRecipients path. Tests: 392 → 401 (+9) — queueComposedMessages.test.js (8 unit tests) + 1 fan-out test in composerSubmit.dispatch.test.js. **Wave 4.2-A-8b split**: 8b-a (this PR) ships fan-out; 8b-b (next) ships rsvp_nudge → registry migration with rsvp_request renderer + per-kid compose expansion (Option A per Frank's call) + substituteRsvpTokens accepting per-player tokenMap. Discovery surfaced two findings deferred to 8b-b: (1) `composer.js` SECTION_RENDERERS lacks `rsvp_request` — shipping rsvp_nudge → registry today would render emails missing buttons; (2) `mint_rsvp_token` RPC is per-(event, player, guardian, response), forcing per-kid expansion (Option A locked). Body audit posted in PR #75 description: zero cleanup actions across 8 components.
- v1.9: May 10, 2026 — wave 4.2-A-8a: atomic send-pipeline switch. New `src/lib/engine/resolvers/registry.js` is the single source of truth for resolver+composer mapping per kind, exposing `RESOLVER_REGISTRY`, `CALENDAR_ANCHORED_KINDS`, `isCalendarAnchored`, `getDispatchSendPath`, plus error classes `NoCallupTokenInfrastructureError` and `NoRecipientsError`. Each entry carries `resolve`, `compose`, `anchorFromState`, `overridesFromState`, and a `sendPath` discriminator: `composerSubmit` (the 4 main-flow kinds — game_recap, tournament_prelim, tournament_recap, schedule_change), `digestSend` (weekly_digest), `rsvpNudgeSend` (rsvp_nudge — registry migration deferred to 4.2-A-8b), `blocked` (academy_callup_notice — pending callup token mint in wave 4.3). composerSubmit refactored to a 5-branch dispatch: rsvp_nudge short-circuit (preserved), wrong-call-site guards for `digestSend`/`rsvpNudgeSend`, blocked path that throws `NoCallupTokenInfrastructureError`, registry path for `composerSubmit`, legacy `compose()` path for free-form kinds. PreviewPanel rewritten to be registry-aware via the new `useResolverPreview` hook (calendar-anchored kinds preview through the resolver pipeline; free-form kinds keep legacy compose; blocked kind shows a warning banner). GameRecapBody's `useEffect` bridge — the only one in production — deleted; data displays read directly from `data.context` via `useResolverPreview`. `composer.js` `KIND_COMPOSERS` registry trimmed: `composeScheduleChange` / `composeGameRecap` / `composeTournamentPrelim` / `composeTournamentRecap` entries + imports removed. Test suite: 374 → 392 (+18). New: `registry.test.js` (8 unit tests) + `composerSubmit.dispatch.test.js` (10 dispatch tests covering all 5 branches + NoRecipientsError). Per-slice fan-out, sendRsvpNudge migration, and Body-component audit deferred to 4.2-A-8b. **Wave 4.2-A complete.**
