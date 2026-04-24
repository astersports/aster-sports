# SKYFIRE / EMBER 95% AUDIT
**Date:** April 24, 2026
**Branch state:** v2 + main at 8cf2870
**Migrations shipped:** 013-023 (11 of Phase 0B complete)
**Audit scope:** Every gap between current production and the 95% elite experience for Parent, Coach, and Admin roles.

---

# SECTION 1: EXECUTIVE SUMMARY

## 1.1 Top-level gap count

| Severity | Count | Description |
|---|---|---|
| 🔴 BLOCKER | 9 | Must ship before parent rollout can begin |
| 🟡 CRITICAL | 17 | Visible gap for users but not existential |
| 🟠 MATERIAL | 12 | Real issue, polish phase acceptable |
| ⚪ MINOR | 8 | Nice-to-haves |
| **TOTAL** | **46** | |

## 1.2 What's genuinely right (celebrate wins first)

- **38/38 tables have RLS enabled.** Zero unchecked surfaces.
- **62 foreign keys** with proper referential integrity across the schema.
- **All FK indexes present.** Performance baseline solid.
- **Migration 022 SECURITY DEFINER helpers work.** Parent app verified with full RLS enforcement.
- **Migration 023 VIEWs ready.** Attendance + RSVP trending computable on demand.
- **150-line cap respected** across all 110 component files.
- **user_preferences schema complete.** Theme + density + quiet_hours + notification_preferences + role_preferences all structured.
- **team_achievements schema complete.** All lifecycle fields (earned/confirmed/archived) plus badge emoji/color/photo/custom_title for UI flexibility.
- **event_notifications schema complete.** 17 columns covering full delivery lifecycle + audit trail.
- **locations table exists** with archived_at soft-delete pattern.
- **Spring 2026 schedule is live.** 145 events, 5 teams, real data.

## 1.3 The 9 BLOCKERS (must close before parent rollout)

| # | Gap | Layer |
|---|---|---|
| B1 | `events.location` free text, no FK to `locations` table | Schema |
| B2 | RLS on events uses single `*` policy, allows parents to DELETE | RLS |
| B3 | `current_user_org_id()` function logic unknown — L99 anti-pattern risk | RLS |
| B4 | `event_notifications` has 0 rows, no trigger writes to it | Feature |
| B5 | Migration 024 data corrections (6 items pending) | Data |
| B6 | Locations naming drift ("St. Patricks" etc.) + 4 "Tournament -" placeholders | Data |
| B7 | Migration 025 rides schema redesign (buggy workflow today) | Schema |
| B8 | Coach home page does not exist (CoachHomePage.jsx missing) | UI |
| B9 | Admin home is partial, missing KPI cards + pending queues | UI |

## 1.4 Recommended migration sequence (024-030)

| # | Purpose | Priority | Est lines |
|---|---|---|---|
| 024 | Data corrections (6 items per memory) | BLOCKER | 150 |
| 025 | Rides schema redesign (offers + claims) | BLOCKER | 300 |
| 026 | RLS granular policies on events + teams + 10 others | BLOCKER | 400 |
| 027 | events.location_id FK + backfill + location_address column | BLOCKER | 120 |
| 028 | event_notifications trigger functions + cancellation/edit triggers | BLOCKER | 250 |
| 029 | organization_settings defaults for Legacy Hoopers + defaults row trigger | CRITICAL | 100 |
| 030 | user_preferences default trigger on auth.users insert | CRITICAL | 80 |

## 1.5 Sprint sequence recommendation

```
Phase 0B remainder:  Migrations 024 → 025 → 026 → 027 → 028
Phase 0C:            Ember rebrand (find/replace Skyfire → Ember)
Sprint A:            Bug fixes (9 bugs from catalog, no new features)
Sprint B:            Parent home redesign per HOME_DESIGN_SPEC.md
Sprint C:            Parent schedule + event detail polish
Sprint D:            Coach home + coach toolkit
Sprint E:            Admin home + admin tools
Sprint F:            Dark mode + a11y + analytics + multi-org scaffolding
Sprint G:            Migration 029 + 030 + system hardening
Sprint H:            Phase 2 features (quick score, rotation planner, call-up)
```

---

# SECTION 2: DETAILED GAP CATALOG

## 2.1 SCHEMA LAYER

### 🔴 BLOCKER — B1: Events have no location FK

**Current state:** `events.location` is text. 145 events reference 20 distinct string values. `locations` table exists with 21 rows and proper schema (id, org_id, name, address, archived_at). Zero rows link between the two.

**95% target:** Every event references `location_id uuid NULL REFERENCES locations(id) ON DELETE SET NULL`. Free text `location` column stays for legacy/migration support but becomes deprecated. Location card on event detail pulls from `locations` via JOIN for: formatted address, google_maps_url, apple_maps_url, waze_url, parking notes, gym-within-venue subrooms.

