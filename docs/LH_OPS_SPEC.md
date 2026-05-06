# Legacy Hoopers Operations Platform — Build Spec
## For Claude Code (app.legacyhoopers.org)

**Stack:** React + Tailwind CSS · Supabase (vrwwpsbfbnveawqwbdmj) · Vercel  
**Auth:** Supabase role-based auth — Admin / Coach / Parent tiers  
**Resume:** `cd ~/legacy-hoopers-app && claude`  
**Brand:** Dark navy `#1a1a2e` · Cobalt `#4a8fd4` · CSS namespace `--lh-*` · Scope `.lh-page-wrapper`

---

## 0. Design System

### Colors

```css
--lh-navy: #1a1a2e;
--lh-cobalt: #4a8fd4;
--lh-cobalt-light: #6aaee0;
--lh-cobalt-dark: #3070b0;
--lh-green: #2e7d52;      /* W / going / made */
--lh-red: #c0392b;        /* L / not going / missed */
--lh-orange: #d4700a;     /* free throw / warning */
--lh-surface: #f5f7fa;    /* page background */
--lh-card: #ffffff;
--lh-border: #e2e8f0;
--lh-text-primary: #1a202c;
--lh-text-secondary: #64748b;
--lh-text-muted: #94a3b8;
```



### Typography
- **Display/Headers:** `font-bold` Tailwind, tracking tight
- **Body:** Default sans, 14–16px
- **Mono (IDs, codes):** `font-mono text-sm`

### Component Patterns
- **Cards:** `rounded-xl shadow-sm border border-lh-border bg-white`
- **Bottom sheets:** slide up from bottom, `rounded-t-2xl`, drag handle bar at top
- **Destructive actions:** red filled rounded button, not just red text
- **Month band dividers:** full-width gray band `bg-gray-100 text-xs font-semibold uppercase tracking-wide px-4 py-2`
- **Empty states:** centered illustration + bold heading + supporting subtext + primary CTA
- **Section headers with count:** `text-xs font-semibold text-lh-text-secondary uppercase tracking-wide` e.g. "STAFF (1/4)"
- **Save/Cancel nav:** Back chevron left · Title center · Save/Done text right (grayed until change)
- **Discard confirmation:** bottom sheet — "Are you sure?" gray label · red "Discard Changes" · blue "Keep Editing"

---

## 1. Information Architecture

### Bottom Tab Bar (5 tabs — Admin/Coach view)

```
Home | Schedule | Score | Messages | Account
```


**Parent view:**

```
Home | Schedule | Messages | Account
```



### Route Map

```
/                        → Home (dashboard)
/schedule                → Schedule list (all teams, multi-team feed)
/schedule/:teamId        → Team schedule
/schedule/:teamId/:eventId → Event detail + RSVP
/score/:gameId           → Live scoring interface
/teams                   → Team list
/teams/:teamId           → Team profile (Schedule | Team | Stats | Opponents tabs)
/teams/:teamId/settings  → Team settings
/teams/:teamId/roster    → Players | Staff | Followers segments
/teams/:teamId/player/:playerId → Player profile (Video Clips | Stats | Followers)
/messages                → Conversation list
/messages/:teamId        → Team chat thread
/account                 → Account settings
```



---

## 2. Supabase Schema

### Tables

#### `teams`

```sql
id uuid primary key
name text                  -- "10U Black"
display_name text          -- "10U BOYS BLACK" (records page)
circuit text               -- 'AAU' | 'League Play'
age_group text             -- '8U' | '9U' | '10U' | '11U'
gender text                -- 'Boys' | 'Girls'
color_hex text             -- team accent color
season text                -- 'Spring 2026'
record_wins int default 0
record_losses int default 0
home_gym_id uuid references gyms(id)
created_at timestamptz default now()
```



#### `gyms`

```sql
id uuid primary key
name text                  -- "Westchester Community Center"
short_name text            -- "WCC"
address text
city text
state text
court_label text           -- "Court 1" | "Court 2" (sub-venue)
maps_place_id text         -- Google Places ID
lat numeric
lng numeric
```



#### `events`

