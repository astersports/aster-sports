# Fix-PR Execution Tracker — Open P0/P1 Burndown

> **Purpose:** the single routable burndown of every open audit-surfaced fix-PR. Per
> §17.7 step 5 / §17.8, **the multi-program (second-tenant) build phase opens only after all
> P0+P1 fix-PRs land.** This consolidates the 6 §17.5 audit docs + Cat#30 + Doc-Corpus into
> Tier 1–4 arcs so "clear the backlog" is one surface, not six docs. Complements
> `EMBER_PENDING_LEDGER.md` §4.0 (which remains the canonical pending index).
> **Last updated:** 2026-05-29. Status: ☐ open · ◐ partial · ☑ shipped.

## Gate logic
Multi-program build is **GATED CLOSED** until Tier 1–2 P0+P1 land. Tier 1 = literal second-tenant
blockers (the business goal: St. Patrick's as tenant #2). Tier 4 is design-call-gated (not counted
against the gate until specced).

## ☑ Shipped this arc (closed — for reference)
- Wave 1 DB-security P0s (#558–#562); Wave 2.A token-handler (#566/#567); Wave 2.B quick wins (#570/#571); Wave 2.C reportError foundation (#573).
- **Cat#30 home/financial**: payment-scope (#578), placement renderer (#579), batch 1 5 fixes (#581), batch 2 owing-source cluster + AP #63 (#582).
- Notification dispatcher #19 P0-1 (#576) — **shipped but dormant** (pilot mode, 0 pilot families).
- Doc-Corpus L99 D1–D8: doctrine/ledger/brand/ops fixes (#586/#587) + 27-doc archive (#588).

---

## TIER 1 — second-tenant / cutover blockers (gate the multi-program build)

### Arc 1A · Multi-tenant readiness (Wave 3.B #28 — 5 P0) ☐
> **UNPARKED 2026-05-29** — the design review landed (`EMBER_PROGRAM_SETUP_SPEC_v2.md`, the build
> source-of-truth). P0-1 IS the spec's **missing migration #0** (the spec §2.1 wrongly assumed
> `user_roles` already supported multi-org — production has `UNIQUE(user_id)`; see ledger §4.BB).
> Build order = P0-1 first, then the spec's §4.5 migration sequence (programs/divisions/registrations/…).
- ☐ **P0-1 IDENTITY (longest pole):** `user_roles` `UNIQUE(user_id)`→`UNIQUE(user_id, org_id)` + AuthContext org-aware resolution (`.maybeSingle()` trap) + org-switcher + ~5 edge fns + autoLinkGuardian. *Gates the second tenant AND the design chat's #1 P0 (one login → all kids).* Scoped plan ready.
- ☐ **P0-3 email plumbing** — `loadOrgEmailContext(orgId)` from existing `organization_settings`; sweep ~13 hardcoded `@legacyhoopers.org` files. *Low-risk, no design call.*
- ☐ **P0-5 unsubscribe-handler** per-org branding.
- ☐ **P0-4 `public_listing_enabled`** default → false. *Trivial migration.*
- ☐ **P0-2 admin onboarding** — `invite-admin` (generalize `invite-parent`).
- *Recommended order: P0-4 + P0-3/P0-5 (low-risk, no auth) → P0-1 unit → P0-2.*

### Arc 1B · Compliance (Wave 3.B #27 — 3 P0) ☐ **[content/legal-gated on Frank]**
- ☐ Privacy policy + ToS published. ☐ Guardian consent ledger (`guardian_consents`). ☐ Data-subject deletion path. *COPPA — all players <13; hard GA/second-tenant gate.*

### Arc 1C · DR-readiness (Wave 3.B #25 — 3 P0) ☐
- ☐ `docs/DISASTER_RECOVERY.md` runbook. ☐ One-time restore-to-staging drill. ☐ Materialize the 5 §5 ghost migrations as `.sql` files.

### Arc 1D · Data integrity (Wave 3.B #10 — 2 P0) ☐
- ☐ 5 live RLS policies → route through `current_user_*()` helpers. ☐ Alignment-trigger reciprocity (or refactor `useSeasonRollover` to write via team_players).

---

## TIER 2 — user-visible perf/UX (gate the build per §17.8)

### Arc 2A · Wave 2.B perf ◐
- ☐ **Home LCP ~5s** (the §17.1 anchor, 3.3× budget) — bundle reduction: lazy `qrcode.react`, Vite `manualChunks`, delete 1.77 MB orphan PNGs, CI gate split.
- ☐ Cache layer (SWR vs TanStack vs custom dedup) — **design call**.
- ☐ Virtualization (`react-window`) — MessageThread 200 msgs, FamilyBalanceList 164 rows.

### Arc 2B · Wave 2.C observability ◐
- ☐ Admin views: `pii_audit_log`, `event_change_audit`, `event_reminder_log`, Resend bounce surface, cron-health card.
- ☐ RealtimeContext (closes 3 P1 across 7 hook callsites). ☐ `reportError` sweep (~100 console.error sites; helper exists).

### Arc 2C · Wave 3.A notification pipeline ◐
- ☐ #19 P0-3 repoint admin toggles → `organization_settings` + gate Stream A in `_reminders.ts`. ☐ #19 P0-2 schema-leak microcopy in `AutoNotificationSettingsSheet`. ☐ cron HTTP-health (`net._http_response.status_code`).

### Arc 2D · Cat#30 Batch 3 latents ☐
- ☐ ROSTER-3 (academy badge canonical col — needs team_players join in useRoster). ☐ HOME-5 (never-paid in overdue alert — needs `family_balances` view age column). ☐ HOME-4/HOME-6 (netting parity, currency format). ☐ SCORE-1 (records season scope — do with rollover) / SCORE-3/4/6. ☐ ENGINE-2 (null-score guard + DB CHECK). ☐ shorts_size consumer.

---

## TIER 3 — doctrine / admin observability (largely closed)
- ☑ Doctrine reconciliation (Doc-Corpus #586). ☐ `reportError` sweep continuation (overlaps 2B). ☐ Wave 3.A cron canonical-source switch (overlaps 2C).

## TIER 4 — design-call-gated (NOT counted against gate until specced)
- ☐ Wave 2.A `team_feed_token` rotation surface. ☐ `send-tournament-message` per-admin rate cap. ☐ Onboarding rebuild (invitations vs auth.users path — overlaps 1A P0-2). ☐ `coach_payouts` pipeline build spec (flat-fee vs session+bonus).

---

## Burndown + recommended sequence
- **Open P0 arcs:** 1A (5), 1B (3), 1C (3), 1D (2) + 2C carryover = the gate-critical set.
- **Recommended:** **Tier 1A (identity) + 1B (compliance) first** — the two true second-tenant gates; 1B starts the moment Frank gives the legal/content stance. Then 2A (home LCP — the user-visible perf anchor). Then 1C/1D + the Tier-2 remainder. Tier-4 stays parked until the design spec lands.
- **The design spec (in-flight, claude.ai) is the upstream input** for the registration/multi-tenant build; it reshapes 1A's parent-side scope. Fix backlog clears in parallel.
- **When Tier 1–2 P0+P1 land → §17.8 gate opens → multi-program build.**

---

## Multi-program build — PR sequence (from EMBER_PROGRAM_SETUP_SPEC_v2 + reviewer audit, 2026-05-29)

Design review landed + mockup locked (`EMBER_PROGRAM_SETUP_MOCKUP_v2.html`). Build order below.
**Every migration: pre-flight `SELECT` + post-flight `DO $$` verify, applied via Supabase MCP with an
explicit GO per migration (spec sign-off gate — no migration runs without Frank's GO).**

### Schema PRs
- ◐ **PR 0 — Migration #0: IDENTITY FOUNDATION** (the spec's missing prerequisite; §2.1 wrongly
  assumed it was done). ☑ `user_roles` `UNIQUE(user_id)`→`UNIQUE(user_id, organization_id)` (applied,
  version 20260529153604, mirror committed) + ☑ AuthContext multi-row-safe resolution (killed the
  `.maybeSingle()` trap) + ☑ invariant test. **Follow-on (deferred — no multi-org user exists until
  St Pat's):** ☐ org-switcher UI + Family Home routing (spec §2.3, lands with the Family Home UI PR);
  ☐ ~5 edge-fn/autoLinkGuardian org-awareness sweep (before St Pat's onboards). Migration foundation
  is live + backward-compatible.
- ☑ **PR 1 — Migration #1: `programs` table + `program_type` ENUM** (spec §4.5 step 1). Applied
  (version 20260529155321, mirror committed). 6-value enum (`season/tryout/camp/clinic/interest_list/
  evaluation`; v1 UI exposes 3). `programs` column set is a **superset of `seasons`** (so PR 2 backfill +
  PR 3 compat view are clean); RLS mirrors `seasons` (4 policies; parent SELECT via `current_user_org_ids()`
  deferred to migration #12). Advisors clean. Ledger §4.BE.
- ☑ **Migration #1a — `sports` table + `programs.sport_id` FK** (Frank-directed; fills the §4.5 gap
  where the spec diagram has `sports` as parent of `programs` but the 12-migration list omitted it).
  Applied (version 20260529155952). Minimal shape (id/org_id/name); seeds LH **Basketball**; FK added
  (`programs` empty → instant); RLS mirrors seasons. `sport_id` stays nullable (NOT NULL tightening
  with the registration build). Ledger §4.BF.
- ☑ **PR 2 — Migration #2: backfill `programs` from `seasons`** (spec §4.5 step 2). Applied
  (version 20260529160011). 3 season rows mirrored (Fall 2025 / Winter 2025-26 / Spring 2026),
  `program_type='season'`, `sport_id`=LH Basketball; **`seasons.id` preserved as `programs.id`** so
  existing FKs survive PR 3's view swap. Idempotent (ON CONFLICT id DO NOTHING). Ledger §4.BF.
- ☑ **PR 3 — Migration #3: `seasons` table → compat view over `programs`** (spec §4.5 step 3).
  Applied (version 20260529185046). `programs` is now the single source of truth; `seasons` is a
  `security_invoker`, auto-updatable view (`WITH CHECK OPTION`) so existing reads + the rollover
  writes keep working. Repointed 8 external FKs → `programs(id)` (data-safe, same uuids),
  recreated the 2 dependent views (`player_attendance_season`, `player_rsvp_season`) + the 2
  `season_locations` RLS policies (now read `FROM programs`). Atomic. Advisors clean (security_invoker
  → no security_definer_view warning). Ledger §4.BG.
  - ⚠ **Manual smoke (post-deploy):** `SeasonRolloverPage` reads `seasons→teams→roster_members` via
    PostgREST embedding; teams now FK `programs`, so the embed relies on PostgREST view-embedding.
    Verify the rollover wizard still loads + can create a new season (INSERT-through-view).
- ☐ PR 4–12 — spec §4.5 sequence:
  divisions ext → division_fees+auto_apply_rule → registrations → registration_fees →
  player_equipment → tryout_sessions+attendees → players ext → organizations.family_cap_policy+
  acceptable_age_range → RLS `current_user_org_ids()` + parent SELECT policies.

### UI surface PRs (reviewer's order, on the schema foundation)
- ☐ Family Home → ☐ Conflict resolution → ☐ Multi-child cart → ☐ Billing → ☐ Per-kid detail →
  ☐ Briefings surface → ☐ Plan timeline. (All 10/10 parent surfaces per spec §5–§8.)

### Production-handoff notes (from the mockup audit)
- Bottom-nav: Lucide React icons (`home`/`calendar`/`mail`/`circle-user`), not the mockup's unicode.
- St Pats brand color `#2f7a4f` is a PLACEHOLDER — brand-lock during St Pats Q4 2026 discovery.
- Kid-avatar = letter-on-primary-team-color (locked v1 default; photo upload later).
- State-matrix surfaces (empty/error/loading/edge — 20+ across the 4 parent surfaces) are a
  polish-pass artifact AFTER v1 ships to LH parents (design from real data signals, not pre-built).
