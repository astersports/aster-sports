# SKYFIRE / EMBER OPTION A 95% AUDIT
**Date:** April 24, 2026
**Launch target:** Fall 2027
**Scope:** 95% elite experience for Parent + Coach + Admin. No compromise.
**Stance:** Build takes as long as it takes. Ship only when it's right.
**Current state:** v2 + main at 8cf2870 | Migrations 013-023 shipped | 110 JSX components

---

# PART 1: EXECUTIVE SUMMARY

## 1.1 Option A locked decisions

| Area | Decision |
|---|---|
| Launch target | Fall 2027 |
| All three roles | 95% polish, no compromise |
| Phase 2 features | IN (Quick Score, Rotation, Call-Up, Briefing Generator) |
| Dark mode | IN |
| Accessibility | IN (WCAG AA) |
| Analytics | IN |
| Push notifications | IN via web push now, Capacitor native later |
| Registration Builder | IN — full 7 program types |
| Payment processing | IN — Stripe Connect (replaces manual Zelle/Venmo) |
| Multi-tenant UI | OUT of 2027 launch, Legacy Hoopers only. Prove multi-org at St. Pat's 2027-28 |
| Spanish locale | DEFER to 2027-28 post-launch |

## 1.2 Total gap count (revised from 46 → 118)

| Severity | Parent | Coach | Admin | Cross-cutting | Total |
|---|---|---|---|---|---|
| 🔴 BLOCKER | 6 | 8 | 12 | 9 | 35 |
| 🟡 CRITICAL | 14 | 15 | 18 | 11 | 58 |
| 🟠 MATERIAL | 4 | 5 | 6 | 5 | 20 |
| ⚪ MINOR | 1 | 1 | 1 | 2 | 5 |
| **TOTAL** | **25** | **29** | **37** | **27** | **118** |

## 1.3 Migration roster (final)

| # | Name | Purpose | Priority | Est lines |
|---|---|---|---|---|
| 024 | Data corrections | 6 destructive corrections | BLOCKER | 150 |
| 025 | Rides redesign | Offers + claims + waitlist | BLOCKER | 300 |
| 026 | RLS granular | Split * policies, 12 tables | BLOCKER | 400 |
| 027 | Location FK + extensions | events.location_id + lat/lng + parking | BLOCKER | 200 |
| 028 | Event notification triggers | Populate event_notifications | BLOCKER | 250 |
| 029 | org_settings seed + trigger | Legacy Hoopers defaults | CRITICAL | 100 |
| 030 | user_preferences default trigger | On user creation | CRITICAL | 80 |
| 031 | Practice plans + drill library | Coach practice tool schema | CRITICAL | 250 |
| 032 | Player development notes | Coach-only private notes | CRITICAL | 150 |
| 033 | Rotation planner + minutes tracking | Pre-game lineup, per-player minutes | CRITICAL | 200 |
| 034 | Call-up workflow | Academy → Active promotion, 2h window | CRITICAL | 180 |
| 035 | Coach messaging threads | In-app staff chat | CRITICAL | 200 |
| 036 | Quick Score | Real-time game score entry | CRITICAL | 250 |
| 037 | Tournament management | Pools, brackets, seeding, advancement | CRITICAL | 400 |
| 038 | Registration Builder schema | 7 program types, form builder | CRITICAL | 500 |
| 039 | Stripe Connect integration | Payment schema, subscription, payouts | CRITICAL | 350 |
| 040 | Roster management + call-up workflow | Active vs Academy, waitlist, lock dates | CRITICAL | 250 |
| 041 | Compliance tracking | SafeSport, background checks, certs | CRITICAL | 180 |
| 042 | Audit log | Who changed what, when, why | CRITICAL | 150 |
| 043 | Financial dashboard views | Revenue, payouts, A/R rollups | MATERIAL | 200 |
| 044 | Analytics events schema | Event dispatch table + aggregation views | MATERIAL | 180 |
| 045 | Family profile + emergency contacts | Per-player medical/emergency data | CRITICAL | 120 |
| 046 | Web push subscription | VAPID keys, subscription storage | CRITICAL | 130 |
| 047 | Onboarding state machine | First-login tutorial tracking | MATERIAL | 100 |

**24 migrations from 024 through 047. Target total: ~5,400 lines of SQL.**

## 1.4 Sprint roster (expanded for Option A)

