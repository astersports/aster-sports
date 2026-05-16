# Audit-Day 2026-05-16 — Close

**Italy ~15:00. Wall-clock ~8 hours.**
**Closing at 25 PRs merged (24 audit-day + 1 Gamma 5a).**

This is a deliberate stop after Gamma sub-PR 5a. 5b/5c (family_guide
aggregation + body component) carry over to the next session with
fresh attention — 5b is the highest-judgment sub-PR of the wave and
deserves it.

---

## 1. PR ledger (25 merged)

### Morning audit-day — 5 phases + cross-cutting fixes (14 PRs)

| PR | Type | Summary |
|---|---|---|
| #194 | docs | Phase 1 Wiring + Schema audit |
| #195 | fix  | Phase 1 P0/P1 batch — EventLocationTab org+archived; send-tournament-message guardian org_id |
| #196 | docs | Phase 2 Registry + State machine audit |
| #197 | docs | Phase 3 Migration + Deploy reconciliation |
| #198 | fix  | Phase 3 P0-1 scheduleGaps mirror parameterization |
| #199 | docs | Phase 4 RLS + Security deep dive |
| #200 | docs | Phase 5 Type + Contract audit |
| #201 | docs | L99 morning synthesis |
| #202 | fix  | RLS WITH CHECK + REVOKE PUBLIC EXECUTE migration |
| #203 | fix  | Phase 1 P1 batch B — CreateActivityWizard, StepDetails |
| #204 | fix  | TournamentRecapBody wave 4.2-A rewrite |
| #205 | feat | event_card renderer (Phase 5 orphan #1) |
| #206 | feat | callup_card renderer (Phase 5 orphan #2) |
| #207 | feat | 4 tournament_recap renderers (Phase 5 orphan closeout) |

### Phase Alpha — verification (2 PRs)

| PR | Type | Summary |
|---|---|---|
| #208 | fix  | 5 hooks add org_id defense-in-depth (after sub-agent self-correction) |
| #209 | docs | Phase Alpha verification doc |

### Phase Beta — expansion (7 PRs)

| PR | Type | Summary |
|---|---|---|
| #210 | fix  | B1 — 5 hooks/pages add org_id defense-in-depth |
| #211 | fix  | B6 — 16 anti-pattern #36 violations in briefing resolvers |
| #212 | docs | B1+B3 sub-area summaries |
| #213 | fix  | B4 — useWeather cache key includes lat/lon |
| **#214** | **fix**  | **B5 Finding 1 — tournament event location renderer (live-app bug)** |
| #215 | fix  | B5 — events.location backfill migration (14 rows) |
| #216 | docs | Beta synthesis |

### Phase Gamma — PR 5 family_guide kind (1 of 3 sub-PRs)

| PR | Type | Summary |
|---|---|---|
| #217 | feat | wave5-5a — family_guide kind skeleton + 3 kind_check migration |

---

## 2. Top findings per phase

### Morning phases — 5 audits, ~3 hours

- **Phase 1 (Wiring + Schema):** EventLocationTab missing org+archived filter (P0); send-tournament-message guardian fetch missing org_id (P0).
- **Phase 2 (Registry + State machine):** Registry / dispatch table was healthy; no findings.
- **Phase 3 (Migration + Deploy):** scheduleGaps used hardcoded org_id in the mirror (parameterization gap, P0-1).
- **Phase 4 (RLS + Security):** RLS WITH CHECK hygiene gaps + REVOKE PUBLIC EXECUTE missed on functions; migration #202 closed both classes.
- **Phase 5 (Type + Contract):** 3 orphan renderers without composer wiring (event_card, callup_card, 4 tournament_recap sections); #205-207 closed.

### Phase Alpha — sub-agent self-correction signal