```sql
id uuid primary key
team_id uuid references teams(id)
event_type text            -- 'Game' | 'Practice' | 'Other'
is_scrimmage boolean default false
home_away text             -- 'Home' | 'Away' | 'TBD'
opponent_id uuid references opponents(id)
gym_id uuid references gyms(id)
starts_at timestamptz
duration_minutes int default 60
arrive_minutes_before int  -- null = no arrival time
repeats text               -- 'Never' | 'Weekly' | 'Biweekly'
repeat_end_date date
notes text
created_by uuid references auth.users(id)
created_at timestamptz default now()
```



#### `opponents`

```sql
id uuid primary key
name text
city text
state text
circuit text               -- which league/circuit they're from
logo_url text
created_at timestamptz default now()
```



#### `game_results`

```sql
id uuid primary key
event_id uuid references events(id) unique
lh_score int
opp_score int
entered_by uuid references auth.users(id)
entered_at timestamptz default now()
```



#### `players`

```sql
id uuid primary key
team_id uuid references teams(id)
first_name text
last_name text
jersey_number int
is_academy_player boolean default false  -- Futures Academy
avatar_url text
created_at timestamptz default now()
```



#### `rsvps`

```sql
id uuid primary key
event_id uuid references events(id)
user_id uuid references auth.users(id)
status text                -- 'Going' | 'Not Going'
responded_at timestamptz default now()
unique(event_id, user_id)
```



#### `user_profiles`

```sql
id uuid references auth.users(id) primary key
display_name text
role text                  -- 'Admin' | 'Coach' | 'Parent'
team_ids uuid[]            -- teams this user is associated with
player_id uuid references players(id)  -- for parents
avatar_initials text       -- e.g. "FS"
phone text
```



#### `game_plays` (for live scoring)

```sql
id uuid primary key
event_id uuid references events(id)
team text                  -- 'Home' | 'Away'
player_id uuid references players(id)
play_type text             -- '2PT_MADE'|'2PT_MISS'|'3PT_MADE'|'3PT_MISS'|'FT_MADE'|'FT_MISS'|'REB'|'AST'|'STL'|'BLK'|'TO'|'FOUL'
period text                -- 'Half 1' | 'Half 2' | 'OT'
timestamp_in_game int      -- seconds from tip
created_at timestamptz default now()
is_undone boolean default false
```



#### `messages`

```sql
id uuid primary key
team_id uuid references teams(id)
sender_id uuid references auth.users(id)
body text
attachment_url text
attachment_type text       -- 'image' | 'video' | 'file'
sent_at timestamptz default now()
```



#### `message_reactions`

```sql
id uuid primary key
message_id uuid references messages(id)
user_id uuid references auth.users(id)
reaction text              -- 'LOL' | 'THUMBS_UP' | 'HEART' | 'THUMBS_DOWN' | 'EXCLAIM'
unique(message_id, user_id, reaction)
```



### RLS Policies (summary)
- **Admin:** full read/write all tables
- **Coach:** read/write events, game_plays, players for their team_ids; read all teams
- **Parent:** read events/players for their team_ids; write rsvps for self; read/write messages

---

## 3. Screen Specs

---

### 3.1 Home Dashboard

**Route:** `/`  
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
    Right: Time  OR  Result "W 42-38" (green) / "L 25-30" (red)
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

#### Event row tap → Event Detail bottom sheet (see 3.3)

---

### 3.3 Event Detail Bottom Sheet

**Triggered by:** tapping any event row  
**Component:** slides up from bottom

#### Layout

```
[Drag handle]
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
- Optimistic update — update UI immediately, sync to Supabase
- Going/Not Going are pill buttons: Going = green outline/fill, Not Going = red outline/fill
- Once confirmed, replace with "Edit RSVP" outlined button

---

### 3.4 Add / Edit Event

**Route:** `/teams/:teamId/events/new` and `/teams/:teamId/events/:id/edit`  
**Roles:** Admin, Coach

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

**Route:** `/score/:gameId`  
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
- Tapping Undo: marks last `game_plays` row as `is_undone = true`, recalculates score display
- Show "Undo" greyed when no plays recorded

#### Play by Play section (expandable)

```
[Half 1]
  2:14  Charlie #5  +2PT FG  (LH 4 – OPP 2)
  2:08  Opponent    +3PT FG  (LH 4 – OPP 5)
  ...
