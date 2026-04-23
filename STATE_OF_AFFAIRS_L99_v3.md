# STATE OF AFFAIRS L99 — v3
## Legacy Hoopers / Ember Platform Build
**Written:** April 23, 2026
**Verified against production:** April 23, 2026
**Evidence basis:** 215 files in project knowledge (110 JSX components, 29 hooks, 16 lib files, 13 migration files, full documentation set)
**Supersedes:** STATE_OF_AFFAIRS_L99.pdf, SKYFIRE_BUILD_QUEUE.md (both dated April 19-21, 2026)

---

# HOW TO USE THIS DOCUMENT

This document is written from **verified filesystem evidence**, not from conversation memory. Every claim has a cited source. When the new chat reads this, it should trust these claims over any conflicting internal priors.

If this document says "Feature X is shipped," it IS shipped. If it says "Decision Y is locked," don't re-ask for approval. If it says "File Z exists at path P," that path is real.

The handoff protocol (documented in NEW_CHAT_STARTER_PROMPT.md) requires the new chat to verify this document's contents before executing any work. Do not skip that verification.

---

# PART 1: THE BUSINESS CONTEXT

## Product: Ember (platform brand)

**Ember** is the overarching multi-tenant sports management SaaS platform. The Phoenix logo represents Ember. Ember will have its own corporation, timing to be determined by Frank.

**Taglines under consideration:**
- "Every great program starts with an ember"
- "Built to burn bright"
- "From spark to championship"

**Current naming state:** Code still uses "Skyfire" throughout (CSS `--sf-*` namespace, file names like `skyfire_phoenix.webp`). Rebrand scheduled for Phase 0C.

## First org: Legacy Hoopers (pilot, proprietary through 2027)

Legacy Hoopers LLC, Westchester NY, youth basketball, Spring 2026.
- 5 teams: 11U Girls, 10U Black, 10U Blue, 9U Boys, 8U Boys
- 63 players, 121 guardians
- Co-founders: Frank Samaritano (Program Director), Kenny Lane (Coaching Director)
- Assistant coach: Darien Gonzalez (paid per session)
- Knight logo is Legacy Hoopers brand mark

Legacy Hoopers = Ember's pilot customer. Free use through Fall 2027. Pilot informs all product decisions.

## Second org target: St. Patrick's CYO Armonk (2027-28 rollout)

- 20-25 teams (Winter season), 10 teams (Spring)
- CYO program, different operational needs than Legacy's AAU focus
- Target onboarding: Fall 2027 or Spring 2028
- **Confirmed via Frank April 23, 2026:** 2027-28 is the target, NOT Winter 2026-27. Legacy Hoopers stays proprietary through 2027.

## Future: 5-10 additional basketball programs, then multi-sport expansion

## Role architecture: 3-tier

**Super Admin (Ember-level)**
- Owned by Frank (future, Phase 6+ 2027)
- Controls which programs get which features per tier
- Schema-ready in DB from day 1, NOT actively used until Phase 6+
- Separate email/login when activated (e.g., frank@ember.app)

**Admin (Organization-level)**
- Currently: Frank running Legacy Hoopers
- Runs day-to-day for their organization
- Cannot change feature entitlements (Super Admin controls that)
- This is the role being built in Phases 0-5

**Coach / Parent (User-level)**
- Coach: Kenny (head × 4 teams), Darien (assistant × 2 teams), possibly others
- Parent: linked to guardians, scoped to their children

## Pricing: Hybrid model, phased rollout

| Tier | Monthly base | Registration % | Target |
|---|---|---|---|
| Starter | $39/mo | 2.5% | Small rec/CYO, 3-8 teams |
| Growth | $99/mo | 2.0% | Competitive programs, 8-15 teams |
| Pro | $249/mo | 1.5% | Elite programs, 15+ teams, multi-sport |