```
Phase 0B — Infrastructure closing
  Migration 024   1 session (data corrections)
  Migration 025   2 sessions (rides redesign)
  Migration 026   2 sessions (RLS hardening)
  Migration 027   1 session (location FK + data cleanup)
  Migration 028   2 sessions (notification triggers)

Phase 0C — Ember rebrand                  2 sessions

Sprint A — Parent bug fixes               2-3 sessions
Sprint B1 — Parent home core              3 sessions
Sprint B2 — Parent home advanced          3 sessions
Sprint B3 — Parent schedule redesign      3 sessions
Sprint B4 — Parent event detail redesign  3 sessions
Sprint B5 — Parent rides v2               2 sessions
Sprint B6 — Parent family profile         2 sessions
Sprint B7 — Parent trip planning          2 sessions
Sprint B8 — Parent volunteer flow         1 session
Sprint B9 — Parent onboarding tutorial    2 sessions

Sprint C — Push notifications             3 sessions

Sprint D1 — Coach home                    3 sessions
Sprint D2 — Coach attendance taking       2 sessions
Sprint D3 — Coach practice planner        3 sessions
Sprint D4 — Coach player notes            2 sessions
Sprint D5 — Coach rotation planner        2 sessions
Sprint D6 — Coach call-up workflow        2 sessions
Sprint D7 — Coach messaging               2 sessions
Sprint D8 — Coach comp self-report        2 sessions
Sprint D9 — Quick Score entry             3 sessions
Sprint D10 — Tournament weekend UI        3 sessions

Sprint E1 — Admin home + KPI              3 sessions
Sprint E2 — Admin roster management       3 sessions
Sprint E3 — Admin guardian management     2 sessions
Sprint E4 — Admin tournament management   4 sessions
Sprint E5 — Admin Registration Builder    6 sessions
Sprint E6 — Admin Stripe Connect          4 sessions
Sprint E7 — Admin financial dashboard     3 sessions
Sprint E8 — Admin coach comp + payouts    2 sessions
Sprint E9 — Admin achievement approval    1 session
Sprint E10 — Admin compliance tracking    2 sessions
Sprint E11 — Admin audit log + activity   2 sessions
Sprint E12 — Admin season rollover        2 sessions
Sprint E13 — Admin data exports           2 sessions

Sprint F1 — Dark mode                     2 sessions
Sprint F2 — WCAG AA accessibility         3 sessions
Sprint F3 — Analytics instrumentation     2 sessions
Sprint F4 — Empty states                  1 session
Sprint F5 — Error states                  1 session
Sprint F6 — Help + feedback system        2 sessions
Sprint F7 — Account recovery polish       1 session
Sprint F8 — Privacy controls (GDPR-ish)   2 sessions

Sprint G1 — Migration 029-030 hardening   1 session
Sprint G2 — Performance tuning            2 sessions
Sprint G3 — PWA polish                    2 sessions
Sprint G4 — Security audit + pen test     2 sessions

Sprint H — Briefing generator (done last) 3 sessions

Phase 5 Launch prep                       4-6 sessions

TOTAL: 114-122 sessions
```

At 2-3 sessions per week: **10-12 months of consistent work.** Starting May 2026, launch by April-July 2027 with 2-3 month buffer for unexpected issues = **Fall 2027 realistic.**

## 1.5 What Option A buys you

- **Every parent interaction feels premium.** Not 70%. Not 85%. Refined, fast, beautiful.
- **Kenny never falls back to text messages.** All coach workflows live in-app.
- **You stop paying LeagueApps.** Registration Builder + Stripe Connect replaces ~$200-400/month platform fee.
- **St. Pat's onboarding in 2027-28 is a single-day setup.** Multi-org is proven before they arrive.
- **Data advantage compounds.** 1+ year of real attendance, RSVP, performance, payment data feeds Phase 2+ features.
- **Launch quality is your competitive moat.** When families compare Skyfire/Ember to GameChanger, PlayMetrics, or SportsEngine, you win on polish.

## 1.6 What Option A costs you

- **18 months before any family outside Legacy Hoopers staff uses this.** No early validation.
- **Risk of building the wrong features.** Some spec assumptions may prove wrong in real use.
- **Opportunity cost of your time.** ~300 hours of your direct involvement over 12 months.
- **Motivation risk.** Long builds with no user signal test your discipline. Sprint 58 in month 10 needs to feel as important as Sprint 1.

## 1.7 Mitigations built into Option A

- **Internal dogfooding.** You + Kenny + Darien use every sprint's output during build. You're the first testers.
- **Shadow launches.** Ship to admin-only, then coach-only, then one family (yourself), progressively. Catch issues without full rollout.
- **Sprint gates.** Every sprint ends with a working, deployed, QA'd feature. Nothing half-done.
- **Hard 150-line cap.** Keeps debt from accumulating.
- **Evidence-first memory updates.** STATE_OF_AFFAIRS_L99 updated after every sprint, never at end.
- **L99 standard:** every destructive migration pre-verified row-by-row.

---

# PART 2: GAP CATALOG BY ROLE

## 2.1 PARENT ROLE — 25 gaps

### 🔴 Parent BLOCKERS (6)

**P-B1: Home page doesn't reflect HOME_DESIGN_SPEC**
Current ParentHomePage.jsx is 150 lines. Spec is 1199 lines across 13 sections. Full rewrite needed.

**P-B2: events.location free text — no FK link to locations table**
Directions taps produce unreliable Google Maps resolutions. Blocks premium location card UX.

