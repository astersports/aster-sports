# LEGACY HOOPERS — Brand & Content Reference Model

*Source of truth synthesized from legacyhoopers.org crawl (Apr 21, 2026), records-v14_2.html visual system, and Spring 2026 schedule CSV. Intended as the authoritative reference for Skyfire's visual, copy, and data-model alignment with the Legacy Hoopers brand.*

---

## PART 1: BRAND IDENTITY

### Core brand positioning

**Tagline:** "Grow Your Game. Leave Your Legacy."

**Elevator pitch:** "Built by a Hall of Fame coach and a parent who refused to settle for the '15-kid cash grab.'"

**The three proof points (used throughout the site):**
1. Strict 10-player active rosters
2. Curriculum-based development
3. Minutes are earned, not given

### Brand voice

Direct. Witty. Emotionally intelligent. Never corporate. Key tonal patterns:

- **Names the problem:** "Thursday night scrambles", "15-kid cash grab", "5-Minute Practice Rule vs 15-Minute Game Arrival"
- **Families-first framing:** "Built for Families", "The Director's Promise", "The Car Ride Home"
- **Earned, not given:** Playing time, roster spots, minutes — all framed as earned through effort
- **Hall of Fame standards:** Collegiate-level expectation repeated throughout
- **Teaching over coaching:** "Hall of Fame educator", "teaches like a great educator", "differentiated instruction"

### Brand voice rules for Skyfire copy

- ✅ Write like a sharp operator, not a corporate platform
- ✅ Name the parent's actual problem before offering the solution
- ✅ Use "earned", "active roster", "differentiated", "curriculum" deliberately
- ✅ Celebrate real moments (Nationals Qualified, Champions, Semi-Final exits)
- ❌ No corporate jargon ("leverage", "utilize", "seamless", "streamline")
- ❌ No em dashes (use commas, colons, periods)
- ❌ Don't abbreviate to fluffy marketing phrasing

---

## PART 2: VISUAL SYSTEM

### Brand marks

Legacy Hoopers uses two logo marks that should be treated as a
matched pair — per-org Skyfire branding must recognize both:

- **Knight crest** — shield/helmet mascot mark. In-repo asset:
  `knight logo 2048.png` (to be renamed `knight-logo-2048.png` and
  moved under a structured per-org branding path when multi-tenant
  asset organization lands).
- **Legacy Hoopers wordmark** — the text-based logo used on the
  marketing site header, records page, and official documents.

**Correction note:** the `knight logo 2048.png` commit (`44e4741`)
flagged the asset as "assumed St. Patrick's — VERIFY." That assumption
was wrong. The knight crest is a Legacy Hoopers mark. St. Patrick's
CYO is a future program (onboarded after Legacy Hoopers) with its own
brand marks to be documented separately when that program enters
scope.

### Color palette (AUTHORITATIVE from records-v14_2.html)

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

### Team color palette (CRITICAL — SKYFIRE MISMATCH FOUND)

**Website records page team colors:**

| Team | CSS Variable | Hex | Notes |
|---|---|---|---|
| 11U Girls | --team violet | #a78bfa | Light violet |
| 10U Black | --team cobalt | #4a8fd4 | Brand cobalt (same as default) |
| 10U Blue | --team slate | #94a3b8 | Slate grey |
| 9U Boys | --team cyan | #06b6d4 | Cyan |
| 8U Boys | --team amber | #f59e0b | Amber |

**Skyfire current team colors (from memory):**

| Team | Skyfire hex | Website hex | Match? |
|---|---|---|---|
| 11U Girls | #7C3AED | #a78bfa | ❌ Skyfire is darker purple |
| 10U Black | #18181B | #4a8fd4 | ❌ Skyfire is near-black, website is cobalt |
| 10U Blue | #2563EB | #94a3b8 | ❌ Skyfire is blue, website is slate |
| 9U Boys | #DC2626 | #06b6d4 | ❌ Skyfire is red, website is cyan |
| 8U Boys | #EA580C | #f59e0b | ❌ Skyfire is orange, website is amber |

**Recommendation:** Align Skyfire team colors to the website values. The records page is the authoritative visual reference; parents and players have already associated those colors with each team. Requires a single SQL UPDATE on the teams table.