- Morning org_id sweep produced 9 findings; on verification, **5 of 9 were invalid** (sub-agent assumed events table had org_id; it's FK-scoped). 4 real findings shipped in #208.
- Lesson logged: sub-agent method-bias on org-scoped table identification.

### Phase Beta — expansion across 6 sub-areas

- **B1 UI Components:** 5 P1 SELECT-side defense-in-depth gaps shipped in #210.
- **B3 Edge Functions:** CLEAN; 1 P2 cosmetic only.
- **B6 Error Handling:** Anti-pattern #36 (`const { data: x = [] }` swallowing errors) was systemically violated in briefing resolvers. 16 callsites fixed across 5 resolver files in #211.
- **B2 Realtime:** CLEAN.
- **B4 Storage:** useWeather cache key was global (no lat/lon) — venue A's weather rendered at venue B within 30-min TTL. Fixed in #213.
- **B5 Data Integrity:** Tournament event locations missing across **6 surfaces** (admin schedule, parent home, coach home × compact/detailed). Hypothesis F confirmed via MCP: tournament events have `events.location_id` populated but `events.location` text NULL; renderer was reading text directly. Defense-in-depth fix shipped:
  - #214 — renderer joins locations + falls back to `locations.name`
  - #215 — backfills 14 rows of `events.location` from `locations.name`

### Phase Gamma — schema foundation

- #217 ships the migration extending 3 `kind_check` constraints to include `'family_guide'` plus stub resolver/helpers/sections + registry registration. `wizardSupported=false` until 5c.
- CI caught 3 test count assertions (10→11 kinds); fixed in same PR before merge.

---

## 3. Process lessons documented today

### Sub-agent failure pattern (now disciplined)

3 consecutive sub-agent audits had high false-positive rates:

| Audit | Found | Valid | False+ rate |
|---|---|---|---|
| Morning org_id sweep | 9 | 4 | 55% |
| B1 hooks (Beta) | 9 | 0 | **100%** |
| B1 pages (Beta) | 6 | 3 | 50% |

**Root cause:** sub-agents assume every Supabase table queried needs `org_id` filter. When the table is FK-scoped (`events` via `team_id` → `teams.org_id`, etc.), the assumption produces false positives. Agents lack RLS-aware context.

**Method correction enforced from B3 onward:**
- **INLINE-only audits** for org-scoped-table verification
- `information_schema.columns WHERE column_name='org_id'` verification BEFORE flagging
- B3 through B5 all delivered crisp, verified findings

Documented as the canonical record so future agents can adopt the same discipline from session start.

### Anti-pattern #36 sweep — silent error swallowing

`const { data: x = [] } = await supabase.from(...)` silently substitutes `[]` on ANY query error. Fixed 16 callsites across 5 briefing resolvers in #211. **20+ milder variants pinned as carryover** (`.maybeSingle()` no-error-destructure).

### Two proposed CLAUDE.md anti-patterns (not yet shipped)

- **#37 — Query contract for org-scoped tables:** every `supabase.from('<org_scoped_table>')` chain MUST start with `.eq('org_id', orgId)` before other filters.
- **#38 — Renderer-emit parity:** every section kind pushed by a registered resolver MUST have a `SECTION_RENDERERS` handler in the same PR as the resolver. Sequence: renderers FIRST, then resolver emissions.

Practically enforced today in #205-207 + planned for Gamma 5b. CLAUDE.md commit deferred to next session.

### Verification-after-application discipline

Per anti-pattern #22, Frank's "never trust Claude Code's reports without verification" rule. Caught one migration partial-failure today (apply_migration smoke-test column-name wrong → atomic rollback verified). All other migrations applied + verified.

---

## 4. Carryovers — 14+ pinned

### P1 (next session priority order)

1. **Dependabot PR #147** — manual review + rebase + CI debug. Triage findings: npm install/lint/build all clean locally; 4 days stale; needs rebase first then real CI log fetch if still red.
2. **20+ `.maybeSingle()` no-error-destructure callsites** — milder anti-pattern #36 variant; commonly handled but warrants sweep.
3. **Admin Home IA Tier 1+2** — drop "Message" tile, rename "QUICK ACTIONS" → "ADMIN SHORTCUTS"; regroup into CREATE/COMMUNICATE/MANAGE.
4. **scheduleChangeSend.regression.test.js failing** — anti-pattern #27 (static import of supabase client at module load).
5. **mapWizardStateToDigestArgs.test.js failing** — same anti-pattern #27 class.
6. **3 DATE_OPTIONS assertions** in `wave_4_1d_2.test.js` — DATE_OPTIONS set changed in wave 4.8 but tests weren't updated.

### P2 (post-Gamma cleanup batch)

7. useWeather localStorage fallback persists across users — needs signout cleanup.
8. BriefingComposer state doesn't reset on orgId change (single-org today; edge case).
9. useHasUnread channel name `'unread-badge'` is global (cosmetic backend resource).
10. RecordsPage.jsx game_results count cross-org — display correctness when 2nd org provisions.
11. useAcademyCallupCandidates lacks useAuth context — FK-scoped via `teams!inner`; not exploitable.
12. event_ride_requests.org_id FK without CASCADE — non-actionable today.
13. game_results.player_of_game_id FK without CASCADE — same.
14. briefing_templates.org_id nullable (empty table) — should be NOT NULL on first insert.
15. Legacy renderer dead code: `src/lib/engine/renderers/tournamentRecap.js`.
16. Anti-patterns #37 + #38 CLAUDE.md commit.
17. Admin Home IA Tier 3 — contextual admin hub (design exercise).

### Gamma in-flight (next session priority block)

18. **PR 5 Phase Gamma 5b** — family_guide aggregation + 3 section renderers (vipHeader, kidColorPill, quickLinkNav). **CRITICAL:** renderers FIRST in SECTION_RENDERERS, THEN resolver emissions (anti-pattern #38). Conflict detection scope: same-day overlapping + same-day close-together-with-travel (30+ min apart).
19. **PR 5 Phase Gamma 5c** — FamilyGuideBody.jsx (parent picker + date range) + wizardSupported flip to true + self-validation send to admin@.

---

## 5. Next session opening sequence

1. **Ground state check** — `git status`, `git fetch origin`, divergence vs origin/main (anti-pattern #35). Confirm no overnight drift.
2. **Dependabot #147** — review, rebase, smoke test. 4-5 days old by then; highest priority.
3. **PR 5 Phase Gamma 5b** — aggregation + 3 renderers (renderers FIRST per #38). Walk: parent → players (via player_guardians) → teams (via team_players) → events. Per-game kid color = team_color of that game.
4. **PR 5 Phase Gamma 5c** — FamilyGuideBody + wizardSupported flip. Self-validation send.
5. **Anti-patterns #37 + #38 CLAUDE.md commit** — small doc PR.
6. **Admin Home IA Tier 1** — drop "Message" tile, rename header. Small confidence-builder fix.
7. **Continue per remaining carryover list** in P1 → P2 order.

---

## 6. Time investment

| Phase | Wall-clock |
|---|---|
| Morning audit-day (14 PRs) | ~3 hours |
| Phase Alpha verification (2 PRs) | ~30 min |
| Phase Beta expansion (7 PRs) | ~2h 25min |
| Phase Gamma 5a + #147 triage | ~25 min |
| This close doc | ~10 min |
| **Audit-day total** | **~6h 30min substantive + breaks ≈ 8h wall-clock** |

---

## 7. State at close

| | |
|---|---|
| Branch | `main` (clean post-#217 merge) |
| Working dir | `/home/user/skyfire-app` |
| Latest migration | `20260516114046_wave5_pr5a_family_guide_kind` |
| Canonical kinds | 11 (family_guide added by 5a) |
| Open PRs by Claude Code today | 0 (all merged) |
| Outstanding non-Claude PRs | #147 (Dependabot) |

Closing.
