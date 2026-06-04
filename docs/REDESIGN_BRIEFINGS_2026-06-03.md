# Briefings — Phase 2 Redesign Proposal

**Started:** 2026-06-03 AM
**Author:** terminal-CC (Phase 2 doc-only proposal)
**Phase 1 audit:** `docs/AUDIT_BRIEFINGS_2026-06-02.md` (CLOSED)
**Cross-reference:** `CLAUDE.md §16.15` (L99 redesign template — methodology source), `EMBER_PENDING_LEDGER §4.BX` (audit arc record)

## 0. Posture

This doc presents **named options + tradeoffs + recommended picks with rationale** for the 8 Phase 2 routing decisions surfaced in Phase 1. **Recommendations are NOT decisions.** Each option block flags reversibility, confirm-gates needed (irreversible ops), and dependencies on other decisions.

Per saved memory `autopilot-overreach-on-decisions-and-irreversible-ops`: terminal-CC does not pick architectural options, does not pull irreversible triggers (DROP COLUMN, schema-narrowing), and does not promote recommendations to settled root cause without explicit operator confirm. This doc is the proposal layer; **Phase 3 ship requires explicit Frank routing per decision** before any code lands.

## 1. Phase 2 deliverable structure (per §16.15)

(a) **Per-surface named options + tradeoffs** — §2 Decision Matrix below.
(b) **Per-role wireframes** — §3 Parent Inbox Wireframes (D-6 deliverable).
(c) **Migration plan** — §4 Reversible-first sequencing.
(d) **PR sequence for Phase 3 ship** — §5 Concrete PR plan.
(e) **Out-of-scope confirmed** — §6 carries forward Phase 1's out-of-scope list.

---

## 2. Decision matrix — 8 Phase 2 routing decisions in 3 clusters

### Cluster 1 — Schema (D-1, D-2, D-7)

#### D-1 — BUG A fix shape (composer 23505 on weekly_digest INSERT)

**Question:** How does the composer's flush() avoid 23505 when the auto-draft cron has already written this week's draft?

**Named options:**

- **(a) Narrow the unique-index predicate.** Drop `'draft'` from the `WHERE status IN (...)` clause in `comms_messages_weekly_digest_unique`. Two drafts can coexist; only sent/scheduled/queued rows are deduped.
  - Reversibility: ✓ (small migration; can re-narrow or re-widen freely).
  - Implementation: 1 migration file. ~10 lines.
  - Trade-off: doesn't enforce the "one draft per anchor" invariant; admin sees two drafts in the resume list if they composed and the cron also wrote one.

- **(b) Composer reuses existing draft via SELECT pre-check.** `flush()` does `SELECT id FROM comms_messages WHERE org_id + kind + anchor_id/period_start IN active statuses` before INSERT. If exists, UPDATE that row instead.
  - Reversibility: ✓ (code-only change in flush()).
  - Implementation: ~25 lines in useBriefingDraft.js + 1 UI affordance to surface "Existing draft found; resuming" to admin.
  - Trade-off: generalizes to every anchored kind (game_recap, schedule_change, rsvp_nudge all have anchor-bound semantics), so the model spreads. Bigger blast radius if regressions surface.

- **(c) Catch 23505 in flush() with race-resolved-other-tick-won pattern.** Adopt the same pattern `briefing-auto-draft-tick/index.ts:73-78` already uses: catch error code 23505, treat as "another path wrote this anchor; reload and reuse."
  - Reversibility: ✓ (code-only change in flush()).
  - Implementation: ~15 lines in useBriefingDraft.js. Reuses the cron's existing model.
  - Trade-off: only handles the race after it happens; admin sees a brief loading flash on collision. Doesn't prevent the conflicting INSERT attempt.

**Recommendation:** **(a) + (c) for Phase 3 PR sequence.** (a) is the minimal patch that unblocks the composer immediately (one migration, fully reversible). (c) is the structural cleanup that adopts the cron's existing race model so the composer side mirrors the cron side. Together they close BUG A with low blast radius. (b) reserved for a later wave if other anchored kinds surface the same collision pattern.

**Confirm gates needed:** None — (a) is reversible migration; (c) is code-only.

**Dependencies:** None (independent of D-2 / D-3 / D-4).

---