**Gap severity:** BLOCKER. The parent experience requires tappable directions from every event card. Today, the `location` text gets crammed into a Google Maps URL via string interpolation which may or may not resolve correctly (e.g., "Westchester Community College (WCC)" might route to a shopping mall named WCC in Texas).

**Migration needed:** 027 — add location_id FK, backfill via case-insensitive name match, leave location text column for now.

**Frontend impact:** EventLocationTab.jsx, EventCard.jsx, LocationCard.jsx, EventDetailPage.jsx all need refactor to prefer `location_id` JOIN when available.

### 🔴 BLOCKER — B7: Rides schema buggy

**Current state:** Single `event_rides` table mixes offer + claim semantics. Multi-claim logic is broken. Round-trip (arrival + return) not supported as first-class concept. 4 RLS policies exist but workflow bugs persist.

**95% target:** Per RIDES_DESIGN_SPEC.md, split into offers + claims with clear state machine, waitlist position, auto-confirm at T+12h.

**Migration needed:** 025. Already spec'd in RIDES_DESIGN_SPEC.md (311 lines).

### 🟡 CRITICAL — S1: Event draft vs published lifecycle missing

**Current state:** `events.status` has only `scheduled` and `cancelled` values. No `draft` state.

**95% target:** Admin creates event as draft, reviews, publishes. Parents never see draft events. Supports import workflows (TourneyMachine paste, bulk CSV) where admin needs to review before going live.

**Gap severity:** CRITICAL. Per SEED_SCHEDULE.sql memory "Status set to draft — admin reviews and publishes before parents see them" — but schema doesn't support it.

**Migration needed:** Consider in Phase 3 admin work OR add to 028.

### 🟡 CRITICAL — S2: opponent_id not consistently populated

**Current state:** Events with `event_type IN ('game', 'tournament')` can reference `opponents` table via `opponent_id` FK. But events also have free text `opponent` column. Population rate unknown (need Query A6 results).

**95% target:** Every game event has opponent_id populated. Head-to-head records auto-compute. Opponent detail pages possible.

**Gap severity:** CRITICAL for standings/records feature (not parent home specifically).

**Migration needed:** Deferred to records/standings feature work (not in scope for 95% parent rollout).

### 🟡 CRITICAL — S3: Parent queries don't filter by season_id

**Current state:** Migration 023 added `events.season_id`. But queries in useEventDetail.js, useActivities.js, SchedulePage.jsx etc. still query by `team_id + start_at range` alone.

**95% target:** At season boundary (Spring 2026 → Summer 2026), parent schedule filters to active season only. Without season filter, families see overlap month with both seasons mixed.

**Gap severity:** CRITICAL. Will break at Jun 15 season boundary.

**Work needed:** Frontend hook updates in Sprint A (not a migration).

### 🟠 MATERIAL — S4: team_achievements missing persistence_days column

**Current state:** team_achievements has achievement_type but no per-row persistence rule.

**95% target:** Per HOME_DESIGN_SPEC Section 1.1.6, recognition cards persist different durations based on type (24h standard, 48h tournament, 7d championship, admin-configurable custom).

**Gap severity:** MATERIAL. Can compute in UI from achievement_type string if type list is fixed. Adding column makes it admin-configurable later.

**Migration needed:** Optional column add during Sprint B.

### 🟠 MATERIAL — S5: No per-event registration/payment link

**Current state:** `roster_members.payment_status` is the only payment signal.

**95% target:** Per HOME_DESIGN_SPEC 1.1.9, parent home shows registration/payment reminder when `payment_status != 'paid'`. Works today with existing schema.

**Gap severity:** MATERIAL. Frontend work only.

## 2.2 RLS LAYER

### 🔴 BLOCKER — B2: events table has single `*` policy (grants ALL ops)

**Current state:**
```
events | events_org_isolation | command = '*' | using = (team_id IN (... teams.org_id = current_user_org_id()))
```

Single policy covers SELECT, INSERT, UPDATE, DELETE with identical logic. Any authenticated user in the org can delete any event.

**95% target:** Granular policies.

- **SELECT:** all users in org
- **INSERT/UPDATE/DELETE:** only admin + coach roles (use `user_has_role_in_org` helper from Migration 022)

**Why this is a BLOCKER:** A parent can right-click, inspect network, craft a DELETE request, and wipe the team's schedule. Not theoretical — it's how you'd discover the bug during security audit.

**Migration needed:** 026. Must split every `*` policy on non-private tables into explicit SELECT + modify policies.

### 🔴 BLOCKER — B3: `current_user_org_id()` unknown internals

**Current state:** Function referenced in 11 policies. Anti-pattern Part 9 says "never call on `org_members` table — causes infinite recursion."

**95% target:** Function queries `user_roles` (per Migration 010), NOT `org_members`. Must verify.

**Why this is a BLOCKER:** If the function internally references a table that has RLS policies that use the function, it blows up. Migration 022 v1 bug was the same pattern on different tables.

**Verification needed:** Run `\df+ current_user_org_id` in Supabase or `SELECT pg_get_functiondef('current_user_org_id()'::regprocedure)`.