**P-B3: Rides workflow buggy**
Per RIDES_DESIGN_SPEC.md, current event_rides table mixes offer + claim. Migration 025 required.

**P-B4: Push notifications unbuilt**
No web push. No VAPID keys. No service worker subscription. All reminders fail silently today.

**P-B5: Sibling RSVP conflict resolution missing**
Two guardians of same child can both RSVP with conflicting answers. No conflict UI.

**P-B6: Onboarding tutorial missing**
New family clicks invite link, signs up, lands on home. No tutorial. No role explanation. No family setup wizard.

### 🟡 Parent CRITICAL (14)

**P-C1: Density toggle not wired** — Migration 016 schema ready, frontend code missing.

**P-C2: Family profile management** — uniform size, medical, emergency contact, allergies. Schema gaps + UI missing.

**P-C3: Volunteer signup** — duties table exists, UI placeholder only.

**P-C4: Tournament trip planning** — hotel block codes, driving directions, bracket, gym maps, food recs, meetup coordination. New feature set.

**P-C5: Accomplishment scrapbook** — per-child lifetime archive. Schema exists (team_achievements), needs player-scoped view.

**P-C6: Coach message surface on home** — event_comments exists, home doesn't surface coach posts.

**P-C7: Registration/payment reminder on home** — roster_members.payment_status ready, home doesn't query it.

**P-C8: Emergency alert banner** — needs Migration 028 triggers to populate event_notifications.

**P-C9: Live Now card** — check_ins empty in prod, needs coach attendance UI (Sprint D2) to populate.

**P-C10: "Good morning, Frank" underline bug** — CSS fix.

**P-C11: UpcomingEvents.jsx hardcoded stub** — rewrite with real query.

**P-C12: Comments show email not name** — display_name resolution missing.

**P-C13: Games filter excludes tournaments** — filter logic bug.

**P-C14: Season progress % instead of fake 0-0 record** — conditional render needed.

### 🟠 Parent MATERIAL (4)

**P-M1: NextUpCard urgency cap** — cap at <48h.
**P-M2: RSVP optimistic updates** — UI doesn't update until refresh.
**P-M3: Recurring series edit dialog** — swap native confirm for custom.
**P-M4: Login cobalt button** — currently amber.

### ⚪ Parent MINOR (1)

**P-m1: Season dates Mar 22/23 timezone bug**

---

## 2.2 COACH ROLE — 29 gaps

### 🔴 Coach BLOCKERS (8)

**C-B1: CoachHomePage.jsx does not exist**
Kenny logs in, routes to HomePage fallback. No coach-specific home.

**C-B2: Attendance taking UI missing**
Coach can't tap-to-check-in players at event start. check_ins table at 5 rows total in prod because of this.

**C-B3: Quick Score entry missing**
Live game score entry unbuilt. Memory confirms this blocks Day Recap briefing. Migration 036.

**C-B4: Practice planner unbuilt**
Drill library, session plans, templates. Complete feature set missing. Migration 031.

**C-B5: Rotation planner unbuilt**
Staff-only pre-game lineup. Per-player minutes. Migration 033.

**C-B6: Call-up workflow unbuilt**
Academy → Active promotion with 2-hour response window. Migration 034.

**C-B7: Coach-to-coach messaging unbuilt**
Kenny-to-Darien in-app threads. Currently text message. Migration 035.

**C-B8: Tournament weekend command center unbuilt**
Multi-day game tracking, pool standings, bracket advancement, player availability. Migration 037.

### 🟡 Coach CRITICAL (15)

**C-C1: Player development notes** — per-player coach-only notes with privacy. Migration 032.

**C-C2: Coach compensation self-reporting** — "I was here" UI after session. Migration 013 schema ready, UI missing.

**C-C3: Post-game debrief tool** — what worked, who stood out, for next session planning.

**C-C4: Message composer shortcut** — from home, direct to event-scoped team message.

**C-C5: Pending duties/volunteers view** — what still needs coverage for next 7 days.

**C-C6: Recent RSVP/attendance changes view** — who changed their mind, when.

**C-C7: Quick edit event** — inline time/location adjustment from event card.

**C-C8: Player availability rollup** — pre-game "who's in" summary.

**C-C9: Bulk RSVP nudge** — "ping all non-responders" button.

**C-C10: Tournament briefing generator integration** — consume Phase 2 briefing feature per memory.

**C-C11: Coach access to attendance trends** — Migration 023 views ready, UI missing for coach drill-down.

**C-C12: Game result publish workflow** — Migration 014 schema ready, coach publish UI missing.

**C-C13: Duty assignment UI** — assign volunteers to event slots.

**C-C14: Coach can view other coaches' assignments** — for swap requests and coverage.

**C-C15: Coach season summary** — end-of-season dashboard for coach handoff.

### 🟠 Coach MATERIAL (5)