### Typography

**Primary font family (website):** Barlow + Barlow Condensed  
**Primary font family (Skyfire app):** Inter  

**Recommendation:** Either align app to Barlow to match, OR keep Inter (which is a valid modern choice) and document the intentional difference.

### Visual patterns worth stealing

From the records page (high-impact for Skyfire EventCard redesign):

1. **Team color left stripe** on every card (you already do this)
2. **Color-matched stat numerals** (e.g., "5-2" in team color)
3. **Tab-based team filtering** (cleaner than chip rows for many teams)
4. **Stat block grid**: big number + small label (PTS/GAME, ALLOWED, DIFF, WIN RATE)
5. **"Run of Play" narrative bullets** — short one-liners capturing the season arc
6. **Achievement badges**: "🏆 Champions · ✓ Nationals Qualified"
7. **Dark navy background** for hero sections or premium content
8. **Gold accent** for "Nationals Hotel Deadline", "Champions", high-urgency content

---

## PART 3: TEAM STRUCTURE & TAXONOMY

### Active teams (Spring 2026)

| # | Team | Grade | Circuit | Weekly Practice | Skills Lab Eligible |
|---|---|---|---|---|---|
| 1 | 11U Girls | 5th Grade Girls | AAU Circuit — Nationals Qualifier | Wed 6:30-8:00 PM @ WCC | ✓ Mon @ St. Patrick's |
| 2 | 10U Black | 4th Grade Boys | AAU Circuit — Nationals Qualifier | Wed 5:00-6:30 PM @ WCC | ✓ Mon @ St. Patrick's |
| 3 | 10U Blue | 4th Grade Boys | League Play | Tue 7:00-8:30 PM @ Rippowam | ✓ Mon @ St. Patrick's |
| 4 | 9U Boys | 3rd Grade Boys | League Play | Tue 6:00-7:30 PM @ Rippowam | ✗ (foundational) |
| 5 | 8U Boys | 2nd Grade Boys | AAU Circuit | Tue 5:30-7:00 PM @ Rippowam | ✗ (foundational) |

### Naming conventions (ENFORCED throughout Skyfire)

- **Correct:** "11U Girls", "10U Black", "8U Boys"
- **Wrong:** "Girls 11U", "Boys 8U" (LeagueApps format)
- **Ordering:** Oldest to youngest (11U Girls first, 8U Boys last)
- **Public terminology:** "League Play" not "CYO"

### Roster structure

- **Full Roster Player (Active Roster):** 10 max, travels to all games
- **Futures Academy (Practice Player):** Separate track, activates on call-up
- **Call-up triggers:**
  - AAU Tournaments: Notified Fri 2:00-3:00 PM if activated
  - League Play: Notified immediately after 24hr final RSVP deadline
  - Activation if active roster drops below 8

### Circuit types

- **AAU Circuit:** 5 regional tournaments per team (Chase for the Chain NY, NY Metro Showdown, Rumble for the Ring, Nationals/BB Shootout, NY Hoop Festival)
- **League Play:** Regional league with Sat/Sun games, 48hr RSVP notice, 24hr final lock

---

## PART 4: THE FIVE SPRING 2026 TOURNAMENTS

| # | Name | Dates | Status | Teams |
|---|---|---|---|---|
| 1 | ZG Chase for the Chain NY | Apr 11-12 | 🏆 Complete | 10U Black (Champions), 11U Girls (Champions), 8U Boys (Finalists) |
| 2 | NY Metro Showdown | Apr 18-19 | ✅ Complete | 11U Girls went 1-2 |
| 3 | Rumble for the Ring | May 16-17 | Upcoming | Fairfield, CT |
| 4 | Nationals / BB Shootout | May 29 - Jun 7 | Upcoming | 10U Black + 11U Girls qualified |
| 5 | NY Hoop Festival | Jun 13-14 | Upcoming (season finale) | All AAU teams |

---

## PART 5: VENUES (AUTHORITATIVE)

| Name | Address | Role | Team Usage |
|---|---|---|---|
| **St. Patrick's** | 29 Cox Ave, Armonk, NY | Skills Lab (Mondays) | 10U Blue, 10U Black, 11U Girls (optional) |
| **Rippowam Cisqua** | 439 Cantitoe St, Bedford, NY | Practice (Tuesdays) | 8U, 9U, 10U Blue |
| **Westchester CC** | 75 Grasslands Rd, Valhalla, NY | Practice (Wednesdays) | 10U Black, 11U Girls |

