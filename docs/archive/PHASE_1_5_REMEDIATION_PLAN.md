# Phase 1.5 Remediation Plan
**Authored:** April 27, 2026
**Audit basis:** `audit/AUDIT_SYNTHESIS_2026_04_27.md`
**Branch state at authoring:** main at `f1e5387`

This plan ships Phase 1.5 to production confidence. Each tier has explicit acceptance criteria.

---

## Tier 1 — Critical (ships today)

### Ship 7.1 — Security lockdown
**Files:** SQL migration only (applied via Supabase MCP)
**Severity:** P0 SEC
**Closes:** B2 (anon-callable SECURITY DEFINER functions), B3 (ride_claims_insert too restrictive)
**Time:** 20 min

REVOKE EXECUTE on ~28 SECURITY DEFINER functions for `anon` role. Tighten ride_claims_insert WITH CHECK to permit rider self-insert.

**Acceptance:** Re-running Supabase security advisor returns 0 critical findings on rides functions. Parents can still claim via RPC (no regression). Phone test: claim a seat, no error.

### Ship 7.2 — Schema drift fix
**Files:** SQL migration via MCP + 1-line code change in `EventRidesTab.jsx` (via CC on v2)
**Severity:** P0
**Closes:** B1 (dead toggle column)
**Time:** 30 min

1. Backfill: `UPDATE events SET enable_rides=true WHERE id IN (SELECT DISTINCT event_id FROM event_ride_offers UNION SELECT DISTINCT event_id FROM event_ride_claims)` plus all events where `ride_coordination_enabled=true AND event_type IN ('game','tournament')`.
2. Update `get_event_ride_state` RPC to read `enable_rides`.
3. Drop `ride_coordination_enabled` column.
4. Code: change `EventRidesTab.jsx:23` to read `enable_rides`.

**Acceptance:** Toggle "off" in Edit Event hides rides tab. Toggle "on" shows it. Phone-tested both directions.

### Ship 7.3 — Claim form clarity
**Files:** `ClaimSeatForm.jsx` (via CC on v2)
**Severity:** P1 UX
**Closes:** B5 (pickup_address confusion)
**Time:** 25 min

Rename "Pickup address (optional)" → "Need door-to-door pickup? (optional)". Rename "Pickup notes (optional)" → "Anything the driver should know? (optional)". Add helper microcopy explaining when to use each.

**Acceptance:** Frank reads the form once and the intent is unambiguous. Phone-tested.

---

## Tier 2 — Spec authoring (no ships, doc work — synthesis sessions)

### Ship 7.4 — `RIDES_SPEC.md`

Locked contract for the rides feature. Future ships test against it. Sections:
- Field semantics per ride_type (round_trip / arrival_only / return_only)
- Role permission matrix (driver / rider / admin / coach actions)
- Lifecycle states (offer: active/cancelled; claim: pending/confirmed/cancelled/declined/waitlisted)
- Edge cases (last seat race, cascade cancel, waitlist promotion, multi-day events)
- Notification triggers (queued to event_notifications, dispatcher Phase 6)

### Ship 7.5 — `STATE_OF_AFFAIRS_L99_v4.md`

Updated canonical state doc. Captures all Phase 1.5 ships, schema fixes, security lockdown, deferred items.

---

## Tier 3 — Polish (timeline: weeks, not days)

### Ship 7.6 — Multi-kid claim (B4)
Schema change: claims gain `for_child_ids uuid[]` (array, replaces single `for_child_id`). UI shows multi-select when seats > 1. Migrate existing data via wrapper subselect. ~90 min.

### Ship 7.7 — RLS performance optimization (B9)
Wrap all `auth.uid()` calls in `(select auth.uid())` across affected RLS policies. Mechanical migration. Closes ~50 advisor warnings. ~60 min.

### Ship 7.8 — Auth flash fix (B7)
Add `loading` gate to EventRidesTab top-level render. Skeleton instead of momentary "wrong content" during AuthContext rehydration. ~20 min.

### Ship 7.9 — Notes field expansion (B8)
Schema: `pickup_notes` + `return_notes` separate columns. UI shows both fields when ride_type='round_trip'. ~30 min.

### Ship 7.10 — Migration parity recovery
Add `034_rides_offer_cancel_cascade_recovered.sql` to local `supabase/migrations/` matching the trigger applied via MCP. ~10 min.

---

## Deferred (NOT in Phase 1.5)

| Item | Reason |
|------|--------|
| Phase D.3 driver approve/decline | Original scope, valid for Phase 2 |
| Cross-tenant isolation test | Defer until St. Patrick's CYO joins (2027) |
| iOS Safari datetime-local quirks | Defer until parent pilot feedback |
| event_notifications dispatcher | Phase 6+ as planned |
| REPLICA IDENTITY verification | Defer to Phase 6 prod readiness |
| Performance: unindexed FKs, unused indexes | Defer to Phase 6 scale work |
| Phantom Phase D.3 acting-as architecture | KILLED — non-bug per audit H1 |

---

## Acceptance gate to call Phase 1.5 "shipped"

All Tier 1 ships landed on main + phone-tested green. Tier 2 docs committed. Tier 3 captured as parking lot in build queue.

Then Phase 2 (coach portal) starts fresh on v2.