**C-M1: Practice attendance trending** — per-player weekly trend visible to coach.
**C-M2: Coach calendar export** — Migration 007 iCal helpers exist, coach export UI missing.
**C-M3: Video upload** — game film storage + sharing.
**C-M4: Drill library sharing** — share drills with other coaches in org.
**C-M5: Coach notifications preferences** — granular control per notification type.

### ⚪ Coach MINOR (1)

**C-m1: MessageTeamFAB dead click handler**

---

## 2.3 ADMIN ROLE — 37 gaps

### 🔴 Admin BLOCKERS (12)

**A-B1: AdminHomePage at 111 lines — missing most features**
Current minimal. Spec requires 9 sections with KPI cards, Pending Queues, Program Health, Activity Feed, etc.

**A-B2: Registration Builder unbuilt**
7 program types per Option A scope. Full UI suite. Migration 038.

**A-B3: Stripe Connect integration unbuilt**
Payment processing, payout schedules, refunds, 1099 prep. Migration 039.

**A-B4: Tournament management unbuilt**
Pool structure, bracket seeding, results entry, championship claiming. Migration 037.

**A-B5: Roster management unbuilt**
Drag-to-reassign, Active vs Academy classification, lock dates, waitlist. Migration 040.

**A-B6: Guardian relationship management unbuilt**
Add/remove guardians, custody transfers, emergency contact hierarchies.

**A-B7: Financial dashboard unbuilt**
Revenue by team/season/tournament, coach payouts, A/R. Migration 043.

**A-B8: Season rollover workflow unbuilt**
End Spring 2026, prep Summer 2026. Copy roster, archive season, practice carry-over decisions.

**A-B9: Compliance tracking unbuilt**
SafeSport, background checks, certification renewal tracking. Migration 041.

**A-B10: Audit log unbuilt**
Who changed what, when, why. Migration 042. Non-negotiable for disputes.

**A-B11: Data exports unbuilt**
LeagueApps export, CSV roster for tournament directors, tax receipts.

**A-B12: Pending approvals queue UI**
team_achievements.is_pending_confirmation schema ready (Migration 018), admin review UI missing.

### 🟡 Admin CRITICAL (18)

**A-C1: Org-level KPI cards** — teams active, players enrolled, RSVP rate, attendance rate, revenue, pending registrations.

**A-C2: Today's activity feed** — chronological event stream for admin oversight.

**A-C3: Program health heatmap** — per-team snapshot grid.

**A-C4: Upcoming tournaments 30d view** — admin preparation queue.

**A-C5: Coach compensation review** — verify coach self-report, adjust, approve for payout.

**A-C6: Registration health view** — who's signed up, who's waitlisted, who's overdue.

**A-C7: Recent issues/flags** — surface bugs, payment failures, RSVP conflicts.

**A-C8: Quick actions panel** — most common admin tasks 1-tap access.

**A-C9: Admin-level RLS override** — when needed, admin can edit anything with audit trail.

**A-C10: Multi-step approvals** — some actions (refund > $500, roster removal) require 2-admin approval.

**A-C11: Bulk roster operations** — import CSV, bulk invite, bulk assign.

**A-C12: Team creation wizard** — new team flow with circuit, schedule, coaching assignment, roster draft.

**A-C13: Season creation wizard** — new season with start/end, copy previous roster, cost plan.

**A-C14: Location creation + edit UI** — today's admin UI gap, Migration 027 schema needs matching form.

**A-C15: Opponent management** — add opponents for league + tournament scheduling.

**A-C16: Coach assignment UI** — Migration 013 schema, admin UI to create/edit coaching_assignments.

**A-C17: Announcement broadcasting** — org_announcements table exists, admin composer UI missing.

**A-C18: Organization settings UI** — Migration 017 schema ready, admin-facing form missing.

### 🟠 Admin MATERIAL (6)

**A-M1: White-label prep** — branding upload UI for future org onboarding.
**A-M2: Report scheduler** — weekly/monthly automated reports.
**A-M3: Custom field builder** — for registration forms beyond standard fields.
**A-M4: Communication templates** — reusable message templates.
**A-M5: Segment builder** — select "all parents of 11U Girls with unpaid balance" type queries.
**A-M6: Coach performance reviews** — structured periodic evals.

### ⚪ Admin MINOR (1)

**A-m1: Admin copy roster clipboard fallback**

---

## 2.4 CROSS-CUTTING — 27 gaps

### 🔴 Cross-cutting BLOCKERS (9)

**X-B1: Push notifications infrastructure**
VAPID keys, service worker, subscription storage, dispatcher Edge Function. Migration 046.

**X-B2: Dark mode palette**
Full CSS variable set for dark. Audit 100+ components.

**X-B3: WCAG AA accessibility pass**
ARIA labels, keyboard nav, focus outlines, screen reader landmarks, prefers-reduced-motion.

**X-B4: Analytics instrumentation**
Pick library (PostHog recommended), event dispatch on every meaningful interaction. Migration 044.

**X-B5: Stripe Connect platform setup**
Merchant account, Connect configured, webhooks wired, test mode verified.

