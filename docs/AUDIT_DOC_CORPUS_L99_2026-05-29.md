# Doc-Corpus L99 Audit Campaign — 2026-05-29

**Status:** DISPATCHED (D1–D3 this run; D4–D8 queued).
**Trigger:** Frank — "review all docs in the repo for accuracy and usefulness." This session
alone surfaced heavy doc-drift (tenancy doc titled `_v3` holding v2 content; `LH_OPS_SPEC`
full of fictional schema; CLAUDE.md §4 `roster_type` drift), so the corpus carries both
**accuracy debt** (claims vs production) and **usefulness debt** (dead/superseded docs living
beside live ones).

**Scope:** 78 markdown docs — 75 under `docs/` (~39.4K lines) + CLAUDE.md (1,381),
README.md, design_review_notes.md at root. Notable mass: EMBER_PENDING_LEDGER (4,580),
SKYFIRE_BUILD_QUEUE_v2 (3,415), `archive/` (~20K incl. SKYFIRE_FULL_AUDIT 8,515).

**Two grading axes per doc:**
- **Accuracy** — every factual claim verified against production (Supabase MCP + code grep),
  NOT asserted. The design chat's own ~50% false-positive caution on granular claims makes
  verification non-negotiable.
- **Disposition** — KEEP-CURRENT / FIX / ARCHIVE / DELETE. **Archive & delete are RECOMMENDED,
  never executed unilaterally — Frank approves each.**

---

## Step 0 — Classification triage (run first; resolves most "usefulness")

Classify all 78 docs into four buckets before deep audits:
- **CANONICAL** (acted on now — must be accurate): CLAUDE.md, EMBER_PENDING_LEDGER,
  PLATFORM_PRIORITIES, README.
- **ACTIVE-REFERENCE** (current work / design-chat inputs): EMBER_TENANCY_ARCHITECTURE_v3,
  LH_OPS_SPEC, LEAGUEAPPS_PARITY_REVIEW, LH_BRAND_CONTENT_MODEL, external-data/,
  design_review_notes, AUDIT_WAVE_1/2A/2B/2C/3A/3B, AUDIT_CATEGORY_30, AUDIT_GAP_AND_FIX_SCOREBOARD.
- **HISTORICAL/SNAPSHOT** (point-in-time; accuracy moot, disposition is the question):
  ~20 May-16-era AUDIT_*/L99_*/STATE_OF_AFFAIRS_v3–v6, CC_SESSION_HANDOFF, AUDIT_DAY,
  AUDIT_PHASE1–5, AUDIT_BETA_*, AUDIT_SYNTHESIS.
- **DEAD/SUPERSEDED** (archive/delete candidates): SKYFIRE_BUILD_QUEUE_v2, REMAINING_PHASES_AUDIT,
  CUTOVER_WAVE_GAP_AUDIT, double-archived `archive/` entries.

---

## Audit categories

| # | Category | Docs in scope | Lens | Priority |
|---|---|---|---|---|
| **D1** | Doctrine accuracy (extends Wave 3.B #29) | CLAUDE.md | line-by-line vs production: §3 tokens · §4 `roster_type` drift (known-wrong: it's on `team_players`, not `roster_members`) · §5 schema + migration count · §8 build order · §10 LH facts · §11.5 ground-truth tables · §13 brand colors · retired-AP (#50/#56/#59) reference cleanup · SKYFIRE→EMBER | **P0** |
| **D2** | Ledger integrity | EMBER_PENDING_LEDGER (4,580) | §4.A* entries reconciled vs merged PRs (AP #45) · stale "pending" already shipped · section-letter collisions (a §4.AT collision occurred this session) · compaction of closed waves | **P0** |
| **D3** | Design-chat input accuracy | tenancy v3, LH_OPS_SPEC, parity, **LH_BRAND_CONTENT_MODEL** (500 — untouched this session, most-likely-stale), external-data, design_review_notes | verify vs production; brand model tokens vs CLAUDE.md §3 the sleeper risk | **P0** |
| **D4** | Roadmap/build-queue accuracy | SKYFIRE_BUILD_QUEUE_v2 (3,415), CUTOVER_WAVE_GAP_AUDIT (836), REMAINING_PHASES_AUDIT, PLATFORM_PRIORITIES | shipped-vs-pending truth; large stale surface | P1 |
| **D5** | Engine/briefings references | BRIEFINGS_COVERAGE_L99, BRIEFING_RENDERER_REFERENCES (512), BRIEFING_TEMPLATES, CALLUP_TOKEN_TESTING | match current renderers/kinds (placementBlock/hotelBlock drift just found in Cat #30) | P1 |
| **D6** | Historical-doc disposition | ~20 May-16-era snapshots | usefulness only — which are superseded → move to `archive/` | P2 |
| **D7** | archive/ hygiene | 22 archived docs (~20K) | confirm no active doc references them; flag delete candidates | P2 |
| **D8** | Cross-reference + naming integrity | corpus-wide | broken "see §X"/file:line pointers · SKYFIRE→EMBER rename · `_v2/_v3` labels matching content · date-stamp accuracy | P1 |

---

## Methodology (L99 per §16.15, adapted for docs)

1. **Classification + first-pass** — line-by-line for CANONICAL/ACTIVE; skim for HISTORICAL.
2. **§16.15 deep-read addendum** — second pass; ~40% miss rate without it.
3. **Accuracy spine** — every factual claim cross-checked against production (Supabase MCP
   `execute_sql`, read-only, project `vrwwpsbfbnveawqwbdmj`; code grep). No asserted findings.
4. **AP cross-ref** — tag findings (AP #45 ledger drift, AP #63 cross-doc inconsistency, etc.);
   AP #58 cross-batch synthesis between agents so a recurring pattern (e.g. SKYFIRE naming)
   surfaces once, not N times.
5. **Disposition per doc** — KEEP-CURRENT / FIX / ARCHIVE / DELETE + rationale. Archive/delete
   recommended only; Frank approves.

**PII guardrail (COPPA):** all DB queries + findings use counts/types/aggregates only — never
real names/emails/phones/addresses/birthdates.

---

## Dispatch & sequencing

- **Parallel agents per category** (Category #30's 4-agent fan-out pattern), read-only,
  production-verified, returning findings (no edits/PRs/commits from agents).
- **Sequence:** D1–D3 first (P0 — canonical + active docs actively misleading work AND the
  live design chat). D4/D5/D8 next (P1). D6/D7 disposition last (P2).
- **Output:** `docs/AUDIT_DOC_CORPUS_FINDINGS_2026-05-29.md` (per-doc accuracy findings +
  disposition table) + ledger entry (AP #45), feeding a fix arc like the code campaign.

## This run
- **D1 (doctrine), D2 (ledger), D3 (design-chat inputs) — DISPATCHED** (3 parallel agents).
- **D4–D8 — QUEUED** (recommend after the design spec lands; not blocking today).

## Out of scope (this campaign)
- Code audits (covered by the §17.5 campaign + Category #30).
- Rewriting docs — this produces findings + dispositions; fixes route as a follow-up arc.
- The design spec itself (in-flight in the claude.ai chat).
