# Briefing Renderer References

Production-quality tournament briefings, captured verbatim from delivered emails, as
design source-of-truth for the engine renderer wave (16 atomic renderers: 4
already-HTML-sketched + 4 unsketched + 6 templates + 2 free-text).

Each entry below is a single produced briefing. Read them as canonical pattern
exemplars — the structure, voice, microcopy, and visual hierarchy here is what
the engine should produce automatically once the renderer wave ships.

---

## Common structural elements (extracted across all entries)

Every tournament-prelim briefing contains the same atomic sections in the same
order. The engine wave renderer #1 (universal header) + renderer #3 (game card)
+ renderer #9 (championship scenarios) are the three workhorse renderers; the
remaining surface area is templated.

1. **Subject line**: `<Team> | <hook>` (≤ 70 chars).
   Examples: `10U Black | CT This Weekend — Pool Play, Semis & Championship`.
2. **Sender footer**: `From: Legacy Hoopers`.
3. **Universal header band** (cobalt #4a8fd4, white text, ~120px tall):
   - Line 1 (overline): `<TEAM> | <TOURNAMENT NAME>` letter-spaced uppercase.
   - Line 2 (display): `TOURNAMENT WEEKEND` or topical phrase
     (`ROAD TRIP TO CT` for the 8U travel framing).
   - Line 3 (subline): `<date range> | <state code>` or
     `<date range> | <hook line>` (8U: "Set your alarms. Yes, again.").
4. **RSVP yellow callout band** (#FEF3C7 or warning-soft, dark text):
   `RSVP in the LeagueApps app so <Coach <First Name>> can set rosters.`
   - 10U Black + 11U Girls = Coach Kenny.
   - 8U Boys = Coach Darien.
5. **Venue list** (white card, centered):
   - Single venue → `<Name> | <City> | Map` with map link.
   - Multi venue (10U Black) → two lines, each `<Name> | <City> | Map`.
   - 11U Girls variant adds the full address inline below the venue name
     (`29 Trefoil Dr, Trumbull, CT 06611 | Map`).
6. **Live standings link** (centered, accent color):
   `View Live Standings` → href to bracket portal.
7. **Day-grouped game cards** (rule rows, oldest-to-youngest within day):
   - Day header band (uppercase letter-spaced): `SATURDAY, MAY 16` — for 8U,
     append `| ANSONIA` because the day has a single anchor venue; multi-venue
     days omit the suffix.
   - Per-game row: left column = `GAME N` overline + `H:MM` time (underlined),
     right column = `VS <OPPONENT>` bold + `<Venue> | Court X` (or just
     `Court X` if the day's venue is implied by the header).
   - Special row variants:
     - `BONUS` overline (gray) with `Does not count toward standings.`
       trailing accent line (11U Girls Sunday 10:00).
8. **Bracket section** (peach card, only renders if bracket games exist):
   - Section header: `BRACKET PLAY | IF ADVANCE` (or `CHAMPIONSHIP | IF ADVANCE`
     if no semi).
   - Per-bracket row: left column = `SEMI` / `★` (gold) overline + time,
     right column = `<MATCHUP DESCRIPTOR>` bold + `<Venue> | Court X`.
   - Matchup descriptor uses bracket-placeholder language:
     `2ND PLACE VS 3RD PLACE`, `CHAMPIONSHIP GAME`.
9. **Logistics line** (centered, single line):
   `Arrive <N> minutes before each tip | Jersey: <side> side out`.
10. **Tagline footer band** (cobalt, centered, italic-weight one-liner):
    Examples:
    - `27 days of work. Time to show it.` (all three teams shared this for the
      May 16-17 weekend).
11. **Voicey prose closer** (optional, 8U variant only): paragraph(s) of
    coach-voice supplemental info — pizza tip, time-window humor.

---

## Inventory of distinct atomic renderers needed

| # | Renderer | Sections it produces | Status |
|---|---|---|---|
| 1 | Universal header | (3) header band | Already HTML-sketched ✅ |
| 2 | Sender attribution | (2) From line | Template |
| 3 | Game card | (7) game rows | Already HTML-sketched ✅ |
| 4 | Day-grouped schedule | (7) day header + game rows | Already HTML-sketched ✅ (day section) |
| 5 | RSVP callout | (4) yellow band | Template |
| 6 | Venue list | (5) single/multi | Template |
| 7 | Standings link | (6) link row | Template |
| 8 | Bonus-game variant | (7) bonus row | Template (game card variant) |
| 9 | Championship scenarios | (8) bracket card | Already HTML-sketched ✅ |
| 10 | Logistics line | (9) arrival + jersey | Template |
| 11 | Tagline footer | (10) tagline band | Template |
| 12 | Voicey prose closer | (11) free-text | Free-text editable |

(The numbering above maps to the engine wave's 12 atomic renderers; the spec
called for 16 total — the remaining 4 belong to non-tournament briefing kinds:
weekly_digest sections, schedule_change diff, academy_callup_notice intro,
recap stat strip.)

---

## Entry: 10U Black — ZG Rumble for the Ring CT — May 16-17

**Subject**: `10U Black | CT This Weekend — Pool Play, Semis & Championship`
**From**: Legacy Hoopers
**Tournament**: `ZG Rumble for the Ring`
**Date range**: `May 16-17 | CT`
**RSVP callout**: `RSVP in the LeagueApps app so Coach Kenny can set rosters.`

### Venues
- Insports Center | Trumbull | Map
- Boys and Girls Club of Shelton | Shelton | Map

### View Live Standings (link row)

### Saturday, May 16
| Game | Time | Opponent | Location |
|---|---|---|---|
| 1 | 12:00 | VS PHD WHITE - RUTHERFORD | Insports Center \| Court 4 |
| 2 | 1:00 | VS PHD YELLOW - RUTHERFORD | Insports Center \| Court 4 |

### Sunday, May 17
| Game | Time | Opponent | Location |
|---|---|---|---|
| 3 | 11:00 | VS TEAM FRENJI | Insports Center \| Court 2 |

### Bracket Play | If Advance
| Slot | Time | Matchup | Location |
|---|---|---|---|
| SEMI | 2:00 | 2ND PLACE VS 3RD PLACE | Boys and Girls Club of Shelton \| Court 1 |
| ★ | 4:00 | CHAMPIONSHIP GAME | Boys and Girls Club of Shelton \| Court 2 |

### Logistics
`Arrive 15 minutes before each tip | Jersey: black side out`

### Tagline
`27 days of work. Time to show it.`

---

## Entry: 11U Girls — ZG Rumble for the Ring CT — May 16-17

**Subject**: `11U Girls | ZG Rumble for the Ring — Tournament Weekend`
**From**: Legacy Hoopers
**Tournament**: `ZG Rumble for the Ring`
**Date range**: `May 16-17 | Trumbull, CT`
**RSVP callout**: `RSVP in the LeagueApps app so Coach Kenny can set rosters.`

### Venues (single, inline address variant)
- All games at Insports Center · 29 Trefoil Dr, Trumbull, CT 06611 | Map

### View Live Standings (link row)

### Saturday, May 16
| Game | Time | Opponent | Location |
|---|---|---|---|
| 1 | 11:00 | VS CT NORTHSTARS - TRACY | Court 3 |
| 2 | 2:00 | VS PHD - CAROTHERS | Court 1 |

### Sunday, May 17
| Game | Time | Opponent | Location | Notes |
|---|---|---|---|---|
| 3 | 8:00 | VS PHD - MCCURDY | Court 4 | |
| BONUS | 10:00 | VS CONNECTICUT ELITE - JC | Court 4 | Does not count toward standings. |

### Championship | If Advance
| Slot | Time | Matchup | Location |
|---|---|---|---|
| ★ | 12:00 | CHAMPIONSHIP GAME | Sunday \| Court 4 \| If advance |

### Logistics
`Arrive 15 minutes before each tip | Jersey: black side out`

### Tagline
`27 days of work. Time to show it.`

---

## Entry: 8U Boys — ZG Rumble for the Ring CT — May 16-17

**Subject**: `8U Boys | ZG Rumble for the Ring — Road Trip to CT`
**From**: Legacy Hoopers
**Tournament**: `ZG Rumble for the Ring`
**Date range**: `May 16-17 | Set your alarms. Yes, again.`
**RSVP callout**: `RSVP in the LeagueApps app so Coach Darien can set rosters.`

### Venues (multi-venue, no inline address)
- Boys and Girls Club of Ansonia | Ansonia | Map
- Boys and Girls Club of Shelton | Shelton | Map

### View Live Standings (link row)

### Saturday, May 16 | Ansonia
| Game | Time | Opponent | Location |
|---|---|---|---|
| 1 | 11:00 | VS ACC - ED | Court 2 |
| 2 | 2:00 | VS STAMFORD PEACE - PRESTON | Court 2 |

### Sunday, May 17 | Shelton (AM) + Ansonia (PM)
| Game | Time | Opponent | Location |
|---|---|---|---|
| 3 | 8:00 | VS CT WOLVES | Boys and Girls Club of Shelton \| Court 2 |

### Championship | If Advance
| Slot | Time | Matchup | Location |
|---|---|---|---|
| ★ | 5:00 | CHAMPIONSHIP GAME | Boys and Girls Club of Ansonia \| Court 2 |

### Logistics
`Arrive 15 minutes before each tip | Jersey: black side out`

### Tagline
`Tournament 3. These boys are ready.`

(Per-team customized — NOT shared template. 10U Black + 11U Girls used
"27 days of work. Time to show it." this weekend; 8U Boys used the line
above. Tagline is a per-briefing free-text override on every send.)

### Voicey prose closer (free-text variant)
```
Saturday is a 2-hour break between games. Casa Bianca Pizza is 5 minutes from the
gym. 669 Main St, Ansonia. You are welcome.

Sunday is an 8 AM tip in Shelton, then a potential championship back in Ansonia
at 5 PM. That is an 8-hour window. You could technically fly to Florida and
back. We recommend lunch instead.
```

---

## Entry: VIP Parent Guide — Edina & Santos Dodaro — May 16-17

A separate briefing kind. Parent-scoped, multi-kid, multi-team, **multi-org**
in this case (Sofia plays for Legacy Hoopers 11U Girls; Mario plays "Boys
Var" — a team not in our org's roster). Aggregates all of a single family's
games across the weekend into one chronological calendar.

This is the canonical render for `multi_team_notice` (CLAUDE.md §13 canonical
9 kinds). It does NOT use the universal header band — it has its own
parent-name display + per-kid pills.

**Subject** (likely): `VIP Parent Guide: Edina & Santos Dodaro — Tournament Weekend`
**From**: Legacy Hoopers
**Internal label** (Frank's title): `dodaro family rumble`

### Header (different from the standard universal header)
- Overline (gold/yellow): `VIP PARENT GUIDE`
- Display (large, dark text on light bg): parent names
  `EDINA & SANTOS DODARO`
- Subline (regular weight): `ZG Rumble for the Ring | May 16-17 | CT`
- Two color-coded kid pill badges (rounded, ~36px height):
  - Blue (#4a8fd4 / accent): `SOFIA | 11U GIRLS`
  - Red (#8B1A1A / crimson): `MARIO | BOYS VAR`
- Pill colors map to the kid's team color in the unified schedule below.

### Quick-link nav row (centered, accent links, pipe-separated)
```
Sofia Standings | Mario Standings | Insports | House of Sports
```
Format: `<KidName> Standings` for each kid + venue jump-links per distinct
venue across all the kids' games.

### Unified chronological schedule (interleaved across kids)

Day header band (uppercase letter-spaced): `SATURDAY, MAY 16`

Per-game row format:
- **Left column**: time (large bold) + `AM`/`PM` (small uppercase below)
- **Color stripe** down the left edge (~6px wide): kid's team color
  (matches pill badge color in header)
- **Top row**: kid badge pill (small) + optional inline status badge
  (e.g., gray `BONUS`)
- **Game line**: opponent (e.g., `vs CT Northstars - Tracy`) — note this
  uses lowercase `vs` (not the all-caps `VS` of the team-scoped briefings)
- **Sub-line**: venue + ` | ` + court (e.g., `Insports | Court 3`)

### Saturday, May 16 (verbatim from screenshot)
| Time     | Kid    | Opponent                        | Venue / Court             |
|----------|--------|---------------------------------|---------------------------|
| 11:00 AM | SOFIA  | vs CT Northstars - Tracy        | Insports \| Court 3       |
|  2:00 PM | SOFIA  | vs PHD - Carothers              | Insports \| Court 1       |
|  7:45 PM | MARIO  | vs Team Russell                 | House of Sports \| Court 4 |
|  8:45 PM | MARIO  | vs Stepback Wolves - Tommy      | House of Sports \| Court 4 |

### Sunday, May 17 (partial — visible in screenshot through 3:25 PM)
| Time     | Kid    | Opponent                        | Venue / Court             |
|----------|--------|---------------------------------|---------------------------|
|  8:00 AM | SOFIA  | vs PHD - McCurdy                | Insports \| Court 4       |
| 10:00 AM | SOFIA  | vs Connecticut Elite - JC (BONUS) | Insports \| Court 4     |
|  3:25 PM | MARIO  | (cut off in screenshot)         | (cut off)                 |

(Sunday continues below the visible cutoff. When Frank shares the
remainder — including any if-advance championship rows + tagline + closer —
fill the rest in.)

### Cross-tournament reach
Sofia's games are all at Insports (CT). Mario's games are all at House of
Sports (Westchester County, NY) — a venue used by ZG NY Metro Showdown
back in April. So this single VIP guide spans:
- Two distinct teams
- Two distinct venues in two states
- Possibly two distinct tournaments (or one circuit running concurrent
  brackets across regions)

The per-kid `Standings` link points to whichever bracket portal that
kid's team is registered in.

---

## Atomic renderers introduced by the VIP Parent Guide

Adds 4 renderers beyond the 12 already cataloged for team-scoped briefings:

| # | Renderer | Sections it produces |
|---|---|---|
| 13 | VIP header (parent-name display) | Different header band — gold overline, dark parent names, light bg, kid pills |
| 14 | Kid color pill | Color-coded badge (kid's team color) reused inline + in header |
| 15 | Quick-link nav row | Per-kid standings + per-venue jump-links |
| 16 | Color-striped game row | Per-game card with left edge color stripe matching kid color, kid pill badge, lowercase `vs <Opponent>`, venue/court sub-line |

Renderer 16 supersedes renderer 3/4 (game card + day-grouped) for VIP
guides — the two-column "Game N / time" format becomes the single-column
"time + AM/PM" format because game numbering doesn't apply across teams.

---

## Entry: Coach Roundup — Coach Kenny — May 16-20

A third briefing kind. Coach-scoped, multi-team (3 teams under one coach),
multi-event-type (mixes Rumble for the Ring tournament + WPCYO league play),
extended date range (Sat May 16 → Wed May 20, beyond the tournament weekend).
Sent TO the coach as a personal weekend roundup so they can see all their
games at a glance and plan around conflicts.

This is the canonical render for a **coach_roundup** kind (NOT in the
CLAUDE.md §13 canonical 9 — surfaces a gap to confirm the kind name with
Frank). Pattern is the same shape as VIP Parent Guide but with coach-name
header + per-team pills (instead of parent-name header + per-kid pills).

**Subject** (likely): `Coach Kenny — Rumble for the Ring + League Play (May 16-20)`
**From**: Legacy Hoopers
**Recipient**: kenny@legacyhoopers.org (coach mailbox, not parent list)

### Header (light bg, dark text — variant of VIP header pattern)
- Overline (cobalt accent): `COACH KENNY`
- Display (large, dark text): `RUMBLE FOR THE RING + LEAGUE PLAY`
  (combines tournament + circuit name when both apply that week)
- Three team pill badges (color-coded per `teams.team_color`):
  - Dark olive/yellow: `11U GIRLS`
  - Cobalt blue: `10U BLACK`
  - Gray: `10U BLUE`

### Quick-link nav row
```
ZG Standings | Insports | Shelton | IC-Tuckahoe
```
- First link: tournament standings portal
- Remaining: per-distinct-venue jump links (Insports = ZG Rumble, Shelton =
  ZG Rumble bracket, IC-Tuckahoe = WPCYO league venue)

### Saturday, May 16 | Insports Center
(Day header includes single-venue suffix when all that day's games share
a venue. When venues differ, the suffix is omitted — same logic as the
team-scoped briefing variant.)

| Time     | Team       | Opponent                       | Court    |
|----------|------------|--------------------------------|----------|
| 11:00 AM | 11U GIRLS  | vs CT Northstars - Tracy       | Court 3  |
| 12:00 PM | 10U BLACK  | vs PHD White - Rutherford      | Court 4  |
|  1:00 PM | 10U BLACK  | vs PHD Yellow - Rutherford     | Court 4  |
|  2:00 PM | 11U GIRLS  | vs PHD - Carothers             | Court 1  |

### Sunday, May 17
| Time     | Team       | Opponent                       | Venue / Court           |
|----------|------------|--------------------------------|-------------------------|
|  8:00 AM | 11U GIRLS  | vs PHD - McCurdy               | Insports \| Court 4     |
| 10:00 AM | 11U GIRLS  | vs Connecticut Elite - JC `[BONUS]` | Insports \| Court 4 |
| 11:00 AM | 10U BLACK  | vs Team Frenji                 | Insports \| Court 2     |

#### IF ADVANCE (inline section sub-header within Sunday)
| Time     | Team       | Game                           | Venue / Court           |
|----------|------------|--------------------------------|-------------------------|
| 12:00 PM | 11U GIRLS  | ★ Championship                 | Insports \| Court 4     |

#### ⚠ Conflict callout (orange/red text, distinct row variant)
```
2:00-2:30 PM CONFLICT: 10U BLACK SEMI + 10U BLUE LEAGUE
```

| Time     | Team       | Game / Opponent                | Venue / Court           |
|----------|------------|--------------------------------|-------------------------|
|  2:00 PM | 10U BLACK  | Semi: 2nd vs 3rd Place         | BGC Shelton \| Court 1  |
|  2:30 PM | 10U BLUE `[LEAGUE]` | vs 6th Boro 4AB        | IC-Tuckahoe \| Map      |
|  4:00 PM | 10U BLACK  | ★ Championship                 | BGC Shelton \| Court 2  |

### Wednesday, May 20
| Time     | Team       | Game                           | Venue / Court           |
|----------|------------|--------------------------------|-------------------------|
|  7:00 PM | 10U BLUE `[LEAGUE]` | vs Holy Family-NR 4AB  | Spellman Rec \| Map     |

### Footer (compact)
`15 min before each tip | Black side out`

(No tagline / no prose closer — coach roundups are utilitarian; the
voicey wrap is reserved for parent-facing team-scoped briefings.)

---

## Entry: Coach Roundup — Coach Darien — May 16-18

Same kind as the Coach Kenny entry above, scoped to Coach Darien's two teams.

**Subject** (likely): `Coach Darien — Rumble for the Ring + League Play (May 16-18)`
**From**: Legacy Hoopers
**Recipient**: darien@legacyhoopers.org

### Header
- Overline: `COACH DARIEN`
- Display: `RUMBLE FOR THE RING + LEAGUE PLAY`
- Two team pill badges:
  - Green: `8U BOYS`
  - Cobalt teal: `9U BOYS`

### Quick-link nav
```
ZG Standings | Ansonia | Shelton | Spellman
```

### Saturday, May 16 | BGC Ansonia
| Time     | Team      | Opponent                        | Court    |
|----------|-----------|---------------------------------|----------|
| 11:00 AM | 8U BOYS   | vs ACC - ED                     | Court 2  |
|  2:00 PM | 8U BOYS   | vs Stamford Peace - Preston     | Court 2  |

### Sunday, May 17
| Time     | Team      | Opponent                        | Venue / Court           |
|----------|-----------|---------------------------------|-------------------------|
|  8:00 AM | 8U BOYS   | vs CT Wolves                    | BGC Shelton \| Court 2  |

#### IF ADVANCE
| Time     | Team      | Game                            | Venue / Court           |
|----------|-----------|---------------------------------|-------------------------|
|  5:00 PM | 8U BOYS   | ★ Championship                  | BGC Ansonia \| Court 2  |

### Monday, May 18
| Time     | Team      | Game                            | Venue / Court           |
|----------|-----------|---------------------------------|-------------------------|
|  6:00 PM | 9U BOYS `[LEAGUE]` | vs 6th Boro 3AB         | Spellman Rec \| Map     |

### Footer (compact)
`15 min before each tip | Black side out`

---

## Atomic renderers introduced by Coach Roundup

Adds 4 more renderers beyond the 16 already cataloged. Several share patterns
with VIP Parent Guide (header band, color-striped row), but introduce
coach-specific concerns (multi-event-type combination, conflict detection,
inline LEAGUE/BONUS tag pills, IF ADVANCE sub-section, extended date range).

| # | Renderer | Sections it produces |
|---|---|---|
| 17 | Coach header (coach-name display) | Light bg + cobalt overline + dark display + team pills (parallels VIP header r13 with coach-name + team pills instead of parent-name + kid pills) |
| 18 | Inline event-type tag | Gray pill `LEAGUE` / `BONUS` rendered inline next to team pill in game rows; differentiates non-tournament rows |
| 19 | IF ADVANCE inline sub-section | Sub-header within a day section (not a top-level day band); separates conditional bracket games from regular games chronologically |
| 20 | ⚠ Conflict callout | Orange/red text band BETWEEN game rows when two games on the coach's teams overlap in time. Format: `<TIME RANGE> CONFLICT: <TEAM A SHORT> + <TEAM B SHORT>`. Computed by the engine, not authored. |

---

## Three briefing kinds — summary

| Kind                      | Audience            | Header | Game row format        | Cross-tournament? |
|---------------------------|---------------------|--------|------------------------|-------------------|
| Team briefing             | Parents of one team | Cobalt band, TEAM \| TOURNAMENT overline | "Game N / time" two-column | No |
| VIP Parent Guide          | Parents w/ multiple kids | Light, gold VIP overline + parent names + kid pills | "time + AM/PM" + color stripe + kid pill | Yes (multi-kid, multi-team, multi-org) |
| Coach Roundup             | A single coach      | Light, cobalt COACH overline + coach name + team pills | "time + AM/PM" + color stripe + team pill + optional [LEAGUE]/[BONUS] tag | Yes (multi-team, multi-event-type, extended date range) |

The CLAUDE.md §13 canonical 9 kinds list covers `multi_team_notice` (which
should map to one of these). Confirm with Frank which canonical kind
maps to the Coach Roundup pattern (potential gap: may need a new
`coach_roundup` kind if not folded into `multi_team_notice`).

---

## Engine wave checklist (when implementing)

When the engine renderer wave kicks off, each renderer should be validated
against these production samples. The atomic-test rubric:

### Team-scoped briefings (10U Black, 11U Girls, 8U Boys)
- [ ] Renderer 1 (universal header) produces the cobalt band exactly per all 3 samples
- [ ] Renderer 3 (game card) handles "Court X only" vs "Venue | Court X" addressing
- [ ] Renderer 4 (day-grouped) supports the `| Ansonia` venue suffix variant
- [ ] Renderer 5 (RSVP callout) substitutes the coach first name correctly
- [ ] Renderer 6 (venue list) supports single-with-address, single-without, and multi
- [ ] Renderer 8 (bonus variant) renders the gray BONUS overline + accent footnote
- [ ] Renderer 9 (championship scenarios) handles SEMI + ★ Championship combo and ★-only
- [ ] Renderer 10 (logistics) substitutes `<N> minutes` and jersey side dynamically
- [ ] Renderer 11 (tagline footer) is per-briefing free-text override (10U Black +
      11U Girls shared "27 days of work" this weekend; 8U Boys used "Tournament 3.
      These boys are ready." — confirm renderer accepts arbitrary string)
- [ ] Renderer 12 (prose closer) is opt-in, free-text, raw paragraphs

### VIP Parent Guide briefings (multi-kid, multi-team)
- [ ] Renderer 13 (VIP header) replaces universal header for `multi_team_notice` kind
- [ ] Renderer 14 (kid color pill) sources kid's team color via `teams.team_color`
- [ ] Renderer 15 (quick-link nav) builds standings + venue list dynamically per family
- [ ] Renderer 16 (color-striped game row) interleaves all kids' games chronologically,
      omits "Game N" numbering, uses lowercase `vs`, supports inline `BONUS` badge

### Coach Roundup briefings (single coach, multi-team, mixed event types)
- [ ] Renderer 17 (Coach header) parallels VIP header but coach-name + team pills
- [ ] Renderer 18 (inline event-type tag) renders gray pill `[LEAGUE]` / `[BONUS]`
      inline next to team pill in game row
- [ ] Renderer 19 (IF ADVANCE sub-section) renders sub-header within a day section
      separating conditional bracket games from regular pool play
- [ ] Renderer 20 (⚠ Conflict callout) detects overlap across teams and emits the
      orange/red banner row. Engine-computed, not authored.

A future PR adds these as fixture-driven snapshot tests when the renderer
wave ships.
