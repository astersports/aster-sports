# Legacy Hoopers Operations Platform — Build Spec
## For Claude Code (app.legacyhoopers.org)

**Stack:** React 18 + Tailwind CSS + Vite · Supabase (vrwwpsbfbnveawqwbdmj) · Vercel  
**Auth:** Supabase role-based auth — Admin / Coach / Parent tiers (RLS-scoped per org)  
**Resume:** `cd ~/aster-sports && claude`  
**Brand:** LH cobalt accent `#4a8fd4` (header + accent, applied at runtime via AuthContext org overrides). The platform ("Ember") ships a cool-gray surface palette with `--em-*` CSS tokens — there is NO `--lh-*` namespace and no warm/navy default. See §0.

---

## 0. Design System

> **CANONICAL SOURCE: `CLAUDE.md` §3 (LOCKED tokens) + §7 (design system).** The
> values below mirror the live `src/index.css :root`. Do NOT invent, rename, or
> change token values. Use `var(--em-*)` everywhere; the only acceptable inline
> hex is a team's `team_color` read from the DB. There is no `--lh-*` namespace
> in the codebase — that was the April-era plan; production uses `--em-*`.

### Colors (cool-gray platform palette — NOT warm/beige/navy)

```css
/* Surfaces + text (cool gray) */
--em-bg-page:        #F7F8FA;   /* page background */
--em-bg-card:        #FFFFFF;
--em-bg-card-hover:  #F9FAFB;
--em-bg-secondary:   #F1F3F5;
--em-bg-tertiary:    #E9ECEF;   /* input fill */
--em-text-primary:   #1A1D23;
--em-text-secondary: #4A5568;
--em-text-tertiary:  #8896AB;   /* icons/dividers; non-text use */
--em-text-inverse:   #FFFFFF;
--em-border-default: #E2E8F0;
--em-border-subtle:  #EDF2F7;

/* Status (semantic) */
--em-success: #16A34A;   /* W / going / made */
--em-warning: #D97706;   /* free throw / warning */
--em-danger:  #DC2626;   /* L / not going / missed */
--em-info:    #3B82F6;
--em-academy: #7C3AED;   /* Futures Academy accent */

/* Brand — Ember defaults, overridden per org at runtime via AuthContext.
   Legacy Hoopers override (applied on login): */
--em-header:       #4a8fd4;   /* LH cobalt */
--em-accent:       #4a8fd4;   /* LH cobalt */
--em-accent-hover: #5BA0E0;
--em-accent-soft:  rgba(74, 143, 212, 0.1);
--em-text-on-dark: #FFFFFF;

/* Shadows (exactly three — no fourth) */
--em-shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
--em-shadow-md: 0 2px 8px rgba(0,0,0,0.08);
--em-shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
```

### Typography
- **Font:** Inter (400/500/600/700). Scale: 24/20/17/15/13/11px.
- **Headers:** tracking-tight, line-height 1.2
- **Body:** line-height 1.5
- **Event time:** 17px bold always
- **Labels:** tracking-wide uppercase, 11px, weight 500

### Component Patterns
- **Tap targets:** 44px minimum (non-negotiable).
- **Cards:** `var(--em-bg-card)`, `var(--em-border-default)`, 10px radius, `var(--em-shadow-sm)`.
- **Inputs:** 44px height, `var(--em-bg-tertiary)` bg, 1.5px border, 10px radius, accent focus ring.
- **Forms with 3+ fields → FullScreenForm.** BottomSheet only for RSVP confirmations, filter pickers, and 1–2 button dialogs (anti-pattern #15).
- **Bottom sheets:** slide up, 16px top radius, drag handle bar at top. Backdrop `rgba(0,0,0,0.3)` — never bg-black/50.
- **Destructive actions:** danger-bg filled rounded button, not just red text.
- **Border radius:** 6px (badges) / 10px (cards, inputs) / 16px (modals) / 9999px (avatars).
- **Icons:** Lucide React only, 16/20/24px, stroke-width 1.75.
- **Button press:** `scale(0.97)` + `vibrate(50)`.
- **Empty states:** centered illustration + bold heading + supporting subtext + primary CTA (brand voice).
- **Section headers with count:** uppercase 11px label, `var(--em-text-secondary)`, e.g. "STAFF (1/4)".
- **Save/Cancel nav:** Back chevron left · Title center · Save/Done text right (grayed until change).
- **Discard confirmation:** bottom sheet — "Are you sure?" label · destructive "Discard Changes" · accent "Keep Editing".

---

## 1. Information Architecture

### Bottom Tab Bar (5 tabs — same set for all roles)

```
Home | Schedule | Records | Teams | Messages
```

The live `BottomNav` renders the same five tabs for Admin, Coach, and Parent
(Lucide icons: House / Calendar / Trophy / Users / MessageSquare). There is no
separate Score or Account tab in the tab bar — Account lives at `/account`
(reached from the header/profile), and live scoring is reached from an event,
not a tab. Messages tab carries an unread-dot badge.

### Route Map (as implemented in `src/App.jsx`)

```
PUBLIC (no auth):
/login                          → Login
/forgot-password                → Password reset
/schedule/:teamId               → Public team schedule (shareable)

AUTHENTICATED:
/                               → Home (role-routed: Admin/Coach/Parent home)
/schedule                       → Schedule list (all user's teams, multi-team feed)
/records                        → Records page (standings + tournament scorebooks)
/teams                          → Team list
/teams/:teamId                  → Team detail
/teams/:teamId/player/:playerId → Player profile
/teams/:teamId/tournaments      → Tournaments (team-scoped)
/tournaments  ·  /tournaments/:id → Tournaments list / detail
/messages                       → Messages (channels + DM threads)
/account                        → Account settings
/events/:id                     → Event detail + RSVP (full page, NOT a bottom sheet)
/events/:id/live                → Live scoring interface (Admin/Coach)

ADMIN-ONLY (/admin/*):
/admin/seasons · /admin/teams · /admin/members · /admin/opponents
/admin/locations · /admin/rollover · /admin/financials
/admin/financials/import · /admin/import-schedule
/admin/briefings/compose · /admin/briefings/history · /admin/briefings/history/:id
```

> The April-era `/score/:gameId`, `/teams/:teamId/settings`, `/teams/:teamId/roster`,
> and `/messages/:teamId` routes were never built that way. Event detail is a full
> page at `/events/:id` (per the §16.14 hero + collapsibles detail pattern), not a
> bottom sheet. Team management is centralized under `/admin/*`, not per-team
> settings sub-routes.



---

## 2. Supabase Schema

> **CANONICAL SOURCE: live DB + `CLAUDE.md` §5 (~171 migration files) + §11.5 (ground-truth
> tables).** The columns below were verified against production on 2026-05-29. This
> is a multi-tenant platform: nearly every table carries an `org_id` FK and is
> RLS-scoped to the user's org. The April-era `gyms` / `rsvps` / `user_profiles` /
> `message_reactions` table names and the `activities`-style shapes do NOT exist —
> the real tables are listed below. Schema is large (~80 tables); these are the
> core ones the build touches.

### Ground-truth table rules (CLAUDE.md §11.5 — read this before querying)

- **Who's on a team right now?** → `team_players` (`roster_type` ∈ `rostered`/`futures`
  lives HERE, plus `status` ∈ `active`/`inactive`). NOT `roster_members`.