#### D-2 — BUG B fix shape (4-way audience-type catalog drift)

**Question:** How does Phase 2 reconcile the 4-way drift between CHECK / KIND_METADATA / MODES / AUDIENCE_LABEL?

**Named options:**

- **(α) Single source of truth + parity test + CHECK widen + backfill.** `KIND_METADATA.defaultAudienceType` becomes canonical. Widen the production CHECK to include the 4 missing values (`player_specific`, `multi_event_attendees`, `coach_self`, `family_specific`). Derive MODES + AUDIENCE_LABEL from kindMetadata (or assert parity via vitest). Backfill the 21 wrong-coerced rows in coach_roundup + family_guide to the semantic value per kindMetadata default.
  - Reversibility: CHECK widen ✓ (just adds values); parity test ✓; backfill is a data write at scale — recoverable via audit log but the audit shape is permanent.
  - Confirm-gate needed: **BACKFILL** (21 row UPDATEs touching production data). Per memory: needs explicit confirm prompt before applying.
  - Implementation: 1 migration (CHECK widen), 1 vitest, 1 backfill migration. ~40 lines total.
  - Trade-off: most thorough; one PR for schema + tests + backfill is clean but the backfill is the irreversible-ish step.

- **(β) Refactor wizard to NOT show picker for kinds with derivable audience.** For kinds where `kindMetadata.defaultAudienceType` is non-null, show a locked-caption (like `audienceLocked: true` does today) and allow override only via an explicit "Change audience" affordance.
  - Reversibility: ✓ (UI-only).
  - Confirm-gate needed: None.
  - Implementation: ~30 lines in StepAnchorAudience.jsx + AudiencePicker.jsx.
  - Trade-off: eliminates the silent-coercion path mechanically. But requires deciding what "Change audience" means — if admin overrides to `team`, do we still want that or should the kind's audience be truly locked? Adds UI complexity.

- **(γ) Keep picker but make kindMetadata default the active option.** If `MODES.find(default) === undefined`, prepend the default to the rendered modes. Admin sees `coach_self` as the active button; can keep or pick a different mode.
  - Reversibility: ✓ (UI-only).
  - Confirm-gate needed: None.
  - Implementation: ~10 lines in AudiencePicker.jsx.
  - Trade-off: smallest UI change but still allows the coercion path if admin clicks away from the default. CHECK still needs widening (otherwise admin keeping the default → INSERT fails).

**Recommendation:** **(α) + (γ) hybrid for Phase 3 PR sequence.**
- (α-part: schema): widen CHECK to include the 4 missing values + add parity vitest. **Defer the backfill** to a separate confirm-gated PR.
- (γ-part: UI): AudiencePicker prepends kindMetadata default if MODES doesn't contain it. Admin sees the semantic default as the active option.
- (β) reserved for if Phase 2 user feedback shows admin override is rarely meaningful for coach_roundup / family_guide kinds — then revisit.

**Confirm gates needed:**
- CHECK widen: NO (reversible additive change).
- Backfill the 21 rows: **YES** — needs explicit confirm before applying. Pre-flight SELECT COUNT + audit log entry + apply.

