# Briefings — Full Audit + Redesign Arc

**Started:** 2026-06-02 PM
**Operator:** Frank
**Driver:** terminal-CC (with mechanical pause gates per memory `autopilot-overreach-on-decisions-and-irreversible-ops`)
**Cross-reference:** `BRIEFINGS_COVERAGE_L99.md` (the existing coverage doc, refreshed 2026-06-02 in #656), `CLAUDE.md §13` (HTML rules), `CLAUDE.md §16.5` (notification cadence), `CLAUDE.md §16.15` (L99 redesign template — methodology source)

## LANE SPLIT — code-read (terminal-CC) + live-state (chat-CC)

Per §16.15, a full L99 audit needs both halves. This doc consolidates them.

| Lane | Owner | Approach | Deliverable |
|---|---|---|---|
| Code-read | terminal-CC | File-by-file mount-tree read; AP cross-reference; resolver/composer/renderer flow tracing | This doc, Wave B1–B5 |
| Live-state | chat-CC | Supabase / Vercel / GitHub MCP queries; production row counts; live send-attempt mapping; advisor checks | Seed doc via PR #673 (this doc references its findings under "Wave B1 — Live-state seed") |

Both halves shipped as separate PRs (#672 mine; #673 chat-CC's seed) to preserve authorship + lane-attribution per AP #49. The PRs merge separately; this consolidated doc is the canonical reference and references chat-CC's seed by section.

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

(f) **Standing instruction — cross-kind query discipline (lessons collapsed: pilot mode + players.notes).** For any cross-kind concept the briefing engine exposes (pilot recipient resolution, audience derivation, error microcopy, preview dispatch, send-path retries, substitute helpers, anchor resolution), the audit MUST query the **live implementation per kind** (MCP or grep against the per-kind callsite, not the abstraction name) and check for divergence — before assuming the concept is implemented once or that the abstraction's name reflects per-kind reality. Rationale: cross-kind concepts are the failure surface this audit exists to map; assuming uniformity from naming is the exact mechanism that produced both the `players.notes` phantom-column miss (Wave 3 §17.5) and the pilot-mode miss (Wave B1 GAP-1). Verify per-kind reality against the live system; don't infer from the abstraction.

(g) **Symptom signature vs mechanism — keep them separate.** When the audit identifies a PATTERN A (or any AP-class symptom) instance, tag it as the symptom signature (verified by the contradiction's existence). DO NOT promote a leading mechanism hypothesis to settled root cause without test. PATTERN A has at least four candidate mechanisms behind any given instance: (i) per-kind wiring, (ii) shared helper with kind-specific parameter wrong in some callers, (iii) two helpers correct at write-time that drifted, (iv) one path is intended behavior + other is the bug. Each redesigns differently. The deep-read addendum tests which mechanism produced the divergence; if it reads to confirm a presumed mechanism, it isn't doing the §16.15 addendum's job.

## 4. AUDIT CATEGORIES + WAVE DISPATCH

12 categories grouped into 5 dispatch waves. Each wave is ~half-day of audit work + 1 commit to this doc per wave.

| Wave | Categories | Status |
|---|---|---|
| **B1** | (1) Schema contracts, (2) Kind taxonomy governance, (3) Resolver layer | **In progress 2026-06-02 PM** |
| **B2** | (4) Composer + SECTION_RENDERERS, (5) Audience picker + recipient resolution, (6) Substitute helpers (AP #29 cross-check) | pending |
| **B3** | (7) Send path (send-tournament-message), (8) Auto-draft cron, (9) Token handlers (rsvp/callup/unsubscribe/feedback) | pending |
| **B4** | (10) Admin UI — composer wizard, (11) Admin UI — history + drafts | pending |
| **B5** | (12) Parent inbox redesign target + cross-cutting (microcopy, a11y, multi-tenant, PII) | pending |

## 5. BUGS SURFACED VIA LIVE-STATE SMOKE-TESTS (FOLDING IN)

Bugs surfaced via the §17.5 P1 close session smoke-tests + chat-CC's live-state seed (PR #673) are folded into this audit, not handled separately. **Bug list grew in the consolidation pass** as chat-CC's six send-attempt sweep added BUG C and reframed BUG A's fix-shape:

| ID | Category | Description |
|---|---|---|
| BUG A | Schema + composer | `comms_messages_weekly_digest_unique` partial UNIQUE index (mig 20260602195100, my PR #657) blocks composer's re-INSERT of this-week's draft because the auto-draft cron already wrote a `draft` row. Composer doesn't reuse existing drafts. **Regression I introduced.** Pilot mode masks it tonight; would block first real weekly digest. **Phase 2 fix-shape:** chat-CC leans narrow-predicate (drop `'draft'` from the index; only sent dedup) — minimal, reversible, touches only weekly_digest; my B1-DEEP-1 framed composer-reuse — structurally correct, generalizes beyond weekly_digest, but bigger blast radius. Both valid; Frank routes. |
| BUG B | Schema + audience taxonomy | `comms_messages_audience_type_check` only allows `team, multi_team, tournament_attendees, event_attendees, org_all, custom`. Per `BRIEFINGS_COVERAGE_L99.md §2`, 4 additional audience types are shipped: `player_specific`, `multi_event_attendees`, `coach_self`, `family_specific`. Live-state impact (chat-CC §2 + my §1.2-DEEP-1): `games_recap` has **never sent** (multi_event_attendees-locked, fails CHECK); coach_roundup + family_guide have **21 rows with semantically wrong values** silently coerced. |
| BUG C | Composer ↔ preview gap | Composing `rsvp_nudge` returns "No engine composer for kind 'rsvp_nudge'. Supported kinds: academy_callup_notice, weekly_digest, announcement, custom_message." The wizard offers `rsvp_nudge` (and likely other registry-dispatched kinds), but the preview panel only knows 4. Ties to AP #28 (RESOLVER_REGISTRY vs legacy KIND_COMPOSERS dual-path). **Surfaced by chat-CC PR #673 §4; folded as Wave B2 deep-read target on the preview surface + composer dispatch.** |
| BUG D | Pilot mode (**AP #63 instance — PATTERN A extended to send-path recipient resolution; symptom verified, mechanism is the hypothesis the audit tests**) | Two pilot-mode implementations exist. **Digest path:** `get_digest_recipients(org, p_pilot_only=true)` REDIRECTs to 5 synthetic rows addressed to `pilot_test_recipient_email`. Tournament + weekly_digest paths use this. **Per-event/team/nudge paths:** filter on `guardians.is_pilot_family`, which has **0 rows in production** → returns 0 → "No recipients available." Exactly the PATTERN A shape ("the recipient set for a pilot send" = ONE concept computed two divergent ways producing contradictory truths) — extended from AP #63's render-layer examples to the behavioral / recipient-resolution layer. **Mechanism hypothesis (NOT settled):** Phase 1 leading guess is per-kind wiring (concept implemented separately per send path). Alternative mechanisms the deep-read must rule in or out: (b) shared helper called with kind-specific parameter wrong in some callers, (c) two helpers correct at write-time that drifted, (d) one of the two paths is the intended behavior + the other is the bug (e.g., `is_pilot_family` was the original mechanism and the digest REDIRECT was added later without retiring the filter). Each redesigns differently. Deep-read in Wave B2 must test which. **Surfaced by chat-CC PR #673 §3; I missed this in B1 deep-read — owned in §GAP-1.** |
| Meta | Composer UX | Composer surfaces raw Postgres errors ("duplicate key value violates", "Save failed") instead of §16.3 kindness microcopy. Not a bug per se; a category violation. |

Each is anchored to a specific audit category below. The findings will reference them with the ID.

## 6. LIVE-STATE SEED — chat-CC half (PR #673)

Per the lane split above, chat-CC's seed doc captures the production-truth half: live row counts, live send-attempt mapping, advisor checks. **This audit doc references its findings rather than duplicating them; the seed doc IS canonical for live-state.** Cross-reference index for B1 scope:

| chat-CC seed § | Topic | This doc folds at |
|---|---|---|
| §0 Headline (mature vs newer kinds split) | Tournament kinds work end-to-end; newer kinds half-wired | Cross-cutting PATTERN B1-δ (NEW) |
| §1 BUG A live state | Live rows: draft `d83347c7` + sent `2f3a3dba` collide on current week | §1.3-DEEP-1 (validates the failure mode I derived from code) + BUG A fix-shape routing (chat-CC narrow-predicate vs my composer-reuse) |
| §2 BUG B live state | `multi_event_attendees` missing — games_recap never sent | §1.2-DEEP-1 (matches my deep-read; chat-CC adds the never-sent confirmation) |
| §3 Pilot mode (REDIRECT vs FILTER) | Two implementations, count proof: 5 vs 0 | **§GAP-1 (NEW — missed in my B1)** |
| §4 BUG C preview composer gap | rsvp_nudge offered but preview unsupported | Wave B2 dispatch (preview surface deep-read) |
| §5 Meta — raw DB errors | 23505 + 23514 reach admin verbatim | Wave B4 (composer error microcopy) |
| §6 Side flag — game_recap 15,770 rows | 15,759 trigger-created, mostly archived/empty | §Out-of-Scope §S-1 (NEW — flagged but explicitly out of redesign scope) |
| §7 Code-read half pending | What chat-CC's seed does NOT cover | This doc (lane split delivers) |

**Verification stance:** I have not independently re-run chat-CC's MCP queries (no need; the seed doc is the production-state source of truth per the lane split). For B1's specific live-state claims I rely on the seed; for any divergence I'd MCP-verify before Phase 2 routing.

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

### PATTERN B1-δ (NEW — surfaced in consolidation pass via chat-CC seed §0) — Cross-kind concept divergence on the behavioral layer (AP #63 / PATTERN A extension)

**Symptom signature (verified):** Tournament kinds got the mature path (digest-style synthetic-redirect pilot, full preview support, end-to-end working send). Newer kinds (rsvp_nudge, games_recap, family_guide, coach_roundup) each diverged on one or more axes: pilot resolution, preview support, audience-type coercion. The pattern is the behavioral-layer manifestation of AP #63 / PATTERN A — same concept (pilot recipient set, preview support, audience derivation) implemented divergently across surfaces, contradictory truths emerging. **This part is settled by the live-state evidence + AP #63 doctrine.**

**Mechanism (HYPOTHESIS — what the deep-read tests):** the leading Phase 1 guess is "per-kind wiring instead of once-and-for-all" — that is, each concept was implemented separately per kind. But PATTERN A doctrine names at least four candidate mechanisms behind any given instance, and Phase 2 redesign differs depending on which:
- **(i) Per-kind wiring** — concept literally implemented N times, once per kind. Redesign = unify into one mechanism every kind uses.
- **(ii) Shared helper, kind-specific parameter wrong in some callers** — concept implemented once but callers pass divergent inputs. Redesign = fix the bad callers + add an invariant test.
- **(iii) Drifted siblings** — concept implemented in two helpers correct at write-time that diverged through edits over time. Redesign = pick one, retire the other, with a parity test going forward.
- **(iv) One path is the intended behavior + the other is the bug** — e.g., `is_pilot_family` was the original mechanism and the digest REDIRECT was added later without retiring the filter (or vice versa). Redesign = retire the wrong path; no unification needed.

**Phase 2 redesign center-of-gravity is conditional** on which mechanism the deep-read confirms. Wave B2 must test which (per the standing instruction in §3.f + the symptom-vs-mechanism rule in §3.g). DO NOT promote per-kind-wiring to settled root cause based on initial framing alone.

**Production tilt (chat-CC, PR #673 post-consolidation) — ranks the four candidates without settling.** The production signals tilt the priors without picking; naming the tilt + its falsifiable tests is the opposite of read-to-confirm.

- The digest REDIRECT is the **more-designed, newer-looking** path: override + synthetic-CTE, per-team inbox labels, structured for kind-extension.
- The `is_pilot_family` filter is the **cruder** path: a boolean on `guardians` checked at the recipient query.
- `guardians.is_pilot_family` count = **0 in production**. Nobody maintains those flags. Corroborates that the filter was **abandoned**, not actively used.

Together those signals lean toward a **(iv)→(i) blend**: the REDIRECT was the intended universal mechanism; the digest path adopted it; the event/team/nudge paths are **un-migrated stragglers still on the deprecated filter**. If that's the actual mechanism, the redesign is "migrate the stragglers to the existing redirect + delete the filter" — *smaller* than a from-scratch unification, because the target mechanism already exists and works.

**Falsifiable tests Wave B2 runs to confirm or reject the tilt:**

1. **Migration / git history chronology** — was `get_digest_recipients` (or the synthetic-redirect CTE) introduced *after* the `is_pilot_family` filter paths were already in place? (Yes → supersession story corroborated. No / parallel introduction → likely (i) parallel-built from the start, not supersession.)
2. **Migration notes / PR descriptions / code comments** — does any artifact declare the redirect as the intended universal pilot mechanism, or note that the filter is deprecated? (Present → (iv)/(i) blend strongly supported. Absent → could still be (iv)/(i), but supersession-by-design is not yet evidenced; (i) parallel-built or (iii) drift remain live.)
3. **Writers for `guardians.is_pilot_family`** — is there any admin UI, seed script, migration, or trigger that writes to this column? (No writer + 0 rows in prod → strongly supports abandonment, consistent with supersession. A live writer → the filter is an *intended* parallel path; the supersession story is wrong and the mechanism is genuinely (i) parallel-built.)

If B2 finds a writer for `is_pilot_family` and no supersession evidence, the tilt is wrong and it's (i) parallel-built — which is why the tilt stays a prior + tests, not a Phase 1 settled call. This stays the hypothesis B2 tests.

---

# WAVE B1 — GAPS (what I missed; surfaced via consolidation pass)

## GAP-1 — Pilot mode resolution was not audited in B1

**Finding GAP-1 (owned):** B1 covered schema + kind taxonomy + resolver layer. Pilot mode resolution touches multiple files (`get_digest_recipients` SQL function in DB, `useDigestRecipients.js` hook, `briefings/recipientFilter.js`, event/team/nudge resolvers' recipient queries). I treated it as a Wave B2 audience-picker surface and didn't query production for its current implementation. Chat-CC found it because the live send-attempt sweep surfaced "No recipients available" on rsvp_nudge with `pilotOnly:true`, then MCP-queried both code paths against production counts (digest = 5, filter = 0, `guardians.is_pilot_family` count = 0).

**The discipline that would've caught it earlier** (folding into B2–B5 method): **for any cross-kind concept** (pilot resolution, audience derivation, error microcopy, preview dispatch, send-path retries), **query the live implementation per kind and check for divergence** before assuming the concept is uniformly wired. This is the operational form of AP #63 (PATTERN A) applied to audit method — same concept across surfaces is suspect until proven uniform.

**Folded into Wave B2 dispatch:** the audience picker + recipient resolution category (originally Wave B2 item 5) absorbs pilot mode as a first-class audit target with explicit production MCP queries.

---

# Out-of-scope but flagged via consolidation pass

## §S-1 — `game_recap` (singular) data bloat (chat-CC seed §6)

Production query: `game_recap` (singular, distinct from `games_recap` per §13) has **15,770 rows, 15,759 trigger-created**, nearly all archived/empty. Per chat-CC's seed §6: possible runaway trigger / data hygiene issue. **Explicitly out of scope for the briefings audit + redesign arc** but flagged for a separate data-hygiene investigation. Do not bundle into Phase 2/3 PR sequence.

---

**B1 status:** **CLOSED** for Phase 1 purposes (consolidation-pass version). 5 P0/P1 findings (BUG A/B/C/D + Meta) + 5 sub-findings via deep-read + 1 surfaced gap (GAP-1, owned) + 4 cross-cutting patterns (B1-α/β/γ/δ) + 1 out-of-scope flag (§S-1). Ready to dispatch Wave B2 (composer + SECTION_RENDERERS + audience picker + substitute helpers cross-check) — pilot mode resolution folded into B2 audience-picker category per GAP-1 discipline.

---

# WAVE B2 — Composer + SECTION_RENDERERS + audience picker + substitute helpers (in progress 2026-06-03 AM)

## B2.1 — BUG D mechanism resolution (three falsifiable tests from B1-δ run + reported)

Per the standing instruction §3.f + §3.g symptom-vs-mechanism rule + the production tilt + 3 falsifiable tests from PATTERN B1-δ. **Tests run by terminal-CC code-read 2026-06-03 AM:**

### Test 1 — Migration / git chronology
**Result: REDIRECT is newer than FILTER, but BOTH mechanisms coexist in `get_digest_recipients`.**

| Migration | Date | Effect |
|---|---|---|
| `20260509021709_digest_recipients_function.sql` | 2026-05-09 | Original `get_digest_recipients(uuid)` — no pilot mechanism |
| `20260509101739_pilot_mode_infrastructure.sql` | 2026-05-09 | Adds `guardians.is_pilot_family` column + partial index + replaces RPC with `(uuid, boolean)` overload using FILTER (`AND (p_pilot_only = FALSE OR g.is_pilot_family = TRUE)`) |
| `20260511115858_wave_4_3_i_pilot_test_recipient_email.sql` | 2026-05-11 | Adds `organization_settings.pilot_test_recipient_email` column (REDIRECT target) |
| `20260511122118_wave_4_3_i_get_digest_recipients_pilot_override.sql` | 2026-05-11 | RPC gains synthetic-row OVERRIDE branch — but **FILTER branch retained inside `real_guardians` CTE** (line 67) when override is NULL |
| `20260511123331_wave_4_3_j_per_team_synthetic_recipients.sql` | 2026-05-11 | Per-team synthetic (5 rows for LH) |

**Tilt corroborated:** REDIRECT shipped 2 days after FILTER; per-team variant another day after. **But not clean supersession** — FILTER is preserved inside the RPC as the post-override fallback.

### Test 2 — Migration notes / PR comments declaring REDIRECT universal or FILTER deprecated
**Result: REDIRECT was NEVER declared universal. The migration comment is explicit about the opposite intent.**

Migration `20260511115858` line 12–13 says verbatim:
> "Production cutover path: set pilot_test_recipient_email = NULL and flip is_pilot_family = true on real families to start sending to humans."

**This inverts chat-CC's tilt:** the intended production mechanism is the FILTER (with `is_pilot_family=true` on real pilot families); the REDIRECT was added as a **temporary end-to-end verification override** to test render + delivery without sending to real pilot inboxes. The cutover sequence is "flip override OFF + flip filter flags ON."

Production today: `pilot_test_recipient_email` IS NOT NULL (override active) + `is_pilot_family` count = 0 (cutover never happened). The system is in the **verification state**, indefinitely.

### Test 3 — Writers for `guardians.is_pilot_family`
**Result: ZERO writers found anywhere in the codebase.**

- No admin UI writer
- No seed script writer
- No migration writer (besides the schema definition with `DEFAULT FALSE`)
- No trigger writer
- No edge function writer

Real-code readers: `useDigestRecipients.js`, `tournamentPrelimHelpers.js`, `academyCallupNotice.js`, `rsvpNudge.js`, `briefing-auto-draft-tick/_reminderSend.ts`, `send-tournament-message/index.ts`.

**Implication:** the operator-flip-flags step of the documented cutover path was never built. To cut over from REDIRECT-verification to FILTER-production, an operator would need to manually `UPDATE guardians SET is_pilot_family = true WHERE ...` via SQL — there's no UI surface and no documented automation.

## B2.2 — Refined mechanism story (replaces the (iv)→(i) blend tilt with a sharper picture)

**Actual mechanism = "partial supersession that stalled in the verification stage" — closest to (iv) but with a specific structural twist.**

The true picture (synthesized from all three tests):

1. **2026-05-09:** FILTER (`is_pilot_family` flag on guardians) shipped as the intended production mechanism. Stragglers across resolvers: `academyCallupNotice.js`, `rsvpNudge.js`, `briefing-auto-draft-tick/_reminderSend.ts` ALL query `guardians`/`player_guardians` directly with `is_pilot_family` filter.

2. **2026-05-11:** REDIRECT (`pilot_test_recipient_email` synthetic-row override) added INSIDE `get_digest_recipients` RPC as an end-to-end verification mechanism. The intent (per Wave 4.3-I migration comment) was: keep FILTER as the production mechanism, layer REDIRECT on top for the verification window, cut over by flipping the override OFF and the flags ON.

3. **2026-05-11 same wave:** `tournamentPrelimHelpers.js` was migrated to use the RPC instead of bypass-querying. The code comment (`tournamentPrelimHelpers.js:56-62`) is explicit: it was a known straggler, and Wave 4.3-I fixed it because its client-side `r.is_pilot_family` filter was wiping to 0 in pilot mode.

4. **Migration incomplete:** Three other stragglers — `academyCallupNotice.js`, `rsvpNudge.js`, `briefing-auto-draft-tick/_reminderSend.ts` — were NOT migrated in Wave 4.3-I. They still bypass the RPC and apply the bare FILTER. Since `is_pilot_family` is 0 in production (cutover never happened), these paths return 0 → "No recipients available."

5. **Operator cutover step never built:** No UI or automation writes `is_pilot_family = true`. The documented cutover-via-SQL was assumed-manual-by-operator but the operator never ran it. Verification is the de-facto permanent state.

**This is not (i) parallel-built; not (iii) drift; closest to (iv) with the wrinkle that "the other path is the bug" is actually "the other path is the *unmigrated remainder* of a half-done supersession that was intended to be partial."**

## B2.3 — Two operator decisions surfaced by B2.2 (Phase 2 routing, not Phase 1 picks)

The redesign center-of-gravity is conditional on Frank's answer to one strategic decision + one tactical decision:

**Strategic decision (Phase 2.D-1):** Is the cutover from REDIRECT-verification to FILTER-production ever going to happen? Three named options:

- **(a) Yes, cut over** — finish the half-done migration: (a-i) migrate the three stragglers (`academyCallupNotice`, `rsvpNudge`, `_reminderSend`) to use the RPC so they get the override-during-verification + filter-post-cutover; (a-ii) build a UI or one-shot SQL playbook to flip `is_pilot_family=true` on real pilot families; (a-iii) flip the override OFF after step (a-ii) lands.
- **(b) No, REDIRECT-only is permanent** — the verification mechanism becomes the production mechanism: (b-i) remove the FILTER branch from `get_digest_recipients`'s `real_guardians` CTE (it never fires); (b-ii) migrate the three stragglers to use the RPC (so they get the synthetic override); (b-iii) DROP COLUMN `guardians.is_pilot_family` once stragglers are off it (irreversible — needs explicit confirm per AP #54).
- **(c) Pilot mode is itself a transient construct** — once the platform exits the pilot phase, both mechanisms are irrelevant. The system should send to all real families directly. This is the "no pilot at all" exit.

**Tactical decision (Phase 2.D-2):** Regardless of (a)/(b)/(c), the three stragglers (`academyCallupNotice`, `rsvpNudge`, `_reminderSend`) are inconsistent with the rest of the briefing engine right now. They should be migrated to use the RPC pattern for symmetry, even if (a)/(b)/(c) is unsettled. **Smaller, reversible, doc-only-Phase-2-of-the-tactical** — this could ship even without picking the strategic decision.

## B2.4 — Cross-pattern observation: PATTERN B1-δ refined

The "behavioral-layer PATTERN A" framing still holds, but the mechanism is more specific than "per-kind wiring." It's **half-migrated supersession with three unmigrated callsites**. Each redesign option (a/b/c) restores PATTERN A uniformity differently, but the IMMEDIATE fix is the same regardless: migrate the three callsites.

**Pattern lesson recorded:** "supersession migration that stalls" is a specific AP #63 sub-shape that produces the same symptom signature (divergent computations of one concept) as parallel-built. The deep-read distinguished them by chronology + writer-check + intent declarations. **Cross-kind query discipline §3.f delivered the distinction.**

---

**Wave B2 status:** B2.1–B2.4 complete (BUG D mechanism resolved). Remaining B2 surfaces queued: composer dispatch (BUG C anchor), SECTION_RENDERERS catalog walk, audience picker UI, substitute helpers cross-check.

## B2.5 — Composer dispatch architecture + BUG C mechanism resolved

**Three-tier dispatch hierarchy** (read end-to-end, mapped):

| Tier | File | Coverage | Contract |
|---|---|---|---|
| Primary (registry path) | `src/lib/engine/resolvers/registry.js:68` | 10 kinds (calendar-anchored) | `{ resolve, compose, anchorFromState, overridesFromState, sendPath }` |
| Secondary (legacy KIND_COMPOSERS) | `src/lib/engine/composer.js:20` | 4 entries — 2 defensive (weekly_digest, academy_callup_notice) + 2 actual legacy (announcement, custom_message) | `compose({ kind, data })` single-shape function |
| Tertiary (composerSubmit short-circuits) | `src/components/briefings/composerSubmit.js:83-92` | rsvp_nudge + academy_callup_notice (per-recipient token paths) | Bypasses RESOLVER_REGISTRY at the dispatch boundary, hands off to `sendRsvpNudge` / `sendAcademyCallupNotice` |

**BUG C mechanism (§5 → resolved here):** `PreviewPanel.jsx:64` gates the registry path on `sendPath === 'composerSubmit'`:
```js
const entry = sendPath === 'composerSubmit' ? RESOLVER_REGISTRY[state.kind] : null;
```

For kinds whose registry sendPath is NOT `composerSubmit` (weekly_digest = `digestSend`, rsvp_nudge = `rsvpNudgeSend`, academy_callup_notice = `academyCallupSend`), `entry` is null → falls through to `safeLegacyCompose(state.kind, data)` → `compose({ kind: 'rsvp_nudge', ... })` → KIND_COMPOSERS lookup → "No engine composer for kind 'rsvp_nudge'. Supported kinds: academy_callup_notice, weekly_digest, announcement, custom_message."

Why weekly_digest + academy_callup_notice DON'T hit this error: both are present in KIND_COMPOSERS (lines 21-22 of composer.js) as defensive entries. rsvp_nudge is NOT, because at the time wave 4.2-A-8b-b migrated rsvp_nudge to the registry path, the defensive KIND_COMPOSERS entry wasn't added.

**Two named fix shapes (Phase 2 routing — Frank's call, not Phase 1 pick):**
- **(a) Extend PreviewPanel registry-path criterion to `entry !== null`** — registry preview covers all 10 kinds. Eliminates the dual-dispatch drift risk (see B2.6). Touches 1 line in PreviewPanel.jsx.
- **(b) Add `composeRsvpNudge` to KIND_COMPOSERS** — extends the defensive-fallback pattern. Smaller diff but preserves dual-dispatch + worsens the drift surface.

(a) is structurally cleaner. (b) is the minimal patch.

## B2.6 — Known DUAL-COMPOSE drift surface (already self-documented in PreviewPanel)

**Finding B2.6-P2 (already in code):** `PreviewPanel.jsx:9-16` carries an inline comment from 2026-05-22 (Phase 3 Q5) explicitly acknowledging the drift risk:
> "DUAL-COMPOSE: PreviewPanel uses renderers/weeklyDigest.js (1-arg legacy shape) for admin preview; digestSend.js uses resolvers/weeklyDigest.js (3-arg registry shape) for actual send. Today the bodies are observationally identical because section data is invariant between paths. If a future change adds per-recipient data to the registry resolver, preview will silently drift from send."

The comment itself is the closure of an audit finding (claude.ai routing 2026-05-22). It's PATTERN A again — same concept (weekly_digest compose output) implemented in two places that are observationally identical only because the data shape is currently invariant. Phase 2 fix shape (a) from B2.5 also closes this drift: registry path becomes the single source for both preview + send.

## B2.7 — Audience picker / kindMetadata cross-check (confirms BUG B at the application boundary)

`src/lib/briefings/kindMetadata.js` is the canonical map of `kind → { defaultAudienceType, audienceLocked, ... }`. The 12 kinds + their defaults map cleanly onto the documented audience taxonomy:

| Kind | defaultAudienceType | audienceLocked | In production CHECK? |
|---|---|---|---|
| announcement | `org_all` | — | ✓ |
| schedule_change | `event_attendees` | LOCKED | ✓ |
| game_recap | `event_attendees` | — | ✓ |
| games_recap | `multi_event_attendees` | **LOCKED** | ❌ (BUG B-1) |
| tournament_prelim | `tournament_attendees` | — | ✓ |
| tournament_recap | `tournament_attendees` | — | ✓ |
| coach_roundup | `coach_self` | — | ❌ (BUG B-2) |
| family_guide | `family_specific` | — | ❌ (BUG B-3) |
| weekly_digest | `org_all` | — | ✓ |
| rsvp_nudge | `event_attendees` | — | ✓ |
| academy_callup_notice | `player_specific` | **LOCKED** | ❌ (BUG B-4) |
| custom_message | `null` | — | n/a |

**Confirms 1.2-DEEP-1 exactly:** 4 of 12 kinds have defaultAudienceType values that the production CHECK rejects. 2 of those 4 are LOCKED (games_recap → `multi_event_attendees`, academy_callup_notice → `player_specific`) — meaning the wizard hard-codes a value the schema doesn't accept. For LOCKED kinds, every send attempt has been failing at INSERT time (matches chat-CC's "games_recap has never sent" finding). For the unlocked kinds (coach_roundup, family_guide), the silent coercion to `team`/`multi_team` happens somewhere downstream — wizard SET_AUDIENCE action or composerReducer (Wave B4 target).

## B2.8 — Substitute helpers cross-check (AP #29 callsite verification — closes B1 deep-read carryover)

B1 deep-read confirmed substitute helper implementations (`rsvpTokens.js`, `callupTokens.js`) match AP #29 contract. B2 closes the callsite half:

- `src/lib/rsvpNudgeSend.js:67` — calls `substituteRsvpTokens(content_sections, tokenMap)` on each per-recipient compose output. ✓
- `src/lib/academyCallupSend.js:64` — calls `substituteCallupTokens(content_sections, tokenMap)` on each per-recipient compose output. ✓

Both bespoke send paths (NOT routed through `send-tournament-message` edge function) — meaning they don't share the unsubscribe-suppression filter chain from B1.5-DEEP-1. **Finding B2.8-P3:** unsubscribe suppression discipline for rsvp_nudge + academy_callup_notice sends needs verification in Wave B3 (do these bespoke paths also check `delivery_status='unsubscribed'`? If not, suppression is asymmetric across kinds).

## B2.9 — SECTION_RENDERERS catalog (33 entries; coverage doc says 32 — 1-off drift)

`src/lib/engine/sectionRenderers.js:51-85` registers **33 section kinds**:

`header, game_card, footer, weekly_schedule, hotel_block, ops_notes, cta_buttons, stats_narrative, signoff, schedule_change_diff, rsvp_request, callup_response, day_header, rsvp_callout, venue_list, venue_notes, logistics_line, tagline_footer, brand_footer, bracket_callout, coach_header, team_color_pill, conflict_callout, color_striped_row, event_card, callup_card, placement_block, game_log, standout_moments, coach_reflection, vip_header, kid_color_pill, quick_link_nav`

Coverage doc (`BRIEFINGS_COVERAGE_L99.md`) references "32 SECTION_RENDERERS." **PATTERN B1-α (re-fired) — schema/doc drift.** Minor. Phase 2 doc-update routine should reconcile the count.

**Orphan guard discipline (clean):** `renderSections` emits empty string for unknown kinds + DEV-mode console.warn (AP #38). No throw — composes degrade-safely if a renderer is missing.

## B2.10 — Wave B2 cross-pattern observation: dual-dispatch is the recurring structural lens

Across B2.5, B2.6, B2.7, three independent findings all reduce to the same structural lens: **the briefing engine has two dispatch tables (RESOLVER_REGISTRY + KIND_COMPOSERS) that overlap on 2 kinds (weekly_digest, academy_callup_notice) + diverge on 8 kinds.** Every drift surface in Wave B2 traces back to which table the call lands in:

- BUG C: PreviewPanel uses KIND_COMPOSERS when it could use RESOLVER_REGISTRY.
- DUAL-COMPOSE drift: preview uses KIND_COMPOSERS path; send uses RESOLVER_REGISTRY path. Two source-of-truth surfaces for the same compose output.
- Defensive entries in KIND_COMPOSERS (weekly_digest, academy_callup_notice): meant as belt-and-suspenders but enabling the drift.

**Per AP #34** (registry / dispatch-table removals must include caller migration): consolidating to a single dispatch is non-trivial. The right Phase 2 question isn't "fix BUG C" but "is the dual-dispatch a structural liability worth retiring?" — which routes BUG C, B2.6 drift, and the broader registry hygiene together.

---

**Wave B2 status (updated):** B2.1–B2.10 complete (BUG D mechanism + BUG C mechanism + DUAL-COMPOSE drift + audience picker confirms BUG B + substitute helper callsites + SECTION_RENDERERS catalog + dual-dispatch pattern observation). Remaining: B3 surfaces (send path, auto-draft cron, token handlers).

---

# WAVE B3 — Send path + auto-draft cron + token handlers (in progress 2026-06-03 AM)

## B3.1 — Send-time pilot safety layer (THIRD pilot mechanism — refines B2.2)

`send-tournament-message/index.ts:156-189` implements a fail-loud safety guard at send time. After unsubscribe suppression but before Resend dispatch:

```ts
if (pilotMode) {
  const guardianIds = recipients.map((r) => r.guardian_id).filter(Boolean);
  if (guardianIds.length) {
    const { data: guardians } = await sb.from("guardians")
      .select("id, is_pilot_family, email")
      .eq("org_id", message.org_id).in("id", guardianIds);
    const nonPilot = (guardians || []).filter((g) => !g.is_pilot_family);
    if (nonPilot.length) {
      return json({ error: `PILOT MODE: ${nonPilot.length} non-pilot guardians in queue ...`, ... }, 403);
    }
  }
}
```

**Refines B2.2's mechanism story:** there are not 2 but **3 pilot layers** in production:
- **Layer 1 — Resolver (per-kind):** Some resolvers route through `get_digest_recipients` RPC (digest path with REDIRECT + FILTER); others bypass and apply bare FILTER (academy_callup_notice, rsvp_nudge resolvers, _reminderSend).
- **Layer 2 — send-time safety guard (this finding):** Reads `is_pilot_family` from `guardians` for every recipient. Fails LOUD with 403 if any non-pilot guardian reaches the dispatch boundary.
- **Layer 3 — REDIRECT synthetic rows:** `guardian_id=NULL` rows from `get_digest_recipients` BYPASS the Layer 2 check (line 167: `.filter(Boolean)` strips nulls), which is what allows tournament + weekly_digest pilot sends to actually fire.

**Implication for the cutover decision (Phase 2.D-1):** Layer 2 is the catch-all that prevents non-pilot leak today. Even if Phase 2 fix shape (a) "migrate the stragglers to use the RPC" lands, the cutover step ALSO needs Layer 2 to be reasoned about — because flipping `is_pilot_family=true` on real families simultaneously (1) lets resolvers stop filtering them and (2) lets Layer 2 stop blocking them. Today the system is "safe by Layer 2 fail-loud + REDIRECT bypass," not "safe by FILTER discipline."

**This is not PATTERN A (not a divergent computation of one concept).** Layer 2 is a separate concept (send-time safety) with a different purpose (defense in depth). Documenting the layering doesn't change B2.2's mechanism analysis; it just maps the full pilot architecture for Phase 2.

## B3.2 — Unsubscribe suppression symmetric (closes B2.8-P3 carryover)

`send-tournament-message/index.ts:120-154` implements the code-side suppression filter:
1. Read `guardian_email_preferences.unsubscribed_at` for all recipients in the queue
2. Flip suppressed rows' `delivery_status` to `'unsubscribed'` (preserves audit trail)
3. Drop them from the in-memory recipient list before Resend dispatch

**Both bespoke send paths route through send-tournament-message:**
- `rsvpNudgeSend.js:91` — `supabase.functions.invoke('send-tournament-message', ...)`
- `academyCallupSend.js:89` — same.

**B2.8-P3 closed CLEAN:** unsubscribe suppression IS symmetric across all briefing kinds. The chat-CC PR #673 §5 "raw DB errors reach admins" finding (Meta category) does NOT extend to suppression — that path is sound. Admin BCC rows (guardian_id NULL) intentionally bypass (line 124-128) — they're operator audit copies.

## B3.3 — `academyCallupSend.js:81` hard-codes `audience_type='player_specific'` (BUG B extension — every callup send blocks)

**Finding B3.3-P0 (BUG B extension — owned to surface in this audit):** The bespoke `sendAcademyCallupNotice` function (line 73-83) does `INSERT INTO comms_messages ... audience_type: 'player_specific'`. Since `player_specific` is NOT in the production CHECK constraint (per §1.2 + B2.7), the INSERT fails with 23514. **Every academy_callup_notice send attempt has failed at INSERT time, matching production data (0 callup_notice rows ever sent).**

Confirms BUG B at the application-write layer. The wizard offers academy_callup_notice (locked default = `player_specific`), the resolver builds slices, the substitute helpers correctly substitute callup tokens — and then the INSERT dies. The production "0 rows" confirms this isn't intermittent; it's structural.

`rsvpNudgeSend.js:84` is NOT affected — it hard-codes `audience_type: 'event_attendees'` which IS in the CHECK. So rsvp_nudge can INSERT; what blocks rsvp_nudge in production is the BUG D pilot mode straggler (resolver returns 0 recipients).

## B3.4 — Auto-draft cron handles BUG A race with `race_resolved_other_tick_won`, composer doesn't have equivalent pre-check

`briefing-auto-draft-tick/index.ts:62-82` implements a defensive auto-draft for weekly_digest:
1. SELECT existing rows in active statuses for the period (line 65-67)
2. If exists, return `{ skipped: "exists" }` — don't INSERT
3. If not exists, INSERT
4. If INSERT fails with 23505 (race), return `{ skipped: "race_resolved_other_tick_won" }` (line 78)

**Finding B3.4-P1:** The cron handles BUG A race defensively. But `useBriefingDraft.js` `flush()` (admin composer path) does NOT do an equivalent SELECT-existing-for-anchor pre-check, and doesn't classify 23505 from `comms_messages_weekly_digest_unique` as "another path got there first" — it surfaces the raw error to the admin. **The auto-draft cron's defensive pattern is the model for the composer's missing pre-check.**

Phase 2 fix shape for BUG A is now sharper: the composer's flush() needs the same SELECT-existing pattern the cron already has — adopt the model, don't invent a new one.

## B3.5 — Token handlers (4) — all sound or intentionally tombstoned

- **`rsvp-token-handler`** (123L, `verify_jwt:false`): anonymous handler; verifies via `verify_rsvp_token` SECURITY DEFINER RPC; standard pattern from `invite-parent`. Sound.
- **`callup-token-handler`** (137L, `verify_jwt:false`): same pattern via `verify_callup_token`. Sound.
- **`unsubscribe-handler`** (122L): UPSERTs `guardian_email_preferences.unsubscribed_at`; idempotent ("Already unsubscribed" message if existing). Sound.
- **`feedback-token-handler`** (50L): explicit 410 Gone HTML tombstone per ledger §4.AJ (feedback shelved 2026-05-27). Intentional. Sound.

**Finding B3.5-CLEAN:** all 4 token handlers are sound or intentionally tombstoned. No new findings.

## B3.6 — Auto-draft + cron-dispatch separation clean (3 responsibilities in briefing-auto-draft-tick)

`briefing-auto-draft-tick` does three things per tick:
1. **Expire sweep** (line 52-60): mark `status='draft' AND expires_at < now` as `archived`. Independent of triggers.
2. **Change-alert dispatch** (line 117): drain queued `event_notifications` to push/email. Independent of triggers.
3. **Trigger loop** (line 119-136): iterate active `briefing_triggers`, dispatch per trigger_event, per-org collapse.

`briefing-cron-dispatch` is a SEPARATE function for sending scheduled briefings (`status='scheduled' AND scheduled_for ≤ now`). Clean separation — auto-draft writes drafts; cron-dispatch transitions scheduled→queued→sent.

**Finding B3.6-CLEAN:** separation of concerns honored. No findings.

## B3.7 — Resend webhook receiver — rank-based state machine

`resend-webhook-receiver/index.ts:52-58`: out-of-order webhook deliveries ranked so terminal states (`bounced`, `complained`, `unsubscribed`, `failed` — all rank 100) can't be downgraded by a later `delivered` (rank 20) or `opened` (rank 30). Sound state machine per the Wave 4.4-A2b refactor.

**Finding B3.7-CLEAN.**

---

**Wave B3 status:** CLOSED for Phase 1 purposes. 1 NEW P0 (B3.3 — academyCallup INSERT blocked by BUG B at the write boundary; BUG B has wider blast than B1 framing) + 1 P1 (B3.4 composer needs cron's defensive SELECT pattern for BUG A) + 1 mechanism refinement (B3.1 third pilot layer found) + 4 CLEAN confirmations (B3.2 unsubscribe symmetry, B3.5 token handlers, B3.6 cron separation, B3.7 webhook state machine). Ready to dispatch Wave B4 (admin UI — composer wizard + history + drafts).