**Migration needed:** If function is unsafe, refactor to SECURITY DEFINER with explicit user_roles lookup. If already correct, document and move on.

### 🔴 BLOCKER — B2 extended: 10 other single-policy tables same pattern

Same `*` command pattern on:
- `seasons`, `teams`, `team_players`, `team_staff`, `locations`, `opponents`
- `event_notifications`, `player_activations`, `guardian_notification_prefs`
- `user_roles`, `organizations`

All need granular SELECT vs modify split. Some are appropriate for `*` (user_roles_self, guardian_notification_prefs_self — user-scoped, no multi-user concern). But teams/locations/opponents need coach-level modification gates.

**Migration 026 scope expansion needed:** Covers all 12 tables.

### 🟠 MATERIAL — R1: organizations policy too permissive

**Current state:** `Authenticated users can read orgs` allows any authenticated user to SELECT all organization rows.

**95% target:** Users can only SELECT their own org rows + any orgs they've been invited to (future multi-org). For Legacy Hoopers single-tenant, this is harmless. Becomes a leak when second org (St. Pat's) ships in 2027.

**Migration needed:** Update in Phase 4 multi-tenant work.

## 2.3 DATA INTEGRITY LAYER

### 🔴 BLOCKER — B5: Migration 024 six corrections pending

Per memory + State of Affairs:

**C1 Tournament times:** 00:00-23:59 → 08:00-20:00 Eastern. Applies to tournament event_type. Per SEED_SCHEDULE.sql canonical intent.

**C2 Duplicate Apr 23 11U Girls practice:** Keep WCC (Westchester Community College, id ec577cca-21bb-4181-b054-18c3013658dc). Delete Westchester County Center entry. Check: also delete the location row "Westchester County Center" (id 039de263-f355-40fd-8c85-bba0e339d415) if no other team uses it.

**C3 Happy Gym:** Already archived (`archived_at = 2026-04-21 11:55:19.612+00`). No events reference it (top-20 location list confirms). Decision: leave archived or hard-delete? Soft-delete is safer. CLOSED as non-action.

**C4 Milo "Test notes" on RSVP:** UPDATE event_rsvps SET comment = NULL WHERE player_id = '8bc887ce-4539-4f07-8246-312389ccb7b5' AND comment ILIKE '%test%'.

**C5 Tournament title fixes:**
- "Girls Nationals if qualify" → "2026 Zero Gravity Girls National Finals" (per zerogravitybasketball.com/site/register/register.aspx?EventID=18385)
- "Boys Nationals if qualify" → "2026 Zero Gravity Boys National Finals" (per zerogravitybasketball.com/page/massachusetts)

**C6 8U Boys tournament entries:**
- DELETE: any "Nationals" entries referencing 8U team
- INSERT: "BBallShootout: Pre Summer Hoops Jam Classic 1" at "Bergen County, NJ" (id d1c9ce93-dcb9-4020-accc-c7cbffaffdf3) Jun 6-7 2026, 08:00-20:00 Eastern

**Migration needed:** 024. Per-correction verification required per L99 rule.

### 🟡 CRITICAL — D1: Location naming drift

**Current state in locations table:**
- "St. Patricks" (missing apostrophe, should be "St. Patrick's")
- "Harvey School" (missing "The", should be "The Harvey School")
- 4 "Tournament -" placeholder locations with null addresses

**95% target:**
- Real venues: canonical names matching Locations doc
- Tournament placeholders: migrate to actual venue once known, OR adopt convention that "Tournament - {region}" is intentional for TBD venues

**Gap severity:** CRITICAL. Parents tap directions, maps opens with quoted name + null address, resolves to wrong place or nothing.

**Action needed:** Add to Migration 024 or separate Migration 024b. Name corrections + decision on Tournament- placeholders.

### 🟡 CRITICAL — D2: Location addresses missing city/state/zip

**Current state:** `locations.address` has only street address:
- "75 Grasslands Rd" for WCC (should be "75 Grasslands Rd, Valhalla, NY 10595")
- "29 Cox Ave" for St. Patrick's (should be "29 Cox Ave, Armonk, NY 10504")

**95% target:** Full addresses with city + state + zip so Google/Apple/Waze resolve correctly from any region. Especially critical for out-of-town families visiting WCC for first time.

**Action needed:** Admin UI edit or Migration 024 UPDATE statements.

### 🟡 CRITICAL — D3: Locations lack lat/lng + gym-within-venue detail

**Current state:** Only name + address. No lat/lng. No subrooms/gyms.

**95% target:** Per LH_BRAND_CONTENT_MODEL.md, venues like Rippowam have Wade's Gym + Trustees Gym (different entrances). WCC has Viking Gym in PEB Building with specific parking Lots 8, 9, 10. St. Patrick's has St. Francis Hall specifically. Parent needs: lat/lng for precise maps, subroom name for on-site navigation, parking notes, entry instructions.

