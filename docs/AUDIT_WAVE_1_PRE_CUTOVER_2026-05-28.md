# AUDIT — Wave 1 Pre-Cutover (P0 categories) — 2026-05-28

**Contract:** PLATFORM_PRIORITIES.md §17.6 Wave 1 set — categories #7 RLS,
#8 schema integrity, #9 query contract, #12 cross-org exposure, #26
financial reconciliation. Five narrow-scope parallel agents per AP #61
+ AP #50; this doc is the synthesis stitched across them per AP #58.

**Status:** findings only. Routing → fix PRs is a separate workstream
(§17.7 step 3). Auto-merging this synthesis doc preserves it across
sessions; the P0 fixes are the next session's work.

**Calibration outcome (§17.5):** all five Wave 1 categories surfaced
real findings. Retain all five for Wave 2/3 if re-needed. No demotions.

---

## Headline

- **10 consolidated P0s** across 4 surfaces (RLS, schema, cross-org, financial)
- **~8 consolidated P1s**
- **~30+ P2 / defer items** (deferred to Wave 2/3 or backlog)
- §17.2 invariant 4 ("no cross-org leak path") **FAILS** today at the
  DB layer despite app-layer discipline holding. Multi-tenant cutover is
  gated on the Cross-Pattern 1 fix-set.

---

## Cross-cutting patterns (AP #58 synthesis)

### CROSS-PATTERN 1 — Single-tenant DB-layer assumption (CUTOVER BLOCKER)

The §17.2 multi-tenant invariants are enforced at the application layer
but **not at the database layer** in several places. Single-tenant
reality (1 live org) masks the gap today. Second-tenant onboarding
exposes it. Cross-surfaced by #7, #8, #9, #12 independently:

| Source | Finding |
|---|---|
| #12 P0-1 | 4 public RLS policies hardcode `e3e95e21-3571-4e9a-985a-d5d01480d4a6`: `events_select_public`, `teams_select_public`, `tournaments_select_public`, `tournament_teams_select_public`. St. Patrick's public schedule will silently deny on anon access. |
| #12 P0-2 | `staff_profiles_select_authenticated` policy has `qual=true`. Any authenticated user can SELECT every row in `staff_profiles` across all orgs (display_name, phone, title). App-layer reads filter by org_id (defense-in-depth holds) but the RLS floor is wide open. |
| #8 P0 | `push_subscriptions.org_id` is NULLABLE. The column has FK to `organizations` ON DELETE CASCADE but admits NULL inserts — a NULL row escapes every `.eq('org_id', orgId)` filter. |
| #9 P1 (PATTERN GAMMA) | `useMapsUrl.js:38` does `locations.ilike('name', ...)` with no org filter, no auth context. Multi-org future returns first match across orgs (overlapping "WCC" / "Main Gym" names). |
| #8 P1 | `user_roles_user_id_key` UNIQUE on `(user_id)` only. Schema-baked single-org-per-user. Multi-program may need `(user_id, organization_id)`. |

### CROSS-PATTERN 2 — AP #57 active in production (Supabase default-privilege leak)

Cross-confirmed by #7 PATTERN ALPHA and #12 SECDEF surface enumeration.
AP #57 predicted this: Supabase project-level default privileges
auto-grant EXECUTE on new SECDEF functions to `anon` regardless of
`REVOKE FROM PUBLIC`. Three production functions actively leaking:

| Function | Risk | Source |
|---|---|---|
| `mint_unsubscribe_token(uuid)` | Anon can mint unsubscribe tokens for ANY guardian UUID, then call `/rsvp_unsubscribe` to suppress notifications. Violates AP #29 + AP #33 (mint belongs in authenticated context). | #7 P0-1 |
| `sync_opponent_record(uuid)` | Anon can trigger write to `opponents` outside RLS. | #7 P0-2 |
| `sync_tournament_team_record(uuid,uuid)` | Anon can trigger write to `tournament_teams` outside RLS. | #7 P0-2 |

**Fix pattern per AP #23 + AP #57:**
`REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC; REVOKE EXECUTE ON FUNCTION ... FROM anon;`

Other anon-EXECUTE SECDEF results are either by-design token handlers
(`verify_unsubscribe_token`, `get_invitation_by_token`) or false
positives (4 trigger-typed functions where PostgREST refuses RPC
regardless of grant).

### CROSS-PATTERN 3 — Documentation / ledger drift (AP #21 + AP #45)

CLAUDE.md is materially out of sync with production reality. Pre-cutover
discipline depends on the doctrine layer being accurate; today it isn't.

