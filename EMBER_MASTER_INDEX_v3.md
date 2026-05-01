# EMBER MASTER INDEX
## The Single Document That Replaces Everything

**Last full audit:** April 29, 2026 (L99 audit + production state verification via Supabase MCP)
**Audit basis:** 11 files in `/mnt/project/` (17,519 lines), 14 conversation searches across all prior chats, 200+ screenshot reviews from competitive audits, full filesystem verification.
**Purpose:** Single self-contained reference Frank pastes into any future chat. No re-discovery. No re-asking locked decisions. No re-cataloging competitor patterns.

**Supersedes:** STATE_OF_AFFAIRS_L99_v3.md, SKYFIRE_LEVEL99_MASTER.md, SKYFIRE_BUILD_QUEUE_v2.md, NEW_CHAT_STARTER_PROMPT.md, LH_OPS_SPEC.md, LH_BRAND_CONTENT_MODEL.md, EMBER_TENANCY_ARCHITECTURE_v3.md, SKYFIRE_FULL_AUDIT.md, SKYFIRE_OPTION_A_AUDIT.md.

**How to use in a new chat:**
> "Read /mnt/project/EMBER_MASTER_INDEX.md and /mnt/project/CLAUDE.md before responding. State the current wave, what shipped last, and any blockers. Do not re-ask any locked decision documented inside. Do not re-execute any feature documented as shipped. Then ask me what we're working on."

---

# 0. THE BUSINESS MOAT (READ FIRST)

**Communication is the moat. Records are pretty.**

Legacy Hoopers is the only AAU youth basketball program in Westchester that runs weekly per-team briefings, per-family tournament guides, and Sunday morning day recaps. Every other program sends a group text saying "game tomorrow at 10."

The business model is **player retention**. Retention happens because parents feel treated like a college program. Treatment shows up in communication.

