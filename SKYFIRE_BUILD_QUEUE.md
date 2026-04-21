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
