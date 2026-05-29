# LEGACY HOOPERS — Brand & Content Reference Model

*Source of truth synthesized from legacyhoopers.org crawl (Apr 21, 2026), records-v14_2.html visual system, and Spring 2026 schedule CSV. Intended as the authoritative reference for Ember's visual, copy, and data-model alignment with the Legacy Hoopers brand.*

*Reconciled against production 2026-05-29 (D3 audit). The original document was a pre-build design-chat input; many "gaps" and "migration plans" below have since shipped. Stale sections have been relabeled as completed/historical; only genuine remaining gaps are flagged.*

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

### Brand voice rules for Ember copy

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
matched pair — per-org Ember branding must recognize both:

- **Knight crest** — shield/helmet mascot mark. In-repo assets under
  `public/`: `knight-logo-240.png` (240px), `knight logo 2048.png`
  (2048px source), and `Knight_logo.webp` (web-optimized). Additional
  brand assets present: `legacy hoopers logo 2048.png` (wordmark
  source), `phoenix.webp`, `apple-touch-icon.png`, `favicon.png`.
- **Legacy Hoopers wordmark** — the text-based logo used on the
  marketing site header, records page, and official documents
  (`legacy hoopers logo 2048.png` in `public/`).

**Correction note:** the `knight logo 2048.png` commit (`44e4741`)
flagged the asset as "assumed St. Patrick's — VERIFY." That assumption
was wrong. The knight crest is a Legacy Hoopers mark. St. Patrick's is
no longer a hypothetical "future program" — it is now an active second
tenant track (see `EMBER_TENANCY_ARCHITECTURE_v3`); its own brand marks
are managed under that tenancy model, not as future scope.

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

### Team color palette (ALIGNED — verified 2026-05-29)

**Team colors are already aligned to the authoritative records-page values.** `src/lib/constants.js` `TEAM_COLORS` and the production `teams.team_color` column match each other and the website records page exactly (verified via Supabase MCP). No migration needed; the earlier mismatch finding is obsolete.

| Team | Hex (constants.js == DB) |
|---|---|
| 11U Girls | #a78bfa (light violet) |
| 10U Black | #4a8fd4 (brand cobalt) |
| 10U Blue | #94a3b8 (slate grey) |
| 9U Boys | #06b6d4 (cyan) |
| 8U Boys | #f59e0b (amber) |

### Typography

**Primary font family (website):** Barlow + Barlow Condensed  
**Primary font family (Ember app):** Inter  

**Resolved:** Inter is the locked app typeface (a valid modern choice); the Barlow/Inter split between marketing site and app is intentional, not drift.

### Visual patterns worth stealing

From the records page (high-impact for Ember EventCard redesign):

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

### Naming conventions (ENFORCED throughout Ember)

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

**Game venues:** Vary by tournament. Ember should surface venue detail including sub-location (court number, gym name) from LeagueApps data.

---

## PART 6: BUSINESS RULES

### RSVP deadlines (CRITICAL for Ember RSVP logic)

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

**Ember implication:** Practice event detail could include these 4 phases as a sub-structure for coaches to plan against. Future feature.

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

**Ember opportunity:** This could become a post-game toast/reminder shown to parents when a game ends. Delight feature at the 95% bar.

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

**Ember opportunity:** Auto-generate these narrative bullets from game data. Biggest delight feature in the records space.

---

## PART 9: CONTENT MODEL — SCHEMA STATUS IN EMBER

### What Ember has (good)

- teams, events, players, guardians, roster_members, event_rsvps, event_rides, event_duties, event_comments, locations, seasons

### Shipped since this doc was written (verified in production 2026-05-29)

The schema items flagged below as "Tier 0 / Tier 1 missing" have all shipped:

