# AAU Backbone — Public RPC Contract

> **Purpose.** The AAU hub (astersports-web) and future tenants read the backbone ONLY
> through the public RPCs catalogued here. This doc is the durable, versioned record of
> their shapes. **Field names are FROZEN from their first entry** — additions are additive
> (new nullable fields / new RPCs), never renames or removals. Opened 2026-06-27 at the
> first real version bump (search v1 → v2) per the architect review.
>
> **Rules:** Plane A (public) only — every RPC is gated by `org_is_public_listed`; no PII,
> child, or money fields ever cross this boundary. A value renders only from real data
> (`basis` gate); never fabricate a rating/record/projection/live tick. Any change that a
> consumer reads is L99 (architect → Frank → owner applies).

---

## search — team/tournament/division discovery

### `search_public_teams(p_query text) -> jsonb`  — **v1, DEPRECATED-NOT-REMOVED**
Flat, teams-only array. **Retained** as the fallback for v2; do not extend.
```
[{ teamKey, name, tournamentId, tournamentName, startDate, endDate,
   divisionId, divisionName, gradeLabel, gender }]
```

### `search_public_aau(p_query text) -> jsonb`  — **v2 (current)** · migration `20260627160550`
Typed sections. `teams` are **FLAT variant rows** (no nested program object in the
contract); the client renders program nesting from the `programGroup` hint.
```
{
  teams: [{
    teamKey,            // AUTHORITATIVE stable identity (resolved_key)
    name,               // display_name
    programGroup,       // NON-AUTHORITATIVE hint (nullable). Presentation-only; conservative
                        //   split on " - " / " — ". Never written, never affects tracking/keys.
                        //   Superseded zero-debt by the future `programs` entity (§2.E follow-up).
    tournamentId, tournamentName,
    divisionId, divisionName,
    gender, gradeLabel, tier, day,         // §2.A taxonomy (nullable where a real blank)
    record: { w, l },                       // from division_games finals
    rating,                                 // null unless basis; SAME formula+source as
                                            //   get_public_tournament_standings (no PATTERN A)
    basis,                                  // boolean: rating has real games behind it (gp>0)
    isLive                                  // team has a division_game status='live'
  }],
  tournaments: [{ tournamentId, name, circuit, startDate, endDate, divisionCount, isLive }],
  divisions:   [{ divisionId, label, tournamentName, teamCount }]   // label = gender · grade · tier
}
```
**Frozen field names:** as listed above (2026-06-27). New value fields (when added) are
additive nullable keys on the variant/section objects; never rename these.

---

## live — front-door strip

### `get_public_live_now(p_limit integer default 12) -> jsonb`  — **v1 (current)** · migration `20260627160550`
Currently-live public games. The realtime **tick** is TECH-1 (deferred); this is the
on-load read.
```
[{ gameId, startAt, homeName, awayName, homeScore, awayScore, divisionLabel, tournamentName }]
```

---

## directory / browse (existing — render-gated, unchanged)

### `get_public_tournament_directory() -> jsonb`
```
[{ id, name, circuit, start_date, end_date,
   divisions: [{ id, name, grade_label, gender, advance_count, team_count }] }]
```
Browse grouping (circuit → season → year) is derived client-side from `circuit` + dates.
*Phase 2 (A4, deferred):* `get_public_division_browse(filters)` for division-level filter chips.

## schedule / standings / ingest (existing — unchanged)
- `get_public_aau_team_schedule(p_team_ids text[]) -> jsonb` — tracked-team schedule (Team Detail).
- `get_public_tournament_standings(p_division_id uuid) -> jsonb` — division standings + ratings
  (the authoritative rating source `search_public_aau` mirrors).
- `get_aau_ingest_status(p_id uuid) -> jsonb` — `{ status, tournamentId, tournamentName,
  divisionCount, error }`. Submit via the `aau-submit-tournament` edge function.

---

### Change log
- **2026-06-27** — Opened. search v1 (`search_public_teams`) → v2 (`search_public_aau`,
  typed + program-grouped + valued + tier/day); added `get_public_live_now`. All additive;
  v1 retained. Architect-approved (A1+A2+A3+A5), Frank L99, owner-applied (migration
  `20260627160550`). A4 (`get_public_division_browse`) deferred to phase 2.
