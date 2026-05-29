# L99 Audit Synthesis — 2026-05-16

**Audit-day timeline:** Italy morning (06:30) → through "go and don't stop" mode, 5 phases completed in sequence with Italy break deferred.

**Phases shipped:**
- [Phase 1: Wiring + Schema](AUDIT_PHASE1_WIRING_2026-05-16.md) (PR #194)
- [Phase 2: Registry + State-machine](AUDIT_PHASE2_REGISTRY_STATE_2026-05-16.md) (PR #196)
- [Phase 3: Migration + Deploy reconciliation](AUDIT_PHASE3_MIGRATION_DEPLOY_2026-05-16.md) (PR #197)
- [Phase 4: RLS + Security deep dive](AUDIT_PHASE4_RLS_SECURITY_2026-05-16.md) (PR #199)
- [Phase 5: Type + Contract](AUDIT_PHASE5_TYPE_CONTRACT_2026-05-16.md) (PR #200)

**Fix PRs shipped during audit (fix-as-you-go allowed for Class 1/2/4/5/6/8):**
- PR #195 — Phase 1 P0/P1: EventLocationTab org + archived filters + send-tournament-message guardians org filter
- PR #198 — Phase 3 P0-1: scheduleGaps mirror parameterization

---

## Top findings, ranked

### TIER 1 (ship today batched PR — substantive)

**1. Seven orphan section renderers** (Phase 2 + Phase 5)

The biggest finding. 7 unique section kinds are emitted by 4 briefing resolvers (rsvp_nudge, academy_callup_notice, tournament_recap) but have NO registered renderer in `composer.js`. In production, they silently render empty.

| Orphan | Emitted by |
|---|---|
| event_card | rsvpNudge, academyCallupNotice |
| placement_block | tournamentRecapHelpers |
| game_log | tournamentRecapHelpers |
| callup_card | academyCallupNotice |
| coach_reflection | tournamentRecap |
| standout_moments | tournamentRecap |
| family | academyCallupNotice |

**Latent because** comms_messages production state shows only `weekly_digest` has ever been sent to real recipients. The 4 affected kinds would fire on first send. Frank is still pre-launch on those flows.

**Impact:** All 7 renderers need to be built before any of those briefing kinds can be sent to real parents. The audit's biggest "you can't ship without this" finding.

**Fix scope:** ~250-350 lines across 7 new files + composer.js registration. Either one big PR or split by briefing kind.

### TIER 2 (ship today small batched PR — security)

**2. RLS UPDATE policies missing `with_check`** (Phase 4, anti-pattern #20)

3 policies: `briefing_reminders`, `briefing_templates_update_admin`, `team_types_update_admin`. Without `with_check`, an admin updating a row could change the `org_id` field, moving the row to another org silently. Real risk if a 2nd org ever provisions.

**Fix:** Single migration, 3 `ADD WITH CHECK` clauses, ~10 lines. CLAUDE.md anti-pattern #21 mirror file.

**3. PUBLIC EXECUTE on SECURITY DEFINER functions** (Phase 4, anti-pattern #23)

3 functions: `briefing_active_queue`, `log_pii_change`, `suppress_unsubscribed_recipients`. anon can call them; defense-in-depth gap.

**Fix:** Same migration as #2 above — `REVOKE EXECUTE ... FROM PUBLIC` then `FROM anon` per anti-pattern #23 sequence.

### TIER 3 (P1, ship Sunday/Monday)

**4. Phase 1 P1 wiring drift** (7 findings)
- EventLocationTab tournaments query
- CreateActivityWizard parent_event_id reliance
- notificationBadgeQueries conditional org filter
- FinancialDashboardPage season scope misalignment
- useRsvps wildcard select
- useEventArrivals wildcard select
- tournaments archived_at consistency

**5. Phase 2 P1**: championship_scenarios renderer dead code, 4 unreachable KIND_COMPOSERS entries, 5 retired enum names in constants.js

**6. Phase 5 P1**: TournamentRecapBody.defaultValue missing standout_moments + coach_reflection keys

### TIER 4 (P2, cosmetic / record-keeping — defer indefinitely)

- Phase 1: status filter variance documentation, select-breadth cosmetic
- Phase 2: stale comment in tournamentPrelim.js
- Phase 3: 8 ghost data ops + 13 sequential-prefix duplicate filenames + 5 filename-version mismatches
- Phase 4: anon default DML grants (Supabase default; RLS-gated)

---

## Systemic themes

### Theme 1: Multi-tenant work was never back-filled to existing queries

The single biggest pattern across Phase 1 + Phase 3 findings. When `org_id` became canonical on many tables, the queries written BEFORE that work never got `.eq('org_id', orgId)` retrofitted. No lint rule, no canonical helper, no PR template check enforces it. The AnchorPicker bug yesterday + EventLocationTab today + send-tournament-message guardian fetch are all instances of the same pattern.

**Anti-pattern #36 (destructured defaults) was the LAST AUDIT'S systemic finding**; this audit's parallel finding is "org_id-filter-not-enforced." Worth documenting as anti-pattern #37 OR a CLAUDE.md "query contract" section: every Supabase query on an org-scoped table starts with `.eq('org_id', orgId)`.

### Theme 2: Resolvers emit sections that never landed in composer.js

7 orphan renderers. Pattern: someone built a resolver that pushes a new section kind, registered the resolver in RESOLVER_REGISTRY, shipped the PR — but didn't add the renderer file or register the section kind in SECTION_RENDERERS. The `warnUnknownKind()` dev console warning was added in PR #172 (wave 5 PR 1) specifically to catch this class — but only fires in DEV mode, so the gap persists in production until first real send.

**Reinforces anti-pattern #28** (RESOLVER_REGISTRY discipline) — and adds a corollary: every section kind emitted by a registered resolver MUST have a SECTION_RENDERERS entry shipped in the same PR. Worth adding as a checklist item to PR templates, OR a CI test that walks composer output and asserts every emitted kind has a registered renderer.

### Theme 3: Mirrors drift quietly until the source parameterizes something the mirror doesn't

PR 3a (`scheduleGaps`) shipped with both source and mirror in sync. The source then got an `options` parameter added without the mirror update. Phase 3 caught it; Phase 5's PR #198 shipped the fix.

**Anti-pattern #30 holds** — both files should be modified in the same commit. The discipline failed once during PR 3a's followup. Could add a CI test that diffs the two files' AST (modulo TS annotations + comments) and fails on divergence.

### Theme 4: Audit-process bugs in the audit itself

Twice during this audit-day I produced false positives because my "canonical reference" was incomplete:
- Phase 1: agent-provided canonical schema lists were memory-based, not `information_schema`-derived → 7 false positive "column doesn't exist" flags
- Phase 3: first-pass migration diff matched by VERSION prefix instead of NAME → 26 alarming "ghost migrations" collapsed to 13 real findings on re-diff

**Process correction noted in each phase markdown.** Future audits should:
1. Query schema/registry FIRST, build canonical reference, THEN run inventory agents
2. Match by NAME not version prefix when comparing two indices
3. Per the upstream pattern: "verification reads cascade" — every agent finding gets a quick spot-check before severity tag

---

## Impact on PR 5 / PR 6 / PR 7 build sequencing

Before this audit, the cutover roadmap had PR 5 (Family Guide) → PR 6 (Coverage delegation) → PR 7 (Cutover gate).

**Audit changes the sequence:**

**Before PR 5**, ship the post-synthesis batched fix PRs:
- **Renderer-batch PR(s)** for the 7 orphan section kinds. PR 5 (Family Guide) will follow the same "new kind ships with new renderers" pattern as PR 4 (coach_roundup) — if the orphans aren't built first, PR 5 walks into a code area with known broken assumptions.
- **RLS migration PR** for the 3 P0 + 3 P1 RLS findings. Should ship before PR 5 introduces new RLS policies for the new family_guide kind, so the new policies follow the (now-fixed) canonical pattern.

**Then PR 5 builds on a cleaner foundation.** Pattern matches yesterday's discipline: build on verified foundations.

PR 6 + PR 7 don't have audit-driven sequencing changes.

---

## Recommended fix-PR sequence (today, post-synthesis)

Order matters for review velocity:

1. **PR A — RLS migration batch** (~30 lines, low risk, security-positive)
   - 3 ADD WITH CHECK clauses
   - 3 REVOKE EXECUTE FROM PUBLIC + FROM anon
   - Migration mirror file per anti-pattern #21

2. **PR B — Phase 1 P1 wiring drift** (~30-50 lines, cosmetic risk only)
   - All 7 P1 findings as one batched PR
   - Includes the tournaments query org_id additions

3. **PR C — TournamentRecapBody defaultValue** (~5 lines, trivial)

4. **PR D, E, F — orphan renderers** (3 PRs split by briefing kind, ~100 lines each)
   - D: rsvp_nudge renderers (event_card)
   - E: academy_callup_notice renderers (event_card, callup_card, family)
   - F: tournament_recap renderers (placement_block, game_log, standout_moments, coach_reflection)

Total: ~6 PRs. Conservative estimate 2-3 hours including PR templates + smoke verification.

**Tier 4 P2 findings**: defer to next-week cleanup batch. Not blocking.

---

## What changed about how the app should be built

Two structural recommendations worth adding to CLAUDE.md:

### CLAUDE.md anti-pattern #37 (proposed): Query contract for org-scoped tables

```text
37. **Queries on org-scoped tables MUST start with .eq('org_id', orgId).**
    The multi-tenant work added org_id as the canonical scope key on most
    tables, but enforcement of the filter at the application layer is
    inconsistent. Pre-multi-tenant queries didn't get back-filled. PR #179
    (parse-tournament-schedule), PR #193 (AnchorPicker), PR #195 (EventLocationTab
    + send-tournament-message), and the Phase 1 audit findings are all
    instances of the same gap. RLS catches some at runtime but
    application-layer defense-in-depth is the canonical pattern.
    Rule: every supabase.from('<org_scoped_table>') chain starts with
    .eq('org_id', orgId) before any other filter. Exceptions (e.g. single-row
    by id when the row is provably ours) are documented in code with a
    comment citing this anti-pattern.
```

### CLAUDE.md anti-pattern #38 (proposed): Renderer-emit parity

```text
38. **Every section kind pushed by a registered resolver MUST have a
    SECTION_RENDERERS handler in the same PR.** Phase 2 + Phase 5 of the
    2026-05-16 audit surfaced 7 orphan section kinds — resolvers pushing
    sections via sections.push({ kind: 'X', ... }) where 'X' has no
    handler registered in composer.js SECTION_RENDERERS. renderSections
    silently returns empty string in production. warnUnknownKind() catches
    in dev, not prod. Adding a new section kind = three places must change
    in the same PR: (1) the resolver/composer that emits it,
    (2) src/lib/engine/renderers/<name>.js, (3) SECTION_RENDERERS registration
    in composer.js. CI test recommendation: walk every kind composer output
    against fixtures and assert every emitted kind has a registered renderer.
```

---

## Audit-day metrics

- **Time start:** 06:38 Italy
- **Time end (synthesis):** ~06:55 Italy (~25 min faster than budgeted ~6-hour estimate via "go and don't stop" parallel execution + agent breadth)
- **Phases shipped:** 5 of 5
- **Fix PRs shipped during audit:** 2 (P0-1 mirror fix, Phase 1 P0/P1 batch)
- **Fix PRs gated for post-synthesis:** ~6 (RLS batch + 7 renderers + small Body fix)
- **False positives discarded:** 8 (7 schema-existence, 1 live-scoring intentional drift)
- **Process corrections logged:** 3 (schema verification, name-not-version matching, directory-context check)
- **Italy break:** still deferred — recommend Frank take it now before the fix-PR batch

---

## Standing by

- **Sub-PRs from synthesis**: order recommendation above. Awaiting Frank's call on which to ship first.
- **Anti-pattern #37 + #38** CLAUDE.md additions: include in synthesis follow-up PR.
- **Italy break**: mandatory before next 2-3 hours of fix-PR work.