| Drift | Documented | Reality | Source |
|---|---|---|---|
| Ghost migrations | "5 ghost migrations" (§5) | 16 ghosts + 30 orphan applied changes + ~10 AP #21 mirror-discipline violations (filename/registered-version mismatch) | #8 PATTERN A |
| Financial state | "70 families, 100 accounts, $102,765 billed, $97,374 net" (§8 prompt 7-A) | 164 accounts, 244 transactions, $166,910 billed, $165,635 gross — two import waves visible (May 5 matches doc, May 6 wave undocumented), Winter 2025-26 season also undocumented | #26 PATTERN A |
| §11.5 exception table | Only `useRoster.js:25` exempt to read `payment_status` | `PlayerRow.jsx:59-62` consumes the field via prop-drilling from useRoster — bypasses the documented boundary | #26 P0-5 / PATTERN C |
| `LEGACY_HOOPERS_ORG_ID` constant | Declared at `src/lib/constants.js:50` with "Phase 6+ refactor" comment | Zero callers in src/ — dead | #12 P1 |
| Stale legacy-numbered migration files | — | 11 stale `029_*`–`033_*` files in repo, already re-registered under timestamp versions | #8 PATTERN C |

### CROSS-PATTERN 4 — Defense-in-depth gap class

RLS catches today; gaps will compound at multi-org cutover or under refactor.

| Pattern | Count | Source |
|---|---|---|
| AP #36 destructured-default sites above audit baseline=32 | ~14 | #9 PATTERN ALPHA |
| AP #37 id-only writes on org-scoped tables (no `.eq('org_id', orgId)` defense-in-depth) | ~20 | #9 PATTERN BETA |
| `multiple_permissive_policies` perf advisories (top: `event_comments` 24, `event_rsvps` 24, `event_duties` 12) | 151 | #7 P1 |

Load-bearing AP #36 risk-sites worth fixing pre-cutover:
- `src/lib/engine/resolvers/rsvpNudge.js:56` — guardian rows treated as
  empty on `player_guardians` query failure → RSVP nudges skip all
  unresponded families silently.
- `supabase/functions/briefing-auto-draft-tick/_handlers.ts:94,115` —
  idempotency check + org settings read; transient error → drafts could
  double-fire OR fall back to 0.7 default unintentionally.

### CROSS-PATTERN 5 — Orphan-merge follow-through incomplete + financial gaps

