# RIDES FEATURE AUDIT — Synthesis
**Date:** April 27, 2026 (afternoon)
**Branch state:** main at `f1e5387` (Phase D.2 Ship 5 merged — 3-day production rides bug killed earlier today)
**Methodology:** Source code read via uploaded `rides-audit-source.zip` (108KB, 79 files, 5,994 LOC) + live Supabase MCP queries (schema, RLS, advisors)
**Author:** Synthesis written by audit auditor, not CC. CC code-grep audit step skipped because direct source read produced equivalent value in 30 minutes.

This document supersedes all conversation memory about the rides feature. Future sessions trust this over priors.

---

## TL;DR — Five headline findings

**H1 — "Acting-as" is not a coded feature.** AuthContext exposes a single `role` field from `user_roles` table. There is no `actingAsRole`, no `viewAsParent`, no `switchRole`. When Frank tested as parent he was signing OUT of admin@legacyhoopers.org and signing INTO fsamaritano@gmail.com — both accounts ARE Frank Samaritano. This kills approximately 15 hours of phantom Phase D.3 work.

**H2 — Schema drift confirmed at code level.** Two columns on events table: `enable_rides` (default false, written by wizard) and `ride_coordination_enabled` (default true, read by EventRidesTab). They are NEVER connected anywhere in the codebase. The "Enable rides" toggle in admin Edit Event is dead UI.

**H3 — 28 SECURITY DEFINER functions callable by `anon` role.** Including `claim_ride_offer`, `cancel_ride_claim`, `promote_next_waitlist_claim`, `current_user_org_id`, `user_has_role_in_org`, plus all `trg_*` ride trigger functions. An unauthenticated attacker can hit `/rest/v1/rpc/...` and bypass RLS. Live in production.

**H4 — `ride_claims_insert` RLS allows admin only.** Parents claim seats only via the SECURITY DEFINER RPC bypass. Direct table inserts break parents. Brittle.

**H5 — Realtime subscriptions clean up properly.** `useRideOffers` and `useRideClaims` both call `supabase.removeChannel(channel)` in cleanup. No memory leak. CONFIRMED CLEAN.

---

## Section 1: Schema drift evidence

| File | Line | Action | Column |
|------|-----:|--------|--------|
| `src/components/wizard/StepDetails.jsx` | 80 | UI Toggle binds to `data.enableRides` | (form state) |
| `src/components/wizard/wizardForm.js` | 12 | EMPTY_FORM has `enableRides: false` | (form state) |
| `src/components/wizard/wizardForm.js` | 43 | `eventToForm` reads `event.enable_rides` | enable_rides |
| `src/hooks/useCreateActivity.js` | 29 | INSERT writes `enable_rides: formData.enableRides` | enable_rides |
| `src/hooks/useUpdateActivity.js` | 34 | UPDATE writes `enable_rides: formData.enableRides` | enable_rides |
| `src/components/event/EventRidesTab.jsx` | 23 | Render gate reads `event?.ride_coordination_enabled !== false` | ride_coordination_enabled |
| `supabase/migrations/032_rides_lifecycle_and_realtime.sql` | 33, 42 | `get_event_ride_state` RPC reads `ride_coordination_enabled` | ride_coordination_enabled |

**Migration history:**
- Migration 004 (`schedule_extensions.sql`) added `enable_rides boolean DEFAULT false NOT NULL`
- Migration 025 (`rides_redesign.sql`) added `ride_coordination_enabled boolean DEFAULT true`

**Net effect:** Wizard toggle correctly writes `enable_rides`. Rides UI reads `ride_coordination_enabled` (always true unless explicitly set false, which nothing in code does). Toggle is functionally disconnected.

**Live data confirmation (run April 27):** All 5 spring 2026 practices have `enable_rides=false, ride_coordination_enabled=true`. Tournaments have both true. Practices SHOULD have rides off (per toggle state) but rides controls render anyway because the wrong column gates UI.

---

## Section 2: Security findings (Supabase advisors)

### S1 (P0): Public Can Execute SECURITY DEFINER Function

28 functions exposed to `anon` role via PostgREST. Sample list:

- `public.claim_ride_offer(uuid, uuid, integer, text, text, boolean)`
- `public.cancel_ride_claim(uuid, text)`
- `public.promote_next_waitlist_claim(uuid)`
- `public.current_user_org_id()`
- `public.current_user_guardian_id()`
- `public.current_user_player_ids()`
- `public.current_user_child_team_ids()`
- `public.current_user_staff_team_ids()`
- `public.current_user_teammate_player_ids()`
- `public.user_has_role_in_org(uuid, text[])`
- `public.event_org_matches(uuid)`
- `public.get_event_ride_state(uuid)`
- `public.notify_team_of_event_change(...)`
- `public.trg_event_cancelled()`, `public.trg_event_comment_posted()`, `public.trg_event_inserted()`, `public.trg_event_relocated()`, `public.trg_event_rescheduled()`
- `public.trg_ride_claim_status_change()`, `public.trg_ride_offer_cancelled_cascade()`
- `public.user_roles_create_preferences()`

These are all SECURITY DEFINER (bypass RLS by design for legitimate workflows) but `anon` role should not be able to invoke them. Authenticated callers reaching these RPCs is fine; anon is not.

**Remediation:** REVOKE EXECUTE FROM anon. Triggers (`trg_*`) should also REVOKE EXECUTE FROM PUBLIC since they are only called by trigger machinery.

### S2 (P1): ride_claims_insert RLS too restrictive

```sql
-- Current ride_claims_insert WITH CHECK clause
user_has_role_in_org(org_id, ARRAY['admin'::text])
```

