# Design Review Notes — LeagueApps Incumbent Tour

> **Purpose:** Frank is uploading 54 screenshots of the **LeagueApps incumbent**
> (`manager.leagueapps.com`) — the platform Ember is migrating *off* and competing
> *against*. These are NOT Ember screenshots. The review captures (a) feature/parity
> surface area Ember must match or deliberately drop, and (b) the complexity Ember
> must avoid (§16 elite principles + the "simple, not a 4-hour-training onboarding"
> goal). Synthesis is **held until all 54 are in** — observations captured per batch,
> mapped against audit findings + design doctrine only at the end.
>
> **Progress:** 30 / 54 captured (through Batch 6).
> **Status:** AWAITING remaining batches. No synthesis yet.
>
> ⚠️ **Recovery note:** this file was reconstructed after the running copy failed to
> persist to disk across context summarization (verified missing via filesystem search).
> Now committed + pushed each batch so it can't be lost again.

---

## Batch 1 (1–5 / 54)

- Source confirmed: **LeagueApps incumbent** (`manager.leagueapps.com`), not Ember.
  This is the competitor / migration-source, framing the whole review.

## Batches 2 & 3 (6–15 / 54) — Navigation + program creation

- **Full nav menus:** Calendar, Reporting, Website/CMS, Integrations, Settings.
- **Create Program dropdown:** League / Event / Tournament / Camp / Club team / Class.
- **Column customizer** on list views.
- **Grouped program** create flow.
- *Theme:* broad surface area, admin-heavy IA — many top-level destinations.

## Batch 4 (16–20 / 54) — Create Club Team form internals

- **Gender:** Any / Co-Ed / Male / Female
- **Level:** Novice / Intermediate / Advanced
- **Season:** Spring / Summer / Fall / Winter
- **Program Logistics:** start/end dates with visible + tentative flags, location, status
- **Program status lifecycle:** Unpublished / Upcoming / Live / Completed
- **Sponsor / Host** fields
- *Theme:* dense single-form config; many fields per program.

## Batch 5 (21–25 / 54, ~halfway) — Registration config + integrations

- **Registration config:** start/end dates, password gate, status state-machine:
  Opens Soon / Open / Sold Out / Limited Spots / Accepting Waitlist / Free Agents
- **Rich-text program description**
- **Days-of-week multi-select**
- **Integration marketplace:** Chubb (insurance), Ankored (age-verification/compliance),
  Yardstik (background checks), TeamGenius, Coach Packet, Lucid Travel, Google Sheets
- *Theme:* compliance/insurance/background-check integrations = youth-sports table stakes
  (cross-ref Wave 3.B #27 compliance arc — COPPA/SafeSport gaps).

## Batch 6 (26–30 / 54) — Multi-tenant model + operating structure ⭐ architecturally key

- **Multi-site switcher** ("+ Add a site") = LeagueApps' multi-tenant model: **org = site**.
  (Direct parallel to Ember's multi-tenant readiness arc / Wave 3.B #28.)
- **Season → Age Groups** operating structure:
  - Spring 2026 Season = a **"Grouped Master"** with per-age-group sub-programs
    (11U Girls, 10U Boys Black/Blue, 9U/8U Boys)
  - Each sub-program carries its own registration state (e.g. Sold Out), schedule,
    roster, staff, teams, and invoices.
  - **Scale shown: 22 teams / 123 registrations / $70,332.97.**
- *Theme:* season-as-grouped-master with age-group children is the incumbent's core
  data model — compare against Ember's seasons/programs/teams schema.

---

## CSV data drop — multisport schema implications (Frank-provided, not synthesis)

Six CSVs + README dropped into `docs/external-data/` as schema reference (LeagueApps
export shapes). **Only the redacted enrollment schema + README are committed; the rest
are git-ignored local-only (PII / pending opt-in) — see `docs/external-data/.gitignore`.**

File map:
1. `spa_winter_schedule_25-26.csv` — 284 CYO games; import shape for League Play schedules
2. `jersey_player_roster.csv` — 196 players w/ sizes + numbers; uniforms table shape ⚠️ minor names
3. `enrollment_field_schema_redacted.csv` — 31 fields, types, PII flags (✅ committed)
4. `enrollment_field_schema.csv` — same + real values (names/emails/addresses) ⛔ NEVER commit
5. `jersey_size_summary.csv` / `shorts_size_summary.csv` — size-distribution pivots (enum sizing)

**Three multisport-build constraints the data already proves:**
- **Sizes are per-season-per-sport, not per-player.** Jersey/shorts size belongs in
  `player_equipment(player_id, season_id, sport_id, ...)`. Multisport breaks the
  one-size-per-player assumption. (Cross-ref §11.5: sizes currently live on
  `roster_members` — this is the multisport evolution of that.)
- **League schedule imports carry no `org_id` and no home/away flag.** Importer scopes
  to the importing org; derives home/away from `Location` matching the program's home venue.
- **`Jersey #` is unique per division, not per org.** Constraint must be
  `UNIQUE(org_id, team_id, season_id, jersey_number)`.

---

## Running themes (provisional — not synthesis)

1. **Complexity to avoid:** very wide IA, dense multi-field forms, many status
   state-machines. Ember's differentiator is simplicity (no 4-hr admin training).
2. **Parity surface to match:** registration state-machine, grouped-season →
   age-group structure, multi-site (multi-tenant) switching.
3. **Compliance integrations** (insurance, background checks, age verification) are
   incumbent table stakes — ties to Wave 3.B #27.
4. **Multi-tenant (org = site)** is first-class in the incumbent — informs the parked
   multi-tenant readiness arc (Wave 3.B #28), which stays last per §17.7/§17.8.
