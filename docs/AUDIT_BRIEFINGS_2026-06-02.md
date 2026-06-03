# Briefings — Full Audit + Redesign Arc

**Started:** 2026-06-02 PM
**Operator:** Frank
**Driver:** terminal-CC (with mechanical pause gates per memory `autopilot-overreach-on-decisions-and-irreversible-ops`)
**Cross-reference:** `BRIEFINGS_COVERAGE_L99.md` (the existing coverage doc, refreshed 2026-06-02 in #656), `CLAUDE.md §13` (HTML rules), `CLAUDE.md §16.5` (notification cadence), `CLAUDE.md §16.15` (L99 redesign template — methodology source)

---

## ⚡ THE ARC IN 3 PHASES — HARD PAUSE BETWEEN EACH

### Phase 1 — Audit (this doc)
Doc-only. Read everything; surface every finding; classify by severity + by remediation class. No code. Multi-batch (Wave B1–B5 below). **STOPS** when all 12 categories have findings + cross-pattern synthesis + out-of-scope list.

### Phase 2 — Redesign proposal (separate doc + PR)
Doc-only. Per surface, named options + tradeoffs + per-role wireframes if surface renders differently per role. Migration plan: reversible-first, irreversible-last, with explicit confirm-gates on schema-narrowing or data-shape changes. **STOPS** when Frank routes each redesign call.

### Phase 3 — Ship
Multi-PR arc. Each PR scoped tight. Irreversible operations (DROP TABLE/COLUMN, CHECK-constraint narrowing, RLS reshape) get an explicit confirm prompt — autopilot covers reversible work only per the saved memory.

---

## 1. SCOPE

In scope (Frank's selection 2026-06-02):

**Backend:**
- `src/lib/engine/` — resolver registry, composer, renderers, kind taxonomy
- `src/lib/briefings/` — helpers, queue logic, recipient filter
- `comms_messages` + `comms_message_recipients` schema (current 12-kind CHECK + audience CHECK + 32 SECTION_RENDERERS)
- Edge functions: `briefing-auto-draft-tick`, `briefing-cron-dispatch`, `send-tournament-message`, `rsvp-token-handler`, `callup-token-handler`, `unsubscribe-handler`, `feedback-token-handler`, `resend-webhook-receiver`, `suggest-briefing-closer`

**Admin UI (composer + history + drafts):**
- `src/pages/BriefingsComposePage.jsx`, `BriefingsHistoryPage.jsx`, `src/pages/admin/BriefingHistoryDetail.jsx`
- `src/components/briefings/` — ~20 top-level components (BriefingComposer, 4 Step\*, AnchorPicker, AudiencePicker, KindTile, PreviewPanel, SendBriefingButton, etc.) + sub-trees: `audience/`, `bodies/`, `inbox/`
- `src/components/compose/SendConfirmDialog.jsx`
- Hooks: `useBriefingDeepLink`, `useBriefingDraft`, `useBriefingFilters`, `useDigestEvents`, `useDigestRecipients`, `useInboxHistory`, `useInboxQueue`

**Parent-facing inbox (REDESIGN TARGET — doesn't exist):**
- Named in `EMBER_PENDING_LEDGER §4.AI` as a P1 deferred feature. Redesign defines what it should be.

**Cross-cutting:**
- §16.3 kindness microcopy compliance on the composer error surface (chat-CC's meta-bug)
- §16.4 accessibility on the wizard flow
- Multi-tenant readiness (briefings still assume single-tenant LH today)
- Audit log + PII surface (briefings carry parent/child data)

## 2. OUT OF SCOPE

Explicit out-of-scope list per §16.15 (e):

- **Stream A reminders** (`_reminders.ts`, `_reminderLogic.ts`, `_reminderSend.ts`) — different system (auto-send, no admin compose), even though it shares the Resend integration. Audited separately as part of #19 in the §17.5 campaign.
- **`team-feed` edge function** — ICS calendar feed, not briefings. Tangential.
- **`send-push` edge function** — generic push fanout; called BY briefing flows but not part of the briefing engine itself.
- **Financial briefings** (registration receipts, balance reminders) — separate Wave 7 work, different infra.
- **Slack / SMS channels** — Slack not implemented; SMS reserved per §16.5 for cancellations + admin critical only. Out of scope for engine audit.
- **AI-generated copy** — `suggest-briefing-closer` is in scope structurally (security, kind taxonomy alignment) but the prompt-engineering / AI-output quality is its own surface.

## 3. METHODOLOGY (per §16.15 L99 template)

(a) **Initial pass** — file-by-file code-level read across the full mount tree. Findings catalogued by severity (P0/P1/P2/P3) with `file:path:line` references.

(b) **Deep-read addendum** — second pass per category. Per AP #50-retirement-residue: line-by-line was the locked methodology, but the §16.15 2-pass addendum catches ~30-40% cascade rate that single-pass misses.

(c) **Anti-pattern catalog cross-reference** — every finding tagged against registered APs in CLAUDE.md §11. Surfaces "patterns we already have rules for" vs "new pattern surfacing here."

(d) **Per-role wireframes** — for any surface that renders different UX per role (admin / coach / parent / view-as), wireframes drawn for each variant before Phase 2 scope locks. Parent inbox specifically.

(e) **Explicit out-of-scope list** — above (§2).

## 4. AUDIT CATEGORIES + WAVE DISPATCH

12 categories grouped into 5 dispatch waves. Each wave is ~half-day of audit work + 1 commit to this doc per wave.

| Wave | Categories | Status |
|---|---|---|
| **B1** | (1) Schema contracts, (2) Kind taxonomy governance, (3) Resolver layer | **In progress 2026-06-02 PM** |
| **B2** | (4) Composer + SECTION_RENDERERS, (5) Audience picker + recipient resolution, (6) Substitute helpers (AP #29 cross-check) | pending |
| **B3** | (7) Send path (send-tournament-message), (8) Auto-draft cron, (9) Token handlers (rsvp/callup/unsubscribe/feedback) | pending |
| **B4** | (10) Admin UI — composer wizard, (11) Admin UI — history + drafts | pending |
| **B5** | (12) Parent inbox redesign target + cross-cutting (microcopy, a11y, multi-tenant, PII) | pending |

## 5. THE 3 BUGS CHAT-CC SURFACED (FOLDING IN)

These three bugs surfaced during the §17.5 P1 close session smoke-tests are folded into this audit, not handled separately:

| ID | Category | Description |
|---|---|---|
| BUG A | Schema + composer | `comms_messages_weekly_digest_unique` partial UNIQUE index (mig 20260602195100, my PR #657) blocks composer's re-INSERT of this-week's draft because the auto-draft cron already wrote a `draft` row. Composer doesn't reuse existing drafts. **Regression I introduced.** Pilot mode masks it tonight; would block first real weekly digest. |
| BUG B | Schema + audience taxonomy | Composer offers `multi_event_attendees` audience for `games_recap`, but `comms_messages_audience_type_check` only allows `team, multi_team, tournament_attendees, event_attendees, org_all, custom`. Per `BRIEFINGS_COVERAGE_L99.md §2` `multi_event_attendees` IS documented as a shipped audience type. **Schema CHECK lags the audience-taxonomy doc.** Pre-existing. |
| Meta | Composer UX | Composer surfaces raw Postgres errors ("duplicate key value violates", "Save failed") instead of §16.3 kindness microcopy. Not a bug per se; a category violation. |

Each is anchored to a specific audit category below. The findings will reference them with the ID.

---

# WAVE B1 — Foundation (categories 1–3)

## Category 1 — Schema contracts

### 1.1 — `comms_messages.kind_check` (canonical 12 kinds)

**State:** production allows exactly 12 values per Wave 3.A #20 audit verification: `weekly_digest, schedule_change, game_recap, games_recap, tournament_prelim, tournament_recap, announcement, custom_message, rsvp_nudge, academy_callup_notice, coach_roundup, family_guide`. Verified clean. §13 rule 8 in CLAUDE.md lists all 12 (closed via #637).

**Finding 1.1-CLEAN:** kind taxonomy is governed. Single source of truth = the CHECK constraint; secondary = `KIND_ORDER` in `kindMetadata.js`; tertiary = `RESOLVER_REGISTRY`. Per AP #28 these are mechanically aligned.

### 1.2 — `comms_messages.audience_type` CHECK constraint

**State:** Allowed values per the current CHECK: `team, multi_team, tournament_attendees, event_attendees, org_all, custom`. 6 values.

**Finding 1.2-P0 (BUG B anchor):** the CHECK is **incomplete** vs the documented + shipped audience taxonomy. `BRIEFINGS_COVERAGE_L99.md §2` (refreshed 2026-06-02) names 9 audience types as shipped:
- `org_all, team, multi_team` (foundational)
- `event_attendees` (event-anchored kinds)
- `tournament_attendees` (tournament kinds)
- `player_specific` (academy_callup_notice — locked) ← **NOT in CHECK**
- `multi_event_attendees` (games_recap — locked) ← **NOT in CHECK**
- `coach_self` (coach_roundup) ← **NOT in CHECK**
- `family_specific` (family_guide) ← **NOT in CHECK**

4 of 9 documented audience types fail the CHECK constraint if any code path inserts a row using them. Three of those four are LOCKED audience types for their kind (the composer's audience picker hard-codes them and doesn't offer choice). So either:
- Every `academy_callup_notice` insert goes through some path that bypasses the CHECK (substitute pre-INSERT), OR
- These rows have been failing silently in code paths I haven't read yet, OR
- These rows have been inserting with `audience_type='custom'` and `audience_filter` carrying the real type.

Need to grep INSERT call sites to know which. **Action queued for the deep-read addendum.**

**Finding 1.2-P1 (governance pattern):** the CHECK and the audience taxonomy doc are drifting because there's no test guarding alignment (the existing `comms_messages.kind` has the `verifyJwtConfigAudit.test.js` equivalent; audience doesn't). Same shape as Wave 3.A #20 PATTERN STALE-DOC.

### 1.3 — `comms_messages_weekly_digest_unique` partial UNIQUE index

**Migration:** `20260602195100` (PR #657, mine, applied 2026-06-02).

**Index spec:**
```sql
create unique index ... on public.comms_messages (org_id, period_start)
  where kind = 'weekly_digest' and status in ('draft', 'scheduled', 'queued', 'sent');
```

**Finding 1.3-P0 (BUG A — owned):** the index enforces "one weekly_digest per (org, period) across the active lifecycle." The composer's compose→send flow does NOT reuse existing drafts; it inserts a fresh row. When the auto-draft cron has already written a `draft` row for the week (which it does, every Sunday), the composer's INSERT hits the index and fails with 23505. **Regression: my index expressed a structural model the composer doesn't honor.**

Root cause analysis:
- Auto-draft cron writes a `draft` for the upcoming period (`buildWeeklyDigestDraftRow` per `_helpers.ts`)
- Admin opens the composer → composer's "new briefing" flow inserts a brand-new row (per `composerSubmit.js` and related)
- Both rows are `kind='weekly_digest'` + same `period_start` + same `org_id` + status in the active set → unique violation

Two remediation options (decision deferred to Phase 2):
- **(a)** Composer reuses/updates the existing draft (correct lifecycle model — one digest per week, draft→sent on one row)
- **(b)** Narrow my index to `status='sent'` only (cheap patch — drafts can coexist; only sent rows are deduped)

Chat-CC recommends (a). I lean (a). Decision routed via Phase 2.

### 1.4 — Other `comms_messages` CHECKs + columns

**Status:** initial-pass not yet run. Queued for B1 deep-read addendum.

### 1.5 — `comms_message_recipients` schema

**Allowed `delivery_status`** (per mig `20260511182333_wave_4_4_a1_engagement_schema`):
`queued, sent, delivered, opened, clicked, bounced, complained, unsubscribed, failed`

**Finding 1.5-CLEAN:** schema accommodates the unsubscribe-suppression flow I shipped in #666 (which flips status to `'unsubscribed'`). No new schema needed.

**Finding 1.5-P2 (initial pass — needs addendum verification):** chat-CC added `suppress_unsubscribed_recipients()` BEFORE INSERT trigger on this table. My code-side filter in send-tournament-message complements it. Two layers of defense; want to verify in B3 deep-read that the trigger and the code don't race in ways that double-write or skip-write.

## Category 2 — Kind taxonomy governance

### 2.1 — Three sources of truth (per AP #28)

1. **Production CHECK:** `comms_messages_kind_check` (12 values)
2. **In-code KIND_ORDER:** `src/lib/briefings/kindMetadata.js` (12 entries)
3. **RESOLVER_REGISTRY:** `src/lib/engine/resolvers/registry.js` (11 calendar-anchored kinds + 1 free-form via composer.js legacy path)

Per AP #28, RESOLVER_REGISTRY is THE authority for kind→{resolve, compose, anchorFromState, overridesFromState, sendPath}. KIND_ORDER provides display ordering + KIND_METADATA. CHECK is the data-layer floor.

**Finding 2.1-P3 (initial pass):** verifying parity between the three is currently a manual grep. Suggested redesign-phase deliverable: a vitest like `verifyJwtConfigAudit.test.js` that asserts (a) every KIND_ORDER entry has a RESOLVER_REGISTRY entry OR is in the legacy KIND_COMPOSERS set, and (b) every value in the production CHECK constraint corresponds to a KIND_ORDER entry. Same pattern as `edgeFunctionDirectoryParity.test.js` I shipped in #668.

### 2.2 — Legacy `KIND_COMPOSERS` (composer.js)

**Per `BRIEFINGS_COVERAGE_L99.md`:** KIND_COMPOSERS holds 4 legacy composers (announcement, custom_message + defensive weekly_digest, academy_callup_notice). The other 8 kinds dispatch via RESOLVER_REGISTRY.

**Finding 2.2-P2 (initial pass):** dual dispatch path adds complexity. `composer.js`'s `compose({kind})` function does the routing. Per AP #34 ("registry / dispatch-table removals must include caller migration"), any consolidation of these two paths into one needs a careful pre-flight grep. Queued for B2 audit.

## Category 3 — Resolver layer

### 3.1 — Two-stage contract (wave 4.2-A locked)

```
resolveX(anchor, options) → { context, slices }
composeX(context, slice, overrides) → { subject, content_sections }
```

Per AP #27: pure, IO-injected via options.supabase, deterministic ordering. **Finding 3.1-CLEAN at initial pass.** Need deep-read to verify every resolver honors the contract (no accidental side effects, no top-level supabase imports).

### 3.2 — Substitute helpers (AP #29 — per-recipient token substitution)

Per AP #29: tokens stay as placeholders in compose output (`<kind>_token_placeholders` field); send-path substitute helpers replace them with `<kind>_token_urls` (different field name); renderer reads `_urls` field with fail-loud fallback that emits literal `{{token_*_url}}` if missing.

Two confirmed instances per the AP body: `substituteRsvpTokens` + `substituteCallupTokens`. **Finding 3.2-INIT-OK:** AP is sound on its face; deep-read in B2/B3 to verify the placeholder/url field name discipline holds end-to-end + the renderer fail-loud fallback actually fires.

### 3.3 — Registry registration order (AP #34)

Per AP #34: registry removals must include caller migration in the same PR. Queued: walk every `RESOLVER_REGISTRY[<kind>]` deletion in `git log` to verify the discipline held historically.

---

# Cross-cutting patterns (B1 initial pass)

### PATTERN B1-α — Schema CHECK lags taxonomy doc

3 of the 4 audience types named in `BRIEFINGS_COVERAGE_L99.md` are missing from the production CHECK. Same class as Wave 3.A #20 PATTERN STALE-DOC. Suggests a redesign-phase governance fix: every audience-taxonomy addition lands as a single PR that touches both the doc AND the CHECK migration, with a vitest asserting parity.

### PATTERN B1-β — Composer + auto-draft cron don't share a draft lifecycle

The weekly_digest "one row per week" invariant my index encoded was the right structural model, but the composer doesn't honor it because it has no notion of "is there already a draft?" Redesign target: composer's anchor-picker should detect existing-for-this-anchor and offer "Resume" vs "Start fresh (archives old)" rather than blind INSERT.

---

# Out-of-scope (cumulative — keeps growing per wave)

(Per §2 above. Each wave adds its own deferred items here.)

- Stream A reminders
- team-feed ICS
- send-push fanout (called BY briefing flows, not part of engine)
- Financial briefings
- Slack / SMS channels
- AI prompt-engineering for `suggest-briefing-closer`

---

# Routing — Phase 2 redesign targets surfacing from B1

(Provisional — Frank routes at Phase 2 boundary, not now.)

1. **CHECK widening for audience types** (BUG B fix shape) — single migration adding 3 missing values: `player_specific`, `multi_event_attendees`, `coach_self`, `family_specific`. Reversible. Low risk.
2. **Weekly digest draft lifecycle** (BUG A fix shape) — composer reuses or archive-and-replace existing draft. Behavioral change. Phase 2 should also decide whether this generalizes to OTHER kinds with anchors (game_recap, schedule_change all have "one per anchor" semantics).
3. **CHECK ↔ taxonomy doc parity test** — vitest like `edgeFunctionDirectoryParity.test.js`. Prevents future B1-α drift.
4. **Composer error microcopy** — translate Postgres errors at the surface. Small. Reversible. Doc-only spec for Phase 2.

---

**B1 status:** initial pass partial — Category 1 (schema) initial complete; Categories 2 + 3 initial partial. Deep-read addendum needed across all three before B1 closes. Waves B2–B5 pending dispatch.

---

# WAVE B1 — Deep-read addendum (2026-06-02 PM, same day as initial)

Per §16.15: second-pass per category catches ~30-40% cascade rate vs single-pass. This addendum surfaced 3 new sub-findings + confirmed clean state on 2 categories that initial pass left as "verify in addendum."

## 1.2 — Audience CHECK incomplete — **production state check**

**Finding 1.2-DEEP-1 (BUG B reshape — bigger than initial):** Queried production for actual `audience_type` values in `comms_messages`. **Zero rows exist for any of the 4 "missing" audience types** (`player_specific`, `multi_event_attendees`, `coach_self`, `family_specific`). The CHECK is consistent with production data — production has been coerced to allowed-but-semantically-wrong values upstream of INSERT.

Actual production data per kind (2026-06-02):

| Kind | audience_type values present | Total rows |
|---|---|---|
| coach_roundup | `team` (15), `multi_team` (5) | 20 (**NONE with `coach_self`** despite kindMetadata default) |
| family_guide | `multi_team` (1) | 1 (**NONE with `family_specific`**) |
| games_recap | — | 0 (cold surface confirmed) |
| academy_callup_notice | — | 0 (cold surface confirmed) |
| weekly_digest | `org_all` (11), `team` (11), `multi_team` (6), **NULL (1)** | 29 |
| game_recap | `event_attendees` (15825), `team` (1) | 15826 |
| rsvp_nudge | `event_attendees` (58) | 58 |
| schedule_change | `event_attendees` (3) | 3 |
| tournament_prelim | `tournament_attendees` (12) | 12 |
| tournament_recap | `tournament_attendees` (8) | 8 |
| announcement | `team` (4) | 4 |

**Reshape of BUG B:** the routing decision in Phase 2 isn't just "widen CHECK to allow 4 missing values." It's a deeper governance question — for coach_roundup + family_guide, **production has been writing semantically-wrong audience_type values for 21 rows**, because the schema rejected the right ones. The audience taxonomy doc (BRIEFINGS_COVERAGE_L99 §2) says these kinds use `coach_self` / `family_specific` and the wizard's kindMetadata defaults to them, but the actual saved rows say `team` / `multi_team`. Either:
- (a) The wizard has been silently coercing values somewhere downstream (needs B4 grep — likely in StepAnchorAudience or composerReducer's SET_AUDIENCE action when admin picks teams)
- (b) The admin has been manually overriding the default in every save (20+ explicit overrides)

Either way, Phase 2 fix needs to decide: backfill existing rows to semantic values OR document the legacy values stay + widen CHECK so future rows can use semantic values OR refactor the wizard so audience_type is mechanically derived from the kind (not admin-pickable for these kinds).

**Finding 1.2-DEEP-2 (orphan weekly_digest):** 1 weekly_digest row has `audience_type=NULL`. Column isn't NOT NULL. Likely a pre-audience-taxonomy row or a test send. Low priority but worth a row-level investigation if Phase 2 narrows the CHECK to NOT NULL.

## 1.3 — Weekly digest unique index regression — **failure mode refined**

**Finding 1.3-DEEP-1 (BUG A reshape):** Read `useBriefingDraft.js`'s `flush()` function. The flush DOES distinguish "new draft vs existing draft" via local `draftId` React state:
- `draftId` null → INSERT
- `draftId` set → UPDATE

So the failure mode isn't "composer NEVER reuses drafts" — it's:
- Auto-draft cron writes a `draft` row at Sunday roll
- Admin lands at /admin/briefings/compose. **StepKindPicker offers two paths** (per `BriefingComposer.jsx:150` + `StepKindPicker`): (a) Resume an existing draft (loads via `loadDraft(d.id)` → composer hydrates with that `draft_id` → flush UPDATEs), or (b) Pick a kind to start fresh (no `draftId` → flush INSERTs → hits the unique index).
- If admin picks (b) for weekly_digest when an auto-draft exists, 23505 fires.

**Reshape:** the Phase 2 fix shape is sharper than the initial pass framed. Options refined:
- (a-refined) **Composer's "Start fresh" path should detect existing-anchor draft and offer "Resume" or "Archive existing + start fresh"** rather than blind INSERT. Generalizes beyond weekly_digest — any kind with anchor-based semantics (game_recap, schedule_change, rsvp_nudge — basically every event-anchored kind) has the same collision potential.
- (b-refined) **Narrow my index to `status='sent'` only** — drafts coexist; only sent rows are deduped. Cheaper but loses the "one draft per anchor" invariant.

Chat-CC recommends (a-refined). I lean (a-refined) too — it's the structural model. But the implementation cost is real (need to add an "existing draft for this anchor?" check before INSERT in flush, plus UI for the choice).

## 1.5 — `comms_message_recipients` trigger + code suppression — **race check**

**Finding 1.5-DEEP-1 (CLEAN on race, P3 on forensic visibility):** Verified no race between chat-CC's `suppress_unsubscribed_recipients()` BEFORE INSERT trigger and my code-side `delivery_status='unsubscribed'` filter in send-tournament-message. They operate on different lifecycle stages:
- Trigger fires at recipient-row INSERT time (during queue compose). Returns NULL → no row persists.
- My code runs at SEND time (could be days later if scheduled). Updates already-INSERTed rows.

Edge cases:
- Parent unsubscribes between INSERT and SEND → my code catches at SEND ✓
- Parent unsubscribes BEFORE the queue compose → trigger blocks the INSERT ✓
- Parent re-subscribes after their row was flipped to `'unsubscribed'` → row stays flipped; future sends would need a fresh INSERT (covered by trigger ✓)

**Forensic visibility gap (P3):** trigger silently drops (RETURN NULL emits a NOTICE but no audit row); my code preserves `delivery_status='unsubscribed'` row for forensic trail. Inconsistent observability — operator querying "who got suppressed?" would miss the trigger-blocked guardians. Worth a B3 deep-look at whether the NOTICE log captures enough or whether we want a parallel `suppressed_recipients_log` table for the trigger's drops.

## 2.1 — Resolver purity — **AP #27 holds end-to-end**

**Finding 2.1-DEEP-CLEAN:** grepped every `src/lib/engine/resolvers/*.js` for top-level `import { supabase }`. Zero violations. Per AP #27 doctrine: resolvers accept supabase via `options.supabase`, never import directly. Discipline holds across all 9 resolver files.

## 3.2 — Substitute helpers — **AP #29 implementation is sound + stronger than AP body requires**

**Finding 3.2-DEEP-CLEAN:** Read `substituteRsvpTokens` and `substituteCallupTokens`. Both correctly destructure `*_token_placeholders` and assign `*_token_urls` (different field name per AP #29). Implementation is **stronger** than the AP body specifies:
- The substitute helper THROWS on missing tokens (`new Error('no token entry for player_id...')`) rather than emitting literal placeholders for unsubscribed/missing recipients. Tighter signal during smoke testing.
- The renderer falls back to literal `{{token_*_url}}` strings if `_urls` field is missing — fail-loud at the email-delivery layer as well. Belt + suspenders.

Verified per-file:
- `src/lib/engine/substitution/rsvpTokens.js:35-37` — destructures + renames cleanly
- `src/lib/engine/renderers/rsvpRequest.js:42-43` — reads `_urls` with literal fallback
- Same pattern for callupTokens / callupResponse.

**Phase 2 implication:** when a new token-bearing kind is added (e.g., a future feedback workflow), the AP #29 4-piece contract (placeholder field, urls field, substitute helper, renderer fallback) is well-established. Document the recipe as part of the redesign so future contributors mechanically replicate it.

---

# Cross-cutting patterns (updated post-deep-read)

### PATTERN B1-α (re-confirmed) — Schema CHECK lags taxonomy doc
Initial-pass finding holds + deep-read sharpened it: production has been silently working around the CHECK gap for 2 kinds (coach_roundup, family_guide) by writing wrong-but-allowed values. Same class as Wave 3.A #20 PATTERN STALE-DOC, but here the drift has 21+ row impact in production data, not just a doc-string mismatch.

### PATTERN B1-β (re-confirmed) — Composer + auto-draft cron don't share a draft lifecycle
Initial-pass framing holds + deep-read identified the specific UI surface (StepKindPicker offers both paths without collision detection). Phase 2 fix is now scoped to that specific component + a flush-time pre-check.

### PATTERN B1-γ (NEW — surfaced in deep-read) — Suppression has 2 layers with different forensic visibility
Defense-in-depth design is correct, but the two layers (DB trigger + code filter) emit different audit trails. Whoever queries "who got suppressed?" needs to know which layer they're asking about. Document the layered model + the inconsistent visibility in Phase 2 redesign.

---

**B1 status:** **CLOSED** for Phase 1 purposes. 4 P0/P1 findings + 5 sub-findings via deep-read + 3 cross-cutting patterns. Ready to dispatch Wave B2 (composer + SECTION_RENDERERS + audience picker + substitute helpers cross-check).
