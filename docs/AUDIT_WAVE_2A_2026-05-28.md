# AUDIT — Wave 2.A (DB / security adjacent) — 2026-05-28

**Contract:** PLATFORM_PRIORITIES.md §17.6 Wave 2.A set per §4.AN routing — categories #11 edge function auth + secrets, #13 PII surface, #14 dependency security, #15 rate-limit / abuse surface, #23 migration ledger consistency. Five parallel line-by-line audits per CLAUDE.md §17.8 standing rule (AP #50 retired in PR #564). Each agent ran first-pass line-by-line + §16.15 2-pass deep-read addendum. This doc is the cross-batch synthesis stitched per AP #58.

**Status:** findings only. Routing → fix PRs is the next workstream (3 fix-PR agents dispatched in same turn for the immediately-shippable P0s; 2 P0s deferred for design decisions).

---

## Headline

- **7 consolidated P0s** across 3 surfaces (#11 + #15 + #23)
- **15 P1s** across all 5 categories
- **13 P2s** deferred to Wave 2.B / Wave 3
- **3 new AP candidates** surfaced (#63 deployed-function ledger reconciliation gate + PII-in-error-bodies pattern + token-handler HTML cache-headers pattern)
- §17.5 calibration: 5/5 categories surfaced real findings (`#14` was clean but real — 0 CVEs, audit pin held). **No demotions.**

---

## Cross-cutting patterns (AP #58 synthesis)

### CROSS-PATTERN 1 — Production state diverges from repo state silently

Cross-surfaced by #11 and #23 independently. A class of operational blind spot where production has shipped code or schema that repo + audit tests can't see:

| Source | Finding |
|---|---|
| #11 P0-1 | `feedback-token-handler` deployed in production at 2026-05-22 (verify_jwt:false). Absent from `supabase/functions/`. Missing config.toml entry. Calls `verify_feedback_token` RPC that doesn't exist in `pg_proc`. Every feedback tap currently returns "Link expired." Likely leftover from PR #509's cutover-feedback revert. |
| #23 P0-1 | 8 migrations registered in DB with no repo mirror (C3). Schemas live in production; if `supabase db reset` runs, the changes evaporate. CLAUDE.md §5 documents only 5 ghost mirrors as preserved-for-reset; these 8 are an undocumented data-loss vector. |
| #23 P0-2 | 2 audit_relkind files in undetermined applied state — either bundled into `20260521134313_audit_hygiene_followups` or unapplied. Investigation gate. |
| #23 P1 | 6 migrations with filename-timestamp drifted from DB-registered version (AP #21 violations from chat-side claude.ai → MCP-apply round-trip timing). |

**New AP candidate #63 — Deployed-function ledger reconciliation gate:** the existing `verifyJwtConfigAudit.test.js` audit pin iterates `supabase/functions/*` — it can detect repo-without-config-entry but cannot detect deployed-without-repo. Extension needed: assert `list_edge_functions()` ≡ `readdirSync('supabase/functions')`. Same shape needed for migrations: `list_migrations()` ≡ repo files. Promote on first occurrence per AP #47's cost-asymmetry rationale (mechanical operational rule, bounded recovery cost today, worst-case data loss tomorrow if misconfigured deploy flips a token-handler's `verify_jwt` to true).

### CROSS-PATTERN 2 — Token-handler hardening parity gap (highest-stakes category)

Cross-confirmed by #11 + #13 + #15. Three independent audits surface the same surface:

| Source | Finding |
|---|---|
| #15 P0-1 | `verify_unsubscribe_token` HMAC present + epoch stamped in payload, but TTL never validated + no `_token_uses` table for replay protection. Compare to `verify_rsvp_token` and `verify_callup_token` which check both. |
| #11 P1-2 | `verify_unsubscribe_token` has EXECUTE granted to `anon`; peers grant only `service_role` + `authenticated` + `postgres`. Anon EXECUTE widens the attack surface unnecessarily. |
| #13 P1-4 | All 3 token-handler HTML confirmation pages (`rsvp-token-handler`, `callup-token-handler`, `unsubscribe-handler`) render kid first name + event location with no `Cache-Control: private, no-store` + `X-Robots-Tag: noindex` headers. MUA preview-bot prefetch can log + index PII. |
| #15 P0-2 | `team_feed_token` is permanent bearer secret with no rotation surface. Token-as-auth pattern; if leaked once, schedule scrapable forever until manual rotation. |

**Token-handler attack surface is Wave 2.A's highest-risk concentration.** Fix scope (one PR): `unsubscribe_token_uses` table + TTL + replay + REVOKE anon + Cache-Control/X-Robots-Tag on all 3 token-handler HTML responses.

### CROSS-PATTERN 3 — Cost / PII amplification via uncapped fan-out

Cross-confirmed by #13 + #15:

| Source | Finding |
|---|---|
| #15 P0-3 | `send-tournament-message` has no app-layer per-admin per-day cap. Compromised admin → unbounded Resend sends until account-level cap fires. |
| #15 P1-1 | `send-push` accepts unbounded `user_ids` array. One cron-secret POST can fan-push to every user in an org. |
| #15 P1-2 | `parse-tournament-schedule` + `suggest-briefing-closer` have no per-org Anthropic-call cap. Admin clicking "Suggest closer" 1000× burns budget. |
| #13 P1-2 | `send-tournament-message:142` returns guardian emails in 403 error body for pilot-mode reject — recoverable from Vercel/CDN logs. |
| #11 P1-1 | `RESEND_API_KEY` in `Deno.env` instead of `app_secrets` (AP #33 violation). The audit regex `_SECRET` doesn't catch `_KEY`/`_TOKEN`/`_PASSWORD` suffixes. |

**New AP candidates:**
- **PII in 4xx/5xx error bodies:** functions raise structured errors with PII in the message for debuggability; bodies leak to Vercel/CDN logs. Promote on third instance.
- **Token-handler HTML cache headers:** any function rendering PII to publicly reachable HTML must declare `Cache-Control: private, no-store` + `X-Robots-Tag: noindex`. Promote on third instance.

---

## Wave 2.A P0 consolidated (7)

Ordered by fix-PR clustering.

### Migration ledger surface (2 P0s — bundle into one cleanup PR)

1. **#23 P0-1 — 8 orphan migrations missing repo mirror.** Read SQL body via `execute_sql`, write to `supabase/migrations/<version>_<name>.sql`. The 8: `20260426111421_tournament_times_correction`, `20260426200358_data_integrity_fix`, `20260426203347_data_corrections_resurrection_jersey`, `20260426203943_resurrection_address_correction`, `20260426205441_venue_address_corrections_and_canonical_urls` (6848 chars — significant body, verify against deployed schema before mirroring), `20260426215822_rename_cardinal_spellman_to_cyo_spellman`, `20260429020355_ship_x_backfill_author_names_from_guardians`, `20260429104058_y2b_backfill_spring_2026_game_results`.

2. **#23 P0-2 — 2 audit_relkind files in undetermined state.** Resolve: were they bundled into `20260521134313_audit_hygiene_followups` (→ delete repo files), or never applied (→ apply via MCP)? Investigation via schema check on `player_game_stats` + `team_types` relkind filters.

### Token-handler surface (1 P0 — bundle into hardening PR)

3. **#15 P0-1 + #11 P1-2 + #13 P1-4 — `verify_unsubscribe_token` hardening + universal token-handler HTML cache headers.** Single migration + 3 edge function header updates:
   - Create `unsubscribe_token_uses` table (mirror `rsvp_token_uses` shape; nonce PK + used_at; **omit IP+UA per #13 P1-1 retention recommendation**)
   - Update `verify_unsubscribe_token` body: validate epoch < now() + 30d; consult `unsubscribe_token_uses` for replay; insert nonce on accept
   - `REVOKE EXECUTE ON FUNCTION verify_unsubscribe_token(text) FROM anon` (parity with rsvp/callup verifiers)
   - Add `Cache-Control: private, no-store` + `X-Robots-Tag: noindex` headers to `rsvp-token-handler`, `callup-token-handler`, `unsubscribe-handler` HTML responses

### Production-vs-repo drift (1 P0 — single-action PR)

4. **#11 P0-1 — Delete deployed `feedback-token-handler` edge function.** Per CLAUDE.md §4.AJ PR #509, the feedback infrastructure was reverted 2026-05-24 across resolvers + send pipeline + admin UI + 14 src deletions + edge function + DB. The `feedback-token-handler` edge function was missed in the revert sweep. Per §4.AJ "Decision pending → §7: whether to rebuild briefing feedback in a lighter form... or shelve permanently" — until that decision lands, the orphan deployed function should be deleted. Action: delete via Supabase MCP `delete_edge_function` (or equivalent). No file changes.

### Deferred to next session (need design decisions)

5. **#15 P0-2 — `team_feed_token` rotation surface.** Needs admin UI design (rotation button on team admin page? Per-team rotation RPC?) — not a simple migration.

6. **#15 P0-3 — `send-tournament-message` per-admin rate cap.** Needs quota design (50/day? 500/day? per-(user_id, org_id, kind) bucketing?) + audit row schema for `pii_audit_log`-style tracking.

7. **#11 P0-1 follow-up — AP #63 audit-test extension.** Add the deployed-vs-repo ledger reconciliation test to `verifyJwtConfigAudit.test.js`. Bundle with future hygiene PR.

---

## Wave 2.A P1 / P2 surface

Summary — full file:line details preserved in per-agent reports section below.

**P1 (next-phase fix):**
- #11 P1-1: `RESEND_API_KEY` move from Deno.env to `app_secrets` (AP #33; suffix regex blind spot)
- #11 P1-3: `suggest-briefing-closer` tournament_id org cross-check
- #13 P1-1: rsvp/callup `_token_uses` IP+UA retention policy (90d? remove entirely?)
- #13 P1-2: `send-tournament-message` 403 body strip guardian emails
- #13 P1-3: `parse-tournament-schedule` prompt payload PII audit
- #14 P1-1: `lucide-react` minor bump (1.16.0 → 1.17.0)
- #14 P1-2: Version-pinning doctrine decision (lockfile-only vs explicit pins on supply-chain-critical)
- #15 P1-1: `send-push` user_ids array cap
- #15 P1-2: Anthropic-call per-org throttle
- #15 P1-3: Public-schedule scraping throttle (perimeter or app-layer)
- #15 P1-4: invite-parent per-admin invite-rate cap
- #15 P1-5: `apply_callup_decline` EXECUTE grant chain verification
- #23 P1-1: Delete 13 stale legacy-numbered files
- #23 P1-2: Rename 6 AP #21 filename-timestamp drifted files
- #23 P1-3: Update CLAUDE.md §5 ghost count to reflect 5+13 (not 5+11)

**P2 (defer):**
- #11 P2-1: Consolidate 5 duplicated `getAppSecret` implementations
- #11 P2-2: `team-feed` events query org_id filter (cosmetic — FK-scoped already)
- #11 P2-3: `app_secrets` RLS-enabled-zero-policies documentation
- #13 P2-1: `users_metadata.full_name` 7-call-site fanout consolidation
- #13 P2-2: Ride board pickup_address + driver_phone privacy toggle
- #13 P2-3: `players.medical_notes` + `emergency_contact_*` dead PII columns
- #13 P2-4: PostHog `$geoip_*` (known, ticket pending §16.7.1)
- #14 P2-1: 14 duplicate transitive versions
- #14 P2-3: PostHog dep chain (core-js + preact, low-risk)
- #15 P2-1: Token-use IP/UA anomaly detection (1-nonce, 50-IPs alerting)
- #15 P2-2: briefing-cron-dispatch batch cap re-evaluation at multi-org scale
- #15 P2-3: Resend webhook collision in 7d window
- #15 P2-4: `get_invitation_by_token` cancelled_at non-enforcement

---

## §17.5 calibration outcome

All 5 Wave 2.A categories surfaced real findings:

- **#11 Edge function auth + secrets:** 1 P0 / 3 P1 / 3 P2 — retain
- **#13 PII surface:** 0 P0 / 4 P1 / 4 P2 — retain (RLS tight + SDK locks intact, but operational PII surface has real gaps)
- **#14 Dependency security:** 0 P0 / 2 P1 / 3 P2 — retain (audit pin holds, lockfile clean — but P1 routine hygiene)
- **#15 Rate-limit / abuse:** 3 P0 / 5 P1 / 4 P2 — retain (highest-stakes category)
- **#23 Migration ledger consistency:** 2 P0 / 3 P1 / 2 P2 — retain

**No demotions.** All 5 retain for Wave 3+ if re-needed (Wave 1's §16.15 addendum re-read per §4.AN).

---

## Routing — fix PRs shipping in same session

Per Frank's noon directive, 3 P0 fix-PR agents dispatched in same turn after this doc lands:

| Fix PR | Closes | Risk |
|---|---|---|
| Migration ledger hygiene | #23 P0-1, P0-2 + 3 P1s | Low-medium (8 backfill mirrors + investigation gate) |
| Token-handler hardening | #15 P0-1 + #11 P1-2 + #13 P1-4 | Medium (migration + 3 edge function deploys) |
| Delete `feedback-token-handler` | #11 P0-1 | Low (single delete operation) |

**Deferred to next session:** #15 P0-2 (team_feed rotation surface), #15 P0-3 (rate-cap quota design), AP #63 audit-test extension.

---

## Per-agent findings (preserved for fix-PR routing)

### #11 Edge function auth + secrets

- 12 edge functions in repo + 1 deployed-only (`feedback-token-handler`)
- 9 with `verify_jwt:false` declared in config.toml
- AP #31 audit pin in `verifyJwtConfigAudit.test.js` enforces repo→config linkage but cannot detect deployed-without-repo
- P0-1: feedback-token-handler compound — delete deployed function
- P1-1: RESEND_API_KEY in Deno.env (AP #33 violation; suffix regex blind spot)
- P1-2: `verify_unsubscribe_token` anon EXECUTE (parity gap with rsvp/callup)
- P1-3: `suggest-briefing-closer:95-103` filters events by tournament_id only without org cross-check
- P2-1: 5 duplicated `getAppSecret` implementations across edge functions

### #13 PII surface

- 6 PII classes mapped (Guardian / Child / Financial / Auth / Behavioral / Token-use)
- SDK telemetry locks verified intact (PostHog property_denylist, Sentry beforeSend, no new client SDKs since 2026-05-13)
- Zero storage buckets — photo wall not yet built
- P1-1: `rsvp_token_uses` + `callup_token_uses` capture IP+UA indefinitely (geolocation + device fingerprint log per parent tap)
- P1-2: `send-tournament-message:142` returns guardian emails in 403 body
- P1-4: 3 token-handler HTML responses render kid PII without Cache-Control/X-Robots-Tag headers
- P2-3: `players.medical_notes` + `emergency_contact_*` dead PII columns at rest
- COPPA gaps: no consent capture surface, no per-child age gate, no medical_notes governance, photo wall pending

### #14 Dependency security

- 9 runtime + 21 dev deps, 450 transitive
- 0 CVEs (critical/high/moderate/low)
- 0 phantom deps, 0 unused deps
- 0 copyleft contamination
- Lockfile in sync; no drift
- P1-1: lucide-react 1.16.0 → 1.17.0
- P1-2: Version-pinning doctrine decision (status quo recommended; pin-vs-caret call)
- PATTERN ALPHA: supply-chain hygiene was front-loaded into discipline (Dependabot groups, knip, audit pins) earlier than runtime-correctness disciplines

### #15 Rate-limit / abuse surface

- 9 verify_jwt:false edge functions + 2 anon-EXECUTE SECDEF RPCs + 5 public-read RLS policies + 3 anon-reachable UI surfaces
- P0-1: `verify_unsubscribe_token` no TTL + no replay + anon EXECUTE
- P0-2: `team_feed_token` permanent bearer with no rotation
- P0-3: `send-tournament-message` no per-admin daily cap
- PATTERN ALPHA (token TTL + replay parity): rsvp + callup hardened; unsubscribe is the outlier
- PATTERN BETA (cron-secret-as-only-ceiling): 4 functions trust cron_secret as sole gate, no per-call counter
- PATTERN GAMMA (LLM-call cost amplification): 2 Anthropic-touching admin features have no per-org throttle

### #23 Migration ledger consistency

- 176 repo files + 174 DB rows reconciled = 205 distinct entries deduped
- State A (clean) = 132
- State B (ghosts) = 16 (5 documented + 13 stale legacy — CLAUDE.md §5 said 11, off by 2)
- State C (orphans) = 29 (8 genuine backfill-required + 6 AP #21 mismatches + 11 path_b cosmetic + 2 audit_relkind investigation + 3 ship_7 name cruft, no remaining duplicate registrations)
- P0-1: 8 orphan migrations missing repo mirror (data-loss vector)
- P0-2: 2 audit_relkind files investigation gate
- AP #21 compliance rate (last 30 days): 95% version-prefix match, 82% version + name exact

---

## AP compliance

- **AP #43** cross-role coverage: applied via #13 PII audit's per-role analysis (PlayerRow.jsx visibility matrix, PostHog identify gate, etc.)
- **AP #45** ledger reconciliation: EMBER_PENDING_LEDGER §4.AO shipped in same commit
- **AP #58** cross-batch pattern check: applied — 3 CROSS-PATTERNs identified stitching across the 5 reports + each agent's findings included a pattern-continuation section
- **AP #61** pre-phase audit gate: this IS that gate for Wave 2.A. Required outputs delivered: bug surface with file:line / object refs; enhancement surface in P1s; redesign-potential routed to Wave 2.B/3; explicit routing recommendations with cutover-gate proposal
- **§17.8 methodology lock:** line-by-line per category with §16.15 2-pass deep-read addendum confirmed in every agent's "§16.15 2-pass cascade catch" section. Empirical signal: each agent reported what Pass 2 surfaced that Pass 1 missed (~30-40% addendum yield per category)
- **AP #50:** RETIRED; methodology held to the new line-by-line standing rule

---

**Next session opens with:** §9.1 pre-flight + verification that 3 fix PRs from this session merged + Wave 2.B dispatch (#1 perf cold load + #2 warm-cycle nav + #3 bundle/code split, anchored on the 5s home page LCP regression per §4.AN).
