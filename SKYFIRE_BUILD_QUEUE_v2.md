# SKYFIRE / EMBER — BUILD QUEUE v2
## The Evidence-Based Replacement for the April 19 Version
**Written:** April 23, 2026
**Verified against filesystem:** April 23, 2026
**Replaces:** SKYFIRE_BUILD_QUEUE.md dated April 19, 2026 (15+ shipped features were missing)

---


## 🐛 Open Bugs & 95% UX Audit — Logged April 23, 2026

### P0 Bugs (data accuracy on Next Up card)

- 🐛 **BUG-001** — Admin home "Next Up" card data is stale/broken
  - **Observed:** Admin home at 4:19 PM Apr 23. Card shows "Practice · 10U Black" with no date/time/location, just a dash.
  - **Expected:** Full date, time, location like the parent view shows.
  - **Evidence:** Screenshot IMG_9880.png Apr 23 2026.
  - **Hypothesis:** Frontend rendering bug in AdminHomePage.jsx NextEventCard, null-handling issue, OR stale row from duplicate 11U Girls practice (Migration 022 deletes). Validate after 022 ships.
  - **Fix phase:** Phase 1 after Migration 022.

- 🐛 **BUG-002** — Parent card shows "2/2 volunteers filled" when state is 1 claimed + 1 open
  - **Observed:** Card reads "✓ 2/2 volunteers filled". Detail shows 1 Open + 1 claimed by fsamaritano@gmail.com. True count is 1/2.
  - **Severity:** P0. Misleads parents into thinking coverage is complete.
  - **Evidence:** Screenshots IMG_9882.png (card) + IMG_9881.png (detail).
  - **Hypothesis:** useEventDutyCounts.js counts incorrectly. Inspect aggregation.
  - **Fix phase:** Phase 1. File: src/hooks/useEventDutyCounts.js.

- 🐛 **BUG-003** — Parent card ride summary undercounts
  - **Observed:** Card reads "1 seat offered · 1 ride needed". Detail shows Frank offering 1 seat AND Frank needing ride for 2.
  - **Severity:** P0. Card should show 2 rides needed.
  - **Evidence:** IMG_9882.png + IMG_9881.png.
  - **Hypothesis:** useEventRideCounts.js uses COUNT(*) instead of SUM(seats_requested) for riders.
  - **Fix phase:** Phase 1. File: src/hooks/useEventRideCounts.js.

- 🐛 **BUG-004** — Same user can offer AND request ride for same event
  - **Observed:** Frank Samaritano appears in both Drivers Offering Rides and Riders Needing a Ride on same event.
  - **Severity:** P1. Data quality + UX confusion.
  - **Fix phase:** Phase 1. Add DB CHECK or frontend guard in RideFormOverlay.jsx.

### P1 UX Gaps on Next Up card (parent)

- 📐 **UX-001** — Add inline actionability CTAs (Claim volunteer, Offer/Request ride) when state incomplete
- 📐 **UX-002** — Countdown visibility scales with urgency (<1hr red, 1-2hr orange, 2-6hr green)
- 📐 **UX-003** — Player name prefix for multi-child parents ("Charlie · 11U Girls · Practice")
- 📐 **UX-004** — Reorder: RSVP Notes above RSVP counts (notes more actionable)
- 📐 **UX-005** — Calendar icon on card top-right (1-tap add from home)
- 📐 **UX-006** — Collapse Arrive-Early + Notes into single "Pre-event info" section

### P1 UX Gaps on Next Up card (coach)

- 📐 **UX-007** — Staff RSVP row (Coach Kenny · Going, Coach Darien · No RSVP)
- 📐 **UX-008** — RSVP response indicator ("10 of 12 RSVP'd") not just breakdown of responses
- 📐 **UX-009** — "Start Check-In" CTA in 60min pre-event window
- 📐 **UX-010** — Practice plan / run-of-show link on card

### P1 UX Gaps on Next Up card (admin)

- 📐 **UX-011** — Admin card needs full redesign: multi-event dashboard, not single-event focus
- 📐 **UX-012** — Operational alerts strip ("1 practice needs snack volunteer, 1 event location unconfirmed")
- 📐 **UX-013** — Pending achievement confirmation queue indicator (post Migration 018 UI)
- 📐 **UX-014** — Recent notification audit trail indicator (post Migration 019 UI)

### Validation needed

- ❓ **VAL-001** — RSVP count accuracy on Apr 23 11U Girls practice card (6+4+3=13 vs ~10-12 roster). Check for test data bleed or call-ups.

### BUG-005 (added Apr 24)

- 🐛 **BUG-005** — Parent can create duplicate ride offers on same event
  - **Observed:** Click Offer Ride, submit, click again creates second independent row
  - **Severity:** P1 — data quality + UX confusion
  - **Root cause:** No UNIQUE constraint on event_rides, no frontend edit-mode guard
  - **Fix:** Migration 025 adds constraint + RideFormOverlay checks existing offer state
  - **Fix phase:** Phase 1 (see RIDES_DESIGN_SPEC.md Section 2.1)

### P0 RLS Privacy Holes (added Apr 24)

- 🔴 **HOLE-001** — `guardians` table: no RLS, 120 rows of PII exposed
- 🔴 **HOLE-002** — `player_guardians` table: no RLS, relationships exposed
- 🔴 **HOLE-003** — `players` table: no RLS, 63 child records exposed
- 🔴 **HOLE-004** — `roster_members` table: no RLS, 63 rows + payment data exposed
- 🟠 **HOLE-005** — `tournament_pool_teams` table: no RLS
- **All 5 fixed in:** Migration 022 (queued, designed, not yet executed)

---

## 📘 DESIGN SPECIFICATIONS (Apr 24, 2026)

Two comprehensive spec documents live alongside this build queue. BUILD_QUEUE is tactical sprint planning; specs are the source of truth for implementation.