- **Jersey/shorts SIZES + date-windowed eligibility?** → `roster_members` (it has
  `jersey_size`, `shorts_size`, `registered_at`, `left_at`). `roster_members` has
  NO `roster_type` column. App code reads it only for sizes + the 5 attendance views.
- **Payment status for a season?** → `financial_accounts` + `financial_transactions`
  + the `family_balances` view. NOT `roster_members.payment_status` (legacy column,
  retired from the UI in PR #582).
- **Futures Academy = `roster_type` on `team_players` (team-scoped membership)**, NOT
  a role. (`players.member_type` ∈ `roster`/`futures_academy` exists too but is the
  player-level type — team-scoped Academy checks use `team_players.roster_type`.)

### Tables

#### `teams`

```sql
id uuid primary key
org_id uuid                -- tenant scope
season_id uuid references seasons(id)
name text                  -- "10U Black"
age_group text             -- '8U' | '9U' | '10U' | '11U'
gender text                -- 'male' | 'female'
division text              -- 'Black' | 'Blue' | null
circuit text               -- 'aau' | 'league_play' (lowercase enum)
circuit_name text          -- display, e.g. "AAU (Zero Gravity)"
sort_order int             -- oldest→youngest (1..5)
team_color text            -- team accent hex (from src/lib/constants.js TEAM_COLORS)
home_jersey text · away_jersey text
practice_day text · practice_location text
team_feed_token text       -- public schedule / iCal subscription token
team_type_id uuid · gamechanger_team_alias text
created_at · updated_at timestamptz
```

> No `display_name`, `color_hex`, `season` (text), `record_wins/losses`, or
> `home_gym_id` columns. W-L is derived from `game_results`, not stored on `teams`.
> Records-page ALL-CAPS labels are formatted in code, not a `display_name` column.

#### `locations` (venues — there is no `gyms` table)

```sql
id uuid primary key
org_id uuid
name text                  -- "Westchester Community Center"
address text
sub_locations text[]       -- court labels, e.g. {"Court 1","Court 2"}
parking_notes · entry_instructions · admin_notes · notes text
lat double · lon double · latitude numeric · longitude numeric
google_maps_url text       -- Frank-verified pin (map URL priority #1, CLAUDE.md §15)
archived_at timestamptz
```

(Related: `location_rooms`, `season_locations`. Event sub-venue is `events.sub_location`
text + optional `events.location_room_id`.)

#### `events` (NOT `activities` — single events table)

```sql
id uuid primary key
team_id uuid references teams(id)
season_id uuid references seasons(id)
event_type text            -- 'game' | 'practice' | 'skills_lab' | 'tryout' | 'tournament' | 'other'
title text
is_scrimmage boolean       -- scrimmages do NOT count toward W-L
home_away text             -- 'home' | 'away' | 'neutral' | 'tbd' (lowercase)
opponent text · opponent_id uuid references opponents(id)
location text · location_address text · location_id uuid · location_room_id uuid · sub_location text
start_at timestamptz · end_at timestamptz · is_multi_day boolean · end_date date
arrival_minutes_before int · arrival_time time
status text                -- 'scheduled' | 'cancelled' | 'postponed'
publish_status text · cancellation_reason text · cancelled_at timestamptz
rsvp_deadline timestamptz · enable_rides boolean · indoor boolean
notes text · coach_notes text · attachments jsonb · coach_checklist_state jsonb
tournament_id uuid · tournament_name text · is_bracket_game boolean · bracket_label text
locked_roster_player_ids uuid[] · academy_callup_player_ids uuid[]
parent_event_id uuid · created_at · updated_at timestamptz
```

> No `duration_minutes`, `repeats`/`repeat_end_date`, `gym_id`, or `created_by` columns.
> Duration is `end_at − start_at`. Recurrence is handled via `parent_event_id` +
> multi-day fields, not a `repeats` enum.

#### `opponents`

```sql
id uuid primary key
org_id uuid
name text · city text · state text
circuit text · logo_url text
notes · scouting_notes · default_character_note text
first_played_at · last_played_at date
head_to_head_wins int · head_to_head_losses int
created_at timestamptz
```

#### `game_results`

```sql
id uuid primary key
event_id uuid references events(id) unique
our_score int              -- (NOT lh_score)
opponent_score int         -- (NOT opp_score)
result text                -- 'W' | 'L' (derived)
quarter_scores jsonb · point_differential int
player_of_game_id uuid · coach_highlight text · private_notes text
has_player_stats boolean
entered_by uuid · entered_at timestamptz · published_at · published_by
```

#### `players`

```sql
id uuid primary key
org_id uuid
first_name text · last_name text
dob date · grade int
member_type text           -- 'roster' | 'futures_academy'
medical_notes text
emergency_contact_name text · emergency_contact_phone text
avatar_url text · is_active boolean
created_at · updated_at timestamptz
```

> Players are org-scoped, NOT team-scoped. Team membership + jersey live on
> `team_players` (current) and `roster_members` (sizes/eligibility). There is no
> `players.team_id` or `players.is_academy_player`.

#### `team_players` (current team membership — canonical "who's on the team")

```sql
id uuid primary key
team_id uuid · player_id uuid
roster_type text           -- 'rostered' | 'futures'
jersey_number text
status text                -- 'active' | 'inactive'
joined_at · left_at · created_at timestamptz
```

#### `roster_members` (SIZES + date-windowed eligibility ONLY — see §11.5)

```sql
id uuid primary key
player_id uuid · team_id uuid
jersey_number int · jersey_size text · shorts_size text
payment_status text        -- LEGACY, retired from UI (PR #582); use financial_accounts
amount_paid · amount_due numeric  -- legacy
registered_at · left_at timestamptz   -- date-windowed eligibility
created_at · updated_at timestamptz
```

#### `event_rsvps` (NOT `rsvps`)

```sql
id uuid primary key
event_id uuid references events(id)
player_id uuid · guardian_id uuid     -- RSVP is per-player (by guardian), not per-user
response text              -- 'going' | 'not_going' | 'maybe'  (NEVER 'yes')
comment text · responded_at timestamptz
```

#### Identity: `user_roles` + `staff_profiles` + `guardians` (no `user_profiles`)

```sql
-- user_roles: maps a user to a role within an org
user_id uuid · role text ('admin'|'coach'|'parent') · organization_id uuid

-- staff_profiles: admin/coach display info
user_id uuid · org_id uuid · display_name text · title text · phone text

-- guardians + player_guardians: parents link to players (parents are guardians,
-- not a player_id column on a profile). parent_context_v view resolves a parent's
-- kids + teams for AuthContext.
```

#### `game_plays` (live scoring)

```sql
id uuid primary key
event_id uuid references events(id)
player_id uuid
play_type text             -- '2PT_MADE'|'2PT_MISS'|'3PT_MADE'|'3PT_MISS'|'FT_MADE'|'FT_MISS'|'REB'|'AST'|'STL'|'BLK'|'TO'|'FOUL'
period int                 -- integer (1, 2, OT as next int) — NOT a 'Half 1' text
is_opponent boolean        -- (NOT a team text field)
is_voided boolean · voided_at · voided_by   -- (undo voids; NOT is_undone)
created_at · created_by
```

#### `messages`

```sql
id uuid primary key
org_id uuid
channel text               -- 'team' | 'announcement' | 'dm' (see src/lib/constants.js)
team_id uuid · dm_thread_id uuid
sender_id uuid · sender_name text
body text · pinned boolean
created_at timestamptz
```

> Reactions: live via `message_reactions` is NOT a current table — reaction/read
> state is tracked through `message_reads`; DM threads via `dm_threads`. There is no
> `attachment_url`/`attachment_type` on messages today.

#### Comms / briefings: `comms_messages` (renamed from `tournament_messages`)

```sql
comms_messages: kind text   -- 'kind' renamed from 'message_type'. Production kinds:
  weekly_digest · schedule_change · game_recap · tournament_prelim ·
  tournament_recap · announcement · rsvp_nudge · academy_callup_notice ·
  coach_roundup · family_guide  (+ transitional legacy values)
comms_message_recipients: per-recipient delivery rows
```

### RLS Policies (summary — CLAUDE.md §4)
Every org-scoped table is gated by `current_user_org_id()` (SECURITY DEFINER STABLE).
**Never call that function on `org_members` → infinite recursion.** Application code
also filters `.eq('org_id', orgId)` first on org-scoped tables (defense-in-depth, AP #37).
- **Admin:** full read/write within their org.
- **Coach:** team-scoped (events, game_plays, roster) for assigned teams; read org teams.
- **Parent:** player-scoped via `current_user_teammate_player_ids()` /
  `current_user_child_team_ids()` helpers; writes own kids' RSVPs; reads/writes team messages.

---

## 3. Screen Specs

---

### 3.1 Home Dashboard

**Route:** `/` (role-routed: separate Admin / Coach / Parent home renders)  
**Roles:** All

#### Layout

```
[Header: LH knight logo + "Legacy Hoopers"]
[Notification bell icon top right]

[Next Up card — most immediate upcoming event across all user's teams]
  Team name label (cobalt, small)
  vs. Opponent   |   Time
  Location       |   Home/Away chip
  [RSVP row: Are you going? / Going ✓ / Not Going ✗]

[Scrollable horizontal team cards]
  Each card: team name + W-L record + next game date
  Last card: "+ View all teams" outlined card

[Recent Results section]
  Game rows with W/L badge + score + opponent + date
```



#### Behavior
- RSVP state transitions inline (no navigation): "Are you going?" → tap Going → "You're going" + Edit RSVP button
- Next Up card auto-advances to next event as time passes
- Pull to refresh

---

### 3.2 Schedule — Multi-Team Feed

**Route:** `/schedule`  
**Roles:** All

#### Layout

```
[Header: "Schedule"  +  [Filter: All | Games | Events] icon]
["Next Up" | "Events" toggle]

[Month band: "April 2026"]
  [Event row]
    Left: Day-of-week (small) + Date number (large)
    Center: Team name (cobalt small) + vs. Opponent (bold)
    Right: Time  OR  Result "W 42-38" (success token) / "L 25-30" (danger token)
    Sub-row: RSVP pill (blue "RSVP") if unanswered
    Sub-row: Avatar chip with green checkmark if responded Going

[Month band: "May 2026"]
  ...

[Floating "+ Add Event" pill button — bottom center, above tab bar]
  Tapping: action sheet → "Which team?" → Add Game | Add Event
```



#### Filter behavior
- All: games + practices + other
- Games: event_type = 'Game' only
- Events: event_type = 'Practice' | 'Other'

#### Event row tap → navigates to Event Detail page `/events/:id` (see 3.3)

---

### 3.3 Event Detail (full page — `/events/:id`)

**Triggered by:** tapping any event row → navigates to `/events/:id`  
**Component:** full page following the §16.14 hero-card + collapsible-sections
pattern (NOT a bottom sheet — that was the April-era plan). A single hero card
holds title/metadata/state-summary/per-role action stack; everything else
(RSVPs, rides, duties, comments, arrivals, checklist) is a closed-by-default
collapsible with a summary line in its header.

#### Layout (hero card)

```
[Title: "vs. Pleasantville" | "Practice" | "Skills Lab"]
[Calendar icon] Friday, Apr 10th  |  11:00 AM – 1:00 PM
[Pin icon] Westchester Community Center · Court 2
[Team chip] 10U Black

[RSVP row]
  State 1 — Unanswered:
    [Avatar] "Are you going?"  [Going] [Not Going]
  State 2 — Tapped response:
    [Avatar ✓] "You're going"  [Going ●] [Not Going]
  State 3 — Confirmed:
    [Avatar ✓] "You're going"  [Edit RSVP]

[For Games only:]
  [Enter Score] button (Coach/Admin only, post-game)

[Get Directions link → opens Maps]
```



#### RSVP state management
- Optimistic update — update UI immediately, sync to Supabase (per-row optimistic, §16.1).
- Writes to `event_rsvps.response` ∈ `going` | `not_going` | `maybe` (the DB value
  is never `'yes'`). RSVP is per-player (keyed by `player_id` + `guardian_id`).
- Going/Not Going/Maybe are pill buttons: Going = success fill, Not Going = danger
  fill, Maybe = neutral. Use `var(--em-*)` tokens, not raw hex.
- Once confirmed, replace with "Edit RSVP" outlined button.
- Rollback microcopy: "Looks like that didn't go through. Try again?"

---

### 3.4 Add / Edit Event

**Component:** FullScreenForm (3+ fields → never a BottomSheet, anti-pattern #15),
launched from the Schedule "+ Add Event" pill or from an event's edit action.  
**Roles:** Admin, Coach  
**Persistence:** writes `events` (event_type, is_scrimmage, home_away, opponent/
opponent_id, location/location_id, start_at, end_at, arrival_minutes_before, notes).
Duration in the UI maps to `end_at` (there is no `duration_minutes` column). Recurrence
maps to `parent_event_id`/multi-day fields (no `repeats` enum column).

#### Form fields (in order)

```
Event Type          [Game ▾]          picker: Game | Practice | Other
Scrimmage           [toggle]          only visible when Event Type = Game
─────────────────────────────────────
Home/Away           [TBD ▾]          picker: TBD | Home | Away
Opponent            [TBD ▾]          → Opponent search screen
Location            [choose ▾]       → Location select screen
─────────────────────────────────────
All Day             [toggle]
Starts              [Fri, Apr 11, 2026  11:00 AM]
                    → tap Starts: inline month-grid calendar expands below
                    → tap time: inline drum-roll H:MM AM/PM
Duration            [1 hour]          inline drum-roll: hours col + minutes col (5-min increments)
Arrive              [No arrival time]  drum-roll: No arrival time | 5 min before | 10 | 15 | 20 | 25 | 30 | 45 | 60 min before
─────────────────────────────────────
Repeats             [Never ▾]         → Repeats screen
Notes               [text field, placeholder "Court #, tournament bracket, etc."]
─────────────────────────────────────
[Edit only:] [Delete Game] red filled full-width rounded button at bottom

Footer link: "Setup your team on the web portal →"
```



#### Save action sheet
On tap Save:

```
[gray label] Schedule Update
[Save & Message Team]          → opens Notification Compose screen
[Save & Don't Message Team]    → saves silently
─────────────────────
[Never Mind]
```



#### Notification Compose screen

```
Header: [Team name]
[Context card: Fri, Apr 11 · Game, 11:00 AM – 1:00 PM]   (non-editable)
[Body text field — pre-populated with template]
Gray hint: "Send the team an email and push notification about the new event."
[SEND NOTIFICATION] full-width cobalt sticky button
```



Pre-populated template (editable):

```
Game day for [Team Name] — [Day, Date] at [Time].
Arrive by [arrive time] at [Location].
Questions? Reply here.
```



#### Opponent Search screen

```
[Search bar — "Search for opponent"]
[Season ▾] [Location ▾]   filter pills

PREVIOUS OPPONENTS
[TBD]  ✓ (current)
[Pleasantville logo] Pleasantville
[St Joseph Bronxville logo] St Joseph Bronxville
...

Search Results (after typing):
[logo] Team name          (matched chars bold/cobalt)
       City · Type
       Season · N players      [chevron]

[Can't find opponent? Create "Iona"]
```



#### Location Select screen

```
[Search: "Enter a place or address, or city"]
[Map preview — draggable pin, tooltip "Drag to pin a specific location"]

[Top result with checkmark]
MORE RESULTS
[result rows]
[Add "WCC" — No address]   (escape hatch for custom locations)
```



#### Repeats screen

```
Never  ✓
Every Week on [day of event]
Every 2 Weeks on [day of event]

End Repeat    [date]
[Inline month-grid calendar to pick end date]

"This repeating event starts [start date]"
```



---

### 3.5 Team Profile

**Route:** `/teams/:teamId`  
**Roles:** All (read); Admin/Coach (edit)

#### Header

```
[← Home]  [Team Name]  [🔔] [↑ share] [⚙ settings]
[Team logo — circle, 72px]
[Team Name bold 20px]
[Role · Season · W-L · Get Team Pass link]
[Message Team] outlined pill button
```



#### Tabs: Schedule | Team | Stats | Opponents (scrollable horizontal)

#### Team tab — Players sub-segment

```
[Players] [Staff] [Followers]  segmented control

PLAYERS  (active tab)
─────────────────────
My Player     (for parent role)
  [Claim a Player] CTA

Other Players (11)
  [Add Player] CTA (Admin/Coach only)
  [Player row: # avatar | Name | #jersey]
    → taps to Player Profile
```



#### Team tab — Staff sub-segment

```
Staff (1/4)
[+ Add Staff] CTA

[FS avatar] Frank S (you)  [chevron →]
[KL avatar] Kenny Lane     [chevron →]
[DG avatar] Darien G       [chevron →]

TEAM PERMISSIONS
Scorekeepers    All confirmed members  [chevron]
Videographers   All confirmed members  [chevron]

[Setup your team on the web portal →]
```



#### Team tab — Followers sub-segment

```
[+ Invite followers]

[empty state illustration]
When family and fans join your team, you will see them listed here.
```



#### Stats tab

> **Scope lock (CLAUDE.md §16.12):** TEAM-level game stats only. Per-PLAYER game
> stats (points/rebounds/assists/etc.) are NOT permitted in 2026 — the §8 build
> ledger marks player stats / box score (5-C) as BLOCKED, do not build. Per-player
> ENGAGEMENT stats (attendance, RSVP timeliness, streaks) ARE allowed. The table
> below is the team-level game log.

```
[Standard] [Advanced]  segmented toggle

Horizontally scrollable table:
DATE ▲ | OPPONENT | W/L | PTS | OPP | PF | FG | FG% | 3PT | REB | AST | STL | BLK

[Game rows sorted by date]
TOTALS row (pinned footer, bold)

─────────────────────
Stat legend:
PTS – Points
PF – Personal fouls
FG – Field goals made-attempted
FG% – Percentage of field goals made
3PT – 3-point field goals made-attempted
REB – Rebounds
AST – Assists
STL – Steals
BLK – Blocks
TO – Turnovers
```



---

### 3.6 Player Profile

**Route:** `/teams/:teamId/player/:playerId`  
**Roles:** All (read); Admin/Coach (edit)

#### Header

```
[← Back]                    [Edit]
[Circle avatar: jersey # large on dark bg]
[Player Name bold]
[#jersey small, secondary]

[Video Clips] [Stats] [Followers]  tabs
```



#### Stats tab

> **BLOCKED (CLAUDE.md §16.12 + §8 build ledger, 5-C):** per-player game stats /
> box score are NOT permitted in 2026 — do not build this table. A player's profile
> may show ENGAGEMENT stats (attendance %, RSVP timeliness, streak) only. The
> game-stat columns below are retained for reference of the deferred design intent,
> NOT as a build target.

```
[Standard] [Advanced]  segmented

DATE ▲ | OPPONENT | PTS | PF | FG | FG% ...  (horizontal scroll)
[game rows]
TOTALS

─────────────────────
Stat legend (collapsed, "Show key" expand)
* – Scrimmage
PTS – Points  ...
```



#### Followers tab

```
EMERGENCY CONTACT
[+ Add Emergency Contact]   (red + icon)

FAMILY AND FRIENDS
[+ Add family member or friend]   (blue + icon)
[family member rows once added]
```



#### Video Clips tab (placeholder)

```
[empty state: film reel illustration]
NO VIDEO CLIPS YET
Stats will appear here after the first scored game.
[Learn more]
```



---

### 3.7 Live Scoring Interface

**Route:** `/events/:id/live`  
**Roles:** Admin, Coach (scorekeepers per permission setting)

#### Layout

```
[Menu]    [⏱ Half 1 ▾]    (period selector dropdown)

Away Team logo  [score] [score]  Home Team logo
Timeouts left: 3              3 :Timeouts left

[Scoring] [Stats] [Roster]   tabs

─────────────────────
OPPONENT TEAM
[+2PT FG]  [Free Throw]  [+3PT FG]
[2PT Miss] [REB] [FOUL]  [3PT Miss]
           [TO]

─────────────────────
[LH TEAM NAME]
[+2PT FG]  [Free Throw]  [+3PT FG]     ← green fill
[2PT Miss] [REB]  [AST]  [3PT Miss]    ← red fill
           [TO]   [STL]
           [BLK]  [FOUL]

On the Court: [N]
[⇄ Substitutions]

─────────────────────
[Play by Play ▾]      [Undo]
```



#### Button colors
- `+2PT FG` / `+3PT FG` (made): `bg-green-700 text-white`
- `2PT Miss` / `3PT Miss`: `bg-red-700 text-white`
- `Free Throw`: `bg-orange-600 text-white`
- Neutral stats (REB, AST, etc.): `bg-gray-100 text-gray-700 border`

#### Opponent column — simplified (no AST/STL/BLK — opponent self-reported stats only)

#### Period selector dropdown

```
Half 1  ✓
Half 2
OT
```



#### Undo behavior
- Tapping Undo: marks last `game_plays` row as `is_voided = true` (with `voided_at`/
  `voided_by`), recalculates score display. (Column is `is_voided`, not `is_undone`.)
- Opponent plays are flagged via `game_plays.is_opponent = true` (no `team` text column).
- `period` is stored as an integer.
- Show "Undo" greyed when no plays recorded.

#### Play by Play section (expandable)

```
[Half 1]
  2:14  Charlie #5  +2PT FG  (LH 4 – OPP 2)
  2:08  Opponent    +3PT FG  (LH 4 – OPP 5)
  ...
```



---

### 3.8 Team Settings

**Status: DESIGN-INTENT — not a live route** (per §1, never built this way; no `/teams/:teamId/settings` in App.jsx). Treat the below as proposed UX, not shipped.
**Proposed route:** `/teams/:teamId/settings`  
**Roles:** Admin only

#### Layout

```
[X]  Team Settings

[ℹ] Team Info                    [chevron]
[📊] Stat Settings               [chevron]
[📹] Live Stream Sharing         [chevron]

[🎮] Practice Scoring a Game     [chevron]
[↺] Start New Season             [chevron]
     Roll over roster and fans to a new season

[🔔] Game Alerts                 [chevron]
[📅] Schedule Sync               [chevron]

─────────────────────
[Leave Team]   red text, destructive
```



#### Team Info sub-screen

```
[← Back]  Team Info  [Save]

[Logo circle + camera badge + "Edit Team Logo"]
[Team Name text field]
Team ID:  7vylnuRf3hzZ  [copy icon]

EVENT REMINDERS
Remind Team    [2 days before event ▾]

TEAM DETAILS
Sport          Basketball
Team Type      Select / Travel
Level          10U
Location       Westchester, NY  [chevron]
Current Season Spring 2026
```



#### Stat Settings sub-screen

```
[← Back]  Stat Settings

STAT PRIVACY
Anyone
All confirmed members ✓
Confirmed - Player
```



#### Schedule Sync sub-screen

```
[← Back]  Schedule Sync

Sync Schedule to Your Calendar
Add this team's schedule to your personal calendar.

[action sheet on tap]
Sync Apple Calendar
Sync Google Calendar
Copy Calendar Link
Cancel
```


Note: iCal lag warning displayed inline: "Some calendar events, including iCal, can take up to 24 hours or longer to update."

#### Game Alerts sub-screen

```
[← Back]  Team Notifications
           ARM 11U

[Permission warning banner if OS notifications disabled:]
[! icon] System notifications are disabled. Please enable them in Settings.
[Open Settings] button

VIDEO ALERTS
Live Video Start         [toggle]
Live Video End           [toggle]
Player Video Clips       [toggle]
  Sent when a player has new video clips

GAME ALERTS
Game Start/Over          [toggle]
Score Updates            [toggle]
Lead Changes             [toggle]
Period Summaries         [toggle]
Player Activity          [toggle]
  Sent when a team member is involved in a play
```



---

### 3.9 Team Chat

**Status: DESIGN-INTENT — not a live route** (per §1, never built this way; no `/messages/:teamId` in App.jsx — chat lives under `/messages` with channel/dm routing). Treat the below as proposed UX, not shipped.
**Proposed route:** `/messages/:teamId`  
**Roles:** All

#### Layout

```
[X]  ARM 11U  [···]

[date stamp: "Apr 10" centered gray pill]

[message bubble right-aligned for sender]
  Test
  10:55 AM

[compose bar]
  [📎 attachment] [⚡ commands] [Send a message input] [→ send]
```



#### Instant Commands panel (⚡ tap)

```
Instant Commands
[Giphy icon] Giphy   /giphy [text]
```


*Extensible — future: `/game` drops game card, `/rsvp` shows availability summary*

#### Message long-press

```
[reaction bar: LOL 👍 ❤️ 👎 ?!]
[message bubble]
Reply
Mark as unread
Copy Message
[🗑 Delete Message]   red text + red trash icon
```



#### Conversation Settings (··· tap)

```
[X]  Conversation Settings

[Team logo] ARM 11U
            Spring 2026

[🔔] Mute Notifications    [toggle]

CONVERSATION MEMBERS (N)
[avatar] Frank S (you)  ·  Admin
[avatar] Kenny Lane     ·  Coach
...

"All team members are automatically added to this conversation."
```



#### "Message Team" channel picker (from team header)

```
How would you like to message the team?
[Team Chat]
[Email]
─────────────────
[Cancel]
```



---

### 3.10 QR Code / Share Screen

**Status (CLAUDE.md §8):** NOT yet built — in-app QR generation is the next
unblocked feature (needs a `qrcode` dep + render surface). The public team
schedule + iCal subscription URL (via `teams.team_feed_token`) already exist;
the QR render is the missing piece. Spec below is the design intent.

**Route:** Modal from team share button  
**Roles:** Admin, Coach

#### Layout

```
[X]

Share your team via QR code

[Card: Team Name | Season]
[QR Code — links to team join URL]

[↑ Share link]   [🖨 Print]
```



---

### 3.11 RSVP / Availability — Coach View

**Surface:** the RSVP/availability collapsible on the event detail page
(`/events/:id`), not a separate route. Reads `event_rsvps` grouped by `response`
(going / not_going / maybe / no-response).  
**Roles:** Admin, Coach

#### Layout

```
[← Back]  Availability
           vs. Pleasantville · Apr 10

Going (7)
  [avatar] Charlie #5
  [avatar] Sofia #24
  ...

Not Going (2)
  [avatar] Lilly #1
  [avatar] Kayla #35

No Response (2)
  [avatar] Sara #3
  [avatar] Gia #22
  [Send Reminder] pill button

Academy Players
  [avatar] Marcus #8  →  (activates if roster < 8)
```



---

### 3.12 Enter Game Score

**Route:** Modal/bottom sheet on event detail  
**Roles:** Admin, Coach  
**Trigger:** "Enter Score" button on event detail (post-game only)

#### Layout

```
[X]  Enter Score
     vs. Pleasantville · Apr 10

[LH Logo]  [   ] – [   ]  [OPP Logo]
Legacy Hoopers         Pleasantville

[Save Score]  cobalt full-width button
```



- Numeric keyboard auto-opens on score field tap
- On save: writes `game_results` (`our_score`, `opponent_score`, derived `result`).
  W-L is NOT stored on `teams` — records are derived from `game_results` at read time.
- Result immediately visible on schedule row ("W 42-38" success / "L 25-30" danger)

---

## 4. Navigation Flows

### Coach adds a game
1. Tab → Schedule
2. Tap floating "+ Add Event" pill
3. Action sheet: "Which team?" → select team
4. Action sheet: "Add Game" | "Add Event"
5. Add Event form
6. Fill fields, tap Save
7. Action sheet: "Save & Message Team" | "Save & Don't Message Team"
8. If message: Notification Compose → Send Notification
9. Returns to Schedule with new game in list

### Parent RSVPs to a game
1. Home dashboard → Next Up card → "Are you going?"
2. Tap "Going" → state updates inline (writes `event_rsvps.response='going'`)
3. OR: Schedule → tap event row → `/events/:id` → Going / Not Going / Maybe
4. State persists — next open shows "You're going" + Edit RSVP

### Coach enters live score
1. Schedule → tap game (in progress or post-game)
2. Event detail → "Start Scoring" (during) or "Enter Score" (after)
3. Live scoring interface (during) OR quick score entry (after)
4. Score saved → result visible on schedule row + records page

### Admin shares team with parents
1. Team profile → share icon (↑)
2. QR code modal
3. Parent scans → joins team as Follower
4. Family member claim: "Which player are you a family member of?" → roster list → select → submit

---

## 5. Notifications

> **CANONICAL SOURCE: CLAUDE.md §16.5 (two streams) + §13 (comms HTML rules).**
> Notifications run as TWO independent, admin-configurable streams:
> - **Stream A — Event reminders** ("don't forget your event"): 3-day · 1-day ·
>   4-hour cadence. Suppressed by Quiet Mode unless severity `critical`.
> - **Stream B — RSVP nudges** ("you haven't RSVP'd yet"): T-4h + T-1h before the
>   RSVP-lock deadline; weekly email digest Sunday 6 PM. SMS reserved for
>   cancellations + admin `critical` only.
>
> Email/briefing delivery flows through `comms_messages` (kinds: weekly_digest,
> schedule_change, game_recap, rsvp_nudge, academy_callup_notice, etc.). Briefing
> HTML must be inline-styled, table-based, cobalt-accent (§13). Push is delivered
> via `push_subscriptions` + `notifications_queue`.

### Push notification triggers
| Event | Template |
|-------|----------|
| New game added | "New game added: [Opponent] · [Date] · [Time]" |
| Game updated | "Game update: [Opponent] · [Date] now [Time] at [Location]" |
| Game reminder (configurable days before) | "Game tomorrow: vs. [Opponent] · [Time] · Arrive by [arrive time]" |
| Score entered | "[Team] [W/L] [Score]-[OppScore] vs. [Opponent]" |
| Message received | "[Sender]: [preview]" |

### Notification permission banner
If OS notifications disabled: show inline red banner on any notification-dependent screen:

```
[! icon]  Notifications are disabled. 
          Enable them to receive game alerts.   [Open Settings]
```


---

## 6. Key Business Rules

1. **Team naming:** Number first, gender after — "10U Black", "9U Boys", "11U Girls". Never "Boys 10U".
2. **Tab/list order:** 11U Girls → 10U Black → 10U Blue → 9U Boys → 8U Boys (oldest to youngest).
3. **Records page labels (all-caps):** 11U GIRLS · 10U BOYS BLACK · 10U BOYS BLUE · 9U BOYS · 8U BOYS.
4. **Never use "CYO" in UI** — always "League Play".
5. **Circuit taxonomy:** AAU teams (ZG circuit): 11U Girls, 10U Black, 8U Boys. League Play teams: 10U Blue, 9U Boys.
6. **Futures Academy players:** `roster_type = 'futures'` on `team_players` (team-scoped
   membership), NOT a role and NOT a `players.member_type` check for team context.
   Practice weekly with rostered team; called up to a game-day lineup (event
   `academy_callup_player_ids`). Surface as an "Academy Player" badge — headline
   feature, never a footnote.
7. **Scrimmage games:** `events.is_scrimmage = true` — do NOT count toward W-L record.
   Mark with asterisk (*) in stats tables.
8. **Partner vs. staff:** Frank Samaritano (Program Director) and Kenny Lane (Coaching
   Director) are both Admin role. Darien Gonzalez is paid-per-session Assistant Coach
   (Coach role). Roles live in `user_roles.role` ∈ admin / coach / parent.
9. **Payment / "owes money":** canonical source is `financial_accounts` +
   `financial_transactions` + the `family_balances` view — NOT the legacy
   `roster_members.payment_status` column (retired from UI in PR #582). "Owes money"
   surfaces are ALL-SEASONS (§4.AW decision); collection-% surfaces are season-scoped
   and labeled as such.
10. **Primary calendar:** admin@legacyhoopers.org. LeagueApps auto-syncs a read-only
    imported calendar — never write to it. (This is the Google **calendar** account, an
    external integration — NOT migrated with the admin login; left as-is pending a
    separate calendar move.)
11. **Admin email:** frank@astersports.co (was admin@legacyhoopers.org, retired 2026-06-30).
12. **iCal sync lag warning:** always display "Calendar events can take up to 24 hours to
    update in subscribed apps" near any calendar subscription feature.

---

## 7. Phase Build Order

> **STATUS (CLAUDE.md §8, 2026-05-29):** Most of the platform below is already SHIPPED.
> The app is live in production with Spring 2026 data. The checkboxes are kept as a
> feature map; the boxes are marked to reflect actual build state. The genuinely
> remaining unbuilt arc is in-app QR codes (public-schedule QR + parent-invite QR).
> Per-player game stats / box score (Phase 3 player stats) are BLOCKED, not pending
> (§16.12). Treat this section as a built-feature inventory, not a forward sprint plan.

### Phase 1 — Schedule (SHIPPED)
- [x] Schedule list with month bands + multi-team event rows
- [x] Event detail full page (`/events/:id`) with RSVP 3-state flow (going/not_going/maybe)
- [x] Add Event FullScreenForm (full field set)
- [x] Save → action sheet → Notification Compose
- [x] Opponent search with Previous Opponents list
- [x] Location select with map preview

### Phase 2 — Team + Roster (SHIPPED)
- [x] Team profile header (logo, metadata row, tabs)
- [x] Roster (Players) — backed by `team_players` (current) + `roster_members` (sizes)
- [x] Player profile (engagement stats only — game stats BLOCKED per §16.12)
- [x] Staff list — backed by `staff_profiles` / `team_staff`
- [x] Add Player / player + guardian CRUD (admin)

### Phase 3 — Score Entry (SHIPPED)
- [x] Quick score entry (writes `game_results`)
- [x] Score display on schedule rows (W/L + score)
- [x] Records derived from `game_results` (records page)
- [x] Live scoring interface (`/events/:id/live`, full scorekeeping via `game_plays`)
- [x] Play-by-play + Undo (`is_voided`)

### Phase 4 — Messaging (SHIPPED)
- [x] Team chat + channels + DM threads (`messages` / `dm_threads`)
- [x] Message deletion, unread badges
- [ ] Attachment picker (Camera / Photo / File) — not yet wired on `messages`
- [x] Channel picker (Team Chat vs. Email) via the comms/briefing flow
- [~] Save & Message Team auto-notifications (settings sheet exists; partial)

### Phase 5 — Settings + Admin (largely SHIPPED)
- [x] Admin team management (`/admin/teams`)
- [x] Admin seasons / members / opponents / locations
- [x] Schedule Sync — iCal subscription URL via `teams.team_feed_token` (calendar sync)
- [~] Game Alerts granular toggles — partial (notification settings)
- [ ] QR code share screen — NEXT unbuilt arc (needs `qrcode` dep)
- [x] Start New Season — season rollover wizard (`/admin/rollover`)
- [x] Financial dashboard + LeagueApps import (`/admin/financials`)

---

## 8. Files to Reference

- **Live app:** https://astersports.app
- **Repo:** github.com/LegacyHoopers/aster-sports (private), branch `main`
- **Supabase project:** `vrwwpsbfbnveawqwbdmj` · org_id `e3e95e21-3571-4e9a-985a-d5d01480d4a6`
- **Project doctrine (source of truth):** `CLAUDE.md` (§3 tokens, §5 schema, §10 LH
  reference, §11.5 ground-truth tables, §16 elite design principles)
- **Team colors:** `src/lib/constants.js` (`TEAM_COLORS`, v14 palette)
- **Routes:** `src/App.jsx` · **Bottom nav:** `src/components/layout/BottomNav.jsx`
- **Schedule + financial source data** was imported from LeagueApps (Fall 2025 +
  Winter 2025-26 + Spring 2026) — historical xlsx workbooks are no longer the
  live reference; production DB is canonical.
- **Local path:** `~/aster-sports` · **Vercel:** linked to that path

---

## 9. Current Legacy Hoopers Facts (verified against production 2026-05-29)

- **Teams (5, oldest→youngest by `sort_order`):** 11U Girls (AAU/ZG, female) ·
  10U Black (AAU/ZG, male) · 10U Blue (League Play, male) · 9U Boys (League Play,
  male) · 8U Boys (AAU/ZG, male). `circuit` stores lowercase `aau` / `league_play`.
- **Seasons:** Fall 2025 (archived) · Winter 2025-26 (archived) · **Spring 2026
  (active, Mar 23 – Jun 14)**.
- **Spring 2026 families:** 60 `financial_accounts` / 60 distinct guardians.
- **Org:** `e3e95e21-3571-4e9a-985a-d5d01480d4a6` · Admin: frank@astersports.co.

## 9b. Claude Code Session Notes

**Resume command:** `cd ~/aster-sports && claude`

**Environment:** HP Chromebook · ChromeOS Crostini (Linux) · Node.js · Claude Code

**Auth user:** frank@astersports.co (Admin role)

**App ran locally at:** localhost:5173 · **Production:** https://astersports.app

**Deliver:** Complete revised files, not partial patches. Flag clearly when something is wrong. No padding.
