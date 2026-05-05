# SKYFIRE / EMBER — HOME DESIGN SPECIFICATION

**Version:** 1.0
**Written:** April 24, 2026
**Owner:** Frank Samaritano
**Status:** APPROVED — ready for Phase 1 implementation
**Depends on:** Migrations 013-022 for schema foundation

---

## PURPOSE

The home page is the single most important surface in Skyfire/Ember. It's where all 3 roles (Parent, Coach, Admin) win or lose on the 5-second test. This document specifies the complete design for all 3 home pages, every scenario, every density state, and every cross-role consideration.

This spec is the single source of truth. Implementation references this document, not the build queue.

---

## GUIDING PRINCIPLES

### 1. Every role has a distinct home — but shared vocabulary
- Nav tab label: "Home" for all 3 roles (locked decision Q6)
- Content differs dramatically per role
- Shared nav structure (5 tabs) per Q4 decision

### 2. Three densities per section — Minimal / Medium / Maximum
- Default: Medium for all sections, all roles (locked in Migration 016 user_preferences.card_density)
- Per-card override via chevron menu
- Persistent per user per card

### 3. Conditional rendering
- Sections that have nothing to show should not render
- Empty states are designed, not accidental
- Action-free state feels calm, action-needed state feels urgent

### 4. Multi-tenant ready from day one (Q3)
- Org switcher scaffold in header, hidden until user has >1 org membership
- All queries scope to current active org_id
- Visual identity adapts to org (brand color, logo)

### 5. Role-driven CTAs in FAB (Q5)
- Floating action button contextual to role + state
- Parent: primary family action (Open messages / Quick RSVP)
- Coach: primary coaching action (Start Check-In / Quick Score)
- Admin: primary ops action (Create Event / Send Announcement)

### 6. Personalization deferred but architected (Q7)
- No section reordering in Phase 1
- user_preferences.role_preferences JSONB already in place for future
- Don't paint into corners

### 7. Full accessibility (Q1 all)
- WCAG AA minimum, AAA for body
- Screen reader labels on all interactive elements
- Keyboard navigation full support (desktop admin/coach)
- Reduced motion respect
- Dark mode designed and implemented (Q10)

### 8. Analytics instrumented (Q9)
- Event tracking on card views, CTA taps, density changes
- Behind feature flag initially
- Ember will use this to iterate

### 9. Performance budget
- First paint <500ms on 4G
- Interactive <1.5s
- Above-fold critical, below-fold lazy
- Stale-while-revalidate for non-critical data

---

## SHARED LAYOUT SHELL — All 3 Roles

### Header (persistent across all roles, all scenarios)

Components top to bottom:
- Left: Logo (Legacy Hoopers knight, 32px) or org logo if different
- Center: Org name ("Legacy Hoopers LLC") muted, 14pt
- Right: Notification bell, Settings gear icon
- Subtle cobalt band across bottom of header (4px)

Header height: 64px on mobile, 72px on desktop.

Header is sticky on scroll.

When user has >1 org membership, logo becomes a dropdown chevron showing org switcher.

### Greeting block (per role, varies)

- Parent: "Good morning, Frank" (28pt, slate-800, reduced from previous 36pt)
- Coach: "Good morning, Kenny · Coach" (28pt with role badge)
- Admin: "Good morning, Frank · Admin" (28pt with role badge)

Beneath greeting:
- Date subtle: "Thursday, April 24" (14pt, slate-500)
- Cobalt accent line under greeting (2px tall, 40px wide)

### Bottom nav (persistent, 5 tabs, shared across roles per Q4)

Tabs:
1. **Home** — role-specific home page (parent/coach/admin)
2. **Schedule** — role-filtered schedule
3. **Locations** — venue directory
4. **Teams** — team directory (role-appropriate view)
5. **Messages** — role-specific messaging hub

Active tab: cobalt accent (--em-accent).
Inactive: gray icon + label.
Tap target: 44px minimum.

### Floating action button (Q5 decision)

Bottom-right of home, 56px circle, team color or accent based on context.

Role-specific primary action:
- **Parent:** "Open Messages" (primary communication) OR "Quick RSVP" when action pending
- **Coach:** "Start Check-In" (during pre-event window) OR "Quick Score" (during/post-game) OR "Message Team"
- **Admin:** "Create Event" OR "Send Announcement" OR "Send Alert" during emergencies

FAB state transitions based on time, role, and active state.

---

# SECTION 1: PARENT HOME

## 1.1 Sections (order, conditional rendering)

Parent home renders these sections in order. Sections in [brackets] are conditional.