Parents (and coaches) cannot directly INSERT into event_ride_claims. They work today via `claim_ride_offer` RPC because it's SECURITY DEFINER. Any future code that tries direct insert breaks parents silently. Should permit `rider_user_id = auth.uid() AND org_id IN (user's orgs)`.

---

## Section 3: Performance findings (Supabase advisors)

| Lint | Count | Severity | Disposition |
|------|------:|----------|-------------|
| `auth_rls_initplan` (calls `auth.uid()` per row instead of once) | ~50 | WARN | Tier 3 — wraps RLS calls in `(select auth.uid())` |
| `multiple_permissive_policies` | ~50 | WARN | Tier 3 — consolidate where possible |
| `unindexed_foreign_keys` | ~50 | INFO | Defer — irrelevant at 5-team pilot scale |
| `unused_index` | ~30 | INFO | Defer — review at Phase 6 scale |
| `duplicate_index` (tournament_message_recipients) | 2 | WARN | Tier 3 — cheap drop |
| `auth_db_connections_absolute` | 1 | INFO | Defer to Phase 6 prod readiness |

---

## Section 4: Bug catalog (final, post-audit)

### Non-bugs (mistaken reports)

| Reported as | Verdict | Why |
|-------------|---------|-----|
| Acting-as parent → phone defaults to admin's phone | NON-BUG | Both accounts are Frank Samaritano. Both have his phone in their respective guardian records. Correct behavior. |
| Acting-as parent → name shows "Frank S" | NON-BUG | Parent account `0b81b465-225e-4ede-b752-ed9a2dde1f7c` IS Frank Samaritano. Correct. |
| 1 rider for Charlie shows but no child selected | NON-BUG | `ClaimSeatForm.jsx:18-22`: when offer.team_id matches only 1 of user's children, picker is hidden and child auto-set. Locked spec ("Q3: child auto-fill if 1 kid"). |

### Real bugs (remediation queue)

| ID | Bug | Severity | Code location | Fix |
|----|-----|----------|---------------|-----|
| B1 | Schema drift: dead toggle column | P0 | EventRidesTab.jsx:23 + migration 025 + migration 032 RPC | Ship 7.2 |
| B2 | 28 SECURITY DEFINER functions exposed to anon | P0 SEC | DB functions | Ship 7.1 |
| B3 | ride_claims_insert RLS admin-only | P1 SEC | DB policy | Ship 7.1 |
| B4 | Multi-seat claim with 1 child picker | P1 UX | ClaimSeatForm.jsx + schema | Ship 7.6 |
| B5 | pickup_address conceptually confusing | P1 UX | ClaimSeatForm.jsx labels | Ship 7.3 |
| B6 | Density chip — needs phone re-test | P1 UX | (Ship 6.2 already shipped) | Verify only |
| B7 | Auth flash on parent transition | P2 UX | AuthContext loadMembership race | Ship 7.8 |
| B8 | Single notes field for round-trip claims | P2 UX | ClaimSeatForm + schema | Defer |
| B9 | RLS policies don't use `(select auth.uid())` optimization | P2 PERF | All RLS policies | Ship 7.7 |

---

## Section 5: Realtime + cleanup audit

### Subscription cleanup — CONFIRMED CLEAN

Both `useRideOffers.js` (line 39-46) and `useRideClaims.js` (line 39-50) follow the correct pattern:

```js
useEffect(() => {
  if (!eventId) return undefined;
  const channel = supabase.channel(...).on('postgres_changes', ...).subscribe();
  return () => { supabase.removeChannel(channel); };
}, [eventId, fetchOffers]);
```

No leak. No re-subscription on every render. Confirmed clean.

### REPLICA IDENTITY — NEEDS VERIFICATION

Migration 032 publishes rides tables to Realtime but REPLICA IDENTITY has not been verified. If DEFAULT (only PK on UPDATE), some downstream UPDATE handlers may receive incomplete payloads. Defer to Tier 3 or Phase 1.5 polish.

---

## Section 6: Architecture observations

### Form state shape (PostOfferForm)

128 lines. Reads `eventStartAt` + `eventEndAt` props for smart defaults. Smart defaults persist in state across `ride_type` changes (Ship 5 confirmed isRoundTrip-gated payload but state retention itself is by-design React state). Phone autopop falls back to `coaching_assignments` (Ship 5).

### Hook contract — useRideOffers / useRideClaims

Both hooks accept positional `eventId` arg, read `useAuth()` internally for user/orgId. Optimistic UI with rollback. Confirmed pattern on every mutation.

### useEventRidesView (Ship 6.1)

Clean composition layer. 65 lines. No issues.

### Migration parity

Local `supabase/migrations/` has 33 files (001-033). The `rides_offer_cancel_cascade` migration applied via Supabase MCP earlier today does NOT have a corresponding local file — it lives only in prod migration history. Future drift risk if local repo is treated as canonical.

**Disposition:** Add it as `034_rides_offer_cancel_cascade_recovered.sql` during Tier 3 work. Low priority.

---

## Section 7: What was NOT audited (deferred scope)

Honest disclosure of scope:

- iOS Safari datetime-local quirks (defer until parent feedback)
- Cross-tenant isolation explicit test (defer until 2nd org joins)
- All form state lifecycle on close-reopen edge cases
- Console/error-swallowing patterns in non-rides code
- Bundle size + Lucide tree-shaking
- Service worker / PWA install / offline behavior
- Storage policies (no file uploads in rides feature)
- Email/push notification dispatcher (Phase 6)

These are real audit categories but out of scope for Phase 1.5. Captured in Phase 6 prep doc when we get there.

---

**End of audit.**
