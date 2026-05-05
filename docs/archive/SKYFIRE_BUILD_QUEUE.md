# SKYFIRE BUILD QUEUE

Living queue of deferred work. Tier 0 blockers live in `CLAUDE.md §8`;
this file tracks Tier 2 follow-ups that are not pilot-blocking but
should land before feature expansion in those areas.

---

## Tier 2: PostgREST FK schema-cache audit

Root cause discovered Session 5: `event_rsvps.player_id → players.id` FK
isn't in PostgREST's schema cache, causing nested selects like
`players(first_name)` to silently return zero rows. Other implicit
joins in the codebase may have the same failure mode.

### Action

1. Grep the codebase for every `.select('...(...)'` nested selection.
2. Cross-reference each implicit join against the Supabase dashboard's
   FK definitions.
3. For any missing FK: add via SQL, then `NOTIFY pgrst, 'reload schema'`
   (the same pattern already used in `supabase/migrations/`).

### Priority

Not blocking today — existing nested selects may be working fine, but
any new feature that writes one is a landmine until this audit closes.

### Estimate

1–2 hours.

### Workaround in the meantime

Use the two-query pattern from `src/hooks/useEventRsvpNotes.js` —
fetch the base rows, collect `foreign_ids`, then `.in('id', ids)` on
the related table and merge client-side.

---

## Tier 0: Schema-cache auto-refresh on migrations

Discovered Session 5 (April 21, 2026) and re-confirmed Session A:
PostgREST schema cache goes stale every time a migration adds columns
or FKs. Three occurrences this week:

1. event_rsvps.player_id → players FK (Session 5): nested select
   returned 0 rows silently
2. tournament_name column on events table: wizard save failed with
   "Could not find column" error
3. Whatever broke the schedule page tournament filter earlier

Fix: standardize on ending every migration with:

  NOTIFY pgrst, 'reload schema';

Action:
1. Grep every existing migration file for column/FK additions
2. Audit each for missing NOTIFY statement
3. Write a one-line SQL template for future migrations
4. Document in CLAUDE.md that migrations MUST include the NOTIFY line

Priority: Tier 0 — will block features silently until fixed.
Estimated: 1 hour for audit + fix + doc update.

---

## Tier 2: Schedule page quality sweep (Session B candidate)

Discovered Session A review. P0 bugs on the schedule page:

1. "Practicein 23h" typography bug (missing space)
2. Middot separator without whitespace ("6:30 PM· Practice")
3. Missing Maybe count on CompactCard + EventCard RSVP rows
4. Title === type redundancy (title "Practice" shown below type row "Practice")
5. ChildRsvp compact mode strips too much structure
   ("CharlieGoingMaybeNot Going" no spacing)
6. "See full schedule (30more)" missing space
7. RSVP count format inconsistent across NextUpCard / EventCard /
   CompactCard (three different patterns for same data)

All are string/layout bugs. Ship in a single session by:
- Extracting shared RsvpCountRow component
- Fixing string concatenation with proper separators
- Auditing ChildRsvp.jsx compact mode

Priority: P0 for parent quality, not blocking pilot.
Estimated: 90 min single session.