**X-B6: Email infrastructure**
Transactional email provider (Resend/Postmark), templates for invite/receipt/reminder/password-reset.

**X-B7: SMS infrastructure (optional but premium)**
Twilio for emergency cancellation fallback when push fails.

**X-B8: Error monitoring**
Sentry configured, source maps, release tracking. Currently stub file exists.

**X-B9: Backups + disaster recovery**
Supabase Point-in-Time-Recovery verified. Export schedule. Test restore once.

### 🟡 Cross-cutting CRITICAL (11)

**X-C1: Empty states** — every screen needs "no events" / "caught up" / "no messages" intentional states.

**X-C2: Error states** — network failures, 403s, 500s handled gracefully.

**X-C3: Help + feedback system** — in-app "How do I X?" + bug report + feature request.

**X-C4: Account recovery** — "lost phone, remove device" flow.

**X-C5: Privacy controls** — delete-my-data, export-my-data, unsubscribe (GDPR-ish).

**X-C6: Age-gate + COPPA** — under-13 cannot have accounts, guardian-only.

**X-C7: Loading skeletons** — already exists as component, audit usage.

**X-C8: Offline indicator** — already exists, audit behavior.

**X-C9: Pull-to-refresh** — already implemented, audit all pages.

**X-C10: Install prompt refinement** — PWA install, iOS add-to-home-screen hint.

**X-C11: Session management** — idle timeout, remember-me, multi-device.

### 🟠 Cross-cutting MATERIAL (5)

**X-M1: Image optimization** — Supabase storage with WebP conversion.
**X-M2: Query caching** — React Query with staleTime per entity type.
**X-M3: Code splitting** — route-based lazy loading.
**X-M4: Service worker beyond push** — offline schedule view, asset caching.
**X-M5: Font subsetting** — Inter bundle optimization.

### ⚪ Cross-cutting MINOR (2)

**X-m1: Meta tags polish** — OpenGraph, Twitter card, app-touch-icon.
**X-m2: Dev console noise cleanup** — clean up warnings.

---

# PART 3: MIGRATION DETAILED SPECS

## Migration 024: Data corrections (destructive)

**Scope:** 6 corrections per memory.

- **C1** UPDATE events SET end_at tournament 00:00-23:59 → 08:00-20:00 Eastern
- **C2** DELETE duplicate Apr 23 11U Girls practice (keep WCC by location_id = ec577cca)
- **C3** DELETE Westchester County Center locations row (id 039de263) — no longer needed
- **C4** DELETE Happy Gym locations row (id 52c376bd) — confirmed no event references
- **C5** UPDATE event_rsvps SET comment = NULL WHERE player_id = Milo AND comment ILIKE '%test%'
- **C6a** UPDATE events SET title = '2026 Zero Gravity Girls National Finals' WHERE title = 'Girls Nationals if qualify'
- **C6b** UPDATE events SET title = '2026 Zero Gravity Boys National Finals' WHERE title = 'Boys Nationals if qualify'
- **C7** DELETE any 8U Boys events with "Nationals" in title, INSERT "BBallShootout: Pre Summer Hoops Jam Classic 1" at Bergen County, NJ, Jun 6-7 2026 08:00-20:00 Eastern

**Pre-verification required for each correction.**

**Location data cleanup batched into Migration 027 per Q5 decision.**

## Migration 025: Rides redesign

**Scope:** Per RIDES_DESIGN_SPEC.md — Model C round-trip.

**New tables:**
- event_ride_offers (id, event_id, driver_guardian_id, direction [arrival/return/both], capacity, available_seats, pickup_location, pickup_time, notes, status, created_at)
- event_ride_claims (id, offer_id, claimant_guardian_id, player_id, direction, status [pending/confirmed/cancelled/auto_confirmed/waitlisted], waitlist_position, claimed_at, confirmed_at, auto_confirm_at)

**events table ADD:**
- ride_coordination_enabled boolean DEFAULT false

**SECURITY DEFINER helpers:**
- can_claim_offer(offer_id, claimant_id) — checks capacity + same event team
- auto_confirm_pending_claims(offer_id) — runs at T+12h

**RLS policies:**
- Offers: parents of event's team SELECT, owner UPDATE/DELETE
- Claims: claimant SELECT/UPDATE own, offer-owner SELECT claims to their offer
- Admin full access

**Data migration:**
- Current event_rides rows → event_ride_offers with direction='both' default
- Claims stay unmigrated (data is messy, better to start fresh)

## Migration 026: RLS granular policies

**Scope:** Split 11 tables' `*` policies into SELECT + modify pairs.

**Pre-verification:** Confirm `current_user_org_id()` function uses user_roles (not org_members). If it queries org_members, refactor function before policies.

**Tables + policy pairs:**

