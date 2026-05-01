# Wave 1G — P0 Privacy Fix: Parent-Scoped RLS

**Status:** In progress (Gate 1 docs commit this revision).
**Decision:** EMBER_MASTER_INDEX_v3.md #110
**Trigger:** Cross-profile screenshot audit (BUG-03) confirmed P0 privacy boundary failure.
**Wave 2B-C:** Paused at Gate 2b (3defbaa). Resumes after Wave 1G closes.

---

## Bug

Three tables share the same broken RLS pattern:
- `event_rsvps` (event_rsvps_org_all)
- `event_comments` (event_comments_org_all)
- `event_duties` (event_duties_org_all)

All three: cmd='ALL', qual=event_org_matches(event_id), with_check=NULL.

Any authenticated org member can INSERT/UPDATE/DELETE any row for any event in their org. Parents can RSVP for other families' children, edit other parents' comments, and claim other parents' duty slots.

Data audit pre-migration: 0 cross-family violations across all three tables.

## Fix

Migration drops 3 broken policies, creates `current_user_guardian_id()` helper, creates 6 new policies:

| Table | Parent policy | Staff policy |
|---|---|---|
| event_rsvps | write_own_child: player_id = ANY(current_user_player_ids()), FOR ALL | write_staff: staff in org via user_has_role_in_org, FOR ALL |
| event_comments | write_own: author_user_id = auth.uid(), FOR ALL | write_staff: staff in org, FOR ALL |
| event_duties | claim_release: guardian_id IS NULL OR = current_user_guardian_id(), FOR UPDATE | write_staff: staff in org, FOR ALL |

Existing SELECT policies on all three tables are unchanged.

## Gate structure

**Gate 1:** Docs commit (Decision #110, M5, P0-01/P1-01 tracker, this plan)
**Gate 2:** Migration apply via Supabase MCP + post-flight verification + repo file
**Gate 3:** UI scope check (icon render gating) + close-out

Each gate: explicit GO. M3 verified per commit.

## UI scope check (Gate 3)

After RLS is fixed, parent UI still shows RSVP/comment/duty affordances for non-own rows. Taps would fail silently. Fix: gate render to own-row-only for parents.

- EventRsvpTab: RSVP icons render only when isStaff OR player is own child
- EventCommentsTab: edit/delete only when isStaff OR author_user_id === user.id
- EventDutiesTab: claim button only when isStaff OR (guardian_id IS NULL OR guardian_id === myGuardianId)

## Deferred

Wave 1H: ~16 remaining cmd='ALL' policies on staff-gated tables. P1-01 in tracker. Not P0.