1. **game_results table** — ✅ SHIPPED. Live columns: `id`, `event_id` (FK), `our_score`, `opponent_score`, `result`, `quarter_scores`, `point_differential`, `player_of_game_id`, `coach_highlight`, `entered_by`, `entered_at`, `published_at`, `published_by`, `private_notes`, `has_player_stats`. (Score is keyed via `event_id` → `events.team_id`, not a direct `team_id` FK.) 51 game_results live for Spring 2026.

2. **tournaments table** — ✅ SHIPPED. First-class table, org-scoped. 8 tournaments live for the org.

3. **team_achievements table** — ✅ SHIPPED. Badge model for "Nationals Qualified", "Champions", etc.

4. **opponents table** — ✅ SHIPPED. Canonical opponent list for head-to-head tracking.

### Genuine remaining schema gaps

The following are the only items from the original list NOT yet in production:

- **team_season_stats** (computed view or materialized) — Per-team per-season aggregates: record, PPG, allowed, diff, defense rank. (Records page currently computes these client-side; no DB-level rollup.)
- **divisions / standings** — For league context (Bronze division, Gold division).

### What Ember has that the website doesn't use

- Real-time RSVP per player
- Ride/carpool coordination
- Per-event volunteer duties
- Event comments thread
- Parent messaging (when shipped)
- Academy standards check-in / policy acknowledgment

**Insight:** Ember IS the operational layer that the website points parents toward ("App Action Required" repeated throughout website copy). The website is marketing + records; Ember is the daily operational tool. They should feel like the same brand.

---

## PART 10: COPY LIBRARY — LEGACY VOICE READY FOR REUSE

Phrases directly liftable into Ember empty states, CTAs, and confirmations:

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

Based on this crawl, here are 10 ways Ember can integrate Legacy Hoopers brand into the app to reach the 95% bar:

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

## PART 12: DATA MIGRATION PLAN (HISTORICAL — COMPLETED)

> This section was a pre-build sprint plan. The migrations below have all
> executed; production now carries live Spring 2026 data (158 events, 51
> game_results, 8 tournaments — verified 2026-05-29). Retained as a
> historical record of how the schema/data reached its current state.

### Current state (verified in production 2026-05-29)

- Ember events table: 158 events live for the org (test data replaced with real Spring 2026 schedule)
- game_results: 51 live for Spring 2026
- tournaments: 8 live for the org

### Migration sequence — outcome

**Migration 1: Team color alignment — ✅ DONE (no longer needed).** Team colors are already aligned across `constants.js` and `teams.team_color`; see PART 2. No SQL UPDATE outstanding.

**Migration 2: Import Spring 2026 events from CSV — ✅ DONE.** Test events replaced with the real Spring 2026 schedule (158 events live), reconciled to Ember team names + venues.

**Migration 3: Create game_results table + backfill — ✅ DONE.** `game_results` table live with FK to events, RLS consistent with events, and 51 results backfilled/entered for Spring 2026.

**Migration 4: Tournaments first-class model — ✅ DONE.** `tournaments` table live and org-scoped (8 tournaments).

**Migration 5: Team achievements — ✅ DONE.** `team_achievements` table live for badges (Champions, Nationals Qualified, etc.).

---

## PART 13: BUILD PRIORITY (HISTORICAL — EXECUTED)

> The pre-build priority plan below executed. All Session C/D/E candidates
> shipped (team color alignment, game_results, schedule migration,
> EventCard/records redesign, achievement badges, Run-of-Play narratives).
> Retained as historical context, not an active sprint plan. The only
> remaining open items are the schema gaps in PART 9 (team_season_stats,
> divisions/standings).

**Session C candidates (high-impact, unlocks records feature):** ✅ DONE
- Team color alignment — already aligned (see PART 2)
- game_results table creation — shipped (unlocked Quick Score + records view)

**Session D candidates:** ✅ DONE
- Spring 2026 schedule migration — shipped (real data replaces test data)
- Tournament visual weight (EventCard / records redesign) — shipped

**Session E candidates:** ✅ DONE
- Achievement badges on team cards — shipped
- "Run of Play" narrative bullets — shipped

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