**Schema needed:**
- `locations.latitude decimal`
- `locations.longitude decimal`
- `locations.subroom_notes jsonb` (or new table `location_rooms`)
- `locations.parking_notes text`
- `locations.entry_instructions text`

**Migration needed:** 027 or later.

### 🟠 MATERIAL — D4: No organization_settings row for Legacy Hoopers

**Gap severity:** MATERIAL. Migration 017 schema exists. If no row for Legacy Hoopers, all defaults are implicit NULL. Should insert a row with L99 defaults (reminder cadence, RSVP deadlines, etc.).

**Action needed:** Seed data insert in Migration 029.

## 2.4 FEATURE INFRASTRUCTURE LAYER

### 🔴 BLOCKER — B4: event_notifications not populated, no triggers

**Current state:** Table exists, schema complete, RLS policy exists. **0 rows. Nothing writes to it.**

**95% target:** Triggers fire on:
- INSERT into events (new event notification to team)
- UPDATE of events.start_at or end_at or location or status (schedule change notification)
- UPDATE of events.status = 'cancelled' (cancellation notification)
- INSERT into event_comments by coach/admin (coach message notification)

Each trigger INSERTs row(s) into event_notifications with appropriate notification_type, recipient_type (team/individual), channels jsonb.

**Emergency alert banner per HOME_DESIGN_SPEC 1.1.1** requires at minimum the cancellation + schedule_change triggers.

**Migration needed:** 028. Write trigger functions + CREATE TRIGGER statements.

**Additional work:** Push notification dispatcher — Edge Function or cron reads status='pending' rows, dispatches to FCM/APNs (Capacitor phase). For now, in-app banner only.

### 🟡 CRITICAL — F1: No user_preferences default trigger

**Current state:** Frank has a user_preferences row with sensible defaults. But Frank's row has created_at = 2026-04-23 16:37 — looks like a manual seed. What happens when a new parent signs up?

**95% target:** On auth.users insert (or first login via guardian auto-link), a trigger creates user_preferences row with defaults: theme=system, timezone per guardian address, card_density.default=medium, quiet_hours=null-or-default, notification_preferences=empty, role_preferences=empty.

**Migration needed:** 030. Simple trigger on `auth.users` or better `user_roles` insert.

### 🟡 CRITICAL — F2: Coach message not surfaced to parent home

**Current state:** `event_comments` table exists. Comments section in event detail works. But there's no mechanism for "coach posted message in last 24h" to float to parent home.

**95% target:** Per HOME_DESIGN_SPEC Section 1.1.7, dedicated "Latest from Coach" block surfaces the most recent event_comments row where author_role='coach' within last 24h.

**Gap severity:** CRITICAL for home UX.

**Work needed:** Frontend query + component in Sprint B. No schema change needed.

### 🟡 CRITICAL — F3: Registration/payment reminder unbuilt

**Current state:** roster_members.payment_status column exists per earlier schema work.

**95% target:** Per HOME_DESIGN_SPEC Section 1.1.9, home surfaces reminder when `payment_status != 'paid'` for any of parent's children.

**Work needed:** Frontend query in Sprint B. No schema change.

### 🟠 MATERIAL — F4: No season-level dashboard stats

**Current state:** Migration 023 VIEWs computing attendance + RSVP per team. No org-level rollup.

**95% target:** Admin home KPI cards show org-level: total RSVP %, total attendance %, total revenue, etc.

**Work needed:** Additional VIEW in future migration or compute in frontend for small org size.

## 2.5 UI LAYER

### 🔴 BLOCKER — B8: CoachHomePage.jsx does not exist

**Current state:** Coach role exists, coach login works. But when Kenny logs in, the app routes to... (need to verify — likely HomePage.jsx or AdminHomePage.jsx fallback).