### HOME_DESIGN_SPEC.md (1199 lines)
Complete design for all 3 role home pages:
- Parent home: 13 sections (Emergency, Action Zone, Live Now, Next Up, My Teams, Recognition, Coach Message, This Week, Payment, Tournament Banner, FAB)
- Coach home: 7 sections (Coaching Today, Team Pulse, Action Queue, Messaging, Upcoming Prep, Quick Actions, FAB)
- Admin home: 9 sections (Attention Required, KPI Cards, Today's Program, Pending Queues, Program Health, Activity Feed, Quick Actions, FAB)
- Density toggle specification (Minimal / Medium / Maximum per card)
- 22+ parent scenarios covered
- Dark mode + accessibility + analytics instrumented
- Multi-org architecture baked in

### RIDES_DESIGN_SPEC.md (311 lines)
Complete design for ride coordination across all 3 roles:
- Model C ride direction (round-trip default, one-way opt-in)
- Separate arrival + return coverage metrics
- Offers + claims as separate entities
- 23 scenarios (SC-1 through SC-23) with explicit handling
- Waitlist mechanic for overflow
- Auto-confirm at T+12h of driver silence
- Per-role UX (parent status-first, coach dashboard, admin audit)
- Migration 025 scope + RLS design

---

## 🔜 PHASE 1 SPRINT PLAN (Apr 24, 2026)

### Sprint A — Data correctness (prerequisite)
Migrations 022-024 + BUG-001 through BUG-005 fixes

- **Migration 022:** Close 5 P0 RLS holes + add left_at to roster_members
- **Migration 023:** Attendance trending views on roster_members (per Migration 023 section in STATE_OF_AFFAIRS)
- **Migration 024:** Data corrections bundle (destructive) — tournament times, duplicate practice, test data
- **Bug fixes:** 001-005 per root cause analyses

### Sprint B — Parent home Phase 1
Reference: HOME_DESIGN_SPEC.md Section 1

- MY TEAMS upgrade to dynamic data (per D2 decision)
- ACTION ZONE implementation
- Density toggle wiring (reads Migration 016 user_preferences.card_density)
- Relative date language
- Empty state design

### Sprint C — Parent home Phase 2
Reference: HOME_DESIGN_SPEC.md Section 1.1.3 onward

- LIVE NOW card
- RECOGNITION card (ties to Migration 018 team_achievements UI)
- Tournament weekend banner
- Emergency alert banner
- Coach message block

### Sprint D — Coach home
Reference: HOME_DESIGN_SPEC.md Section 2

- New CoachHomePage.jsx file
- All coach-specific sections
- Team Pulse wiring (blocked on Migration 023)

### Sprint E — Admin home redesign
Reference: HOME_DESIGN_SPEC.md Section 3

- Complete AdminHomePage rewrite
- Ops dashboard with KPI cards
- Pending queues
- Activity feed
- Attention Required banner

### Sprint F — Cross-role polish
Reference: HOME_DESIGN_SPEC.md Section 4

- Dark mode complete implementation (Q10)
- Accessibility full audit (Q1 all)
- Analytics instrumentation (Q9)
- Performance optimization
- Multi-org scaffolding (Q3)

### Sprint G — Rides redesign
Reference: RIDES_DESIGN_SPEC.md

- Migration 025 schema redesign
- Offer + claim UI for parents
- Coach rides dashboard
- Admin rides widget + audit
- Waitlist + auto-confirm infrastructure

### Sprint H — Advanced features (Phase 2)
Deferred per specs: carpool chat, running-late, geography matching, trust signals, personalization, section reordering

---

## 🎯 REMAINING PHASE 0B / 0C MIGRATIONS

- ✅ **Migration 022** — RLS privacy lockdown + roster_members left_at (SHIPPED 2026-04-24)
  - **File:** supabase/migrations/022_rls_privacy_lockdown_plus_roster_left_at.sql (149 lines)
  - **Rollback:** supabase/rollbacks/022_rls_privacy_lockdown_plus_roster_left_at_REVERT.sql (63 lines)
  - **Commits:** f52f9a5 (v1, recursion bug) -> 44de53f (v2, SECURITY DEFINER helpers fix)
  - **Closed 5 P0 holes:** guardians, players, player_guardians, roster_members, tournament_pool_teams
  - **23 policies, 4 SECURITY DEFINER helper functions** (user_has_role_in_org, current_user_guardian_id, current_user_player_ids, current_user_staff_team_ids)
  - **Added:** roster_members.left_at column, dates_coherent CHECK, 3 indexes, roster_members_public VIEW
  - **Live verified:** Frank's parent account sees 1 own guardian, 2 own players, 2 own rosters via RLS
  - **Lesson learned:** L99 anti-pattern Part 9 confirmed: never inline subquery user_roles in RLS policies. Always use SECURITY DEFINER helpers. Initial v1 caused infinite recursion that broke parent app, fixed in v2 within same session
- ✅ **Migration 023** — events.season_id + 4 attendance/RSVP trending VIEWs (SHIPPED 2026-04-24)
  - **File:** supabase/migrations/023_attendance_trending_views.sql (378 lines)
  - **Rollback:** supabase/rollbacks/023_attendance_trending_views_REVERT.sql (22 lines)
  - **Commit:** 2aa30cc
  - **Schema add:** events.season_id UUID FK -> seasons(id) ON DELETE SET NULL
  - **Backfill:** 145/145 events linked via date overlap (zero orphans)
  - **Indexes:** idx_events_season_team, idx_events_team_start
  - **4 VIEWs (all security_invoker=true so Migration 022 RLS cascades):**
    - team_attendance_30d - team check-in % rolling 30d + prior 30d trend + per-event-type breakdown
    - team_rsvp_30d - team RSVP rates rolling 30d + prior 30d trend
    - player_attendance_season - per-player check-in % current active season
    - player_rsvp_season - per-player RSVP rates current active season
  - **Locked design decisions (Q1-Q10 per L99 audit):**
    - Hybrid attendance: RSVP "not_going" excuses, no-shows count
    - Always show denominator (confidence indicator)
    - Trend baseline: last 30d vs prior 30d
    - Per-event-type breakdown (practice/game/tournament)
    - Date-windowed roster correctly via Migration 022 indexes
    - Cancelled events excluded from denominator
    - Plain VIEWs Phase 1, materialize in Phase 2 if needed
    - Rich denormalized data (compute once)
  - **Production validation:** All 5 teams visible. Both Frank's children visible. Math correct. Real attendance % near 0 because check-in feature not yet rolled out to parents (RSVPs are manual test inputs only)
  - **Future Phase 2:** materialize views with scheduled REFRESH; add admin-configurable excused absence logic; tournament weekend rollup view
- ✅ **Migration 024** — Spring 2026 schedule rebuild + location FK + opponents cleanup (SHIPPED 2026-04-24)
  - **Files:** supabase/migrations/024_schedule_rebuild.sql (stub) + supabase/rollbacks/024_schedule_rebuild_REVERT.sql (full executable revert)
  - **Commit:** 428e1b4
  - **Method:** Executed in 4 chunks (A/B/C/D) with per-chunk verification per L99 standard
  - **Schema additions:**
    - location_rooms table (11 rooms: Wades Gym, Trustees Gym, McConnell, Fenstermacher, Court 1/2s for Leffell + East Coast + Maria Regina, Sarah Lawrence Campbell, House of Sports Court 2)
    - events.location_id FK -> locations(id) ON DELETE SET NULL
    - events.location_room_id FK -> location_rooms(id) ON DELETE SET NULL
    - events.publish_status text NOT NULL DEFAULT 'published' CHECK in ('draft','published')
    - events.arrival_time time
    - locations.latitude decimal(9,6), longitude decimal(9,6), google_maps_url, parking_notes, entry_instructions
  - **Data corrections:**
    - 15 location naming updates (St. Patricks->St. Patrick's, Harvey->The Harvey, Hackley->The Hackley, WCC drop suffix, etc.)
    - All location addresses upgraded to full city/state/zip
    - lat/lng populated on 3 home practice venues (Rippowam, WCC, St. Patrick's)
    - Google Maps URLs on 10 venues from gym-locations-v4.html
    - DELETE Happy Gym (id 52c376bd) - test location, no event references
    - DELETE Westchester County Center (id 039de263) - test venue
    - DELETE Test Opponent + Armonk Moms - test opponents
    - INSERT OLPH 5A opponent for 11U Girls Apr 10 scrimmage
    - seasons.end_date Jun 15 -> Jun 14 (Hoop Festival finale)
  - **Destructive wipe (test data confirmed):**
    - DELETE all 145 Spring 2026 events
    - Cascades destroyed: 54 RSVPs, 26 rides, 112 duties (12 claimed), 5 checkins, 2 comments
  - **Schedule reseed (140 events from canonical CSV + Skills Lab generation):**
    - 53 Tue/Wed practices (8U/9U/10U Blue Tuesday, 10U Black/11U Girls Wednesday)
    - 34 tournament events: Chase for the Chain (13), NY Metro Showdown (12), Rumble for the Ring CT (3), Girls Nationals MA (1), Boys Nationals MA (1), Pre-Summer Hoops Jam Bergen NJ (1), Hoop Festival (3)
    - 16 league games (all opponent_id populated, all "Active Roster Only")
    - 1 scrimmage (11U Girls vs OLPH 5A Apr 10 at OLPH/St Catharine-Pelham)
    - 36 Skills Labs (12 Mondays Mar 23-Jun 8 x 3 teams: 11U Girls, 10U Black, 10U Blue, 7:35-8:35 PM St. Patrick's)
  - **All 140 events:** publish_status='draft' for admin publish workflow
  - **Production verification:**
    - events: 89 practice + 34 tournament + 17 game = 140 ✓
    - Per team: 11U Girls 33, 10U Black 34, 10U Blue 31, 9U Boys 19, 8U Boys 23
    - 140/140 location_id linked, 56 sub-room linked, 17/17 games with opponent_id
    - 7 distinct tournament_name groups with proper Zero Gravity titles
  - **Production team IDs verified (memory was wrong, corrected):**
    - 11U Girls: 507d7a4e | 10U Black: 6abb0447 | 10U Blue: 13abc98d | 9U Boys: 0366db32 | 8U Boys: e6dde2e0
- 📋 **Migration 025** — Rides schema redesign (see RIDES_DESIGN_SPEC.md)


---



# HOW THIS DOCUMENT IS MAINTAINED

**RULE:** This document is updated IMMEDIATELY when a feature ships — not at end of session, not in a handoff doc, not next week. Immediately.

**RULE:** Every "SHIPPED" claim cites evidence source (filename, migration number, git commit hash, or verification screenshot).

**RULE:** Never move a feature to "SHIPPED" based on memory. Verify via filesystem grep or database query first.

If these rules aren't followed, the drift problem returns and the next chat misses work.

---

# STATUS KEY

- ✅ **SHIPPED** — verified in production, evidence cited
- 🚧 **IN PROGRESS** — being worked on currently
- 📋 **DESIGNED** — architecture decided, not built
- 🔜 **QUEUED** — next to work on
- 📝 **BACKLOG** — known need, not urgent

---

# PHASE 0A: SECURITY LOCKDOWN ✅ COMPLETE (April 22-23, 2026)

## Fixes shipped

- ✅ **0A-1:** EventDetailHeader.jsx Edit/Delete buttons gated behind `{isStaff && ...}`
  - **Evidence:** Component file lines 25-34 after edit, git commit "Phase 0A-1: gate Edit/Delete buttons behind isStaff (P0 security fix)"
  - **Verified:** Parent no longer sees buttons, admin sees all three (Check-in + Edit + Delete)
- ✅ **0A-2:** SchedulePage.jsx FAB (+) button gated behind `{isStaff(role) && ...}`
  - **Evidence:** Imports `isStaff` from lib/permissions added, `role` destructured from useAuth, FAB wrapped
  - **Verified:** Parent no longer sees FAB, admin sees and wizard opens correctly
- ✅ **0A-3:** RosterSection.jsx CopyRosterButton gated behind `{isStaff(role) && ...}`
  - **Evidence:** Imports added, role destructured, button wrapped on line 27
  - **Verified:** Parent no longer sees Copy button, admin sees (though clipboard has known "Copy Failed" bug on HTTP)
- ✅ **0A-4:** RsvpPlayerRow.jsx guard verified working (no edit needed)
  - **Evidence:** Lines 17-22 correctly define `readOnly = role === 'parent' && !isMyChild`, lines 55-58 render status text when readOnly, lines 59-83 render RSVP buttons otherwise
  - **Verified:** Parent sees RSVP buttons only for Milo and Charlie, read-only status text for all other players

## Security posture change

| Action | Before Phase 0A | After Phase 0A |
|---|---|---|
| Edit any event | ❌ Parent could (P0 hole) | ✅ Admin/coach only |
| Delete any event | ❌ Parent could (P0 hole) | ✅ Admin/coach only |
| Create new events | ❌ Parent could (P0 hole) | ✅ Admin/coach only |
| Bulk-export guardian contacts | ❌ Parent could (P0 privacy hole) | ✅ Admin/coach only |
| RSVP other families' kids | ✅ Already blocked | ✅ Confirmed blocked |

---

# PHASE 0B: DATA STABILITY 🔜 NEXT

## Migrations to ship (8 additive + 1 destructive, 14 SQL files total queued)

### Schema additions (non-destructive, safe to ship together)

- ✅ **Migration 013** — coaching_assignments.rates JSONB column
  - **Shipped:** April 23, 2026 (commit 9eb1f9c on main)
  - **Evidence:** supabase/migrations/013_coaching_assignments_rates.sql, supabase migration list shows Local+Remote sync for 013, verification returned rates column, CHECK constraint, get_coach_rate_cents function, GIN index
  - **Scope delivered:** rates JSONB + object-shape CHECK + helper function + GIN index. Value validation deferred to app layer.
  - **Existing column pay_per_session_cents stays** as fallback default
- ✅ **Migration 014** — game_results publishing workflow + RLS parent/staff split
  - **Shipped:** April 23, 2026 (commit e563b65 on main)
  - **Evidence:** supabase/migrations/014_game_results_publishing_workflow.sql, supabase migration list shows Local+Remote sync for 014, verification returned 3 new columns (published_at timestamptz, published_by uuid FK auth.users, private_notes text), idx_game_results_published_at partial index, 3 policies replaced old 2 (game_results_select_parent restricts to published_at IS NOT NULL + guardian chain, game_results_select_staff sees all in org, game_results_write_staff admin/coach only)
  - **Scope delivered:** publish columns + partial index + RLS swap. Rollback saved at supabase/rollbacks/014_game_results_publishing_workflow_REVERT.sql.
  - **Security fix:** Closed silent hole where parents could read draft game_results once drafts existed. Now enforced at RLS layer, defense-in-depth vs frontend filters.
  - **Coach_highlight** reserved as parent-visible (existing column), private_notes is new coach-only field.
- ✅ **Migration 015** — tournaments.rules JSONB column
  - **Shipped:** April 23, 2026 (commit df243cb on main)
  - **Evidence:** supabase/migrations/015_tournaments_rules_extension.sql, supabase migration list shows Local+Remote sync for 015, verification returned rules column (jsonb NOT NULL default '{}'), tournaments_rules_is_object CHECK constraint (object-shape), idx_tournaments_rules_gin GIN index
  - **Schema shipped:** hybrid structured (summary, source_url, game_format, overtime, timeouts, fouls, defense, mercy, roster) + division_overrides per-grade + misc_notes freeform. Value validation deferred to app layer via TypeScript + Zod in tournamentRules.ts (Phase 1+).
  - **Reference sources reviewed:** CYO Westchester/Putnam Spring League Rules 2025, Zero Gravity Basketball rules page
  - **Next step:** Seed rules JSONB on existing Nationals + CYO tournaments via UPDATE statements (queued separately)
- ✅ **Migration 016** — user_preferences NEW TABLE + RLS + auto-create trigger + user_roles.organization_id NOT NULL
  - **Shipped:** April 23, 2026 (commit 211f38a on main)
  - **Evidence:** supabase/migrations/016_user_preferences.sql, rollback at supabase/rollbacks/016_user_preferences_REVERT.sql, supabase migration list shows Local+Remote sync for 016. All 7 verification queries passed: 11 columns with correct types/defaults, user_roles.organization_id NOT NULL, 5 CHECK constraints (theme_enum + card_density_valid + 3 is_object), 3 indexes (composite PK + GIN on notification_preferences + btree on org_id), 2 triggers (updated_at + auto-create), 4 RLS policies (select_own, insert_own, update_own, delete_blocked), 4 backfilled rows (all existing user_roles).
  - **Scope delivered:** Per-user-per-org preferences with hybrid structured + JSONB schema. Hot-path columns (theme, timezone, locale) + narrow JSONB (card_density, notification_preferences, quiet_hours, role_preferences). Auto-create trigger on user_roles INSERT via SECURITY DEFINER function with search_path hardening. Service role bypasses RLS.
  - **Design decisions locked:** Per-user-per-org (not just per-user). Admin has no read access to user prefs (privacy default; service role for support). DELETE blocked for everyone (preferences reset via UPDATE). Coach/admin role_preferences scoped under role-named keys.
- ✅ **Migration 017** — organization_settings admin-configurable extensions (6 JSONB columns)
  - **Shipped:** April 23, 2026 (commit 92551d4 on main)
  - **Evidence:** supabase/migrations/017_organization_settings_admin_configurable.sql, supabase migration list shows Local+Remote sync for 017. All 3 verification queries passed: 6 columns with correct jsonb NOT NULL types and production defaults, 6 CHECK constraints (object-shape), Legacy Hoopers row has all 6 columns populated.
  - **Scope delivered:** reminder_cadence (4-72-168hr cadences per event type), rsvp_deadlines (2hr practice to 168hr tournament), note_rules (4hr cooldown + admin override + role visibility), nudge_rules (2hr call-up window + serial invites + 24hr RSVP nag), roster_rules (8/10/15 min/target/max + 3-practice Academy eligibility), notification_channels (per-category push/email/sms defaults + emergency bypass).
  - **Design decisions locked:** Tournament reminders at 7 days out (168hr). Practice RSVPs close 2hr before (allows last-minute). Call-up invites are serial (1 at a time). Emergency notifications bypass quiet hours. User preferences override org defaults at read time.
- ✅ **Migration 018** — team_achievements NEW TABLE (parent/coach/admin L99 scope)
  - **Shipped:** April 23, 2026 (commit cc14cc2 on main)
  - **Evidence:** supabase/migrations/018_team_achievements.sql, rollback at supabase/rollbacks/018_team_achievements_REVERT.sql, supabase migration list shows Local+Remote sync for 018. All 7 verification queries passed: 22 columns with correct types, 4 CHECK constraints (type_enum with 6 types, custom_title_required, rank_range 1-100, confirmed_pair), 5 custom indexes + PK (team_id+earned_at DESC, tournament_id, season_id, org_season_type, pending_queue partial index), updated_at trigger, 4 RLS policies (parent SELECT confirmed-only, staff SELECT all, coach INSERT pending-only, admin full), 6 FK constraints (4 public + 2 to auth.users confirmed via pg_constraint), table empty.
  - **Scope delivered:** 6 achievement types (champions, nationals_qualified, finalists, semifinalists, undefeated_season, custom). Context fields for shareable moments (rank, opponent_team_name, event_location). Visual customization (badge_emoji, badge_color, photo_url). Pending/confirmation workflow (is_pending_confirmation + confirmed_at + confirmed_by). Audit (created_at, created_by, updated_at). Soft-delete (archived_at). Dual season+tournament linkage (both nullable FKs).
  - **L99 design decisions locked:** Coaches INSERT only with is_pending_confirmation=true (RLS-enforced). Admin pending-review queue has dedicated partial index. Photos are the primary emotional artifact (photo_url field). No uniqueness constraint (teams can earn same type multiple times). Player-level awards deferred to separate player_awards table (Phase 2+).
- ✅ **Migration 019** — event_notifications (renamed from notifications_queue) + 7 columns + 6 indexes + backward-compat VIEW
  - **Shipped:** April 23, 2026 (commit fa85b42 on main)
  - **Scope change from plan:** Pre-verification revealed notifications_queue already existed (Migration 005). Correct path was rename + add columns, not new table. notifications_queue VIEW preserved for backward-compat until frontend refs update (TODO: migrate src/ references, then drop view in future migration).
  - **Evidence:** supabase/migrations/019_event_notifications_audit_trail.sql, rollback at supabase/rollbacks/019_event_notifications_audit_trail_REVERT.sql, supabase migration list shows Local+Remote sync for 019. Verification confirmed: table renamed to event_notifications (BASE TABLE), notifications_queue is now VIEW, 7 new columns (channels, delivered_at, failed_at, failure_reason, read_at, triggered_by_user_id, change_summary) with correct types/defaults, 6 new indexes, backward-compat view returns 0 rows (empty table).
  - **Scope delivered:** channels JSONB array + delivery tracking (delivered_at, failed_at + failure_reason paired via CHECK, read_at) + audit (triggered_by_user_id FK to auth.users) + edit-change diff (change_summary JSONB). Hot-path indexes on recipient, status+time, triggered_by, event, org+status, GIN on channels.
  - **Followed immediately by Migration 020** to reconcile enum conflicts with Migration 005 legacy constraints.
- 📋 **Migration 019 cleanup (future)** — drop notifications_queue VIEW once frontend references migrate to event_notifications
  - TODO: grep src/ for notifications_queue, migrate to event_notifications, then ship cleanup migration
- ✅ **Migration 020** — event_notifications enum reconciliation (renumbered from planned attendance VIEWS migration)
  - **Shipped:** April 23, 2026 (commit d16c6c3 on main)
  - **Why this exists:** Migration 019's rename of notifications_queue to event_notifications left the 3 Migration-005-era CHECK constraints (notifications_queue_status_check, _notification_type_check, _recipient_type_check) attached to the renamed table with legacy enum sets that conflict with the new status lifecycle and Phase 2 categories. Migration 020 drops all 4 legacy+intermediate constraints and creates 3 correctly-named, correctly-scoped replacements.
  - **Evidence:** supabase/migrations/020_event_notifications_enum_reconciliation.sql, supabase migration list shows Local+Remote sync for 020. Verification confirmed: 6 CHECK constraints all named event_notifications_* (change_summary_is_object, channels_is_array, failure_pair, notification_type_enum with 13 types, recipient_type_enum with 5 types, status_enum with 7 lifecycle states). Zero legacy notifications_queue_* constraints remain.
  - **Final enums:** status {queued, sending, sent, delivered, failed, read, cancelled}. notification_type {schedule_change, rsvp_reminder, volunteer_opportunity, ride_request, briefing, score_published, announcement, chat_mention, reminder_24h, reminder_gameday, cancellation, rsvp_nudge, custom}. recipient_type {team, player, guardian, user, org}.
- 📋 **Migration 021** — attendance trending VIEWS (renumbered from original 020)
  - No schema change, just CREATE VIEW
  - Computes player attendance rate from check_ins
  - Computes trend (current rate vs 4 weeks prior) for ↑/↓ arrows

### Data corrections (DESTRUCTIVE — defer Migration 022 until verification)

- 📋 **Migration 022** — data corrections bundle (renumbered from original 021)
  - UPDATE tournaments SET start_at/end_at (revert midnight-midnight to 08:00-20:00 Eastern)
  - DELETE from locations WHERE name='Happy Gym' (test data)
  - DELETE duplicate Apr 23 11U Girls practice (Frank to specify which row)
  - UPDATE team_achievements (remove 8U Nationals, add Summer Hoops Jam Bergen County)
  - UPDATE tournaments SET name (revert "2026 Zero Gravity Girls National Finals" to canonical)
  - Document team color v14 palette (production state, no migration needed if colors already correct)

## Workflow for each migration (Supabase SQL Editor pattern)

1. SQL authored in chat, saved to `supabase/migrations/NNN_title.sql` locally
2. Commit to git: `git add supabase/migrations/NNN_*.sql && git commit && git push origin v2`
3. Paste SQL into Supabase SQL Editor
4. Run migration, verify no errors
5. Run `SELECT 1` or simple verification query
6. Record in history: `npx supabase migration repair --status applied NNN`
7. Merge to main: `git checkout main && git merge v2 && git push origin main && git checkout v2`

Docker-based `db push` / `db pull` not viable on Frank's 4GB Chromebook.

---

# PHASE 0C: EMBER REBRAND 📋 DESIGNED

Blocked on 013-020 shipping. Estimated: 1-2 sessions.

## Scope

- Find/replace `Skyfire` → `Ember` in all UI strings, package.json, README.md
- CSS namespace rename: `--em-*` → `--em-*` throughout codebase
- File rename: `skyfire_phoenix.webp` retired, `phoenix_logo_2048.png` becomes canonical Ember logo
- Possibly rename: `src/context/SkyfireContext` if exists (verify)
- GitHub repo rename: `skyfire-app` → `ember-app` (redirects auto-maintained)
- Vercel project rename
- Seed `ember_platform` registry table (singleton, platform-level metadata)
- Update organizations.branding JSONB:
  ```jsonb
  {
    "primary_color": "#4a8fd4",
    "org_name_display": "Legacy Hoopers",
    "tagline": "Grow Your Game. Leave Your Legacy.",
    "website": "https://legacyhoopers.org",
    "logo_url": "/logos/knight-logo-2048.png"
  }
  ```
- App header: displays `org.branding.org_name_display` primary + small "Powered by Ember" footer
- Login screen: Ember branding loads first, org branding loads after sign-in
- Document.title format: "{OrgName} · Ember"
- Domain decision (Frank): ember.app vs emberhq.com vs getember.co
- CLAUDE.md addendum: new governance rules for Ember platform work

---

# PHASE 1: PARENT 95% 📋 DESIGNED (6-7 sessions estimated)

Blocked on 0B + 0C. Priority ordering:

## Priority 1 — Honest rendering (replaces fake data)

- 📋 **SeasonProgressBar component** — replaces fake "0-0" on MY TEAMS strip
  - Shows "Week 5 of 12 · 37% complete" style progress
  - Only renders record if game_results exist for that team this season
- 📋 **TeamHeaderCard update** — show season progress % + real record when available
- 📋 **SpringPulse card on ParentHomePage** — Season in Progress callout
  - "5 teams · Nationals + Summer Hoops Jam locked in"
  - "10U Black: Chase for the Chain Champions"
  - "11U Girls: Nationals May 29-31 MA"
  - "10U Black: Nationals Jun 5-7 MA"
  - "8U Boys: Summer Hoops Jam NJ Jun 6-7"
- 📋 **TournamentTracker 5-dot timeline** — shows weekend tournaments for the team
- 📋 **AchievementCard** (Champions, Nationals Qualified, Finalists) on team detail

## Priority 2 — Bug fixes (from 22-bug catalog)

- 📋 Season dates timezone fix (formatDateFull — one-line fix, "Mar 22" shows instead of "Mar 23")
- 📋 UpcomingEvents.jsx rewrite (drop UPCOMING_SEED hardcoded stub, real team_id query)
- 📋 Comments display name fix (resolve email to guardian first_name)
- 📋 Games filter includes tournaments
- 📋 "May Reschedule" amber pill on draft events (schedule_status = 'draft')
- 📋 NextUpCard urgency filter (<48h cutoff for "next up" semantics)

## Priority 3 — Polish

- 📋 **Density toggle system** — CompactCard already exists (46 lines), wire to user_preferences
  - Minimal: 1-line row, 7-8 visible per screen
  - Medium (default): Current EventCards
  - Maximum: Full NextUpCard detail on every card
  - Toggle control on FilterBar
  - Preference saved per-card in user_preferences.card_density JSONB
- 📋 Login screen redesign (cobalt #4a8fd4 CTA, gradient background inspired by legacyhoopers.org hero)
- 📋 Remove underline on "Good morning, Frank" greeting
- 📋 Recurring series edit: replace native confirm modal with FullScreenForm
- 📋 RSVP optimistic update (fix for current "requires hard refresh" bug)

## Priority 4 — Team messaging foundation

- 📋 **Team-wide chat** — real implementation replacing dead MessageTeamFAB
  - All guardians linked to players on roster + coaches assigned to team
  - Supabase realtime channels per team
  - 24-Hour Rule enforcement (parent→coach playing-time messages blocked within 24h of game)
  - Inbox in Messages bottom nav tab
  - Unread badges across surfaces

---

# PHASE 2: COACH 95% 📋 DESIGNED (5-6 sessions)

## Quick Score Entry

- 📋 Inside event detail, not bottom nav (Score tab hidden per Frank's decision)
- 📋 For events where event_type IN ('game', 'tournament')
- 📋 Full-screen modal with: Team+Opponent pre-filled, Our Score input, Their Score input, Player of the Game dropdown, Public notes, Private notes, Save Draft, Publish
- 📋 Draft → Publish workflow (uses Migration 014 columns)
- 📋 Parents see final score only when published

## Rotation Planner

- 📋 Pre-game: starting 5 + bench order + rotation strategy (equal_minutes/competitive/custom)
- 📋 Coach + admin only view (never parent pre-game)
- 📋 Shareable with assigned assistants (Kenny drafts, Darien adds notes)
- 📋 Saves to game_results.starting_lineup JSONB

## Live Substitution Tracker

- 📋 In-game: tap player out, tap player in, auto-timestamps
- 📋 Period markers (Q1/Q2/HT/Q3/Q4)
- 📋 Saves to game_results.substitution_log JSONB

## Minutes computation + season trends

- 📋 Computed from substitution_log per player per game
- 📋 Season trends (up/down/stable per player)
- 📋 Parent-visible POST-game: own kid's minutes + period starts only

## Player of the Game

- 📋 Coach designates via scoring modal
- 📋 Creates team_achievements row
- 📋 Parents see POG badge + "8 pts, 3 ast, 2 stl" style summary on event detail

## Roster Health dashboard

- 📋 Coach-level view of attendance trending across team
- 📋 Declining players flagged with drill-down
- 📋 Auto-draft message: "Noticed Charlie missed 2 of last 3 practices. Everything ok?"

## Call-Up flow

- 📋 Coach triggered when Active Roster < 10 (urgent < 8)
- 📋 Manual invite from Academy player list (no auto-ranking)
- 📋 2-hour response window per invite (admin configurable)
- 📋 Push notification to selected parents
- 📋 Accept → slot filled; decline → coach invites next

## Coach compensation (personal view)

- 📋 Coach home shows current month accrual ("$850 pending · 17 sessions")
- 📋 Breakdown by event type (Practices, Games, Tournaments, Bonuses)
- 📋 Last paid history
- 📋 Uses Migration 013 rates JSONB + check_ins for attendance-derived earnings

---

# PHASE 3: ADMIN 95% 📋 DESIGNED (8-10 sessions)

## Content CMS

- 📋 Academy Standards editor
- 📋 Policy pages (24-Hour Rule, refund policy, playing time philosophy)
- 📋 Announcements broadcast
- 📋 Markdown-based with preview

## Season/Tournament/Achievement CRUD

- 📋 Full CRUD for seasons (already partial)
- 📋 Tournament entry form with rules JSONB structured editor (Migration 015)
- 📋 Achievement management (Champions, Nationals Qualified, Finalists)
- 📋 Save as template for reuse

## Briefing templates editor

- 📋 5 types documented: Team Briefing (auto), VIP Family Guide (auto), Day Recap (blocked on Quick Score), Coach Consolidated (already via All Teams view), Program Card (stays manual/Canva)
- 📋 Type 1 Team Wrapup auto-generates after games published

## Admin settings panel (uses Migration 017 columns)

- 📋 Reminder cadence configurator
- 📋 RSVP deadlines by circuit
- 📋 Note editing rules
- 📋 Nudge rules
- 📋 Roster minimums
- 📋 Notification channel defaults + quiet hours

## Hotel code distribution

- 📋 Admin uploads hotel code to tournament
- 📋 Review + "Distribute to Active Roster" manual trigger
- 📋 Push + email to guardians of Active Roster on participating teams
- 📋 Audit trail in event_notifications (Migration 019)

## Monthly coach invoice generation

- 📋 Auto-generates at month end from approved check_ins × rates
- 📋 Admin reviews, marks paid via Zelle/Venmo, logs payment_method + payment_reference
- 📋 Dispute flow for coach pushback
- 📋 Year-end 1099 summary (threshold $600)

## Admin compensation dashboard

- 📋 All coaches at-a-glance
- 📋 Pending / Approved / Paid / Disputed by month
- 📋 Year-to-date totals per coach

## Tournament rules editor

- 📋 Structured form: game_format, fouls, free_throws, jump_ball, press, overtime, misc_notes
- 📋 Save as template per circuit (AAU Zero Gravity, League Play, custom)
- 📋 Rules display on parent tournament detail (medium density)

---

# PHASE 4: MULTI-TENANT HARDENING 📝 DEFERRED

Not needed for Fall 2026 Legacy Hoopers pilot. Scheduled for 2027 before St. Pat's onboarding.

- Feature flag gating per org (enabled_features JSONB)
- Org-scoped branding (already architected, needs Phase 0C)
- White-label subdomain support (already has custom_domain column)
- Stress test at 25 teams (St. Pat's scale)

---

# PHASE 5: LAUNCH + NATIVE 📋 DESIGNED (3-4 sessions)

- 📋 Capacitor wrapper for iOS + Android
- 📋 Push notifications (APNs iOS, FCM Android)
- 📋 Haptics plugin (Taptic Engine)
- 📋 Native share sheet
- 📋 Apple Developer account ($99/year)
- 📋 Google Play ($25 one-time)
- 📋 App Store submission (app icon 1024x1024, screenshots iPhone 15 Pro Max + iPhone 8 Plus, privacy policy)
- 📋 Fall 2026 rollout — 11U Girls families first cohort

---

# PHASE 6-7: PLATFORM + BILLING 📝 BACKLOG (2027)

- Super Admin role UI (Ember platform surfaces)
- Stripe subscription (monthly base)
- Stripe Connect (registration % layer)
- Multi-org switcher UI
- Ember marketing site
- St. Pat's CYO onboarding
- Registration builder (7 program types)
- Financial dashboard

---

# KNOWN BUGS (22-bug catalog)

## P0 Security — ALL CLOSED ✅

See Phase 0A section above.

## P1 Data Integrity — Addresses in Migration 022

- 📋 Tournament times 00:00-23:59 must be 08:00-20:00 Eastern
- 📋 Apr 23 duplicate 11U Girls practice (Frank to specify which row)
- 📋 8U Boys currently marked Nationals Qualified (should be Summer Hoops Jam NJ)
- 📋 Happy Gym test location (delete)
- 📋 "Test notes" on Milo RSVP (delete)
- 📋 Tournament title "2026 Zero Gravity Girls National Finals" (revert to "Girls Nationals if qualify")

## P1 UI Bugs — Address in Phase 1

- 📋 Season dates show Mar 22 instead of Mar 23 (formatDateFull timezone bug)
- 📋 UpcomingEvents.jsx hardcoded UPCOMING_SEED data (rewrite with real team_id query)
- 📋 Comments show author email instead of guardian first_name
- 📋 Games filter excludes tournaments
- 📋 Fake "0-0" records on MY TEAMS cards (replace with season progress %)
- 📋 "Good morning, Frank" has underline styling

## P2 UX Polish — Address in Phase 1

- 📋 NextUpCard shows events >48h out (add <48h cutoff)
- 📋 RSVP writes don't optimistically update UI (requires hard refresh)
- 📋 Recurring series edit uses native confirm (should use FullScreenForm)
- 📋 Login screen amber (#C9952E) instead of cobalt (#4a8fd4)

## P3 Cosmetic — Address in Phase 2 or 0C

- 📋 Copy Roster "Copy Failed" on HTTP dev (works on HTTPS production, clipboard API limitation)
- 📋 MessageTeamFAB has dead TODO click handler

---

# VERIFIED SHIPPED (session C era + earlier)

These features were missed in the April 19 build queue. Confirmed shipped via screenshot evidence (Coach_access_under_admin_email.pdf, Parent_access_under_fsamaritanogmail_com.pdf) and filesystem verification.

- ✅ Kid filter chips on parent schedule + home (ChildFilterChips.jsx)
- ✅ Season Window card with "Week 5 of 12 · 37% complete"
- ✅ Locations CRUD with active/archived tabs + search
- ✅ Per-guardian Invite buttons
- ✅ Team color v14 palette in production database
- ✅ MY TEAMS stats grid on team detail (Players/Roster/Academy counts)
- ✅ Event-type filters (All/Game/Practice/Skills Lab/Tryout)
- ✅ Relative time countdown ("in 8h 27m") on event cards
- ✅ Admin Seasons CRUD with preset chips
- ✅ Take Attendance (check-in overlay, admin/coach)
- ✅ Tournament Briefing component exists (uses tournament_messages table)
- ✅ Edge Function invite-parent deployed
- ✅ Guardian notification preferences per person

---

# SESSION OF APRIL 24-26 — WHAT SHIPPED

**Phases 0B + 0C declared COMPLETE this session. All migrations 013-028 shipped + 10 more (029-038). Phase 4 persona infra shipped. Ember rebrand finalized.**

## Migrations applied (16 total, 029-038 are this session)

| # | Name | Purpose | Commit |
|---|------|---------|--------|
| 013-028 | various | Phase 0B data stability complete | shipped pre-session |
| 029 | organizations_branding | Org branding fields + Ember default values | f2bfaba |
| 030 | security_cleanup | RLS holes + SECURITY DEFINER fix + 18 functions search_path | cd77020 |
| 031 | tournament_times_correction | Tournament event times normalized | applied via MCP — **SQL not yet captured in repo** |
| 032 | rides_lifecycle_and_realtime | Rides backend + waitlist promotion + Realtime publication | 48ea8a9 |
| 033 | tournament_orphan_repair | 6 tournaments created, 34 events FK-linked | 48ea8a9 |
| 034 | data_integrity_fix | Jersey defaults LP=Black/AAU=Black, arrival defaults | applied via MCP — SQL not in repo |
| 035 | data_corrections_resurrection_jersey | Resurrection address fix + AAU jersey 'Both'→'Black' | applied via MCP — SQL not in repo |
| 036 | resurrection_address_correction | Final Resurrection address: 946 Boston Post Road, Rye | applied via MCP — SQL not in repo |
| 037 | venue_address_corrections_and_canonical_urls | 4 wrong addresses fixed, 10 google_maps_url, 4 entry_instructions, 3 new venues | applied via MCP — SQL not in repo |
| 038 | rename_cardinal_spellman_to_cyo_spellman | Venue rename + parking + $30 fee note + 9 events updated | applied via MCP — SQL not in repo |

**Outstanding hygiene:** 6 migrations applied via MCP that need retro capture into supabase/migrations/ directory. See "Outstanding Repo Hygiene" section below.

## Frontend commits to main (16 commits, ending at 1d6ddce)

| Commit | What |
|--------|------|
| f2bfaba | Migration 029: organizations branding fields |
| 14ef599 | emberDefaults.js canonical brand defaults + CSS var map |
| 16c5226 | useOrgBranding hook |
| 9ffd8e8 | AuthContext refactor for emberDefaults + useOrgBranding |
| e5f9551 | Phase 0C Step 5: Ember phoenix asset swap |
| cc6d3ea | Phase 0C Step 5b: in-app logo refs fix |
| cd77020 | Migration 030 retro SQL capture |
| 6989368 | chore: token rotation smoke test |
| 95358fe | Phase 0C Step 6: --sf-* → --em-* CSS rename (112 files) |
| 86f5349 | Phase 0C Step 7: display strings cleanup → Skyfire to Ember |
| 48ea8a9 | Migrations 032+033 retro SQL capture |
| fb26e86 | Step 3: density infra (usePreferences + useDensity hooks) |
| 7b08926 | Step 4B: persona hooks (useHomeRole + useNotificationBadge) |
| 2d907b7 | Step 4C: Header rewrite + RoleSwitcherSheet + RoleSwitcherViews |
| cfd72d5 | Step 4D: PreferencesProvider Context refactor (16/16 smoke PASS) |
| 13cc15a | fix(parent): map address fallback first attempt — incomplete |
| d4b56dc | fix(maps): google_maps_url priority across all surfaces + city/state concat killed + tournament hide for OverviewTab |
| 991c408 | fix(maps): Apple daddr= + Waze www. + NextUpCard placeholder hide |
| ef1c2ad | fix(event-detail): single Google directions button opens in new tab |
| 1d6ddce | merge: v2 → main (rebrand finalize, persona infra, Step 4D, all map fixes) |

## Decisions locked this session

1. AAU jersey neutral = Black (per Frank: "black is our neutral default")
2. Tournament hide-until-preliminary (Option B): hide map UI for tournament events where schedule_status='draft' or null
3. google_maps_url priority: google_maps_url > coords > address text
4. Apple/Waze removed from event detail Location tab pending URL format fix (helper still exports them — easy to re-add)
5. Single Google "Get Directions" button on event detail Location tab, opens in new tab via target="_blank"
6. NextUpCard hides location link when event.location starts with "Tournament -"
7. Cardinal Spellman → CYO Spellman with parking note + $30 entry fee callout

## Phase reset (use this nomenclature going forward)

Phase 0A SECURITY: ✅ COMPLETE
Phase 0B DATA STABILITY: ✅ COMPLETE (all 13-28 + 29-38 shipped)
Phase 0C EMBER REBRAND: ✅ COMPLETE
Phase 1 PARENT 95%: 🚧 ~85% — NOW Section per persona (Step 5A-5.5J) is next
Phase 2 COACH 95%: 🚧 ~82% — Quick Score + Rotation Planner + comp tracking
Phase 3 ADMIN 95%: 🚧 ~55% — Communications Engine + Operations Now + comp dashboard
Phase 4 MULTI-TENANT: 📝 DEFERRED to 2027
Phase 5 LAUNCH + NATIVE: 📋 DESIGNED (Capacitor + push + App Store)
Phase 6-7 PLATFORM + BILLING: 📝 BACKLOG

## Phase 1 Step 5: NOW Section per persona — DESIGNED

| Step | What | Time |
|------|------|------|
| 5A | Discovery: read HomePage.jsx + ParentHomePage current shape | 5 min |
| 5B | SectionShell wrapper (loading/error/empty/data + brand-aware skeletons) | 25 min |
| 5C | Wire HomePage to useHomeRole().activeRole router | 15 min |
| 5D | CoachHomePage scaffold | 20 min |
| 5E | NowSection per persona: parent (per-child cards) + coach (per-team rows) + admin (3 KPI tiles + Operations Now) | 75 min |
| 5F | Migration 039: event_rsvps Realtime publication | 5 min |
| 5G | Realtime subscription wired into NowSection | 15 min |
| 5.5H | LIVE/AWAITING SCORE card states (T-0 to T+24h) | 30 min |
| 5.5I | Friday Workflow card (coach + admin only Fridays) | 30 min |
| 5.5J | TournamentDay multi-day card consolidation | 30 min |

Design max ideas baked into 5E (locked):
- Parent: confidence pills (green check/red exclaim), "Teammates going" social proof, smart RSVP nudges
- Coach: pre-game prep checklist auto-completing, one-tap RSVP override with audit log, Roster Health gauge
- Admin: smart triage Operations Now, multi-team week heatmap

## Phase 3 Communications Engine — DESIGNED (replaces 8hr/weekend manual workflow)

This is THE killer feature of Ember. Frank currently spends ~8 hours every weekend writing 5 message types manually. Fall 2026 brings 5-10 teams = 80+ hours/weekend without this.

### 5-message weekly cadence

| Day | Type | Trigger | Audience |
|---|---|---|---|
| Wed ~6pm | Preliminary Schedule | Tournament organizer drops draft | Tournament roster |
| Thu ~6pm | Final Schedule + Game Day Guide | Schedule confirmed | Tournament roster |
| Fri 12pm | RSVP Lock + Roster Finalize | Auto + manual | Tournament roster |
| Sat night | Day 1 Recap + Sunday Scenarios | After last Sat game | Tournament roster |
| Sun night | Weekend Wrap + Week Ahead | After last Sun game | Tournament roster |
| Ad-hoc | Schedule Change | Auto-diff on event edit | Affected only |

### Schema additions needed (Migration 039 future)

- tournament_messages.message_type ENUM: preliminary_schedule | final_schedule | rsvp_lock | saturday_night_scenarios | weekend_recap | week_ahead | schedule_change
- parent_message_id (uuid, FK self-ref) for multi-team consolidation
- message_group_id (uuid) for deduplication
- seasons.circuit_rules (jsonb) for AAU PD cap +20 etc.

### Build steps

| Step | What | Time |
|------|------|------|
| 6A | Academy Callup workflow + academy_callups table + ranked queue + 2hr response window | 90 min |
| 6B | Briefing Generator foundation: lib/briefing.js + BriefingComposer.jsx + side-by-side preview | 90 min |
| 6C | Wednesday Preliminary message type | 60 min |
| 6D | Thursday Final + Game Day Guide message + JSONB editor for game_day_guide | 60 min |
| 6E | Saturday Night Scenarios builder (conditional rendering, pool standings, bonus game flag) | 75 min |
| 6F | Sunday Wrap + Week Ahead generator | 75 min |

### Audience scoping rule (LOCKED)

Tournament messages scope to tournament_rosters table, NOT team roster. Helper: getTournamentRecipients(tournament_id). UI shows "Active: X · Futures: Y · Recipients: Z guardians".

### HTML rendering rules (LOCKED — LeagueApps-compatible)

- Inline-styled only, no <style> blocks
- Table-based layout, no <div> wrappers in rules sections
- <span> + <br> instead of block elements
- Standard bullet &#8226; not unicode bullets
- Cobalt #1e3a5f accent (Migration 029)
- Orange #e05c2a game day arrival callout
- Dark navy #091c36 header

### Delivery method evolution

1. Phase 1 (now): Generate in Ember, copy-paste to LeagueApps + email
2. Phase 2: In-app announcement + email via Resend
3. Phase 3: Push notifications
4. Phase 4: Replace LeagueApps entirely

## Outstanding Repo Hygiene

Migrations applied via MCP that need SQL captured in supabase/migrations/ for repo symmetry:

- 20260426111421_tournament_times_correction.sql (M031)
- 20260426200358_data_integrity_fix.sql (M034)
- 20260426203347_data_corrections_resurrection_jersey.sql (M035)
- 20260426203943_resurrection_address_correction.sql (M036)
- 20260426205441_venue_address_corrections_and_canonical_urls.sql (M037)
- 20260426215822_rename_cardinal_spellman_to_cyo_spellman.sql (M038)

To capture: query Supabase migrations table via MCP, write each SQL to a new file, commit. Defer to next session.

## Open issues parked from this session

P1 frontend bugs (revisit Phase 1 Step 5+):
- Apple Maps URL format: ?daddr= with coords reverse-geocodes to nearest street (e.g., "23 Whippoorwill Rd E" instead of "St. Patrick's"). Fix probably needs ?daddr=address-text always, never coords.
- Waze URL format: works but shows lat/lon as destination label (cosmetic). Frank's website also has this so not blocking.
- 4 of 5 map URL surfaces consolidated to use mapsUrls.js helper. NextUpCard's useMapsUrl is the holdout (single-string contract). Refactor to triplet later.
- useTournamentBriefing.js inline buildMapsUrl never refactored to use shared helper.

P1 data integrity (deferred):
- 1 player on 11U Girls missing guardian linkage
- 13 guardians missing phone, 4 missing email
- Sarah Lawrence address has "Campbell Sports Center, " prefix added in M037 (verify on phone)

P2 schema/architecture risks (Phase 3+):
- event.location TEXT vs event.location_id FK schism: lookup uses ilike on text. Brittle.
- Per-game jersey override needed for tournament events (1 row but 4 games inside, each may need different jersey)
- Tournament location swap workflow undefined: when schedule_status flips draft → preliminary on Wednesday, no defined process to swap event.location_id from placeholder to actual venue
- locations table has TWO coord column pairs (lat/lon used, latitude/longitude legacy unused). Drop latitude/longitude in future cleanup migration.

---

# ELITE STACK BACKLOG (LOCKED APRIL 26, 2026)

**These 57 items are design intent, not optional polish. Future sessions design against these constraints, not retrofit them later.**

## Locked design decisions (14)

| # | Decision | Lock |
|---|----------|------|
| 1 | Adaptive density | T-4h pre-event auto-MAX. Manual chevron wins. Idle days = user's last setting. |
| 2 | Optimistic UI | Per-row writes (RSVPs/rides/duties/scores). Bulk operations stay pessimistic. Cascading admin time-edits stay pessimistic. |
| 3 | Smart nudge channels | Banner + push at T-4h + T-1h + email digest. SMS for cancellations + admin 'critical' only. |
| 4 | Sibling conflict | Intra-Ember + iCal/GCal import. Phase 2. |
| 5 | Quiet Mode 9pm-7am | Only admin 'critical' bypasses. 'High' waits until 7am. |
| 6 | Translation EN ↔ ES | UI + messages + reverse direction. Phase 3. |
| 7 | Streak privacy | Family-private only. No leaderboards. |
| 8 | Yearbook PDF | Auto end-of-season + on-demand. |
| 9 | First-time tour | 3 dismissible tooltips. |
| 10 | Birthday auto-wishes | Opt-in. |
| 11 | Photo wall moderation | Admin pre-approve 30 days, then trusted auto. |
| 12 | Anonymous suggestion box | Default identifiable, anonymous as escape. |
| 13 | Kindness microcopy | Codified CLAUDE.md §16. |
| 14 | Accessibility | Non-negotiable Phase 1.5 Elite Polish. |

## CRITICAL DISTINCTION: Game stats vs engagement stats

Prior lock: "Team-level stats only — no per-player stats in 2026" applies to GAME stats only (points/rebounds/assists). ENGAGEMENT stats (attendance, RSVP timeliness, sessions completed) ARE per-player and power streaks (ELITE-13), yearbook (ELITE-15), YoY comparison (ELITE-16). Different category, no conflict.

## CRITICAL DISTINCTION: Reminders vs RSVP-nudges

Two notification streams run independently, each admin-configurable:
- **Event reminders** (don't forget your game tomorrow): 3-day · 1-day · 4-hour cadence (prior lock preserved)
- **RSVP nudges** (you haven't RSVP'd yet): T-4h + T-1h before RSVP-lock deadline (tonight's lock)

## Tier 1: Anticipation (category-defining moats)

| # | Item | Phase | Notes |
|---|------|-------|-------|
| ELITE-1 | Adaptive density | 5E-2d (Phase 1) | T-4h trigger; manual override always wins |
| ELITE-2 | Sibling + family conflict detection | Phase 2 | Intra-Ember + iCal/GCal Phase 2 |
| ELITE-3 | Multi-team message consolidation | Phase 6 | Communications Engine |
| ELITE-4 | Smart nudge engine | Phase 1.5 Elite Polish | RSVP locks, ride needed |
| ELITE-5 | Predictive RSVP suggestion | Phase 2 | "Charlie attended every Tuesday — confirm yes?" |
| ELITE-6 | Travel time + weather inline | Phase 2 | Google Maps + OpenWeather |

## Tier 2: Speed + responsiveness

| # | Item | Phase | Order dependency |
|---|------|-------|------------------|
| ELITE-7 | Optimistic UI for per-row writes | Phase 1.5 Elite Polish | **Must ship before ELITE-1** |
| ELITE-8 | Realtime presence + activity stream | 5G + Phase 1.5 | Migration 039 publishes event_rsvps |
| ELITE-9 | Pull-to-refresh on every list | Phase 1.5 | iOS table stakes |
| ELITE-10 | 60fps scrolling + virtualization | Phase 1.5 | Long-list virtualization |
| ELITE-11 | Haptic feedback library | Phase 5 | Capacitor unlocks Taptic |
| ELITE-12 | Voice-to-RSVP via Siri Shortcuts | Phase 5 | Siri Shortcuts API |

## Tier 3: Memory + recognition (the love layer)

| # | Item | Phase | Notes |
|---|------|-------|-------|
| ELITE-13 | Streak system (engagement stats) | Phase 2 | Family-private; needs `attendance_streaks` view |
| ELITE-14 | Attendance trending arrows ↑↓ | Phase 2 | Already locked in userMemories |
| ELITE-15 | End-of-season yearbook PDF | Phase 3 | Engagement stats; needs `season_summaries` |
| ELITE-16 | Year-over-year comparison | Phase 3 | Engagement stats only |
| ELITE-17 | Photo wall per team | Phase 3 | Needs `photo_uploads` table |
| ELITE-18 | Birthday auto-wishes | Phase 2 | Opt-in via guardian_notification_prefs |

## Tier 4: Trust + transparency

| # | Item | Phase | Notes |
|---|------|-------|-------|
| ELITE-19 | Visible audit logs | Phase 2 | Needs `event_rsvp_audit` table; **must ship before ELITE-32** |
| ELITE-20 | Anonymous coach feedback survey | Phase 3 | `coach_feedback_surveys` |
| ELITE-21 | Anonymous suggestion box | Phase 3 | `admin_suggestions` table |
| ELITE-22 | Treasurer transparency breakdown | Phase 6 | Existing payments + categorization |
| ELITE-23 | Coach office hours visible | Phase 2 | Profile field |

## Tier 5: Inclusion + access (Westchester moat)

| # | Item | Phase | Notes |
|---|------|-------|-------|
| ELITE-24 | Translation toggle EN ↔ ES | Phase 3 | UI + messages + reverse |
| ELITE-25 | Quiet Mode 9pm-7am automatic | Phase 1.5 | **Must ship before ELITE-3** |
| ELITE-26 | Reduced motion respect | Phase 1.5 | `prefers-reduced-motion` |
| ELITE-27 | Dynamic Type support | Phase 5 | iOS native |
| ELITE-28 | VoiceOver compatibility | **Continuous, not Phase 1.5** | Every component ships accessible |
| ELITE-29 | High-contrast palette mode | Phase 2 | Older grandparents |

## Tier 6: Communications excellence

| # | Item | Phase | Notes |
|---|------|-------|-------|
| ELITE-30 | Image OCR for tournament schedules | Phase 6 | Vision LLM; kills TourneyMachine paste |
| ELITE-31 | Auto-summarize coach notes | Phase 6 | LLM compression |
| ELITE-32 | Channel preferences per user | Phase 2 | Push/email/SMS/important-only |
| ELITE-33 | Schedule change diff visualizer | Phase 6 | Auto-generated old-vs-new |

## Tier 7: Tournament weekend dominance

| # | Item | Phase | Notes |
|---|------|-------|-------|
| ELITE-34 | Live scores from other courts | Phase 6 | Realtime |
| ELITE-35 | Bracket visualization | Phase 6 | Winners advance lit up |
| ELITE-36 | Hotel reservation tracker | Phase 6 | Group code + RSVP "we're staying" |
| ELITE-37 | Carpool grid optimization | Phase 2 | Existing event_rides + groupings |
| ELITE-38 | Lost & found per venue | Phase 3 | Small detail, big delight |

## Tier 8: Native superpowers (Phase 5+ unlock)

| # | Item | Phase | Notes |
|---|------|-------|-------|
| ELITE-39 | Lock screen widget | Phase 5 | "Next: 11U Girls game in 4h 12m" |
| ELITE-40 | Apple Watch glance | Phase 5+ | Countdown + venue on wrist |
| ELITE-41 | Long-press context menus | Phase 5 | iOS muscle memory |
| ELITE-42 | Swipe gestures | Phase 5 | Mail/Messages pattern |
| ELITE-43 | Native share sheet | Phase 5 | iMessage/WhatsApp/AirDrop |
| ELITE-44 | Universal links | Phase 5 | legacyhoopers.org/event/abc → app |

## Tier 9: First impressions + onboarding

| # | Item | Phase | Notes |
|---|------|-------|-------|
| ELITE-45 | First-time tour (3 tooltips) | Phase 1.5 | Linear pattern; dismissible |
| ELITE-46 | "What's new" changelog modal | Phase 1.5 | 3-line summary per ship |
| ELITE-47 | Empty states with personality | Phase 1.5 | Brand voice |
| ELITE-48 | Microcopy that's kind | Ongoing (CLAUDE.md §16.3) | Every string |
| ELITE-49 | Login screen branding fix | 0C polish | Cobalt + phoenix |

## Tier 10: COACH-SPECIFIC ELITE (added by audit)

| # | Item | Phase | Notes |
|---|------|-------|-------|
| ELITE-50 | Sub-finder w/ availability ranking | Phase 2 | When call-up needed, sort academy by recent RSVPs |
| ELITE-51 | Quick-text missing parents | Phase 2 | One-tap "Text 4 missing parents" prefilled |
| ELITE-52 | Coach game-day briefing card | Phase 2 | 6 AM auto-generated digest |

## Tier 11: ADDITIONAL AUDIT-SURFACED ITEMS

| # | Item | Phase | Notes |
|---|------|-------|-------|
| ELITE-53 | Conflict prevention on event create | Phase 3 | Admin sees warnings BEFORE creating |
| ELITE-54 | Bulk RSVP for siblings on same team | Phase 1.5 | "RSVP both" button for multi-kid parents |
| ELITE-55 | Game-day "On my way" check-in | Phase 2 | Coach sees parent ETAs |
| ELITE-56 | Game results auto-share card | Phase 3 | Post-game shareable image |
| ELITE-57 | Emergency contacts 2-tap access | Phase 2 | Coach long-press player → call any guardian |

## Schema-debt cross-reference

Elite items requiring NEW schema in their target phase:

| Elite # | New schema | Phase migration target |
|---------|------------|------------------------|
| ELITE-13 | `attendance_streaks` view | Phase 2 |
| ELITE-15 | `season_summaries` + photo storage | Phase 3 |
| ELITE-17 | `photo_uploads` table w/ moderation_status enum | Phase 3 |
| ELITE-19 | `event_rsvp_audit` table | Phase 2 |
| ELITE-20 | `coach_feedback_surveys` + responses | Phase 3 |
| ELITE-21 | `admin_suggestions` table | Phase 3 |
| ELITE-22 | financial categorization on payments | Phase 6 |
| ELITE-30 | `tournament_schedule_imports` | Phase 6 |
| ELITE-39 | iOS widget extension target | Phase 5 |
| ELITE-50 | computed view on event_rsvps for academy ranking | Phase 2 |
| ELITE-55 | `event_arrivals` table | Phase 2 |

## Implementation order (must-ship-first)

1. ELITE-7 (optimistic UI) BEFORE ELITE-1 (adaptive density)
2. ELITE-25 (Quiet Mode) BEFORE ELITE-3 (multi-team consolidation)
3. ELITE-19 (audit logs) BEFORE ELITE-32 (channel preferences)
4. ELITE-28 (VoiceOver) ships CONTINUOUSLY, not as a polish step

## Phase distribution (revised — Phase 1 polish renamed)

| Phase | Original work | Elite injections | Total |
|-------|---------------|------------------|-------|
| Phase 0C polish | 1 elite (ELITE-49) | 1 |
| **Phase 1.5 Elite Polish** (new) | 5E-2b/c/d + 5F/G + 5.5H/I/J | 13 elite items | ~22 items |
| Phase 2 (acknowledged grows from 5-6 to 10-12 sessions) | Quick Score + Rotation Planner + comp tracking | 14 elite items | ~17 items |
| Phase 3 | Admin features | 8 elite items | ~17 items |
| Phase 5 | Capacitor + push | 9 elite items | ~16 items |
| Phase 6 | Communications Engine | 8 elite items | ~14 items |

Total elite stack injection: 57 items across 6 phases.

## Implementation principles

Every Elite Stack item ships against:
1. Optimistic UI patterns where applicable
2. Density-aware (`useDensity(sectionKey)`) where applicable
3. Accessibility from day one (aria-label, keyboard, contrast)
4. Translation-extractable strings
5. Kindness microcopy

# END OF BUILD QUEUE v2

**Maintainer note:** When you ship a feature, update this document IMMEDIATELY. Add to the SHIPPED section above with evidence citation. Don't wait for session end.


---

# SESSION LOG — April 24, 2026 (Phase 0B Final + Sprint A.1)

## Migrations shipped this session

- ✅ **Migration 024** — Spring 2026 schedule rebuild (commit 428e1b4): location_rooms table + location FK + publish_status + arrival_time + 140 events seeded from canonical CSV + 36 Skills Labs + opponents cleanup + season end_date corrected to Jun 14
- ✅ **Migration 025** — Rides redesign per RIDES_DESIGN_SPEC.md v1.0 (commit eaade3a): event_ride_offers + event_ride_claims tables + claim_ride_offer + cancel_ride_claim SECURITY DEFINER helpers + 8 granular RLS policies. Auto-confirm pg_cron deferred to Migration 028+
- ✅ **Migration 026** — RLS granular policies (commit da14103): split 9 ALL policies into 36 SELECT/INSERT/UPDATE/DELETE policies. Closed P0 security hole. Parent app smoke test PASS
- ✅ **Migration 027** — Event notification triggers (commit bd9673e): 6 functions + 5 triggers populate event_notifications on event INSERT/cancel/reschedule/relocate + coach comment. Honors publish_status (drafts don't notify). Status default fixed pending → queued

## Sprint A.1 bug fixes shipped this session

- ✅ **Bug A1** (commit bcce0e3) — Removed accent underline below greeting (ParentHomePage + AdminGreeting)
- ✅ **Bug A2** (commit 51d0452) — UpcomingEvents.jsx renders real activities filtered by team_id (next 7 days, max 5), drops UPCOMING_SEED stub. RosterSection passes teamId prop
- ✅ **Bug A3** (commit b112619) — useComments.js authorName chain now: guardianFirstName -> user_metadata.full_name -> capitalized email local-part. No more raw email leaks in comment author display
- ✅ **Bug A4** (commit 82c1943) — SchedulePage Game filter chip includes tournaments (event_type IN game, tournament). Tournament chip still drills down to tournament-only

## Audit deliverables committed (commit d59ba23)

- ✅ SKYFIRE_95_AUDIT.md (860 lines) — initial 46-gap audit
- ✅ SKYFIRE_OPTION_A_AUDIT.md (905 lines) — full Option A audit, 118 gaps, 24 migrations, 12-month roadmap to Fall 2027 launch

## Decisions locked this session

- **D-roster1:** Parents see FULL team roster RSVP view by default on event detail. Each row shows player name + their RSVP status (Going / Not Going / Maybe / No Response). No privacy default.
- **D-roster2:** Roster visibility privacy toggle DEFERRED to Sprint E admin work. Add organization_settings.roster_visibility_to_parents boolean (default true). Admin can flip off later.
- **D-roster3:** RSVP-write-on-others-kids stays gated. Parents see WHO is going but can only set RSVPs for their own children (guardian_id check, enforced Phase 0A).
- **D-season1:** seasons.end_date corrected Jun 15 -> Jun 14 (Hoop Festival Sunday is the season finale, no Skills Lab on Jun 15)
- **D-027:** Skipped originally-planned Migration 027 (lat/lng backfill + event location FK). Most work collapsed into Migration 024. Migration 027 became event notification triggers (was 028 in audit). Renumbering propagates: original 028 -> 028+ stays.

## Branch alignment

End-of-session state: v2 + main + origin/v2 + origin/main all at commit 82c1943. Branches synchronized via reset --hard after early divergence.

## What's next

**Sprint A.2 (5 MATERIAL bugs):**
- A5: Season dates Mar 22 vs 23 timezone (formatDateFull tweak)
- A6: RSVP optimistic update (useRsvps hook update for current "requires hard refresh" bug)
- A7: Recurring series edit native confirm -> custom FullScreenForm dialog
- A8: Login button amber #C9952E -> cobalt #4a8fd4 (1 CSS variable change)
- A9: Parent queries missing season_id filter (useActivities/useEventDetail update for season boundary safety)

**Then Phase 0C Ember rebrand** per locked decisions:
- D1=(b): Internal rebrand + org-aware header (logo reads from organizations.logo_url). Parents still see Knight + Legacy Hoopers, architecture supports future St. Pat's
- D2=(a): Internal Skyfire -> Ember scope = everything (CSS vars --em-* -> --em-*, file names, doc names, comments — clean break)
- D3=(b): Repo name skyfire-app stays for now, rename closer to launch
- Phoenix logo PNGs already committed at repo root (bcce0e3 stowaway commit)

**Then Sprint B1+B2** parent home page redesign per HOME_DESIGN_SPEC.md


---

# MIGRATION 028 SHIPPED — April 24/25 late session (Parent roster visibility)

## What it does

Adds 3rd SELECT policy on players table so parents see all players on teams where they have at least one child rostered. Cross-team isolation preserved (Frank does NOT see 9U Boys roster). Privacy line preserved (Frank sees other girls' names but NOT their guardians' contact info, guardians table policies untouched).

## Helper added

current_user_teammate_player_ids() SECURITY DEFINER returning uuid[]. Mirrors the existing current_user_child_team_ids() pattern. No recursion possible because the inner SELECT bypasses RLS via SECURITY DEFINER.

## Verification (real auth context, not DB owner bypass)

- Teams page as Frank: 11U Girls shows 13 Players, 8U Boys shows 14 Players, other 3 teams show 0 Players (privacy intact).
- Event detail RSVPs as Frank on 11U Girls event: 13 rows visible. Charlie has Going/Maybe/Not Going buttons + Add Note. Other 12 girls show No response read-only.
- Guardian contact info: only visible for Frank's own children (Charlie, Milo). Other families show No guardians linked. Privacy line holds.

## L99 lessons applied this session

1. RLS recursion is the #1 anti-pattern in production. Three policies in one session failed because USING clause did inner SELECT on related RLS-protected tables. Fix: always SECURITY DEFINER helpers.

2. Postgrest nested joins evaluate RLS on every joined table. If parent table returns rows but joined table returns NULL due to RLS, Postgrest drops the parent rows. The roster_members policy alone was not enough because the chain useRoster -> roster_members -> players -> player_guardians -> guardians had a block at the players layer.

3. DB owner queries bypass RLS entirely. Verifying as DB owner shows you what data exists, not what the user can see. Real verification requires impersonated auth context or browser smoke test.

4. PWA service worker caching was a red herring. Earlier in session I diagnosed stale browser build as the cause. It was not. The actual cause was always RLS on the joined players table. Cache clearing wasted 20 minutes.

## Files committed

- supabase/migrations/028_parent_roster_visibility.sql
- supabase/rollbacks/028_parent_roster_visibility_REVERT.sql
- Migration history repaired via npx supabase migration repair --status applied 028

## Status

Migration 028 LOCKED + DEPLOYED + VERIFIED. Parent role now matches D-roster1 spec. Ready to start Sprint A.2 next session.

## Wave 3a — SHIPPED 2026-04-29 22:15 UTC
- Files: 9 created (broadcast/* + RecordsPreview), 3 edited (main.jsx, App.jsx, constants.js)
- Commit: 3261495
- Verification: /records-preview matches records-v14_2.html side-by-side
- Council patches applied: 6/6 (constants move, hero ghost word + glow, dangerouslySetInnerHTML pin, role=row drop, SQL pre-check, build queue auto-update)
- Next: Wave 3b — wire useTeamRecords into RecordsPreview, replace fixtures

## Wave 3a.1 — SHIPPED 2026-04-29 22:24 UTC
- File: src/hooks/useTeamRecords.js (full rewrite)
- Commit: 0d0c998
- Reason: Supabase MCP schema audit revealed game_results uses event_id
  (not team_id), published_at timestamp (not is_published boolean), and
  lacks org_id. Org scoping enforced by RLS through events → teams chain.
- Hook now: signature useTeamRecords(teamId) — orgId param dropped
- Query: nested events!inner join, foreignTable order-by, result text W/L
- Unblocks Wave 3b (hook wire-up to RecordsPreview)

## Migration 023 — SHIPPED 2026-04-29 23:15 UTC
- Database: applied via Supabase MCP apply_migration (Apr 29)
- File: supabase/migrations/023_backfill_opponent_names.sql
- Commit: b8a456e
- Verification: 24 opponent NULLs filled, 3 championship finals flagged, post-flight clean
- Source: records-v14_2.html lines 637-736 (Spring 2026 records page)
- Unblocks: Wave 3b (real game log data with championship badges)

## Wave 3b — SHIPPED 2026-04-29 23:25 UTC
- Files: 2 created (useTeams.js, ChampionshipBadge.jsx), 4 edited (useTeamRecords.js, GameLogRow.jsx, RecordsPreview.jsx, App.jsx, broadcast.css)
- Commit: 5beeb32
- Verification: /records-preview now renders live data — 5 team cards with real Spring 2026 records, 11U Girls game log shows real opponents, NY Extreme Black championship final has gold badge
- Route moved behind <Protected> wrapper (game_results RLS requires authenticated)
- Unblocks: Wave 3c (per-team filter UI, public /records page with public RLS migration)

## Wave 3b.1 — SHIPPED 2026-04-29 23:38 UTC
- File: src/hooks/useTeamRecords.js (two-line str_replace)
- Commit: 92198b2
- Reason: PostgREST/supabase-js requires actual relation name in
  .eq() and .order({foreignTable}) for embedded resources. Alias
  only applies to select/response shape. Wave 3b shipped with alias
  used in filter, returning 0 rows for all team queries.
- Surfaced: live page testing on /records-preview after Wave 3b
  deploy showed 0-0 records for every team for both admin and
  parent accounts.
- Fix: 'event' → 'events' in two locations

## Migration 024 — SHIPPED 2026-04-30 00:10 UTC
- Database: applied via Supabase MCP apply_migration (Apr 29)
- File: supabase/migrations/024_fix_parent_rls_use_roster_members.sql
- Verification: parent fsamaritano now sees 7 games (11U Girls) + 8 games (8U Boys); visual smoke test on /records-preview passed
- Bug history: game_results_select_parent queried team_players (0 rows). Active roster data lives in roster_members. Surfaced by Wave 3b live-data wiring (first parent-facing surface to query game_results since parent role was created).
- Unblocks: clean parent RLS chain for any future feature that reads game_results

## Migration 026 — SHIPPED 2026-04-30 00:32 UTC
- Database: applied via Supabase MCP apply_migration (Apr 29)
- File: supabase/migrations/026_align_tournaments_to_canonical_schedule.sql
- Verification: 7 Spring 2026 tournament rows, all with non-empty venue, all canonical names match, 0 events orphaned
- Source: Frank's canonical Squarespace season-calendar HTML, Apr 29 2026
- Pattern: 7 UPDATEs + 2 DELETEs scoped by tournament id (idempotent, row-bound)
- Unblocks: Wave 3c-c (tournament timeline rebuild against clean DB)

## Wave 3c-a — SHIPPED 2026-04-30 00:43 UTC
- Database: Migration 025 applied via Supabase MCP apply_migration (Apr 29)
- File: supabase/migrations/025_public_rls_for_records_page.sql
- Code: src/App.jsx (1-line route addition for /records public route)
- Verification: 3 new public RLS policies registered (teams_select_public, events_select_public, game_results_select_public). 5 teams + 27 events + 27 published game_results visible to anon for Legacy Hoopers org.
- Pattern: Hardcoded Legacy Hoopers org_id in policies. TODO: refactor to URL-based scoping when 2nd org joins.
- Unblocks: Wave 3c-b (per-team filter UI), Wave 3c-c (tournament timeline rebuild against clean tournament data from Migration 026)

## Apr 30, 2026 UTC — Wave 3c-a: Public /records page

**Shipped:** Anonymous + authenticated visitors can now access `/records` at https://skyfire-app.vercel.app/records without login. Team records cards, stats hero bar, and game log all pull live data from Supabase. Tournament timeline section still hardcoded — Wave 3c-a.1 queued to wire it to the live `tournament_teams` join table.

**Migrations applied via Supabase MCP, mirrored to repo this commit:**
- `025_public_rls_for_records_page.sql` — added `teams_select_public`, `events_select_public`, `game_results_select_public` scoped to Legacy Hoopers org_id
- `027_hotfix_legacy_rls_restrict_to_authenticated.sql` — restricted 11 legacy policies (`teams_select`, `events_select`, `events_insert`, `locations_select`, `opponents_select`, `seasons_select`, `team_players_select`, `team_staff_select`, `location_rooms_org_isolation`, `ride_offers_select`, `ride_offers_insert`) from `{public}` to `{authenticated}`. Fixed anon hitting `current_user_org_id()` permission error.
- `028_break_records_rls_cycle.sql` — dropped + recreated `events_select_public` and `game_results_select_public` without cross-table references. Fixed RLS infinite recursion under anon evaluation.
- `029_public_rls_for_tournaments.sql` — added `tournaments_select_public` for /records timeline section.
- `030_backfill_tournament_teams.sql` — backfilled 3 missing NY Metro Showdown rows + populated `final_place` (Champions/Finalists) and `final_record_*` for Chase for the Chain. 15 rows total across 7 tournaments.

**Files this commit:**
- supabase/migrations/025_public_rls_for_records_page.sql (overwrite)
- supabase/migrations/027_hotfix_legacy_rls_restrict_to_authenticated.sql (new)
- supabase/migrations/028_break_records_rls_cycle.sql (new)
- supabase/migrations/029_public_rls_for_tournaments.sql (new)
- supabase/migrations/030_backfill_tournament_teams.sql (new)
- SKYFIRE_BUILD_QUEUE_v2.md (this entry)

**Evidence:**
- Anon SELECT verified via Supabase MCP: 5 teams, 140 events, 27 published game_results, 7 tournaments, 15 tournament_teams rows visible
- Production /records confirmed loading in incognito with real team records: 11U Girls 5-2, 10U Black 5-4, 10U Blue 1-1, 9U Boys 0-1, 8U Boys 3-5
- 11U Girls game log shows Migration 023 backfilled opponents (Level Up, Showtime Elite, NY Extreme Black ×2 incl championship, Palisades Elite, NY Gauchos, Rockland Spartans Maroon)

**Known incomplete:**
- Tournament timeline section in `RecordsPreview.jsx` is still hardcoded (lifted from `records-v14_2.html`). Live page shows 4 rows; database has 7. Wave 3c-a.1 queued to rebuild against `tournament_teams` join.

**Next-wave unlock:** Wave 3c-a.1 (tournament timeline live data wire-up via `useTournaments` hook + `tournament_teams` join), Wave 3c-b (per-team filter UI), Wave 3c-c (any remaining polish).

## Apr 30, 2026 UTC — Wave 3c-a.1: Tournament timeline live data wire-up

**Shipped:** Tournament timeline section on /records now consumes live data from `tournaments` + `tournament_teams` + `teams`. Replaced hardcoded array (lifted from records-v14_2.html in Wave 3a) with new `usePublicTournaments(orgId)` hook + rewritten `TournamentCard` component. Page now displays all 7 spring tournaments accurately:
- **Complete** (2): ZG Chase for the Chain NY (11U Girls Champions 4-0, 10U Black Champions 5-0, 8U Boys Finalists 2-2), ZG NY Metro Showdown (11U Girls 1-2, 10U Black 0-4, 8U Boys 1-3)
- **Up Next** (1): ZG Rumble for the Ring CT (May 16-17)
- **Upcoming** (4): Girls Nationals (May 29-31), Boys Nationals (Jun 5-7), BBallShootout: Pre Summer Hoops Jam Classic 1 (Jun 6-7), ZG NY Hoop Festival - Season Finale (Jun 13-14)

**Design decisions:**
- 3 separate cards for the June nationals/shootout slot (DB has them as 3 distinct rows; old reference HTML collapsed them into one).
- Past tournaments without placement render team name + tournament W-L (e.g. "11U Girls 1-2"), keeping non-championship runs informative.
- Future tournaments render team color dot + name only. No "Qualified" chip (per-team season-long status, not per-tournament).
- Status pill: Complete (gold) | Up Next (cobalt + pulse, honors prefers-reduced-motion) | Upcoming (muted).

**Naming deviation from prompt:** prompt called the new hook `useTournaments` but `src/hooks/useTournaments.js` already exists as a 137-line authenticated admin hook (consumed by `TournamentsPage` + `TournamentFormSheet`) with mutations, pagination, caching. To avoid breaking the admin tournaments page, the new public-records hook is named `usePublicTournaments` instead. Same shape and behavior as spec'd.

**Class-prefix deviation from prompt:** prompt's TournamentCard rewrite used `tcard-*` classes; existing convention in broadcast.css is `bc-tourney-*`. Adapted JSX accordingly. Updated existing `.bc-tourney-pill.next` (was green) and `.bc-tourney-pill.complete` (was muted) to match new spec (cobalt+pulse, gold). New classes added: `.bc-tourney-team-dot`, `.bc-tourney-record`, `.bc-tourney-badge.finalists`, plus `@keyframes bc-tourney-pulse` (broadcast-scoped, doesn't count against cockpit `.sf-*` 10-keyframe budget).

**orgId source:** added `LEGACY_HOOPERS_ORG_ID` to `lib/constants.js` (anti-pattern #7 forbids hardcoding outside constants.js). 6th file in this commit, not 5.

**Files this commit:**
- src/hooks/usePublicTournaments.js (new, 82 lines)
- src/components/broadcast/TournamentCard.jsx (full rewrite, 80 lines)
- src/pages/RecordsPreview.jsx (targeted edit: hardcoded array → hook)
- src/styles/broadcast.css (updated `.bc-tourney-pill` rules + added team-dot/record/finalists/pulse-keyframe)
- src/lib/constants.js (added LEGACY_HOOPERS_ORG_ID)
- SKYFIRE_BUILD_QUEUE_v2.md (this entry)

**Next-wave unlock:** Wave 3c-b (per-team filter UI on /records), Wave 4 (communications architecture / parent message system).

## Apr 30, 2026 UTC — Wave 3c-a.2: /records audit fixes + Migration 031 mirror

**Shipped:** 8 audit findings from Wave 3c-a.1 closeout review + Migration 031 file mirror in a single commit. Production /records now hardened against forward risks (XSS pathway, silent failures, timezone display) and computes hero stats from live data.

**Audit fixes (8 of 16 findings — see audit doc for triage):**
- BUG-1 (P1, security): Replaced `dangerouslySetInnerHTML` in `BroadcastHeroHeader` with a clean two-prop API (`headline` + `accent`). Eliminated the XSS pathway before any non-literal caller surfaces it. Public /records was the trigger — needed it gone now, not "later when Wave 3b ships."
- BUG-2 (P1, UX): `usePublicTournaments` errors now surface in `RecordsPreview` mirroring the teams error pattern. No more silent empty timeline on RLS/network failures.
- BUG-4 (P2, defense in depth): `useTeams` accepts optional `orgId` and applies `.eq('org_id', orgId)` when provided. RecordsPreview passes `LEGACY_HOOPERS_ORG_ID`. When Phase 6 generalizes `teams_select_public`, client-side filter prevents cross-org leak.
- BUG-6 (P2, perf hygiene): `useTeamRecords` summary wrapped in `useMemo`. Avoids the future trap of summary recomputing every render.
- BUG-7 (P2, correctness): `formatGameDate` anchored to `America/New_York` (venue TZ for both pilot orgs). Game dates now consistent for viewers in any timezone — no more "Apr 12 game showing as Apr 13 to Sydney users."
- BUG-9 (P3, freshness): Hero stat values and tags now computed from live data — Tournament Champs (sum of Champions placements), Nationals Qualified (sum of teams in tournaments matching /nationals/i), Active Teams (teams.length), Games (count(published game_results)).
- BUG-10 (P3, brittleness): `FEATURED_TEAM_NAME = '11U Girls'` hardcoded string replaced with `sort_order === 1` lookup + `teams[0]` fallback.
- BUG-16 (P3, a11y): `document.title` set to "Records — Legacy Hoopers" on mount, restored on unmount.

**Migration 031 file mirror:** Hotfix applied via Supabase MCP earlier today (April 30, 2026 UTC). Closes RLS gap where anon couldn't read `tournament_teams` join rows on /records public page. Repo now in sync with DB.

**Deferred from audit (intentional):**
- BUG-3 (N+1 hook batching): YAGNI at 5 teams. Revisit at 50+.
- BUG-5 (Promise.resolve wrap): Cosmetic consistency. Existing hooks pass lint.
- BUG-8 (AbortController): No rapid prop changes today. Fix in Wave 3c-b filter UI.
- BUG-11 (placement badge defaults): Schema only has Champions/Finalists/NULL. YAGNI.
- BUG-12 (hex validation): All teams have valid 6-char hex; DB-side validation belongs at insert time.
- BUG-13 (.bc-tourney-pill default): Intentional Wave 3c-a.1 redesign, not a bug.
- BUG-14 (TEAM_COLORS dead code): Sweep separately.
- BUG-15 (streak null result): Publish workflow blocks NULL result. YAGNI.

**Files this commit:**
- supabase/migrations/031_public_rls_for_tournament_teams.sql (new)
- src/components/broadcast/BroadcastHeroHeader.jsx (BUG-1)
- src/pages/RecordsPreview.jsx (BUG-2, 7, 9, 10, 16)
- src/hooks/useTeams.js (BUG-4)
- src/hooks/useTeamRecords.js (BUG-6)
- SKYFIRE_BUILD_QUEUE_v2.md (this entry)

**Note: broadcast.css not touched.** BUG-1's cobalt accent reuses the existing `.bc-hero-h1 b` rule (already in CSS at line 66). The new component outputs a `<b>` element; no new class needed.

**Evidence:**
- Lint clean (0 errors, 7 pre-existing warnings)
- Build clean (111.93 KB gzipped main, +0.18 KB delta)
- /records anon path verified pre-commit (Migration 031 already live in DB)

**Next-wave unlock:** Wave 3c-b (per-team filter UI on /records, including AbortController per BUG-8), Wave 4 (communications architecture).

## Apr 30, 2026 UTC — Parent home Records integration (anti-drift catch-up)

**Shipped (this commit + retroactively documenting commit 4b74c29):**
Two-step parent home update consolidating the Records integration:

**Commit 4b74c29 (earlier today):** Added a tappable "Records" link card on the parent home page between MY TEAMS and THIS WEEK sections. Single-line button styled with `--em-*` tokens, navigates to `/records`. Build queue update was skipped on that commit — anti-drift catch-up included here per Rule 18.

**This commit:** Wired MY TEAMS team cards to live `useTeamRecords` data by editing the existing `ParentHomeTeamCard` sub-component in place. Parents now see real W-L + streak (e.g. "5-2 · W1") inline on the home page instead of the placeholder "0-0". Reworded the Records link to "View full season records" — primary record info now lives inline; the link is honest "see more" drill-down to the full /records broadcast view (tournament timeline, all 5 teams, championship badges).

**UX rationale:** Frank flagged that bouncing to /records and hitting back was friction. Inline records solve it: parents don't need to navigate away for basic team standing. /records becomes the rich shareable view, not a required workflow stop.

**Deviation from prompt:** prompt template assumed inline JSX in the MY TEAMS section and proposed creating `src/components/parent/TeamRecordRow.jsx`. The MY TEAMS section already uses a dedicated sub-component (`src/components/home/ParentHomeTeamCard.jsx`, the horizontal pill), so per Step 1's guidance ("prefer editing that file") I edited it in place. No new file, no new directory. `summary.record` and `summary.streak` are pre-formatted strings from useTeamRecords (not separate wins/losses fields), used directly.

**Files this commit:**
- src/components/home/ParentHomeTeamCard.jsx (added useTeamRecords + live record/streak rendering)
- src/pages/ParentHomePage.jsx (Records link text reworded)
- SKYFIRE_BUILD_QUEUE_v2.md (this entry)

**Files in commit 4b74c29 (referenced for completeness):**
- src/pages/ParentHomePage.jsx (Records link button added)

**Evidence:** Lint clean (0 errors, 7 pre-existing warnings), build clean (111.65 KB gzipped main, slightly smaller than before due to shorter link text). Verified parent home renders live W-L + streak inline; Records link reworded; navigation to /records still works.

**Known limitation (deferred):** N+1 query pattern (BUG-3 from Wave 3c-a.2 audit) — each ParentHomeTeamCard fires its own Supabase query. Acceptable at parent's typical 1-2 teams. Revisit when admin/coach surfaces consume similar lists at higher counts.

## Backlog — Apr 30, 2026 (for tomorrow's framing session)

Frank flagged: "Teams section also has records that need to be updated. Need to make sure all these pages and schedules and records in multiple tabs make sense and if min/med/max is deployed everywhere. Seems like tons of overlap."

### Concrete backlog items
- **TeamsPage records integration** — list rows on `/teams` should consume `useTeamRecords(team.id)` and render live W-L + streak (same hook as MY TEAMS strip on parent home, same hook as `/records` page). Likely a single-file edit to whatever sub-component renders each row.
- **TeamDetailPage records integration** — single team page should show full record + game log, not just schedule + roster. Could reuse `TeamIdentityCard` + `GameLogRow` from broadcast/.
- **Coach home build (Wave Y per §8)** — `CoachHomePage` TODAY section is still a placeholder ("NowSection coach variant ships next"). Three role-specific homes need parity.

### Density (Min/Med/Max) audit
Currently deployed on **one** surface: NextUpCard router on parent home (`useDensity('parent-now')`). NOT on: `ThisWeekRow`, `ParentHomeTeamCard`, `TournamentCard`, `TeamIdentityCard`, `GameLogRow`, `EventCard`, `CompactCard`, TeamsPage rows, TeamDetailPage. CLAUDE.md §16.2 says "density propagates everywhere" — currently aspirational. **Decision needed:** extend density to all list/card surfaces (significant work), or scope it to NEXT UP only and update §16.2 to match reality.

### Overlap map (where the same data renders in multiple places)

| Data | Surfaces | Question |
|------|----------|----------|
| Team records (W-L, streak) | MY TEAMS strip, `/records` cards, TeamsPage rows (todo), TeamDetailPage (todo) | Which is the source-of-truth view? Others = previews. |
| Single event (full detail) | NEXT UP card, ScheduleListing row, EventDetailPage | NEXT UP is "the action card", schedule is "the calendar", detail is "the deep view". Roles clear; styling consistent? |
| Event list | THIS WEEK (parent home, 7-day glance), SchedulePage (full season, filterable) | Mostly redundant. THIS WEEK is a preview; could it deep-link to filtered SchedulePage instead? |
| Tournament | `/records` timeline, TournamentsPage admin, TeamDetailPage Tournaments tab | Three views, three audiences (parent/admin/coach). Visual unification possible? |
| Density chevron | `<DensityToggle sectionKey="...">` on NEXT UP | Doesn't exist on other sections. Inconsistency. |

### Navigation metaphor inconsistency
- `EventDetailPage` uses `?tab=X` query → scroll-to-anchor (not real tabs, just sectioned long-scroll).
- `RecordsPreview` has no tabs — flat sections.
- `SchedulePage` has filter chips (kid filter, type filter).
- `TeamDetailPage` may have its own pattern.

Three different "navigate within a page" patterns. Standardizing or naming them deliberately (tabs vs filters vs anchors) would help mental model.

### Recommended framing question for tomorrow
**"What does each role see at /, /schedule, /teams, /records, /events/:id, and which surface is canonical for each data type?"** Once that map is locked, density and overlap clean up naturally — preview surfaces shrink, canonical surfaces get full data, redundant surfaces either deep-link or get scoped differently.

## Apr 30, 2026 UTC — IA Map v1 wrap-up

**Shipped:** Two cleanup changes falling out of Ember IA Map v1 (locked this morning):

1. **/records-preview retired** — replaced route with `<Navigate to="/records" replace />`. External links (email templates, archived parent messages) won't 404. RecordsPreview.jsx kept (Case A — same component renders both routes; only the duplicate route path is gone).

2. **CLAUDE.md §16.2 scoped honestly** — density (Min/Med/Max) is now scoped to NowSection on parent + coach home pages. `useDensity` hook + `user_preferences.card_density` JSONB storage stay intact for future extension. Other surfaces ship one well-tuned density. This replaces the prior "everywhere" aspiration that was true on exactly 1 of ~9 candidate surfaces. Heading also renamed from "Density propagates everywhere" → "Density (NowSection-scoped)" so the section title stops contradicting its body.

**IA Map v1 decisions (referenced for next session):**
- Decision 1: THIS WEEK on parent home → SLIM to today + tomorrow + inline RSVP (Wave 3d-b) — window flavor still pending Frank confirm (2-day strict / 3-day strict / adaptive / count-based)
- Decision 2: Density → RETREAT (this commit)
- Decision 3: /records-preview retirement (this commit)

**Wave 3d sequence (recommended momentum order):**
- 3d-f: this commit ✓
- 3d-c: TeamsPage rows wired to useTeamRecords
- 3d-d: TeamDetailPage records section
- 3d-b: Slim THIS WEEK + inline RSVP (today+tomorrow)
- 3d-a: NEXT UP card shows date
- 3d-e: /schedule forward-week scrolling

**Open items deferred:**
- CLAUDE.md:545 implementation gate checklist still asks "Density-aware? (16.2)" — narrowed in scope by this commit but left as-is since the question is still valid for NowSection features. Reword to "Density-aware where applicable? (16.2)" if you want strictness.
- IA Map v1 matrix lists `/players/:id` and `/profile` routes that don't exist in src/App.jsx today (closest match: `/account` → AccountPage). Aspirational or strike?

**Files this commit:**
- src/App.jsx (route redirect + Navigate import)
- CLAUDE.md (§16.2 replaced)
- SKYFIRE_BUILD_QUEUE_v2.md (this entry)

**Note: did not use `git add -A`.** Pre-existing untracked items (rides-audit-source.zip, EMBER_MASTER_INDEX_v3.md, WAVE_3A_PROMPT_v2.md) stay untracked per established session pattern. Three files explicitly staged.

## Apr 30, 2026 UTC — Wave 3d-a: NEXT UP date display

**Shipped:** NEXT UP card on parent home now shows the event date in addition to time, with formatting tuned per density variant:

- **MAX:** full date `Thu, Apr 30 · 2:00 PM` (and end-time suffix kept: `… - 4:00 PM` when `event.end_at` is present)
- **MED:** short date `Thu Apr 30 · 2:00 PM` — newly added; previously MED conveyed when-ness only via the top-right countdown badge
- **MIN:** relative date `Today · 2:00 PM` / `Tomorrow · 6:30 PM` / `Mon · 5:00 PM` (within 7 days) / `May 14 · 9:00 AM` (beyond) — replaces the previous `{countdown} · {clockTime}` line

**Why per-variant:** MAX is a detail card with room. MED is default density (per §16.2), needs the date compact. MIN is glance — relative dates read fastest when the event is soon, which is the typical "next up" case. The MIN swap retains the `urgencyClass` hue cue (driven by `secondsUntil` from `useNow()`), so visual urgency remains even though the literal countdown text is gone.

**Date helpers (extended file, not new):** added to `src/lib/formatters.js` next to the existing `formatTime` / `formatCountdown`:
- `formatEventDateMax(startAt)` → `"Sat, May 3 · 2:00 PM"`
- `formatEventDateMed(startAt)` → `"Sat May 3 · 2:00 PM"`
- `formatEventDateMin(startAt)` → relative-first per spec above

All three anchored to `America/New_York` via `toLocaleDateString({ timeZone })`, matching the established pattern in `tournamentBriefing.js` and the BUG-7 ET anchor from Wave 3c-a.2. Day-comparison for "Today / Tomorrow" uses `toLocaleDateString('en-CA', { timeZone: NY_TZ })` to get a stable NY-local YYYY-MM-DD key — a parent on Pacific time at 11:30 PM PT still sees the next morning's ET game labelled "Tomorrow."

**Structural surprise during inspection:** prompt assumed files at `src/components/home/NextUpCard*.jsx`; they actually live in `src/components/schedule/` (router `NextUpCard.jsx` + `NextUpCardMin/Med/Max.jsx` + shared `NextUpCardInfo.jsx` for `WhenRow` / `GameInfo`). Density values are `'minimal' | 'medium' | 'maximum'`, not `min/med/max`. MAX already rendered the date via `WhenRow` from `NextUpCardInfo` — so the MAX work was a separator swap (`,` → ` · `) by routing `WhenRow` through `formatEventDateMax`, not a fresh add.

**Files this commit:**
- src/lib/formatters.js (95 lines, was 46 — added NY_TZ const + 3 helpers)
- src/components/schedule/NextUpCardInfo.jsx (48 lines, was 47 — WhenRow uses formatEventDateMax)
- src/components/schedule/NextUpCardMed.jsx (140 lines, was 137 — When row inserted between team row and location row)
- src/components/schedule/NextUpCardMin.jsx (48 lines, was 55 — countdown state + useEffect + clockTime variable removed; aria-label updated to use the same date label)
- SKYFIRE_BUILD_QUEUE_v2.md (this entry)

NextUpCardMax.jsx itself was not edited — its rendered output changed via the shared WhenRow.

**Per-variant rendered samples (today = Apr 30, 2026, ET):**

| Horizon | MIN | MED | MAX |
|---|---|---|---|
| today 2 PM ET | `Today · 2:00 PM` | `Thu Apr 30 · 2:00 PM` | `Thu, Apr 30 · 2:00 PM` |
| tomorrow 6:30 PM ET | `Tomorrow · 6:30 PM` | `Fri May 1 · 6:30 PM` | `Fri, May 1 · 6:30 PM` |
| Mon May 4, 5 PM ET (4 days out) | `Mon · 5:00 PM` | `Mon May 4 · 5:00 PM` | `Mon, May 4 · 5:00 PM` |
| Thu May 14, 9 AM ET (14 days out) | `May 14 · 9:00 AM` | `Thu May 14 · 9:00 AM` | `Thu, May 14 · 9:00 AM` |

**Verification:** lint clean (0 errors, same 7 pre-existing warnings); build clean (111.63 KB gzipped main, unchanged from prior commit); all touched files ≤150 lines.

**Wave 3d sequence:**
- 3d-f: ✓ shipped (96332ac, IA Map v1 wrap-up)
- 3d-a: ✓ this commit
- 3d-b: Slim THIS WEEK + inline RSVP (next — still pending Frank's window-flavor confirm: 2-day strict / 3-day strict / adaptive / count-based)
- 3d-c: TeamsPage rows wired to useTeamRecords
- 3d-d: TeamDetailPage records section
- 3d-e: /schedule forward-week scrolling

**Note: did not use `git add -A`.** Same untracked items as last commit stay untracked. Five files explicitly staged.

## Apr 30, 2026 UTC — Wave 3d-b: Slim THIS WEEK to 48h + inline RSVP

**Shipped:** Parent home THIS WEEK section reduced to an adaptive 48-hour window with inline RSVP on each row.

**Window logic:** events with `start_at >= now AND start_at < now + 48h`, sorted ascending. Adaptive (not calendar-week-bound) — a Friday 8 PM event appears starting Wednesday 9 PM. Implemented inline in `ParentHomePage.jsx` (no dedicated hook); local var renamed `weekEnd` → `cutoff` and `thisWeek` → `next48h` / `filteredNext48h` so reading the source matches the new mental model. The lower bound moved from `todayStart` (midnight today) to `now` — events earlier today that have already started no longer appear, matching the NextUp "future events only" pattern.

**Section header:** `THIS WEEK` → `NEXT 48 HOURS`. Same 11px uppercase tracking-wide tertiary-color treatment as `MY TEAMS`. No item count was rendered on the prior header — none added.

**Empty state:** kept (matches existing pattern on parent home — `<TextEmptyState>`). Heading reworded `Nothing this week` → `Nothing in the next 48 hours`. The "Your next event is Saturday, May 3" follow-up message is preserved (and is now structurally more useful — the 48h window will be empty more often than the 7-day window was).

**RSVP UI: Case D applied.** Inside `ThisWeekRow`, the read-only RSVP status pills (`✓ Aiden`, `? Mia`) were replaced with `<ChildRsvp child={c} eventId={event.id} compact={true} />` — one per child on the team, rendered below the existing pills row. ChildRsvp at compact=true is the same component already used by `NextUpCardMed` (at compact=false), so the pattern was established. The confirmed-state UI of ChildRsvp (`✓ Aiden Going` + Change button) preserves the at-a-glance status the read-only pills used to provide. RSVP rows are suppressed for cancelled/completed events. The team-children filter (`myChildren.filter(c => c.teamId === event.team_id)`) lives inside `ThisWeekRow` via `useAuth()` directly — same approach NextUpCardMed uses, no prop drilling.

**Why slim:** parent home becomes a decision surface, not a browsing surface. 7-day browsing belongs on `/schedule` (Wave 3d-e). Cuts overlap between home and schedule per IA Map v1 Decision 1.

**Files this commit:**
- `src/pages/ParentHomePage.jsx` (150 lines, was 150 — window math, header, empty state heading, prop change to ThisWeekRow; net wash on line count thanks to the hook-import drop offsetting the comment block)
- `src/components/schedule/ThisWeekRow.jsx` (84 lines, was 89 — dropped `childRsvps` prop + `RSVP_PILL` map + read-only pill render; added `useAuth` + `ChildRsvp` imports + interactive RSVP block)
- `src/hooks/useChildRsvpsForEvents.js` — **DELETED** (orphaned: only consumer was the read-only pills now removed; verified via `grep -rn useChildRsvpsForEvents src/` returning no remaining references)
- `SKYFIRE_BUILD_QUEUE_v2.md` (this entry)

**Known follow-up (NOT in scope here):** ChildRsvp's `save()` is **not** strictly optimistic — it `setSaving(true)` → `await supabase.upsert` → `setResponse(value)` post-confirm, so during slow networks the user sees button opacity 0.6 but no immediate state flip. The module-level `responseCache` survives unmount/remount, so cross-page navigation feels instant after the first save. The 48h slim means at most a handful of rows visible, so a slow round-trip is now bounded — deferring the optimistic-flip rewrite until a real network-pain report.

**Structural surprise during inspection:** the prompt assumed the THIS WEEK list lived in a dedicated section component or a hook; it's actually inline in `src/pages/ParentHomePage.jsx` (filter + sort + render in one file). The window is computed inline, not via a hook. `useChildRsvpsForEvents` was a single-consumer hook that only existed to feed the read-only pills — Case D made it dead code. Deleting it (vs leaving an unused export) keeps the hook directory honest. Also: `ChildRsvp` already had a `compact={true}` mode that fits exactly this use case — no new component or compact variant needed. The pattern was already there waiting.

**Verification:** lint clean (0 errors, same 7 pre-existing warnings); build clean (111.27 KB gzipped main, down from 111.63 KB — savings from deleting `useChildRsvpsForEvents` and `RSVP_PILL` constants); both modified files ≤150 lines.

**Wave 3d sequence:**
- 3d-f: ✓ shipped (96332ac, IA Map v1 wrap-up)
- 3d-a: ✓ shipped (4156f73, NEXT UP date display)
- 3d-b: ✓ this commit
- 3d-c: TeamsPage rows wired to useTeamRecords (next)
- 3d-d: TeamDetailPage records section
- 3d-e: /schedule forward-week scrolling

**Note: did not use `git add -A`.** Same three pre-existing untracked items stay untracked. Four files in this commit (3 modified + 1 deleted via `git rm`).

## Apr 30, 2026 UTC — Wave 3d-b.1: NEXT 48 HOURS keeps in-progress events visible until end_at

**Shipped:** Hotfix to Wave 3d-b. NEXT 48 HOURS lower bound moved from `start_at >= now` to `endT > now`, where `endT` defaults to `start_at + 90min` when `end_at` is null.

**Why:** 3d-b's filter was too aggressive. Frank smoke-tested and flagged: a 6 AM practice ending at 7:30 AM disappeared from home at 6:01 AM, leaving a parent at 6:30 AM with no signal that "yes, Charlie's at the gym right now, RSVP was confirmed." In-progress events now stay visible until they actually end, then drop off cleanly.

**Boundary mirrors `ThisWeekRow.isCompleted` exactly.** ThisWeekRow line 32 already used `endMs = event.end_at ? ... : startMs + 90 * 60 * 1000` and line 35 set `isCompleted = endMs < now`. The new filter uses the same 90-min default so the home list never includes an event that ThisWeekRow would render as Completed (greyed out, RSVP suppressed).

**Production data sanity check (events table, last 60 days, 140 rows):**

| Metric | Value |
|---|---|
| total events | 140 |
| `end_at IS NULL` | **0** |
| practice (n=89) avg duration | 78 min |
| game (n=17) avg duration | 60 min |
| tournament (n=34) avg duration | 616 min (multi-game days) |
| p50 duration across all | 60 min |

So the 90-min fallback is purely defensive — every event in production today has `end_at` populated. If a single-time entry ever does sneak in (manual SQL insert, external sync), 90 min covers practice (78 avg) and game (60 avg) reasonably; tournament (616 avg, multi-game days) would be undersold but the row would just disappear an hour into a 10-hour day, not visually wrong.

**Files this commit:**
- `src/pages/ParentHomePage.jsx` (150 lines, was 150 — single filter block change)
- `SKYFIRE_BUILD_QUEUE_v2.md` (this entry)

**Implementation note:** filter logic kept inline-ternary on the `endT` computation to fit at the 150-line cap (file was already at 150 from 3d-b's window-rationale comment). Reads as `return (a.end_at ? new Date(a.end_at).getTime() : startT + 90 * 60 * 1000) > now && startT < cutoff;`. If a future commit lifts unrelated complexity out of this file, the inline ternary can be split back to a named `endT` const for clarity — flagged here for the reader.

**Wave 3d sequence:**
- 3d-f: ✓ shipped (96332ac, IA Map v1 wrap-up)
- 3d-a: ✓ shipped (4156f73, NEXT UP date display)
- 3d-b: ✓ shipped (7065c7b, slim THIS WEEK + inline RSVP)
- 3d-b.1: ✓ this commit
- 3d-c: TeamsPage rows wired to useTeamRecords (next)
- 3d-d: TeamDetailPage records section
- 3d-e: /schedule forward-week scrolling

**Note: did not use `git add -A`.** Two files explicitly staged.

## Apr 30, 2026 UTC — Wave 3d-c: TeamsPage + TeamDetailPage records wired

**Shipped:** Live W-L · streak on TeamsPage rows + records summary on TeamDetailPage. Same `useTeamRecords` hook used by yesterday's MY TEAMS strip wiring (commit 6cf5538).

**TeamsPage:** extracted the inline row JSX into `src/components/teams/TeamRow.jsx` (88 lines). Hook can't be called inside `.map()` at the page level, so the extract was forced — and it was the right move regardless. Placeholder `0-0` (was at TeamsPage.jsx:95) replaced with live `summary.record · streak` formatted exactly like ParentHomeTeamCard. The page itself dropped from 136 to 61 lines.

**TeamDetailPage:** hybrid Case A + Case B.

- **Case A — TeamHeaderCard pill:** the `TeamHeaderCard.jsx:39` placeholder `0-0` (in the team header pill row) was a quiet placeholder I missed in the prompt-listed spots. Swapped the literal for a `record` prop. TeamHeaderCard stays presentational — TeamDetailPage calls `useTeamRecords(teamId)` once and passes `summary.record` down.
- **Case B — new `<TeamRecordsSection>`:** added a five-cell stats card (PPG / Allowed / Diff / Win% / Games) directly below the header card. Mirrors TeamHeaderCard's existing three-cell stats row pattern (same typography, tokens, borders). New file `src/components/teams/TeamRecordsSection.jsx` (51 lines). Loading state shows `—` per cell so layout doesn't shift on data arrival.

**`formatDiff` duplication noted, not yet fixed:** the same `formatDiff` helper now lives in `TeamIdentityCard.jsx` (broadcast/) and `TeamRecordsSection.jsx` (teams/). Worth consolidating to `src/lib/formatters.js` next pass — flagged for the 3d-g polish bundle, not this commit.

**Files this commit:**
- `src/pages/TeamsPage.jsx` (61 lines, was 136 — row extracted, navigate import dropped)
- `src/pages/TeamDetailPage.jsx` (126 lines, was 121 — useTeamRecords hook + record prop + new section)
- `src/components/roster/TeamHeaderCard.jsx` (61 lines, was 60 — `record` prop, default `'—'`, comment updated)
- `src/components/teams/TeamRow.jsx` (NEW, 88 lines)
- `src/components/teams/TeamRecordsSection.jsx` (NEW, 51 lines)
- `SKYFIRE_BUILD_QUEUE_v2.md` (this entry)

**N+1 note:** TeamsPage now fires one Supabase query per team row (5 teams = 5 queries). Same N+1 pattern as MY TEAMS strip on parent home (`ParentHomeTeamCard`) and the /records SEASON SNAPSHOT cards. Three surfaces, one shape — single fix coming in 3d-f via `useOrgTeamRecords(orgId)` (one query, JS group, return `{ [teamId]: summary }`). TeamDetailPage uses a single-team hook call so it's not part of the N+1 problem.

**Structural surprise:** `TeamHeaderCard.jsx:39` had its own `0-0` placeholder — pre-flight grep on TeamsPage and TeamDetailPage didn't surface it because the literal lives in the imported component, not in the pages themselves. Caught by reading TeamHeaderCard while planning Case B placement. Worth flagging for future audits: when grepping for placeholders, also include the components a page renders.

**Verification:** lint clean (0 errors, same 7 pre-existing warnings); build clean (111.66 KB gzipped main, +0.39 KB vs prior — TeamRecordsSection adds ~0.4 KB); all touched files ≤150 lines.

**Wave 3d sequence:**
- 3d-i (renumbered from 3d-f, IA Map wrap-up): ✓ shipped (96332ac)
- 3d-a: ✓ shipped (4156f73, NEXT UP date display)
- 3d-b: ✓ shipped (7065c7b, slim THIS WEEK + inline RSVP)
- 3d-b.1: ✓ shipped (b141a9f, in-progress event hotfix)
- 3d-c: ✓ this commit
- 3d-d: Truth-pass (date lies, ties counting, NY-anchor consolidation, cancelled-event filter)
- 3d-e: Hook discipline (error surfacing, loading-on-refetch)
- 3d-f: N+1 collapse via useOrgTeamRecords
- 3d-g: Polish bundle (filter-aware empty state, titleCount, skeleton initial load, formatGameDate + formatDiff consolidation, tournament card placement+record)
- 3d-h: /schedule forward-week scrolling

**Note: did not use `git add -A`.** Same three pre-existing untracked items stay untracked. Five tracked files in this commit (3 modified + 2 new).

## Apr 30, 2026 UTC — Wave 3d-d: Truth pass

**Shipped:** Five silent data lies fixed in one commit. All surfaced by yesterday's records + home audit and verified via Supabase MCP pre-flight.

### Fixes

**1. groupByDate NY-anchored.** `src/lib/scheduleHelpers.js` was slicing UTC date string. Late-evening ET events grouped into the wrong day on home/schedule. Now uses `new Date(a.start_at).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })`, matching wave 3d-a's formatter pattern. Production today: 1 event affected (9U Boys Game, Apr 17 8:00 PM ET silently grouped to Apr 18 UTC). Fix is in shared lib so home + schedule + future surfaces inherit.

**1.a. formatDateHeader's `today` comparison NY-anchored too.** Inspection surface that wasn't in the prompt: `formatDateHeader` (same file) computed `today = new Date().toISOString().slice(0, 10)` — also UTC. Pre-fix this was internally consistent (key UTC + today UTC); my groupByDate change would have introduced *new* misalignment (key NY-local vs today UTC), making the "TODAY" suffix wrong during late-evening hours. Fixed in the same commit to preserve internal consistency. The prompt's Step 2 explicitly asked me to inspect downstream — this is what surfaced.

**2. Ties + null handling on useTeamRecords.** Three-branch result counting (`'W'` / `'L'` / `'T'`, skip null/void). Summary now exposes `ties`. Record formats as `W-L` when ties=0 (no behavior change for current display), `W-L-T` when ties>0. Streak: a `T` (or any non-W/L) breaks the streak; T-streaks don't render — falsy `streakKind` returns `'—'`. Production today: 0 ties — pure logic hardening. No migration, no CHECK constraint (deferred). `winPct` math left as `wins / n * 100`; with ties present, the standard `(wins + 0.5*ties) / n` formula matters — flagged for future when ties become non-zero.

**3. RecordsPreview lastUpdated derived from MAX(published_at).** Was literal `"Apr 29, 2026"` (already a day stale yesterday). New small hook `src/hooks/useLastPublishedAt.js` queries the latest `published_at` from `game_results` and returns `{ lastPublishedAt, loading }`. RecordsPreview formats NY-anchored. Hook is intentionally separate so 3d-g's relative-time extension wraps cleanly without rewriting this commit's call site. `BroadcastHeroHeader` already suppresses the line on falsy `lastUpdated` (verified at `BroadcastHeroHeader.jsx:37-38`), so passing `null` cleanly hides "Last Updated" until first publish.

**4. ParentHomePage 48h filter excludes cancelled events.** Cancelled events no longer occupy NEXT 48 HOURS real estate. Still visible on `/schedule` where browsing past/cancelled is the job. Production today: 0 cancelled events in the 48h window — pure UX hardening. Implemented as a single AND in the existing return statement to keep the file at the 150-line cap.

**5. greetingFor NY-anchored.** `Good morning/afternoon/evening` greeting now uses NY-local hour via `toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false })` parsed to int. Frank in NY sees no change; admin abroad (or QA from another tz) gets a greeting matching org-local time. Consistency with the NY-anchor pattern established in waves 3d-a, 3d-b.1, 3d-d Fix 1, and now this.

### Pre-flight via Supabase MCP

| Check | Result |
|---|---|
| game_results result distribution | W=14, L=13, T=0 |
| game_results.result column type | text (no CHECK constraint) |
| MAX(published_at) | 2026-04-29 10:40:58 UTC |
| Cancelled events in next 48h today | 0 |
| Events with UTC date ≠ NY date (last 60d) | 1 (9U Boys Apr 17 8 PM game) |

### useTeamRecords summary shape change

Before: `{ record, streak, ppg, allowed, diff, winPct, gamesPlayed }`
After:  `{ record, ties, streak, ppg, allowed, diff, winPct, gamesPlayed }`

`ties` is the only new field. Existing consumers (`ParentHomeTeamCard`, `TeamRow`, `TeamHeaderCard`, `TeamRecordsSection`, `TeamIdentityCard`, `RecordsPreview` `FeaturedGameLog`) read `record` / `streak` only — backward-compatible.

### lastUpdated rendering

- **With data** (current production: `2026-04-29T10:40:58Z`): renders `Last updated Apr 29, 2026`.
- **Without data** (e.g., new org pre-first-publish): line suppressed entirely — header omits the trailing `<p class="bc-last-updated">` rather than rendering a placeholder.

### Files this commit

- `src/lib/scheduleHelpers.js` (18 lines, was 16 — groupByDate + formatDateHeader both NY-anchored)
- `src/hooks/useTeamRecords.js` (99 lines, was 88 — three-branch + ties + tie-breaks-streak)
- `src/hooks/useLastPublishedAt.js` (NEW, 30 lines)
- `src/pages/RecordsPreview.jsx` (144 lines, was 139 — useLastPublishedAt + format + prop swap)
- `src/pages/ParentHomePage.jsx` (150 lines, was 150 — cancelled AND'd into existing return; greetingFor rewritten same-line-count)
- `SKYFIRE_BUILD_QUEUE_v2.md` (this entry)

### Structural surprise

`formatDateHeader` had its own UTC slice (`new Date().toISOString().slice(0, 10)`) for `today`. The prompt's 5 fixes didn't list it, but my groupByDate change would have *introduced* new misalignment between the (now NY-local) keys and the (still UTC) `today`, breaking the "TODAY" suffix during late-evening hours. The prompt's Step 2 instruction "any other consumer of the date key downstream must be inspected" is exactly what surfaced this. Fixed in the same commit to keep internal consistency.

### Wave 3d sequence

- 3d-i: ✓ shipped (96332ac, IA Map v1 wrap-up)
- 3d-a: ✓ shipped (4156f73, NEXT UP date display)
- 3d-b: ✓ shipped (7065c7b, slim THIS WEEK + inline RSVP)
- 3d-b.1: ✓ shipped (b141a9f, in-progress event hotfix)
- 3d-c: ✓ shipped (5d8131a, TeamsPage + TeamDetailPage records)
- 3d-d: ✓ this commit
- 3d-e: Hook discipline (error surfacing, loading-on-refetch, useTeamRecords microtask wrap)
- 3d-f: N+1 collapse via useOrgTeamRecords (3 surfaces)
- 3d-g: Polish bundle (filter-aware empty state, titleCount, skeleton initial load, formatGameDate + formatDiff consolidation, tournament card placement+record, formatRelativeTime wrapping useLastPublishedAt)
- 3d-h: /schedule forward-week scrolling

### Deferred

- CHECK constraint on `game_results.result` (W/L/T enum) — separate hardening commit, not blocking. Today's data is clean.
- `winPct` formula update for ties era — not needed today (T=0); flagged for the day a tie lands.
- Cancelled-event behavior on /schedule — current behavior (visible) is correct for that surface. No action.

**Note: did not use `git add -A`.** Same three pre-existing untracked items stay untracked. Six tracked files in this commit (4 modified + 1 new + the build queue).

## Apr 30, 2026 UTC — Wave 3d-e: Hook discipline pass

**Shipped:** Three hooks brought into pattern alignment + consumer wiring. Architectural consistency commit — no new features, no new UI surface, but every downstream consumer gets honest error UX from this point forward.

### Fixes

**1. useActivities surfaces errors.** Was catching exceptions and setting `activities = []`, masking transient network failures as empty data. Now exposes `error` state, preserves last-known-good `activities` on failure, and clears the error on each new fetch. A parent on flaky 4G keeps seeing yesterday's events with a "Couldn't refresh" banner instead of seeing the screen wiped to "Nothing in the next 48 hours."

**2. useActivities flips loading on every fetch.** Was only setting `loading = true` on first mount via the `useState` initializer (`!hasCached`); subsequent `refetch()` calls left it false. Now `setLoading(true)` runs at the top of `refetch`, so SectionShell's `isRefreshing` pulsing-dot affordance fires during background refreshes too.

**3. useTeamRecords microtask-wraps the load call.** Inner `async function load()` was called synchronously inside the effect (`load();`), so `setLoading(true)` ran in the effect body — the `react-hooks/set-state-in-effect` shape that `usePublicTournaments` and `useLastPublishedAt` already defend against. Swapped `load()` for `Promise.resolve().then(load)` — minimal-diff fix, same behavior, now consistent with the canonical pattern.

**4. ParentHomePage / NowSectionParent wire the error.** The page already destructured `error` from `useActivities` (today always `undefined`) and passed it to `<NowSectionParent>`. NowSectionParent already forwarded it to `<SectionShell>`. So **CASE A applies for the NEXT UP path** — plumbing was always there; the source just wasn't filling it. Hook fix alone made errors flow. Added one new prop (`onRetry`) on NowSectionParent → SectionShell so the SectionShell's "Try again" button gets wired to `refetch` from the page.

### Structural surprise

The prompt's CASE A/B framing assumed both NEXT UP and NEXT 48 HOURS were SectionShell consumers. **NEXT 48 HOURS is actually inline `<section>` markup in `ParentHomePage.jsx:113-145`, not SectionShell-wrapped.** It has only data/empty branches, no error state. Lifting it into SectionShell is a non-trivial refactor: the section already mixes `<ChildFilterChips>`, collapsible date-grouped lists, and a sub-empty-state with a "next event" follow-up. Out of scope for this commit (anti-drift; ParentHomePage is at the 150-line cap).

**What this means for users on a network failure during NEXT 48 HOURS data:** because Step 2 preserves last-known-good `activities`, the inline section keeps rendering yesterday's data silently while NEXT UP shows the explicit error banner. Stale-but-visible below, error-with-retry above. Reasonable first cut; future commit can lift NEXT 48 HOURS into SectionShell for parallel error rendering.

### Skeleton mask note

NowSectionParent's existing `loading={loading && myTeams.length === 0}` mask passes `loading=false` to SectionShell once `myTeams` is non-empty. Net effect: SectionShell's `isRefreshing` pulsing-dot doesn't fire on background refresh of NEXT UP today, even though Fix 2 makes the underlying `loading` truthful. Removing the mask was tempting but it's a behavior change on the skeleton-during-refresh question, not the error question this commit is about. Flagged for the 3d-g polish bundle.

### What this changes for users

- A 503 from Supabase during the parent home initial load, today: page shows "Nothing in the next 48 hours" (a lie). Tomorrow: page shows last-known data with an explicit error banner on the NEXT UP section, retry button wired.
- A successful retry: error clears, fresh data loads, no UI scarring.

### Files this commit

- `src/hooks/useActivities.js` (71 lines, was 65 — added error state + setLoading-on-refetch + preserve-last-known-good comment)
- `src/hooks/useTeamRecords.js` (102 lines, was 99 — `Promise.resolve().then(load)` wrap + 3-line comment)
- `src/components/home/NowSectionParent.jsx` (107 lines, was 106 — `onRetry` prop accepted + forwarded to SectionShell)
- `src/pages/ParentHomePage.jsx` (150 lines, was 150 — `onRetry={refetch}` added to existing prop list, same line)
- `SKYFIRE_BUILD_QUEUE_v2.md` (this entry)

### Wave 3d sequence

- 3d-i through 3d-d: ✓ shipped
- 3d-e: ✓ this commit
- 3d-f: N+1 collapse via useOrgTeamRecords (3 surfaces: MY TEAMS, /records, /teams)
- 3d-g: Polish bundle (filter-aware empty state, titleCount, skeleton initial load, formatGameDate + formatDiff consolidation, tournament card placement+record, formatRelativeTime wrapping useLastPublishedAt, **NowSectionParent loading-mask cleanup**, **NEXT 48 HOURS error rendering**)
- 3d-h: /schedule forward-week scrolling

### Deferred

- Realtime publication (Migration 039) for cross-tab cache invalidation — Phase 1 Step 5G per CLAUDE.md §16.9. Not a 3d concern.
- `useActivities` module-level cache invalidation strategy — same Phase 1 Step 5G item.
- NEXT 48 HOURS error rendering (lift inline section into SectionShell) — added to 3d-g.
- NowSectionParent loading-mask cleanup so background-refresh pulsing dot fires — added to 3d-g.

**Note: did not use `git add -A`.** Same three pre-existing untracked items stay untracked. Five tracked files in this commit (4 modified + the build queue).

## Apr 30, 2026 UTC — Wave 3d-f: N+1 collapse via useOrgTeamRecords

**Shipped:** Three N+1 query surfaces collapsed into single-query consumption. Same data, same rendered shape, fewer round-trips.

**Before:** 5 teams × 3 surfaces = up to 15 round-trips on a fully-loaded session (parent home MY TEAMS strip → /teams list → /records SEASON SNAPSHOT).
**After:** 1 round-trip per surface = 3 total. Each surface caches independently.

### Architecture

- **`src/lib/teamRecords.js` (NEW, 57 lines)** — extracted `computeSummary` from `useTeamRecords` plus `EMPTY_SUMMARY` const for placeholder-state defaults. Single source of truth for the W/L/T branching, streak walk, record formatting, and empty-state shape.
- **`src/hooks/useOrgTeamRecords.js` (NEW, 66 lines)** — fetches every published `game_results` row for an org via the `events!inner(team_id, teams!inner(org_id))` join chain in one round-trip, groups by `team_id` in JS, returns `{ byTeamId, loading, error }`. RLS chain matches Migrations 025/028 public-readable pattern, so this works for both anon `/records` and authenticated org-internal callers.
- **`src/hooks/useTeamRecords.js`** — retained for single-team consumers. Now imports `computeSummary` from the shared lib (102 → 67 lines after the extract).

**Single-query verified via MCP:** `27 rows across 5 distinct teams` for Legacy Hoopers (matches yesterday's W=14, L=13, T=0 production sample). Join chain produces correct cardinality.

### Call site swaps

**ParentHomePage + MY TEAMS strip:**
- ParentHomePage now calls `useOrgTeamRecords(orgId)` once.
- **MY TEAMS section extracted into `src/components/home/MyTeamsStrip.jsx` (NEW, 27 lines)** — page was at the 150-line cap; extracting net-saved ~5 lines so the new hook destructure + strip prop fit cleanly. Page lands back at 150 exactly.
- `ParentHomeTeamCard.jsx` is now presentational (28 lines, was 27 — added `summary` + `loading` props, dropped hook call).

**TeamsPage + TeamRow:**
- TeamsPage now calls `useOrgTeamRecords(orgId)` once, passes `summary={byTeamId[team.id]}` to each `<TeamRow>`.
- `TeamRow` is presentational (86 lines, was 88 — accepts `summary` + `loading` props, dropped `useTeamRecords` import + hook call).

**RecordsPreview + TeamCardWithStats:**
- RecordsPreview now calls `useOrgTeamRecords(LEGACY_HOOPERS_ORG_ID)` once and passes `summary={recordsByTeam[team.id]}` into each `<TeamCardWithStats>`.
- `TeamCardWithStats` (private to the page) defaults missing summaries to `EMPTY_SUMMARY` so a team with zero published results still renders a `0-0` card — same shape it would have produced before via the per-team hook's empty branch.
- `useTeamRecords(featured.id)` retained for `<FeaturedGameLog>` — it needs the actual game-list, not just summary.

### TeamDetailPage NOT migrated

Single-team page; no N+1 to solve. Still on `useTeamRecords(teamId)`. (Worth flagging: TeamDetailPage now triggers two queries on load — the page-level useTeamRecords AND the page's TeamHeaderCard surface that uses summary. Same hook, both call. Minor; not worth refactoring inline today.)

### Network observation (logical, not run)

Before this commit, opening `/records` (5 teams) issued 5 separate `game_results` queries (one per `<TeamCardWithStats>`) plus 1 for `useTeamRecords(featured.id)` plus 1 for the totalGames count = ~7 queries against `game_results`. After this commit: 1 `useOrgTeamRecords` + 1 `useTeamRecords(featured)` + 1 totalGames = 3 queries. Same on parent home MY TEAMS strip (was 5, now 1) and `/teams` (was 5, now 1).

### Files this commit

- `src/lib/teamRecords.js` (NEW, 57 lines)
- `src/hooks/useOrgTeamRecords.js` (NEW, 66 lines)
- `src/components/home/MyTeamsStrip.jsx` (NEW, 27 lines)
- `src/hooks/useTeamRecords.js` (67 lines, was 102 — `computeSummary` moved to shared lib)
- `src/components/home/ParentHomeTeamCard.jsx` (28 lines, was 27 — presentational)
- `src/components/teams/TeamRow.jsx` (86 lines, was 88 — presentational)
- `src/pages/ParentHomePage.jsx` (150 lines, was 150 — strip extracted, new hook wired; net wash on lines)
- `src/pages/TeamsPage.jsx` (63 lines, was 61 — new hook wired)
- `src/pages/RecordsPreview.jsx` (147 lines, was 144 — new hook + EMPTY_SUMMARY default in TeamCardWithStats)
- `SKYFIRE_BUILD_QUEUE_v2.md` (this entry)

### Structural surprises during inspection

- **Sub-component extraction was needed for ParentHomePage.** The page was at the 150-line cap from prior commits. The MY TEAMS strip was 8 lines of inline JSX; extracting it to `MyTeamsStrip.jsx` net-saved ~5 lines, exactly the room needed for the new `useOrgTeamRecords` destructure. Without the extract the page would have overflowed — the prompt anticipated this.
- **`AuthContext` already exposed `orgId`.** No context change needed; just had to add `orgId` to the destructure on each consuming page (ParentHomePage and TeamsPage). RecordsPreview uses the hardcoded `LEGACY_HOOPERS_ORG_ID` constant (per the multi-tenant deferral in the records review).
- **TeamRow's `idx` prop** stays for the `sf-stagger-${idx + 1}` className but is unused for any data purpose now. Kept as-is to preserve the staggered fade-in animation.

### Wave 3d sequence

- 3d-i through 3d-e: ✓ shipped
- 3d-f: ✓ this commit
- 3d-g: Polish bundle (filter-aware empty state, titleCount, skeleton initial load, `formatGameDate` + `formatDiff` consolidation, tournament card placement+record, `formatRelativeTime` wrapping `useLastPublishedAt`, NowSectionParent loading-mask cleanup, NEXT 48 HOURS error rendering)
- 3d-h: /schedule forward-week scrolling

**Note: did not use `git add -A`.** Same three pre-existing untracked items stay untracked. Ten tracked files in this commit (3 new + 6 modified + the build queue).

## Apr 30, 2026 UTC — Wave 3d-g: Helpers consolidation (titleCount + formatGameDate dropped per pre-flight)

**Shipped:** Two of the four planned fixes. Pre-flight surfaced that two were not actually applicable — kept honest by dropping them rather than fake-shipping.

### Fixes (scope reduced after pre-flight)

**1. formatGameDate consolidation — DROPPED.** Pre-flight grep found a single call-site (defined `RecordsPreview.jsx:22`, consumed `:139` by `FeaturedGameLog`). Per the prompt's own guidance ("If grep finds 1 call-site: DROP this fix. Single-use formatter is fine where it lives"), this isn't a duplication — it's a co-located helper. Premature abstraction risk avoided.

**2. formatDiff consolidation — SHIPPED.** Pre-flight confirmed byte-identical duplication: `TeamIdentityCard.jsx:61` and `TeamRecordsSection.jsx:6` defined the same function:
```js
function formatDiff(d) {
  if (d == null) return '—';
  const n = Number(d);
  if (Number.isNaN(n)) return '—';
  return n > 0 ? `+${n}` : `${n}`;
}
```
Canonical now in `src/lib/formatters.js`. Both consumers import from there. Logic preserved verbatim — no behavior change. (Note on `formatDiff(0)` returning `"0"` rather than `"0.0"` or `"+0"`: the code relies on `computeSummary` having pre-applied `.toFixed(1)`. So in practice `diff` is `0` only when wins == losses on n >= 1 with same scores. Edge case but consistent with prior in-place behavior.)

**3. formatRelativeTime helper — SHIPPED.** New pure utility in `src/lib/formatters.js`. NY-anchored. Returns `'Just now'` / `'X minutes ago'` / `'X hours ago'` / `'X days ago'` within 7 days; absolute date string thereafter. Returns `null` on null/undefined input so consumers can suppress rendering. The helper does NOT bake in any "Updated " prefix — `BroadcastHeroHeader` already prepends `"Last updated "` in its JSX (`BroadcastHeroHeader.jsx:38`). RecordsPreview consumes the helper, replacing the inline `toLocaleDateString` call.

**4. titleCount prop on SectionShell — DROPPED.** Pre-flight found that **the prop already exists** in `SectionShell.jsx:24` (destructured) and is rendered at lines 49-51 with `typeof titleCount === 'number' && ...`. Likely added during original Step 5B Phase 1 work. The two wiring sites named in the prompt — `/records` SEASON SNAPSHOT (`<section className="bc-section">`) and `/teams` (inline `<h1>` page header) — **don't use SectionShell at all**. Wiring titleCount there requires lifting those pages onto SectionShell, a structural refactor that doesn't fit this commit's "zero behavior change" framing. Deferred to a future commit that does the lift. The prop is available for any current/future SectionShell consumer that wants to use it.

### What this changes for users

The records-page "Last updated" line now reads relative-time within 7 days instead of an absolute date.

**Before** (3d-d): `Last updated Apr 29, 2026`
**After** (today, Apr 30): `Last updated 1 day ago` (verified by running `formatRelativeTime('2026-04-29T10:40:58Z')` against current time — returned `"1 day ago"` exactly as expected)
**After 7+ days**: falls back to absolute date `Last updated Apr 22, 2026`

Helper edge cases verified via node REPL against the production timestamp:

| Input | Output |
|---|---|
| `null` | `null` (suppresses rendering) |
| 30s ago | `"Just now"` |
| 5min ago | `"5 minutes ago"` |
| 3hr ago | `"3 hours ago"` |
| 1d ago | `"1 day ago"` |
| 2d ago | `"2 days ago"` |
| 10d ago | `"Apr 20, 2026"` (NY-anchored absolute fallback) |
| prod (`2026-04-29T10:40:58Z`) | `"1 day ago"` |

Rest is invisible — pure code organization. Two consumers of `formatDiff` now import from one canonical helper.

### Files this commit

- `src/lib/formatters.js` (126 lines, was 95 — added `formatDiff` + `formatRelativeTime`)
- `src/components/broadcast/TeamIdentityCard.jsx` (61 lines, was 66 — local `formatDiff` removed, import added)
- `src/components/teams/TeamRecordsSection.jsx` (45 lines, was 51 — local `formatDiff` removed, import added)
- `src/pages/RecordsPreview.jsx` (146 lines, was 147 — inline `toLocaleDateString` swapped for `formatRelativeTime` call)
- `SKYFIRE_BUILD_QUEUE_v2.md` (this entry)

### Structural surprises during inspection

- **`titleCount` already existed in SectionShell.** Probably added during original Step 5B work or earlier. The home-page review I wrote on Apr 30 noted this exact thing (E3): "SectionShell supports `titleCount` (line 24, tabular-nums)" — but the prompt was framed as if it needed to be added. Pre-flight caught the discrepancy.
- **Wiring sites for titleCount don't use SectionShell.** `/records` uses broadcast-style `<section className="bc-section">`; `/teams` uses inline page-level `<h1>`. To wire titleCount on either, those sections would need to be lifted onto SectionShell — a behavior-changing refactor that doesn't belong in this "zero-behavior-change" commit. Logged for the future commit that does the lift.
- **`formatDiff(0)` returns `"0"`, not `"0.0"`.** Preserved verbatim from the duplicates. Relies on `computeSummary` having pre-applied `.toFixed(1)` so diff is already a 1-decimal float when nonzero. Edge case at exactly 0 is rare in practice and the existing behavior wasn't bugged — just lightly weird.

### Wave 3d sequence

- 3d-i through 3d-f: ✓ shipped
- 3d-g: ✓ this commit (scope reduced — 2 of 4 fixes shipped honestly)
- 3d-g.1 (visible UX polish): filter-aware empty state, skeleton initial load, tournament card placement+record, NowSectionParent loading-mask cleanup, NEXT 48 HOURS error rendering
- 3d-g.2 (titleCount wirings): would need /records SEASON SNAPSHOT and /teams page-header lifts onto SectionShell first
- 3d-h: /schedule forward-week scrolling

**Note: did not use `git add -A`.** Same three pre-existing untracked items stay untracked. Five tracked files in this commit (4 modified + the build queue).

## Apr 30, 2026 UTC — Wave 3d-g.1: Fresh-eyes audit cleanup

**Shipped:** Five fixes from CC's post-3d-g audit. Three real bugs (one CC introduced today via 3d-e), one latent UTC trap eliminated, one line-cap relief refactor.

### Fixes

**B1. useOrgTeamRecords exports refetch.** Hook restructured to canonical `useCallback` + `useEffect` pattern (matches useActivities). Returns `{ byTeamId, loading, error, refetch }`. TeamsPage pull-to-refresh now fires both `refetch()` (team list via usePrograms) AND `refetchRecords()` in parallel via `Promise.all`. ParentHomePage and RecordsPreview consumers unchanged — `refetch` exported but unused on those surfaces, forward-compatible. Dropped the `cancelled` flag for consistency with useActivities.

**B5. useActivities orgId guard before loading flip.** 3d-e moved `setLoading(true)` to the top of `refetch` so background refreshes flip honestly. That fired during the auth-bootstrap window when `orgId` was briefly undefined → instant true→false flicker on the SectionShell skeleton. Fix: check `orgId` first; no-op on loading state if missing. Real fetches still honest. CC introduced this regression today; CC fixed it today.

**B3. NowSectionParent drops the loading mask.** Was `loading={loading && myTeams.length === 0}`, suppressing the SectionShell pulsing-dot affordance on background refresh for users with teams (the dominant case). 3d-e queue called this out as deferred; now landed. SectionShell distinguishes initial-load skeleton (`loading && !hasChildren`) from background-refresh pulsing-dot (`loading && hasChildren`) internally — the consumer doesn't need to mask.

**E3. firstNameFrom + greetingFor extracted to `src/lib/greetings.js`.** Pure-functional helpers, **verbatim relocation** (no edits to behavior). ParentHomePage was at the 150-line cap from prior 3d commits and structurally brittle. Page drops from 150 → **141** — nine lines of headroom restored for future commits.

**B2. event.date / end_date / start_time projections dropped from useActivities.** Pre-flight grep confirmed zero consumers across `src/`. Same UTC-slice anti-pattern fixed in 3d-d for `groupByDate`. Removing the projection entirely eliminates the latent trap a future consumer would inherit. Hook header comment updated to reflect the new reality.

**Scope adjustment from prompt:** prompt instructed "Drop the .map entirely." Pre-flight surfaced that **`.location_name` has 3 active consumers** — `src/lib/icalHelpers.js:38`, `src/components/schedule/EventCard.jsx:86,89,90,93`. Dropping the entire .map would break ical export and event card rendering. Kept the .map but reduced to a single-key projection: `({ ...e, location_name: e.location || null })`. Three other projected keys (`date`, `start_time`, `end_date`) dropped as planned.

### What this changes for users

- Pull-to-refresh on /teams now updates BOTH the team list AND the records summaries (was only the team list).
- No skeleton flicker on parent home during auth bootstrap.
- SectionShell pulsing-dot now fires correctly on background refresh of NEXT UP for the dominant case (users with teams).
- Everything else invisible — pure code organization.

### Files this commit

- `src/hooks/useOrgTeamRecords.js` (62 lines, was 66 — useCallback restructure, refetch export, dropped cancelled-flag scaffolding)
- `src/hooks/useActivities.js` (66 lines, was 71 — orgId guard reordered + projection trimmed + comment updated)
- `src/components/home/NowSectionParent.jsx` (107 lines, was 107 — single-line mask change)
- `src/lib/greetings.js` (NEW, 13 lines — verbatim verbs)
- `src/pages/ParentHomePage.jsx` (141 lines, was 150 — import greetings, drop inline; **9 lines of headroom restored**)
- `src/pages/TeamsPage.jsx` (63 lines, was 63 — refetchRecords wired into Promise.all)
- `SKYFIRE_BUILD_QUEUE_v2.md` (this entry)

### Structural surprises during inspection

- **`firstNameFrom` and `greetingFor` are duplicated in `src/components/admin/AdminGreeting.jsx`** with slightly different signatures (e.g., AdminGreeting's `greetingFor(date = new Date())` is NOT NY-anchored — same bug 3d-d fixed on parent home). E3 only extracted ParentHomePage's verbatim. Anti-drift kept me from touching AdminGreeting; logged as follow-up. Once consolidated, AdminHomePage gets the NY-anchor fix for free.
- **`.location_name` cannot be dropped from useActivities.** Three downstream consumers (icalHelpers + EventCard). Prompt assumed all .map projections were unused. Kept .map with reduced projection; documented above.
- **Existing `.start_at` order syntax preserved** in useOrgTeamRecords (`{ foreignTable: 'events', ascending: true }` per useTeamRecords pattern). Prompt suggested `'events(start_at)'` shorthand; kept proven canonical form to avoid risk of breaking the working query.

### Wave 3d sequence

- 3d-i through 3d-g: ✓ shipped
- 3d-g.1: ✓ this commit
- 3d-g.2: titleCount wirings (requires SectionShell migration on /records and /teams pages — structural)
- 3d-h: /schedule forward-week scrolling

### Audit items deferred (logged for future)

- B4 — formatDateHeader('unknown') → "Invalid Date". Cosmetic. Filter upstream.
- B6 — formatDiff(0) returns "0" not "0.0". Pre-existing quirk; low priority.
- B7 — useTeamRecords stale JSDoc post-3d-f. Docs only.
- E1 — Module cache for useOrgTeamRecords + useLastPublishedAt. Real perf win, separate commit.
- E2 — useRefetchOnVisible symmetry on useOrgTeamRecords. Now unblocked by B1; next commit candidate.
- E4 — Kindness microcopy on useActivities errors. Separate error-mapping commit.
- E5 — formatRelativeTime live-tick. Records is drive-by; low priority.
- E6 — TeamDetailPage double useTeamRecords call.
- E7 — Build queue file size. Out of scope.
- E8 — start_at unused-in-projection. PostgREST likely requires it for .order; verify-then-skip.
- **NEW: AdminGreeting.jsx duplicates the helpers** (different signatures, missing NY-anchor). Consolidate when touching admin surfaces next.

**Note: did not use `git add -A`.** Same three pre-existing untracked items stay untracked. Seven tracked files in this commit (5 modified + 1 new + the build queue).

## Apr 30, 2026 UTC — Wave 3d-g.2: RSVP tap-to-clear + pulsing-dot diagnostic

**Shipped:** RSVP tap-active-state-to-clear behavior. Pulsing-dot affordance investigated read-only — wiring is correct end-to-end after 3d-g.1; remaining issue is fetch-too-fast-to-perceive, not a bug.

### RSVP tap-to-clear

**Before** — two-mode UI: when `response` was null, ChildRsvp showed three outlined pill buttons. When `response` was set, it swapped to a confirmation row (`"✓ Aiden Going"` + a "Change" button). The "Change" button only flipped local `setResponse(null)` — **never wrote to the DB**, so the next focus-refetch read the prior answer back from the server. **Latent bug**: there was no real path to clear an RSVP from the UI.

**After** — single-mode toggle group: three pills always visible. Active pill renders filled (background = pill color, text = inverse). Inactive pills render outlined. Tapping the active pill DELETES the `event_rsvps` row (verified via Supabase MCP: `event_rsvps.response` is `NOT NULL`, so cleared = row deleted). Tapping an inactive pill upserts that response. Tapping the same pill twice is now the explicit clear path.

| User action | Old behavior | New behavior |
|---|---|---|
| Tap "Going" (currently null) | Set to 'going' | Set to 'going' |
| Tap "Going" (currently 'going') | Hidden by confirm-row mode | **DELETE row → null** |
| Tap "Going" (currently 'not_going') | Hidden by confirm-row mode | Switch to 'going' |
| Tap "Maybe" (currently 'maybe') | Hidden by confirm-row mode | **DELETE row → null** |
| Tap "Not Going" (currently 'not_going') | Hidden by confirm-row mode | **DELETE row → null** |
| Tap "Change" (legacy button) | Clears local state only (lie) | N/A — button removed |

**Scope adjustment from prompt:** prompt mentioned only Going / Not Going. Reality has **three** values (Going / Maybe / Not Going). Tap-to-clear works on all three identically. The prompt also said "the two pills already exist; they gain new behavior" — but the pills weren't visible in the answered state at all. Required a UI restructure (drop the confirmation-row branch, drop the "Change" button, restructure to always-visible pills with active-state styling). Net component dropped the second render branch and the `CONFIRMED` dictionary; gained a `clearRsvp` async + `handleClick` dispatcher. 102 lines, was 90 — 12 lines net add for the new behavior.

`aria-pressed={active}` added on each pill for screen-reader semantics. `disabled={saving}` preserved with `opacity: 0.6` visual cue.

### Pulsing-dot diagnostic

**Outcome: (a)** — affordance is wired correctly end-to-end after 3d-g.1's mask drop. Likely cause for "I never see the dot" is fetch-too-fast-to-perceive, not a bug.

**Wiring verified:**
- `useRefetchOnVisible.js` is a working hook: `document.visibilityState === 'visible'` triggers `refetch?.()`.
- `ParentHomePage.jsx:30` calls `useRefetchOnVisible(refetch)` where `refetch` is from `useActivities`.
- After 3d-e: `useActivities.refetch()` flips `setLoading(true)` on every call.
- After 3d-g.1: orgId guard prevents the auth-bootstrap flicker; `NowSectionParent` no longer masks `loading`.
- `SectionShell.jsx:41`: `const isRefreshing = loading && hasChildren`. Line 52: `{isRefreshing && (<span className="animate-pulse" .../>)}`.

**Chain:** tab focus → useRefetchOnVisible fires → useActivities.refetch → setLoading(true) → NowSectionParent passes truthful `loading={loading}` → SectionShell sees loading=true + hasChildren=true → isRefreshing=true → pulsing dot renders. All correct.

**Why the user reports not seeing it:**
1. **Fetch is fast.** A warm-cache Supabase round-trip is ~50-200ms. The `animate-pulse` Tailwind animation has a 2-second cycle (0% → 50% opacity → 100%). At 100ms, the dot renders for ~5% of one cycle — barely perceptible. To make it visible the dot needs a minimum-display duration (e.g., "render for at least 400ms even if loading flips false sooner") — that's a separate UX commit.
2. **MY TEAMS doesn't have a dot at all.** The MY TEAMS strip is rendered inline (via `<MyTeamsStrip>`), not wrapped in SectionShell. So the only place the dot can fire on parent home is NEXT UP. And `useOrgTeamRecords` (which powers MY TEAMS) doesn't have a `useRefetchOnVisible` wiring — it stays stale on tab return entirely. That's audit item E2 from yesterday, now unblocked by 3d-g.1's B1 (refetch export). Logged for next commit.
3. **NEXT 48 HOURS doesn't have a dot.** Inline `<section>` markup, no SectionShell. Same structural deferral as the 3d-g.1 NEXT 48 HOURS error rendering note.

**No code change in this commit.** Pulsing-dot affordance is correctly wired for the one surface that uses SectionShell (NEXT UP); the other two parent-home sections need structural lifts to participate. Both are logged in the deferred items.

### Files this commit

- `src/components/schedule/ChildRsvp.jsx` (102 lines, was 90 — restructured to always-show-pills + DELETE-row clear path)
- `SKYFIRE_BUILD_QUEUE_v2.md` (this entry)

### Locked decisions from this session

- **NEXT UP Min variant target:** `"Today · May 3 · 2:00 PM"` (relative + absolute + time)
- **UPCOMING window:** user-selectable toggle (48h / 7 days) saved in `user_preferences.upcoming_window` — ship in 3d-g.3
- **/teams list rows:** two-line layout. Line 1: team name. Line 2: `"11U · AAU · 5-2 · W1 · 27.6 PPG · 21.3 PA"`
- **MY TEAMS strip carousel:** stays one-line (horizontal pill, no room)
- **Team detail page:** merge TeamRecordsSection into TeamHeaderCard hero block

### Wave 3d sequence

- 3d-i through 3d-g.1: ✓ shipped
- 3d-g.2: ✓ this commit
- 3d-g.3: NEXT UP Min date + UPCOMING toggle + user_preferences migration (deferred to tomorrow — DB migration + new UI scope)
- 3d-g.4: Team detail page merge + /teams list two-line stats (next today)
- 3d-h: /schedule forward-week scrolling

### Audit items deferred (logged for future)

- **NEW E9: Pulsing-dot minimum-display duration.** Render the dot for at least 400ms even if `loading` flips false sooner. Otherwise sub-200ms refreshes never visibly fire the affordance. Tiny CSS-or-state change.
- **E2 from yesterday now unblocked by 3d-g.1's B1.** `useOrgTeamRecords` needs `useRefetchOnVisible(refetchRecords)` wiring on parent home + /teams + /records so MY TEAMS / SEASON SNAPSHOT / team list don't stay stale on tab return.
- **B5 (latent): Change button never wrote to DB.** Pre-existing bug now eliminated by the always-pills restructure.
- All prior deferred items from 3d-g.1 still standing.

**Note: did not use `git add -A`.** Same three pre-existing untracked items stay untracked. Two tracked files in this commit (1 modified + the build queue).

## Apr 30, 2026 UTC — Wave 3d-g.4: Team detail merge + /teams two-line rows

**Shipped:** Two layout restructures. /teams list rows go two-line with full stats. TeamDetailPage's hero block absorbs the records strip; the standalone TeamRecordsSection card is gone.

### /teams list rows go two-line

**Before:** single-line row with `[color stripe] 11U Girls    11U  AAU  5-2 · W1` pills + hardcoded `[A][S][C]` placeholder avatars + `+7` overflow chip + chevron.

**After:** clean two-line row:

```
[color stripe] 11U Girls
               11U · AAU · 5-2 · W1 · 27.6 PPG · 21.3 PA
```

Line 1: team name (16px, semibold, primary). Line 2: full stats meta (12px, tertiary). Bullet-separated. The placeholder avatars + chevron are gone — they were hardcoded `['A','S','C']` letters with `+7`, not real player data; clearing them frees the row to breathe and removes a year-long lie.

Edge case: teams with `gamesPlayed = 0` show only `11U · AAU` on line 2 (skip the stats portion). Loading state renders the same — meta line populates progressively as data arrives, no skeleton flicker.

Tap target: `minHeight: 56px` preserved on the outer button + `padding: 10px 16px` on inner content. Total row height ~62px in practice. ≥ 44px floor preserved.

### TeamDetailPage hero merge

**Before:** /teams/:id rendered three stacked sections: TeamHeaderCard (identity) → TeamRecordsSection (separate "SEASON STATS" card with 5 cells) → RosterSection. Records were "buried" between the header and roster.

**After:** TeamHeaderCard absorbs the 5-cell strip directly inside the hero. New layout:

```
┌─[color stripe]─────────────────────────────────┐
│ 11U Girls                              [11U]   │
│ 11U · AAU · 5-2 · W1                           │
│ ──────────────────────────────────             │
│ 27.6   21.3   +5.3   71%   7                   │
│ PPG    Allowed Diff  Win%  Games               │
└────────────────────────────────────────────────┘
```

Roster moves up the page — it's now the second section instead of the third. The `TeamRecordsSection.jsx` file deleted (was 45 lines, single consumer). Its 5-cell strip + Cell helper inlined into TeamHeaderCard.

**Decision: option (a) — inline cells in TeamHeaderCard, no sub-component extraction.** TeamHeaderCard at 79 lines (was 61) — well under the 150 cap. Sub-component (TeamHeroStats.jsx) wasn't needed.

**Surface change beyond the prompt mockup:** the prior 3-cell roster strip (Players / Roster / Academy) was dropped from TeamHeaderCard. The mockup didn't include it; keeping it would have stacked two cell-strips with two horizontal-rules and visually overloaded the hero. Player counts are still accessible — implicit in the RosterSection's player list right below the hero. (If `players.length` numerics are desired in the hero, separate commit.)

`players` prop also dropped from TeamHeaderCard — no longer computes rosterCount/academyCount. TeamDetailPage passes only `team`, `summary`, `loading`.

### Files this commit

- `src/components/teams/TeamRow.jsx` (51 lines, was 88 — two-line restructure, drop hardcoded avatars + chevron, drop `loading` prop)
- `src/components/roster/TeamHeaderCard.jsx` (79 lines, was 61 — meta line + 5-cell strip + Cell helper inline + formatDiff import; drop pill row + 3-cell roster strip + `players` prop)
- `src/components/teams/TeamRecordsSection.jsx` — **DELETED** (45 lines, single consumer; merged into TeamHeaderCard)
- `src/pages/TeamDetailPage.jsx` (123 lines, was 126 — drop import + render + props swap on TeamHeaderCard)
- `src/pages/TeamsPage.jsx` (63 lines, was 63 — drop unused `recordsLoading` from destructure; lint cleanup after dropping TeamRow's loading prop)
- `SKYFIRE_BUILD_QUEUE_v2.md` (this entry)

### Structural surprises during inspection

- **TeamRow had hardcoded placeholder avatars** (literally letters `'A'`, `'S'`, `'C'` + `+7` chip rendered as if they were player initials). Not real data — never were. Dropped during the two-line restructure since the prompt mockup excluded them and they were a year-long visual lie.
- **CIRCUIT_LABELS still duplicated 3x** (TeamHeaderCard, TeamRow, AdminTeamsPage). Touching two of them in this commit — could have consolidated. Out of scope; flagged for future. Same pattern as the AdminGreeting consolidation note from 3d-g.1.
- **Roster strip dropped from TeamHeaderCard.** The prompt mockup excluded it, and stacking the new 5-cell records strip below the existing 3-cell roster strip would have been visually heavy. Player count info isn't lost — RosterSection renders the full list right below.
- **One lint pass needed** after the initial edit: dropping `loading` from TeamRow's signature surfaced an unused-vars error on TeamsPage's destructure (`recordsLoading`). Dropped from destructure too; second lint pass clean.

### Wave 3d sequence

- 3d-i through 3d-g.2: ✓ shipped
- 3d-g.4: ✓ this commit
- 3d-g.3: NEXT UP Min date + UPCOMING toggle + user_preferences migration (deferred to tomorrow — DB migration + new UI scope)
- 3d-h: /schedule forward-week scrolling

**Note: did not use `git add -A`.** Same three pre-existing untracked items stay untracked. Six tracked files in this commit (4 modified + 1 deleted via `git rm` + the build queue).

---

## Wave 2 — Coach Quick-Score (locked Apr 30, 2026)

**Status:** IA Map v1 locked. Pre-flight pending. Code lands across 6 sub-waves at 1-2 commits per session.

**Canonical doc:** `WAVE_2_IA_MAP_v1.md` at repo root.
**Decisions:** EMBER_MASTER_INDEX_v3.md decisions #69-87.

**Premise:** Today `/records` is read-only. There is no UI to enter game results. 14 already-played Spring 2026 games sit unscored. Wave 2 ships the score-entry pipeline end-to-end — entry sheet, draft + publish, edit + audit, quarter mode, backfill queue, multi-game tournament flow.

### Sub-wave roadmap (6 commits, 4-5 sessions)

| Wave | Scope | Files (est.) |
|---|---|---|
| 2A | Migration NNN — `game_result_edits` audit table + column gaps + RLS (incl. public SELECT for audit). Pre-flight item 0 = query MAX(version) before drafting migration text. | 1 migration |
| 2B-C | Score entry sheet (final-only mode) + Save Draft + Publish flow combined + POG dropdown + result auto-derive + override radio. Coach + admin permission. | 3-4 React + 1 hook |
| 2D | Edit + audit. "Edit" button on published GameLogRow → opens entry sheet pre-populated → save creates audit row + updates `game_results`. "Updated by X at Y" inline on `/records`. | 2-3 files |
| 2E | Quarter mode toggle + 4-input quarter UI + auto-sum + JSONB write + GameLogRow quarter display. Single commit: write + display together. | 2 files |
| 2F | Backfill queue at `/coach/games-to-score`. Lists past unscored games per filter from Decision 76. Each row links to entry sheet. | 2-3 files |
| 2G | Multi-game tournament "Score next game" button on publish success. Detects `event.tournament_id`, finds next unscored game in same tournament. | 2 files |

(Numbering note: original IA Map roadmap had 2A-2F; the edit+audit wave was 2C and renumbered above as 2D after Frank merged 2B+2C entry+publish into a single commit.)

### Pre-flight checklist before Wave 2A

Run via Supabase MCP. Findings reported before drafting Migration NNN.

0. **Migration number.** `SELECT MAX(version) FROM supabase_migrations.schema_migrations`.
1. `game_results` columns + constraints + RLS policies. Confirm: `quarter_scores` JSONB, `player_of_game_id`, `coach_highlight`, `published_at`, `our_score`, `opponent_score`, `opponent_name`, `result`.
2. `coaching_assignments` columns + active rows for Legacy Hoopers org.
3. `event_type` distinct values (confirm `'game'` is the filter target).
4. `events.status` distinct values (confirm `'cancelled'` / `'postponed'` are the exclusion targets).
5. Existing `game_results` row count for Legacy Hoopers + published vs draft split.
6. Current RLS shape on `game_results` (public SELECT today? match for audit table).
7. Tournament FK shape: `events.tournament_id` exists? `tournaments` table available for next-game lookup?

### Deferred (explicit non-scope for Wave 2)

- Per-player box score (separate future wave, post-2026 per CLAUDE.md §16.12)
- Tournament batch-entry view
- Push notifications (Wave 10)
- Per-game rule overrides (Migration 015)
- Statement Win / Run of Play editorial pills (Wave 4)
- Highlight cards, multi-paragraph game recaps (Wave 4)
- Rotation Planner integration (Phase 2 separate)
- Multi-tenant `/records` (Phase 7-B)
- Coach home page build (separate wave; Wave 2F ships standalone route)

### Open questions

**(none — all 28 load-bearing decisions resolved as of v1.1 amendment, April 30, 2026)**

If Wave 2A pre-flight surfaces a new question (column missing, RLS shape unexpected, etc.), surface in IA Map's "Open questions" section before shipping any code.

---

## Wave 2 IA Map v1.1 amendment (April 30, 2026)

Fresh-eyes audit on v1 surfaced 9 holes (B1-B9) + 8 enhancements (E1-E8) + 4 cross-cutting observations. Frank resolved all of them. v1.1 rolled them in. Net result: doc grew from 19 to 28 locked decisions; sub-wave count effectively dropped from 6 to 5 distinct waves (2B and 2C combined per Decision 3).

### Amendments

- **9 bug resolutions:** quarter display format locked (B1), audit batched read pattern locked (B2), POG roster source = all team players including academy (B3), event_type pre-flight item kept (B4), override-result UX hidden by default (B5), 140-char CHECK constraint added to Migration NNN (B6), audit author = denormalized editor_name (B7), live updates = eventual-consistency for v1 (B8), route protection coach+admin (B9).
- **8 enhancements:** audit table schema proposed in IA Map (E1), POG display = muted line below score (E2), opponent name pre-fill from event (E3), mobile numeric inputs locked (E4), Migration 015 reference de-asserted (E5), concurrent edit = last-write-wins (E6), §16.13 pre-merge gate per wave (E7), backfill achievement-without-score added to pre-flight (E8).
- **4 cross-cutting:** 2B-C.1 hotfix pattern explicit, backfill POG dropdown = current roster + footer note, master index NEXT ACTION QUEUED updated to Wave 2A pre-flight (was stale at Wave 3a), Hard Rule #9 updated to explicit `git add` per file + `.gitignore` enforcement.

### Master index appends

Decisions #88-103 added to `EMBER_MASTER_INDEX_v3.md` after Wave 2 IA Map v1's #69-87.

### Process learning surfaced by the audit

Drafting in compliance mode (transcribe Frank's resolutions cleanly) is not the same as adversarial mode (find what's missing). The v1 IA Map drafted in compliance mode missed 17 holes; the audit pass switched modes and found them. Going forward: pre-mortem each decision before writing it down (*"if the engineer hits this decision tomorrow, what's the first thing they'd ask?"*) and run MCP queries during draft (not just in pre-flight) to eliminate "pre-flight may surface" hedges.

### Files this commit

- `WAVE_2_IA_MAP_v1.md` (in-place v1 → v1.1 update; 28 decisions, expanded pre-flight, refined commit roadmap)
- `EMBER_MASTER_INDEX_v3.md` (appended decisions #88-103 + Hard Rule #9 update + NEXT ACTION QUEUED update)
- `.gitignore` (added persistent untracked items per Decision 103)
- `SKYFIRE_BUILD_QUEUE_v2.md` (this entry)

### Wave 2 sequence (post-amendment)

- 2A: Schema + audit table + RLS (next prompt — Wave 2A pre-flight)
- 2B-C: Score entry + Save Draft + Publish + edit (combined per Decision 3)
- 2D: Edit + audit + display (with batched read per Decision 91)
- 2E: Quarter mode + display
- 2F: Backfill queue at /coach/games-to-score
- 2G: Multi-game tournament "Score next game"

**Note: did not use `git add -A`** (per updated Hard Rule #9). Four tracked files explicitly staged. Persistent untracked items (`rides-audit-source.zip`, `WAVE_3A_PROMPT_v2.md`) now in `.gitignore`, no longer surfacing in `git status`.