Real-money correctness surface (#26) has multiple P0s:

| Finding | Detail | Source |
|---|---|---|
| `coach_payouts` table empty | Despite Darien paid per session (§10). Either Darien hasn't been paid through the system OR shadow rows never written. Audit gap. | #26 P0-1 |
| Doc vs DB reconciliation FAIL | $102,765 documented vs $166,910 in DB (+60%). Two import waves visible. | #26 P0-2 |
| DeMasi orphan-merge incomplete | Joseph Demasi (3 accounts) + Xanthi DeMasi (0 accounts) both exist as guardians. Case/spelling drift suggests duplicate. | #26 P0-3 |
| KHOJASTEH zero accounts | Sarmad KHOJASTEH guardian row exists; zero financial_accounts attached. | #26 P0-4 |
| `payment_status` leaking past §11.5 exception | `PlayerRow.jsx:59-62` consumes field via prop from useRoster. | #26 P0-5 |

---

## Consolidated P0 list (must close before multi-tenant cutover)

Ordered roughly by surface for fix-PR clustering.

### Database surface (5 P0s — bundle into one migration PR)

1. **`mint_unsubscribe_token(uuid)` anon-EXECUTE.** Migration: `REVOKE
   EXECUTE ON FUNCTION public.mint_unsubscribe_token(uuid) FROM PUBLIC;
   REVOKE EXECUTE ON FUNCTION public.mint_unsubscribe_token(uuid) FROM
   anon;` Confirm callers via grep — mint should be invoked from
   authenticated context only. (#7 P0-1)

2. **`sync_opponent_record(uuid)` + `sync_tournament_team_record(uuid,
   uuid)` anon-EXECUTE.** Same REVOKE pattern. (#7 P0-2)

3. **`push_subscriptions.org_id` NULLABLE.** Migration: verify zero NULL
   rows; `ALTER TABLE push_subscriptions ALTER COLUMN org_id SET NOT
   NULL`. (#8 P0)

4. **4 public RLS policies hardcode Legacy Hoopers UUID.** Migration:
   rewrite `events_select_public`, `teams_select_public`,
   `tournaments_select_public`, `tournament_teams_select_public` to
   scope via `org_id IN (SELECT id FROM organizations WHERE
   public_listing_enabled = true)` or equivalent. **Requires
   product-side decision** on the gating column shape — see §Open
   questions below. (#12 P0-1)

5. **`staff_profiles_select_authenticated` policy `qual=true`.**
   Migration: replace with `(org_id = current_user_org_id())`. App-layer
   filtering already in place; this closes the RLS floor. (#12 P0-2)

### Financial surface (5 P0s — bundle into one PR + 1 doc-update PR)

6. **`coach_payouts` empty despite Darien paid per session.** Operational
   audit, not code: confirm with Frank whether shadow rows should have
   been written + reconcile against external pay records before cutover.
   (#26 P0-1)

7. **CLAUDE.md §8 + §10 financial-state drift.** Doc update: rewrite §8
   prompt 7-A current state to reflect 164 accounts / 244 transactions
   / $166,910 billed / $165,635 gross / 3 seasons (Fall 2025 + Spring
   2026 + Winter 2025-26). Confirm May-6 import wave was intentional
   (or revert if accidental dup). (#26 P0-2)

8. **DeMasi orphan-merge incomplete.** Operational: confirm Xanthi
   DeMasi (`xanthikeskinis@gmail.com`) is a real co-guardian or a stale
   duplicate. If duplicate, merge into Joseph's row. (#26 P0-3)

9. **KHOJASTEH zero accounts.** Operational: confirm whether Sarmad
   KHOJASTEH is enrolled. If yes, recover the missing financial_account
   linkage; if no, archive the guardian row. (#26 P0-4)

10. **`PlayerRow.jsx:59-62` reads `payment_status` past §11.5 exception
    boundary.** Code fix: either (a) widen §11.5 exception to include
    PlayerRow as documented downstream consumer, OR (b) derive the dot
    color from `family_balances` view via parent prop. (#26 P0-5)

---

## Consolidated P1 list (next-phase, doesn't block cutover)

- **`useMapsUrl.js:38`** — locations ilike-by-name with no org filter.
  Add `.eq('org_id', currentUserOrgId)`. Latent leak on second-tenant
  provision. (#9 P1)
- **`user_roles_user_id_key`** UNIQUE on `(user_id)` only — single-org
  assumption. Assess for multi-program: relax to `(user_id,
  organization_id)` if a user should hold a role per org. (#8 P1)
- **Duplicate registered migration name** `assert_org_owns_helpers` at
  `20260521114129` + `20260521114252`. Assess; document as no-op rerun
  if so. (#8 P1)
- **33 unindexed FKs** — 4 include org-scoped tables (`coaching_assignments.org_id`,
  `briefing_inbox_preferences.org_id`, `staff_profiles.org_id`,
  `user_roles.organization_id`). Org-cascade DELETE will table-scan at
  cutover. Dedicated index-add migration. (#8 P1)
- **`invite-parent` edge function** admin-check is org-blind. Add
  `org_id` body param + `user_has_role_in_org` assertion. (#12 P1)
- **`roster_members` UNIQUE `(player_id, team_id)`** lacks `season_id`.
  Blocks same-player re-roster across seasons. Multi-program will
  surface this. (#8 P1)
- **`coach_payouts`, `financial_transactions`, `season_rollovers`
  org_id `ON DELETE NO ACTION`** — paired with cutover org-archival,
  these will silently block org deletion. Decide cascade vs SET NULL
  vs explicit playbook entry. (#8 P1)
- **AP #29 token-handler re-audit** — `get_invitation_by_token` +
  `verify_unsubscribe_token` are anon-callable by design; confirm
  signed-token validation + replay protection internal to function
  bodies. (#7 P1)
- **`app_secrets` + `event_reminder_log` RLS-enabled-with-zero-policies.**
  Intentional deny-default but worth pinning with explicit REVOKE +
  comment so future audits don't surface as "missing policy". (#7 P1)

---

## P2 / defer surface (Wave 2/3 or backlog)

Summarized — full file:line lists are in the per-agent reports below.

- **#7:** 151 `multiple_permissive_policies` perf advisories on 15
  tables; 76 unused indexes; `pg_net` extension in `public` schema.
- **#8:** 7 views expose nullable org_id (false-nullable propagating to
  client TS types); §11.5 alignment trigger is one-way only (team_players
  → roster_members); 11 stale legacy-numbered migration files in repo.
- **#9:** ~14 AP #36 destructured-default sites above audit pin
  (existing `destructureWithoutErrorAudit.test.js` baseline=32, sweep
  PR to lower); ~20 AP #37 id-only writes on org-scoped tables.
- **#12:** `alert_types_select` qual=true on global taxonomy (safe,
  document as intentionally global); `get_org_user_profiles` reaches
  into `auth.users.raw_user_meta_data` (org-scoping is correct, but
  audit raw_user_meta_data content before 2nd tenant).
- **#26:** `financial_accounts.guardian_id` NULLABLE (zero NULLs today
  but schema permits orphan accounts); `discount_cents` always zero
  across 164 accounts (confirm imports captured discounts).

---

## Routing recommendation

The 10 P0s cluster into **4 fix PRs + 1 operational reconciliation
workstream**:

1. **PR — DB security migration** (P0s #1, #2, #3, #5):
   - REVOKE PUBLIC+anon on 3 SECDEF leaks
   - NOT NULL on `push_subscriptions.org_id`
   - Replace `staff_profiles_select_authenticated` `qual=true`
   - Single migration, ~30 min, low risk.

2. **PR — Public-schedule org-scoping** (P0 #4):
   - Adds gating column to `organizations` (e.g., `public_listing_enabled boolean DEFAULT true`)
   - Rewrites 4 public RLS policies
   - Requires Frank's call on column name + default
   - ~1h work after Frank confirms shape.

3. **PR — PlayerRow §11.5 compliance** (P0 #10):
   - Either widen exception in CLAUDE.md, OR refactor PlayerRow to read
     from family_balances
   - ~30 min; small surface.

4. **PR — CLAUDE.md doctrine reconciliation** (P0 #7 + Cross-Pattern 3
   doc-drift cleanup):
   - Update §8 prompt 7-A financial state
   - Update §5 migration ledger (ghost-count + orphan list)
   - Update §11.5 exception table
   - Remove `LEGACY_HOOPERS_ORG_ID` dead constant
   - Triggers AP #45 → also update EMBER_PENDING_LEDGER §4
   - ~1h work; pure doc.

5. **Operational reconciliation workstream** (P0s #6, #8, #9):
   - coach_payouts external reconciliation
   - DeMasi guardian disambiguation
   - KHOJASTEH enrollment confirmation
   - Frank-driven, not code; ~30 min once Frank engages.

**Suggested cutover gate:** PRs 1, 2, 3 + workstream 5 close before
second-tenant onboarding. PR 4 (doctrine) is independent but should
land same arc. P1s ship in Wave 2.

---

## Open questions (for Frank to resolve before fix-PR routing)

1. **Public-schedule gating shape** (P0 #4) — what column on
   `organizations` controls public anon visibility? Existing
   `brand_colors` jsonb? New boolean? Need the canonical contract
   before rewriting the 4 policies.
2. **May-6 financial import wave** (P0 #7) — intentional re-import
   that should have replaced May-5 wave, or accidental dup that
   should be deleted? Doc update depends on this.
3. **DeMasi duplicate vs co-guardian** (P0 #8) — Xanthi DeMasi a real
   second guardian, or import drift from "DeMasi" vs "Demasi" casing?
4. **KHOJASTEH enrollment status** (P0 #9) — currently enrolled but
   accounts lost in orphan-merge, or no longer enrolled and guardian
   row is stale?
5. **`coach_payouts` historical reconciliation** (P0 #6) — has Darien
   been paid through the system at all? External records needed.
6. **AP #45 compliance scope** — this audit doc triggers the
   `docs/AUDIT_*.md` glob in AP #45's rule. EMBER_PENDING_LEDGER §4.AK
   is the same-commit ledger entry.

---

## Per-agent findings (preserved for fix-PR routing)

The full agent transcripts live in this session's
`/tmp/claude-0/.../tasks/*.output` files (ephemeral). The actionable
content is captured below.

### #7 RLS correctness + performance

Counts:
- RLS advisories from `get_advisors`: 49 security + 261 performance
- Bare `auth.uid()` policies: **0** (full subselect compliance per §5)
- ALL policies missing with_check: **0** (AP #20 fully closed)
- Anon-EXECUTE SECDEF functions: **9 advisor-reported / 5 genuinely
  actionable** (3 P0 leaks + 2 P1 by-design token handlers; 4
  trigger-typed false positives — PostgREST refuses RPC on `RETURNS
  trigger` regardless of grant)
- RLS-disabled real tables in public: **0** (`relkind='r'` filter
  applied per AP #24)

PATTERN BETA (positive): RLS pattern compliance is genuinely strong.
Zero bare auth.uid(), zero ALL-policies missing with_check, zero
policies on org_members reference current_user_org_id(). AP #1, #20,
#24 fully closed.

### #8 Schema integrity

Migration ledger reconciliation:
- Files in repo: 173
- Versions in DB: 175
- Ghost migrations: 16 (5 documented + 11 stale legacy-numbered files)
- Orphan applied changes: 30 (mostly legacy-renumbered + ~8 mirror-discipline violations)
- 1 duplicate-name re-apply (`assert_org_owns_helpers`)

Counts:
- Nullable org_id columns (base tables): **1** (`push_subscriptions`)
- Nullable org_id columns (views): **6**
- FKs without supporting index: **33**
- Tables without PK: **0**
- `staff_profiles` PK shape: **`(user_id, org_id)`** — correct per AP #25
- Roster alignment trigger: present (one-way: team_players → roster_members)

PATTERN B (unindexed FK debt on `created_by` / `changed_by` /
`voided_by` / etc.): user-deletion-cascade visible at multi-program
scale. Wave 3 perf-indexing surface.

### #9 Query contract sweep (AP #36, #37, #48, #25)

Counts:
- AP #25 onConflict: **17/17 verified clean** against pg_constraint
- AP #48 foreignTable order: **0 callsites** (both prior bugs fixed in PRs #349, #358)
- AP #37 missing-entirely org_id filter: **0 bugs**
- AP #37 id-only writes (defense-in-depth gap): **~20 fragile** + 1 genuine multi-org leak (`useMapsUrl.js:38`)
- AP #36 destructured-default sites: ~14 above existing audit pin (baseline=32)

Load-bearing AP #36 sites:
- `src/lib/engine/resolvers/rsvpNudge.js:56`
- `supabase/functions/briefing-auto-draft-tick/_handlers.ts:94,115`

### #12 Cross-org / multi-tenant exposure

Invariant check (§17.2):
- Invariant 1 (RLS scoping): **PASS with 2 P0 exceptions** (4 hardcoded UUIDs + staff_profiles qual=true)
- Invariant 2 (app-layer org_id filter): **PASS**
- Invariant 3 (brand reset on login): **PASS** — 3-layer defense
  (`applyCachedBrandColorsSync` in main.jsx + `useOrgBranding` cleanup +
  LoginPage explicit reset + signOut → bustAllCaches → clearCachedBrandColors)
- Invariant 4 (no leak path): **FAIL pending P0 fixes**

SECDEF surface: 49 functions enumerated; 0 active cross-org body
leaks; the 3 anon-EXECUTE concerns from #7 confirmed.

Storage buckets: 0 (no buckets defined).

Hardcoded org-id literals: 1 dead constant (`src/lib/constants.js:50`)
+ 4 RLS policy `qual` references (P0).

### #26 Financial reconciliation

Reconciliation: **FAIL** (+60% drift due to undocumented May-6 import + Winter 2025-26 season).

Org-scoping check: PASS — all 3 financial tables have org_id NOT NULL,
all have org-scoped RLS, WITH CHECK present on all ALL policies (AP #20
compliant).

Audit-trail discipline: PASS — financial_transactions has no
UPDATE/DELETE policies, append-only via RLS enforcement.

Dedup verification:
- DeMasi: **NOT confirmed clean** (Xanthi row dangles)
- KHOJASTEH: single guardian row but **zero financial_accounts** attached

§11.5 non-exempt caller: `src/components/roster/PlayerRow.jsx:59-62`

---

## AP compliance

- **AP #43** cross-role coverage: not applied (audit doc, not user-surface diff). Documented as a finding doc.
- **AP #45** ledger reconciliation: EMBER_PENDING_LEDGER §4.AK shipped in same commit.
- **AP #49** full-paste discipline: applied via PR description + chat
  paste in the dispatching session.
- **AP #50** scope-appropriate methodology: parallel narrow-scope agents
  (5 independent surfaces) — matches §17.3 + Wave-1 dispatch contract.
- **AP #56 + #59** session contract: this session opened with three-item
  pre-flight (§9.1), dispatched Wave 1 once, synthesized findings into
  this doc, did NOT cascade into fix-PR dispatch. Routing → fix PRs is
  a separate session.
- **AP #58** cross-batch pattern check: applied — 5 CROSS-PATTERNs
  identified stitching across the 5 reports.
- **AP #61** pre-phase audit gate: this IS that gate. Required outputs
  delivered: bug surface (P0/P1/P2 with file:line / object refs);
  enhancement surface flagged in P1s; redesign-potential explicitly
  routed to Wave 2/3; explicit routing recommendations with cutover-gate
  proposal.

---

**Next session (per §17.7 step 3):** routing of the 5 fix PRs + the
operational reconciliation workstream. Frank's 6 open questions
(above) resolve before PR 2 + the operational items can ship.
