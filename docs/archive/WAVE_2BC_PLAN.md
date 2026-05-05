# Wave 2B-C — Coach Quick-Score Entry Sheet

**Status:** CLOSED 2026-05-03. All gates shipped. Gate 3 close-out commit this revision.
**Gate 1 SHA:** ee9a128 (substituted forward in next-wave commit per self-healing audit pattern)
**Decision references:** EMBER_MASTER_INDEX_v3.md #108 + #109
**Build queue entry:** SKYFIRE_BUILD_QUEUE_v2.md "May 1, 2026 UTC — Wave 2B-C Gate 1"

---

## LOCKED DECISIONS

**A — Entry sheet UX:**
Full-screen sheet slides UP over /events/:id event detail. Pattern matches CreateActivityWizard. Close button dismisses. Event detail context preserved underneath. Dirty-state guard: dismiss prompts "Discard changes?" if form has unsaved edits.

**B — Save behavior:**
Auto-save on field change with 500ms debounce. State machine: idle → dirty → saving → saved (200ms flash) → idle. Error state with backoff retry. First field change creates game_results row with published_at = NULL. Subsequent changes update the row. Coach explicitly taps "Publish" to set published_at = now().

Audit trail rule: game_result_edits rows fire ONLY when updating a row where published_at IS NOT NULL. Draft edits (pre-publish) generate NO audit rows. This prevents audit table bloat from keystroke-level draft writes.

**C — CSS namespace:** --em-* (rebrand 120/122 complete).

**D — Broadcast --sf-* orphan files (path c verified, outcome alpha):**
TournamentCard.jsx and broadcast.css use self-contained --sf-bc-* tokens scoped to .bc-root. Not broken. Cosmetic namespace consistency item (N13, P3, Wave 4 broadcast pass).

**E — Production-correct column names (FLAG 1 from pre-flight):**
events.event_type (NOT activity_type). game_results.our_score / opponent_score (NOT home_score / away_score). Org scoping: events.team_id → teams.org_id (no direct events.org_id).

**F — N14 captured but NO Wave 2B-C action needed:**
events.publish_status vs game_results.published_at naming collision is a documentation polish item; Wave 2B-C code is explicit about touching only game_results.published_at.

---

## FILE STRUCTURE — 4 NEW FILES + 1 EDIT

**NEW: src/components/scoring/ScoreEntrySheet.jsx (~140 lines target)**
- Lazy-loaded full-screen sheet
- Header with team color stripe + opponent name + date
- Form fields per Decision spec below
- Save state indicator (top-right): "Saved" / "Saving..." / "Error — retrying" / "Unsaved"
- Footer: "Publish" button (disabled while published_at set OR while no scores entered) + "Close" button (with dirty-state guard)
- 150-line cap respected; if exceeded, split QuarterScoreInput into separate file

**NEW: src/components/scoring/QuarterScoreInput.jsx (~80 lines)**
- 4 quarter inputs: Q1, Q2, Q3, Q4
- Each is a pair of inputType="number" inputs with inputMode="numeric" pattern="[0-9]*" (Decision 26 mobile numeric keyboard)
- Auto-derives our_score and opponent_score from sum of quarters when all 4 quarters entered (write-through to parent state)
- Optional: leave quarters blank, fill our_score / opponent_score directly (final-score-only mode)

**NEW: src/hooks/useScoreDraft.js (~120 lines)**
- State machine: idle, dirty, saving, saved, error
- Debounced upsert (500ms)
- Optimistic local state, server-side write deferred by debounce
- Audit trail logic: read row's published_at BEFORE write; if NOT NULL, also INSERT to game_result_edits with field diff in fields_changed JSONB and prior_values JSONB
- Returns: { result, save, publish, state, lastSaved, error }

