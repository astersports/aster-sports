# Doc-Corpus L99 — D1–D3 Findings + Dispositions (2026-05-29)

Campaign: `AUDIT_DOC_CORPUS_L99_2026-05-29.md`. Three parallel read-only agents, every claim
production-verified (Supabase MCP + code/git). PII guardrail honored (aggregates only).
**D4–D8 queued.**

## Cross-batch synthesis (AP #58) — the dominant pattern

All three categories surfaced **one shared root pattern: a doc fossilizes an early/intended
state; the canonical source (code/DB) moved on; the doc was never reconciled.** This is **AP #63
(PATTERN A) applied to documentation** — a stale *second source* for a concept whose canonical
source already changed. Instances span every category:
- `org_members` table (never existed → `user_roles`) — D1-2
- `roster_type on roster_members` (→ `team_players`) — D1-5
- team-color "mismatch" + Migration 1 (already aligned) — D3-1
- brand doc "missing schema" PART 9 (4 tables already exist) — D3-2
- ledger PR-4 body "0 sent" (DB: 3 sent) — D2-4
- LH_OPS_SPEC §3.8/§3.9 route headers (never built) — D3-10

**Two corollary patterns:**
- **Naming triple-split:** product "Ember" / repo `skyfire-app` / local path `~/legacy-hoopers-app`,
  plus the brand doc still says "Skyfire" throughout and `SKYFIRE_BUILD_QUEUE_v2` filename. Corpus-wide (D8).
- **Missing "shipped vs design-intent" label is the uniform fix.** Where docs caveat unbuilt
  surfaces (LH_OPS_SPEC §3.10 QR, §3.5/3.6 BLOCKED stats, design_review_notes self-status) they're
  safe; where they don't (brand PART 9/12, OPS §3.8/3.9) they mislead. The fix is a label, not a delete.

**The reconciliation that ran today held.** tenancy v3 + LH_OPS_SPEC (§1/§2/§9) verified accurate;
the **one untouched design-chat input — `LH_BRAND_CONTENT_MODEL` — is the most stale**, exactly as predicted.

---

## D1 — Doctrine accuracy (CLAUDE.md) · disposition: FIX (canonical, never archive)