- **events:** SELECT (org users) + modify (admin+coach per user_has_role_in_org)
- **teams:** SELECT (org users) + modify (admin only)
- **team_players:** SELECT (org users see teams in own org) + modify (admin+coach of that team)
- **team_staff:** SELECT (org users) + modify (admin only)
- **seasons:** SELECT (org users) + modify (admin only)
- **locations:** SELECT (org users) + modify (admin only)
- **opponents:** SELECT (org users) + modify (admin+coach)
- **event_notifications:** SELECT (recipient or admin) + modify (system only via SECURITY DEFINER triggers)
- **player_activations:** SELECT (coach/admin/parent of player) + modify (coach+admin)
- **user_roles:** stays user-scoped (self-only)
- **guardian_notification_prefs:** stays user-scoped (self-only)
- **organizations:** keep broad SELECT until multi-org ships

**RLS test suite required:** 30+ test cases covering parent/coach/admin access to each table.

## Migration 027: Location FK + extensions + data cleanup

**Scope:** events.location_id FK + location schema richness + name/address cleanup.

**ADD COLUMNS:**
- events.location_id uuid NULL REFERENCES locations(id) ON DELETE SET NULL
- locations.latitude decimal(9,6)
- locations.longitude decimal(9,6)
- locations.google_maps_url text
- locations.apple_maps_url text
- locations.waze_url text
- locations.parking_notes text
- locations.entry_instructions text
- locations.subroom_notes jsonb DEFAULT '{}'

**INDEX:**
- idx_events_location_id ON events(location_id) WHERE location_id IS NOT NULL

**BACKFILL:**
Event.location text → locations.id match via case-insensitive name.

**DATA CLEANUP (per Q5 decision — use gym-locations-v4.html as source of truth):**

Canonical location data per Frank's HTML file:

| Current name | Corrected name | Full address | Lat | Lng |
|---|---|---|---|---|
| "St. Patricks" | "St. Patrick's" | "29 Cox Ave, Armonk, NY 10504" | 41.1246 | -73.7138 |
| "Harvey School" | "The Harvey School" | "260 Jay St, Katonah, NY 10536" | 41.2508 | -73.6854 |
| "Westchester Community College (WCC)" | "Westchester Community College" | "75 Grasslands Rd, Valhalla, NY 10595" | 41.0937 | -73.8237 |
| "Rippowam Cisqua School" | (unchanged) | "439 Cantitoe St, Bedford, NY 10506" | 41.2031 | -73.6540 |

Similar for the 12 away venues — map all to full addresses.

**PRESERVE per Q6 decision:** 4 "Tournament - {region}" placeholders. These communicate "pre-season TBD venue in this region" until pool assignments drop.

## Migration 028: Event notification triggers

**Scope:** Populate event_notifications on key state changes.

**Trigger functions:**

```
notify_event_created(event_id, triggered_by)
notify_event_cancelled(event_id, triggered_by, reason)
notify_event_rescheduled(event_id, triggered_by, old_start, new_start)
notify_event_relocated(event_id, triggered_by, old_location_id, new_location_id)
notify_event_comment_posted(comment_id, triggered_by)
notify_rsvp_changed(rsvp_id, triggered_by, old_response, new_response)
notify_ride_offered(offer_id, triggered_by)
notify_ride_claimed(claim_id, triggered_by)
notify_duty_claimed(duty_id, triggered_by)
notify_achievement_earned(achievement_id, triggered_by)
notify_achievement_confirmed(achievement_id, admin_id)
```

**Triggers:**
- AFTER INSERT ON events FOR EACH ROW EXECUTE notify_event_created
- AFTER UPDATE OF status ON events FOR EACH ROW WHEN (NEW.status='cancelled') EXECUTE notify_event_cancelled
- AFTER UPDATE OF start_at ON events FOR EACH ROW EXECUTE notify_event_rescheduled
- AFTER UPDATE OF location_id ON events FOR EACH ROW EXECUTE notify_event_relocated
- AFTER INSERT ON event_comments FOR EACH ROW EXECUTE notify_event_comment_posted
- ...

**Dispatch behavior:** Trigger INSERTs rows into event_notifications with status='pending'. Separate Edge Function (post-launch hardening) polls status='pending' rows, dispatches to web push via Migration 046 subscriptions, updates status → 'sent' → 'delivered'.

**Change summary auto-generation:** Trigger functions compute human-readable change_summary jsonb:
```
{
  "field": "start_at",
  "old": "2026-04-23T17:00-04:00",
  "new": "2026-04-23T18:00-04:00",
  "human": "Moved from 5:00 PM to 6:00 PM"
}
```

## Migrations 029-047: Summary table

Detailed specs for migrations 029-047 will be authored in-chat before each one ships, per L99 standard. Headlines:

