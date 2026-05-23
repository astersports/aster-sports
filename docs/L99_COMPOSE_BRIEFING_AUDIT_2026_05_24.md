# L99 Compose Briefing Subsystem Audit — 2026-05-24

**Branch:** `claude/nice-thompson-fZWjn` (off `main` at `f861c63`)
**Methodology:** Batched line-by-line (per AP #50 narrow-scope rule)
**Scope:** Compose briefing subsystem — 6 batches dispatched in parallel
**Out of scope** (per §16.15 e): families/financials/notifications/messaging subsystems; UI per-role wireframes (admin-only surface, no per-role variants)

---

## 1. Phase 1 — Inventory

| Batch | Scope | Source files | Test files |
|---|---|---|---|
| A | Composer page + wizard + hooks | 14 | 7 |
| B | Resolvers + helpers + sections | 13 + 13 | 18 |
| C | Composer.js + SECTION_RENDERERS + KIND_COMPOSERS + renderers | 41 | 14 |
| D | Substitution + token helpers + queue builders | 9 | 6 |
| E | Edge functions (cron dispatch, auto-draft, token handlers, webhook) | 8 | 6 |
| F | Schema + RLS + RPC + cron + advisors | 17 migrations | — |

Total source surface: ~89 unique files; ~51 test files referenced.

---

## 2. Phase 2 — Findings

### 2.1 P0 (block release)
**None.** Initial Batch A flagged AP #37 ordering as P0; reclassified to P1 on synthesis — RLS still gates the actual security boundary; column ordering is defense-in-depth.

### 2.2 P1 (must fix soon — shipped in this PR)

| # | Site | Anti-pattern | Fix |
|---|---|---|---|
| P1-1 | `src/hooks/useBriefingFilters.js:57` | AP #37 — org_id second on org-scoped query | Reorder `.eq('org_id', orgId).eq('user_id', user.id)` |
| P1-2 | `src/pages/admin/BriefingHistoryDetail.jsx:38` | AP #37 — org_id second despite anti-pattern comment | Reorder `.eq('org_id', orgId).eq('id', id)` |
| P1-3 | `briefing_inbox_preferences_own` policy (migration 20260509161303) | AP #15 — bare `auth.uid()` in USING + WITH CHECK | Wrap in `(SELECT auth.uid())` via DROP+CREATE migration |
| P1-4 | `src/lib/engine/composer.js` (163L) | AP #6 — over 150L cap | Split SECTION_RENDERERS dispatch to `sectionRenderers.js`; composer.js drops to 34L |

### 2.3 P2 (shipped opportunistically in this PR)

| # | Site | Fix |
|---|---|---|
| P2-1 | `src/pages/admin/BriefingHistoryDetail.jsx:22` | iframeStyle `backgroundColor: '#ffffff'` → `var(--em-bg-card)`. Line 55 `doc.write` hex literals preserved (sandboxed iframe doc can't inherit parent CSS vars) |

### 2.4 P2/P3 deferred to §4.AE

| # | Concern | Routing |
|---|---|---|
| P2 | `BriefingComposer` Step 2 missing recipient preview chip (§13 #7) | Design call: where to mount + admin BCC implications |
| P3 | `briefing_active_queue` AP #57 hardening — add explicit `REVOKE FROM anon` | Live state already denies anon; hardening only |
| P3 | `familyGuideHelpers.js` (155L) over AP #6 cap | Same-shape split as composer.js when next material change lands |
| P3 | `supabase/functions/briefing-cron-dispatch/_helpers.ts` (152L over) | Deno mirror with TS annotation overhead; split if production touches it |
| P3 | `_lib.ts` token handler — `any` types + silent error swallow in `mintUnsubscribeUrl` | Edge function hardening pass |
| P3 | Test-coverage audit incomplete | Batch B + C agents self-truncated at test-file boundary; coverage gaps not enumerated |

### 2.5 False positives caught during synthesis

| # | Initial finding | Verification | Disposition |
|---|---|---|---|
| FP-1 | Batch D: `recipientFilter.js:37,45` missing org_id on `events` and `tournament_teams` queries | Live `information_schema.columns` — neither table carries `org_id`; both are FK-scoped per AP #37 exception (events → teams.org_id, tournament_teams → tournaments.org_id) | Not a violation — AP #37 exception clause |
| FP-2 | Batch C: `tournamentRecap.js` renderer missing | Tournament recap renders via section composition (placementBlock + standoutMoments + gameLog + bracketCallout). Resolver + composer exist; no dedicated `renderers/tournamentRecap.js` is needed | Not a violation — template-driven dispatch |
| FP-3 | Batch C: 4 renderer files use raw hex (hotelBlock, gameCard, callupResponse, rsvpRequest) | Email HTML cannot use CSS variables (§13 #1 inline-styled only). Raw hex required for email-client compatibility | Not a §3 violation — valid P3 cleanup to extract constants to existing `colors.js`; deferred to §4.AE |
| FP-4 | Batch F: 3 RLS policies bare `auth.uid()` on briefing_inbox_preferences | Live `pg_policy` — actually 1 policy with `polcmd='*'` (ALL). Three USING/WITH_CHECK references in source, one policy in DB | Severity unchanged (still P1); count corrected |
| FP-5 | Batch F: AP #57 missing `REVOKE FROM anon` on briefing_active_queue (claimed P2 EXTERNAL exposure risk) | `has_function_privilege('anon', ...)` returns FALSE. Anon already cannot execute | Lowered to P3 hardening (defense-in-depth) |

---

## 3. Synthesis — cross-batch patterns

### PATTERN ALPHA — AP #37 org_id ordering compliance (locked)

Two real instances across Batches A + D after FP-1 reclassification:
- `useBriefingFilters.js:57` (org_id second on briefing_inbox_preferences)
- `BriefingHistoryDetail.jsx:38` (org_id second on comms_messages)

Both fixed in this PR. Pattern ALPHA validated as the dominant finding class for query-ordering audits. The audit method that catches it: line-by-line scan of every `.from('<table>')` chain with cross-reference against the org-scoped table list. **Disclaimer:** FP-1 demonstrates that agents auditing for AP #37 must apply the exception clause (FK-scoped tables don't carry `org_id`) — the dominant false-positive mode in this class.

### PATTERN BETA — authentication discipline drift (locked)

Two findings clustered in Batch F (briefing infrastructure):
- AP #15 bare `auth.uid()` (real, P1)
- AP #57 missing explicit `REVOKE FROM anon` (P3 hardening, not exploitable today)

Both stem from migration-authoring habits before the discipline rules were registered. Sweeping across all briefing schema migrations was scoped to Batch F here; future per-subsystem audits should replicate. The audit method: scan migration files for `auth.uid()` literals not wrapped in `(SELECT ...)`, and for `SECURITY DEFINER` functions without explicit `REVOKE EXECUTE FROM PUBLIC; REVOKE EXECUTE FROM anon;` sequence.

### Batch-agent self-truncation observation

Three Batch agents (B continuation, C, and an earlier B run) self-truncated at the test-file boundary, citing an imagined "no tools" constraint that was never imposed in their prompts. Each completed source-file audit cleanly but stopped at the bridge to test files. Likely cause: context-window pressure as findings accumulate in agent memory; the agent confabulates a stop instruction to gracefully degrade rather than failing mid-task. Mitigation for future batches: split test-file audit into a separate agent dispatch, or set explicit "report progress at file 25, continue to file 50" checkpoints.

---

## 4. Phase 4 — Execute (shipped in this PR)

### Files changed
1. `src/lib/engine/sectionRenderers.js` (new, 114L) — extracted SECTION_RENDERERS + renderSections + renderSectionsPlainText + warnUnknownKind
2. `src/lib/engine/composer.js` (163L → 34L) — KIND_COMPOSERS + compose; re-exports section renderers
3. `src/hooks/useBriefingFilters.js` — line 57 reorder
4. `src/pages/admin/BriefingHistoryDetail.jsx` — line 22 token, line 38 reorder
5. `supabase/migrations/20260523195203_briefing_inbox_preferences_initplan_safe_auth_uid.sql` (new) — DROP + CREATE policy with `(SELECT auth.uid())` wrap + DO $$ verify block

### Verification
- `npm run lint` clean
- `npm test -- --run src/lib/engine` — 39 test files, 267 tests passing
- `npm run build` green (no new chunks; bundle sizes unchanged)
- Migration applied via MCP `apply_migration`; canonical version string `20260523195203` matches mirror file (per AP #21)
- Live `pg_policy` confirmed post-apply: `using_expr` and `with_check_expr` both `(user_id = ( SELECT auth.uid() AS uid))`

### Pre-existing test failures NOT caused by this PR
3 tests in `src/lib/briefings/__tests__/wave_4_1d_2.test.js` fail in local env on `Missing VITE_SUPABASE_URL` (static import of InboxFilters.jsx → supabase.js init). Confirmed via git stash that the failures pre-existed.

---

## 5. Open follow-ups → §4.AE

Per AP #45, ledger §4.AE entry shipped in same commit as this doc.

- P2 BriefingComposer recipient preview chip (§13 #7)
- P3 AP #57 hardening migration for briefing_active_queue
- P3 familyGuideHelpers.js + _helpers.ts (Deno mirror) cap pressure
- P3 _lib.ts token handler typing + error handling
- P3 Renderer hex literals → colors.js constants (4 files, ~15 hex literals)
- P3 Test-coverage audit completion for resolvers + renderers (incomplete batches)
- P3 Tournament_recap renderer architecture doc (FP-2 confirmation — section-composition is by design)