1. Header (always)
2. Greeting (always)
3. [EMERGENCY ALERT BANNER] — only when urgent cancellation/change
4. [ACTION ZONE] — only when parent has items to handle
5. [LIVE NOW CARD] — only during active events parent has kids in
6. NEXT UP — always (one card per child's team)
7. MY TEAMS STRIP — always (per D2 decision, data-rich)
8. [RECOGNITION CARD] — 24-48h after notable events
9. [COACH MESSAGE BLOCK] — when recent coach msg within 24h
10. THIS WEEK — always
11. [REGISTRATION/PAYMENT REMINDER] — when payment_status != 'paid'
12. [UPCOMING TOURNAMENT WEEKEND BANNER] — when tournament within 72h
13. FAB — always (bottom-right)

### 1.1.1 EMERGENCY ALERT BANNER

**Trigger:** When an event_notifications row exists for user with notification_type='cancellation' or 'schedule_change' in the last 24h AND event is upcoming within next 48h.

**Behavior:** Red-bordered card at very top, dismissible via X.

**Visual:**
```
┌────────────────────────────────────┐
│ 🔴 PRACTICE CANCELLED               │
│ 11U Girls · tonight 6 PM            │
│ Cancelled 23 min ago                │
│ [Tap for details] [X]               │
└────────────────────────────────────┘
```

**Density states:**
- Minimal: "🔴 1 change — tap to see" (one line)
- Medium (default): Full card as shown above
- Maximum: + full coach message + alternate plan if provided

**Interactions:**
- Tap: navigates to event detail
- X: dismisses this alert (stored in localStorage, re-appears if new alert)
- Persists until: user dismisses OR event passes

### 1.1.2 ACTION ZONE

**Trigger:** When parent has any of: pending RSVP, ride needed for confirmed-RSVP event, open volunteer slot on confirmed event, payment overdue.

**Visual (Medium default):**
```
┌────────────────────────────────────┐
│ 3 THINGS TO HANDLE                  │
│ ──────────────────────────────────  │
│ 🟡 Milo: RSVP Tue practice          │
│ [Going] [Can't] [Maybe]             │
│ ──────────────────────────────────  │
│ 🟡 Charlie: Sat ride needed         │
│ [Offer ride] [Request ride]         │
│ ──────────────────────────────────  │
│ 🟡 Fri tournament snack open        │
│ [Claim]                             │
└────────────────────────────────────┘
```

**Density states:**
- Minimal: "3 things need your attention — tap to expand"
- Medium (default): Top 3 items with inline CTAs
- Maximum: All items with full context (who, what, when, why)

**Sort order:** By urgency:
1. Urgent (<12h to event)
2. Time-sensitive (<48h)
3. Normal priority
4. Ticks down as action is completed

**Animation:** When user completes an action, item slides out with success checkmark. Card height adjusts.

### 1.1.3 LIVE NOW CARD

**Trigger:** Active event (event.status='scheduled' AND event.start_at <= now() <= event.end_at) where parent has a child on the event's team.

**Visual:**
```
┌────────────────────────────────────┐
│ 🟢 HAPPENING NOW                    │
│ Charlie at 11U Girls Practice       │
│ Check-in: 10 of 12 ✓                │
│ Coach Kenny present                 │
│ Ends 7 PM (in 38 min)               │
│ [Open event]                        │
└────────────────────────────────────┘
```

**Density states:**
- Minimal: "Charlie at practice · 38m left"
- Medium (default): Full card with check-in count and coach presence
- Maximum: + live attendance details + coach notes + real-time updates if any

**Green dot pulses** to indicate active.

**Behavior:** Card removes itself when event ends.

### 1.1.4 NEXT UP CARDS (always)

**One card per child's team** (handles multi-child naturally — Frank sees 11U Girls Next Up AND 8U Boys Next Up).

**Visual (Medium default):**
```
┌────────────────────────────────────┐
│ TONIGHT 6:00 PM · in 57m · ● active │
│ 11U Girls · Practice                │
│ ──────────────────────────────────  │
│ 📍 Westchester County Center        │
│ 🕐 Arrive by 5:55 PM · Jersey #7    │
│                                     │
│ ✓ Charlie Going · Ride ✓ · Snack ✓  │
│                                     │
│ [Open event] [Navigate]              │
│                                     │
│ •••  ← density chevron (top-right)  │
└────────────────────────────────────┘
```

**Left accent bar:** team color (4px wide, full card height).

**Density states:**
- **Minimal:**
```
TONIGHT 6:00 PM · in 57m
11U Girls Practice
Charlie ✓ Going
```
Two lines, minimal info. Tap for detail.

- **Medium (default):** Card as shown above. ~180px tall.

- **Maximum:**
```
TONIGHT 6:00 PM · in 57m · ● active
11U Girls · Practice
──────────────────────────────────
📍 Westchester County Center
   [Directions] [Entry code: 4-digit]
   Parking: lot B

🕐 Arrive by 5:55 PM · Jersey #7
👕 Pack: water bottle, sneakers

RSVP STATUS
Going: 8 of 12
Maybe: 2
Not going: 1
No response: 1

MY CHILD
Charlie (Going)
"tested" — Frank's note

COACH NOTES
"Bring water — no fountain in gym 3"
— Coach Kenny, 2h ago

RIDES (1 seat open)
Driving: Smith family (3 seats)
[Claim seat]

SNACKS (2 of 3 filled)
Frank ✓  Wilson ✓  [Open slot]

[Open event] [Navigate] [Message team]
```
~420px tall. Parents who want everything see everything.

**Urgency state coloring:**
- <1h to event: red-orange left bar (on top of team color), countdown in red
- 1-6h: green border accent, countdown in green
- 6-24h: gray accent
- 24h+: no special accent

**Countdown:** Ticks down in real-time using React interval. Not stale.

### 1.1.5 MY TEAMS STRIP (always, per D2 decision)

**Purpose:** Dynamic team pulse reference. Data-rich when records exist.

**Visual (Medium default):**
```
┌────────────────────────────────────┐
│ MY TEAMS                            │
│ ──────────────────────────────────  │
│ [Horizontal scroll row of cards]    │
│                                     │
│ 11U Girls       8U Boys              │
│ 3-1             0-0                  │
│ Next: Tue 6pm   Next: Tue 5:30      │
│ Attn: 95% ↑     Ready for first game│
└────────────────────────────────────┘
```

Each team card:
- Left accent: team color
- Team name (14pt bold)
- Record OR season status (14pt, from records feature)
- Next event (12pt, relative date)
- Attendance rate with trend arrow (12pt, when data exists via Migration 023)

**Record data source:** From existing records feature (per D2). Pre-season shows "Ready for first game" until first game played.

**Density states:**
- Minimal: Team names only (color dots)
- Medium (default): As shown above
- Maximum: + recent result ("Last: W 42-36 vs Pleasantville") + attendance streak + pace vs season record

**Tap behavior:** Navigates to TeamDetailPage.jsx for that team.

### 1.1.6 RECOGNITION CARD (conditional, tiered per Q8)

**Trigger:** Published team_achievement record exists for parent's child's team with `confirmed_at` within persistence window:
- Standard result: 24 hours
- Tournament result: 48 hours
- Championship/Nationals Qualified: 7 days
- Custom admin-featured: configurable, default 7 days

**Visual:**
```
┌────────────────────────────────────┐
│ [Team color background]             │
│ 🏆 JUST NOW                         │
│ 11U Girls won Metro Showdown!       │
│ 42-38 vs NY Blaze                   │
│ [See highlights] [Share]            │
│                                  [X] │
└────────────────────────────────────┘
```

**Density states:**
- Minimal: "🏆 Just won Metro Showdown" (one line, muted team color)
- Medium (default): Full card, team color background
- Maximum: + photo placeholder + game details + share-to-social CTA

**Persistence:** After active window, collapses to team's season archive (Phase 2). Visible from team detail page.

**Dismiss:** X button removes from home but NOT from team archive.

### 1.1.7 COACH MESSAGE BLOCK (conditional)

**Trigger:** When any of parent's children's teams' coach posted a message in team chat within last 24h AND message is for an upcoming event.

**Visual:**
```
┌────────────────────────────────────┐
│ Coach Kenny · 2h ago                │
│ ──────────────────────────────────  │
│ "Hey families, bring a water bottle │
│ tonight — no fountain in gym 3."   │
│ [Reply] [Open 11U Girls chat]       │
└────────────────────────────────────┘
```

**Density states:**
- Minimal: "Coach posted 1h ago — tap to see" (one line)
- Medium (default): Quote + reply/open actions (as shown)
- Maximum: + full thread preview with most recent replies

**Dismiss:** Marked read on tap. Re-appears when new message arrives.

### 1.1.8 THIS WEEK (always)

**Visual (Medium default):**
```
┌────────────────────────────────────┐
│ THIS WEEK                           │
│ ──────────────────────────────────  │
│ TODAY                               │
│ 6:00 PM · 11U Girls Practice · WCC │
│ ✓ Charlie Going                     │
│                                     │
│ TOMORROW                            │
│ 5:30 PM · 8U Boys Practice · Gym 2 │
│ ❓ Milo — not RSVPd                 │
│                                     │
│ FRIDAY                              │
│ 7:00 PM · 11U Girls Game · Armonk   │
│ ✓ Charlie Going                     │
│                                     │
│ SATURDAY                            │
│ 10:00 AM · 8U Boys Tournament       │
│ ❓ Milo — not RSVPd                 │
│                                     │
│ [See full schedule →]                │
└────────────────────────────────────┘
```

**Relative date language:**
- Today → "TODAY"
- Tomorrow → "TOMORROW"
- 2-7 days: Day name ("Friday") or "In 2 days"
- 8+ days: "Apr 30" or "Tue, Apr 30"

**Density states:**
- Minimal: "4 events this week" (count only)
- Medium (default): Compact cards per event, up to 5 visible
- Maximum: Full event cards with all info

**Sort:** Chronological, earliest first.

**Child-filter chips** (optional): Shows [All] [Charlie] [Milo] when family has >1 child.

### 1.1.9 REGISTRATION/PAYMENT REMINDER (Q2 decision)

**Trigger:** parent has roster_members.payment_status != 'paid' for any of their children.

**Visual (Medium default):**
```
┌────────────────────────────────────┐
│ ⚠ REGISTRATION INCOMPLETE           │
│ Milo · 8U Boys                      │
│ $150 due · Pay by May 1st           │
│ [Complete registration →]            │
└────────────────────────────────────┘
```

**Density states:**
- Minimal: "1 registration pending — tap to complete"
- Medium (default): Full card as shown
- Maximum: + payment history + breakdown of what's owed + contact options

**Persistence:** Until paid.

### 1.1.10 UPCOMING TOURNAMENT WEEKEND BANNER

**Trigger:** Tournament event within 72h for any of parent's children's teams.

**Visual (Medium default):**
```
┌────────────────────────────────────┐
│ 🏆 TOURNAMENT WEEKEND                │
│ Zero Gravity NY Metro Showdown       │
│ Apr 26-27 · Randall's Island, NYC    │
│ ──────────────────────────────────  │
│ Saturday                            │
│ 9 AM Check-in · 10 AM Game 1       │
│ 12 PM Lunch · 2 PM Game 2 vs TBD   │
│                                     │
│ Sunday                              │
│ TBD based on Saturday results       │
│                                     │
│ Hotel: [code] · Parking: [info]      │
│ Weather: 65°F, clear                │
│ [Full briefing →]                    │
└────────────────────────────────────┘
```

**Density states:**
- Minimal: "🏆 Tournament Sat-Sun — 2 days"
- Medium (default): Full weekend view as shown
- Maximum: + full itinerary + hotel details + equipment checklist + driving directions + team roster

**Replaces/precedes:** Shows instead of individual NEXT UP cards for those events during the 72h window.

## 1.2 Parent home scenarios (12 covered)

### Scenario 1: Single-child parent, low-RSVP week (Mon morning, no events until Thursday)

Home renders:
- Greeting "Good morning"
- [No EMERGENCY, no ACTION, no LIVE]
- NEXT UP: Charlie's team practice Thursday (72h out, minimal urgency)
- MY TEAMS: 11U Girls 3-1, next Thursday
- [No RECOGNITION]
- [No COACH MESSAGE in 24h window]
- THIS WEEK: 1 event this week (Thursday practice)
- [No PAYMENT, paid]
- [No TOURNAMENT within 72h]

Screen feels calm, informational. Quiet week mode.

### Scenario 2: Two-child parent (Frank)

Home renders:
- EMERGENCY: [none]
- ACTION ZONE: "2 things to handle" (Milo needs RSVP, Charlie Saturday ride needed)
- NEXT UP: Two cards (Charlie's 11U Girls tonight + Milo's 8U Boys tomorrow)
- MY TEAMS: Both teams with records
- THIS WEEK: 5 events, mixed teams
- Plus: [Child filter chips if needed]

### Scenario 3: Parent of newly-added call-up player

Parent was 1-child (Milo, 8U Boys). Kid gets called up to 10U Black for tournament weekend.

Home renders:
- ACTION ZONE: New team welcome: "Milo added to 10U Black for tournament weekend — welcome"
- NEXT UP: Now shows 3 cards (one per team's next event)
- MY TEAMS: Now includes 10U Black (new)

### Scenario 4: Tournament weekend

Tournament starts Saturday. It's Thursday evening.

Home renders:
- TOURNAMENT BANNER at top (72h window)
- ACTION ZONE: "1 thing" (need hotel confirmation)
- NEXT UP: Collapsed to "Tournament weekend — see below"
- THIS WEEK: Shows the tournament detail prominently

### Scenario 5: Schedule change just happened

Coach moved tonight's practice from 6 to 7 PM. Parent opens app at 5:30.

Home renders:
- EMERGENCY ALERT: "⚠ PRACTICE RESCHEDULED — 6 PM → 7 PM"
- NEXT UP: Card now shows 7 PM
- Previous countdown invalid, updates to new time

### Scenario 6: Multi-day tournament in another state

Saturday 9 AM check-in at Bergen County NJ. It's Friday morning.

Home renders:
- TOURNAMENT BANNER: "🏆 2 days to Tournament Weekend"
- ACTION ZONE: "2 things" (hotel confirmation, driving directions review)
- MULTI-DAY VIEW: Shows Friday departure time + Saturday schedule + Sunday schedule

### Scenario 7: Rain day — possible cancellation

Forecast says storms. Event still scheduled.

Home renders:
- NEXT UP: Card shows weather icon + "⚠ Weather watch — rain expected"
- No alert yet (event not cancelled)
- Coach message block may be visible with "Weather update" message

### Scenario 8: Parent arrives 5 min late to practice

Kid checked in. Parent is still in car.

Home renders:
- LIVE NOW: "Charlie checked in 5 min ago · Practice in progress"
- Charlie's NEXT UP card swaps to LIVE state
- Parent sees check-in was successful

### Scenario 9: Parent with 3 kids across 3 teams

Cluttered home risk.

Home renders with collapse mechanic:
- NEXT UP: One card per team (3 cards stacked but each at MEDIUM density)
- MY TEAMS: 3 cards in horizontal scroll
- THIS WEEK: Events mixed, user can filter via child chips

Default MEDIUM density keeps each card compact. User can tap density chevron to minimize for more breathing room.

### Scenario 10: Parent in off-season (summer)

League is over. It's June.

Home renders:
- Greeting with season context
- [No EMERGENCY, no ACTION, no LIVE, no NEXT UP]
- MY TEAMS: Shows "Spring 2026 · Final record 12-4" per team
- RECOGNITION: Shows season summary card
- THIS WEEK: Empty, shows "Summer programs coming soon"
- Optional: Off-season banner with registration CTA

### Scenario 11: Parent who just signed up (onboarding)

First login. No RSVPs, no events yet.

Home renders:
- Greeting
- ONBOARDING card: "Let's get set up — 3 things to finish"
  - Add emergency contact
  - Confirm jersey size
  - Download calendar
- NEXT UP: Next event with "Getting started" helper text
- MY TEAMS: Team info with "This is your first season!"

### Scenario 12: Emergency (coach texts "Practice cancelled, drive safe")

7 AM on tournament day. Parent opens app.

Home renders:
- EMERGENCY ALERT: Full-width red banner at very top with cancellation details
- All other sections push down
- NEXT UP: Cancelled state shown visually
- Coach message block: Full message visible

---

# SECTION 2: COACH HOME

## 2.1 Sections

Coach home renders these sections in order. Conditional rendering applies.

1. Header (always)
2. Greeting with role badge: "Good morning, Kenny · Coach"
3. [EMERGENCY ALERT BANNER] — same as parent, coach-relevant
4. COACHING TODAY (always, at least one event or "no events today")
5. TEAM PULSE (always, one row per team coached)
6. [ACTION QUEUE] — pending achievements, roster approvals, etc.
7. [MESSAGING BLOCK] — recent messages + compose shortcut
8. UPCOMING PREP (always)
9. [RECOGNITION CARD] — team achievements
10. QUICK ACTIONS ROW — sticky at bottom
11. FAB — Start Check-In or Quick Score or Message Team

### 2.1.1 COACHING TODAY

**Visual (Medium default):**
```
┌────────────────────────────────────┐
│ COACHING TODAY                      │
│ ──────────────────────────────────  │
│ 5:30 PM · 10U Black Practice        │
│ 📍 Gym 2                            │
│ Staff: Kenny ✓ · Darien not RSVPd   │
│ RSVP: 8 of 12 · 2 no response       │
│ [Start Check-In (in 30m)]            │
│                                     │
│ 7:00 PM · 10U Blue Practice         │
│ 📍 Gym 3                            │
│ Staff: Kenny ✓ · Darien ✓           │
│ RSVP: 10 of 10 ✓                    │
│ [Practice plan]                     │
└────────────────────────────────────┘
```

**Density states:**
- Minimal: "2 events today · Next 5:30 PM"
- Medium (default): As shown
- Maximum: + full roster attendance status + pre-event checklist per event + weather + opponent details (for games)

### 2.1.2 TEAM PULSE (always)

**Visual (Medium default):**
```
┌────────────────────────────────────┐
│ TEAM PULSE                          │
│ ──────────────────────────────────  │
│ 10U Black                           │
│ Attendance: 95% ↑   RSVP: 88%       │
│ Last event: 10/12 present           │
│                                     │
│ 10U Blue                            │
│ Attendance: 78% ↓   RSVP: 72%       │
│ Last event: 7/10 present            │
└────────────────────────────────────┘
```

**Density states:**
- Minimal: Team names + trend arrows only
- Medium (default): Attendance + RSVP with trend
- Maximum: + top/bottom attendees + weekly trend line chart + roster changes

**Data source:** Migration 023 attendance views (when shipped).

### 2.1.3 ACTION QUEUE

**Trigger:** Pending achievements, pending roster approvals, unreviewed Quick Scores, unapproved coach comp.

**Visual (Medium default):**
```
┌────────────────────────────────────┐
│ 3 THINGS NEED ATTENTION             │
│ ──────────────────────────────────  │
│ 🟡 2 pending achievements to confirm│
│ [Review]                            │
│                                     │
│ 🟡 1 Quick Score needs approval     │
│ [Review]                            │
│                                     │
│ 🟡 1 roster request                 │
│ [Review]                            │
└────────────────────────────────────┘
```

### 2.1.4 MESSAGING BLOCK

**Visual (Medium default):**
```
┌────────────────────────────────────┐
│ MESSAGES                            │
│ ──────────────────────────────────  │
│ 10U Black · 3 unread                │
│ Most recent: "What time practice?"  │
│ — Wilson family, 1h ago             │
│ [Reply] [Open chat]                  │
│                                     │
│ 10U Blue · 0 unread                 │
│ [Compose message]                   │
└────────────────────────────────────┘
```

### 2.1.5 UPCOMING PREP

**Visual (Medium default):**
```
┌────────────────────────────────────┐
│ UPCOMING PREP                       │
│ ──────────────────────────────────  │
│ Sat Apr 26 · 10U Black Tournament   │
│ Metro Showdown                      │
│ ✓ Practice plan finalized            │
│ ❌ Tournament briefing not sent       │
│ [Send briefing]                     │
│                                     │
│ Next week:                          │
│ Tue · 10U Blue Practice              │
│ [Assign practice plan]              │
└────────────────────────────────────┘
```

### 2.1.6 QUICK ACTIONS ROW

**Visual:**
```
[Start Check-In] [Message Team] [Quick Score] [Practice Plans]
```

Horizontal chip row, 44px tall. Contextual to role + time.

## 2.2 Coach scenarios

### Scenario C1: Multi-team coach (Kenny with 2 teams)

Both teams' events shown. Pulse shows both. Clear separation.

### Scenario C2: Coach assistant (Darien, paid per session)

Darien's view shows his assigned events + compensation status (when shipped Phase 2).

### Scenario C3: Pre-event 60 min window

Quick Actions row shows "Start Check-In" prominently. FAB also shows it.

### Scenario C4: Post-game

Quick Actions shows "Quick Score" prominently. Score submission UI priority.

### Scenario C5: Off-season

Home shows "Season ended — plan for next season" with season summary metrics.

---

# SECTION 3: ADMIN HOME

## 3.1 Sections

Admin home is fundamentally different — it's an ops dashboard.

1. Header with org switcher (if multi-org)
2. Greeting: "Good morning, Frank · Admin"
3. [ATTENTION REQUIRED BANNER] — conditional urgent items
4. KPI CARDS (always, 4 cards in grid)
5. TODAY'S PROGRAM (always, all 5 teams' events today)
6. PENDING QUEUES (always, multiple lanes)
7. PROGRAM HEALTH (always, trends)
8. RECENT ACTIVITY FEED (always)
9. QUICK ACTIONS ROW — sticky
10. FAB — Create Event / Send Announcement / Send Alert

### 3.1.1 ATTENTION REQUIRED BANNER (conditional)

**Trigger:** Unresolved urgent items: event in next 24h with <50% ride coverage, event with 0 RSVPs at T-24h, payment overdue >30 days, coach comp pending >7 days, achievement pending >48h.

**Visual:**
```
┌────────────────────────────────────┐
│ ⚠ ATTENTION REQUIRED                │
│ ──────────────────────────────────  │
│ 🔴 10U Black tournament Sat — only  │
│    5/12 rides coordinated           │
│ [Review rides]                      │
│                                     │
│ 🟡 Wilson payment 30 days overdue   │
│ [Review]                            │
│                                     │
│ 🟡 3 Quick Scores need review       │
│ [Review]                            │
└────────────────────────────────────┘
```

### 3.1.2 KPI CARDS (always, 4 cards in 2x2 grid)

```
┌─────────┬─────────┐
│ Today   │ RSVP %  │
│ 5 events│ 78% ↑   │
│ 3 conf  │         │
└─────────┼─────────┤
│Attendance│Payment %│
│ 92% ↑   │ 87%     │
│         │ $3,500  │
│         │ owed    │
└─────────┴─────────┘
```

**KPI data sources:**
- Today: events.count where start_at BETWEEN today
- RSVP %: Migration 023 views (weighted average across upcoming events)
- Attendance: Migration 023 views (30-day rolling)
- Payment %: roster_members.payment_status aggregation

**Density states:**
- Minimal: Single composite score ("Ops health: 87%")
- Medium (default): 4 KPI cards as shown
- Maximum: + trends (sparklines) + comparison to previous period

### 3.1.3 TODAY'S PROGRAM (always)

**Visual (Medium default):**
```
┌────────────────────────────────────┐
│ TODAY'S PROGRAM · April 24          │
│ ──────────────────────────────────  │
│ 5:30 PM · 10U Black · Practice      │
│ ✓ Confirmed · 8/12 RSVP              │
│                                     │
│ 5:30 PM · 8U Boys · Practice         │
│ ✓ Confirmed · 10/10 RSVP ✓           │
│                                     │
│ 6:00 PM · 11U Girls · Practice       │
│ ⚠ Location unconfirmed                │
│                                     │
│ 7:00 PM · 10U Blue · Practice        │
│ ✓ Confirmed · 9/10 RSVP              │
│                                     │
│ 7:00 PM · 9U Boys · Practice         │
│ ✓ Confirmed · 7/9 RSVP               │
└────────────────────────────────────┘
```

**Density states:**
- Minimal: Event count only ("5 events today, 1 needs attention")
- Medium (default): All 5 team events visible with status
- Maximum: + per-event details (coach, location, attendance count, alerts)

### 3.1.4 PENDING QUEUES (conditional lanes)

**Visual (Medium default):**
```
┌────────────────────────────────────┐
│ PENDING QUEUES                      │
│ ──────────────────────────────────  │
│ 🟡 Achievements: 3 pending          │
│ [Review] (approve/deny workflow)    │
│                                     │
│ 🟡 Coach comp: 2 pending            │
│ [Review] (payment approval)         │
│                                     │
│ 🟡 Payment reminders: 5 overdue     │
│ [Send reminders]                    │
│                                     │
│ 🟡 Registration: 2 new this week    │
│ [Review]                            │
└────────────────────────────────────┘
```

### 3.1.5 PROGRAM HEALTH

**Visual (Medium default):**
```
┌────────────────────────────────────┐
│ PROGRAM HEALTH                      │
│ ──────────────────────────────────  │
│ Spring 2026 · Week 5 of 12           │
│ ████████░░░░░░░░░░ 42%               │
│                                     │
│ Attendance: 92% (vs last yr: 88%)   │
│ RSVP rate: 78% (vs last yr: 72%)    │
│ Payment collection: 87%             │
│ Registration pipeline: 2 new        │
└────────────────────────────────────┘
```

### 3.1.6 RECENT ACTIVITY FEED

**Visual (Medium default):**
```
┌────────────────────────────────────┐
│ RECENT ACTIVITY                     │
│ ──────────────────────────────────  │
│ 5 min ago · Wilson RSVP'd Going     │
│ 12 min ago · Smith claimed ride     │
│ 23 min ago · Coach Kenny posted     │
│ 1h ago · 8U Boys won 42-38           │
│ 2h ago · 2 new registrations        │
│ [See all activity]                   │
└────────────────────────────────────┘
```

### 3.1.7 QUICK ACTIONS ROW

```
[Create Event] [Send Announcement] [Export Data] [View Reports]
```

## 3.2 Admin scenarios

### Scenario A1: Standard mid-season Thursday

All systems normal. 5 events today. 1 alert. Metrics trending up. Calm dashboard.

### Scenario A2: Weather cancellation at 7 AM

Attention banner: "Today's events cancelled — take action."
Actions available: Cascade cancel all events, send notification to all families.

### Scenario A3: New season launch

No events yet. Dashboard shows registration pipeline, season setup checklist, onboarding progress.

### Scenario A4: End of season

Shows season recap, all achievements, final metrics. Summer programs setup link.

### Scenario A5: Multi-org admin (future Ember)

Org switcher in header. Home scoped to active org. Quick switch between orgs.

---

# SECTION 4: CROSS-ROLE CONSIDERATIONS

## 4.1 Shared 5-tab bottom nav (Q4 decision)

Tabs:
1. **Home** — role-specific landing
2. **Schedule** — filtered per role
3. **Locations** — venue directory (maybe different emphasis per role)
4. **Teams** — role-appropriate view
5. **Messages** — role-specific messaging hub

Each tab's landing page varies per role but label stays consistent.

## 4.2 Universal search (not in Phase 1)

Future: Global search box in header allows find-anything-anywhere. Players, events, dates, teams.

## 4.3 FAB role-specific primary actions (Q5 decision)

See individual role sections above. FAB is always 56px bottom-right.

## 4.4 Theme and dark mode (Q10 decision)

Both light and dark modes fully designed. System preference respected by default. User override via Settings.

**Light mode tokens:**
- Background: #fafafa (sf-bg)
- Surface: #ffffff (sf-bg-card)
- Primary text: #1e293b (slate-800)
- Secondary text: #64748b (slate-500)
- Accent: #4a8fd4 (Legacy cobalt)

**Dark mode tokens:**
- Background: #0f172a (slate-900)
- Surface: #1e293b (slate-800)
- Primary text: #f1f5f9 (slate-100)
- Secondary text: #94a3b8 (slate-400)
- Accent: #60a5fa (lighter cobalt)

Team colors stay consistent (jersey identity doesn't change).

## 4.5 Accessibility checklist (Q1 all)

- [ ] All cards have semantic HTML (section, article, nav)
- [ ] All icons have text labels (visible or aria-label)
- [ ] Color states have text indicators (not just color)
- [ ] 44px minimum tap targets enforced
- [ ] WCAG AA contrast ratios (4.5:1 for body text)
- [ ] Keyboard navigation fully supported
- [ ] Focus indicators visible
- [ ] Screen reader tested (VoiceOver, TalkBack)
- [ ] Reduced motion preference respected
- [ ] Font size user preference respected
- [ ] Works in dark mode without loss of functionality

## 4.6 Performance budgets

- First contentful paint: <500ms (95th percentile on 4G)
- Time to interactive: <1.5s (95th percentile on 4G)
- Largest contentful paint: <2.5s
- Cumulative layout shift: <0.1
- Max bundle size increase from Phase 1: <50KB gzipped

## 4.7 Analytics instrumentation (Q9)

Event tracking on:
- home_section_viewed (section_name, density_level, role, duration_ms)
- home_card_tapped (section_name, card_type, action)
- home_density_changed (section_name, from_density, to_density)
- home_cta_tapped (cta_id, action_taken)
- emergency_banner_shown (reason, dismissed)

Behind feature flag initially. Data persisted in a dedicated `analytics_events` table (Phase 2).

---

# SECTION 5: ACCORDION BEHAVIOR SPEC

## 5.1 Density mechanics

Every section has 3 density modes. Default is Medium.

Toggle appears as `•••` chevron menu button in top-right of each section.

Tap chevron opens options:
```
Density:
[Minimal]  [Medium ✓]  [Maximum]
```

Selection saves to `user_preferences.card_density` JSONB:
```json
{
  "parent_home_next_up": "maximum",
  "parent_home_this_week": "medium",
  "coach_home_team_pulse": "minimal"
}
```

User-facing copy avoids technical terms ("density"). Prefer icons or "Less / More" labels.

## 5.2 Expand/collapse behavior

At Minimal state:
- Section renders in compact 40-60px height
- Tap on the section expands to Medium temporarily (toggles)
- Chevron can still change permanent density

At Medium state (default):
- Section renders at full designed height
- Tap on individual cards drills to detail

At Maximum state:
- Section shows maximum info
- Still tappable cards drill to detail

## 5.3 Cross-section consistency

Density toggle is per-section, not per-page.

But user can set "Apply to all sections" shortcut in Settings > Display:
- Compact me: All sections → Minimal
- Balanced: All sections → Medium (default reset)
- Info-rich: All sections → Maximum

## 5.4 Mobile vs desktop density

Desktop: Can show Medium where mobile shows Minimal (same preference, different rendering).

Mobile: Minimal/Medium/Maximum map directly to vertical heights.

Breakpoint: 768px.

---

# SECTION 6: IMPLEMENTATION PLAN

## 6.1 Sprint sequencing

**Sprint A: Data correctness (prerequisite)**
- Migration 022: Close 5 RLS holes + add left_at to roster_members
- Migration 023: Attendance views on roster_members
- Migration 024: Data corrections (destructive)
- Bug fixes: 001-005

**Sprint B: Parent home Phase 1** (after Sprint A)
- Implement ACTION ZONE
- Implement density toggle
- Update MY TEAMS to dynamic data (per D2)
- Relative date language
- Empty states

**Sprint C: Parent home Phase 2**
- LIVE NOW card
- RECOGNITION card (ties to Migration 018 UI)
- Tournament weekend banner
- Emergency alert
- Coach message block

**Sprint D: Coach home**
- CoachHomePage.jsx new file
- All coach-specific sections
- Team Pulse wiring (blocked on Migration 023)

**Sprint E: Admin home redesign**
- Complete AdminHomePage rewrite
- Ops dashboard with KPI cards
- Pending queues
- Activity feed
- Attention Required banner

**Sprint F: Cross-role polish**
- Dark mode complete implementation
- Accessibility full audit
- Analytics instrumentation
- Performance optimization
- Multi-org scaffolding (hide if single org)

## 6.2 File structure

```
src/
  pages/
    ParentHomePage.jsx       (150 lines max)
    CoachHomePage.jsx        (150 lines max, NEW)
    AdminHomePage.jsx        (rewrite, 150 lines max)
  components/
    home/
      ActionZone.jsx         (conditional section, 100 lines)
      LiveNowCard.jsx        (conditional section, 80 lines)
      NextUpCard.jsx         (enhance existing)
      MyTeamsStrip.jsx       (enhance existing)
      RecognitionCard.jsx    (conditional, 80 lines, NEW)
      ThisWeek.jsx           (enhance existing)
      EmergencyBanner.jsx    (conditional, 60 lines, NEW)
      TournamentWeekendBanner.jsx (conditional, 100 lines, NEW)
      CoachMessageBlock.jsx  (conditional, 60 lines, NEW)
      RegistrationReminder.jsx (conditional, 60 lines, NEW)
      DensityChevron.jsx     (reusable, 40 lines, NEW)
    home-admin/
      KpiCards.jsx
      TodaysProgram.jsx
      PendingQueues.jsx
      ProgramHealth.jsx
      RecentActivity.jsx
      AttentionBanner.jsx
    home-coach/
      CoachingToday.jsx
      TeamPulse.jsx
      ActionQueue.jsx
      MessagingBlock.jsx
      UpcomingPrep.jsx
      QuickActionsRow.jsx
```

Each file under 150 lines per team convention.

## 6.3 Testing strategy

Per scenario:
- Unit tests for each section component
- Integration tests for role-based rendering
- Snapshot tests for visual regression
- Manual testing per scenario 1-12 (parent), C1-C5 (coach), A1-A5 (admin)

## 6.4 Rollout plan

1. Feature flag behind `ember_home_v2` flag
2. 10% of users (opt-in)
3. Expand to 50% if metrics positive
4. 100% after 2 weeks stable
5. Remove old home pages

---

# SECTION 7: OPEN QUESTIONS FOR FUTURE

- Home customization: should users be able to reorder sections? (Phase 2)
- Home vs landing: should there be an unauthenticated landing page for invitations? (yes, Phase 1)
- Tablet layouts: iPad-specific design vs responsive? (Phase 2)
- Offline mode beyond caching: full offline with sync? (Phase 3)
- AI-powered home: personalized suggestions based on behavior? (Phase 3)
- Team parent role (non-admin): custom home view? (Phase 2)

---

# VERSION HISTORY

- **1.0** — April 24, 2026 — Initial specification. Authored during session that shipped Migrations 013-021. Based on IMG_9882.png + IMG_9880.png observations + full audit.
