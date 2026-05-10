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

## 1. Briefing kind taxonomy

10 composers registered in `composer.js`. **8 surfaced** in the kind picker. 1 dormant. 1 deprecated.

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
| 9 | academy_callup_notice | ❌ dormant | event | (needs `player_specific`) | renderer ready, picker unwired |
| 10 | tournament_preliminary | ❌ deprecated | (legacy wave-2) | (legacy) | replaced by `tournament_prelim` |

## 2. Audience taxonomy

| Audience type | Filter logic | Used by |
|---|---|---|
| org_all | All families in org | weekly_digest, announcement, custom_message |
| team | Single team | weekly_digest, announcement, game_recap, custom_message |
| multi_team | List of teams (`audience_filter.team_ids`) | weekly_digest, custom_message |
| event_attendees | Families on event's team | schedule_change (locked), rsvp_nudge (locked), game_recap |
| tournament_attendees | Families across `tournament_teams.team_id` | tournament_prelim (locked), tournament_recap (locked) |

**Missing modes (gaps):**
- `multi_event_attendees` — union of attendees across N selected events. Required for `games_recap`.
- `player_specific` — single family scoped via `player_guardians`. Required to surface `academy_callup_notice`.

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
| **Academy call-up (futures → roster for one game)** | — | **❌ GAP G2 — renderer dormant** | renderer ready, picker unwired |
| Photo / media drop | — | announcement | ⚠️ no image-block-first kind |
| Tryouts / season selections | — | announcement / custom_message | ✅ |

## 4. Edge cases observed

| ID | Edge case | Severity | Behavior today | Fix scope |
|---|---|---|---|---|
| E1 | Scrimmage recap subject reads "Recap —", not "Scrimmage recap —" | minor copy | works | wave 4.2 (renderer change) |
| E2 | Cancelled game allows game_recap composition | low | no validation gate | **wave 4.1d-2** (G3) |
| E3 | Bracket placeholder games surface in game_recap synth | medium | synth filter missing | **wave 4.1d-2** (G4) |
| E4 | tournament_recap on tournament with `schedule_status='preliminary'` | low | no validation gate | **wave 4.1d-2** (G5) |
| E5 | game_recap CTA hides silently when event has no parent tournament with `tourney_url` | medium | label entered, button vanishes | **wave 4.1d-2** (CTA-field UX item, Frank-added) |
| E6 | Multi-team event (joint practice) + game_recap | low | composer assumes single team; renders with one team's color | wave 4.2 |
| E7 | Game with `is_scrimmage=true` AND `tournament_id` set (tournament scrimmage) | edge | currently treated as tournament game — probably right | leave as-is |
| E8 | League play game vs AAU — same renderer | by design | wave 4.5 will split via circuit-aware composers | wave 4.5 |

## 5. Identified gaps — priority order

### G1. games_recap kind (Frank's primary ask)

Multi-game digest covering 1+ teams across N selected events. Use cases: tournament weekend, double-header, "this week we played 4 games" summary.

- **New composer + renderer** — body sections: hero ("10U Blue · Week of May 3 · 2-1"), mini score card per game, optional team highlights, signoff, footer
- **New `anchor_kind='multi_event'`** — store `event_ids: [uuid, ...]` in `audience_filter`; `anchor_id` left NULL
- **New `audience_type='multi_event_attendees'`** — implementation in `recipientFilter.js`: union team_ids across event_ids
- **briefing_template seed** — wave 4.2 templates work
- **Scope: wave 4.2**

### G2. academy_callup_notice surfacing

Renderer at `src/lib/engine/renderers/academyCallupNotice.js` is 78 lines, ready. Just unwired.

- Add `'academy_callup_notice'` to `KIND_ORDER`
- Add metadata entry to `KIND_METADATA` (icon: `UserPlus`, label: "Academy call-up", description: "One-game call-up notice for a futures player")
- Add `'player_specific'` to AudiencePicker MODES
- Implement `player_specific` resolver in `recipientFilter.js` (player_guardians → guardian_id list)
- **Scope: wave 4.1d-2** (mostly wiring, one new resolver)

### G3. Cancellation gate

Disable `game_recap` and `tournament_recap` kinds in StepKindPicker when source event is `status='cancelled'`.

- One-line filter in StepKindPicker
- **Scope: wave 4.1d-2**

### G4. Bracket placeholder synth filter

Exclude `is_bracket_placeholder=true` from `game_recap` needs-attention synth in `needsAttention.js`.

- One-line filter
- **Scope: wave 4.1d-2**

### G5. tournament_recap status gate

Require `tournaments.schedule_status IN ('complete', 'live')` for `tournament_recap` kind in StepKindPicker.

- One-line filter in StepKindPicker
- **Scope: wave 4.1d-2**

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

**Wave 4.1d-2 (UX polish + small fixes):**
- All §9 UX items from d-1 master prompt (filter chip, header context, FAB z-index, dropdown auto-close, default time window, synth event-type filter, label drift)
- All "NEW" items observed in Frank's May 10 production walk-through (audience race, pilot-mode dead-end, anchor picker stability, kind picker "Last sent" inconsistency, status='queued' vs sent_at, NEEDS RECAP test-send copy)
- CTA-field UX (E5)
- Cancellation gate (G3)
- Bracket placeholder synth filter (G4)
- tournament_recap status gate (G5)
- academy_callup_notice surfacing (G2)

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
