# CC Session Handoff — 2026-06-02 (AsterSports rebrand cutover + §17.5 audit, mid-flight)

> Purpose: hand a fresh code chat the verified state after the Skyfire/Ember → **Aster Sports**
> rebrand + go-live cutover, with the §17.5 29-category audit **in progress** (two agents running
> in parallel). Read §0 first — there is a live parallel agent, so the tree moves.

---

## 0. PRE-FLIGHT (run before any new work — §9.1 / AP #35)

```bash
git fetch origin && git log --oneline origin/main..HEAD && git log --oneline HEAD..origin/main
git status --short
```
**A second agent (terminal-CC) is actively shipping audit-fix PRs.** Treat `origin/main` as moving.
Before planning, list merged + open PRs since #640 and re-reconcile this doc against reality. The
live-state half of the audit was done from the *chat* side via Supabase/Vercel MCP; the
static/code/doc half is being done from the *terminal* side. Don't duplicate either.

---

## 1. WHAT SHIPPED (this arc, all merged to main)

**Rebrand + go-live cutover (chat-CC):**
- #619–#622 — platform name + constellation-arrow mark + "Aster Sports" wordmark (R1/R2).
- #623 — package name → `astersports`; documented the Skyfire legacy-identifier scope.
- #624 — **full internal namespace rename**: `--em-*`→`--as-*`, `em-*`→`as-*`, `EMBER_*`→`ASTER_*`,
  `emberDefaults.js`→`asterDefaults.js`. ~300 files, length-neutral.
- #625 — centralized `APP_BASE_URL` + org-branding defaults into `constants.js` (env-backed).
- #626 — Aster app icons (`apple-touch-icon.png` 180, `favicon.png` 64; retired `phoenix.webp` in #631).
- #627/#628 — invite-parent magic-link host → env, then → `public.app_config` (SQL-settable).
- #629 — **email host cutover** `skyfire-app.vercel.app` → `astersports.app` (constants default + all
  fixtures/snapshot/derived assertions).
- #630 — briefing/notification **sender** → `noreply@astersports.app` (Resend; `astersports.app` verified).
- #631 — straggler cleanup from terminal-CC's review: Header logo fallback `phoenix.webp`→`aster-mark.svg`,
  team-feed ICS `PRODID` Ember→Aster, invite-parent fallback literal, doubled comments.
- #636 (chat-CC) — **security**: revoked anon `EXECUTE` on the 4 `trg_sync_*` trigger functions (AP #57).

**§17.5 audit fixes (terminal-CC, "Wave 3.A/3.B"):**
- #637 — #29 doctrine-drift reconcile (closed the §17.5 "31 vs 29" prose + stale `AUDIT_VELA_REBRAND.md`).
- #638 — created `DISASTER_RECOVERY.md` (closed #25 P0-1).
- #639 — #28 default flip + #19 schema-leak microcopy.
- #634 — pointed platform-level contact + admin BCC at `olivejuiceinc1@gmail.com`. **See §4 — over-applied.**

## 2. IN-FLIGHT / OPEN PRs (the new chat inherits these)

| PR | What | Action needed |
|---|---|---|
| #635 | terminal-CC rebrand drift cleanup (BCC label, token-handler copy, leakage-guard, logo) | review + merge |
| #640 | terminal-CC onboarding — reroute pending-invites to `auth.users` (3A.18.P0-1) | review + merge |
| #632 | Dependabot — **risky-runtime-deps** group (4 updates) | **#14 dep-security: review carefully before merge** |
| #633 | Dependabot — safe-minor-and-patch group (6 updates) | #14 dep-security: low-risk, review + merge |

## 3. §17.5 AUDIT — 29-category gate status

terminal-CC is working the gate as "Wave 3.A/3.B" and shipping fix PRs. **chat-CC live-state half is
DONE** (verdicts below; these need no re-audit, only fix-routing):

- **#26 financial reconciliation — CLEAN.** 164 accts / 244 txns; family_balances billed 166,910.47 −
  net_paid 165,635.47 = outstanding **1,275.00** (balances); 0 overpaid / 0 orphan / 0 cross-org.
- **#23 pg_cron — CLEAN.** 2/2 jobs active, 0 failures/7d.
- **#21 deploy parity — CLEAN** (13↔13; rebrand fns redeployed; verified via updated_at, not byte-diff).
- **#11 edge auth/secrets — CLEAN.** verify_jwt flags correct; 0 null secrets; app_config anon-denied.
- **#7 RLS perf — pre-existing backlog:** 151 WARN `multiple_permissive_policies`, 98 unused idx, 29
  unindexed FKs. No `auth_rls_initplan`. Not rebrand-related.
- **#12 security — one item, now fixed:** anon-SECDEF 7→3 via #636 (3 remaining are intentional public RPCs).
  39 `authenticated_security_definer` mostly intentional RLS helpers.