| # | Schema additions | Key design choices |
|---|---|---|
| 029 | organization_settings seed + insert trigger | Legacy Hoopers default row |
| 030 | user_preferences default trigger | Applies org defaults on user creation |
| 031 | practice_plans + drills tables | Drill library with attribution |
| 032 | player_development_notes | Coach-only, privacy enforced via RLS |
| 033 | event_rotations + event_minutes_tracked | Pre-game lineup, per-player minutes |
| 034 | call_up_offers + call_up_responses | 2-hour response window trigger |
| 035 | coach_threads + coach_messages | Staff-only messaging |
| 036 | game_live_state + game_events | Real-time score entry + event log |
| 037 | tournament_pools + tournament_games + tournament_brackets | Full tournament mgmt |
| 038 | registration_programs + registration_forms + form_fields + registrations | 7 program types |
| 039 | stripe_customers + stripe_subscriptions + stripe_payouts + payments | Stripe Connect |
| 040 | roster_call_ups + waitlist + roster_locks | Active/Academy workflow |
| 041 | compliance_records + certifications + background_checks | SafeSport tracking |
| 042 | audit_log | Who/what/when/why of every mutation |
| 043 | financial_rollup_views | Revenue, A/R, payout summaries |
| 044 | analytics_events + analytics_rollups | PostHog-compatible schema |
| 045 | player_emergency_contacts + player_medical | Per-player detail |
| 046 | push_subscriptions + vapid_keys | Web push infrastructure |
| 047 | user_onboarding_state | First-login tutorial tracking |

---

# PART 4: SPRINT SEQUENCING WITH DEPENDENCIES

## Phase 0B — Infrastructure (5-8 sessions)

```
024 ──► 025 ──► 026 ──► 027 ──► 028
 │       │       │       │       │
 └─┬─────┴───┬───┴───┬───┴───┬───┘
   │         │       │       │
   ▼         ▼       ▼       ▼
 Data     Rides   RLS   Location  Notification
 clean    fixed  tight   FK        triggers
```

Must complete before any UI sprint can start.

## Phase 0C — Ember rebrand (2 sessions)

```
Find/replace Skyfire → Ember ──► CSS --em-* → --em-* ──► Logo swap ──► Domain decision
```

Independent of schema. Can run parallel to Phase 1 if needed.

## Phase 1 — Parent (18-22 sessions)

Sprint A (bug fixes) has no dependencies. Can start immediately after Phase 0B.

Sprint B1 (home core) depends on:
- Migration 023 VIEWs ✓ shipped
- Migration 028 notifications for emergency banner
- Migration 027 location FK for event cards

Sprint B2 through B9 are largely independent and can sequence freely.

Sprint C push notifications depends on:
- Migration 046 subscription schema
- Web push browser API + service worker

## Phase 2 — Coach (22-27 sessions)

Sprint D1 (home) depends on:
- Migration 013 coaching_assignments ✓ shipped
- Migration 023 VIEWs ✓ shipped

Sprint D2 attendance unlocks D1 full functionality.

Sprint D3 practice planner depends on Migration 031.

Sprint D4 notes depends on Migration 032.

Sprint D5 rotation depends on Migration 033.

Sprint D6 call-up depends on Migration 034 + 040.

Sprint D7 messaging depends on Migration 035.

Sprint D8 comp self-report reuses Migration 013 + adds UI only.

Sprint D9 Quick Score depends on Migration 036.

Sprint D10 tournament UI depends on Migration 037.

**Optimization:** D1-D2 can ship early. D3-D9 can parallel if 2 devs available.

## Phase 3 — Admin (30-35 sessions)

Sprint E1 (home) is immediately unblockable after Phase 0B.

Sprint E2 roster mgmt depends on Migration 040.

Sprint E3 guardian mgmt reuses existing schema.

Sprint E4 tournament mgmt depends on Migration 037.

Sprint E5 Registration Builder depends on Migration 038. **6 sessions because 7 program types × full CRUD.**

Sprint E6 Stripe Connect depends on Migration 039. **4 sessions including Stripe platform setup + webhook testing.**

Sprint E7-E13 sequence based on user signal after E1-E6 ship.

## Phase 4 — Cross-cutting (12-14 sessions)

Sprint F1-F8 can run in parallel or after role sprints ship.

Dark mode + a11y + analytics should ship BEFORE launch, not at end.

Help + feedback ships mid-Phase 3 so testers can report issues.

## Phase 5 — Launch prep (4-6 sessions)

- Load test with synthetic traffic (1000 concurrent users)
- Security audit + pen test (external)
- Legal review (ToS, Privacy Policy, SafeSport compliance docs)
- Customer support playbooks
- App Store prep (Capacitor wrapper, icons, screenshots, ASO)
- Marketing site polish
- Onboarding materials for new orgs

---

# PART 5: TESTING + VALIDATION STRATEGY

## Per-migration validation