**Gym-level detail:**
- Rippowam: Wade's Gym + Trustees Gym (enter via Clinton Road)
- Westchester CC: Viking Gym (PEB Building), parking Lots 8, 9, 10
- St. Patrick's: St. Francis Hall

**Game venues:** Vary by tournament. Skyfire should surface venue detail including sub-location (court number, gym name) from LeagueApps data.

---

## PART 6: BUSINESS RULES

### RSVP deadlines (CRITICAL for Skyfire RSVP logic)

**AAU Tournaments:**
- Preliminary schedule: released Wednesday night
- Finalized schedule: Thursday afternoon
- **Parent RSVP deadline: Friday 12:00 PM (noon)**
- Futures Academy call-up notifications: Friday 2:00-3:00 PM

**League Play:**
- Full season pre-loaded
- **Advance notice: 48 hours before game**
- **Absolute final lock: 24 hours before game**
- Futures Academy call-up: Immediately after 24hr deadline

### Arrival protocols (distinct by event type)

- **Practice:** 5-Minute Rule (wait in car until 5 min before start)
- **Games:** 15-Minute Rule (in gym, dressed, shoes tied)

Late arrival to games = miss first rotation.

### The 24-Hour Rule

Parents must wait 24 hours after a game before messaging coaches about playing time. Documented in Academy Standards.

### Blackout dates (Spring 2026)

- March 30 - April 5: Spring Recess
- May 10: Mother's Day
- May 22-25: Memorial Day Weekend

### Payment model

- Season fee adjusts per team (custom-curated to competitive level)
- Full Roster fee ≠ Futures Academy fee (Academy significantly reduced)
- Fee covers: practices, tournament entry, league entry, gym insurance, player kit
- Fee does NOT cover: hotel for stay-to-play, spectator gate fees ($10-20/day AAU door fee)

---

## PART 7: ACADEMY OPERATIONAL STANDARDS

### The 90-minute practice structure (documented on Academy Standards page)

1. **Activation (15 min)** — Warm-up & mechanics, injury prevention
2. **Skill Lab (30 min)** — Ball handling, shooting mechanics, finishing packages
3. **Basketball IQ (15 min)** — Film room on feet: spacing, cutting, rotations
4. **Live Comp (30 min)** — Full-court 5v5 at game speed

**Skyfire implication:** Practice event detail could include these 4 phases as a sub-structure for coaches to plan against. Future feature.

### Code of Conduct excerpts (for potential in-app display)

**Players:**
- Arrive on time, fully dressed, prepared to compete
- Absolute respect for teammates, coaches, refs
- Play with intensity, unselfishness, integrity
- Body language matters on court AND bench

**Parents:**
- Cheer positively; no coaching from sidelines
- Respect officials and opposing families
- Don't approach the bench to discuss playing time at the game
- Trust the process, the timeline, the coaching staff

### The "Car Ride Home" principle

A documented guideline that the drive home is often the most stressful moment of youth sports. The recommendation: **"I loved watching you play today."** Nothing else. Let coaches handle film review at next practice.

**Skyfire opportunity:** This could become a post-game toast/reminder shown to parents when a game ends. Delight feature at the 95% bar.

---

## PART 8: RECORDS & ACHIEVEMENTS MODEL

### Achievement badges observed on records page

- 🏆 **Champions** (tournament won)
- ✓ **Nationals Qualified** (earned entry to ZG Nationals)
- 🥈 **Championship Finalists** (made finals, lost)
- ⚔ **Semi-Finals** (Winter playoff depth)
- 🔥 **Win Streak** (e.g., "W4", "W5")
- 🔒 **#1 Ranked Defense** or **#2 Ranked Defense**

### Records data structure (from records HTML)

For each team, per season:
- **Record:** W-L
- **Points per game** (offensive)
- **Points allowed per game** (defensive)
- **Point differential**
- **Win rate**
- **Games played**
- **Defensive rank** (league-wide)