- **#8/#10 schema/data integrity — CLEAN** (0 tables w/o RLS; 0 orphan/cross-org financial rows).
- **#22 migration ledger — documented divergence:** DB 197 registered vs repo 189 files = 8-file delta
  (known ghost/orphan, CLAUDE.md D1-4, pre-existing). New `app_config` migration registered + mirrored ✓.
- **#25 DR/backup — closed by terminal-CC #638** (`DISASTER_RECOVERY.md`).

**Remaining categories** = terminal-CC's static/code half (#1-6, #9, #13-20, #24, #27). Reconcile its
merged + open PRs to see which are closed.

## 4. OPEN DECISIONS (need Frank)

1. **#634 over-applied the Gmail (chat-CC recommends a fix).** `ORG_CONTACT_DEFAULT` in `constants.js` is
   the **multi-tenant platform fallback** — #634 hardcoded `olivejuiceinc1@gmail.com` there, so a future
   tenant (e.g. St. Patrick's pilot, #28) that hasn't set its own contact inherits Frank's personal Gmail.
   Same shape on the two `REPLY_TO_FALLBACK` consts (lower blast radius). **Recommended:** code defaults →
   platform-neutral (`noreply@astersports.app`/`support@astersports.app`); keep the Gmail only in the LH
   `organization_settings` row (already set via SQL). **Frank had not yet approved this fix at handoff.**
2. **Go live to families** — `organization_settings.pilot_mode_enabled` is **TRUE** (all sends route to the
   test inbox). Flip to FALSE is a deliberate, operator-gated step. Not done.
3. **5b — Supabase Auth invite/login sender** — still Supabase default. Optional: custom SMTP via Resend
   (`smtp.resend.com`, sender `noreply@astersports.app`). Caveman steps were given in chat; skipped for now.
4. **Trademark** — preliminary read 🟡: "Aster Sports" likely registrable in Class 9/42/41; namesakes are
   foreign (Thailand equipment, India academy). Lawyer should clear vs LogicMark's "ASTER" app mark.
5. **Renames (deferred):** Vercel project `skyfire-app` (safe, custom domains survive) + GitHub repo
   `LegacyHoopers/skyfire-app` (medium — Vercel git link + **breaks chat-CC's GitHub MCP tooling scoped to
   that exact name**; do it at a session boundary, ping CC first).

## 5. PROD / EMAIL CONFIG (live state, not all in git)

- `public.app_config.app_base_url = https://astersports.app` (RLS on, anon denied; service-role reads).
- `constants.js` `APP_BASE_URL` default = `https://astersports.app`; `VITE_APP_BASE_URL` NOT set in Vercel.
- Senders: briefings/notifications **from** `noreply@astersports.app` (#630). Invite/login = Supabase default.
- `organization_settings` (org `e3e95e21-…`): `pilot_mode_enabled=TRUE`, `reply_to_email` +
  `pilot_test_recipient_email` = `olivejuiceinc1@gmail.com` (temporary). `from_name='Legacy Hoopers'`.
- `astersports.app` live on Vercel project `prj_peID30eF61qubU90e1TVvM1kikuP` (team `legacyhoopers-projects`).
  `.io`/`.co` redirects done. Resend has `astersports.app` verified.
- Supabase project `vrwwpsbfbnveawqwbdmj`. Two pg_cron ticks active (briefing dispatch + auto-draft).

## 6. STANDING BACKLOG (fix-routing, not blocking)

- `multiple_permissive_policies` ×151 (RLS perf consolidation sweep).
- migration-ledger 8-file ghost/orphan divergence (CLAUDE.md D1-4).
- `EMBER_PENDING_LEDGER.md` is **stale since 2026-05-27** — missing the entire Wave 1/2/3 cutover +
  this rebrand arc. Full §1/§4 reconciliation is overdue (this PR adds only the 2026-06-02 entry).

## 7. AGENT COORDINATION + BEHAVIORAL DIRECTIVE

- **Two lanes:** terminal-CC (terminal, full working tree — static/code/build/dep/doc audits, fix PRs) +
  chat-CC (this lane, Supabase/Vercel/GitHub MCP — live-state audits, prod config, PR orchestration).
  Each surfaces what the other can't. Don't duplicate.
- **Operator directive in force (carry forward):** advisor mode — lead with the challenge/gap, never open
  with agreement; tag claims `[Certain]`/`[Likely]`/`[Guessing]`; no "great question / absolutely / you're
  right" filler. Execute direct instructions without manufactured pushback.
- Standing repo doctrine unchanged: branch+PR (never commit to main), auto-merge SQUASH armed in the same
  MCP burst as create (§15), §16.x design system, CLAUDE.md anti-patterns.

---
_Handoff authored by chat-CC, 2026-06-02. Verify §0 before acting._