**Dependencies:** D-7 (the parity vitest is part of the catalog discipline). Loose dependency on D-3 (BUG C's dual-dispatch question intersects).

---

#### D-7 — PATTERN B5-ε catalog parity tests (extend AP #28 discipline systemically)

**Question:** Extend the AP #28 parity-test pattern (currently kind catalog only) to audience, pilot mechanism, section renderers?

**Named options:**

- **(a) In scope for Phase 2/3.** Add vitests for each catalog. Each test is ~50 lines (mirrors `verifyJwtConfigAudit.test.js` / `edgeFunctionDirectoryParity.test.js`).
  - Reversibility: ✓ (tests-only; can disable/remove freely).
  - Confirm-gate needed: None.
  - Implementation: ~150 lines across 3 new vitests (audience parity, pilot mechanism parity, section renderer parity).
  - Trade-off: closes the drift surfaces permanently. Mechanical safeguards align with the autopilot framework (reversible work).

- **(b) Defer to a separate cleanup wave.** Phase 3 ships the fixes without parity tests; a follow-up wave adds them.
  - Trade-off: leaves the drift surfaces vulnerable to re-divergence between now and the cleanup wave.

**Recommendation:** **(a).** Each parity test is small + mechanical + reversible. Adding them alongside the Phase 3 ship work prevents the drift from re-emerging. (b) accepts re-drift risk for no real saving.

**Confirm gates needed:** None.

**Dependencies:** None.

---

### Cluster 2 — Pilot mode (D-4, D-5)

#### D-4 — BUG D strategic (cut over from REDIRECT to FILTER? or other)

**Question:** Phase 1 found that pilot mode has 3 layers (REDIRECT verification + FILTER unmigrated stragglers + send-time safety guard). The documented cutover (flip is_pilot_family=true + flip pilot_test_recipient_email NULL) was never built. What's the long-term pilot mechanism?

**Named options:**

- **(a) Cut over to FILTER as the production mechanism.** Build UI or one-shot SQL playbook to flip `is_pilot_family=true` on real pilot families. Migrate the 3 stragglers to use the RPC (D-5 below; happens regardless). After cutover, REDIRECT becomes unused (pilot_test_recipient_email NULL); FILTER becomes the operational mechanism; send-time safety guard becomes the redundant defense layer.
  - Reversibility: ✓ for the flag flips (can re-flip); ✓ for resolver migrations (code-only); the cutover sequence itself is reversible until the REDIRECT verification is removed.
  - Confirm-gate needed: writing `is_pilot_family=true` on real guardians is a production-data write — needs explicit confirm per row count.
  - Implementation: New admin UI (~80 lines) for flag-flipping OR a one-shot SQL playbook (≤10 lines), + D-5's resolver migrations (~120 lines across 3 files).
  - Trade-off: aligns with the original architectural intent (per 2026-05-11 migration comment). Most work but most documented.

- **(b) REDIRECT-only permanent.** The verification mechanism becomes the production mechanism. **DROP COLUMN guardians.is_pilot_family** (irreversible) after migrating the 3 stragglers. Send-time safety guard becomes effectively dead code (or a defensive nullcheck on the synthetic rows' guardian_id=NULL).
  - Reversibility: DROP COLUMN is **IRREVERSIBLE** — re-adding the column doesn't restore historical row state.
  - Confirm-gate needed: **DROP COLUMN guardians.is_pilot_family — explicit confirm required** per memory. Pre-flight: confirm 0 callsites + 0 production writes.
  - Implementation: D-5 migrations + DROP COLUMN migration + remove safety guard (or rewrite as nullcheck).
  - Trade-off: simpler operational model. But locks in REDIRECT semantics permanently; if Frank later wants per-family pilot flags for any reason (A/B testing, gradual rollout, etc.), the column is gone.

- **(c) Exit pilot entirely.** Once the platform exits pilot phase, both mechanisms are unnecessary. The system sends to all real families. Drop both mechanisms + the safety guard.
  - Reversibility: **IRREVERSIBLE** for the column drop + safety-guard removal; reversible for the resolver code changes.
  - Confirm-gate needed: multiple — DROP COLUMN + safety guard removal + organization_settings.pilot_mode_enabled disabling.
  - Implementation: large, multi-PR sequence.
  - Trade-off: clean end-state but premature if pilot phase isn't actually ending.

**Recommendation:** **HARD HOLD — Frank's strategic call.** This is a product/business decision about whether the platform is in pilot phase or exiting it, not a technical one. The technical analysis is complete; the answer depends on Frank's roadmap for LH + future tenants.

**Confirm gates needed:**
- (a): writing is_pilot_family=true on real rows — explicit confirm.
- (b): DROP COLUMN guardians.is_pilot_family — **explicit confirm + pre-flight 0-callsite proof.**
- (c): multiple DROPs + safety removals — **explicit confirm per step.**

**Dependencies:** D-5 (the 3 strangler migration is independent and ships either way).

---

#### D-5 — BUG D tactical (migrate the 3 stragglers)

**Question:** Independent of D-4, migrate `academyCallupNotice.js`, `rsvpNudge.js`, and `briefing-auto-draft-tick/_reminderSend.ts` to use the `get_digest_recipients` RPC instead of bypass-querying `player_guardians`/`guardians` directly?

**Named options:**

- **(a) Yes, migrate now (forward-compatible with all D-4 outcomes).** Replace the per-resolver `from('player_guardians').select('guardians (...is_pilot_family...)')` pattern with `supabase.rpc('get_digest_recipients', { p_org_id, p_pilot_only })` + post-process. Each migrated resolver gains: (i) REDIRECT during verification phase (synthetic rows replace real guardians), (ii) FILTER once cutover happens (real guardians pass), (iii) automatic alignment with `tournamentPrelimHelpers.js` pattern.
  - Reversibility: ✓ (resolver code-only).
  - Confirm-gate needed: None.
  - Implementation: ~120 lines across 3 files.
  - Trade-off: today's symptom (rsvp_nudge / academy_callup_notice "No recipients" in pilot mode) goes away because REDIRECT pours 5 synthetic rows into both. After D-4 cutover (a-path), they get FILTER. Either way, they work.

- **(b) Defer until D-4 routed.** Wait to know whether REDIRECT or FILTER is the long-term mechanism, then migrate.
  - Trade-off: in the meantime, rsvp_nudge / academy_callup_notice / reminders remain "0 recipients" in pilot mode. Operationally broken until D-4 decides.

**Recommendation:** **(a).** The migration is forward-compatible with all D-4 outcomes + immediately fixes the 0-recipients symptom. Ship regardless of D-4 timing.

**Confirm gates needed:** None.

**Dependencies:** D-4 is INDEPENDENT — migrate now; D-4 picks the long-term mechanism later.

---

### Cluster 3 — UI (D-3, D-6, D-8)

#### D-3 — BUG C fix shape (PreviewPanel dispatch gate)

**Question:** How does PreviewPanel route registry-path preview for kinds with non-`composerSubmit` sendPath?

**Named options:**

- **(a) Widen registry-path criterion to `entry !== null`.** Replace `sendPath === 'composerSubmit'` with `entry !== null` in `PreviewPanel.jsx:64`. Registry path covers all 10 kinds (game_recap, tournament_*, schedule_change, rsvp_nudge, academy_callup_notice, coach_roundup, family_guide, games_recap, weekly_digest). Closes BUG C + DUAL-COMPOSE drift simultaneously.
  - Reversibility: ✓.
  - Confirm-gate needed: None.
  - Implementation: ~3 lines + remove the now-unused DUAL-COMPOSE-block in PreviewPanel + remove defensive KIND_COMPOSERS entries for weekly_digest + academy_callup_notice.
  - Trade-off: removes the legacy compose() defensive fallback for 2 kinds. Per AP #34 (registry/dispatch-table removals need caller migration): same PR removes the defensive entries.

- **(b) Add `composeRsvpNudge` to KIND_COMPOSERS as a defensive entry.** Minimal patch — adds one entry; extends the existing defensive pattern.
  - Reversibility: ✓.
  - Confirm-gate needed: None.
  - Implementation: ~2 lines.
  - Trade-off: preserves DUAL-COMPOSE drift surface (PATTERN A). Smaller diff but doesn't reduce drift.

**Recommendation:** **(a).** Closes BUG C + DUAL-COMPOSE drift + reduces dual-dispatch surface. Per AP #34, the caller migration (removing defensive KIND_COMPOSERS entries) lands in the same PR.

**Confirm gates needed:** None.

**Dependencies:** Loose dependency on D-7 (parity test would lock the registry-path coverage).

---

#### D-6 — Parent inbox scope (REDESIGN TARGET — doesn't exist today)

**Question:** What scope does the parent inbox have in Phase 3?

**Named options:**

- **(a) Minimal viable.** List view of briefings received + detail view + RSVP / callup affordances. No filter, no mark-as-read. Routing: `/inbox` on parent shell.
  - Reversibility: ✓ (additive feature).
  - Confirm-gate needed: new RLS policy on `comms_message_recipients` for parent SELECT scoped to `guardian_id` — **explicit confirm + pre-flight RLS review per AP #57 + Wave 3.B #29 doctrine.**
  - Implementation: ~3 new components (InboxPage, InboxList, InboxDetail), 1 hook (useInboxList), 1 RLS policy migration. ~250 lines across files.
  - Per-role wireframes: §3 below.
  - Trade-off: solves the immediate gap (parents have zero in-app visibility of briefings they receive). Filter + mark-as-read can land in a follow-up wave once usage data exists.

- **(b) Full-featured.** Everything in (a) + filter by kid / team / kind + mark-as-read state + in-app unsubscribe affordance.
  - Reversibility: ✓ (additive).
  - Confirm-gate needed: same RLS policy as (a); plus a new schema column for mark-as-read state (`read_at` on `comms_message_recipients`, OR a separate `read_briefings` table) — **explicit confirm.**
  - Implementation: ~5-6 components + 2 hooks + 1-2 migrations + RLS policy + filter UI. ~450 lines.
  - Trade-off: larger PR sequence, more upfront design load. Mark-as-read semantics need user-research decisions (auto-mark on detail view? explicit button? both?).

- **(c) Punt.** Stay email-only. Close the audit without building parent inbox.
  - Trade-off: doesn't solve the gap. Parents have no in-app way to see briefings, RSVP from history, or manage unsubscribes (without clicking a stale email link).

**Recommendation:** **(a) minimal viable for Phase 3.** Solves the immediate gap with the smallest PR sequence. The RLS policy is the load-bearing piece; the rest is additive UI. Filter + mark-as-read deferred to a follow-up wave once parent usage data exists to inform design.

**Confirm gates needed:**
- **New RLS policy on comms_message_recipients** — explicit confirm + RLS review per AP #57 + Wave 3.B #29 doctrine. Parents see their own briefings (guardian_id = auth.uid()'s guardian record).
- Other migrations (if any): pre-flight + explicit confirm.

**Dependencies:** Loose dependency on D-2 (BUG B affects which kinds parents see); loose dependency on D-4 (pilot mode affects whether parents see real briefings or synthetic rows). Both can be reasoned about independently of D-6's scoping.

---

#### D-8 — a11y dedicated audit (in scope or separate?)

**Question:** Does Phase 2/3 include a dedicated a11y audit pass (axe-core scan + keyboard-only walkthrough)?

**Named options:**

- **(a) In scope.** Run axe-core on composer wizard + new parent inbox during Phase 3 ship; fix gaps in same PRs.
  - Reversibility: ✓.
  - Implementation: a11y fixes inline with Phase 3 PRs.
  - Trade-off: ensures the new surface ships with a11y. Adds review load to Phase 3 PRs.

- **(b) Separate audit wave post-Phase-3.** Phase 3 ships the fixes; a dedicated a11y wave audits afterward.
  - Trade-off: parent inbox ships without a11y verification; relies on baseline discipline.

**Recommendation:** **(b) for the existing surface (composer wizard baseline is OK per B5.2). (a) for the new parent inbox surface only — axe-core scan on every parent inbox PR.** Split-the-difference: don't ship new a11y debt; don't pause existing work for a dedicated audit wave.

**Confirm gates needed:** None.

**Dependencies:** D-6 (a11y discipline applies to parent inbox PRs from this batch).

---

## 3. Parent inbox wireframes (D-6 deliverable per §16.15 element (d))

Per-role wireframes for the **minimal viable** scope (recommended option (a)).

### 3.1 — Parent home → Inbox entry

```
┌─────────────────────────────────────┐
│ Legacy Hoopers                  ☰ │
├─────────────────────────────────────┤
│ Hi, [Parent name]                   │
│                                     │
│ ┌─────────────┐  ┌──────────────┐   │
│ │  Schedule   │  │   Inbox  (3) │   │  ← (3) = unread count
│ └─────────────┘  └──────────────┘   │
│                                     │
│ ┌─────────────┐  ┌──────────────┐   │
│ │  Roster     │  │  Records     │   │
│ └─────────────┘  └──────────────┘   │
└─────────────────────────────────────┘
```

Entry point: existing parent home grid gains an "Inbox" tile. Unread count is an additive nice-to-have; if mark-as-read is deferred (per recommendation), the count is "received this week" instead.

### 3.2 — Inbox list view (`/inbox`)

```
┌─────────────────────────────────────┐
│ ← Inbox                             │
├─────────────────────────────────────┤
│ TODAY                               │
│ ┌───────────────────────────────┐   │
│ │ 📣 Game recap — vs Eagles     │   │
│ │ "We won 45-32. Aubtin had..."  │   │
│ │ 2h ago • For Aubtin            │   │
│ └───────────────────────────────┘   │
│ ┌───────────────────────────────┐   │
│ │ ❓ Quick RSVP — Saturday game │   │
│ │ "RSVP needed for Sat 10am..."  │   │
│ │ 5h ago • For Aubtin    [GOING] │   │  ← RSVP affordance
│ └───────────────────────────────┘   │
│                                     │
│ THIS WEEK                           │
│ ┌───────────────────────────────┐   │
│ │ 📋 Weekly digest              │   │
│ │ "This week's schedule..."      │   │
│ │ Sun 6:00pm                     │   │
│ └───────────────────────────────┘   │
│ ...                                 │
└─────────────────────────────────────┘
```

List view:
- Grouped by recency (TODAY / YESTERDAY / THIS WEEK / EARLIER).
- Each row: kind icon + subject + 1-line preview + relative timestamp + optional "For [kid_name]" + inline action if applicable.
- Inline RSVP affordance for `rsvp_nudge` kind (resolves via existing rsvp-token-handler from email — UI deep-links into the same token flow).
- Inline callup accept/decline for `academy_callup_notice` (same pattern).
- No filter in minimal scope (can be added in follow-up wave).

### 3.3 — Inbox detail view (`/inbox/:messageRecipientId`)

```
┌─────────────────────────────────────┐
│ ← Inbox                             │
├─────────────────────────────────────┤
│ Game recap — vs Eagles              │
│ Sent 2h ago                         │
│ For Aubtin                          │
│ ─────────────────────────────────── │
│                                     │
│ [Rendered briefing body HTML]       │
│  Subject line                       │
│  Body content...                    │
│  Game card                          │
│  Stats narrative                    │
│  Signoff                            │
│                                     │
│ ─────────────────────────────────── │
│ Need to unsubscribe? [Link]         │
└─────────────────────────────────────┘
```

Detail view:
- Renders the same `body_html_rendered` field the email carried — sourced from `comms_message_recipients.body_html_rendered`, NOT re-composed. Guarantees parity with email.
- Top metadata: kind label + relative time + recipient context ("For [kid]").
- Bottom: in-app unsubscribe link (deep-links to the existing unsubscribe-handler with a parent-authenticated flow).
- No mark-as-read button in minimal scope (deferred).

### 3.4 — Admin-side change

Admin's existing `BriefingHistoryDetail.jsx` page already supports detail rendering. No new admin UI required for parent inbox; admin's view remains unchanged.

### 3.5 — RLS policy shape (the load-bearing piece)

New policy on `comms_message_recipients`:

```sql
CREATE POLICY parent_select_own_recipients ON public.comms_message_recipients
  FOR SELECT TO authenticated
  USING (
    guardian_id IN (
      SELECT id FROM public.guardians
      WHERE user_id = (SELECT auth.uid())
    )
  );
```

- Per AP #57 (REVOKE-FROM-PUBLIC discipline): policy targets `authenticated` only; not anon.
- Per CLAUDE.md §5 RLS doctrine: `auth.uid()` wrapped in subselect.
- Per Wave 3.B #29 doctrine: policy is purpose-named + scoped.
- Pre-flight before applying: `EXPLAIN` the policy with a sample parent's `auth.uid()` to confirm index usage on `guardians(user_id)` → `comms_message_recipients(guardian_id)`.

---

## 4. Migration plan (reversible-first sequencing)

Per memory: irreversible operations need explicit confirm + pre-flight. Sequencing groups reversible work first; irreversible at the end with explicit confirm-gates.

### 4.1 — Reversible-first PRs (ship without per-step confirm; mechanical gates fire)

| Order | PR | Decision | Migration? | Confirm needed? |
|---|---|---|---|---|
| 1 | Narrow weekly_digest unique index | D-1(a) | YES (additive) | No |
| 2 | Add 23505-catch + SELECT pre-check to flush() | D-1(c) | No | No |
| 3 | Widen audience_type_check CHECK to 4 missing values | D-2(α-schema) | YES (additive) | No |
| 4 | AudiencePicker prepend default mode + AUDIENCE_LABEL update | D-2(γ-UI) | No | No |
| 5 | Migrate 3 stragglers to use get_digest_recipients RPC | D-5(a) | No | No |
| 6 | PreviewPanel widen registry-path criterion + remove KIND_COMPOSERS defensive entries | D-3(a) | No | No |
| 7 | Add 3 parity vitests (audience / pilot / section renderers) | D-7(a) | No | No |
| 8 | Composer error microcopy translation (post-1–6) | Meta / B5.1 | No | No |

### 4.2 — Confirm-gated PRs (each requires explicit Frank confirm before applying)

| Order | PR | Decision | Migration? | Confirm-gate |
|---|---|---|---|---|
| 9 | Backfill 21 wrong-coerced rows in coach_roundup / family_guide | D-2(α-data) | YES (data write) | **Frank confirms row count + audit log + apply** |
| 10 | New RLS policy on comms_message_recipients (parent SELECT) | D-6(a) | YES (additive policy) | **Frank confirms policy shape + pre-flight EXPLAIN** |
| 11 | Parent inbox UI (InboxPage + InboxList + InboxDetail + useInboxList) | D-6(a) | No | No (after PR 10 lands) |
| 12 | a11y axe-core scan + fixes for parent inbox | D-8(a for new surface) | No | No |

### 4.3 — Held for Frank's D-4 routing (NOT in Phase 3 ship without explicit decision)

| PR | Decision | Migration? | Confirm-gate |
|---|---|---|---|
| H-1 | Cutover (a): UI to flip is_pilot_family or one-shot SQL playbook | D-4(a) | YES (data writes at scale) | **Strategic decision + per-row confirm** |
| H-2 | DROP COLUMN guardians.is_pilot_family | D-4(b) | YES (**IRREVERSIBLE**) | **Strategic decision + 0-callsite pre-flight + explicit confirm** |
| H-3 | Drop both mechanisms + safety guard (exit pilot) | D-4(c) | YES (**IRREVERSIBLE**) | **Strategic decision + multi-step confirms** |

Phase 3 ship from §4.1 + §4.2 can proceed without D-4; the strategic call is independent of the immediate bug fixes.

---

## 5. PR sequence for Phase 3 ship

Per §4 sequencing, Phase 3 has **8 reversible PRs (§4.1) + 4 confirm-gated PRs (§4.2)** as the canonical batch. PRs H-1/2/3 (§4.3) hold for D-4 routing.

**Batching guidance:**
- PR 1–4 (schema + UI fixes for BUG A + BUG B) can land in any order or in parallel.
- PR 5 (straggler migration for D-5) is independent.
- PR 6 (BUG C + DUAL-COMPOSE) depends on AP #34 caller-migration discipline; ships as one PR.
- PR 7 (parity vitests) lands AFTER PRs 1–6 so the assertions reflect the new state.
- PR 8 (microcopy translation) lands LAST so error codes the translation maps actually appear in the new behavior.
- PR 9 (backfill) is confirm-gated; lands when Frank routes.
- PR 10 (RLS policy) is confirm-gated + load-bearing for PR 11 (parent inbox UI).
- PR 12 (a11y for new surface) lands inline with parent inbox PRs.

**Estimated total scope:** ~12 PRs across Phase 3, of which 8 are auto-shippable and 4 need explicit Frank routing.

---

## 6. Out-of-scope (carried forward from Phase 1 audit §2 + §S-1 + §B4.6)

- Stream A reminders (`_reminders.ts` etc.)
- team-feed ICS
- send-push fanout
- Financial briefings
- Slack / SMS channels
- AI prompt-engineering for `suggest-briefing-closer`
- `game_recap` (singular, 15,770 rows) data-hygiene investigation
- History page detail audit (B4.6 deferred)
- Full a11y axe-core scan on existing composer surface (D-8 (b) per recommendation)

---

## 7. Phase 2 status — DOC ONLY, awaiting Frank routing

Per audit's 3-phase hard pause structure: **Phase 2 STOPS here.** Frank routes each decision (D-1 through D-8) before any Phase 3 code lands.

Routing format (suggested): one decision per line, comma-separated, e.g.,
```
D-1: (a)+(c). D-2: (α)+(γ). D-3: (a). D-4: HOLD. D-5: (a). D-6: (a). D-7: (a). D-8: (b)+(a-for-new).
```

Confirm-gated items (PR 9 backfill, PR 10 RLS policy, plus all of §4.3 if D-4 routes) get individual pre-flight + confirm prompts at Phase 3 apply time per saved memory.
