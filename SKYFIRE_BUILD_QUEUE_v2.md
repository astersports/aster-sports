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
- 📋 **Migration 024** — Data corrections bundle (DESTRUCTIVE)
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
- CSS namespace rename: `--sf-*` → `--em-*` throughout codebase
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

# END OF BUILD QUEUE v2

**Maintainer note:** When you ship a feature, update this document IMMEDIATELY. Add to the SHIPPED section above with evidence citation. Don't wait for session end.