```



---

### 3.8 Team Settings

**Route:** `/teams/:teamId/settings`  
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

**Route:** `/messages/:teamId`  
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

**Route:** `/teams/:teamId/events/:id/availability`  
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
- On save: writes to `game_results`, updates `teams.record_wins/losses`
- Result immediately visible on schedule row ("W 42-38" green / "L 25-30" red)

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
2. Tap "Going" → state updates inline
3. OR: Schedule → tap event row → bottom sheet → Going/Not Going
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
6. **Futures Academy players:** Practice weekly with rostered team. Activate to game-day lineup when roster < 8. Surface as "Academy Player" badge on player profile — always a headline feature, never a footnote.
7. **Scrimmage games:** do NOT count toward W-L record. Mark with asterisk (*) in stats tables.
8. **Partner vs. staff:** Kenny Lane and Frank Samaritano are profit-pool partners. Coach Darien Gonzalez is paid-per-session staff. Role labels: Admin (Frank, Kenny) / Coach (Darien) / Parent.
9. **Primary calendar:** admin@legacyhoopers.org. LeagueApps auto-syncs a read-only imported calendar — never write to it.
10. **Admin email:** admin@legacyhoopers.org.
11. **iCal sync lag warning:** always display "Calendar events can take up to 24 hours to update in subscribed apps" near any calendar subscription feature.

---

## 7. Phase Build Order

### Phase 1 — Schedule (current sprint)
- [ ] Schedule list with month bands + multi-team event rows
- [ ] Event detail bottom sheet with RSVP 3-state flow
- [ ] Add Event form (full field set)
- [ ] Save → action sheet → Notification Compose
- [ ] Opponent search with Previous Opponents list
- [ ] Location select with map preview

### Phase 2 — Team + Roster
- [ ] Team profile header (logo, metadata row, tabs)
- [ ] Players / Staff / Followers segmented control
- [ ] Player profile (jersey # avatar, Stats table, Followers/Emergency Contact)
- [ ] Staff list with Team Permissions section
- [ ] Add Player / Add Staff flows

### Phase 3 — Score Entry
- [ ] Quick score entry (post-game modal)
- [ ] Score display on schedule rows (W/L + score)
- [ ] Records update on game_results write
- [ ] Live scoring interface (full scorekeeping)
- [ ] Play-by-play + Undo

### Phase 4 — Messaging
- [ ] Team chat thread
- [ ] Attachment picker (Camera / Photo / File)
- [ ] Reaction bar + long-press context menu
- [ ] Conversation settings (mute, member list)
- [ ] Channel picker (Team Chat vs. Email)

### Phase 5 — Settings + Admin
- [ ] Team Settings menu
- [ ] Team Info edit (name, logo, event reminders)
- [ ] Stat Settings (privacy tiers)
- [ ] Schedule Sync (Apple/Google/copy link)
- [ ] Game Alerts (granular toggles + OS permission check)
- [ ] QR code share screen
- [ ] Start New Season (roster rollover)

---

## 8. Files to Reference

- **Schedule workbook:** `Legacy_Hoopers_Spring_2026.xlsx` (122 events Mar 23 – Jun 14)
- **Financial tracker:** `LH_Spring2026_Final.xlsx`
- **Records page:** `records-v12-dark.html` (live on Squarespace, `--lh-*` CSS token reference)
- **Supabase project:** `vrwwpsbfbnveawqwbdmj`
- **App URL:** `app.legacyhoopers.org`
- **Vercel project:** linked to `~/legacy-hoopers-app`

---

## 9. Claude Code Session Notes

**Resume command:** `cd ~/legacy-hoopers-app && claude`

**Environment:** HP Chromebook · ChromeOS Crostini (Linux) · Node.js · Claude Code v2.1.92

**Auth user already created:** admin@legacyhoopers.org (Admin role)

**App ran locally at:** localhost:5173

**Phase 2 next build step:** Schedule page with live Supabase data

**Deliver:** Complete revised files, not partial patches. Flag clearly when something is wrong. No padding.