Per-game data:
- **Date**
- **Opponent name**
- **Score (for-against)**
- **Result (W/L)**
- **Context flags** (playoff round, tournament bracket position)

Aggregated splits:
- **Offensive:** PPG, total points, single-game high/low, largest victory, games 30+
- **Defensive:** Allowed/game, total allowed, games held under 20, defense rank, avg diff
- **Run of Play:** Narrative bullet points ("5-game win streak", "Semi-Final exit", "2-0 vs ECS Black")

Head-to-Head:
- **Per opponent:** Games played, record, point differential

Standings (league context):
- **Division name** (Bronze, Gold, etc.)
- **12 or 10 teams listed** with W, L, PF, PA
- **Current team highlighted**
- **Playoff cutline marker**

### "Moments That Define the Legacy" — narrative feature

The records page highlights season narratives:
- "Both AAU Teams Made the Playoffs" (first-year achievement)
- "Top-2 Defense in the Entire League"
- "Statement Win of the Season" (specific game highlighted)
- "5-Game Win Streak"
- "Combined Point Differential"

**Skyfire opportunity:** Auto-generate these narrative bullets from game data. Biggest delight feature in the records space.

---

## PART 9: CONTENT MODEL — SCHEMA GAPS IN SKYFIRE

### What Skyfire has (good)

- teams, events, players, guardians, roster_members, event_rsvps, event_rides, event_duties, event_comments, locations, seasons

### What Skyfire is missing to align with legacyhoopers.org

**Tier 0 missing schema:**

1. **game_results table** — Attempted tonight per your screenshot (IMG_9634) and failed. Needs:
   - `id`, `event_id` (FK), `team_id` (FK), `opponent_name`, `home_away`, `team_score`, `opponent_score`, `result` (W/L/T), `played_at`, `notes`, `entered_by`, `entered_at`, `game_type` (regular/playoff/final)

2. **tournaments table** — Partially exists (tournament_id, tournament_name columns on events) but no first-class tournament model. Needs:
   - `id`, `org_id`, `name`, `start_date`, `end_date`, `location`, `tournament_type`, `circuit`, `status`

3. **team_achievements table** — For badges like "Nationals Qualified", "Champions":
   - `id`, `team_id`, `season_id`, `achievement_type`, `tournament_id`, `awarded_at`, `display_label`, `display_icon`

**Tier 1 missing:**

4. **team_season_stats** (computed view or materialized) — Per-team per-season aggregates: record, PPG, allowed, diff, defense rank

5. **opponents** — Canonical opponent list for head-to-head tracking

**Tier 2 missing:**

6. **divisions / standings** — For league context (Bronze division, Gold division)

### What Skyfire has that the website doesn't use

- Real-time RSVP per player
- Ride/carpool coordination
- Per-event volunteer duties
- Event comments thread
- Parent messaging (when shipped)
- Academy standards check-in / policy acknowledgment

**Insight:** Skyfire IS the operational layer that the website points parents toward ("App Action Required" repeated throughout website copy). The website is marketing + records; Skyfire is the daily operational tool. They should feel like the same brand.

---

## PART 10: COPY LIBRARY — LEGACY VOICE READY FOR REUSE

Phrases directly liftable into Skyfire empty states, CTAs, and confirmations:

**On dedication:**
- "Minutes are earned, not given."
- "Quality over quantity."

**On communication:**
- "No more Thursday night scrambles."
- "Real-time app communication."

**On expectations:**
- "Trust the process, the timeline, the coaching staff."
- "Hall of Fame standards."

**On the 24-hour rule:**
- "Coaches don't review playing time on game day. Send your message tomorrow."

**On game day:**
- "15 minutes before tip-off. Fully dressed. Shoes tied."

**On practice:**
- "5-Minute Rule: wait in your car."

**On failure/comeback:**
- "We were right there." (used on about page for Winter Playoff near-miss)

**Celebration:**
- "That's not a season start. That's a launch sequence."
- "Okay, everyone exhale."
- "Proud of these girls. Now go enjoy your Sunday night."

---

## PART 11: THE 95% APP OPPORTUNITY

Based on this crawl, here are 10 ways Skyfire can integrate Legacy Hoopers brand into the app to reach the 95% bar:

