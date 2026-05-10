# BRIEFINGS COVERAGE — L99 AUDIT

**Written:** May 10, 2026
**Verified against production:** post-PR #59 + #60 merge (sha `bf80c13`)
**Source-of-truth files:**
- `src/lib/briefings/kindMetadata.js` — KIND_ORDER + KIND_METADATA
- `src/lib/engine/composer.js` — KIND_COMPOSERS registry
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
| announcement | (free-form) | n/a | n/a | not calendar-driven |
| custom_message | (free-form) | n/a | n/a | not calendar-driven |

Reference implementation: `src/lib/engine/resolvers/weeklyDigest.js`.

## 1. Briefing kind taxonomy

10 composers registered in `composer.js`. **9 surfaced** in the kind picker. 1 deprecated.

| # | Kind | Surfaced? | Anchor (default) | Audience (default) | Status |
|---|------|-----------|------------------|---------------------|--------|
| 1 | weekly_digest | ✅ | org / team / multi_team | org_all | shipped |
| 2 | schedule_change | ✅ | event (locked) | event_attendees (locked) | shipped |
| 3 | rsvp_nudge | ✅ | event | event_attendees (locked) | shipped wave 4.0 |
| 4 | game_recap | ✅ | event | event_attendees | shipped wave 4.1d-1 |
| 5 | tournament_prelim | ✅ | tournament | tournament_attendees | shipped wave 4.1d-1 |
| 6 | tournament_recap | ✅ | tournament | tournament_attendees | shipped wave 4.1d-1 |
| 7 | announcement | ✅ | team / org | org_all | shipped wave 4.1d-1 |
| 8 | custom_message | ✅ | any | any | shipped wave 4.1d-1 |
| 9 | academy_callup_notice | ✅ | event | player_specific (locked) | shipped wave 4.1d-2 (G2) |
| 10 | ~~tournament_preliminary~~ | ❌ retired | — | — | code emit sites retired in wave 4.1d-5 (PR retires `useTournamentBriefing`, `inferMessageType`, `composer.js` registry, `constants.js`, `TournamentBriefing.jsx`, `MessagesTab.jsx`); CHECK constraint tighten + historical-row backfill ships in wave 4.1d-6 |

## 2. Audience taxonomy

| Audience type | Filter logic | Used by |
|---|---|---|
| org_all | All families in org | weekly_digest, announcement, custom_message |
| team | Single team | weekly_digest, announcement, game_recap, custom_message |
| multi_team | List of teams (`audience_filter.team_ids`) | weekly_digest, custom_message |
| event_attendees | Families on event's team | schedule_change (locked), rsvp_nudge (locked), game_recap |
| tournament_attendees | Families across `tournament_teams.team_id` | tournament_prelim (locked), tournament_recap (locked) |
| player_specific | Guardians of selected players (`audience_filter.player_ids`) via `player_guardians` | academy_callup_notice (locked) — shipped wave 4.1d-2 |

**Missing modes (gaps):**
- `multi_event_attendees` — union of attendees across N selected events. Required for `games_recap` (G1, wave 4.2).

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
| **Multi-game weekend (mixed teams or non-tournament)** | weekly_digest | **❌ GAP G1 — needs `games_recap`** | gap |
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

### G1. games_recap kind (Frank's primary ask)

Multi-game digest covering 1+ teams across N selected events. Use cases: tournament weekend, double-header, "this week we played 4 games" summary.

- **New composer + renderer** — body sections: hero ("10U Blue · Week of May 3 · 2-1"), mini score card per game, optional team highlights, signoff, footer
- **New `anchor_kind='multi_event'`** — store `event_ids: [uuid, ...]` in `audience_filter`; `anchor_id` left NULL
- **New `audience_type='multi_event_attendees'`** — implementation in `recipientFilter.js`: union team_ids across event_ids
- **briefing_template seed** — wave 4.2 templates work
- **Scope: wave 4.2**

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

