# Adding briefing templates

Wave 3.16 shipped the template registry + `TemplatePicker` UI. This
doc explains how Frank (or any future admin) can backfill a
hand-written template from a Squarespace export, GitHub gist, or
prior email into the picker.

## File location + naming

Per-kind template files live in `src/lib/engine/templates/`:

| Kind | File |
|---|---|
| weekly_digest | weeklyDigestTemplates.js |
| game_recap | gameRecapTemplates.js |
| tournament_prelim | tournamentPrelimTemplates.js |
| tournament_recap | tournamentRecapTemplates.js |
| rsvp_nudge | rsvpNudgeTemplates.js |
| announcement | announcementTemplates.js |
| custom_message | customMessageTemplates.js |

`schedule_change` has no template file (auto-generated from the
event diff). `rsvp_nudge` shipped (`rsvpNudgeTemplates.js`) — no
longer stubbed.

**Kinds with a body editor but no template file yet:** `games_recap`
(`GamesRecapBody`), `coach_roundup` (`CoachRoundupBody`), and
`family_guide` (`FamilyGuideBody`) are live kinds (in
`RESOLVER_REGISTRY` + `KIND_METADATA` + production `kind_check`) but
have no starter-template file under `src/lib/engine/templates/`. Add
one following the pattern below when starters are authored.

Each file exports a default array of template objects:

```js
export default [
  {
    id: 'kebab-case-unique-within-file',
    name: 'Display name in the picker',
    description: 'One-line description shown under the name',
    body: {
      // EXACT shape consumed by the corresponding body editor
      // — see "Field shape contract" below
    },
    preview_summary: 'Optional short label for future preview UIs',
  },
];
```

## Field shape contract

Each body editor declares its `defaultValue` shape. Templates must
populate keys that exist on that shape — extra keys are silently
ignored when the picker dispatches `UPDATE_BODY`.

| Kind | Body fields |
|---|---|
| weekly_digest | `body_notes`, `ops_notes` |
| game_recap | `score: { ours, theirs }`, `our_highlights`, `opp_highlights`, `player_of_game_name`, `coach_note` |
| tournament_prelim | `hotel_block`, `sat_notes`, `sun_notes`, `opponent_scouting`, `lineup_notes` |
| tournament_recap | `standout_moments`, `coach_reflection`, `coach_note`, `parent_shoutout` (placement — record + point differential — and per-game results auto-render via the `placement_block` + `game_log` renderers from DB; they were removed from the editor) |
| rsvp_nudge | `headline_override`, `custom_message`, `ask_comment_field` |
| announcement | `headline`, `body_text` |
| custom_message | `subject`, `body_text` |

If your hand-written template has richer structure than the editor
accepts (e.g., 4-stat blocks, urgent CTAs, countdowns), inline that
structure into the available text fields and document the gap with
a `TODO(future-wave):` comment at the top of the template file.
Body-editor extensions ship in a future wave.

## Step-by-step backfill

1. Open the kind file (e.g. `tournamentRecapTemplates.js`)
2. Append a new object to the default array
3. Match the field shape exactly (refer to the table above or the
   editor's `defaultValue` export)
4. `npm run dev`
5. `/admin/briefings` → tap Compose → pick the kind
6. Verify the new template appears in the picker with its
   description
7. Select it → confirm the body editor fields populate with your
   content
8. Type-test: edit a field after selecting → the edit sticks; the
   `activeTemplateId` does not auto-clear
9. `npm test` — the registry test verifies every template's body
   keys are a subset of the editor's field shape
10. Commit + ship as a content-only PR

## Anti-pattern reminder #26

If a template references DB enums (RSVP status values, team colors,
venue ids, kind names), verify the value via Supabase MCP
`execute_sql` before hardcoding. Display labels and DB values are
NOT interchangeable.

Wave 3.14/3.15 shipped a silent miscount because the spec said
`'out'` for the third RSVP bucket but production stores
`'not_going'`. Verify once, hardcode right.

## Frank's hand-written templates queue

Track which Squarespace exports have been ported and which remain.

| Source export | Target kind | Status |
|---|---|---|
| 11U Girls weekend wrap-up | tournament_recap | ✓ seeded as `tr-weekend-wrapup-champs` |
| 11U Girls week-ahead | tournament_prelim | PENDING |
| 9U Boys doubleheader program card | game_recap | PENDING |
| 9U Boys week-ahead | tournament_prelim | PENDING |
| 10U Blue gameday | game_recap | PENDING |
| 10U Blue week-ahead | tournament_prelim | PENDING |
| 10U Black weekend wrap-up | tournament_recap | PENDING |
| 8U Boys weekend wrap-up | tournament_recap | PENDING |
| 8U Boys day1 recap + Sunday preview | tournament_recap | PENDING |
| (2 more not yet exported) | TBD | PENDING |