**NEW: src/components/scoring/PlayerOfGamePicker.jsx (~70 lines)**
- Compact roster picker filtered to event.team_id roster
- Tappable list of players (name + jersey # if available)
- Single-select; tap-again-to-clear
- Optional field; can publish without POG selected

**EDIT: src/pages/EventDetailPage.jsx**
- Add "Enter Score" button gated to: isStaff(role) AND event.event_type IN ('game', 'tournament') AND event.start_at < now() (only past games scoreable)
- Button opens ScoreEntrySheet via state lift + lazy-import + Suspense (same pattern as CreateActivityWizard)
- If a published game_results row already exists for this event, button label is "Edit Score" (not "Enter Score")
- Estimated +20 lines on EventDetailPage.jsx; verify file stays ≤150 lines after edit

---

## FORM FIELDS PER IA MAP DECISIONS

**Decision 4 (POG):** PlayerOfGamePicker, optional, single-select.
**Decision 5 (coach_highlight):** textarea, 140-char hard cap (DB CHECK + UI counter), optional. Placeholder: "One line for parents — what stood out?"
**Decision 16 (auto-derive result):** IF our_score > opponent_score → result = 'W'; IF our_score < opponent_score → result = 'L'; IF our_score = opponent_score → result = 'T'; IF either NULL → result = NULL. Auto-computed in useScoreDraft on score change.
**Decision 17 (override hidden):** no manual result override field.
**Decision 26 (mobile numeric inputs):** all score inputs use type="number" inputMode="numeric" pattern="[0-9]*" enterkeyhint="next"
**Decision 27 (opponent pre-fill):** opponent name is read-only, populated from events.opponent at sheet mount. No edit field in score sheet.

---

## STATE MACHINE — useScoreDraft

**State shape:**
```
{
  result: { our_score, opponent_score, quarter_scores,
            player_of_game_id, coach_highlight, result,
            point_differential, published_at, ...id, event_id },
  state: 'idle' | 'dirty' | 'saving' | 'saved' | 'error',
  lastSaved: timestamp | null,
  error: Error | null
}
```

**Transitions:**

Mount: Fetch existing game_results row by event_id. If exists: load into result, state=idle. If absent: empty shell, state=idle. No INSERT at mount.

Field change: Update local result immediately (optimistic). state → dirty. Reset debounce timer to 500ms.

Debounce fires: state → saving. Capture priorPublishedAt. If result.id exists: UPDATE. Else: INSERT RETURNING * and store id. On success: if priorPublishedAt IS NOT NULL → INSERT game_result_edits with diff. state → saved, lastSaved = now(). After 200ms → idle. On error: state → error. Retry with exponential backoff (1s, 2s, 4s, 8s, cap 16s; abandon after 5 attempts).

Publish: UPDATE SET published_at = now(), published_by = auth.uid(). No audit row for publish itself. state → saved → idle. Refresh /records cache.

Unmount: If dirty → force-flush pending save. If saving → let complete in background.

---

## DESIGN TOKENS — --em-* namespace

ScoreEntrySheet header: background var(--em-bg-page), team color stripe 4px solid {team.team_color} (DB inline). Form labels: var(--em-text-primary), 14px, weight 500. Input borders: var(--em-border-default). Input focus: var(--em-accent). Save indicator: saved var(--em-success), saving var(--em-text-secondary), error var(--em-danger). Publish button: var(--em-accent) bg, var(--em-text-inverse) text, 44px min-height. Close button: ghost, var(--em-text-secondary).

---

## GATE STRUCTURE

**Gate 1 — Docs commit:** Decision #108 + #109 + N13 + N14 + M4 + self-healing substitution + this plan file.

**Gate 2a — Hook (no UI yet):** src/hooks/useScoreDraft.js. Hook can be imported and called. No UI integration.

**Gate 2b — Sheet + form scaffolding:** ScoreEntrySheet.jsx (skeleton), QuarterScoreInput.jsx, PlayerOfGamePicker.jsx. Wired to useScoreDraft. Lazy-import in EventDetailPage but no button yet.

**Gate 2c — EventDetailPage button + full integration:** Enter Score / Edit Score button gated to staff + past game/tournament. Sheet reachable from production. Visual smoke test before push. Rule 19 explicit GO before push.

**Gate 3 — Close-out:** NEXT ACTION QUEUED update, tracker close, build queue entry. **SHIPPED 2026-05-03.**

Each gate gets explicit GO. Each commit gets M3 verification step pre-stage.

---

## GATE LOG

| Gate | SHA | Date | What |
|------|-----|------|------|
| 1 | ee9a128 | 2026-05-01 | Docs commit (Decision #108, #109, plan file) |
| 2a | (within 5d635d5 session) | 2026-05-01 | useScoreDraft hook |
| 2b | (within 0a1948d session) | 2026-05-01 | ScoreEntrySheet + QuarterScoreInput + PlayerOfGamePicker |
| 2c | 0a1948d | 2026-05-01 | Enter Score button on EventDetailPage + useEventDelete extraction |
| 3 | (this commit) | 2026-05-03 | Close-out docs. Smoke test confirmed 2026-05-03. |

---

## FILE LINE-COUNT BUDGETS

ScoreEntrySheet.jsx: target 140, max 150.
QuarterScoreInput.jsx: target 80, max 150.
useScoreDraft.js: target 120, max 150.
PlayerOfGamePicker.jsx: target 70, max 150.
EventDetailPage.jsx: current + ~20; verify final ≤150.
