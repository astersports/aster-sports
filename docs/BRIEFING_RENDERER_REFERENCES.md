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
`27 days of work. Time to show it.`

### Voicey prose closer (free-text variant)
```
Saturday is a 2-hour break between games. Casa Bianca Pizza is 5 minutes from the
gym. 669 Main St, Ansonia. You are welcome.

Sunday is an 8 AM tip in Shelton, then a potential championship back in Ansonia
at 5 PM. That is an 8-hour window. You could technically fly to Florida and
back. [continues...]
```

---

## Engine wave checklist (when implementing)

When the engine renderer wave kicks off, each renderer should be validated against
these three production samples. The atomic-test rubric:

- [ ] Renderer 1 (universal header) produces the cobalt band exactly per all 3 samples
- [ ] Renderer 3 (game card) handles "Court X only" vs "Venue | Court X" addressing
- [ ] Renderer 4 (day-grouped) supports the `| Ansonia` venue suffix variant
- [ ] Renderer 5 (RSVP callout) substitutes the coach first name correctly
- [ ] Renderer 6 (venue list) supports single-with-address, single-without, and multi
- [ ] Renderer 8 (bonus variant) renders the gray BONUS overline + accent footnote
- [ ] Renderer 9 (championship scenarios) handles SEMI + ★ Championship combo and ★-only
- [ ] Renderer 10 (logistics) substitutes `<N> minutes` and jersey side dynamically
- [ ] Renderer 11 (tagline footer) is a free-text override per briefing
- [ ] Renderer 12 (prose closer) is opt-in, free-text, raw paragraphs

A future PR adds these as fixture-driven snapshot tests when the renderer wave
ships.