| # | Sev | Claim → Reality |
|---|---|---|
| D1-2 | **P0** | `org_members` referenced in §4, §5 (mig 001), RLS pattern, **AP #1** — table doesn't exist; membership is `user_roles`; `current_user_org_id()` reads `user_roles`. The RLS recursion guard names the wrong table. |
| D1-5 | P1 | §4/§5 "`roster_type on roster_members`" → it's on `team_players` (§11.5 already correct → CLAUDE.md self-contradicts). Known Wave 3.B #29 drift, still open. |
| D1-1 | P1 | §5 "141 migrations" → 171 files / 179 registered. |
| D1-3 | P1 | §5 migration table 008–012 filenames all wrong (008_team_extensions, 009_fix_public_read_rls, 010_user_roles_org_id, 011_tournaments, 012_tournament_audit_gaps). |
| D1-4 | P1 | §5 "13 stale files deleted by PR #566" → 6 still present (023–028). |
| D1-6 | P1 | §13 "9 kinds + 7 transitional" → production `kind_check` = **12** (+coach_roundup, family_guide, games_recap; transitional dropped). |
| D1-7 | P2 | §13.5 brand hexes (#091c36 / #1e3a5f) → header #1e3a5f / accent #4a8fd4 (contradicts §3/§16.11). |
| D1-8 | P2 | §13.6 `getTournamentRecipients()` helper doesn't exist. |
| D1-9 | P2 | §8 QR "NEXT unbuilt" → shipped (`qrcode.react` dep + `ShareScheduleButton.jsx`). |
| D1-10/11 | P3 | AP #53 cites retired AP #50 as live criteria; §11.5 useRoster line :25→:26. |

Verified-clean: §3 tokens (exact), §4 roles, table-rename direction, ghost migrations, §10 LH facts, §11.5 canonical sources.

## D2 — Ledger integrity (EMBER_PENDING_LEDGER, 4,600 lines) · disposition: FIX + COMPACT

| # | Sev | Claim → Reality |
|---|---|---|
| D2-1 | **HIGH** | §4.AL header destroyed by in-place overwrite (PR #563 renamed →§4.AM); 4 body refs (lines 4252/4362/4386/4462) now dangle. Fix: restore header or repoint to §4.AK. |
| D2-2 | MED | §4 ordering broken — ascending §4.AA→AI then descending §4.AY→AJ (root cause: the §4.AT mis-letter). Add an ordering note or normalize. |
| D2-4 | MED | PR-4 `coach_roundup` body "0 sent / actor-pending" → DB has 3 sent. §4.0 index correct; body never reconciled (AP #45 gap). |
| D2-5/6/7 | LOW | §2 "ACTIVE BUGS" all resolved (mislabel); §1 "SHIPPED last 7 days" is 11 days stale; §3 staged-migrations placeholder unresolved. |

**COMPACT:** doc is 4,600 lines; live-pending core ~600–800. Archiving closed waves
(§4.M/§4.N/§4.P–§4.AI ≈ 4,000 lines) to `docs/archive/EMBER_LEDGER_HISTORICAL.md` would shrink it
to ~600–800 of live core. **Needs Frank's approval (archive disposition).**

**Live-pending core** (per §4.0 + latest): family_guide actor-send (0 sent); Cat#30 Batch 3 latents;
§17.5 fix-PR backlog (~35 P0s across Waves 2.B/2.C/3.A/3.B + 4 Wave-3.B arcs); push-consumption +
EN↔ES; Dependabot (BLOCKED on Frank); BUG-4 home LCP.

## D3 — Design-chat inputs

| Doc | Disposition | Key findings |
|---|---|---|
| **LH_BRAND_CONTENT_MODEL** | **FIX (substantial) — the sleeper** | D3-1 [P0] team-color "mismatch" + Migration 1 obsolete (already aligned: constants.js = DB); D3-2 [P0] PART 9 "missing" tables (game_results/tournaments/team_achievements/opponents) all exist; D3-3 [P1] PART 12/13 migration plan all executed (historical); D3-4 [P2] "Skyfire"→"Ember" throughout; D3-5 [P2] asset inventory stale. |
| EMBER_TENANCY_ARCHITECTURE_v3 | KEEP-CURRENT | All schema/blocker/financial claims verified (user_roles UNIQUE, organization_settings cols, family_balances grain). D3-9 [P3] optional: add `voice_config` to §3 org column list. |
| LH_OPS_SPEC | FIX (light) | D3-10 [P1] §3.8/§3.9 still header `/teams/:id/settings` + `/messages/:id` as routes (don't exist; §1 says so) → label "design-intent" like §3.10. D3-11 [P3] comms kinds missing custom_message/games_recap. Schema/routes/nav/§9 facts all verified. |
| external-data/README | KEEP-CURRENT | File map, row counts (284/196/31/11), PII gitignore split, schema implications all verified. |
| LEAGUEAPPS_PARITY_REVIEW | KEEP-CURRENT | Incumbent-mapping, internally consistent; re-confirm the #18 "broken invite" status before the design chat relies on it (not re-verified). |
| design_review_notes | KEEP-CURRENT (partial) | Accurately self-labeled 30/54 incomplete; CSV enum data verified. Treat as partial input. |

---

## Recommended fix arc — "Doc Batch 1" (all FIX; no archive/delete)

1. **CLAUDE.md** (P0/P1 doctrine — ship first, actively misleads RLS/migration work): D1-2 org_members→user_roles (incl. AP #1), D1-5 roster_type→team_players, D1-1/3/4 migration table, D1-6 12 kinds, D1-7/8/9 comms+QR status. *Doctrine commit — per §11.7 op-rule #7 wants a review pass.*
2. **EMBER_PENDING_LEDGER**: D2-1 restore §4.AL / repoint refs, D2-4 PR-4 SHIPPED, D2-2 ordering note. (COMPACT deferred — needs approval.)
3. **LH_BRAND_CONTENT_MODEL**: the substantial reconciliation (strike obsolete mismatch+migrations, mark PART 9 shipped, Skyfire→Ember).
4. **LH_OPS_SPEC**: D3-10 label §3.8/§3.9 design-intent; D3-11 comms kinds.
5. **tenancy v3**: D3-9 add `voice_config` (optional).

**Deferred (need decision):** ledger COMPACT (~4,000-line archive — Frank approves); D4–D8.