Every schema migration:
1. Pre-execution SELECT verifying state to be changed
2. Frank confirms rows are correct
3. Execute in transaction with BEGIN/COMMIT
4. Post-execution SELECT verifying new state
5. Rollback file authored + filed
6. Parent smoke test (Frank's login works, 2 kids visible, 2 teams visible)
7. Coach smoke test (Kenny login works) [after D1 ships]
8. Admin smoke test (admin login works, KPIs load)
9. RLS smoke test: attempt forbidden operations as parent, expect 403
10. Regression test: last sprint's features still work

## RLS test suite (Migration 026 gates)

30+ test cases:
- Parent SELECT events → only own teams
- Parent UPDATE events → 403
- Parent DELETE events → 403
- Parent SELECT own guardian row → 200
- Parent SELECT another guardian's row → 403 (Migration 022 verified)
- Coach SELECT events assigned team → 200
- Coach UPDATE events assigned team → 200
- Coach UPDATE events unassigned team → 403
- Coach SELECT other coach's player notes → 403 (Migration 032)
- Admin full access → 200 everywhere

## Sprint acceptance criteria

Each sprint ends with:
1. Feature deployed to Vercel
2. Manual QA on mobile Safari + Chrome + Firefox (phone + tablet + desktop)
3. Lighthouse performance score ≥ 90
4. WCAG AA check via axe-core
5. Analytics events firing correctly
6. No console errors
7. Documentation updated in SKYFIRE_BUILD_QUEUE_v2
8. Screenshot captured for audit trail

## Pre-launch gates

Before Fall 2027 launch:
- [ ] All 118 gaps closed or explicitly accepted-as-is
- [ ] External security audit passed
- [ ] Load test at 1000 concurrent users passes
- [ ] Legal review signed off
- [ ] ToS + Privacy Policy live
- [ ] Support playbooks documented
- [ ] Incident response plan in place
- [ ] Backup + restore tested at least twice
- [ ] Analytics dashboard populated with 30 days of test data
- [ ] Kenny + Darien sign off on coach experience
- [ ] Frank signs off on admin experience
- [ ] 1 beta family (Samaritano) signs off on parent experience
- [ ] App Store submission approved (iOS + Android)
- [ ] Domain + SSL + CDN verified
- [ ] Rollback plan documented

---

# PART 6: ROLLOUT PHASING

## Stage 1 — Internal only (month 1-8 of build)
Frank (admin) + Kenny (coach) + Darien (coach) dogfood every sprint during build.

## Stage 2 — Shadow launch (month 9 of build)
Deploy to production with feature flag off for all but Frank's family. Test all parent flows end-to-end against real data.

## Stage 3 — First family alpha (month 10)
Enable for 2-3 trusted Legacy Hoopers families (co-founder friends). 4 weeks feedback.

## Stage 4 — 11U Girls beta (month 11)
Enable for full 11U Girls cohort (~10 families). 2 weeks feedback.

## Stage 5 — Full Legacy Hoopers launch (month 12)
All 5 teams + all families. Retain LeagueApps for 1 more month as safety net.

## Stage 6 — Retire LeagueApps (month 13)
LeagueApps subscription cancelled. Full reliance on Ember.

## Stage 7 — St. Pat's onboarding (month 18+)
Multi-org proven. Second org live. 2027-2028 season.

---

# PART 7: KEY METRICS + EXIT CRITERIA

## Per-role launch metrics (must hit to call 95%)

### Parent
- Home page Time-to-Interactive < 1.5s on 4G mobile
- RSVP completion rate > 90% per event (measured over 4 weeks)
- Ride coordination utilization > 60% on tournament weekends
- Push notification opt-in > 75%
- Zero P0 bugs reported in 4-week observation window

### Coach
- Attendance take rate > 85% of practices/games (measured weekly)
- Coach reports 0 fallbacks to text message for team coordination
- Practice plan usage > 70% of practices
- Quick Score entry completion > 90% of games

### Admin
- Weekly admin time-in-app < 3 hours (for Legacy Hoopers scale)
- Registration-to-first-payment time < 72h average
- Zero reconciliation errors between Ember and bank records
- 100% compliance tracking up-to-date

## Technical metrics

- p95 API response time < 200ms
- Error rate < 0.1% across all surfaces
- Lighthouse Performance > 90 on all public pages
- Lighthouse Accessibility > 95 on all pages
- Bundle size < 300KB gzipped for initial page load
- 0 critical or high CVE vulnerabilities

---

# PART 8: IMMEDIATE NEXT ACTIONS

## Session 1 (next session after audit sign-off)

1. Answer Q4 from original audit: verify `current_user_org_id()` internals
2. Execute Migration 024 with per-correction pre-verification
3. Lock + deploy + smoke test

## Session 2-3

Migration 025 rides redesign (300-line migration, multi-step).

## Session 4-5

Migration 026 RLS granular policies (400 lines, 12 tables, full test suite).

## Session 6

Migration 027 location FK + extensions + data cleanup.

## Session 7-8

Migration 028 notification triggers.

## Session 9-10

Phase 0C Ember rebrand.

## Session 11+

Sprint A bug fixes begin.

---

**END AUDIT.**

**118 gaps catalogued. 35 BLOCKERS. 24 migrations scoped. 114-122 sessions planned. Fall 2027 launch realistic.**

**Option A is the most ambitious path. It's also the one where you win on polish, own your platform, and build compounding data advantage. L99.**

