# External CYO Data — Ember Multitenant Multisport Reference

Source workbooks (provided by St Pats / SPA Catholic Youth basketball league, season 2024-25 and 2025-26 Winter). Captured here as CSV so Claude Code can ingest without xlsx parsing.

## Files

| File | Source sheet | Rows | What it represents |
|---|---|---|---|
| `spa_winter_schedule_25-26.csv` | SPA_Winter_2025-2026.xlsx → SPA Winter Schedule 25-26 | 284 | Full CYO league schedule. One row per game. Cross-program (all member parishes). |
| `jersey_player_roster.csv` | St Pats Jersey 24-25 → Summary (formula) | 196 | One row per enrolled player with jersey/shorts size and jersey number. |
| `jersey_size_summary.csv` | Jersey Summary pivot | 11 | Size distribution pivot, jerseys. |
| `shorts_size_summary.csv` | Shorts Summary pivot | 11 | Size distribution pivot, shorts. |
| `enrollment_field_schema.csv` | Enrollment_Details (Edited) | 31 | Field list with sample values. **Contains PII. Do not commit to public repo.** |
| `enrollment_field_schema_redacted.csv` | derived | 31 | Field list with inferred type + PII flag, no real values. Safe to commit. |

## Schema implications for Ember

### `spa_winter_schedule_25-26.csv` → `league_play_games` table
Columns map cleanly to the `Schedule` model the architecture already anticipates, but note:
- `Boy-Girl` + `Grade` = the league's division key, not Ember's `team_id`. Need a `division` lookup or computed field per `org_id`.
- `Team` is the program-owned team name; `Team 1` and `Team 2` are the matchup, where one of them = `Team`. No explicit home/away flag — the convention appears to be `Location` = home parish, so home/away is derivable but should be stored explicitly on import.
- `Game` (e.g. `P6`, `P37`) is the league's scheduling system ID, not Ember's. Treat as `external_game_id`.
- This is an **import format**, not Ember's canonical shape. The data has no concept of `org_id`, so the importer scopes everything to the importing org. Visiting teams stay as free-text until or unless the league federates.

### `jersey_player_roster.csv` → `player_uniforms` table
- `Division Name` is `{grade} Grade {gender}` text. In Ember this is `team_id` (resolved via lookup) under the org.
- `Jersey #` is per-division, not org-wide. Constraint: `UNIQUE(org_id, team_id, jersey_number)` in active season. Number reuse across divisions is normal (see `2`, `3`, `4` repeating).
- Size fields are free-text in source (`Youth-Small`, `Youth Small`, `Adult-Small`). Normalize to an enum on import — there's at least one whitespace typo in row 5.
- `Jersey Check` column is blank in source = there's no QC state. Ember should add an explicit status enum (`ordered`, `issued`, `returned`).

### Enrollment fields → registration form schema
The redacted schema CSV is the design artifact. Highlights:
- **Multi-sport relevance**: every field is sport-agnostic except `Jersey Size` / `Shorts Size`. For multisport, move size fields out of the player registration record and into a `player_equipment` per-season-per-sport table.
- Several fields are entirely empty (allergies, school, CCD agreement) — they exist on the form but nobody fills them. Ember can either drop or make non-blocking optional.
- `Team Name` is single-value (`Unallocated`) — placement happens post-registration via a separate workflow. Don't tie team assignment to the registration record.
- `OrderItem Amount Paid` varies, suggesting fee tiers (resident/non-resident, family pass, playoff add-on). Architecture should expect a line-item fee model, not a single price field.

## PII notice
`enrollment_field_schema.csv` includes real sample values (names, emails, phones, addresses, birth dates). Keep it out of the public repo. Use the `_redacted` version for any code that gets committed.