**Wave 4.3 / 4.5+ (deferred):**
- Auto-draft engine (cron-driven trigger evaluation)
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
- v1: May 10, 2026 — initial audit post-wave 4.1d-1 ship + Frank's May 10 production verification.
- v1.1: May 10, 2026 — wave 4.1d-5: legacy `tournament_preliminary` and `custom` code emit sites retired (8 sites migrated). `comms_messages.kind_check` still allows transitional legacy values until wave 4.1d-6 backfills + tightens.
- v1.2: May 10, 2026 — wave 4.2-A-1: §0 Resolver Layer added with two-stage contract. `resolveWeeklyDigest` + `composeWeeklyDigest` shipped as the reference implementation. Snapshot test locks parity against production row 3b431eb1.
- v1.3: May 10, 2026 — wave 4.2-A-2: `resolveGameRecap` + `composeGameRecap` shipped. Anchor `{ eventId, pilotOnly }`. `GameRecapNotPublishedError` thrown when `published_at IS NULL`. Compose UI replaces score / POG / coach_highlight inputs with read-only displays + Quick Score edit-links. Snapshot anchor: hand-authored expected output for event a0b2d68a (10U Blue vs Resurrection White 4AB, 2026-05-02 W 2-0). Production unlock: 32 published-but-unrecapped games no longer require manual retyping.
- v1.4: May 10, 2026 — wave 4.2-A-3: `resolveTournamentPrelim` + `composeTournamentPrelim` shipped. Anchor `{ tournamentId, pilotOnly }`. Slice = team, recipient_guardians embedded. d-7 parity (per-day schedule table, survival guide, coach keys, per-game map links) folded into the new pipeline. Deprecated `tournamentPreliminary.js` deleted. Override-merge precedence rule: override beats data when both present.
- v1.5: May 10, 2026 — wave 4.2-A-4: `resolveTournamentRecap` + `composeTournamentRecap` shipped. Same anchor + slice shape as 4.2-A-3. Walks game_results joined to events for per-team game_log + final placement. content_sections shape: header + placement_block + game_log + (override-only: standout_moments, coach_reflection) + signoff + footer. Hallucination guards: published_at null → "Result not published" status, null POG/empty highlight → key omitted, null final_place → block omitted. Snapshot anchor: ZG Chase for the Chain NY (Apr 11–12, 2026, 3 teams: 11U Girls + 10U Black Champions, 8U Boys Finalists). whats_next walk deferred.
- v1.6: May 10, 2026 — wave 4.2-A-5: `resolveScheduleChange` + `composeScheduleChange` shipped. Walks `event_change_audit` (NOT `schedule_change_audit_table` as previously misnamed). Computes `changed_fields` under timezone-normalized comparison (Date.getTime() rather than string equality), fixing a production bug where the legacy compose rendered "moved from 7:35 PM to 7:35 PM" gibberish for fields that differed only in timezone-string format (`+00:00` vs `Z`). Throws `NoScheduleChangeError` (no audit row) or `NoActualScheduleChangeError` (changed_fields empty). Cancellation kind + `recurrence_scope='series'` covered. Snapshot locks the corrected output for the May 9 production audit row 0820aa1a.
- v1.7: May 10, 2026 — wave 4.2-A-6: `resolveRsvpNudge` + `composeRsvpNudge` shipped. Anchor `{ eventId, pilotOnly }`. Slice = family with `unresponded_kid_first_names` + `unresponded_kid_player_ids` (filters to guardians with at least one unresponded kid via NOT EXISTS against event_rsvps). Personalized subject `"RSVP needed for {kids} — {event}"` with Oxford comma. RSVP token URLs are NOT minted in resolver/compose; literal `{{rsvp_*_url}}` placeholders emitted, send-time renderer substitutes via existing token mint infrastructure. Urgency formatter: Today / Tomorrow (Weekday) / Weekday / Month Day. Throws `EventHasNoTeamError` or `EventAlreadyStartedError`.
- v1.8: May 10, 2026 — wave 4.2-A-7: `resolveAcademyCallupNotice` + `composeAcademyCallupNotice` shipped. **First two-ID anchor in the wave**: `{ eventId, playerId, pilotOnly }`. Slice = family with single `kid_first_name` + `player_id` (the called-up player's guardians ONLY). Cross-team vs same-team narrative branches on receiving == home team identity. Sanity guards: `EventNotFoundError`, `PlayerNotFoundError`, `PlayerNotAcademyError`, `EventHasNoTeamError`, `EventAlreadyStartedError`, `PlayerNotCalledUpError`. Response window: `min(now+2h, start-30min)` capped so recipient always has ≥30 min. Callup token URLs NOT minted — literal `{{callup_accept_url}}` / `{{callup_decline_url}}` placeholders; mint infrastructure deferred. **All 7 calendar-anchored kinds now have resolver pairs.** Wave 4.2-A is one PR away from completion (4.2-A-8 atomic send-pipeline switch).
- v1.11: May 10, 2026 — wave 4.2-A-8b-b: rsvp_nudge migrated to RESOLVER_REGISTRY as one cohesive PR with 7 coupled changes. (1) `resolveRsvpNudge` slice shape v2: `unresponded_kids: Array<{player_id, first_name}>` ASC by first_name, replacing the v1 parallel arrays (`unresponded_kid_first_names` ASC by name + `unresponded_kid_player_ids` ASC by player_id) — those had different sort orders, breaking positional indexing. (2) `composeRsvpNudge` v2: emits one `rsvp_request` section PER unresponded kid (instead of one section with a names array). Each section carries singular `kid_first_name` + `player_id` + literal `{{rsvp_*_url}}` placeholder triple. Subject ordering preserved (Oxford comma) and now matches section order (alphabetical by first_name). (3) New pure helper `substituteRsvpTokens(content_sections, tokenMapByPlayer)` walks rsvp_request sections and replaces `rsvp_token_placeholders` with `rsvp_token_urls` keyed by section.player_id. Throws on missing player_id key (defense in depth). (4) New `rsvp_request` atomic renderer registered in `composer.js` SECTION_RENDERERS — closes the gap surfaced in 8b-a discovery (renderer was missing, sending rsvp_nudge → registry would have rendered buttonless emails). Heading + sub-context + 3 stacked buttons (going/maybe/not_going) with inline styles for Resend compatibility. Fail-loud fallback: if `rsvp_token_urls` is absent, hrefs render literal `{{rsvp_*_url}}` strings — smoke-test signal. (5) `sendRsvpNudge` rewritten on registry path: resolve → per-slice loop → per-kid mint (3 RPCs per kid via existing `mint_rsvp_token` per-(event, player, guardian, response) RPC) → substitute → INSERT comms_messages (sample = first slice's UN-substituted compose; admin BCC inherits placeholder buttons via new `adminSample` param on `queueComposedMessages` so an admin tap doesn't accidentally RSVP for the first family) → `queueComposedMessages` with adminSample → invoke `send-tournament-message` → mark sent. Legacy `mintLinksForPlayer`, `fetchPlayersForGuardianOnTeam`, and the legacy whole-email `composeRsvpNudge` (`engine/renderers/rsvpNudge.js`) all deleted. (6) `queueComposedMessages` now accepts optional `adminSample` to pin admin BCC body to a sample distinct from messages[0] (no-op for the 4 calendar-anchored kinds whose content_sections is invariant across slices). (7) `composerSubmit` call-site signature update: from legacy 8-arg shape to `{state, supabase, now}`; redundant pre-call event lookup deleted. Token semantics: per-(event, player, guardian, response) — Option A locked. mint_rsvp_token RPC unchanged; rsvp-token-handler edge function unchanged; no DB migrations. Tests: 401 → 408 (+7 net: substituteRsvpTokens 6 + rsvpRequest renderer 4 + sendRsvpNudge integration 4 - legacy whole-email composer test 7). **Wave 4.2-A status: 6/7 calendar-anchored kinds fully on registry path.** Only academy_callup_notice remains on the blocked path (→ 4.2-A-8c, gated on wave 4.3 callup token mint). KIND_COMPOSERS now retains only the 2 free-form kinds (announcement, custom_message) plus weekly_digest (defensive, production via digestSend) and academy_callup_notice (preview only, sends blocked).
- v1.10: May 10, 2026 — wave 4.2-A-8b-a: per-slice fan-out for the 4 composerSubmit kinds (game_recap, tournament_prelim, tournament_recap, schedule_change). New helper `src/lib/briefings/queueComposedMessages.js` accepts `{messageId, messages: [{slice, subject, content_sections}], testOnly}` and writes per-recipient `comms_message_recipients` rows with `body_html_rendered` keyed per recipient. Family slices expand to one row per slice; team slices expand to N rows per `slice.recipient_guardians[i]`. Multi-team families on tournament fan-out are deduped by guardian_id (first team wins). Per the wave-locked contract, content_sections is invariant across slices for these 4 kinds — fan-out produces identical bodies today, no recipient-visible change. The win is architectural symmetry: when a future kind needs per-recipient personalization (kid-name in subject etc.), no further pipeline changes required. composerSubmit refactored to lift `composeViaRegistry` → `resolveAndComposePerSlice` (returns `{messages, sample}`) and routes the registry path through queueComposedMessages while free-form kinds (announcement, custom_message) keep the legacy single-body queueRecipients path. Tests: 392 → 401 (+9) — queueComposedMessages.test.js (8 unit tests) + 1 fan-out test in composerSubmit.dispatch.test.js. **Wave 4.2-A-8b split**: 8b-a (this PR) ships fan-out; 8b-b (next) ships rsvp_nudge → registry migration with rsvp_request renderer + per-kid compose expansion (Option A per Frank's call) + substituteRsvpTokens accepting per-player tokenMap. Discovery surfaced two findings deferred to 8b-b: (1) `composer.js` SECTION_RENDERERS lacks `rsvp_request` — shipping rsvp_nudge → registry today would render emails missing buttons; (2) `mint_rsvp_token` RPC is per-(event, player, guardian, response), forcing per-kid expansion (Option A locked). Body audit posted in PR #75 description: zero cleanup actions across 8 components.
- v1.9: May 10, 2026 — wave 4.2-A-8a: atomic send-pipeline switch. New `src/lib/engine/resolvers/registry.js` is the single source of truth for resolver+composer mapping per kind, exposing `RESOLVER_REGISTRY`, `CALENDAR_ANCHORED_KINDS`, `isCalendarAnchored`, `getDispatchSendPath`, plus error classes `NoCallupTokenInfrastructureError` and `NoRecipientsError`. Each entry carries `resolve`, `compose`, `anchorFromState`, `overridesFromState`, and a `sendPath` discriminator: `composerSubmit` (the 4 main-flow kinds — game_recap, tournament_prelim, tournament_recap, schedule_change), `digestSend` (weekly_digest), `rsvpNudgeSend` (rsvp_nudge — registry migration deferred to 4.2-A-8b), `blocked` (academy_callup_notice — pending callup token mint in wave 4.3). composerSubmit refactored to a 5-branch dispatch: rsvp_nudge short-circuit (preserved), wrong-call-site guards for `digestSend`/`rsvpNudgeSend`, blocked path that throws `NoCallupTokenInfrastructureError`, registry path for `composerSubmit`, legacy `compose()` path for free-form kinds. PreviewPanel rewritten to be registry-aware via the new `useResolverPreview` hook (calendar-anchored kinds preview through the resolver pipeline; free-form kinds keep legacy compose; blocked kind shows a warning banner). GameRecapBody's `useEffect` bridge — the only one in production — deleted; data displays read directly from `data.context` via `useResolverPreview`. `composer.js` `KIND_COMPOSERS` registry trimmed: `composeScheduleChange` / `composeGameRecap` / `composeTournamentPrelim` / `composeTournamentRecap` entries + imports removed. Test suite: 374 → 392 (+18). New: `registry.test.js` (8 unit tests) + `composerSubmit.dispatch.test.js` (10 dispatch tests covering all 5 branches + NoRecipientsError). Per-slice fan-out, sendRsvpNudge migration, and Body-component audit deferred to 4.2-A-8b. **Wave 4.2-A complete.**
