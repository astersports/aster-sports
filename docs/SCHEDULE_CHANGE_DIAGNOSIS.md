# Schedule_change UX diagnosis

**Wave 3.5 §C2 — diagnosis only, no fix.** Per spec D6: "the diagnostic step,
not a UX rebuild." Full UX rebuild ships as wave 3.6 if needed.

## Reported symptom

Frank moved a Wednesday practice to Friday (or similar date/time change on a
recurring event). The change appeared to save in the wizard, but parents
saw the original Wednesday time in their views. The schedule_change
notification kind was never queued.

## Save flow trace

Entry point: **`src/pages/EventDetailPage.jsx`** mounts
`<CreateActivityWizard editEvent={event} editMode={editMode} />` when admin
taps Edit.

For events with `parent_event_id !== null` (recurring instance), the user
first hits a `ConfirmDialog` with two choices (lines 129–131):

```jsx
<ConfirmDialog title="Edit recurring event"
  message="Edit all future events in this series, or just this one?"
  confirmLabel="All future"  cancelLabel="This one only"
  onConfirm={() => { setEditMode('series'); setEditing(true); }}
  onCancel={()  => { setEditMode('single'); setEditing(true); }} />
```

- **"This one only"** → `editMode='single'` → wizard saves via `update()`
- **"All future"**  → `editMode='series'` → wizard saves via `updateSeries()`

Wizard (`src/components/wizard/CreateActivityWizard.jsx:59`) routes:

```js
result = editMode === 'series'
  ? await updateSeries(editEvent.id, editEvent.parent_event_id,
                        editEvent.start_at, form)
  : await update(editEvent.id, form);
```

## Hypothesis — root cause

`src/hooks/useUpdateActivity.js:82-103` (`updateSeries`):

```js
const row = buildRow(formData);
delete row.start_at; delete row.end_at;        // ← LOAD-BEARING
const seriesId = parentEventId || eventId;
await supabase.from('events').update(row).eq('id', seriesId).gte('start_at', startAt);
await supabase.from('events').update(row).eq('parent_event_id', seriesId).gte('start_at', startAt);
```

The `delete row.start_at; delete row.end_at` lines are deliberate (the
inline comment at line 81 says: "Excludes date/time so each instance keeps
its own schedule; only location, notes, duties, toggles etc. propagate").

Intent: bulk-edit non-time fields (location swap, jersey color, etc.)
without nuking each weekly instance's distinct date.

Side effect: **date/time changes in series mode silently no-op.** The
wizard accepts the new date, the SAVE button glows green, the request
succeeds, but `start_at`/`end_at` are stripped from the UPDATE payload
before it hits the DB.

Single-mode `update()` at line 43 includes `buildRow(formData)` whole
without the delete — date/time changes WILL persist when admin picks
"This one only".

If Frank picked "All future" intending to shift the whole series to a
new day-of-week, the change wouldn't save. The dialog copy doesn't
disambiguate that "all future" means "all future date/times stay; only
shared metadata propagates" — easy to read it as "all future events
move to the new date."

## Secondary observation — no schedule_change comms_messages dispatch

Even when single-mode `update()` does persist date/time, no
`schedule_change` notification fires. The `comms_messages.kind` enum
includes `schedule_change` (per CLAUDE.md §13.8) and
`inferMessageType.js` lists it as a manual-override kind, but no code
path queues one when an event's `start_at` mutates.

Audit:

```bash
$ grep -rn "schedule_change" src/ supabase/
src/lib/constants.js:76:  { value: 'schedule_change',          label: 'Schedule change' },
src/lib/inferMessageType.js:41:    schedule_change:          'Schedule Change',
src/components/tournament/tabs/MessagesTab.jsx:45:    schedule_change: 'Schedule Change',
```

Three files reference the kind label. **Zero files queue or dispatch
a `schedule_change` message.** The kind exists in the schema CHECK
constraint and label maps but has no producer.

## Recommended fix scope (NOT this wave)

Wave 3.6 candidate, three layers:

1. **Wizard UX disambiguation.** Replace the two-choice ConfirmDialog
   with three options when the change includes a date/time delta:
   - "Move this event only" (single-mode update with date/time)
   - "Move this and all future" (NEW: series-mode that DOES propagate
     date/time, keeping the day-of-week pattern intact via offset math)
   - "Update settings on all future, keep dates" (current series-mode
     behavior — useful for location/jersey swaps)

2. **Schedule_change dispatch.** When `update()` or any new series
   variant changes `start_at`/`end_at`/`location`/`location_id` on an
   event with `>= 1 RSVP`, queue a `schedule_change` comms_message
   targeted at the affected guardians. Reuses the engine wave-2
   renderers (header + game_card/weekly_schedule + signoff) — no new
   renderers needed.

3. **Audit log surfacing.** The `event_rsvp_audit` table from CLAUDE.md
   §16.8 ("Audit log visibility") doesn't yet exist for event mutations.
   When schedule_change fires, write a row to a new `event_change_audit`
   table with `before_start_at` / `after_start_at` / `actor_user_id`
   / `affected_rsvp_count`. Surface in EventDetailPage as a timestamped
   "[Override · Coach Frank · 4:47 PM]" line.

Estimated wave 3.6 size: ~6-8 hours. Schema migration + wizard refactor
+ engine wiring + dispatcher + audit table + tests + UX walkthrough.

## What this wave does NOT change

Per spec D6: zero code changes to the schedule edit flow in this PR. The
two-line `delete row.start_at; delete row.end_at` ships as-is. Frank can
work around in the meantime by picking "This one only" for date/time
changes — that path persists correctly.