1. **Auto-badge teams on home + team page:** "✓ Nationals Qualified" with gold accent, matching the website's treatment
2. **Tournament archive view:** Completed tournaments show final record + championship badge, mirroring records page structure
3. **"Run of Play" narrative bullets:** Auto-generate from game data on team detail page
4. **Game result entry** (Quick Score feature) that propagates to records view automatically
5. **Winter 2025-26 archive:** Previous season accessible as "view history" on records tab
6. **Achievement timeline:** Per-team timeline of moments ("W4 streak", "Chase for Chain Champions", "Nationals Qualified")
7. **Arrival protocol reminder by event type:** Auto-show "5-Minute Rule" for practice, "15-Minute Rule" for games
8. **RSVP deadline countdown:** Urgent banner on tournament cards 48-24hr before Friday noon deadline
9. **Post-game "Car Ride Home" gentle reminder:** Delight feature, shown once per game to parents
10. **Academy Standards in-app handbook:** Policies accessible from Account page

---

## PART 12: DATA MIGRATION PLAN (OPERATIONAL)

### Current state (per your earlier SQL queries)

- Skyfire events table: 146 test events (currently)
- Real Spring 2026 events per CSV: 228 events
- Games with recorded scores on website: 16 (Winter) + ~13 (Spring so far) = ~29 results

### Recommended migration sequence

**Migration 1: Team color alignment (SQL, 5 min)**

```sql
-- Align team colors to legacyhoopers.org authoritative values
UPDATE teams SET team_color = '#a78bfa' WHERE name = '11U Girls';
UPDATE teams SET team_color = '#4a8fd4' WHERE name = '10U Black';
UPDATE teams SET team_color = '#94a3b8' WHERE name = '10U Blue';
UPDATE teams SET team_color = '#06b6d4' WHERE name = '9U Boys';
UPDATE teams SET team_color = '#f59e0b' WHERE name = '8U Boys';
```

**Migration 2: Import Spring 2026 events from CSV (SQL + CSV transform, 45-60 min)**

Strategy:
1. Transform CSV (LeagueApps names → Skyfire names, venue matching, time zones)
2. UPSERT into events based on (team_id, start_at, event_type) unique constraint
3. Preserve existing RSVPs / rides / duties if any test event matches real event
4. Delete orphaned test events that don't match real schedule

Requires careful team name + venue reconciliation. 45-60 min of SQL work with verification.

**Migration 3: Create game_results table + backfill (SQL, 30 min)**

Your earlier screenshot showed this attempt failing. Fix by:
1. Create `game_results` table with proper FK to events
2. Seed from records page data (manually enter 16 Winter + ~13 Spring games)
3. Add RLS policies consistent with events table
4. NOTIFY pgrst, 'reload schema'

**Migration 4: Tournaments first-class model (SQL, 30 min)**

1. Create `tournaments` table
2. Migrate existing `tournament_id` + `tournament_name` references into FK to new table
3. Seed 5 Spring 2026 tournaments with proper dates + locations

**Migration 5: Team achievements (SQL, 20 min)**

1. Create `team_achievements` table
2. Seed from records page (Champions, Nationals Qualified, etc.)
3. Build admin UI to award achievements (queued for later session)

---

## PART 13: PRIORITY FOR SKYFIRE BUILD

Based on this reference, revised Phase 1 priorities for parent experience to 95%:

**Session C candidates (high-impact, unlocks records feature):**
- Team color alignment (Migration 1) — 5 min, huge visual coherence win
- game_results table creation (Migration 3) — unlocks Quick Score + records view

**Session D candidates:**
- Spring 2026 schedule migration (Migration 2) — replaces test data with reality
- Tournament visual weight (EventCard redesign using website's card pattern)

**Session E candidates:**
- Achievement badges on team cards
- "Run of Play" narrative bullets

---

## APPENDIX: RAW CRAWL METADATA

Pages crawled (Apr 21, 2026, ~10:15 PM ET):
- /
- /calendar
- /records
- /locations
- /coachkenny
- /academy-standards
- /about

Pages not crawled (lower priority for brand model):
- /tryouts (registration form)
- /parent-handbook-faq

Supporting files:
- records-v14_2.html (uploaded, visual design reference)
- Spring_2026_Season-Schedule-04-21-26.csv (228 events, LeagueApps export)