**95% target:** Per HOME_DESIGN_SPEC Section 2, coach home has 7 dedicated sections:
1. Greeting + next coaching commitment
2. My Teams (coach filter)
3. This Week agenda (practices + games + tournaments I'm coaching)
4. Recent RSVP/attendance changes
5. Pending duties/volunteers needing my action
6. Coach message composer shortcut
7. Compensation summary (current session count + next invoice preview)

**Work needed:** Create file in Sprint D. Dependencies: Migration 013 (coaching_assignments) already shipped, Migration 023 VIEWs already shipped.

### 🔴 BLOCKER — B9: AdminHomePage.jsx is partial (111 lines)

**Current state:** File exists, small (111 lines). Likely shows admin KPI grid + quick actions. Missing most features.

**95% target:** Per HOME_DESIGN_SPEC Section 3, admin home has 9 sections:
1. Org-level KPI cards (teams active, players enrolled, RSVP rate, attendance rate, revenue, coaches staffed, pending registrations, pending achievements)
2. Pending approvals queue (team_achievements where is_pending_confirmation=true)
3. Today's activity feed
4. Program health heatmap (per team snapshot)
5. Upcoming tournaments (next 30d)
6. Coach compensation review
7. Registration health
8. Recent issues/flags
9. Quick actions

**Work needed:** Expand in Sprint E. Dependencies: Migrations 013, 018, 023 already shipped.

### 🟡 CRITICAL — U1: ParentHomePage.jsx at 150-line ceiling

**Current state:** Exactly 150 lines. Cap.

**95% target:** Per HOME_DESIGN_SPEC (1199 lines), parent home has 13 sections. Cannot fit in 150-line file.

**Gap severity:** CRITICAL. Sprint B work requires decomposing into 6-10 sub-components each at 50-100 lines.

**Work needed:** Sprint B architectural refactor.

### 🟡 CRITICAL — U2: Density toggle not wired

**Current state:** Migration 016 added `user_preferences.card_density` JSONB. Frank has `{"default": "medium"}`. No frontend code reads or writes it.

**95% target:** Every dense-capable section has chevron UI + persists per-section + per-user preference.

**Work needed:** New `useDensity(sectionKey)` hook + `<DensityChevron>` component. Sprint B.

### 🟡 CRITICAL — U3: "Good morning, Frank" underline bug

**Current state:** Greeting renders with unintentional underline styling.

**95% target:** Clean sans-serif greeting, no underline.

**Work needed:** One-line CSS fix. Sprint A.

### 🟡 CRITICAL — U4: UpcomingEvents.jsx hardcoded stub data

**Current state:** UpcomingEvents.jsx renders hardcoded UPCOMING_SEED constant with test events ("Practice Wed Apr 16 WCC", "vs Storm AAU Apr 19"). Shows on every team page regardless of team_id.

**95% target:** Query real events filtered by team_id + date range.

**Work needed:** Rewrite component with useActivities hook. Sprint A.

### 🟡 CRITICAL — U5: Comments show author email instead of name

**Current state:** event_comments join to guardians/user_roles shows raw email.

**95% target:** Show guardian first_name, fall back to display_name, fall back to initials.

**Work needed:** Update comment render logic. Sprint A.

### 🟡 CRITICAL — U6: Games filter excludes tournaments

**Current state:** Schedule page "Games" filter matches event_type='game' only, excluding event_type='tournament'.

**95% target:** Games filter shows both.

**Work needed:** One-line filter logic fix. Sprint A.

### 🟠 MATERIAL — U7: Fake 0-0 records on MY TEAMS cards

**Current state:** When no game_results exist for a team, MY TEAMS card shows "0-0" (misleading — looks like they've played and lost nothing).

**95% target:** Show "Season in progress · Week 5 of 12" until first game_results row exists.

**Work needed:** Conditional render based on COUNT(game_results WHERE team=X). Sprint B.

### 🟠 MATERIAL — U8: NextUpCard shows events >48h out

**Current state:** No urgency cap. Shows 7-day-out events as "next up."

**95% target:** Cap at <48h. Beyond 48h, show in "This Week" section instead.

**Work needed:** Filter adjustment. Sprint B.

### 🟠 MATERIAL — U9: RSVP optimistic update missing

**Current state:** RSVP writes succeed. UI doesn't update until hard refresh.

**95% target:** Optimistic mutation. UI updates on click, rollback on error.

**Work needed:** Optimistic state in useRsvps hook. Sprint A.

### 🟠 MATERIAL — U10: Recurring series edit uses native confirm

**Current state:** window.confirm dialog for "edit this event only / all events in series".

**95% target:** FullScreenForm or custom dialog matching app style.

**Work needed:** Swap confirm for ConfirmDialog. Sprint A.

### 🟠 MATERIAL — U11: Login screen amber button instead of cobalt

**Current state:** LoginForm.jsx login button is amber #C9952E.

**95% target:** Brand cobalt #4a8fd4.

**Work needed:** One CSS variable change. Sprint A.

### ⚪ MINOR — U12: Copy Roster "Copy Failed" on HTTP dev

**Current state:** Clipboard API requires HTTPS. Works on Vercel production, fails on local dev server.

**95% target:** No action — production works. Add dev-only fallback message.

**Work needed:** None for production. Optional polish.

### ⚪ MINOR — U13: MessageTeamFAB dead click handler

**Current state:** FAB button has TODO handler.

**95% target:** Route to message compose flow.

**Work needed:** Sprint B — messaging infrastructure is later anyway.

## 2.6 CROSS-CUTTING CONCERNS

### 🟡 CRITICAL — C1: Dark mode unimplemented

**Current state:** CSS variables exist but no dark palette. user_preferences.theme supports 'dark' but nothing reads it.

**95% target:** Per HOME_DESIGN_SPEC Q10, full dark mode with media query + user toggle.

**Work needed:** Dark CSS variable set + theme toggle + audit hardcoded hex. Sprint F.

### 🟡 CRITICAL — C2: Accessibility gaps

**Current state:** Bottom nav is tappable. Buttons have labels. But likely missing: role="region", aria-labels on dense cards, keyboard focus outlines, screen-reader landmarks, prefers-reduced-motion honor.

**95% target:** WCAG AA compliance across all screens.

**Work needed:** Audit + fix pass. Sprint F.

### 🟡 CRITICAL — C3: Analytics instrumentation

**Current state:** None.

**95% target:** Every meaningful interaction logs event (RSVP submit, ride claim, card tap, section density change). Data powers product decisions.

**Work needed:** Pick library (Mixpanel/PostHog/Plausible), add events table + dispatch, instrument all components. Sprint F.

### 🟠 MATERIAL — C4: Multi-org switcher UI

**Current state:** Query scoping works. No UI for users who belong to multiple orgs.

**95% target:** Header org switcher + context update.

**Work needed:** Phase 4 — after Legacy Hoopers is solid.

### 🟠 MATERIAL — C5: Offline mode

**Current state:** PWA exists. Offline behavior unaudited.

**95% target:** Service worker caches static + last-seen schedule. Form submissions queue.

**Work needed:** Deferred to Capacitor phase.

## 2.7 PERFORMANCE LAYER

### 🟠 MATERIAL — P1: Migration 023 VIEWs not materialized

**Current state:** Plain VIEWs. Re-compute on every query.

**95% target:** At current scale (145 events, 5 check_ins), plain VIEWs are fine. At 1000+ events + 500+ check_ins, consider materializing with scheduled REFRESH.

**Work needed:** Monitor + materialize in Phase 2 if needed.

### 🟠 MATERIAL — P2: No query caching layer

**Current state:** Every page load re-queries Supabase.

**95% target:** React Query or SWR with staleTime configured per entity type.

**Work needed:** Sprint A or B optimization.

### ⚪ MINOR — P3: No image optimization

**Current state:** photo_url fields store raw URLs.

**95% target:** Supabase storage with automatic WebP + resize.

**Work needed:** When image upload feature ships.

---

# SECTION 3: SCHEMA WORK PLAN (MIGRATIONS 024-030)

## Migration 024: Data corrections (6 items) — BLOCKER

**Size:** 150 lines
**Risk:** HIGH (destructive DELETEs + UPDATEs)
**Method:** Per-correction pre-verification before execution, wrapped in BEGIN/COMMIT

Scope locked per memory + Q1-Q4 answers:
1. Tournament times 00:00-23:59 → 08:00-20:00 Eastern
2. Delete duplicate Apr 23 11U Girls practice (keep WCC)
3. Delete Westchester County Center row (test data)
4. Clear Milo RSVP "Test notes" comment
5. Rename both tournament titles to Zero Gravity official names
6. Delete 8U Nationals, insert Bergen County tournament

**Rollback file required.**

## Migration 025: Rides schema redesign — BLOCKER

**Size:** 300 lines
**Risk:** MEDIUM (data migration on live table)
**Reference:** RIDES_DESIGN_SPEC.md (311 lines)

Split event_rides into:
- event_ride_offers (driver capacity, arrival_or_return, status)
- event_ride_claims (claimant, offer_id, waitlist_position, auto_confirm_at)
- events.ride_coordination_enabled boolean

6+ RLS policies, 4+ SECURITY DEFINER helpers for claim state transitions.

**Rollback file required.**

## Migration 026: RLS granular policies — BLOCKER

**Size:** 400 lines
**Risk:** HIGH (if policies wrong, could break app)
**Method:** Split every `*` policy into explicit SELECT + INSERT/UPDATE/DELETE pairs

Tables:
- events: parents SELECT only, coach+admin modify
- teams: everyone SELECT in org, admin modify
- team_staff: coach+admin SELECT+modify, parents SELECT team staff of their kid's teams
- team_players: same as team_staff
- locations: everyone SELECT, admin modify
- opponents: everyone SELECT, admin modify
- seasons: everyone SELECT, admin modify
- event_notifications: user SELECT own, system writes
- player_activations: coach modify, parent SELECT own child
- Some (user_roles_self, guardian_notification_prefs_self, organizations) stay as-is

**BEFORE migration ships:** Verify `current_user_org_id()` function is SECURITY DEFINER + queries `user_roles` (not `org_members`).

**Rollback file required.**

## Migration 027: events.location_id FK + location schema extensions — BLOCKER

**Size:** 120 lines
**Risk:** LOW (additive)

Changes:
- ALTER TABLE events ADD COLUMN location_id uuid NULL REFERENCES locations(id) ON DELETE SET NULL
- Backfill via case-insensitive name match with priority for non-archived + org-scoped
- ALTER TABLE locations ADD COLUMN latitude decimal(9,6), longitude decimal(9,6), parking_notes text, entry_instructions text, subroom_notes jsonb DEFAULT '{}'::jsonb
- Index on events(location_id) WHERE location_id IS NOT NULL

**Data cleanup (same migration):**
- UPDATE locations SET name = 'St. Patrick''s' WHERE name = 'St. Patricks'
- UPDATE locations SET name = 'The Harvey School' WHERE name = 'Harvey School'
- UPDATE locations SET address = '75 Grasslands Rd, Valhalla, NY 10595' WHERE name LIKE 'Westchester Community College%'
- Similar for 3 practice sites

**Rollback file required.**

## Migration 028: event_notifications triggers — BLOCKER

**Size:** 250 lines
**Risk:** MEDIUM (trigger bugs cause cascading issues)

Functions:
- notify_event_created(event_id, triggered_by)
- notify_event_cancelled(event_id, triggered_by, reason)
- notify_event_rescheduled(event_id, triggered_by, old_start, new_start)
- notify_event_relocated(event_id, triggered_by, old_location, new_location)
- notify_event_comment_posted(comment_id, triggered_by)

Triggers:
- events INSERT → notify_event_created
- events UPDATE status='cancelled' → notify_event_cancelled
- events UPDATE start_at OR end_at → notify_event_rescheduled
- events UPDATE location OR location_id → notify_event_relocated
- event_comments INSERT (by coach/admin) → notify_event_comment_posted

**Push dispatcher:** Deferred to Capacitor phase. Migration 028 just populates event_notifications rows.

**Rollback file required.**

## Migration 029: organization_settings defaults — CRITICAL

**Size:** 100 lines
**Risk:** LOW (seed data)

INSERT organization_settings row for Legacy Hoopers with L99 defaults:
- reminder_cadence: {"days_before": [3, 2, 1], "hours_before": [4]}
- rsvp_deadlines: {"practice_hours": 24, "game_hours": 48, "tournament_hours": 72}
- notification_channels: {"in_app": true, "push": true, "email": false}
- note_rules: {"edit_cooldown_hours": 4, "admin_override": true}
- nudge_rules: {"prompt_cooldown_hours": 24}
- roster_rules: {"call_up_response_window_hours": 2}

## Migration 030: user_preferences default trigger — CRITICAL

**Size:** 80 lines
**Risk:** LOW

Trigger on auth.users INSERT (or user_roles INSERT in org) that creates user_preferences row with sensible defaults based on org settings + user profile.

---

# SECTION 4: FRONTEND WORK PLAN (SPRINTS A-H)

## Sprint A — Bug fixes (pre-Sprint-B groundwork)

**Scope:** 9 bugs from catalog, no new features.
**Est sessions:** 2-3

- A1: "Good morning, Frank" underline fix (U3)
- A2: UpcomingEvents.jsx hardcoded data (U4)
- A3: Comments email → first_name (U5)
- A4: Games filter includes tournaments (U6)
- A5: Season dates Mar 22 → Mar 23 timezone (formatDateFull)
- A6: RSVP optimistic update (U9)
- A7: Recurring series edit dialog (U10)
- A8: Login cobalt button (U11)
- A9: Parent query season_id filter (S3)

## Sprint B — Parent home redesign — BLOCKER

**Scope:** 13 sections per HOME_DESIGN_SPEC.md. 6-10 sub-components.
**Est sessions:** 4-6

**Component decomposition (all ≤150 lines):**
- ParentHomePage.jsx (orchestrator, ~80 lines)
- HomeGreeting.jsx
- HomeEmergencyAlert.jsx (surfaces event_notifications)
- HomeActionZone.jsx (pending RSVPs, rides, volunteers)
- HomeMyTeams.jsx
- HomeNextUp.jsx (urgency-capped)
- HomeThisWeek.jsx (grouped by day)
- HomeLiveNow.jsx
- HomeCoachMessage.jsx (event_comments where author=coach last 24h)
- HomeRecognition.jsx (team_achievements persistence tiers)
- HomeRegistrationReminder.jsx
- useDensity(sectionKey) hook
- DensityChevron component

**Dependencies:**
- Migration 023 VIEWs (shipped) for MY TEAMS stats
- Migration 016 user_preferences (shipped) for density
- Migration 028 notifications (NEEDED) for emergency alert
- Migration 027 location (optional but preferred)

## Sprint C — Parent schedule + event detail polish

**Scope:** SchedulePage.jsx enhancements, EventDetailPage.jsx polish.
**Est sessions:** 2-3

- Tournament weekend grouping
- Per-event ride coordination UI (consumes Migration 025)
- Better location card (consumes Migration 027)
- Improved RSVP row styling
- Coach note surface with timestamp

## Sprint D — Coach home + coach toolkit

**Scope:** CoachHomePage.jsx + coach-specific actions.
**Est sessions:** 4-5

7 sections per HOME_DESIGN_SPEC Section 2. Quick score entry (coach modal from event card). Coach compensation summary. Message composer shortcut.

## Sprint E — Admin home + admin tools

**Scope:** AdminHomePage.jsx expansion + admin review queues.
**Est sessions:** 5-6

9 sections per HOME_DESIGN_SPEC Section 3. Pending achievements approval UI. Coach comp review. KPI cards. Program health.

## Sprint F — Dark mode + a11y + analytics + multi-org

**Scope:** Cross-cutting concerns.
**Est sessions:** 3-4

Dark CSS variables. Full a11y audit. Analytics event dispatch. Multi-org switcher (light version for future-proofing).

## Sprint G — System hardening

**Scope:** Migrations 029 + 030 + seed data + performance tuning.
**Est sessions:** 1-2

## Sprint H — Phase 2 advanced features

**Scope:** Quick Score, Rotation Planner, Call-Up, Tournament Briefing Generator.
**Est sessions:** 6-8

---

# SECTION 5: TESTING AND VALIDATION REQUIREMENTS

## Pre-migration validation (per migration)

Every destructive migration gets:
1. Pre-execution SELECT showing exact rows to be modified
2. Confirmation from Frank
3. Execution wrapped in BEGIN/COMMIT
4. Post-execution SELECT verifying state
5. Rollback file filed
6. Parent app smoke test (login as Frank, verify 2 children visible, 2 teams visible)
7. Coach app smoke test (when coach home ships)

## Smoke tests per role

**Parent (Frank, fsamaritano@gmail.com):**
- Login → see ParentHomePage
- See Milo (8U) + Charlie (11U) as child filter chips
- Tap team card → see events for that team only
- RSVP for Milo → count updates
- Tap directions on event → opens Maps with correct venue
- No events from other families visible

**Coach (Kenny, coachkenny@legacyhoopers.org):**
- Login → see CoachHomePage (when built)
- See all 5 teams assigned (or subset per coaching_assignments)
- Create event → appears on schedule
- Edit event start_at → notification row created (when Migration 028 ships)

**Admin (admin@legacyhoopers.org):**
- Login → see AdminHomePage
- See all 5 teams + all events
- KPI cards populated
- Pending queue populated when any team_achievements.is_pending_confirmation=true

## RLS validation

After Migration 026 ships:
- As parent, attempt DELETE from events → 403
- As parent, attempt UPDATE on events → 403
- As parent, SELECT events → only my teams visible
- As coach, UPDATE events on assigned teams → 200
- As coach, UPDATE events on unassigned teams → 403
- As admin, all ops on all teams → 200

---

# SECTION 6: ROLLOUT SEQUENCE

## Phase 0B completion (NEXT SESSIONS)

1. Migration 024 — data corrections
2. Migration 026 — RLS granular (after verifying current_user_org_id internals)
3. Migration 027 — location FK + naming + extensions
4. Migration 025 — rides redesign
5. Migration 028 — event notification triggers

## Phase 0C: Ember rebrand

6. Find/replace Skyfire → Ember in UI strings
7. CSS namespace --sf-* → --em-*
8. Logo swap
9. Domain decision

## Phase 1: Parent 95%

10. Sprint A bug fixes
11. Sprint B parent home redesign
12. Sprint C schedule + event detail polish
13. **GATE:** 11U Girls family cohort soft-launch

## Phase 2: Coach 95%

14. Sprint D coach home + toolkit
15. Migration 013 coaching_assignments UI
16. Quick Score feature (Sprint H piece)

## Phase 3: Admin 95%

17. Sprint E admin home + tools
18. Migration 018 achievement approval UI
19. Coach comp invoice flow

## Phase 4: Polish + System

20. Sprint F dark mode + a11y + analytics
21. Sprint G hardening
22. **GATE:** full program rollout Fall 2026

## Phase 5+: Native + Multi-tenant (deferred)

23. Capacitor wrapper
24. Push notifications (FCM/APNs)
25. App Store submission
26. St. Patrick's onboarding (2027)
27. Stripe Connect

---

# SECTION 7: QUESTIONS FOR FRANK

Before Migration 024 can execute:

**Q1 — C3 decision:** Happy Gym is already soft-archived (archived_at = 2026-04-21). Hard-delete the row, or leave archived? (Recommendation: leave archived for audit trail.)

**Q2 — C2 location cascade:** When we delete the duplicate Apr 23 11U Girls practice at "Westchester County Center", should we also delete the `locations` row for Westchester County Center (id 039de263) or just archive it?

**Q3 — Migration 026 timing:** Should granular RLS (Migration 026) ship BEFORE or AFTER Migration 024? Ordering matters because 024 is destructive and needs admin auth.

**Q4 — `current_user_org_id()` investigation:** Should I include verification SQL in the Migration 024 prep, or handle as separate query first?

**Q5 — Location data cleanup scope:** Should location name fixes (St. Patricks → St. Patrick's) live in Migration 024 (data corrections) or Migration 027 (location schema)? Logical fit is 024, but 027 is safer because 024 is already complex.

**Q6 — Tournament placeholders:** Keep the 4 "Tournament - {region}" placeholder locations (Bergen County, Fairfield Co, Westchester, Metrowest)? They have null addresses but are referenced by events. Recommendation: keep for now, polish in Sprint B when event detail shows venue card.

---

**END AUDIT. 46 gaps catalogued. 9 BLOCKERS identified. 7 migrations scoped. 8 sprints sequenced.**

**Next action:** Await Frank's answers to Q1-Q6, then execute Migration 024.