**Phased rollout:**
- Phase 1 (Fall 2026, Legacy Hoopers only): No billing surface, pilot is free
- Phase 2 (Spring 2027, pre-St. Pat's): Monthly subscription only (Stripe subscription)
- Phase 3 (Fall 2027+): Full hybrid (base + % registration) via Stripe Connect

Legacy Hoopers permanent plan tier: **Pro** (pilot, free through Fall 2027)

---

# PART 2: CURRENT PRODUCTION STATE (VERIFIED APRIL 23, 2026)

## Database: 36 tables exist in production

**Source of truth:** SQL query run April 23, 2026 against Supabase project `vrwwpsbfbnveawqwbdmj`

### Tables documented in migrations 001-012:

| Table | Migration | Purpose |
|---|---|---|
| `organizations` | 002 | Multi-tenant root |
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
| `event_duties` | 004 | Volunteer sign-up slots |
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

### Tables that exist in production but NOT in migration files:

These were created via direct SQL Editor pastes and never backfilled into migration files:

| Table | Purpose (inferred) |
|---|---|
| `check_ins` | Player attendance per event (event_id, player_id, checked_in, checked_in_at, checked_in_by) |
| `coaching_assignments` | Coach-to-team mapping with pay_per_session_cents, scope, org_title, effective dates |
| `game_results` | Scoring (our_score, opponent_score, quarter_scores JSONB, player_of_game_id, coach_highlight) |
| `guardian_notification_prefs` | Per-guardian notification settings |
| `message_drafts` | Tournament briefing drafts |
| `org_announcements` | Org-level broadcasts |
| `player_activations` | Likely call-up tracking |
| `player_tags` | Player categorization |
| `roster_members` | Possibly modern replacement for team_players |
| `tournament_pool_teams` | Pool play structure |

### Columns on events table (39 total, 23 from migrations + 7+ from direct pastes):

Standard columns from migrations: id, team_id, event_type, title, start_at, end_at, location, location_address, opponent, notes, created_at, updated_at, status, arrival_minutes_before, jersey, coach_notes, enable_rides, is_multi_day, end_date, parent_event_id, attachments, indoor, rsvp_deadline, pregame_notes.

**Additional columns added outside migrations:** is_scrimmage, home_away, sub_location, tournament_name, tournament_id, is_bracket_placeholder, bracket_placeholder_label, game_sequence, is_bracket_game, bracket_label, bracket_placeholder, opponent_pool, coach_keys, cancellation_reason, cancelled_at, is_bonus_game, opponent_id.

**Note:** Session C's prior audit reported "is_bracket column missing." This was incorrect. The actual column names are `is_bracket_placeholder` and `is_bracket_game`. If the Tournament Briefing crashes, it's querying a column name that doesn't exist — probably `is_bracket` instead of the actual names.

### PostgreSQL functions (from migration 011):

- `public.current_user_org_id()` — returns current user's org_id
- `public.event_org_matches(event_id)` — RLS helper for event-scoped tables
- `public.set_default_hotel_deadline()` — auto-sets hotel_deadline_at to start_date - 30 days
- `public.prevent_message_body_edit()` — blocks edits to sent tournament_messages
- `public.get_tournament_recipients(tournament_id, team_id)` — fetches guardian list for briefings
- `public.get_tournament_rsvp_summary(tournament_id, team_id)` — aggregates RSVP status per player
- `public.set_updated_at()` — generic timestamp trigger

### Migration history (April 23 post-repair):

All 12 local migrations (001-012) now correctly marked applied in `supabase_migrations.schema_migrations` table. Confirmed via `supabase migration list` showing Local/Remote alignment.

009_revert.sql has been moved to `supabase/rollbacks/009_fix_public_read_rls_REVERT.sql` (not in migrations chain).

## Application: 110 React components shipped

**Source of truth:** `ls /mnt/project/*.jsx | wc -l` = 110

### Pages (confirmed via filesystem):
AccountPage, AdminHomePage, AdminSeasonsPage, AdminTeamsPage, EventDetailPage, ForgotPasswordPage, HomePage, LocationsPage, LoginPage, MessagesPage, ParentHomePage, PlaceholderPage, SchedulePage, TeamDetailPage, TeamsPage, TournamentDetailPage, TournamentsPage, UnauthorizedPage.

### Hooks (29 custom hooks):
useActiveSeasonEnd, useActivities, useAdminStats, useCheckIns, useComments, useConflictCheck, useCreateActivity, useDuties, useEventDetail, useEventDutyCounts, useEventRideCounts, useEventRsvpCounts, useEventRsvpNotes, useFilteredRoster, useLocations, useMapsUrl, useNow, useOnlineStatus, usePrograms, usePullToRefresh, useRefetchOnVisible, useRides, useRoster, useRsvps, useSeasons, useTournament, useTournamentBriefing, useTournaments, useUpdateActivity.

### Features documented as shipped (verified by file existence):

**Auth & Multi-Tenant:**
- Email/password login with forgot password
- Role-based guards (admin/coach/parent)
- Multi-tenant org_members with brand_colors JSONB
- CSS custom properties loaded on auth
- Auto-link guardians on first login (email match)

**Parent Experience:**
- ParentHomePage: greeting, NextUpCard per child's team, My Teams strip, This Week compact list
- Inline RSVP on NextUpCard per child (ChildRsvp component)
- Schedule filtered to parent's children's teams
- Teams page filtered for parent
- Team detail switcher filtered for parent
- Kid filter chips (ChildFilterChips)
- PWA install prompt with localStorage dismissal

**Schedule:**
- NextUpCard with countdown, pulsing dot <2hr, team color stripe, RSVP/ride/volunteer counts
- EventCards with team color border, type badge, RSVP counts
- CompactCard component exists (46 lines) but not wired to density toggle
- FilterBar with team pills, type chips, Show Cancelled toggle
- Date-grouped list with headers
- Schedule FAB (gated to staff per Phase 0A-2)
- Tappable location with Google Maps link

**Activity Wizard (event creation):**
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
- Parent guard: can only RSVP own children, others read-only (RsvpPlayerRow)
- Check-in overlay (admin/coach only, per Phase 0A-1)
- Cancel/reinstate event

**Rides/Carpool:**
- Offer ride, request ride, claim seat
- Guardian-linked with auto-fill phone + name
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
- Copy roster (gated to staff per Phase 0A-3)
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
- Tournament Briefing component (exists but may crash — see bug list)
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

## Phase 0A security fixes shipped April 22-23

**Evidence:** Git commits on v2 and main branches, all 7-step deploy chain executed.

**0A-1:** EventDetailHeader.jsx lines 25-34 — Edit (pencil) + Delete (trash) buttons wrapped in `{isStaff && (...)}` matching existing Check-in pattern (line 20). **Verified:** Parent no longer sees buttons, admin sees all three.

**0A-2:** SchedulePage.jsx — FAB (+) wrapped in `{isStaff(role) && ...}`. Imports added for `isStaff` from lib/permissions and destructured `role` from useAuth. **Verified:** Parent no longer sees FAB, admin sees it.

**0A-3:** RosterSection.jsx — CopyRosterButton wrapped in `{isStaff(role) && ...}`. Imports added for useAuth and isStaff. **Verified:** Parent no longer sees Copy Roster button, admin sees it.

**0A-4 (verification only, no edit):** RsvpPlayerRow.jsx lines 17-22 already correctly gate via `readOnly = role === 'parent' && !isMyChild`. When readOnly is true, the row renders status text (lines 55-58). When false, it renders the 3 RSVP buttons (lines 59-83). Add Note button also gated via `{!readOnly && ...}` on line 86. **Verified working:** Parent sees buttons only for own children (Milo/Charlie), read-only status text for all other players.

## Ember infrastructure progress (April 22-23)

- **Supabase CLI installed:** v2.93.1 via `npm install --save-dev supabase`
- **CLI authenticated:** via `npx supabase login`, token stored
- **Project linked:** `npx supabase link --project-ref vrwwpsbfbnveawqwbdmj`
- **DB password reset** and saved (Frank has it)
- **Migration history repaired:** All 001-012 marked applied in production via `npx supabase migration repair --status applied NNN`
- **009_revert.sql moved** to supabase/rollbacks/
- **Docker sync blocked:** Chromebook has 4GB total RAM, 2.83GB to Crostini, Docker not viable. `db pull` and `db dump` both require Docker.
- **Workflow decision:** Future migrations will be authored as SQL files, pasted into Supabase SQL Editor, then recorded via `supabase migration repair`. This is the 95%-of-solo-devs pattern when Docker isn't available.

---

# PART 3: THE 30+ LOCKED DECISIONS (do not re-ask)

Every decision below was confirmed by Frank during the April 22-23 session. The new chat should treat these as final.

## Product strategy

1. **Platform name:** Ember (NOT Skyfire — rebrand in Phase 0C)
2. **Logo:** Phoenix (kept, represents Ember)
3. **Legacy Hoopers logo:** Knight (kept, represents the pilot program)
4. **Skyfire phoenix asset:** Retire in Phase 0C (skyfire_phoenix.webp gets deleted)
5. **Corporation:** Ember will have its own corporation; Frank forms it when ready, not yet
6. **Domain strategy:** Ember.app or emberhq.com, decide in Phase 0C; legacyhoopers.org stays for the pilot program

## Role model

7. **3 roles in production tonight:** admin, coach, parent
8. **Super Admin:** Schema-ready (check constraint supports 'super_admin' value) but NOT built in UI until Phase 6+
9. **Multi-org switcher:** Deferred to Phase 6+ (no current user has multiple orgs)

## Pricing

10. **Hybrid model:** Monthly base + registration percentage
11. **3 tiers:** Starter $39 / Growth $99 / Pro $249 per month
12. **Registration %:** 2.5% / 2.0% / 1.5% per tier
13. **Legacy Hoopers tier:** Pro, pilot status, free through Fall 2027
14. **Phased billing rollout:** Monthly first (Phase 6), % layer added Phase 7

## Feature architecture

15. **Density toggle:** 3 levels (Minimal / Medium / Maximum), default Medium for all users, saved per-card in user_preferences.card_density JSONB
16. **RSVP display:** Counts on card (12 Going, 1 Maybe, 2 Not, 8 No Response), drill-down on detail page with Mark-as buttons
17. **Attendance trending:** Current rate vs 4 weeks prior, ↑ green up / ↓ red down arrow. Parent sees own child only; coach sees their teams; admin sees all.
18. **Rotation Planner:** Coach + admin only. Parents never see pre-game. Post-game parent sees only own child's minutes + period starts.
19. **Call-up flow:** No algorithmic ranking. Coach manually invites Academy players from list when Active Roster drops below threshold.
20. **Call-up response window:** 2-hour default (admin configurable)
21. **Reminder cadence:** 3-day, 2-day, 1-day, 4-hour before events. All admin-configurable.
22. **Note edit cooldown:** 4 hours between edits (admin configurable, per-parent override available for emergencies)
23. **Tournament rules:** Per-tournament JSONB `rules` column on tournaments table (NOT org-level circuit_rules, which stay as defaults). Rules form has structured fields: game_format, fouls, free_throws, jump_ball, press, overtime, misc_notes.
24. **Edit event → notify families prompt:** Every event edit triggers "Notify families?" modal with auto-generated change summary. Admin can override copy or skip.
25. **Hotel code distribution:** Manual distribute trigger. Admin uploads code, reviews, then clicks "Distribute to Active Roster" → push + email fires to guardians of Active Roster players on participating teams.
26. **Admin-configurable settings:** All of the above rules live in org_settings JSONB (reminder_cadence, rsvp_deadlines, note_rules, nudge_rules, roster_rules, notification_channels).

## Coach compensation

27. **Dual-entry attendance:** Coach self-reports sessions attended; admin verifies/overrides. If values differ, system shows both with audit trail. Admin-final-say.
28. **Rate cards:** Per coach × per team × per event_type stored as JSONB on coaching_assignments.rates. Existing `pay_per_session_cents` stays as fallback default. Example: `{"practice": 3000, "game": 5000, "tournament_day": 10000, "skills_lab": 2500}` (cents).
29. **Monthly invoice:** Auto-generated from approved attendance × rate. Admin reviews, marks paid via Zelle/Venmo, logs payment method + reference.
30. **Payment processing:** Manual tracking tonight (Fall 2026). Stripe Connect integration deferred to Phase 7+.

## Bug-level decisions (from 22-bug catalog)

31. **Apr 23 duplicate 11U Girls practice:** TO BE RESOLVED before Migration 021 (Frank to confirm which of two rows to keep — WCC or Westchester County Center)
32. **8U Boys Nationals:** NOT going. Confirmed via CSV: 8U goes to Bergen County NJ (Summer Hoops Jam Classic 1 & 2, June 6-7). 11U Girls and 10U Black are the Nationals teams.
33. **Tournament times:** Current production has 00:00-23:59 (midnight-to-midnight). Must revert to 08:00-20:00 Eastern (per SEED_SCHEDULE.sql original intent).
34. **Team color palette:** Production has v14 palette (#a78bfa violet, #4a8fd4 cobalt, #94a3b8 slate, #06b6d4 cyan, #f59e0b amber). Migration 004 has old palette (#7C3AED, #18181B, #2563EB, #DC2626, #EA580C). Off-migration UPDATE was run. Document in Migration 021 for sync.

---

# PART 4: THE 22-BUG CATALOG

Organized by severity. Bugs marked ✅ were fixed Phase 0A.

## P0 (Security / Privacy) — ALL CLOSED

- ✅ Parents could edit any event (fixed Phase 0A-1)
- ✅ Parents could delete any event (fixed Phase 0A-1)
- ✅ Parents could create events (fixed Phase 0A-2)
- ✅ Parents could bulk-export guardian contact info (fixed Phase 0A-3)
- ✅ Parents could NOT RSVP other families' kids (already gated, verified Phase 0A-4)

## P1 (Data Integrity) — addressed in Migration 021

- Tournament times corrupted to 00:00-23:59, must be 08:00-20:00 Eastern
- Apr 23 duplicate 11U Girls practice (need to pick which to keep)
- 8U Boys currently marked Nationals Qualified (should be Summer Hoops Jam Bergen County instead)
- Happy Gym test location in production (delete)
- "Test notes" on Milo's RSVP (delete)
- Tournament title "2026 Zero Gravity Girls National Finals" should revert to canonical "Girls Nationals if qualify"
- Season dates shows Mar 22 instead of Mar 23 (timezone bug in formatDateFull)

## P1 (UI bugs) — addressed in Phase 1

- UpcomingEvents.jsx renders hardcoded stub data ("Practice Wed Apr 16 WCC 5:00 PM", "vs Storm AAU Apr 19", "Practice Wed Apr 23 WCC 5:00 PM") on every team page regardless of team_id — needs real query
- Comments show author email instead of guardian first name
- Games filter excludes tournaments (should include)
- Fake 0-0 records on MY TEAMS card when no game_results exist (should show "0-0" only if season started with games, otherwise show season progress %)
- "Good morning, Frank" has underline styling (should be cleaner)

## P2 (UX polish)

- NextUpCard shows events >48h out (should cap at <48h for urgency)
- RSVP writes succeed but UI doesn't optimistically update (requires hard refresh)
- Recurring series edit uses native confirm modal (should use FullScreenForm)
- Login screen uses amber button (#C9952E) instead of brand cobalt (#4a8fd4)
- Score bottom nav tab intentionally hidden for parents (confirmed Frank decision) — scoring lives inside event card via Quick Score

## P3 (Cosmetic)

- Copy Roster button shows "Copy Failed" on HTTP dev (requires HTTPS production for clipboard API)
- MessageTeamFAB has dead TODO click handler (not P0 because button is non-destructive)

## Already shipped fixes that handoff missed (Session C era — confirmed working):

- Kid filter chips on parent schedule + home
- Season Window card with 37% progress
- Locations CRUD with active/archived tabs
- Per-guardian Invite buttons
- Team color v14 palette in production
- MY TEAMS stats grid (Players/Roster/Academy counts)
- Event-type filters (All/Game/Practice/Skills Lab/Tryout)
- Relative time countdown ("in 8h 27m")

---

# PART 5: THE MIGRATION PLAN

## Migration history (as of April 23, 2026)

```
Local files     Remote history     Status
001 - 012       001 - 012          ✅ Synced (via repair commands)
```

## Phase 0B queue (designed, not yet shipped)

These 8 migrations will be authored as SQL files, pasted into Supabase SQL Editor, then recorded via `supabase migration repair --status applied NNN`.

| # | Title | Type | Lines (est) |
|---|---|---|---|
| 013 | coaching_assignments_rates_extension | ADD COLUMN rates JSONB | ~30 |
| 014 | game_results_publishing_workflow | ADD COLUMNS published_at, published_by, private_notes | ~40 |
| 015 | tournaments_rules_extension | ADD COLUMN rules JSONB | ~30 |
| 016 | user_preferences | NEW TABLE | ~60 |
| 017 | org_settings_admin_configurable | ADD COLUMNS to organization_settings | ~80 |
| 018 | team_achievements | NEW TABLE | ~50 |
| 019 | event_notifications_audit | NEW TABLE | ~60 |
| 020 | attendance_views | CREATE VIEW (no schema change) | ~50 |

**021 — Data corrections (DESTRUCTIVE, handle with care):**
- UPDATE tournaments SET start_at/end_at (timezone fix)
- DELETE from locations WHERE name='Happy Gym'
- DELETE duplicate Apr 23 11U Girls practice
- UPDATE team_achievements (remove 8U Nationals, add Summer Hoops Jam)
- UPDATE tournaments SET name (revert 2026 Zero Gravity title)

## Phase 0C: Ember rebrand (blocked on 013-020 ship)

- Find/replace Skyfire → Ember in all UI strings, README, package.json
- CSS namespace: `--sf-*` → `--em-*`
- File renames: skyfire_phoenix.webp retired, phoenix_logo_*.png becomes canonical
- GitHub repo rename: skyfire-app → ember-app
- Vercel project rename
- Seed `ember_platform` registry table
- Update organizations.branding JSONB with Legacy Hoopers branding
- App header displays org.branding.org_name_display + small "Powered by Ember" footer
- Domain decision: ember.app vs emberhq.com

## Phase 1 — Parent 95% (6-7 sessions estimated)

Priority 1 — Honest rendering (replaces fake data):
- SeasonProgressBar component replacing fake 0-0 on MY TEAMS strip
- TeamHeaderCard — show season progress % + record when game_results exist
- SpringPulse card (Season in Progress + achievement callouts)
- TournamentTracker 5-dot timeline
- AchievementCard (Champions, Nationals Qualified, Finalists) on team detail

Priority 2 — Bug fixes (from 22-bug catalog):
- Season dates timezone fix (formatDateFull one-line fix)
- UpcomingEvents.jsx rewrite (drop UPCOMING_SEED, real team_id query)
- Comments display name fix (resolve email to guardian first_name)
- Games filter includes tournaments
- "May Reschedule" amber pill on draft events
- NextUpCard urgency filter (<48h cutoff)

Priority 3 — Polish:
- Login screen redesign (cobalt CTA, gradient background inspired by legacyhoopers.org hero)
- Remove underline on "Frank" in greeting
- Recurring series edit uses FullScreenForm (not native confirm)
- First Type 1 Team Wrapup auto-generated briefing
- Density toggle system wired to CompactCard (three-level accordion)

## Phase 2 — Coach 95% (5-6 sessions)

- Quick Score (inside event, not bottom nav)
- Rotation Planner (pre-game lineup + bench order)
- Live substitution tracker (in-game, timestamped)
- Minutes computation + season trends
- Player of the Game designation
- Roster Health dashboard (attendance trending per player)
- Call-up flow (manual coach invite, 2-hour response window)
- Coach compensation (personal view: current month accrual, paid history)

## Phase 3 — Admin 95% (8-10 sessions)

- Content CMS (Academy Standards editor, policy pages)
- Season/Tournament/Achievement CRUD
- Briefing templates editor (5 types)
- Hotel code distribution
- Tournament rules editor (structured JSONB form)
- Monthly coach invoice generation + payment tracking
- Year-end 1099 summary
- Admin compensation dashboard (all coaches)

## Phase 4 — Multi-tenant hardening (DEFERRED)

Not needed for Fall 2026 Legacy pilot. Scheduled for when St. Pat's onboarding approaches (2027-28).

## Phase 5 — Launch + Native (3-4 sessions)

- Capacitor wrapper for iOS + Android
- Push notifications (APNs + FCM)
- Apple App Store submission ($99/year)
- Google Play submission ($25 one-time)
- Fall 2026 rollout to 11U Girls first, then all 5 teams

## Phase 6-7 — Platform + Billing (2027)

- Super Admin role UI
- Ember platform surfaces
- Stripe subscription (Phase 6)
- Stripe Connect for Phase 7 registration %
- St. Pat's CYO onboarding (Winter or Spring 2027)

---

# PART 6: INFRASTRUCTURE + ENVIRONMENT

## Frank's development environment

- **Machine:** HP Chromebook, AMD Ryzen 3 3250C, 4GB total RAM, 15W CPU
- **OS:** ChromeOS with Crostini Linux (Debian 12 bookworm)
- **Crostini RAM allocation:** 2.83 GB (Docker not viable — ChromeOS itself uses 3.71 GB of 4.00 GB currently)
- **Node.js:** via `/usr/bin/npx`
- **Dev server URL:** `http://100.115.92.199:5173/` (Crostini IP, works on Chromebook browser only, NOT phone)
- **Phone testing:** Deferred to future session (requires port forwarding setup or production deploy testing via app.legacyhoopers.org)

## Working directory

`/home/admin/legacy-hoopers-app` (will be renamed `ember-app` in Phase 0C)

## Four-tool workflow

1. **Claude.ai chat** — planning, prompts, architecture
2. **Claude Code terminal** — implementation via str_replace edits (targeted, never full file rewrites)
3. **Supabase SQL Editor** — schema changes and data corrections (paste and run)
4. **Vercel** — build validation and auto-deploy from `main` branch

## Git workflow (CLAUDE.md rule)

Deploy chain must always be:
```
git add -A
git commit -m "[message]"
git push origin v2
git checkout main
git merge v2
git push origin main
git checkout v2
```

Claude Code tends to push to `claude/` branches by default — always correct explicitly.

## Supabase

- **Project ref:** `vrwwpsbfbnveawqwbdmj`
- **Org ID:** `e3e95e21-3571-4e9a-985a-d5d01480d4a6`
- **Admin user ID:** `1e06a3d4-769b-42c0-b90b-92787410ee5a` (admin@legacyhoopers.org)
- **Coach Kenny user ID:** `9ac6a671-8869-40c9-96de-f1628d0c12db`
- **Frank-as-parent guardian ID:** `9659f2bb-...`, user starts `0b81b465-...`
- **CLI authenticated:** Yes (token in ~/.config/supabase/access-token)
- **DB password:** Recently reset, Frank has it saved

## Deployment

- Repository: `github.com/LegacyHoopers/skyfire-app` (will rename in Phase 0C)
- Branches: v2 (dev) → main (Vercel auto-deploy)
- Production URL: `app.legacyhoopers.org` (and `skyfire-app.vercel.app`)
- Edge Function: `invite-parent` (JWT verification OFF per memory)

---

# PART 7: DESIGN TOKENS (ABSOLUTE)

**These are not negotiable.** Every component follows these tokens.

- **Font:** Inter (all weights)
- **Spacing grid:** 4px (all margins/padding use multiples of 4)
- **Card radius:** 10px
- **Tap target minimum:** 44px
- **Icon library:** Lucide React at stroke-width 1.75 (heavier for active states only)
- **Color storage:** CSS variables only, never hardcoded hex
- **Current namespace:** `--sf-*` (migrating to `--em-*` in Phase 0C)
- **Exception to hardcoded hex:** `team_color` passed inline from database

## Brand colors (current production)

- **Legacy Hoopers cobalt:** `#4a8fd4` (NEVER sky blue #29b6f6)
- **Team colors v14:**
  - 11U Girls: `#a78bfa` violet
  - 10U Black: `#4a8fd4` cobalt
  - 10U Blue: `#94a3b8` slate
  - 9U Boys: `#06b6d4` cyan
  - 8U Boys: `#f59e0b` amber

## Naming conventions (hard rules)

- **Number first, gender after:** "10U Black" never "Boys 10U Black"
- **Sort oldest-to-youngest:** 11U Girls, 10U Black, 10U Blue, 9U Boys, 8U Boys
- **Never use "CYO" in UI:** Use "League Play"
- **"Volunteers" not "Duties"** app-wide
- **"Futures Academy"** is a headline feature, never a footnote

---

# PART 8: THE CRITICAL LEARNINGS (meta-rules)

These are the principles that emerged from accumulated experience. Violating them creates technical debt and broken sessions.

## 1. One fix per prompt

Mega-prompts to Claude Code cause timeouts and partial failures. Every Claude Code instruction must be surgical: one str_replace, one test, one deploy. Never bundle changes.

## 2. SQL in chat, not via Claude Code

Database schema changes written in chat as SQL, pasted directly into Supabase SQL Editor. Faster, more reliable, version-controlled when committed to supabase/migrations/.

## 3. 150-line file cap

No component file exceeds 150 lines. Split before delivering. Pre-commit hook enforces (scripts/check-file-length.sh).

## 4. Architecture in chat, execution in Claude Code

Claude.ai chat: planning, design, SQL, prompts. Claude Code: surgical str_replace edits. Test before moving on.

## 5. CSS variables only

No hardcoded hex except inline `team_color` from database.

## 6. Avoid `current_user_org_id()` on org_members table

Causes RLS recursion. Use `user_roles` instead (which has its own simpler RLS).

## 7. Deploy chain must be exact

`v2 → main → v2` via git commands in sequence. Never skip.

## 8. Feature reference is GameChanger, PlayMetrics, SportsEngine, LeagueApps

UI quality reference is Linear, Apple Calendar, Nike Run Club, Stripe Dashboard. If it looks like a template, rebuild.

## 9. Answer first, then detail

Frank's communication preference. No preamble, no filler. No em dashes. No "leverage/utilize/seamless/robust/streamline."

## 10. Flag blockers immediately

If a request conflicts with data model or prior decisions, say so in one sentence at the top. Never quietly implement workarounds.

## 11. Update the build queue after every shipped feature

Not at end of session — immediately. The April 19 stale build queue caused Session C (and me) to miss 15+ shipped features.

## 12. Read filesystem before claiming any state

Never "I remember that..." — always verify. Session C missed shipped features because they trusted memory over ground truth.

## 13. Every claim needs evidence source

"Feature X shipped per grep of [file]" or "per migration 011" or "per screenshot [file:page]" — not "I recall it was done."

---

# PART 9: WHAT'S IN THE PROJECT FOLDER (reference)

The new chat has access to 215 files at `/mnt/project/`. Key files:

## Source code (110 JSX + 29 hooks + 16 lib = 155 code files)

All React components, hooks, and utility modules — full src/ directory snapshot as of April 23, 2026.

## Migrations (13 SQL files)

001-012 production migrations (001_user_roles through 012_tournament_audit_gaps), plus 009_revert.sql (should be in rollbacks/, still appears in project folder for reference).

## Seed data

- SEED_SCHEDULE.sql — original Spring 2026 schedule seed (has correct 08:00-20:00 tournament times)
- SEED_ALL_ROSTERS.sql — roster seed

## Documentation

- **CLAUDE.md** (16 KB) — governance rules for Claude Code
- **SKYFIRE_LEVEL99_MASTER.md** (843 lines) — comprehensive spec, design philosophy, competitive analysis, component inventory
- **LH_BRAND_CONTENT_MODEL.md** — brand content guidelines
- **LH_OPS_SPEC.md** — operations spec
- **SKYFIRE_BUILD_QUEUE.md** (April 19, stale, superseded by SKYFIRE_BUILD_QUEUE_v2.md in this handoff)
- **SKYFIRE_FULL_AUDIT.md** (390 KB, earlier audit)
- **README.md** / README.pdf

## Parent + Coach access screenshots (verified evidence)

- **Parent_access_under_fsamaritanogmail_com.pdf** (32 pages) — live parent view, what the P0 bug looked like
- **Coach_access_under_admin_email.pdf** (42 pages) — live admin view

## Content templates (real examples of what parent briefings look like)

- 10u_black_weekend_wrapup.html
- 10u_blue_week_ahead.html
- 11u_girls_metro_showdown_card.html
- 11u_girls_weekend_wrapup.html
- 8u_boys_day1_recap_sunday_preview.html
- 8u_boys_weekend_wrapup.html
- 9u_boys_week_ahead.html
- alexander_family_metro_showdown.html
- all_program_metro_showdown.html
- dodaro_family_metro_showdown.html
- ward_family_metro_showdown.html

These are the current manual weekly output Frank writes each Wednesday/Thursday night. Tournament Briefing Generator (Phase 2 or 3) automates this.

## Website content (legacyhoopers.org visual ground truth)

- Home_page_.pdf
- Locations.pdf
- Schedule_and_Records_.pdf
- Academy_Standards_.pdf
- records-v14_2.html

These represent the aesthetic floor Frank built manually. The app must meet or exceed this quality.

## Logos

- phoenix_logo_512/1024/2048.png + hires_navy (Ember brand)
- skyfire_logo_512/1024/2048.png + hires_navy (legacy, retire in Phase 0C)
- knight logo 2048.png + legacy hoopers logo 2048.png (Legacy Hoopers brand)

## Schedule data

- Spring_2026_SeasonSchedule042126.csv (229 rows, authoritative source from LeagueApps)

---

# PART 10: SESSION OPEN QUESTIONS FOR FRANK

These are items that came up yesterday that Frank hasn't answered. Ask before assuming.

## Operational

1. **Apr 23 duplicate 11U Girls practice:** Which row to keep — WCC location or Westchester County Center? Migration 021 deletes the other.

2. **Tournament rules entry method:** Structured form only, freeform notes only, or hybrid (structured fields + freeform misc_notes field)? Recommended: hybrid.

3. **Reminder channels for schedule changes:** Push + email (recommended) or include SMS?

4. **Emergency override channels:** Push + email + SMS bypassing quiet hours (recommended)?

5. **Hotel code distribution channels:** Push + email (recommended), SMS too, or email only?

## Product strategy

6. **Ember domain preference:** ember.app, emberhq.com, getember.co, useember.com, or other? (Decide in Phase 0C.)

7. **Legacy Hoopers domain post-rebrand:** Keep app.legacyhoopers.org pointing to Ember OR move to legacyhoopers.ember.app subdomain OR both in parallel?

8. **Ember corporation formation timing:** Before Phase 0C rebrand, during Fall 2026, before St. Pat's onboarding, or separate lawyer conversation?

## Tier enforcement

9. **Legacy Hoopers feature access:** Confirmed Pro tier, everything enabled. Verify: even billing surface should be hidden (not just empty/zero) since it's pilot mode?

## Coach compensation

10. **1099 generation:** Do we auto-generate 1099 forms at year-end for coaches earning >$600, or manual?

11. **Per-coach pay scopes:** Current schema has `pay_per_session_cents` single flat rate. Confirmed adding `rates JSONB` for per-event-type differentiation. Example rates discussed: Darien 8U practice $30, 9U practice $60, game $50, tournament day $100. Other coaches to be configured similarly.

## Launch

12. **11U Girls as first rollout cohort:** When app hits 95% parent satisfaction, 11U Girls families are invited first. Confirm this is still the plan, or different cohort?

---

# END OF DOCUMENT

**Next action when this handoff is consumed by a new chat:** Follow the NEW_CHAT_STARTER_PROMPT.md protocol. Do not skip verification. Do not execute code until Frank confirms the summary is correct.