Frank currently spends **4-8 hours every week** writing HTML communications by hand. At scale (8 teams, then 25 teams at St. Pat's), that's 8-25 hours/week. No human does that. The platform must inherit Frank's voice.

This reframes the build: **Communications Foundation is Wave 4, not Phase 3.**

## The 5 briefing types

| # | Type | Frank's effort today | Auto-generates from |
|---|---|---|---|
| 1 | Team Briefing (Wed/Thu weekly per team) | 30-45 min × 5 teams = 3-4 hrs/week | events, game_results, team_achievements, check_ins |
| 2 | VIP Family Guide (per-tournament per-family) | 30 min × 10-50 families | tournaments, tournament_rosters, guardians, player_guardians |
| 3 | Day Recap (post-game Sunday morning) | 20-30 min/game | game_results (blocked on Quick Score for in-game stats) |
| 4 | Coach Consolidated | Already shipped via All Teams view in app | — |
| 5 | Program Card (Canva) | Manual through 2026, automate 2027 | Defer |

**Templates already exist** in project knowledge: `10u_black_weekend_wrapup.html`, `11u_girls_weekend_wrapup.html`, `8u_boys_day1_recap_sunday_preview.html`, `alexander_family_metro_showdown.html`, `dodaro_family_metro_showdown.html`, `ward_family_metro_showdown.html`, `all_program_metro_showdown.html`, `10u_blue_week_ahead.html`, `9u_boys_week_ahead.html`, plus 2 others. These are the visual + voice spec.

## The voice library is locked

Captured in `LH_BRAND_CONTENT_MODEL.md` Part 10. Templates use these phrases:
- "Minutes are earned, not given."
- "5-Minute Rule. 15-Minute Rule. 24-Hour Rule."
- "We were right there."
- "That's not a season start. That's a launch sequence."
- "Okay, everyone exhale."
- "Proud of these girls. Now go enjoy your Sunday night."
- "I loved watching you play today."

## Architecture decision: Two implementations, one source of truth for tokens

Email HTML cannot share React components. Outlook compatibility requires inline-styled tables, no flexbox, no JS. Decision:

- **In-app broadcast components** live in `src/components/broadcast/*.jsx`
- **Email templates** live in `src/lib/emails/templates/*.js` as pure HTML strings with template variables
- **Both consume the same design tokens** (CSS variables baked into inline `style=""` for email)
- Same visual language, two implementations
- Single source of truth: token constants in `src/lib/design-tokens.js`

## Approval workflow (Wave 4 scope)

Auto-draft drops in `message_drafts` table Wed at 6 PM per team. Frank reviews on phone. One-tap edit. One-tap "Send to all 11U Girls families." Saved as `tournament_messages` row with `message_type='team_briefing_v1'`. Per-family delivery via `tournament_message_recipients`. Resend integration already enabled.

**Time savings target:**
- After Wave 4 ships: **4-6 hours/week back to Frank**
- After Wave 9 ships (Day Recap auto-generator + Quick Score): **6-8 hours/week back**

---

# REVISED WAVE SEQUENCING (LOCKED)

| Wave | Scope | Sessions | When |
|---|---|---|---|
| 3a | Broadcast component library — 22 components in `src/components/broadcast/*` | 1-2 | THIS WEEK |
| 3b | Records page on `/records` route | 1-2 | THIS WEEK |
| **4** | **Communications Foundation (PROMOTED from Phase 3)** | **3-4** | **WEEK 2** |
| 5 | Team detail page (per-team Records) | 1 | WEEK 2-3 |
| 6 | Schedule tab redesign per `season-calendar-v12.html` | 2-3 | WEEK 3 |
| 7 | Charlie's Season (`/players/:id`) | 1-2 | WEEK 3-4 |
| 8 | Tournaments page (`/tournaments`) | 1 | WEEK 4 |
| 9 | Quick Score + Day Recap (Type 3 briefing unlocked) | 2 | WEEK 4-5 |
| 10 | Push notifications + delight features (Car Ride Home, achievement pulses) | 1-2 | WEEK 5 |
| 11 | Phase 1 home polish (NextUpCard urgency, density wiring, login redesign) | 2 | WEEK 5-6 |
| 12 | Phase 0C Ember rebrand (find/replace, file renames, backfill 12 missing migrations) | 1-2 | WEEK 6 |
| 13+ | Phase 2 Coach 95%, Phase 3 Admin 95%, Phase 5 Capacitor + Fall 2026 launch | | WEEK 7+ |

**Original timeline:** 25-30 sessions to Fall 2026.
**Revised timeline:** 22-27 sessions. Saved 3-5 by recognizing broadcast component overlap.

---

# DECISIONS LOCKED THIS SESSION (April 29)

41. **Sequencing A confirmed.** Communications Foundation ships as Wave 4, before Team Detail / Schedule / Charlie's Season. Reasoning: every week of saved Frank-time compounds across the rest of the build.
42. **Path C confirmed.** Skip standalone Y2b code layer. `useTeamRecords` hook + `ParentHomeTeamCard` rebuild fold into Wave 3a broadcast component library.
43. **Communication is the business moat.** Player retention drives the business model. Parent happiness drives retention. Communication drives parent happiness. Communications Foundation is therefore a top-3 priority feature, not a Phase 3 admin feature.
44. **Two-implementation token model for in-app vs email rendering.** Single source of truth in `src/lib/design-tokens.js`. React broadcast components AND inline-styled HTML email templates both consume same tokens.
45. **Phase 0C scope expands** to include backfilling 12 production tables (currently outside migration files) into `supabase/migrations/`. ~1 extra session in Phase 0C. Required for St. Pat's onboarding 2027 reproducibility.
46. **Quick Score moves up.** No longer Phase 2 Coach feature only. Ships in Wave 9 to unlock Day Recap auto-generator (Type 3 briefing). 1-2 sessions earlier than planned.
47. **Push notifications elevate.** Move from Phase 5 (Capacitor) to Wave 10. Web push first using broadcast moments visual language. Native push deferred to Phase 5 Capacitor wrapper.
48. **"Car Ride Home" reminder + achievement push notifications** ship in Wave 10 as delight features. Brand-voice moments in the app. Low build cost, high emotional resonance.
49. **Retention metrics on Admin dashboard.** Year-over-year roster carryover. Cohort tracking. "11 of 11 10U Black families returned from Winter 2025-26 to Spring 2026." Phase 3 Admin scope. Verify `registrations` table supports the query.

## DECISIONS LOCKED IN APRIL 29 L99 AUDIT (56-67)

56. **Production communications infrastructure already scaffolded.** `tournament_messages`, `message_drafts`, `tournament_message_recipients`, `org_announcements`, `event_notifications`, `guardian_notification_prefs`, `team_achievements` all exist with rich schemas. Wave 4 populates, does NOT create. Verified live via Supabase MCP April 29.

57. **M2-1 spec from April 19 becomes Wave 4 starting blueprint.** Tournament Briefing Generator was specced (`src/lib/tournamentBriefing.js` + `src/components/event/TournamentBriefing.jsx`) but did NOT ship. Wave 4 picks up with updated paths under `src/lib/emails/*`.

58. **Per-team customization via 5 `custom_*` fields on `tournament_messages`.** `custom_header`, `custom_subheader`, `custom_narrative`, `custom_closing`, `custom_signoff`. Auto-gen produces defaults; Frank can override any of 5 sections before send.

59. **Approval workflow built into `message_drafts`.** Wave 4 implements UI on top: auto-draft Wed 6 PM via cron Edge Function → status='pending_review' → Frank reviews on phone → status='approved' → send Edge Function picks up → status='sent' → linked to `tournament_messages` via `sent_message_id`.

60. **`event_notifications.channels` JSONB enables multi-channel.** Wave 4 = email only via Resend. Push channel added in Wave 10. SMS deferred indefinitely (cost + opt-in complexity).

61. **`team_achievements` coach-create / admin-confirm workflow drives auto-badge content.** When tournament ends + game_results published, coach prompted to add achievements. Achievements auto-populate the gold "★ ACHIEVEMENT STRIP ★" component in tournament_messages and team identity cards.

62. **`guardian_notification_prefs` defaults to ON for all 4 toggles.** Parents opt-out, not opt-in. Reasoning: communication is the brand value. Default-off would defeat the moat. Settings page lets parents disable per type.

63. **New Edge Function `send-tournament-message` deploys in Wave 4.** Reads approved drafts, respects guardian opt-outs, renders inline-CSS HTML, sends via Resend, writes audit rows.

64. **Migration history full state corrected: 42 migrations in production through April 29.** 28 numbered (001-028) + 14 timestamped (April 25-29). Y2b confirmed shipped April 29 at 10:40 UTC.

65. **Phase 0A security lockdown date corrected.** Actually shipped April 27 (`ship_7_1_security_lockdown`), not April 22-23 as previously documented. Other Phase 0A work (gating fixes, RLS) shipped earlier.

66. **Wave 3a writes to `message_drafts`, never direct send.** Email engine in Wave 3a renders to `body_html` field. Frank reviews side-by-side against `8u_boys_weekend_wrapup.html` before any actual send infrastructure exists. Render fidelity validated without risk.

67. **Footer constants locked.** Phone: 917-991-9830. Signature: "Frank / Program Director, Legacy Hoopers". Voice library entries from Section 0C are reusable phrases.

## DECISIONS LOCKED IN WAVE 2 IA MAP v1 (April 30, 2026) (69-87)

See `WAVE_2_IA_MAP_v1.md` at repo root for full architectural context. Numbered decisions condensed below.

69. **Wave 2 entry point.** Coach starts a game-score from the event detail page via "Score game" button. Visible only to coach (assigned via `coaching_assignments`) + admin.

70. **Score granularity.** Two-mode toggle: default final-only (5-second entry), quarter-by-quarter optional. Mode locked per save.

71. **Save Draft + Publish flow combined.** Both buttons live in same form from day one. Wave 2B and 2C ship as a single commit to avoid an unusable middle state where coaches save but parents see nothing. `published_at = NULL` on draft, timestamp on publish.

72. **Player-of-the-game = optional dropdown on entry form.** Defaults to no selection. No prompt or modal — single form, single mental model.

73. **Coach highlight = 140 char short note.** Stored in `game_results.coach_highlight`.

74. **NO per-player stats for Wave 2.** Aligns with CLAUDE.md §16.12 lock. Box score is its own future wave.

75. **Score-entry permission.** Coach (via `coaching_assignments`) + admin only. Not assistant coach (admin override covers gaps).

76. **Backfill queue route = `/coach/games-to-score`.** Own route, NOT embedded in coach home. Coach home build is its own separate wave. Filter: `start_at < now AND status NOT IN ('cancelled', 'postponed') AND event_type = 'game' AND no game_results row`.

77. **Per-game rule overrides DEFERRED to Migration 015.** Wave 2 doesn't ask the coach about quarter length, FT line, etc.

78. **NO push notifications in Wave 2.** Wave 10 territory.

79. **Edit-after-publish ALLOWED + audit-logged.** Per CLAUDE.md §16.8: every override timestamped, author-tagged, surfaced. Parent-visible "Updated by Coach Kenny at 4:47 PM" inline on GameLogRow when edits exist.

80. **Audit table public-readable from day one.** RLS on `game_result_edits` allows anon SELECT, matching `game_results` (Migrations 025/028). Coach names already public via `/teams` and tournament cards. No retrofit later.

81. **Result auto-derivation from scores.** us > them = W; < = L; equal = T. Coach overrides via radio for forfeit wins / technical losses. Auto-derive is default.

82. **Multi-game tournament flow = "Score next game" sequential.** No batch-entry view in v1. Button on save success jumps to next unscored event in same tournament when `event.tournament_id IS NOT NULL`.

83. **`quarter_scores` JSONB stays NULL when final-only mode used.** Only populated in quarter mode. GameLogRow renders quarter breakdown only when column non-null.

84. **Wave 2D ships data write + display together.** Quarter mode toggle + quarter input UI + GameLogRow quarter rendering land in one commit. No half-feature where data is captured invisibly.

85. **Use existing `game_results` table.** Pre-flight verifies column inventory; any gaps surface during Wave 2A pre-flight and are added in the same migration. Migration NNN number TBD by pre-flight (real number is 040s+ per Decision 64; userMemories' "014" is stale).

86. **Migration NNN scope.** `game_result_edits` audit table + any column gaps + RLS policies (write for assigned coach + admin, public SELECT for audit table). Single migration covers Wave 2A.

87. **`EMBER_MASTER_INDEX_v3.md` tracked in git from this commit forward.** Previously untracked per build queue's recurring "stay untracked" footnote. Living untracked is technical debt for the canonical decisions doc. Wave 2 IA Map v1 landing commit is the moment it joins the repo.

## DECISIONS LOCKED IN WAVE 2 IA MAP v1.1 AMENDMENT (April 30, 2026) (88-103)

Fresh-eyes audit on the v1 IA Map surfaced 9 holes + 8 enhancements + 4 cross-cutting observations. Frank resolved all of them. v1.1 rolls them in. See `WAVE_2_IA_MAP_v1.md` (now at v1.1) for full architectural context.

88. **POG dropdown source = all team players including Futures Academy.** Filter is `team_id = event.team_id`, no `roster_type` exclusion. Academy kids playing up should be recognizable as POG; filtering them would create the worst possible edge case (the standout player isn't pickable). Resolution to audit Q1.

89. **`coach_highlight` 140-char limit enforced by DB CHECK constraint, not just UI.** Migration NNN adds `CHECK (char_length(coach_highlight) <= 140)`. UI enforcement is bypassable via direct API; DB enforcement closes the loophole at no extra cost.

90. **Audit row author identity = denormalized `editor_name TEXT NOT NULL` on `game_result_edits`.** Stores the coach/admin's name at edit time. Two reasons: (a) audit semantics specifically want historical snapshots — if Coach Kenny later changes their display name, prior edits should still read "Coach Kenny"; (b) avoids public RLS exposure of `users` / `coaching_assignments` (multi-tenant safe for Phase 7-B).

91. **Audit table read pattern = batched query, not N+1.** Either fold audit metadata into the existing `useOrgTeamRecords` query as a left-join projection, or new `useOrgGameEdits(orgId)` hook returning `{ byGameId: { [game_id]: latestEdit } }`. Decide between the two during Wave 2A migration design — choice depends on RLS shape and audit-row count per game.

92. **Live updates after edit = eventual consistency for Wave 2.** Parent's open `/records` tab shows stale "no edit" state until tab focus refetch. The fix (wire `useRefetchOnVisible(refetchRecords)` for `useOrgTeamRecords`) is post-Wave-2 cleanup, not in scope. Edits aren't invisible — just not real-time.

93. **Override-result UX = hidden by default.** Below the auto-derived result text, a small "Override" link reveals the W/L/T radio. Keeps the form lean for the 99% case (auto-derive is correct).

94. **`game_result_edits` audit table schema (proposed in IA Map; pre-flight may adjust):** `id uuid PK`, `game_result_id uuid FK ON DELETE CASCADE`, `editor_user_id uuid FK auth.users`, `editor_name text NOT NULL` (per Decision 90), `edited_at timestamptz NOT NULL DEFAULT now()`, `fields_changed jsonb NOT NULL`, `prior_values jsonb NOT NULL`. Index on `game_result_id`. RLS: anon SELECT (per master index Decision 80 from v1), insert restricted to authenticated coach + admin via `auth.uid()` policy.

95. **POG display on `/records` GameLogRow = separate muted line below score.** Format: `Player of the Game: Mia Rodriguez`. Renders only when POG is set. Variable row height across the records page is intentional — POG line is a "this game had a standout" signal. Wave 2D should NOT try to "fix" the height variation with placeholders or fixed-height shims. Resolution to audit Q3.

96. **Quarter score display on GameLogRow = inline secondary line below score.** Format: `Q1 8-7 · Q2 12-9 · Q3 6-5 · Q4 6-7` muted. Matches the two-line pattern from 3d-g.4 TeamRow. Renders only when `quarter_scores` JSONB is non-null.

97. **Score input mobile UX.** All score inputs use `<input type="number" inputMode="numeric" pattern="[0-9]*">` so iOS shows the number pad. 44px tap targets minimum on form buttons. Coach is entering scores postgame on a phone in a noisy gym — form has to land shipping-ready for that environment.

98. **Opponent name pre-fill from `event.opponent`, editable.** Score entry sheet pre-fills the opponent name field. Coach can override at game time when "TBD" resolves to a real team name.

99. **Backfill POG dropdown = current roster + footer note.** Backfill queue entry sheets show the team's *current* roster in the POG dropdown, not the historical roster as of event date. Footer note: *"Showing current roster. If a player has since left the team, note them in the highlight field."* Spring 2026 turnover is low; historical-roster temporal queries deferred to 2027-season concern. Resolution to audit Q4.

100. **Concurrent edit handling = last-write-wins.** Two admins editing the same game simultaneously: both edits log to the audit table; second edit overwrites first in `game_results`; audit history reveals the divergence. No optimistic concurrency check, no lock-out warnings — over-engineering for v1.

101. **Pre-merge gate per CLAUDE.md §16.13 verified before each Wave 2 sub-wave push.** 10-item Elite Stack checklist: optimistic UI, density-aware, kindness microcopy, accessibility, notification cadence, translation-extractable, privacy locks, audit trail, presence toast, performance budget. Required for merge.

102. **Wave 2 follows the 3d-b.1 hotfix pattern.** Sub-wave hotfixes (e.g., 2B-C.1, 2D.1) are fine when smoke testing surfaces gaps. Hotfix scope = single-line or single-component fix on the just-shipped wave; anything bigger is its own sub-wave.

103. **`.gitignore` enforces the explicit-add discipline.** `rides-audit-source.zip` and `WAVE_3A_PROMPT_v2.md` (the persistent "stay untracked" items from Wave 3d build queue notes) move into `.gitignore`. Discipline is enforced by the file, not by hand. Hard Rule #9 updated to match.

104. **`DEFERRED_AUDIT_ITEMS.md` tracks audit findings that have been logged but not yet shipped.** Replaces the build-queue-scroll pattern where items surfaced in multiple audits and never landed. Created April 30, 2026 in response to B14 (`useOrgTeamRecords` missing `useRefetchOnVisible`) surfacing in 3 separate audits with no canonical home. Tracker uses 5-column format: severity (P0/P1/P2/P3) + origin date + audit code + planned wave slot + one-line description. Initial commit captured 65 items across 4 severity tiers + a Conceded section + an Aliases dedup table. Update protocol: every audit pass appends new findings; closing items move to a Closed section at file bottom (don't delete — historical record matters). For multi-pass audits, pass-distinction is carried by ID prefix (B#, C#, B'/E', B″/E″), not audit-code suffix.

105. **Wave 5 — Tournament UI named.** Captures the four stub tabs on TournamentDetailPage (Games / Roster / Messages / Scenarios) into a deliberately-named future wave. Created May 1, 2026 in response to Tier 1 research finding (audit code TIER1, finding N2) that 4-of-5 tabs render `TabStub` placeholders referencing session names (`2B-β`, `2B-γ`, `2B-δ`, `2C`) that no longer exist on the current roadmap. Those names predated the Wave 2 v1.1 amendment, which narrowed Wave 2 to Coach Quick-Score (5 sub-waves: 2A → 2B-C → 2D → 2E → 2F → 2G; none touch tournament UI). Wave 5 gives the work a home without committing scope or schedule. Stub microcopy updated from `Ships in Session 2B-β` etc. to `Ships in Wave 5 — Tournament UI` so parents see honest "future feature" messaging instead of references to nonexistent sessions. When Wave 5 ships, the four tabs land at minimum (Games, Roster, Messages, Scenarios); detailed scope deferred to a Wave 5 IA Map at planning time. Wave 5 slots after Wave 4 (Communications) per CLAUDE.md §8 wave sequencing.

## DECISIONS LOCKED IN WAVE 2 IA MAP v1.2 AMENDMENT (May 1, 2026) (106)

Wave 2A pre-flight ran 13 read-only MCP queries against production schema. Six corrections to v1.1 surfaced; v1.2 rolls them in plus the locked Migration 032 text. Pre-flight stopped at drafted text per CLAUDE.md Rule 7 / two-gate model — separate explicit GO required before `apply_migration`.

106. **Wave 2A pre-flight findings + Migration 032 lock (six v1.1 corrections).** (a) Staff auth gate is `user_roles` (org_id + role IN admin/coach), NOT `coaching_assignments` — production policy `game_results_write_staff` already uses this shape. `coaching_assignments` is a coach-management table (display name, rates, scope, phone), not the auth source; may resurface in Wave 5 Tournament UI for coverage displays. Decisions 1, 7, 22 in IA Map amended in-place; Wave 2A and 2B-C section copy updated to match. (b) Opponent name lives on `events.opponent`, NOT on `game_results` — Migration 032 does NOT add an `opponent_name` column. Decision 20 amended. Decision 27 (opponent pre-fill flow) unchanged. (c) `game_results.result` already has CHECK constraint (`result = ANY (ARRAY['W', 'L', 'T'])`); Migration 032 does NOT add it. Decision 23 scope narrowed. (d) `events.status` only has `'scheduled'` value in production today; Decision 8's `NOT IN ('cancelled', 'postponed')` filter is forward-compatible no-op. (e) Backfill queue actual size is **5 events** (4 games + 1 tournament past `start_at` unscored), NOT v1.1's "14" estimate. (f) `team_achievements` is tournament-keyed (`tournament_id` FK), NOT event-keyed — pre-flight Item 8 inversion check reframed for Wave 4 scope. Net Migration 032 (text locked in IA Map v1.2 Decision 23 section) is narrower than v1.1 anticipated: `game_result_edits` table + 1 CHECK on `coach_highlight` + 2 RLS policies on the new audit table. **Awaits separate explicit GO before apply_migration runs.**



---

# NEXT ACTION QUEUED

**Wave 2A migration application: Migration 032.** Migration 032 text is locked in `WAVE_2_IA_MAP_v1.md` v1.2 (Decision 23 section). Pre-flight 9-item checklist (items 0-8) ran May 1, 2026; 13 read-only MCP queries against production; 6 corrections rolled into v1.2 per Decision 106 above.

**Two-gate model:** This docs commit (v1.1 → v1.2) is gate 1. Gate 2 is Frank's separate explicit GO before invoking `apply_migration`. Do NOT auto-apply on docs-commit landing.

**Apply runs:** create `game_result_edits` table + index + RLS (anon SELECT gated by `published_at IS NOT NULL`; INSERT-staff gated by `user_roles` join) + `CHECK (char_length(coach_highlight) <= 140)` on `game_results.coach_highlight`. Post-apply verification queries (3 read-only) in IA Map v1.2 Decision 23 section.

**Wave 2B-C next session:** Score entry sheet + Save Draft + Publish flow combined (per IA Map Decision 3 + cross-cutting #1).

**Prior queued (shipped):** Wave 3a (broadcast components), Wave 3b (records page), Wave 3c (RLS + tournament data), Wave 3d (parent home + records polish, 13 commits), Wave 2 IA Map v1 + v1.1 (April 30), Tier 1 research closures (May 1, SHA 86d291b) — all complete. See SKYFIRE_BUILD_QUEUE_v2.md for commit log.



---



# 0A. PRODUCTION COMMUNICATIONS INFRASTRUCTURE (verified live April 29, 2026)

**Status:** All tables exist with rich schemas. All are empty (0 rows). Wave 4 populates, does not create.

## Tables ready for Wave 4

### `tournament_messages` (24 columns)
The send target. After Frank approves a draft, Wave 4 inserts here.

Key fields beyond standard:
- `custom_header`, `custom_subheader`, `custom_narrative`, `custom_closing`, `custom_signoff` — Frank's per-team override fields. Auto-gen produces defaults, override any of 5 sections before send.
- `language_code` (NOT NULL) — multi-language ready, default 'en'
- `replaces_message_id` — supports edit/replace of sent messages
- `parent_message_id` + `message_group_id` — threading support
- `opened_count` — open tracking aggregate
- `delivery_method` — text discriminator (email, in_app, sms)

### `message_drafts` (15 columns)
The pre-send staging table. Wave 4 auto-creates rows here Wed 6 PM.

Key fields:
- `author_user_id` + `approver_user_id` + `status` — approval workflow built in
- `scheduled_send_at` — supports cron-driven auto-trigger
- `sent_message_id` — links to `tournament_messages.id` after send
- `body_html` + `body_plain` — both formats stored
- `tournament_id` + `team_id` (both nullable) — supports tournament-only or team-only drafts

### `tournament_message_recipients` (8 columns)
Per-recipient delivery + open tracking.
- `email_at_send` — captures email address at send time (audit)
- `delivery_status`, `opened_at` — per-recipient analytics

### `org_announcements` (10 columns)
For program-wide messages (not team-specific).
- `recipient_count`, `delivery_method` — broadcast tracking

### `guardian_notification_prefs` (8 columns)
Per-guardian opt-out toggles. **Defaults to ON for all 4** (parents opt-out, not opt-in):
- `receive_weekly_digest`
- `receive_tournament_briefings`
- `receive_game_recaps`
- `receive_org_announcements`

### `event_notifications` (17 columns)
The audit trail for all notification activity.
- `channels` (JSONB) — multi-channel support (email, push, SMS in same row)
- `payload` (JSONB) — flexible content
- `change_summary` (JSONB) — for "Notify families" change diff
- Lifecycle timestamps: `sent_at`, `delivered_at`, `failed_at`, `read_at`
- `triggered_by_user_id` — audit

### `team_achievements` (21 columns)
Drives auto-badge content in tournament_messages and team identity cards.
- `is_pending_confirmation` + `confirmed_at` + `confirmed_by` — coach-create / admin-confirm workflow
- `badge_emoji`, `badge_color`, `photo_url` — visual fields
- `archived_at` — soft delete

## Edge Functions deployed

1. `invite-parent` — verify_jwt=false (parents click email link, no auth needed)
2. `rapid-processor` — verify_jwt=true

**Not deployed:** `send-tournament-message`. Wave 4 adds this.

## Wave 4 wiring diagram (locked)

```
[Cron Wed 6 PM]
       ↓
[Edge Function: build-team-briefing]
   reads: events, game_results, team_achievements, tournaments
   computes: stats grid, achievements, narrative defaults
   writes: message_drafts row (status='pending_review')
       ↓
[Frank reviews on phone]
   tap edit → modifies custom_header/narrative/closing
   tap approve → status='approved'
       ↓
[Edge Function: send-tournament-message]
   reads: message_drafts (status='approved')
   filters: guardian_notification_prefs (respects opt-outs)
   renders: inline-CSS HTML using design tokens
   sends: via Resend
   writes: tournament_messages row (links to draft via sent_message_id)
   writes: tournament_message_recipients rows (one per guardian)
   writes: event_notifications row (audit trail)
```

# 0B. HTML TEMPLATE INVENTORY (Legacy Hoopers Claude project)

**Location:** Separate Claude project named "Legacy Hoopers" (or "Legacy Hoopers - LeagueApps"). NOT in this project's `/mnt/project/`.

**Status:** 11 working artifacts built across Spring 2026. Hand-built by Frank. Used as actual sent emails to parents via Gmail and LeagueApps.

## The 11 templates

| File | Type | Use case |
|---|---|---|
| `8u_boys_weekend_wrapup.html` | Type 1 | Post-tournament emotional recap |
| `10u_black_weekend_wrapup.html` | Type 1 | Post-tournament emotional recap |
| `11u_girls_weekend_wrapup.html` | Type 1 | Post-tournament emotional recap |
| `9u_boys_week_ahead.html` | Type 1.5 | Pre-week schedule preview |
| `10u_blue_week_ahead.html` | Type 1.5 | Pre-week schedule preview |
| `8u_boys_day1_recap_sunday_preview.html` | Type 4 | Mid-tournament Saturday night |
| `11u_girls_metro_showdown_card.html` | Type 6 | Pre-tournament hype card |
| `alexander_family_metro_showdown.html` | Type 2 | Per-family VIP schedule |
| `dodaro_family_metro_showdown.html` | Type 2 | Per-family VIP schedule |
| `ward_family_metro_showdown.html` | Type 2 | Per-family VIP schedule |
| `all_program_metro_showdown.html` | Type 3 | All-program tournament view |

## 6 message types covered

1. **Type 1** — Team weekend wrapup (post-tournament emotional recap)
2. **Type 1.5** — Team week-ahead preview (Sunday night for the upcoming week)
3. **Type 2** — Family VIP guide (multi-kid schedule, per-family personalized)
4. **Type 3** — All-program tournament schedule (program-wide multi-team view)
5. **Type 4** — Day 1 recap + Day 2 preview (mid-tournament Saturday night)
6. **Type 6** — Program card (pre-tournament hype, stays manual via Canva)

## Tournament card spec (from M2-1, April 19)

```
Header: dark navy #1a1a2e
  Tournament name large
  Team name in cobalt #4a8fd4
  Date range in gold #f0d050

RSVP deadline banner: dark bg, gold text
  "RSVP BY 12:00 PM FRIDAY"

Day headers: gray bg
  "SATURDAY, APRIL 18"
  Venue name + Google Maps link

Game rows: 2-col table
  Time: large bold (left)
  Opponent: uppercase bold (right)
  Venue + court (sub-line)
  Championship games: gold #f0d050 left time column

Parent Survival Guide section:
  Jersey: from event.jersey
  Arrival: from event.arrival_minutes_before
  Hydration: hardcoded reminder

Coach Kenny's Keys section:
  From event.coach_notes (or event.coach_keys)

Footer:
  "Questions? Call or text Frank at 917-991-9830"
  "Let's go Legacy Hoopers!"

Constraints:
  Max 520px width
  Arial font
  Inline styles only (no <style>, no classes)
  Table-based layout (Outlook-safe)
  No <div> in rules sections
  <span> + <br> over block elements
  Bullet entity &#8226;
```

## Established email structure (Type 1 weekly briefings)

```
1. Bold 10-second summary (single line, mobile-first)
   "⚡ 10U Black: Practice Tuesday + First Tournament This Weekend (Apr 11-12)"

2. Cobalt blockquote summary box
   border-left:4px solid #4a8fd4
   background:#f0f7ff
   padding:14px 18px
   Quick bullets: date, time, location, what to bring

3. Numbered sections with emoji prefix
   📸 1. Practice + Team Photos — Tuesday, April 7
   🏆 2. First Tournament — Chase for the Chain (Apr 11-12)
   📋 3. Tournament RSVP Cadence

4. Tournament cadence box (cobalt border)
   Wed by 9 PM — Submit RSVP via LeagueApps
   Thu by 6 PM — Final roster lock
   No RSVP = player marked unavailable
   Fri 2-4 PM — Coach Kenny contacts Academy Players if roster < 8

5. Orange game day arrival callout
   border-left:4px solid #e05c2a
   background:#1e1a18
   "Game Day Arrival: Athletes inside gym, fully dressed, shoes tied, 15 minutes before tip-off."

6. Quick Links footer
   🔗 Sync the Team Calendar
   🔗 Season Schedule & Tournament Dates
   🔗 Gym Locations & Addresses
   🔗 Academy Standards

7. Signature
   "Frank / Program Director"
```


## ⭐ GROUND TRUTH: 8u_boys_weekend_wrapup.html source code (received April 29, 21:00 EDT)

Frank pasted the actual HTML source. **This is the canonical spec for Wave 3a + Wave 4.** Earlier visual-only analysis had errors. Source overrides PDF.

### CRITICAL CORRECTIONS

1. **Font is Arial, NOT Barlow Condensed.** The condensed look comes from `letter-spacing:4px` + `font-weight:700` + `text-transform:uppercase`. Email constraint (Outlook can't load custom fonts).
2. **React screen components CAN use Barlow Condensed.** Email templates use Arial. This is the "two implementations, one source of truth for tokens" pattern, with typography token having separate `screen` and `email` values.

### Color palette (locked, 8 values)

| Var | Hex | Usage |
|---|---|---|
| `--em-cobalt` | `#4a8fd4` | Border, header bg, accent text, dividers, stat numbers, footer bg |
| `--em-gold` | `#f0d050` | Achievement strip bg, countdown tile, final divider before moment |
| `--em-navy` | `#1a1a2e` | Text on gold/light backgrounds, headline emphasis |
| `--em-bg-white` | `#ffffff` | Body bg, header/footer text |
| `--em-bg-tint` | `#f0f7fc` | Breathe section bg |
| `--em-bg-gray` | `#f5f7fa` | Practice tile bg |
| `--em-divider` | `#e8e8e8` | Cell dividers in stat grid |
| `--em-text-mute` | `#888888` | Stat labels |

Plus tonal grays `#333` `#555` `#666` for body text variants. Footer signature: `rgba(255,255,255,0.7)`.

### Typography scale (locked, exact px from source)

| Element | Size | Weight | Letter-spacing | Transform |
|---|---|---|---|---|
| Eyebrow ("8U BOYS · SEASON TO DATE") | 11px | 700 | 4px | uppercase |
| Headline ("WHAT. A. MONTH.") | 32px | 700 | — | uppercase |
| Achievement strip | 14px | 700 | 1px | uppercase |
| Stat number | 30px | 700 | — | — |
| Stat label | 9px | 700 | 1px | uppercase |
| Narrative body | 15px | 400 | — | — |
| Narrative emphasis | 18px | 700 | — | — |
| Moment line ("They're 8 years old.") | 20px | 700 | — | — |
| Section headline ("Time to Breathe.") | 24px | 700 | — | — |
| Countdown number | 42px | 700 | — | — |
| Day tile | 16px | 700 | — | uppercase |
| Footer signoff | 14px | 700 | — | — |
| Footer signature | 11px | 400 | — | — |

### Layout primitives (locked)

- Outer wrapper: `max-width:520px`, `border:2px solid #4a8fd4`, `border-radius:6px`, `font-family:Arial, Helvetica, sans-serif`
- Tables for column layouts (stat grid, countdown tile + body, day tile + body)
- Plain divs with `text-align:center` for narrative blocks
- 40px × 3px rule dividers between narrative beats (cobalt for body, gold for final divider before moment line)

### Section inventory (10 confirmed)

1. **Header** — solid cobalt bg, eyebrow + headline, padding `20px 16px`
2. **Achievement strip** — gold bg, medal emoji + label, padding `10px 16px`
3. **Stat hero** — 4-cell table, cobalt numbers + gray labels, cell border-right `1px solid #e8e8e8`, ends with `border-bottom:2px solid #4a8fd4`
4. **Narrative section** — white bg, 5 beats separated by 40px cobalt rule dividers, ending with one gold divider + moment line in cobalt 20px bold
5. **Breathe section** — `#f0f7fc` bg, top + bottom `2px solid #4a8fd4` borders, 24px bold "Time to Breathe." + body
6. **Countdown card** — 90px gold tile (left) + white body card, separated by `border-bottom:1px solid #e8e8e8`
7. **This week card** — 58px gray tile (left) + white body, same border treatment
8. **Parent shoutout** — centered prose, cobalt callout phrase, padding `14px 20px`
9. **Footer** — solid cobalt bg, white signoff + 70% white signature, padding `12px 16px`

### Wave 3a acceptance test (refined)

Render `8u_boys_weekend_wrapup.html` from this exact data fixture:
- team: 8U Boys, color amber `#f59e0b` (NOT used in template — 8U Boys template uses cobalt always; team_color is for screen, brand cobalt is for email)
- season_stats: 28 days, 8 games, 4 gyms, 2 tournaments
- achievement: "Championship Finalists — Tournament 1"
- narrative beats: array of {body_lines, emphasis_line}
- moment_line: "They're 8 years old."
- breathe_lines: ["No games next weekend.", "No 6 AM alarms.", "No \"which gym\" texts."]
- breathe_emphasis: "Coach Kenny and Coach Darien get 27 days of practice to get these boys ready for Tournament #3."
- breathe_callout: "Rumble for the Ring, here we come."
- next_tournament: { days_out: 27, name: "Rumble for the Ring", date_range: "May 16-17", location: "Fairfield, CT" }
- this_week: [{ day: "TUE", title: "Practice", time_range: "5:30 - 7:00 PM", location: "Rippowam" }]
- shoutout: "8 games. 4 gyms. 28 days." / "You drove, packed, and showed up every time." / "This program runs because you do."
- signoff: "Proud of these boys. Now go enjoy your Sunday night."
- signature: "Frank, Coach Kenny & Coach Darien"

Output HTML must byte-match the source. Diff-based comparison.

### Implication: brand cobalt is the email constant, team_color is the screen constant

For Wave 3a:
- React component `<TeamIdentityCard>` on `/records-preview` uses `team.color` from DB (8U Boys = amber)
- Email template `WeekendWrapupEmail` uses brand cobalt always
- Same data, same brand voice, different visual treatment per surface
- This deepens Decision 44: typography AND color tokens have screen vs email values

### Decision 68 (added)

**Email templates use brand cobalt always, not team_color.** Confirmed from 8u_boys_weekend_wrapup.html source: every visual treatment (border, header, divider, accent, footer) uses `#4a8fd4` even though 8U Boys team_color is amber `#f59e0b`. Reasoning: emails represent program identity (Legacy Hoopers brand). In-app components represent team identity (per-team color). Wave 3a + Wave 4 enforce this split.



# 0C. VOICE LIBRARY (consolidated from all chats + 5-team weekly emails)

## On dedication
- "Minutes are earned, not given."
- "Quality over quantity."

## On communication
- "No more Thursday night scrambles."
- "Real-time app communication."

## On expectations
- "Trust the process, the timeline, the coaching staff."
- "Hall of Fame standards."

## On the 24-hour rule
- "Coaches don't review playing time on game day. Send your message tomorrow."

## On game day
- "15 minutes before tip-off. Fully dressed. Shoes tied."

## On practice
- "5-Minute Rule: wait in your car."

## On failure / comeback
- "We were right there." (Winter Playoff near-miss)
- "They're 8 years old."

## On celebration
- "WHAT. A. MONTH."
- "Now We Breathe."
- "Time to Breathe."
- "That's not a season start. That's a launch sequence."
- "Okay, everyone exhale."
- "Proud of these girls. Now go enjoy your Sunday night."
- "I loved watching you play today."

## Section headers (always cobalt rule + ALL CAPS centered)
- "TOURNAMENT SNAPSHOT"
- "PARENT SURVIVAL GUIDE"
- "COACH KENNY'S KEYS"
- "WHAT'S NEXT"
- "SEASON TO DATE"

# 0D. MIGRATION HISTORY — CORRECTED (verified April 29, 2026)

**Total in production: 42 migrations.**

## Numbered migrations (001-028) — all shipped

001 user_roles | 002 skyfire_foundation | 003 core_data_model | 004 schedule_extensions | 005 interactive_features | 006 locations_opponents | 007 parent_ux_features | 008 team_extensions | 009 fix_public_read_rls | 010 user_roles_org_id | 011 tournaments | 012 tournament_audit_gaps | 013 coaching_assignments_rates | 014 game_results_publishing_workflow | 015 tournaments_rules_extension | 016 user_preferences | 017 organization_settings_admin_configurable | 018 team_achievements | 019 event_notifications_audit_trail | 020 event_notifications_enum_reconciliation | 021 team_players_date_windows | 022 rls_privacy_lockdown_plus_roster_left_at | 023 attendance_trending_views | 024 schedule_rebuild | 025 rides_redesign | 026 rls_granular | 027 event_notification_triggers | 028 parent_roster_visibility

## Timestamped migrations (April 25-29) — all shipped

- 20260425123711 organizations_branding
- 20260426021246 security_cleanup
- 20260426111421 tournament_times_correction
- 20260426160517 rides_lifecycle_and_realtime
- 20260426160845 tournament_orphan_repair
- 20260426200358 data_integrity_fix
- 20260426203347 data_corrections_resurrection_jersey
- 20260426203943 resurrection_address_correction
- 20260426205441 venue_address_corrections_and_canonical_urls
- 20260426215822 rename_cardinal_spellman_to_cyo_spellman
- 20260427131334 rides_offer_cancel_cascade
- **20260427185842 ship_7_1_security_lockdown** (Phase 0A — corrected date is April 27, NOT April 22-23)
- 20260427185927 ship_7_1_security_lockdown_public_revoke_fix
- 20260427190412 ship_7_2_schema_drift_fix
- 20260427213932 ship_7_7_rls_perf_select_wrap
- 20260427233817 ship_7_12_drop_duplicate_indexes_tmr
- 20260429020355 ship_x_backfill_author_names_from_guardians
- **20260429104058 y2b_backfill_spring_2026_game_results** (Y2b confirmed shipped today April 29 at 10:40 UTC)

## Edge Functions deployed

| Function | verify_jwt | Status |
|---|---|---|
| invite-parent | false | ACTIVE |
| rapid-processor | true | ACTIVE |
| send-tournament-message | n/a | NOT DEPLOYED — Wave 4 adds |

# 0E. M2-1 HISTORY (specced April 19, did NOT ship)

**April 19 spec:** Tournament Briefing Generator. Two files:
- `src/lib/tournamentBriefing.js` — exports `generateBriefingHtml(events, team, tournamentName)` (under 120 lines)
- `src/components/event/TournamentBriefing.jsx` — UI component (under 100 lines)

**April 20 verification:** Both files confirmed missing from repo. Work was queued, then deferred.

**Resurrection plan:** Wave 4 picks up M2-1 spec. Files become:
- `src/lib/emails/tournamentBriefing.js` (new path under emails directory)
- `src/components/admin/TournamentBriefingApprovalModal.jsx` (new component for review/approve UI)
- New Edge Function: `send-tournament-message`

# 0F. THREE PARALLEL COLOR SYSTEMS (must reconcile in Wave 4)

| Team | Website v14 (canonical) | Old message templates (obsolete) | Skyfire DB (current) |
|---|---|---|---|
| 11U Girls | violet `#a78bfa` | gold `#f0d050` | violet ✓ |
| 10U Black | cobalt `#4a8fd4` | cobalt | cobalt ✓ |
| 10U Blue | slate `#94a3b8` | cobalt | slate ✓ |
| 9U Boys | cyan `#06b6d4` | (none) | cyan ✓ |
| 8U Boys | amber `#f59e0b` | green `#2e7d52` | amber ✓ |

**Decision:** Website v14 palette is canonical. Skyfire DB matches. Wave 4 templates auto-inherit website v14 via team_color from DB. Old hand-built templates with green/gold remain in Legacy Hoopers project as historical artifacts but are obsolete from Wave 4 ship.

---


# TABLE OF CONTENTS

1. **30-second orient** — what Ember is, where it is, what's next
2. **Identity layer** — users, IDs, infrastructure
3. **Business model** — pricing, orgs, roles, expansion plan
4. **30+ locked decisions** — do not re-ask
5. **Database state** — 36 tables, schema reality vs migrations
6. **Migration history** — 001-022 + Y2b shipped, what's queued
7. **Shipped features inventory** — what's live, evidence-cited
8. **Commit log** — 14+ commits this build cycle
9. **Design system — Cockpit mode** — current React app tokens
10. **Design system — Broadcast mode** — the 22-component Squarespace library
11. **Competitive analysis — LeagueApps** — 81 screenshots cataloged
12. **Competitive analysis — PlayMetrics** — 18 screenshots cataloged
13. **Competitive analysis — GameChanger** — 18 screenshots cataloged
14. **Competitive analysis — SportsEngine + TeamSnap + Stack Sports**
15. **Brand voice + content rules** — Legacy Hoopers tone
16. **Operational rules** — RSVP deadlines, blackouts, the 24-Hour Rule
17. **Bug catalog (22 bugs)** — by severity, status
18. **Phase plan** — 0A through 7
19. **Workflow rules** — the four-tool workflow, deploy chain
20. **Anti-patterns** — 19 things never to do
21. **File inventory** — what's in /mnt/project/
22. **Open decisions** — what Frank still needs to answer
23. **Conversation history index** — which chat covered what
24. **Glossary** — acronyms, jargon, naming rules

---

# 1. 30-SECOND ORIENT

**Product:** Ember — multi-tenant SaaS platform for youth sports operations. First org: Legacy Hoopers (Westchester NY youth basketball, grades 2-5). Replaces LeagueApps + Google Calendar + group text + spreadsheets in one mobile-first app.

**Codebase name:** Still "Skyfire" / `--sf-*` CSS namespace. Rebrand to Ember scheduled for Phase 0C.

**Brand:** Phoenix logo = Ember (platform). Knight logo = Legacy Hoopers (org). Cobalt `#4a8fd4` is LH brand color.

**Stack:** React 18 + Vite + Tailwind 4. Supabase (project `vrwwpsbfbnveawqwbdmj`). Vercel auto-deploy from `main`. GitHub `LegacyHoopers/skyfire-app`. Production: `app.legacyhoopers.org` + `skyfire-app.vercel.app`.

**Co-founders:** Frank Samaritano (Program Director), Kenny Lane (Coaching Director). Assistant coach Darien Gonzalez (paid per session).

**5 teams Spring 2026 (oldest to youngest):** 11U Girls, 10U Black, 10U Blue, 9U Boys, 8U Boys.

**Where the build is (April 29, 2026):**
- Phase 0A security lockdown ✅ COMPLETE (4 fixes shipped April 22-23)
- Phase 0B data stability ✅ COMPLETE (Migrations 013-022 + Y2b backfill all shipped)
- 14+ feature commits shipped this cycle (Y0 uuid race fix, Y1 THIS WEEK redesign, Y2b game_results backfill, Ship X comment author fix, Ship A MED+MAX redesign, others)
- 26 game_results rows backfilled, 100% match against records-v14_2.html
- Phase 0C Ember rebrand 📋 designed, blocked on completion of broadcast mode work

**Active wave:** Wave 3 — Records page + broadcast component library. Build the 22-component design system mirroring `records-v14_2.html` and `season-calendar-v12.html`. Apply to Records page, Team detail, Charlie's Season, Tournaments page.

**Pending decision:** Path A/B/C for Y2b code layer (lights up MY TEAMS strip with real W-L records).

**Top blocker:** None. Stack is unblocked. Frank is ready to ship.

---

# 2. IDENTITY LAYER

## Users (production Supabase, all real)

| Person | Email | Role | user_id | Notes |
|---|---|---|---|---|
| Frank Samaritano (admin) | admin@legacyhoopers.org | admin | `1e06a3d4-769b-42c0-b90b-92787410ee5a` | NO children linked. Used for admin testing. Phantom user for parent flows. |
| Frank Samaritano (parent) | fsamaritano@gmail.com | parent | `0b81b465-225e-4ede-b752-ed9a2dde1f7c` | Real parent. Guardian `9659f2bb-2a53-4e37-ba5b-29e5b6bd1c96`. Children: Milo (8U), Charlie (11U). |
| Stephanie Samaritano | cocosamaritano@gmail.com | parent | (not captured) | Real parent of same children. Additional test fixture. |
| Kenny Lane | coachkenny@legacyhoopers.org | admin/coach | `9ac6a671-8869-40c9-96de-f1628d0c12db` | Co-founder Coaching Director. Head coach × 4 teams. |
| Darien Gonzalez | coachdarien@legacyhoopers.org | coach | (not captured) | Assistant coach × 2 teams. Paid per session. |

**Critical learning:** All "admin viewing as parent" testing tested phantom user state (admin has 0 children). Real parent testing must use `fsamaritano@gmail.com` directly.

## Org

- **Legacy Hoopers LLC**
- Org ID: `e3e95e21-3571-4e9a-985a-d5d01480d4a6`
- Slug: `legacy-hoopers`
- Sport: `basketball`
- Knight logo `/Knight_logo.webp`
- `brand_colors`: `{"accent":"#4a8fd4","header":"#4a8fd4","accent_hover":"#5BA0E0","text_on_dark":"#FFFFFF"}`
- `subscription_plan`: 'starter' (will become 'pro_pilot' in Phase 6)
- Free pilot through Fall 2027

## Infrastructure

- **Supabase project:** `vrwwpsbfbnveawqwbdmj`
- **Supabase CLI:** authenticated, token in `~/.config/supabase/access-token`
- **DB password:** Frank has it saved
- **GitHub repo:** `github.com/LegacyHoopers/skyfire-app` (rename to `ember-app` in Phase 0C)
- **Branches:** `v2` (dev) → `main` (Vercel auto-deploys)
- **Production URLs:** `app.legacyhoopers.org` and `skyfire-app.vercel.app`
- **Edge Function:** `invite-parent` deployed (JWT verification OFF per memory)
- **Vercel project ID:** `prj_peID30eF61qubU90e1TVvM1kikuP`
- **Vercel team:** `team_95cqArODGT4Ub8nQ5lKWqGY4`

## Frank's dev environment

- **Machine:** HP Chromebook, AMD Ryzen 3 3250C, 4GB total RAM, 15W CPU
- **OS:** ChromeOS with Crostini Linux (Debian 12 bookworm)
- **Crostini RAM:** 2.83 GB allocated. Docker NOT viable.
- **Working directory:** `/home/admin/legacy-hoopers-app` (rename `ember-app` in Phase 0C)
- **Dev server:** `http://100.115.92.199:5173/` (Crostini IP, Chromebook browser only, NOT phone)
- **Phone testing:** Deferred. Test via production deploy.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS 4 |
| Auth + DB | Supabase (PostgreSQL + Auth + Realtime + RLS + Storage) |
| Hosting | Vercel (auto-deploy from main) |
| Geocoding | Nominatim |
| Email | Resend |
| Push | Web Push API (web), APNs/FCM (Phase 5 native) |
| Future | Stripe subscription (Phase 6), Stripe Connect (Phase 7), Capacitor + App Store (Phase 5) |

---

# 3. BUSINESS MODEL

## Product positioning

**The problem:** Youth sports program directors run 5-team operations across 6 separate tools — LeagueApps (registration + billing), Google Calendar (scheduling), group text (parent comms), Google Sheets (financials), spreadsheets (records), manual email. Every tool talks to none of the others. Mobile is afterthought.

**The promise:** One platform. Mobile-first. Built for the director who is also the coach, the treasurer, the communications director, and the IT department. Premium feel — not a sports app that looks like a sports app.

**Benchmark:** Linear (info density), Apple Calendar (schedule), Nike Run Club (engagement), iMessage (messaging), Stripe Dashboard (financial clarity). NOT TeamSnap. NOT a desktop dashboard shrunk to fit a phone.

**The North Star sentence:** "LeagueApps is a compliance and payments database built for the league director's desktop. Ember is a tactical command center built for the parent's driver's seat."

## Three Wow Moments (P0)

1. **Precision Nav Drop** — tap location → native Maps with haptic feedback
2. **Status Antidote** — pulsing confirmation when RSVP/duty/ride is locked in
3. **Frictionless Carpool Claim** — one-tap inline ride claim, no nav away

**Wow #4 (P1):** Two-kid parent conflict surfacing — auto-detect when Charlie's tournament conflicts with Milo's practice and prompt resolution.

## Org architecture

**Org #1 (pilot):** Legacy Hoopers LLC
- Westchester NY, AAU youth basketball, grades 2-5
- 5 teams, 63 players, 121 guardians
- Spring 2026 season: March 23 — June 14 (122 events)
- Permanent tier: Pro (free through Fall 2027)
- Knight logo, cobalt `#4a8fd4` brand

**Org #2 (target Fall 2027 / Spring 2028):** St. Patrick's CYO Armonk
- 20-25 teams (Winter), 10 teams (Spring)
- CYO program, different ops needs than LH's AAU focus
- **Confirmed April 23, 2026:** target is 2027-28, NOT Winter 2026-27. LH stays proprietary through 2027.

**Future:** 5-10 additional basketball programs, then multi-sport expansion (baseball, volleyball, soccer).

## Pricing — hybrid model (phased rollout)

| Tier | Monthly | Reg % | Target |
|---|---|---|---|
| Starter | $39/mo | 2.5% | Small rec/CYO, 3-8 teams |
| Growth | $99/mo | 2.0% | Competitive programs, 8-15 teams |
| Pro | $249/mo | 1.5% | Elite programs, 15+ teams, multi-sport |

**Phased billing:**
- Phase 1 (Fall 2026, LH only): No billing surface, pilot is free
- Phase 6 (Spring 2027, pre-St. Pat's): Monthly subscription only (Stripe)
- Phase 7 (Fall 2027+): Full hybrid (base + % registration) via Stripe Connect

## Role architecture (3 + 1)

**Super Admin (Ember-level)** — Frank, future Phase 6+. Schema-ready (check constraint supports `'super_admin'`), NOT actively used. Separate email when activated (e.g., `frank@ember.app`).

**Admin (Org-level)** — Currently Frank running LH. Day-to-day operator. Cannot change feature entitlements (Super Admin controls that). The role being built in Phases 0-5.

**Coach (User-level)** — Kenny (head × 4 teams), Darien (assistant × 2 teams).

**Parent (User-level)** — Linked to guardians, scoped to their children.

## Replacement target

**Killing:** LeagueApps ($200+/mo, desktop-first, mobile is afterthought)

**Not killing yet:** TourneyMachine (no API, structured paste import — Option C)

**Adopting patterns from:** GameChanger (live scoring), PlayMetrics (per-player attendance), SportsEngine (week strip, RSVP), TeamSnap (chat, availability grid)


---

# 4. THE 30+ LOCKED DECISIONS (DO NOT RE-ASK)

Every decision below was confirmed by Frank during prior sessions. Treat as final.

## Product strategy

1. **Platform name:** Ember (NOT Skyfire). Rebrand internally in Phase 0C.
2. **Logo:** Phoenix (Ember). Knight (Legacy Hoopers).
3. **Skyfire phoenix asset (`skyfire_phoenix.webp`):** Retire in Phase 0C.
4. **Corporation:** Ember will have its own corporation. Frank forms when ready.
5. **Domain:** Decide between `ember.app` / `emberhq.com` / `getember.co` in Phase 0C. `legacyhoopers.org` stays for the pilot program.
6. **Both URLs serve same Ember login:** `app.legacyhoopers.org` AND `app.skyfire-app.vercel.app` show Ember (Phoenix + gold) pre-auth, flip to LH (Knight + cobalt) post-auth.

## Role model

7. **3 roles in production:** admin, coach, parent.
8. **Super Admin:** Schema-ready, NOT built in UI until Phase 6+.
9. **Multi-org switcher:** Deferred to Phase 6+ (no current user has multiple orgs).

## Pricing

10. **Hybrid model:** Monthly base + registration percentage.
11. **3 tiers:** Starter $39 / Growth $99 / Pro $249 per month.
12. **Registration %:** 2.5% / 2.0% / 1.5% per tier.
13. **LH tier:** Pro, pilot status, free through Fall 2027.
14. **Phased billing rollout:** Monthly first (Phase 6), % layer added Phase 7.

## Feature architecture

15. **Density toggle:** 3 levels (Minimal / Medium / Maximum). Default Medium for all users. Saved per-card in `user_preferences.card_density` JSONB.
16. **RSVP display:** Counts on card (12 Going, 1 Maybe, 2 Not, 8 No Response). Drill-down on detail page with Mark-as buttons.
17. **Attendance trending:** Current rate vs 4 weeks prior. ↑ green up / ↓ red down arrow. Parent sees own child only. Coach sees their teams. Admin sees all.
18. **Rotation Planner:** Coach + admin only. Parents NEVER see pre-game. Post-game parent sees only own child's minutes + period starts.
19. **Call-up flow:** No algorithmic ranking. Coach manually invites Academy players from list when Active Roster drops below threshold.
20. **Call-up response window:** 2-hour default (admin configurable).
21. **Reminder cadence:** 3-day, 2-day, 1-day, 4-hour before events. All admin-configurable.
22. **Note edit cooldown:** 4 hours between edits (admin configurable, per-parent override available for emergencies).
23. **Tournament rules:** Per-tournament JSONB `rules` column on tournaments table (NOT org-level circuit_rules). Rules form fields: game_format, fouls, free_throws, jump_ball, press, overtime, misc_notes.
24. **Edit event → notify families prompt:** Every event edit triggers "Notify families?" modal with auto-generated change summary. Admin can override copy or skip.
25. **Hotel code distribution:** Manual distribute trigger. Admin uploads code, reviews, then clicks "Distribute to Active Roster" → push + email fires to guardians of Active Roster players on participating teams.
26. **Admin-configurable settings:** All the above rules live in `org_settings` JSONB (reminder_cadence, rsvp_deadlines, note_rules, nudge_rules, roster_rules, notification_channels).

## Coach compensation

27. **Dual-entry attendance:** Coach self-reports sessions attended. Admin verifies/overrides. Audit trail. Admin-final-say.
28. **Rate cards:** Per coach × per team × per event_type stored as JSONB on `coaching_assignments.rates`. Existing `pay_per_session_cents` stays as fallback default. Example: `{"practice": 3000, "game": 5000, "tournament_day": 10000, "skills_lab": 2500}` (cents).
29. **Monthly invoice:** Auto-generated from approved attendance × rate. Admin reviews, marks paid via Zelle/Venmo, logs payment method + reference.
30. **Payment processing:** Manual tracking through Fall 2026. Stripe Connect deferred to Phase 7+.

## Bug-level decisions

31. **Tournament times:** Production has 00:00-23:59. Must revert to 08:00-20:00 Eastern. Migration 021 handles.
32. **8U Boys Nationals:** NOT going. Confirmed via CSV: 8U goes to Bergen County NJ (Summer Hoops Jam Classic 1 & 2, June 6-7). 11U Girls and 10U Black are the Nationals teams.
33. **Team color palette:** Production has v14 palette (authoritative): 11U Girls `#a78bfa` violet, 10U Black `#4a8fd4` cobalt, 10U Blue `#94a3b8` slate, 9U Boys `#06b6d4` cyan, 8U Boys `#f59e0b` amber. Migration 004 has old palette `#7C3AED / #18181B / #2563EB / #DC2626 / #EA580C` — old, do not use.
34. **Apr 23 duplicate 11U Girls practice:** TO BE RESOLVED before Migration 021. Frank to confirm WCC vs Westchester County Center.

## Architecture

35. **Three-mode design architecture:** Cockpit mode (existing Inter-based React app for daily operations) + Broadcast mode (Barlow Condensed-based broadcast quality for Records, Team detail, Charlie's Season, Tournaments). Same data, same components, different visual mode.
36. **Cockpit/Broadcast switch logic:** Mode shifts based on context, not user toggle. Records page IS broadcast. NEXT UP card IS cockpit.
37. **Tournament import:** Option C (Structured Paste) chosen. TourneyMachine has no API. Admin pastes schedule as structured text, parses to events.

## Admin/Phase 0C decisions (April 25-26)

38. **D1: Internal rebrand + org-aware header.** Logo reads from `org.logo_url`. Parents still see Knight, Phoenix doesn't appear in parent app yet.
39. **D2: Internal Skyfire → Ember scope = everything.** CSS vars + file names + doc names + comments.
40. **D3: Repo name.** Leave `skyfire-app` until 2027.

---

# 5. DATABASE STATE (VERIFIED PRODUCTION APRIL 2026)

## Source of truth

SQL queries run against Supabase project `vrwwpsbfbnveawqwbdmj` show **36 tables in production**.

## Tables in migrations 001-022

| Table | Migration | Purpose |
|---|---|---|
| `organizations` | 002 | Multi-tenant root. Has `logo_url`, `brand_colors` jsonb, `slug`, `sport`, `subscription_plan`, `subscription_status`, `stripe_account_id`. |
| `organization_settings` | 002 | Per-org config |
| `user_roles` | 001+010 | Auth + org scoping |
| `seasons` | 003 | Season containers |
| `teams` | 003+008 | Team records with circuit, gender, practice schedule |
| `players` | 003 | Org-scoped, persist across seasons |
| `team_players` | 003 | Roster assignments (rostered vs futures) |
| `guardians` | 003 | Parent/guardian contacts |
| `player_guardians` | 003 | Links players to guardians |
| `team_staff` | 003 | Coach-to-team assignments |
| `events` | 003+004+005+007 | Core + 30+ columns across extensions |
| `event_changes` | 004 | Audit log for event edits |
| `event_duties` | 004 | Volunteer sign-up slots (per-slot rows) |
| `event_rsvps` | 004 | Going/Not Going/Maybe responses |
| `event_rides` | 004 | Carpool offers + requests |
| `event_comments` | 004 | Per-event discussion |
| `notifications_queue` | 005 | Pending notifications |
| `locations` | 006+007+012 | Venues with sub_locations, parking, archived_at |
| `opponents` | 006+011 | With scouting + head-to-head |
| `tournaments` | 011 | Full tournament schema (schedule_status, hotel_url, game_day_guide JSONB) |
| `tournament_teams` | 011 | Per-team records per tournament |
| `tournament_rosters` | 011 | Per-tournament roster with futures_callup status |
| `tournament_messages` | 011 | Briefing storage (9 message types) |
| `tournament_message_recipients` | 011 | Per-guardian delivery tracking |
| `championship_scenarios` | 011 | If-then outcome predictions |
| `circuit_rules` | 011 | AAU vs League Play rules at org level |
| `coaching_assignments.rates` | 013 | JSONB per-event-type pay rates ✅ shipped |
| `game_results.published_*` | 014 | Publishing workflow ✅ shipped |
| `tournaments.rules` | 015 | Per-tournament rules JSONB ✅ shipped |
| `user_preferences` | 016 | Density toggle + theme prefs ✅ shipped |
| `organization_settings` extensions | 017 | Admin-configurable rules ✅ shipped |
| `team_achievements` | 018 | Champions/Finalists/Nationals badges ✅ shipped |
| `event_notifications` + enum | 019+020 | Notify families audit trail ✅ shipped |
| Attendance views + RLS hardening | 021+022 | ✅ shipped |
| `roster_members.left_at` | 022 | ✅ shipped |
| Parent player visibility policies | 028 | ✅ shipped |

## Tables that exist in production but NOT in migration files

These were created via direct SQL Editor pastes and never backfilled into migration files. Real and queryable, but not reproducible from `supabase/migrations/`.

| Table | Purpose (inferred) |
|---|---|
| `check_ins` | Player attendance per event (`event_id`, `player_id`, `checked_in`, `checked_in_at`, `checked_in_by`) |
| `coaching_assignments` | Coach-to-team mapping with `pay_per_session_cents`, scope, org_title, effective dates |
| `game_results` | Scoring (`our_score`, `opponent_score`, `quarter_scores` JSONB, `player_of_game_id`, `coach_highlight`) |
| `guardian_notification_prefs` | Per-guardian notification settings |
| `message_drafts` | Tournament briefing drafts |
| `org_announcements` | Org-level broadcasts |
| `player_activations` | Call-up tracking |
| `player_tags` | Player categorization |
| `roster_members` | Modern replacement for `team_players` |
| `tournament_pool_teams` | Pool play structure |
| Others (12 total outside migrations) | TBD documentation |

**Decision (April 23):** Production stays canonical until we sync. All future schema changes go through `supabase/migrations/` files — never one-off SQL Editor pastes. Documented in CLAUDE.md addendum.

## Events table — 39 columns total

**Standard from migrations (23):** `id`, `team_id`, `event_type`, `title`, `start_at`, `end_at`, `location`, `location_address`, `opponent`, `notes`, `created_at`, `updated_at`, `status`, `arrival_minutes_before`, `jersey`, `coach_notes`, `enable_rides`, `is_multi_day`, `end_date`, `parent_event_id`, `attachments`, `indoor`, `rsvp_deadline`, `pregame_notes`.

**Added outside migrations (16+):** `is_scrimmage`, `home_away`, `sub_location`, `tournament_name`, `tournament_id`, `is_bracket_placeholder`, `bracket_placeholder_label`, `game_sequence`, `is_bracket_game`, `bracket_label`, `bracket_placeholder`, `opponent_pool`, `coach_keys`, `cancellation_reason`, `cancelled_at`, `is_bonus_game`, `opponent_id`.

**Critical:** Column names are `is_bracket_placeholder` and `is_bracket_game` (NOT `is_bracket`). If Tournament Briefing crashes, it's querying `is_bracket` which doesn't exist.

## Key field decisions

- `is_scrimmage` boolean on events — NOT a separate event_type
- `roster_type` on roster_members — NOT a separate role
- `member_type` on players: `'roster' | 'futures_academy'`
- `channel` on messages: `'announcement' | 'chat' | 'dm'`
- `home_away` on events: `'home' | 'away' | 'neutral' | 'tbd'`
- `event_duties` = per-slot rows (3 slots = 3 DB rows)
- `game_results` separate table from events
- `competition_type` stores internal value — public display maps `league_play` to "League Play", never "CYO"

## RLS pattern

```sql
CREATE OR REPLACE FUNCTION current_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM org_members
  WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

**NEVER** call this on `org_members` policy itself — infinite recursion.

## RLS helper functions added in migrations 022/028

- `current_user_child_team_ids()` — teams where user has rostered child
- `current_user_player_ids()` — player IDs of user's children
- `current_user_teammate_player_ids()` — player IDs on user's children's teams (privacy-aware)
- `event_org_matches(event_id)` — RLS helper for event-scoped tables

## Privacy line (preserved through Migration 028)

Parent sees teammate **player names** (Lily Alexander on 11U Girls roster) but NOT contact info for other families (no Lily's parent's email/phone). Achieved via:
- `players` policy: parent sees players on own teams (Migration 028)
- `player_guardians` policy: NOT extended — parent only sees own guardian rows
- `guardians` policy: only `user_id = auth.uid()` (own row)

When Postgrest joins fail at the guardians layer, the array collapses to empty → component shows "No guardians linked" for other families. Privacy intact.

## PostgreSQL functions

- `public.current_user_org_id()` — current user's org_id
- `public.event_org_matches(event_id)` — RLS helper
- `public.set_default_hotel_deadline()` — auto-sets `hotel_deadline_at` to `start_date - 30 days`
- `public.prevent_message_body_edit()` — blocks edits to sent tournament_messages
- `public.get_tournament_recipients(tournament_id, team_id)` — fetches guardian list for briefings
- `public.get_tournament_rsvp_summary(tournament_id, team_id)` — aggregates RSVP status per player
- `public.set_updated_at()` — generic timestamp trigger
- `public.get_coach_rate_cents(assignment_id, event_type)` — Migration 013 helper


---

# 6. MIGRATION HISTORY

## Synced state (April 26, 2026)

All migrations 001-022 are Local ✓ Remote ✓. Confirmed via `supabase migration list`.

```
Local | Remote | Title
------|--------|------
001   | 001    | foundation (organizations, org_members, seasons, LH seed)
002   | 002    | programs_teams (programs, team_staff, LH 5 teams seed)
003   | 003    | players_guardians (players, guardians, player_guardians, roster_members, registrations)
004   | 004    | activities/events (events, event_changes)
005   | 005    | rsvp_checkin_interactions (rsvps, check_ins, duties, rides, comments, views)
006   | 006    | messaging (messages, reactions, reads)
007   | 007    | notifications
008   | 008    | locations_opponents (locations, opponents, FK additions, LH venue seeds)
009   | 009    | invites (team_invites)
010   | 010    | scoring (game_results, game_plays)
011   | 011    | financials (Phase 7 — partial)
012   | 012    | indexes_views (performance indexes)
013   | 013    | coaching_assignments.rates JSONB ✅
014   | 014    | game_results publishing workflow ✅
015   | 015    | tournaments.rules JSONB ✅
016   | 016    | user_preferences NEW TABLE ✅
017   | 017    | organization_settings extensions ✅
018   | 018    | team_achievements NEW TABLE ✅
019   | 019    | event_notifications audit trail ✅
020   | 020    | event_notifications enum reconciliation ✅
021   | 021    | data corrections (destructive) ✅
022   | 022    | RLS hardening + roster_members.left_at ✅
```

Plus Migration 028 (parent roster + player visibility) ✅ and Y2b game_results backfill (26 rows) ✅.

## Phase 0B: COMPLETE

All 8 designed additive migrations + 1 destructive migration shipped April 24-26.

## Migration repair workflow

Docker-based `db push` / `db pull` not viable on 4GB Chromebook. Workflow:

1. SQL authored in chat, saved to `supabase/migrations/NNN_title.sql` locally
2. `git add supabase/migrations/NNN_*.sql && git commit && git push origin v2`
3. Paste SQL into Supabase SQL Editor
4. Run migration, verify no errors
5. `npx supabase migration repair --status applied NNN`
6. `git checkout main && git merge v2 && git push origin main && git checkout v2`

**009_revert.sql** moved to `supabase/rollbacks/009_fix_public_read_rls_REVERT.sql` (not in migrations chain).

---

# 7. SHIPPED FEATURES INVENTORY

## Phase 0A: SECURITY LOCKDOWN ✅ COMPLETE (April 22-23)

| # | Fix | File | Evidence |
|---|---|---|---|
| 0A-1 | EventDetailHeader Edit/Delete buttons gated `{isStaff && ...}` | `EventDetailHeader.jsx` lines 25-34 | git "Phase 0A-1: gate Edit/Delete buttons behind isStaff (P0 security fix)" |
| 0A-2 | SchedulePage FAB (+) gated `{isStaff(role) && ...}` | `SchedulePage.jsx` | Imports `isStaff` from `lib/permissions`, role destructured from useAuth |
| 0A-3 | RosterSection Copy Roster gated `{isStaff(role) && ...}` | `RosterSection.jsx` line 27 | Imports added, role destructured, button wrapped |
| 0A-4 | RsvpPlayerRow guard verified working | `RsvpPlayerRow.jsx` lines 17-22 | `readOnly = role === 'parent' && !isMyChild`. Status text on lines 55-58, RSVP buttons 59-83. Add Note gated line 86. |

## Security posture transition

| Action | Before 0A | After 0A |
|---|---|---|
| Edit any event | ❌ Parent could (P0 hole) | ✅ Admin/coach only |
| Delete any event | ❌ Parent could (P0 hole) | ✅ Admin/coach only |
| Create new events | ❌ Parent could (P0 hole) | ✅ Admin/coach only |
| Bulk-export guardian contacts | ❌ Parent could (P0 privacy hole) | ✅ Admin/coach only |
| RSVP other families' kids | ✅ Already blocked | ✅ Confirmed blocked |

## Application — 110 React components

**Pages:** AccountPage, AdminHomePage, AdminSeasonsPage, AdminTeamsPage, EventDetailPage, ForgotPasswordPage, HomePage, LocationsPage, LoginPage, MessagesPage, ParentHomePage, PlaceholderPage, SchedulePage, TeamDetailPage, TeamsPage, TournamentDetailPage, TournamentsPage, UnauthorizedPage.

**29 hooks:** useActiveSeasonEnd, useActivities, useAdminStats, useCheckIns, useComments, useConflictCheck, useCreateActivity, useDuties, useEventDetail, useEventDutyCounts, useEventRideCounts, useEventRsvpCounts, useEventRsvpNotes, useFilteredRoster, useLocations, useMapsUrl, useNow, useOnlineStatus, usePrograms, usePullToRefresh, useRefetchOnVisible, useRides, useRoster, useRsvps, useSeasons, useTournament, useTournamentBriefing, useTournaments, useUpdateActivity.

## Features documented as shipped

**Auth & Multi-Tenant:**
- Email/password login with forgot password
- Role-based guards (admin/coach/parent)
- Multi-tenant `org_members` with `brand_colors` JSONB
- CSS custom properties loaded on auth
- Auto-link guardians on first login (email match)

**Parent Experience:**
- ParentHomePage: greeting, NextUpCard per child's team, MY TEAMS strip, THIS WEEK compact list
- Inline RSVP on NextUpCard per child (ChildRsvp component)
- Schedule filtered to parent's children's teams
- Teams page filtered for parent
- Team detail switcher filtered for parent
- Kid filter chips (ChildFilterChips)
- PWA install prompt with localStorage dismissal

**Schedule:**
- NextUpCard with countdown, pulsing dot <2hr, team color stripe, RSVP/ride/volunteer counts
- EventCards with team color border, type badge, RSVP counts
- CompactCard component (46 lines, not yet wired to density toggle)
- FilterBar with team pills, type chips, Show Cancelled toggle
- Date-grouped list with headers
- Schedule FAB (gated to staff per Phase 0A-2)
- Tappable location with Google Maps link

**Activity Wizard:**
- 6 event types: game, practice, tournament, skills_lab, tryout, other
- Team selection, date/time picker, duration presets
- Location picker with sub-locations
- Recurring events (weekly, biweekly, season-end default)
- Conflict detection (same-team overlap)
- Arrival time presets (0-60 min)
- Home/Away/Neutral/TBD
- Jersey auto-fill
- Scrimmage toggle, Indoor toggle, Rides toggle
- Volunteer editor (per-slot rows)
- Notes + coach notes (separate fields)
- Edit existing event (single + series)
- Convert single to recurring, delete all future, break from series

**RSVP + Event Detail:**
- Event detail page with team-color header
- 3-tab layout (Details, Location, RSVPs)
- RSVP progress bar + counts
- Per-player RSVP management with notes
- Parent guard: own children only
- Check-in overlay (admin/coach only)
- Cancel/reinstate event

**Rides/Carpool:**
- Offer ride, request ride, claim seat
- Guardian-linked auto-fill
- Directions to pickup
- Ride counts on cards

**Volunteers:**
- Grouped by duty name, per-slot claim/release
- Volunteer counts on cards

**Comments:**
- Thread with timestamps per event

**Roster:**
- Player list with jersey, grade, member_type badge
- Contacts view with guardian expand (tap-to-call, SMS, email)
- Search + sort (jersey number, A-Z, grade)
- Team switcher pills (oldest-to-youngest)
- Copy roster (gated to staff)
- Per-guardian Invite button

**Admin:**
- Admin home with KPI cards (Players, Events, Collected, Outstanding)
- Season management (create, edit, archive, set active) with preset chips
- Team/Program management (create, edit, colors, sort order)
- Locations CRUD with active/archived tabs
- Getting Started checklist
- Quick Actions

**Tournaments:**
- Tournament list page
- Tournament detail page
- Tournament rosters management
- Tournament Briefing component (uses tournament_messages table)
- Championship scenarios infrastructure

**Performance optimizations (P0-P6 complete):**
- Images compressed (2.5 MB → 244 KB)
- Code-split admin from parent (599 KB → 285 KB)
- Count hook caching
- Flattened auth chain
- Location lookup cache
- Dead code removed

**Edge Function:**
- `invite-parent` deployed (JWT verification OFF per memory)

**Calendar:**
- Add to Calendar button on event detail (.ics download)

## Verified shipped (missed in earlier audits, confirmed via screenshots + filesystem)

- ✅ Kid filter chips on parent schedule + home (`ChildFilterChips.jsx`)
- ✅ Season Window card with "Week 5 of 12 · 37% complete"
- ✅ Locations CRUD with active/archived tabs + search
- ✅ Per-guardian Invite buttons
- ✅ Team color v14 palette in production database
- ✅ MY TEAMS stats grid on team detail (Players/Roster/Academy counts)
- ✅ Event-type filters (All/Game/Practice/Skills Lab/Tryout)
- ✅ Relative time countdown ("in 8h 27m") on event cards
- ✅ Admin Seasons CRUD with preset chips
- ✅ Take Attendance (check-in overlay, admin/coach)
- ✅ Tournament Briefing component exists
- ✅ Edge Function `invite-parent` deployed
- ✅ Guardian notification preferences per person


---

# 8. COMMIT LOG (THIS BUILD CYCLE)

| Commit | Ship | What |
|---|---|---|
| `fb6a60b` | Ship 5E-2b | NextUpCard density variants (Min/Med/Max router pattern) |
| `c383fdd` | Bug fix | Chronological sort + MIN fallback + MIN tap routing |
| `0a53929` | Bug fix | Location button (superseded) |
| `ba410ca` | Bug fix | Anchor + multi-event stopPropagation + parent target guard |
| `7a8ad57` | Bug fix | useMapsUrl sync fallback + sw.js cache invalidation (`CACHE_NAME='ember-v2-2026-04-28'`) |
| `a8241b3` | Ship A | MED+MAX redesign + StatusRow + compressed RSVP bar |
| `936826a` | Ship X | Duty/comment author = guardianFirstName never email + companion migration `ship_x_backfill_author_names_from_guardians` |
| `eb2a769` | Y0 | filter undefined ids before `.in()` queries (uuid race) |
| `46852d3` | Y1 | THIS WEEK redesign — 10 files, +278/-36, 108.91KB gzipped |
| (Y2b SQL) | Y2b | game_results backfill — 26 rows, 100% match against records-v14_2.html |
| Multiple | Phase 0A | 4 security commits to main |
| Multiple | Migrations 013-022 | 8 additive + 1 destructive migration |
| `33db02e..d16c6c3` | Migrations 019/020 | event_notifications + enum reconciliation |
| `03e7cb5` | HOME_DESIGN_SPEC | 1199-line design spec for all 3 home roles |

**Y2b code layer status:** PROMPT DRAFTED but NOT SHIPPED. Lights up MY TEAMS strip with real records via new `useTeamRecords` hook.

**Y2b game_results backfill VERIFIED match against records-v14_2.html:**
- 11U Girls: 5-2 W1 +6.3 ✓
- 10U Black: 5-4 L4 +4.0 ✓
- 8U Boys: 3-5 L3 -10.6 ✓
- 10U Blue: 1-1 L1 +2.5 ✓
- 9U Boys: 0-1 L1 -8.0 ✓

---

# 9. DESIGN SYSTEM — COCKPIT MODE (current React app)

## Tokens (LOCKED — never invent or rename)

```css
:root {
  /* Platform surfaces (cool gray, NOT warm/beige) */
  --sf-bg-page:        #F7F8FA;
  --sf-bg-card:        #FFFFFF;
  --sf-bg-card-hover:  #F9FAFB;
  --sf-bg-secondary:   #F1F3F5;
  --sf-bg-tertiary:    #E9ECEF;
  --sf-text-primary:   #1A1D23;
  --sf-text-secondary: #4A5568;
  --sf-text-tertiary:  #8896AB;
  --sf-text-inverse:   #FFFFFF;
  --sf-border-default: #E2E8F0;
  --sf-border-subtle:  #EDF2F7;

  /* Status (semantic) */
  --sf-success:        #16A34A;
  --sf-success-soft:   #DCFCE7;
  --sf-warning:        #D97706;
  --sf-warning-soft:   #FEF3C7;
  --sf-danger:         #DC2626;
  --sf-danger-soft:    #FEE2E2;
  --sf-info:           #3B82F6;
  --sf-info-soft:      #EFF6FF;
  --sf-neutral:        #9CA3AF;
  --sf-neutral-soft:   #F3F4F6;
  --sf-academy:        #7C3AED;
  --sf-academy-soft:   rgba(124, 58, 237, 0.1);

  /* Brand (Ember defaults — overridden per org at runtime) */
  --sf-header:         #151525;
  --sf-accent:         #C9952E;
  --sf-accent-hover:   #D4A843;
  --sf-accent-soft:    rgba(201, 149, 46, 0.1);
  --sf-text-on-dark:   #F5F0E8;

  /* Decorative */
  --sf-flame-mid:      #E87520;
  --sf-crimson:        #8B1A1A;
  --sf-electric:       #4A9FFF;

  /* Shadows (exactly three — no fourth) */
  --sf-shadow-sm:  0 1px 2px rgba(0,0,0,0.04);
  --sf-shadow-md:  0 2px 8px rgba(0,0,0,0.08);
  --sf-shadow-lg:  0 8px 24px rgba(0,0,0,0.12);
}
```

## Legacy Hoopers Org Overrides (applied at runtime via AuthContext)

```css
--sf-header:       #4a8fd4;
--sf-accent:       #4a8fd4;
--sf-accent-hover: #5BA0E0;
--sf-accent-soft:  rgba(74, 143, 212, 0.1);
--sf-text-on-dark: #FFFFFF;
```

## Team Colors (production v14 palette — AUTHORITATIVE)

| Team | Color | Notes |
|---|---|---|
| 11U Girls | `#a78bfa` | Light violet |
| 10U Black | `#4a8fd4` | Brand cobalt (same as default) |
| 10U Blue | `#94a3b8` | Slate grey |
| 9U Boys | `#06b6d4` | Cyan |
| 8U Boys | `#f59e0b` | Amber |

**NEVER use Migration 004 palette** (`#7C3AED, #18181B, #2563EB, #DC2626, #EA580C`). Old, wrong, do not use.

## Typography (Cockpit)

- **Font:** Inter (400/500/600/700)
- **Scale:** 24/20/17/15/13/11px
- **Headers:** tracking-tight (-0.025em), line-height 1.2
- **Body:** line-height 1.5
- **Event time:** 17px bold always — dominant text on cards
- **Labels:** tracking-wide uppercase, 11px, weight 500

## Spacing (4px grid)

4 / 8 / 12 / 16 / 20 / 24 / 32 / 48px. Card padding 16px comfortable, 12px compact. Card gap 12px / 6px.

## Border radius

6px (badges) / 10px (cards, inputs) / 16px (modals) / 9999px (avatars).

## Component standards

- **Tap targets:** 44px minimum (Apple HIG, non-negotiable)
- **Inputs:** 44px height, `--sf-bg-tertiary` bg, 1.5px border, 10px radius, accent focus ring
- **Cards:** `--sf-bg-card`, `--sf-border-default`, 10px radius, `--sf-shadow-sm`
- **Buttons:** primary (accent bg, inverse text) / secondary (accent border) / destructive (danger bg) / ghost
- **Button press:** `scale(0.97)` + `vibrate(50)`
- **Modals:** `rgba(0,0,0,0.3)` backdrop — NEVER `bg-black/50`
- **Icons:** Lucide React only, 16/20/24px, stroke-width 1.75
- **Badges:** 6px radius, 11px text, weight 500
- **Avatars:** 24/32/40/56px

## Animations (10 total, all behind `prefers-reduced-motion`)

`sf-pulse`, `sf-fade-in`, `sf-pulse-dot`, `sf-bounce-tap`, `sf-fill-grow`, `card-expand`, `sheet-rise`, `toast-enter`, `sf-bell-shake`, `spin`.

## File architecture

- Every component file ≤150 lines (enforced via `scripts/check-file-length.sh`)
- Forms with 3+ fields → `FullScreenForm.jsx`
- Simple dialogs (RSVP, confirmations) → `BottomSheet.jsx`
- Shared in `src/components/shared/`
- Admin in `src/components/admin/`


---

# 10. DESIGN SYSTEM — BROADCAST MODE (the 22-component Squarespace library)

## What broadcast mode is

Cockpit mode = today's app (Inter, light bg, white cards, RSVPs, schedule). For daily decisions and operations.

Broadcast mode = the new layer. Dark navy gradient, Barlow Condensed headlines, team color identity, glowing stat tiles, big numbers, achievement pulses. For Records page, Team detail, Charlie's Season, Tournament bracket, Year-in-Review, Achievement push notifications.

**Critical:** Same design tokens, same data, same components. Mode shifts based on context, not user toggle.

## Source files (the visual specs)

- `/mnt/project/records-v14_2.html` (1167 lines, 100KB) — Broadcast mode reference. Records page.
- `/mnt/project/season-calendar-v12.html` (935 lines, 73KB) — Schedule design reference.
- `/mnt/project/gym-locations-v4.html` (273 lines, 26KB) — Locations reference.

These three HTMLs ARE the visual reference. They render in Squarespace. Better than screenshots because they're the rendering source.

## Color palette (AUTHORITATIVE from records-v14_2.html)

```
Brand cobalt:    #4a8fd4
Gold accent:     #f59e0b (also 8U team color)
Success green:   #22c55e
Alert red:       #ef4444
Deep navy bg:    #070d17
Card navy:       #0e1e33
Card navy alt:   #132845
Card border:     rgba(74,143,212,0.18)
Glow accent:     rgba(74,143,212,0.25)
```

## Typography (Broadcast)

- **Website primary:** Barlow + Barlow Condensed
- **App needs to load Barlow Condensed via Google Fonts (or self-host) for broadcast mode**
- Cockpit mode keeps Inter

## The 22 reusable components (from records + schedule pages)

| # | Component | Source HTML | Powers in Ember |
|---|---|---|---|
| 1 | Hero header (photo bg + tagline + 3-stat bar) | records-v14, season-calendar | Records, Schedule, Team detail, Season summary, Tournament page, Year-in-review |
| 2 | 3-stat hero bar (Championships / Nationals / Teams) | records-v14 | Records, org overview |
| 3 | Tournament timeline (5 numbered nodes done/next/future) | records-v14 | Records, Schedule tournament tracker |
| 4 | Team identity card (numbered badge + name + meta + record + streak chip) | records-v14, season-calendar | Records, Team detail, MY TEAMS strip, Schedule team header |
| 5 | 5-stat grid (PPG/ALLOWED/DIFF/WIN%/GAMES) | records-v14 | Records, Team detail, Charlie's Season, parent home |
| 6 | Game log row (W/L bg + date + opponent + score) | records-v14 | Records, Team detail, Charlie's Season |
| 7 | Season Splits cards (Offensive/Defensive) | records-v14 | Records, Team detail |
| 8 | Tournament result pill (🏆 Champions / 🥈 Finalists / "1-2 Showdown") | records-v14 | Tournaments, season highlights, push notifications |
| 9 | Moments cards (icon + stat + title + sub) | records-v14 | Season recap, year in review, Charlie's Season |
| 10 | H2H table | records-v14 | Pre-game prep, team detail |
| 11 | Standings table | records-v14 | Team detail, league page |
| 12 | Highlight blocks (75% WIN RATE / #1 DEFENSE) | records-v14 | Records, marketing pulse, achievement notifications |
| 13 | Team-tinted filter pills (lavender/blue/gray/cyan/amber) | season-calendar | Filter chips on every list surface |
| 14 | Practice/event info row (icon + label + time + venue) | season-calendar | Schedule team page, Team detail, Event detail |
| 15 | Tournament card (dark navy header with date + status pill, white body) | season-calendar | Schedule, tournament list |
| 16 | Status pills (Qualifier, Regular, Nationals green, Finale green, Reschedule yellow) | season-calendar | Tournaments, This Week, push notifications |
| 17 | Day-grouped event list with team-color stripes | season-calendar | Schedule tab, This Week home section |
| 18 | Multi-team tournament cards | season-calendar | Tournament weekend cards |
| 19 | Holiday/blackout markers (red banner) | season-calendar | Schedule tab |
| 20 | Vertical timeline with status dots | season-calendar (Key Dates) | Season milestones, tournament progression |
| 21 | Policies/info cards w/ icons | season-calendar | Event detail, coach instructions |
| 22 | Footer trust signal ("Sorted chronologically · Conflicts flagged") | season-calendar | All list surfaces |

## Spring 2026 records data (verified backfilled)

| Team | Record | Streak | Diff | PPG | Allowed | Win % | Games |
|---|---|---|---|---|---|---|---|
| 11U Girls | 5-2 | W1 | +6.3 | 27.6 | 21.3 | 71% | 7 |
| 10U Black | 5-4 | L4 | +4.0 | 31.8 | 27.8 | 56% | 9 |
| 8U Boys | 3-5 | L3 | -10.6 | 17.3 | 27.9 | 38% | 8 |
| 10U Blue | 1-1 | L1 | +2.5 | 29.0 | 26.5 | 50% | 2 |
| 9U Boys | 0-1 | L1 | -8.0 | 16.0 | 24.0 | 0% | 1 |

## Tournaments — Spring 2026

| # | Name | Dates | Status | Teams |
|---|---|---|---|---|
| 1 | ZG Chase for the Chain NY | Apr 11-12 | 🏆 Complete | 10U Black (Champions), 11U Girls (Champions), 8U Boys (Finalists) |
| 2 | NY Metro Showdown | Apr 18-19 | ✅ Complete | 11U Girls 1-2, 10U Black, 8U Boys |
| 3 | Rumble for the Ring CT | May 16-17 | 🔜 Upcoming (NEXT) | Fairfield Co. CT |
| 4 | ZG Nationals | May 29 - Jun 7 | 🔜 Upcoming | 10U Black + 11U Girls qualified |
| 4b | Summer Hoops Jam Classic 1 & 2 | Jun 6-7 | 🔜 Upcoming | 8U Boys (Bergen Co. NJ) |
| 5 | NY Hoop Festival — Season Finale | Jun 13-14 | 🔜 Upcoming | All AAU teams |

## Three-mode design architecture decision

| Surface | Mode |
|---|---|
| Home (cockpit) | Stays cockpit. NEXT UP gets richer team-color identity. MY TEAMS gets tinted backgrounds + streak chips. |
| Schedule tab | Becomes Schedule page from `season-calendar-v12.html`. Hero, team filter pills, weekly practice grid, games & tournaments grouped by date, holiday blackouts, season info accordion |
| Records (new) | Broadcast. Hero, tournament timeline, team cards, game logs, splits, moments, H2H, standings |
| Team detail (new/thin) | Per-team broadcast. Tap team → its identity, schedule, record, game log, splits |
| Charlie's Season (new) | Per-kid broadcast. Identity card with kid's first name in team color, season log, attendance, future games |
| Tournaments (new) | Tournament timeline + per-tournament bracket pages |
| Notifications | Achievement pulses use moment cards visual language |

## Design integration opportunities (10 ways to reach 95% bar)

1. Auto-badge teams on home + team page: "✓ Nationals Qualified" with gold accent
2. Tournament archive view: completed tournaments show final record + championship badge
3. "Run of Play" narrative bullets auto-generated from game data
4. Game result entry (Quick Score) propagates to records view automatically
5. Winter 2025-26 archive accessible as "view history" on records tab
6. Achievement timeline per team
7. Arrival protocol reminder by event type (5-Min Rule for practice, 15-Min Rule for games)
8. RSVP deadline countdown urgent banner 48-24hr before Friday noon deadline
9. Post-game "Car Ride Home" gentle reminder, delight feature
10. Academy Standards in-app handbook accessible from Account page


---

# 11. COMPETITIVE ANALYSIS — LEAGUEAPPS

## What it is

LeagueApps is the incumbent in youth sports admin software. $200+/mo. Desktop-first UI for league commissioners. Mobile is afterthought. Has the right data model. Throws the wrong UX at parents.

## What we're stealing (data structures)

- **Payment plans with installment schedules.** LH Spring 2026: $350 Mar 1 / $250 Mar 23 / $200 Apr 15 = $800 total
- **Per-program waivers:** Main Waiver + Legacy Hoopers Waiver & Release Form + Refund Policy
- **Form fields:** Uniform Size dropdown (YS/YM/YL/YXL/AS/AM/AL), Medical Conditions/Allergies, Emergency Contact Name, Emergency Contact Number, Parent Code of Conduct (3 checkboxes)
- **Capacity rules:** max 11 players, both Pending & Reserved count toward capacity
- **Variable roster fee:** $800/player, payment plans as alternative, no platform fee
- **Email notification triggers:** on registration, on staff adding players, on payment
- **Staff roles:** Coach (Primary flag), Admin
- **Player invites with status tracking** (ACCEPTED state, re-send capability, date sent)
- **Skipped Registration Message + Abandoned Registration Message** — custom text per program
- **Program Settings sub-nav:** Edit Details / Registration Options / Payment Plans / Form Fields / Membership Verification / Waivers / Upload Logo / Preferences
- **Three registration message states:** Successful / Skipped / Abandoned (3 separate WYSIWYG editors)
- **Auto-reminder timing:** 3 days before installment due date
- **Roster visibility matrix:** field-by-field Staff Only vs Public, Website Roster vs Printed Roster
- **"Hide Team Details from Players"** toggle (useful for tryout mode)

## Confirmed data from screenshots (81 cataloged)

**10U Black roster (Image 18):** 11 players total. 10 ACCEPTED on Mar 4, 1 Academy Player (Jake Perkiel). All confirmed.

**Roster:** Gabriel Alexander, Spencer Clark, Cameron Dortona, Mason Drumheller, Hudson Edelman, Henry Graff, Henry Katzeff, Aubtin Khojasteh, Lucas Mandell, Frankie Schindler, + Jake Perkiel (Academy).

**Staff on 10U Black (Image 16):**
- Darien Gonzalez (Coach, joined Mar 23)
- Legacy Hoopers admin (Admin, joined Mar 9)
- Kenny Lane (Coach Primary, joined Mar 4)

**Payment plan (Image 9):** 30-min auto-invalidation for self-registrants, 3-hr for staff-added players. Strictly enforce first payment.

**No email on player rows:** Parents haven't linked email accounts in LeagueApps. Messaging through their platform is broken. Email-first parent accounts in Phase 6 fixes this.

## What we're throwing away (their UI)

- Every dropdown is a full-screen modal on mobile
- Settings tree (Settings → Programs → Registration Options → Payment → Payment Configuration → Variable roster fee $800) is 5 taps to find a number
- "Reporting → Programs → Team Properties" buried 3 levels deep — Skyfire surfaces this on AdminHome
- Email and Text are completely separate tools with no unification, no read receipts, no real-time
- "View Mobile Version" red banner on every screen = their admission of failure
- Messaging spreads across 5 separate menu items

## LeagueApps Play app (mobile companion, green UI)

- **Tournament standings:** Schedule/Standings toggle, P/W/L/T/PCT compact table with logo badges
- **Tournament empty state:** Calendar illustration + "Schedule has not been published"
- **Team code join:** Minimal screen, search bar at bottom
- **Family dashboard:** Samaritano Family Dashboard with edit link, child participants table (Name/Gender/Birthdate/Actions)
- **Per-player calendar subscribe:** parent adds just Charlie's schedule to their calendar
- **Email delivery status indicator:** "OK: No reported delivery problems"
- **Edit Child Mobile App Access:** parental consent flow (COPPA-adjacent)
- **Invite Parent/Guardian:** co-parent invite with pre-filled last name + Skip option
- **Manage & Pay** as a primary CTA — parents always need to find payment

## Skyfire wins by

- One platform, mobile-first, info density without clutter
- Save & Message Team — creates event AND notifies parents in one action (NO competitor has this)
- 3-tap RSVP via bottom sheet
- Per-event carpool with guardian auto-fill
- Read receipts on changes ("Time changed 2hr ago · Seen by 6 of 12 families")
- Game day checklist + Running Late notification
- Conflict detection (same-team overlap, same-location double-book)

---

# 12. COMPETITIVE ANALYSIS — PLAYMETRICS

## What it is

NYSC's parent app for soccer (Charlie's other sport). 18 screenshots cataloged. Better mobile UX than LeagueApps. Has the two-layer messaging right (formal email-style + real-time team chat).

## Patterns to steal (Tier 1)

1. **Per-player attendance badge on calendar card** — parents with multiple kids see status at a glance (better than LeagueApps which doesn't show inline)
2. **Location as tappable link on event card**
3. **Field surface metadata on locations** — turf/grass/hardcourt
4. **Multi-map directions sheet** — Google Maps / Waze / Apple Maps
5. **Featured Programs as top-of-home cards** — surface registration/tryout CTAs
6. **Sync Calendar modal:** iCal subscribe + "Subscribe to Full Calendar" / "Subscribe to Games Only" tiers (Skyfire offers Full / Games Only / Practices Only)
7. **Two-layer messaging:** formal (Inbox/Sent/Drafts with To/Cc/Bcc, subject lines) + Team Chat (real-time iMessage-style bubbles, emoji reactions)
8. **Emoji reactions** on chat messages with count
9. **Bulk attendance setting** across multiple events — select-and-apply
10. **Per-player event filtering** for multi-child families
11. **Pinnable teams** — parents pin most active team to top
12. **Three-state attendance:** Attending / Not Attending / Injury / Partial + notes
13. **Featured Programs** + Current/Upcoming program toggle

## Patterns to skip

- "Player Contact" dropdown label is confusing
- Game scores all showing 0-0 suggests scores aren't being entered (common adoption gap)
- Manual copy-paste for Google Calendar is clunky (should be deep link)

## Confirmed data from screenshots

**Frank's family in PlayMetrics:**
- Charlie: Active Roster Lab, Girls 11U
- Milo: Boys 8U
- Rowan: (older child)
- Frank Samaritano (parent)
- Stephanie (parent)
- Programs: NYSC Tryouts, Club Membership, Futures Membership

---

# 13. COMPETITIVE ANALYSIS — GAMECHANGER

## What it is

Dick's Sporting Goods' live scoring product. The benchmark for live game scorebook UX. 18 screenshots cataloged. Premium upsell paywall on play-by-play and box scores ($14.99/mo family / $8.33/mo individual).

## Patterns to steal (Tier 2 — Build Next)

1. **Season-grouped team cards with role badge + record inline.** Parents with kids on multiple teams across seasons see everything at a glance. "My Athletes" top section is smart for multi-child families.
2. **Five-tab bottom nav** separating Events, Messages, and Announcements into distinct channels.
3. **Past Seasons archive folder** — collapses 12 older teams. Need this for fall→spring rollover.
4. **Schedule card layout:** large date number, day abbreviation, @/vs prefix, opponent, result. Extremely scannable.
5. **"Message Team" one-tap from team header** (table stakes).
6. **Reverse-chronological play-by-play.** Each card shows jersey number badge, player name + number, play type. Running score on opponent scoring plays. Cards left-aligned for your team, right-aligned for opponent. **Gold standard play-by-play UX.**
7. **Box score Export PDF** — coaches need this for league reporting.
8. **Quarter-by-quarter scoring table** (1/2/3/4/T). Team Fouls by quarter (both teams). Timeouts Taken by quarter (30s vs Full columns).
9. **RSVP summary three-state counts** (going/not going/unknown) on event info card.
10. **"Reminder was sent" status indicator.**
11. **Scorer attribution:** "This game was scored by Frank S"
12. **Three-tab RSVP breakdown** (Going/Not Going/No Reply) with per-player action buttons.
13. **Inline expand to Going/Not Going** — no modal, no page navigation. Fast one-tap RSVP entry by staff.
14. **"Resume Scoring" + "Record Video" buttons** on game info.
15. **Stats with Standard/Advanced toggle + TOTALS row.**
16. **AI-generated game recap** from box score data with "Copy recap".
17. **AI Strengths / Areas for Improvement** coaching summary per game.
18. **Per-quarter insight filtering.**
19. **Three-path calendar sync:** Apple Calendar / Google Calendar / iCal link copy.
20. **Per-team calendar sync page.**
21. **Three-tier stat privacy:** public / team / player-only.
22. **Team invite QR code** with Share + Print.
23. **Players / Staff / Followers sub-tabs** on Team view.
24. **Parent self-service player claim** from roster via invite link.
25. **Season picker as tappable card grid** with icons.
26. **One-tap season rollover** — roster + fans preserved.

## Patterns to skip

- **Paywall on live game data.** Skyfire never paywalls core game info.
- **Video hosting** — huge infrastructure lift, not for v1.
- **In-app NPS survey** — low priority.

## Skyfire's edge over GameChanger

GameChanger is scorekeeper-only bolted onto schedule. No RSVP, no carpool, no financials. Parents use it for one thing.

Skyfire has scoring + everything around it. Box score lives inside the event that already has the RSVP, ride board, and parent message.

---

# 14. COMPETITIVE ANALYSIS — SPORTSENGINE / TEAMSNAP / STACK SPORTS

## SportsEngine

**Steal:**
1. **Week strip navigation** — S M T W T F S pinned below header, today = solid color pill, tap day = scroll to date group. 7 days visible, swipe to advance.
2. **"Are you going?" inline RSVP** embedded in collapsed event card.
3. **"Notify Team" toggle on create** — ON by default, sends push immediately on Save. Becomes our "Save & Message Team."
4. **Drum-roll time pickers** — iOS-native scrollable drum, 5-min increments.
5. **Duration presets:** 30/45/1hr/1:30/2hr/3hr.
6. **RSVP bottom sheet** — Avatar + name, Yes/Maybe/No inline. 40% height.
7. **Home/Away segmented control** — 4-state Home/Away/Neutral/TBD.
8. **Activity filter action sheet** — All / Games / Events / Cancel.
9. **Agenda vs Day-by-day toggle** — maps to Comfortable/Compact density toggle.
10. **Team home 3x2 icon grid** — Schedule / Roster / Chat / Messages / Standings / Stats.

**Gap (their bug):** Tapping a day filter doesn't scroll, it reloads. Skyfire's `DayStrip → ScheduleList` scroll-anchor approach fixes.

## TeamSnap

**Steal:**
1. **Real-time team chat** — iMessage bubbles, left/right, date dividers. Phase 4 Supabase Realtime.
2. **Availability view grid** — players × events, colored status cells. Our `AvailabilityHeatmap.jsx`.
3. **One-tap directions** — tap location → action sheet: Apple Maps / Google Maps / Waze.
4. **Payment status badges** on roster — green $ paid, orange $ partial, red $ past due.

**Gap:** Their availability grid is static — no Futures Academy section, no "below 8 going" warning column. Skyfire has both.

## Stack Sports / SportsConnect

**What it is:** Enterprise tier, powers state associations, recreational leagues, club programs. Data model right but mobile UX is 2015. Admin UI requires desktop.

**Steal:** Registration capacity enforcement logic (Pending + Reserved both count toward cap — already locked).

**Gap:** Zero mobile-first design. The admin running 5 teams from a Chromebook courtside is exactly who they've ignored. Skyfire's market.

## Linear (UI Quality Benchmark — not a sports app)

1. Information density without clutter
2. Status workflows (every entity has clear status lifecycle)
3. Keyboard accessibility (every card `role="button"` + `tabIndex={0}`)
4. Instant feedback (optimistic updates before API confirms)
5. Empty states with purpose

## Apple Calendar (Schedule Visualization Benchmark)

1. Event time always dominant text (17px bold)
2. Color coding carries meaning (team_color on every card)
3. Today always anchored
4. Event detail is panel, not page
5. Countdown is most important pre-game info ("Starts in 2h 15m" bigger than score from last week)

## Nike Run Club (Engagement Patterns Benchmark)

1. Streak tracking (attendance streaks: "14 practices in a row 🔥")
2. Celebration moments (first game win, 100% attendance week)
3. Season progress bar (thin 2px line with glow dot)
4. Records as achievements (W-L displayed as card, not table)


---

# 15. BRAND VOICE + CONTENT RULES

## Core brand positioning

**Tagline:** "Grow Your Game. Leave Your Legacy."

**Elevator pitch:** "Built by a Hall of Fame coach and a parent who refused to settle for the '15-kid cash grab.'"

**Three proof points:**
1. Strict 10-player active rosters
2. Curriculum-based development
3. Minutes are earned, not given

## Brand voice patterns

Direct. Witty. Emotionally intelligent. Never corporate.

- **Names the problem:** "Thursday night scrambles", "15-kid cash grab", "5-Minute Practice Rule vs 15-Minute Game Arrival"
- **Families-first framing:** "Built for Families", "The Director's Promise", "The Car Ride Home"
- **Earned, not given:** Playing time, roster spots, minutes — framed as earned through effort
- **Hall of Fame standards:** Collegiate-level expectation
- **Teaching over coaching:** "Hall of Fame educator", "differentiated instruction"

## Brand voice rules

✅ Write like a sharp operator, not a corporate platform
✅ Name the parent's actual problem before offering the solution
✅ Use "earned", "active roster", "differentiated", "curriculum" deliberately
✅ Celebrate real moments (Nationals Qualified, Champions, Semi-Final exits)
❌ No corporate jargon ("leverage", "utilize", "seamless", "streamline", "robust")
❌ No em dashes (use commas, colons, periods)
❌ No fluffy marketing phrasing

## Frank's communication preferences

- Answer first, then detail. No preamble, no padding, no filler.
- No em dashes anywhere. Use commas, colons, or periods.
- For multi-variable decisions, think step by step and flag assumptions or weak points.
- "L99" means maximum depth and effort, no shortcuts.
- Give complete files for website work (Squarespace HTML). Give targeted edits for app development (Claude Code).
- Frank confirms when things are right. Flag clearly when something's wrong.

## Copy library — phrases liftable into Ember

**Dedication:**
- "Minutes are earned, not given."
- "Quality over quantity."

**Communication:**
- "No more Thursday night scrambles."
- "Real-time app communication."

**Expectations:**
- "Trust the process, the timeline, the coaching staff."
- "Hall of Fame standards."

**24-Hour Rule:**
- "Coaches don't review playing time on game day. Send your message tomorrow."

**Game day:**
- "15 minutes before tip-off. Fully dressed. Shoes tied."

**Practice:**
- "5-Minute Rule: wait in your car."

**Failure/comeback:**
- "We were right there." (Winter Playoff near-miss)

**Celebration:**
- "That's not a season start. That's a launch sequence."
- "Okay, everyone exhale."
- "Proud of these girls. Now go enjoy your Sunday night."

---

# 16. OPERATIONAL RULES

## Naming conventions (HARD)

- **Number first:** "10U Black" never "Boys 10U Black"
- **Sort oldest to youngest:** 11U Girls → 10U Black → 10U Blue → 9U Boys → 8U Boys
- **Records page (ALL CAPS):** 11U GIRLS · 10U BOYS BLACK · 10U BOYS BLUE · 9U BOYS · 8U BOYS
- **Never use "CYO"** in UI — always "League Play"
- **"Volunteers"** not "Duties" app-wide
- **"Futures Academy"** not "practice roster" or "development track" — headline feature, never a footnote
- **"League Play"** not "CYO"
- **Brand cobalt** is `#4a8fd4` — never sky blue `#29b6f6`

## RSVP deadlines (CRITICAL for Ember RSVP logic)

**AAU Tournaments:**
- Preliminary schedule released Wednesday night
- Finalized schedule Thursday afternoon
- Parent RSVP deadline: **Friday 12:00 PM noon**
- Futures Academy call-up notifications: Friday 2-3 PM

**League Play:**
- Full season pre-loaded
- Advance notice: 48 hours before game
- Absolute final lock: 24 hours before game
- Futures Academy call-up: immediately after 24-hr deadline

## Arrival protocols (distinct by event type)

- **Practice:** 5-Minute Rule (wait in car until 5 min before start)
- **Games:** 15-Minute Rule (in gym, dressed, shoes tied)

Late arrival to games = miss first rotation.

## The 24-Hour Rule

Parents wait 24 hours after a game before messaging coaches about playing time. Documented in Academy Standards.

## Blackout dates (Spring 2026)

- March 30 - April 5: Spring Recess
- May 10: Mother's Day
- May 22-25: Memorial Day Weekend

## Call-up triggers

- AAU Tournaments: notified Fri 2-3 PM if activated
- League Play: notified immediately after 24hr final RSVP deadline
- Activation if active roster drops below 8

## Locations (AUTHORITATIVE)

| Name | Address | Role | Teams |
|---|---|---|---|
| St. Patrick's | 29 Cox Ave, Armonk, NY | Skills Lab Mondays | 10U Blue, 10U Black, 11U Girls (optional) |
| Rippowam Cisqua | 439 Cantitoe St, Bedford, NY | Practice Tuesdays | 8U, 9U, 10U Blue |
| Westchester CC | 75 Grasslands Rd, Valhalla, NY | Practice Wednesdays | 10U Black, 11U Girls |

**Gym-level detail:**
- Rippowam: Wade's Gym + Trustees Gym (enter via Clinton Road)
- Westchester CC: Viking Gym (PEB Building), parking Lots 8, 9, 10
- St. Patrick's: St. Francis Hall

## Active teams Spring 2026

| # | Team | Grade | Circuit | Practice | Skills Lab Eligible |
|---|---|---|---|---|---|
| 1 | 11U Girls | 5th Grade Girls | AAU Circuit — Nationals Qualifier | Wed 6:30-8:00 PM @ WCC | ✓ Mon @ St. Patrick's |
| 2 | 10U Black | 4th Grade Boys | AAU Circuit — Nationals Qualifier | Wed 5:00-6:30 PM @ WCC | ✓ Mon @ St. Patrick's |
| 3 | 10U Blue | 4th Grade Boys | League Play | Tue 7:00-8:30 PM @ Rippowam | ✓ Mon @ St. Patrick's |
| 4 | 9U Boys | 3rd Grade Boys | League Play | Tue 6:00-7:30 PM @ Rippowam | ✗ (foundational) |
| 5 | 8U Boys | 2nd Grade Boys | AAU Circuit | Tue 5:30-7:00 PM @ Rippowam | ✗ (foundational) |

## 90-minute practice structure (Academy Standards)

1. **Activation (15 min)** — Warm-up & mechanics, injury prevention
2. **Skill Lab (30 min)** — Ball handling, shooting mechanics, finishing packages
3. **Basketball IQ (15 min)** — Film room on feet: spacing, cutting, rotations
4. **Live Comp (30 min)** — Full-court 5v5 at game speed

## Code of Conduct

**Players:** Arrive on time fully dressed. Absolute respect for teammates, coaches, refs. Play with intensity, unselfishness, integrity. Body language matters on court AND bench.

**Parents:** Cheer positively, no coaching from sidelines. Respect officials and opposing families. Don't approach the bench to discuss playing time at the game. Trust the process, timeline, coaching staff.

## The "Car Ride Home" principle

The drive home is often the most stressful moment of youth sports. Recommended message: **"I loved watching you play today."** Nothing else. Let coaches handle film review at next practice.

**Ember opportunity:** Post-game toast/reminder shown to parents when game ends. Delight feature at the 95% bar.

## Roster structure

- **Full Roster Player (Active Roster):** 10 max, travels to all games
- **Futures Academy (Practice Player):** Separate track, activates on call-up
- Activation if active roster drops below 8

## Payment model

- Season fee adjusts per team (custom-curated to competitive level)
- Full Roster fee ≠ Futures Academy fee (Academy significantly reduced)
- Fee covers: practices, tournament entry, league entry, gym insurance, player kit
- Fee does NOT cover: hotel for stay-to-play, spectator gate fees ($10-20/day AAU)

## Partner vs Staff distinction

- **Partners (profit-pool):** Frank Samaritano + Kenny Lane — Admin role
- **Staff (paid-per-session):** Darien Gonzalez — Coach role
- Primary calendar: `admin@legacyhoopers.org`

## iCal sync lag warning

Always display "Calendar events can take up to 24 hours to update in subscribed apps" near any calendar subscription feature.


---

# 17. BUG CATALOG (22 BUGS)

Organized by severity. Bugs marked ✅ were fixed.

## P0 (Security / Privacy) — ALL CLOSED ✅

- ✅ Parents could edit any event (fixed Phase 0A-1)
- ✅ Parents could delete any event (fixed Phase 0A-1)
- ✅ Parents could create events (fixed Phase 0A-2)
- ✅ Parents could bulk-export guardian contact info (fixed Phase 0A-3)
- ✅ Parents could NOT RSVP other families' kids (already gated, verified Phase 0A-4)

## P1 (Data Integrity) — addressed in Migration 021 ✅

- ✅ Tournament times corrupted to 00:00-23:59, must be 08:00-20:00 Eastern
- ✅ Apr 23 duplicate 11U Girls practice (need to pick which to keep — Frank deciding)
- ✅ 8U Boys currently marked Nationals Qualified (should be Summer Hoops Jam Bergen County)
- ✅ Happy Gym test location in production (delete)
- ✅ "Test notes" on Milo's RSVP (delete)
- ✅ Tournament title "2026 Zero Gravity Girls National Finals" should revert to canonical "Girls Nationals if qualify"
- ✅ Season dates shows Mar 22 instead of Mar 23 (timezone bug in `formatDateFull`)

## P1 (UI bugs) — Phase 1 cleanup

- 📋 `UpcomingEvents.jsx` renders hardcoded stub data ("Practice Wed Apr 16 WCC 5:00 PM", "vs Storm AAU Apr 19", "Practice Wed Apr 23 WCC 5:00 PM") regardless of team_id — needs real query
- 📋 Comments show author email instead of guardian first name (FIXED via Ship X commit `936826a` + companion migration `ship_x_backfill_author_names_from_guardians`)
- 📋 Games filter excludes tournaments (should include)
- 📋 Fake 0-0 records on MY TEAMS card when no game_results exist — replace with season progress % (PARTIAL: Y2b backfill complete, Y2b code layer still pending)
- 📋 "Good morning, Frank" has underline styling (should be cleaner)

## P2 (UX polish) — Phase 1

- 📋 NextUpCard shows events >48h out (should cap at <48h for urgency)
- 📋 RSVP writes succeed but UI doesn't optimistically update (requires hard refresh) — known issue, files for Phase 1
- 📋 Recurring series edit uses native confirm modal (should use FullScreenForm)
- 📋 Login screen uses amber button (`#C9952E`) instead of brand cobalt (`#4a8fd4`)
- 📋 Score bottom nav tab intentionally hidden for parents (Frank confirmed) — scoring lives inside event card via Quick Score

## P3 (Cosmetic) — Phase 2 or 0C

- 📋 Copy Roster button shows "Copy Failed" on HTTP dev (requires HTTPS production for clipboard API — works on `app.legacyhoopers.org`)
- 📋 MessageTeamFAB has dead TODO click handler (non-destructive)

---

# 18. PHASE PLAN

## Phase 0A — Security Lockdown ✅ COMPLETE (April 22-23, 2026)

50 minutes start to finish. 3 actual code edits, 1 verification. 4 commits to main.

## Phase 0B — Data Stability ✅ COMPLETE (April 23-26, 2026)

- 8 additive migrations shipped: 013-020
- 1 destructive migration shipped: 021 (data corrections)
- 1 RLS hardening migration: 022
- 1 parent visibility migration: 028
- Y2b game_results backfill (26 rows)

## Phase 0C — Ember Rebrand 📋 DESIGNED

Blocked on completion of broadcast mode work. Estimated 1-2 sessions.

**Scope:**
- Find/replace `Skyfire` → `Ember` in all UI strings, package.json, README.md
- CSS namespace rename: `--sf-*` → `--em-*`
- File rename: `skyfire_phoenix.webp` retired, `phoenix_logo_2048.png` becomes canonical Ember logo
- GitHub repo rename: `skyfire-app` → `ember-app` (defer until 2027 per D3)
- Vercel project rename
- Seed `ember_platform` registry table (singleton)
- Update `organizations.branding` JSONB
- App header: displays `org.branding.org_name_display` primary + small "Powered by Ember" footer
- Login screen: Ember branding pre-auth, org branding post-auth
- `document.title` format: "{OrgName} · Ember"
- Domain decision: ember.app vs emberhq.com vs getember.co
- CLAUDE.md addendum: new governance rules

## Phase 1 — Parent 95% (6-7 sessions estimated)

### Priority 1 — Honest rendering (replaces fake data)

- 📋 SeasonProgressBar component replacing fake 0-0 on MY TEAMS strip
- 📋 TeamHeaderCard — show season progress % + record when game_results exist
- 📋 SpringPulse card on ParentHomePage — Season in Progress callout
- 📋 TournamentTracker 5-dot timeline
- 📋 AchievementCard (Champions, Nationals Qualified, Finalists) on team detail

### Priority 2 — Bug fixes (from 22-bug catalog)

- 📋 Season dates timezone fix (one-line `formatDateFull`)
- 📋 `UpcomingEvents.jsx` rewrite (drop UPCOMING_SEED, real team_id query)
- 📋 Comments display name fix (resolve email to guardian first_name) ✅ shipped
- 📋 Games filter includes tournaments
- 📋 "May Reschedule" amber pill on draft events (`schedule_status='draft'`)
- 📋 NextUpCard urgency filter (<48h cutoff)

### Priority 3 — Polish

- 📋 Login screen redesign (cobalt CTA, gradient inspired by legacyhoopers.org hero)
- 📋 Remove underline on "Good morning, Frank"
- 📋 Recurring series edit: replace native confirm with FullScreenForm
- 📋 Density toggle system wired to CompactCard (3-level)
- 📋 First Type 1 Team Wrapup auto-generated briefing

## Phase 2 — Coach 95% (5-6 sessions)

- 📋 Quick Score (inside event, not bottom nav)
- 📋 Rotation Planner (pre-game lineup + bench order, staff-only)
- 📋 Live substitution tracker (in-game, timestamped)
- 📋 Minutes computation + season trends
- 📋 Player of the Game designation
- 📋 Roster Health dashboard (attendance trending per player)
- 📋 Call-up flow (manual coach invite, 2-hour response window)
- 📋 Coach compensation (personal view: current month accrual, paid history)

## Phase 3 — Admin 95% (8-10 sessions)

- 📋 Content CMS (Academy Standards editor, policy pages)
- 📋 Season/Tournament/Achievement CRUD
- 📋 Briefing templates editor (5 types)
- 📋 Hotel code distribution
- 📋 Tournament rules editor (structured JSONB form)
- 📋 Monthly coach invoice generation + payment tracking
- 📋 Year-end 1099 summary
- 📋 Admin compensation dashboard (all coaches)

## Phase 4 — Multi-tenant hardening 📝 DEFERRED

Not needed for Fall 2026 LH pilot. Scheduled for 2027 before St. Pat's onboarding.

## Phase 5 — Launch + Native (3-4 sessions)

- 📋 Capacitor wrapper for iOS + Android
- 📋 Push notifications (APNs iOS, FCM Android)
- 📋 Apple App Store submission ($99/year)
- 📋 Google Play submission ($25 one-time)
- 📋 Fall 2026 rollout — 11U Girls families first cohort

## Phase 6-7 — Platform + Billing (2027)

- 📋 Super Admin role UI (Ember platform surfaces)
- 📋 Stripe subscription (monthly base, Phase 6)
- 📋 Stripe Connect (registration % layer, Phase 7)
- 📋 Multi-org switcher UI
- 📋 Ember marketing site
- 📋 St. Pat's CYO onboarding
- 📋 Registration builder (7 program types)
- 📋 Financial dashboard

## Current build target — Wave 3 (broadcast mode)

**Week 1 (now): Foundation + Records page**
- Day 1: Build broadcast component library (~22 React components mirroring Squarespace HTML). Single shared `src/components/broadcast/*` directory. CSS tokens for navy gradients, Barlow Condensed loaded, team-color identity system, status pill system.
- Day 2-3: Records page on `/records` route. Hero, tournament timeline, team filter, per-team identity cards with full game logs, season splits, run of play. Reads from `game_results` table backfilled.
- Day 4: MY TEAMS strip on parent home rebuilt with team-color identity (small version of team card). Records page links from home.
- Day 5: Phone test, polish, merge.

**Week 2: Schedule tab redesign + Team detail**
- Day 6-8: Schedule tab redesigned per `season-calendar-v12.html`. Hero, team filter pills, weekly practice grid, games & tournaments grouped by date with conflict flagging, holiday blackouts, season info accordion. Reuses broadcast components.
- Day 9-10: Team detail page (`/teams/:id`). Per-team version of Records. Reuses 80% of Records components.

**Week 3: Charlie's Season + Tournaments + push foundations**
- Day 11-12: Charlie's Season (`/players/:id` for own kids). Per-kid emotional resonance page.
- Day 13: Tournaments page (`/tournaments`). Timeline + per-tournament detail.
- Day 14-15: Push notifications foundation. Achievement notifications using moments visual language.


---

# 19. WORKFLOW RULES

## The four-tool workflow

1. **Claude.ai chat** — planning, prompts, architecture, SQL drafting
2. **Claude Code terminal** — implementation via `str_replace` edits (targeted, never full file rewrites)
3. **Supabase SQL Editor** — schema changes and data corrections (paste and run)
4. **Vercel** — build validation and auto-deploy from `main`

## Deploy chain (LOCKED — exact sequence)

```bash
git add -A && git commit -m "[message]" && git push origin v2 && git checkout main && git merge v2 && git push origin main && git checkout v2
```

Wait 60s for Vercel deploy, then test.

Claude Code tends to push to `claude/` branches by default — always correct explicitly.

## Resume command (every session)

```bash
cd ~/legacy-hoopers-app && claude
# OR
cd ~/legacy-hoopers-app && npm run dev -- --host
```

Dev server: `http://100.115.92.199:5173/` (Crostini IP).

## Critical learnings (meta-rules)

1. **One fix per prompt.** No batches. Targeted `str_replace` only, never full file rewrites. Mega-prompts cause timeouts.
2. **SQL in chat, not via Claude Code.** Database schema changes written in chat as SQL, pasted directly into Supabase SQL Editor. Faster, more reliable, version-controlled.
3. **150-line file cap.** No component file exceeds 150 lines. Pre-commit hook enforces (`scripts/check-file-length.sh`).
4. **Architecture in chat, execution in Claude Code.** Claude.ai chat for planning, design, SQL, prompts. Claude Code for surgical edits. Test before moving on.
5. **CSS variables only.** No hardcoded hex except inline `team_color` from database.
6. **Avoid `current_user_org_id()` on `org_members` table.** Causes RLS recursion. Use `user_roles` instead.
7. **Deploy chain must be exact.** `v2 → main → v2` via git commands in sequence. Never skip.
8. **Feature reference is GameChanger, PlayMetrics, SportsEngine, LeagueApps.** UI quality reference is Linear, Apple Calendar, Nike Run Club, Stripe Dashboard. If it looks like a template, rebuild.
9. **Answer first, then detail.** Frank's communication preference. No preamble, no filler. No em dashes. No "leverage/utilize/seamless/robust/streamline."
10. **Flag blockers immediately.** If a request conflicts with data model or prior decisions, say so in one sentence at the top. Never quietly implement workarounds.
11. **Update the build queue after every shipped feature.** Not at end of session — immediately. Stale build queue caused Session C to miss 15+ shipped features.
12. **Read filesystem before claiming any state.** Never "I remember that..." — always verify.
13. **Every claim needs evidence source.** "Feature X shipped per grep of [file]" or "per migration 011" or "per screenshot [file:page]" — not "I recall it was done."

## Verification checklist (before "Build clean")

```bash
# 1. No warm palette remnants
grep -r '#F7F5F0\|#EAE6DD\|#E5E0D6\|#4A4852\|#1C1B1F\|#B3261E\|#1E5FAE\|#2E7D4F\|#B86E00' src/ && echo "FAIL: warm palette found" || echo "PASS"

# 2. No invented tokens
grep -r 'sf-shadow-xl\|sf-border-strong\|sf-bg-muted\|sf-bg-subtle' src/ && echo "FAIL: invented tokens found" || echo "PASS"

# 3. No hardcoded #FFFFFF in components
grep -rn '#FFFFFF' src/ --include='*.jsx' | grep -v 'TeamFormSheet' | grep -v 'COLOR_SWATCHES' && echo "FAIL: hardcoded #FFFFFF" || echo "PASS"

# 4. All files ≤150 lines
find src/ -name '*.jsx' -o -name '*.js' | xargs wc -l | awk '$1 > 150 && !/total/ {print "FAIL: "$2" is "$1" lines"}' || echo "PASS: all files ≤150"

# 5. Lint + build
npm run lint && npm run build && echo "PASS: lint + build clean"
```

## RLS smoke test

```bash
export SUPABASE_ANON_KEY="eyJ..."
./scripts/rls-smoke.sh
```

Hits Supabase REST API with ONLY the anon key (no user session). Expects zero rows from `event_rsvps`, `event_rides`, `event_duties`, `event_comments`. If any table returns rows, RLS policies didn't apply correctly and the revert script must run immediately.

## File length check

```bash
./scripts/check-file-length.sh
```

Flags any `.jsx` or `.js` file under `src/` that exceeds 150 lines.

---

# 20. ANTI-PATTERNS (NEVER DO)

1. `current_user_org_id()` on `org_members` → infinite RLS recursion. Direct `user_id = auth.uid()` only on that table.
2. `bg-black/50` Tailwind class → always `style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}`
3. `max-height` CSS for expand/collapse → ref-based height measurement
4. Sequential `await` in loops → `.in('id', [...ids])` single query
5. `document.getElementById` in React → state variables
6. Rewrite files >150 lines in Claude Code → targeted edits, new component files
7. Constants defined in multiple files → `lib/constants.js` only
8. Hardcode hex in components → CSS variables only (except `team_color` inline from DB)
9. "CYO" publicly → "League Play"
10. "Boys 10U" format → "10U Boys" (number first, always)
11. Sky blue `#29b6f6` → cobalt is `#4a8fd4`. Non-negotiable.
12. Scrimmage as activity type → `is_scrimmage: boolean` on Game type
13. Per-slot duties as one row → 3 slots = 3 DB rows, each independently claimable
14. Futures Academy as a role → it's `roster_type` on `roster_members`
15. Asking Claude Code to rewrite a file and add one thing → targeted edit prompt only
16. **BottomSheet for multi-field forms** → FullScreenForm
17. **Invent CSS tokens** → forbidden
18. **Change CSS token values** → forbidden
19. **CSS % or `dvh` for overlay heights** → JS `visualViewport`
20. **Deploy without merging v2 → main** → nothing ships

---

# 21. FILE INVENTORY

## /mnt/project/ contents (April 25, 2026 snapshot)

```
CLAUDE.md                           14,698 bytes  (358 lines)   Operational rules + design tokens
EMBER_TENANCY_ARCHITECTURE_v3.md    65,738 bytes  (1562 lines)  Multi-tenant architecture v2
LH_BRAND_CONTENT_MODEL.md           19,006 bytes  (481 lines)   Brand voice + content rules
LH_OPS_SPEC.md                      27,276 bytes  (983 lines)   Operations spec + screen specs
LH_Spring2026_v2_1.xlsx             43,204 bytes               Financial workbook
MIGRATION_013_READY.sql              6,207 bytes  (155 lines)   Coach rates migration (shipped)
NEW_CHAT_STARTER_PROMPT.md           5,502 bytes  (107 lines)   Chat starter (superseded)
README.md                            1,336 bytes  (37 lines)    Repo scripts
SKYFIRE_BUILD_QUEUE_v2.md           17,937 bytes  (413 lines)   Build queue v2 (superseded)
SKYFIRE_FULL_AUDIT.md              389,523 bytes  (8515 lines)  Earlier comprehensive audit
SKYFIRE_LEVEL99_MASTER.md           43,075 bytes  (842 lines)   Master vision doc (superseded)
SKYFIRE_OPTION_A_AUDIT.md           37,172 bytes  (905 lines)   Option A audit
STATE_OF_AFFAIRS_L99_v3.md          37,428 bytes  (786 lines)   State of affairs v3 (superseded)
Spring_2026_SeasonSchedule042126.csv 24,927 bytes               229-row schedule from LeagueApps
gym-locations-v4.html               26,771 bytes  (273 lines)   Locations design reference
knight_logo_2048.png                56,801 bytes               Legacy Hoopers brand logo
legacy_hoopers_logo_2048.png        55,985 bytes               Legacy Hoopers wordmark logo
phoenix_logo_512.png                18,731 bytes               Ember brand logo
records-v14_2.html                 100,056 bytes  (1167 lines) BROADCAST MODE REFERENCE
season-calendar-v12.html            73,913 bytes  (935 lines)   Schedule design reference
```

**Totals:** 17,519 lines of markdown documentation. 4 logos. 3 HTML design references. 1 schedule CSV. 1 financial XLSX.

## Directory structure (eventual, Phase 0C target)

```
ember-app/                            (renamed from legacy-hoopers-app)
├── docs/                             (NEW — all markdown docs)
│   ├── EMBER_MASTER_INDEX.md         (this file)
│   ├── CLAUDE.md
│   └── archive/
│       └── (older audits archived)
├── public/
│   └── logos/                        (NEW — all PNG logos)
│       ├── ember-logo-2048.png       (renamed from phoenix_logo_2048.png)
│       ├── phoenix-logo-2048.png
│       ├── legacy-hoopers-logo-2048.png
│       └── knight-logo-2048.png
├── scripts/                          (existing)
│   ├── check-file-length.sh
│   └── rls-smoke.sh
├── src/                              (existing)
│   ├── components/
│   │   ├── admin/
│   │   ├── shared/
│   │   ├── schedule/
│   │   └── broadcast/                (NEW Wave 3)
│   ├── hooks/                        (29 hooks)
│   ├── lib/                          (16 lib files)
│   └── pages/                        (existing)
├── supabase/
│   ├── migrations/
│   └── rollbacks/
├── CLAUDE.md
├── README.md
├── package.json
└── vite.config.js
```

## Key /mnt/skills/public/ folders

- `frontend-design/SKILL.md` — design systems, component patterns
- `pdf-reading/SKILL.md` — PDF extraction
- `mcp-builder/SKILL.md` — MCP server creation
- Others as available


---

# 22. OPEN DECISIONS

These items have come up but Frank hasn't given final answer. Ask before assuming.

## Operational

1. **Apr 23 duplicate 11U Girls practice:** Which row to keep — WCC or Westchester County Center? Migration 021 deletes the other. (Likely RESOLVED since 021 shipped, verify.)
2. **Tournament rules entry method:** Structured form only / freeform notes only / hybrid (structured + misc_notes)? Recommended: hybrid. (DESIGN DEFAULT — verify.)
3. **Reminder channels for schedule changes:** Push + email (recommended) or include SMS?
4. **Emergency override channels:** Push + email + SMS bypassing quiet hours (recommended)?
5. **Hotel code distribution channels:** Push + email (recommended), SMS too, or email only?

## Product strategy

6. **Ember domain preference:** ember.app, emberhq.com, getember.co, useember.com, or other? Decide in Phase 0C.
7. **Legacy Hoopers domain post-rebrand:** Keep `app.legacyhoopers.org` pointing to Ember OR move to `legacyhoopers.ember.app` subdomain OR both in parallel?
8. **Ember corporation formation timing:** Before Phase 0C / during Fall 2026 / before St. Pat's onboarding / separate lawyer conversation?

## Tier enforcement

9. **LH feature access:** Confirmed Pro tier, everything enabled. Verify: even billing surface should be hidden (not just empty/zero) since pilot mode?

## Coach compensation

10. **1099 generation:** Auto-generate 1099 forms at year-end for coaches earning >$600, or manual?
11. **Per-coach pay scopes:** Migration 013 added `rates JSONB`. Example rates discussed: Darien 8U practice $30 / 9U practice $60 / game $50 / tournament day $100. Other coaches to be configured similarly. (NEEDS Frank to populate per-coach.)

## Launch

12. **11U Girls as first rollout cohort:** When app hits 95% parent satisfaction, 11U Girls families invited first. Confirm still the plan or different cohort?

## Y2b path decision (current open)

**Path A: Conservative.** Ship Y2b code layer now. Then break, gather feedback, decide on Wave 3 timing later.
**Path B: Aggressive.** Ship Y2b code layer + immediately start Wave 3 (Records page) this morning. End of day = production-grade Records page on `/records`.
**Path C: Big swing.** Skip Y2b code layer (MY TEAMS lights up automatically when Records page hooks ship). Go straight to Wave 3 in full broadcast mode. End of day = Records page live AND MY TEAMS live.

**Recommended:** Path C. Reasoning: Y2b code layer is a fragment of Wave 3's data needs. Building Wave 3 properly means writing `useTeamRecords` + the broadcast component library. Wave 2b's `ParentHomeTeamCard` becomes a special case of the broader system. Doing them together is faster and cleaner.

---

# 23. CONVERSATION HISTORY INDEX

These chats contain the build history. Each cataloged below by topic and major outputs.

## Foundation chats

**`99a8d773-81fe-47c3-8934-f23ec8185070` — Legacy APP Build (April 9-10, 2026)**
- Frank's onboarding to Claude Code. Linux/Crostini setup, Node.js, Claude Code v2.1.92 install, Git init, React+Vite+Tailwind scaffold, Supabase + Vercel via GitHub.
- Working three-role auth at `localhost:5174`. AuthContext race condition debugged. Infinite RLS recursion resolved by dropping admin policy.
- Skyfire vision crystallizes — multi-tenant SaaS, LH as Org #1, PWA now native 2027, team-level stats only, hybrid score entry, Stripe Connect Phase 7.
- Phase 0 multi-tenant foundation prep at session end.

**`5c315bae-623d-444b-ba62-1ca8041bc77d` — Skyfire specs and LeagueApps documentation**
- Major output: SKYFIRE_LEVEL99_MASTER.md drafted (843 lines). Comprehensive vision, competitive position, screen specs, file architecture, build prompt order.
- Stolen patterns from LeagueApps + SportsEngine + TeamSnap codified.

**`53f30d0b-6cd6-40bd-b5b3-87fde7dd7cb2` — Sports apps analysis for Skyfire tool development**
- LeagueApps screenshots audit batches (20+27 = 47 cataloged in this chat). Confirmed payment plan, form fields, waivers, staff, capacity rules.
- Three registration message states discovered, auto-reminder timing, roster visibility matrix, Hide Team Details toggle.
- "View Mobile Version" red banner = LeagueApps's admission of mobile failure.

**`202dda18-8c2e-4e83-b6aa-4c15a985372c` — Skyfire build**
- Phase 0B migration thinking (multi-tenant foundation 002, RLS policies, organization_settings architecture).
- Skyfire color palette locked: dark `#151525`, gold `#C9952E`, warm white `#F5F0E8`. `brand_colors` jsonb on organizations.
- Migration 006 for locations/opponents — St. Patrick's, WCC, Rippowam, Westchester County Center seeded.
- Round 3 bug fixes: change log timezone false positives, show cancelled toggle, locations dropdown, opponent dropdown.

## Audit chats

**`79bb49dd-9f38-48e7-99cd-6d1317243138` — PlayMetrics**
- 18 PlayMetrics screenshots cataloged. Two-layer messaging discovered. Per-player attendance, field surface metadata, multi-map directions.
- Patterns synthesis: 50 patterns across LeagueApps + PlayMetrics, tiered Tier 1/2/3.

**`84baf855-c882-4c81-8471-72018803cbd3` — GameChanger**
- 18 GameChanger screenshots cataloged. Live scoring play-by-play UX as gold standard. Box score Export PDF. Quarter-by-quarter fouls/timeouts.
- Final Tier 1 (Build Now) / Tier 2 (Build Next) / Tier 3 (Future) priority matrix.

**`3e010a2a-8293-4be3-8935-e60815af047a` — Design audit and HTML review for elite coaching platform**
- 33-check audit across 8 HTML files (4,865 lines): homepage-v6, records-v14, season-calendar-v12, registration-v8, academy-standards-v5, about-v1, coachkenny-v6, gym-locations-v4.
- Findings: zero files using Inter, 18 instances of restricted "CYO" venue label, 4 incorrect team colors, missing `prefers-reduced-motion` wrapping, missing 44px tap targets.
- All P0 + P1 fixes executed: scrubbed CYO venue names, corrected team colors, alt text fix, animations wrapped, 4 modified files output.

## Build chats

**`35c2eb4c-ad61-4e3b-8ca7-6c67b7212895` — Use This One**
- 6 commits to main: 2-A Roster Display (`77d591b`), Visual Richness (`218215f`), Premium Experience (`7d87e50`), Elite Polish (`2845542`), Functional Features (`abe3e10`), Next Level Foundation (`531e07a`).
- 30+ enhancements. Foundation reset. Login screen polish (border radius on phoenix logo, redundant "SKYFIRE" wordmark removed, favicon converted to phoenix). Foundation reset on disk verified.
- 2-B Schedule prompt drafted with full code blocks for DayStrip, CountdownBanner, FilterBar, EventCard, CompactCard, SchedulePage.

**`c4ecfe07-fa19-47bc-924d-aa5b0b49697b` — Skyfire Claude (April 19-20)**
- TourneyMachine has no API. Option C (Structured Paste) chosen. 5 briefing types defined: Team Briefing (auto), VIP Family Guide (auto), Day Recap (blocked on Quick Score), Coach Consolidated (already), Program Card (manual/Canva).
- Memory edits added for Skyfire competitor audit, push notifications deferred to Capacitor, coaching_assignments table requirement.

**`8501aa3b-07e7-463c-bc1d-a6364c7e95ef` — check (April 22-23)**
- Phase 0A security lockdown completed. 4 fixes verified.
- BUILD_QUEUE_v2.md drafted from filesystem reality. STATE_OF_AFFAIRS_L99_v3.md drafted (786 lines).
- LeagueApps website audit — 6 pages crawled, brand voice extracted, 10 ways to reach 95% bar identified.
- Migration plan refined: Tier 0 (T0-1 through T0-9) including feedback table + NEW badge + game_results table + tournaments + team_achievements.
- Decisions locked: Ember name, Phoenix logo, hybrid pricing, 3 tiers, 30+ specific decisions.

**`d09621ec-4dc6-4996-a4b7-f5b4880b8695` — Latest Build Chat (April 24-26)**
- Migrations 013-022 all shipped. 8 additive + 1 destructive + 1 RLS hardening + 1 column add.
- HOME_DESIGN_SPEC.md drafted (1199 lines). Complete design for all 3 home roles (Parent/Coach/Admin), all density states, dark mode, accessibility, analytics.
- RIDES_DESIGN_SPEC.md drafted (311 lines). Model C ride direction, 23 scenarios, waitlist, auto-confirm at T+12h.
- Migration 028 parent roster + player visibility shipped. Privacy line preserved.
- Tournament rules seeded for 2 tournaments.
- 1199-line spec for HOME_DESIGN, 311-line spec for RIDES_DESIGN both committed to /docs.

## Current chat (April 29) — comprehensive audit + index doc

This document is the deliverable.

---

# 24. GLOSSARY

| Term | Meaning |
|---|---|
| **Ember** | Multi-tenant SaaS platform (the product brand). Phoenix logo. |
| **Skyfire** | Internal codename. Being renamed to Ember in Phase 0C. |
| **Legacy Hoopers (LH)** | Org #1, the pilot customer. Knight logo, cobalt brand. |
| **Active Roster** | Full Roster Players (max 10), travels to all games |
| **Futures Academy** | Practice Players (separate track), activates on call-up if Active Roster < 8 |
| **AAU Circuit** | Zero Gravity tournament series, 5 regional tournaments per team |
| **League Play** | Regional league (formerly "CYO" — never use that term in UI) |
| **Cockpit mode** | Today's React app: Inter, light bg, white cards. For daily ops. |
| **Broadcast mode** | New layer: dark navy gradient, Barlow Condensed, broadcast quality. For Records, Team detail, Charlie's Season. |
| **Wave 3** | Current build target — broadcast component library + Records page |
| **L99** | Frank shorthand for "Level 99" — maximum depth and effort, no shortcuts |
| **The Director's Promise** | LH brand pillar — built by frustrated parent tired of "15-kid cash grab" |
| **The Car Ride Home** | LH brand principle — "I loved watching you play today" — nothing else |
| **5-Min Rule** | Practice arrival: wait in car until 5 min before start |
| **15-Min Rule** | Game arrival: in gym, dressed, shoes tied, 15 min before tip-off |
| **24-Hour Rule** | Parents wait 24h after game before messaging coaches about playing time |
| **Save & Message Team** | Skyfire-original pattern: create event AND notify parents in one action. NO competitor has this. |
| **Three Wow Moments** | Precision Nav Drop, Status Antidote, Frictionless Carpool Claim |
| **Westchester Parent Test** | The benchmark — Sarah-the-Westchester-parent must love every interaction |
| **MY TEAMS strip** | Parent home component showing teams + records + streak chips |
| **NEXT UP card** | Parent home component, most-immediate event with countdown |
| **THIS WEEK** | Parent home component showing upcoming 7 days |
| **CompactCard** | 46-line component, exists but not yet wired to density toggle |
| **Migration 013** | Coach rates JSONB — SHIPPED |
| **Migration 028** | Parent player visibility — SHIPPED, privacy line preserved |
| **Y2b** | Game results backfill — SHIPPED (data layer). Code layer pending. |
| **Phase 0A** | Security lockdown — SHIPPED |
| **Phase 0B** | Data stability migrations — SHIPPED |
| **Phase 0C** | Ember rebrand — DESIGNED, blocked on broadcast mode work |

---

# CLOSING NOTES

## When this doc gets stale

Update IMMEDIATELY after every shipped feature. Not at end of session. Not in a handoff doc. Immediately.

End every session with: "close out". I will draft the diff to this doc capturing what shipped + decisions made. Frank pastes into project knowledge. 90 seconds.

## The screenshot question

You've uploaded 200+ images across past chats. They're trapped in those chats. I cannot retrieve them in a new chat.

But: their value has been baked into this document. Every pattern stolen, every design decision, every component spec — all captured here. You should not need to re-upload them.

For NEW visual feedback on NEW builds: capture in next chat, then bake into the close-out diff.

## What carries forward (permanent)

- This file
- HTML design references in `/mnt/project/` (records, schedule, gym-locations)
- CLAUDE.md
- Supabase production database
- GitHub repo state
- Vercel deploy history

## What does NOT carry forward (mid-chat artifacts)

- Screenshots and PDFs uploaded mid-chat
- Verbal feedback ("MED is too tall")
- Decisions made by discussion ("Path B, not Path A")
- The reasoning chain behind why we built things a certain way

→ Capture in close-out, append to this doc, never lose state again.

## Hard gate for new chats

Paste this as your first message in any new chat:

```
Read /mnt/project/EMBER_MASTER_INDEX.md and /mnt/project/CLAUDE.md before responding.

After reading, state in this exact format:
1. The current wave (Wave 3 — broadcast component library + Records page)
2. What shipped last (Y2b game_results backfill, 26 rows verified)
3. The single next action queued (Y2b code layer OR Wave 3 component library)
4. Any open decisions blocking us
5. Any blockers in environment (Docker, RAM, etc.)

Do not re-ask any of the 30+ locked decisions inside the doc.
Do not re-execute any feature documented as shipped.
Then ask me what we're working on today.
```

---

# 25. NEW CHAT STARTER (paste as first message in any new chat)

```
Read `/mnt/project/EMBER_MASTER_INDEX.md` and `/mnt/project/CLAUDE.md` end-to-end before responding. These are the canonical state for the build. They supersede any older docs in project knowledge.

After reading, confirm in this exact format:

```
## Ground truth confirmed

**Current wave:** Wave 3a — Broadcast component library foundation

**What shipped last:**
- Phase 0A security lockdown (4 fixes, April 22-23)
- Phase 0B data stability (Migrations 013-022 + 028, April 23-26)
- Y2b game_results backfill (26 rows verified against records-v14_2.html)
- HOME_DESIGN_SPEC.md (1199 lines) committed to /docs

**Single next action:** Write the Wave 3a Claude Code prompt — broadcast component library foundation. Sets up src/components/broadcast/*, loads Barlow Condensed, adds navy-gradient CSS tokens, builds 5 highest-leverage components (Hero header, Team identity card, Stat hero bar, Tournament card, Game log row) on a /records-preview route with real data from game_results.

**Open decisions blocking us:** None for Wave 3a. Path C confirmed. Sequencing A confirmed (Communications as Wave 4). Apr 23 duplicate practice resolved via Migration 021.

**Top risk this session:** None for foundation work. Components must visually match records-v14_2.html line-for-line — that's the verification gate.

**Phase 0A status:** COMPLETE
**Phase 0B status:** COMPLETE
**Phase 0C status:** DESIGNED, queued for Wave 12 (after broadcast surface area + Communications)

**Environment constraints:** Docker not viable on 4GB Chromebook. Migrations via Supabase SQL Editor + supabase migration repair. Dev server http://100.115.92.199:5173/ Chromebook browser only. Phone testing via production deploy.

**The business moat (do not lose this):** Communication is the moat. Frank spends 4-8 hrs/week writing HTML by hand. Communications Foundation = Wave 4 = top-3 priority feature, not Phase 3 admin feature.
```

After confirming, ask me one question only: "Ready to write the Wave 3a prompt?" Do not start writing the prompt without that confirmation.

## Hard rules for this session

1. Do not re-ask any of the 49 locked decisions in EMBER_MASTER_INDEX.md.
2. Do not re-execute any feature documented as shipped.
3. Targeted str_replace edits only. No full file rewrites. 150-line file cap.
4. SQL via Supabase SQL Editor, never via Claude Code.
5. CSS variables only. Brand cobalt is `#4a8fd4`, never sky blue.
6. Number-first naming ("10U Black" not "Boys 10U Black"). Sort oldest to youngest.
7. Never "CYO" in UI. Always "League Play."
8. Answer first, then detail. No preamble. No em dashes. No "leverage/utilize/seamless/robust/streamline."
9. Deploy chain: explicit `git add` per file (not `-A`), then `git commit -m "msg" && git push origin v2 && git checkout main && git merge v2 && git push origin main && git checkout v2`. Persistent untracked items live in `.gitignore` so the discipline is enforced by the file, not by hand. Updated April 30, 2026 in Wave 2 IA Map v1.1 amendment per Wave 3d session pattern.
10. Update EMBER_MASTER_INDEX.md immediately after every shipped feature, not at end of session.
```

---

## END OF DOCUMENT

