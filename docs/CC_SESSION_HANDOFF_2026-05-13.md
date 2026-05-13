# CC Session Handoff — 2026-05-13

## Purpose

Captures the closed-out state of the **PR-Privacy-Denylists** work plus the broader session ledger. Supersedes the earlier in-flight version of this same file (PR #158); see git history if the in-flight context is needed.

Read this + `git log --oneline -10` + CLAUDE.md §16.7.1 and you have the full picture.

---

## What landed this session

Three real things, separable from tooling churn:

1. **Sentry IP/geo storage stopped going forward.** Project toggle "Prevent Storing of IP Addresses" flipped at `/settings/legacy-hoopers/projects/javascript-react/security-and-privacy/`. Defensive `event.user.{geo,ip_address}` strip added to `src/lib/sentry.js` `beforeSend` — no-op in current config (`sendDefaultPii: false`), armed if anyone later flips it to true.

2. **PostHog SDK auto-capture cleaned up.** `property_denylist` shipped in `src/lib/posthog.js` covering ~60 keys: URL/path/referrer family, browser/OS/device/viewport/screen family, all UTM keys, all click-ID keys, plus their `$initial_` mirrors. Verified first-party via PostHog MCP — the two `$set` events from the post-merge re-login have zero SDK auto-capture properties on the outbound payload.

3. **Doctrine captured.** CLAUDE.md §16.7.1 documents the two-surface enrichment principle, the source-hierarchy rule for SDK mechanism verification, current state per surface for both PostHog and Sentry, and the three SDK-mechanism corrections caught this session. Next SDK integration will not repeat this mistake without contradicting written doctrine.

## What didn't land (honest gap)

**PostHog server-side GeoIP enrichment still active.** Every login by an authenticated parent re-attaches `$geoip_*` + `$initial_geoip_*` (~30 fields including city, lat/long, postal, timezone, NY subdivision) to their person profile at PostHog's ingest layer. SDK `property_denylist` cannot reach server-enriched fields — architectural reason captured in §16.7.1.

Canonical fix per PostHog staff is disabling the GeoIP transformation at `/pipeline/transformations`; that page was not findable on our tier during the audit. Help desk ticket pending (carryover item below).

Historical cleanup of the existing person profile (~30 `persons-property-delete` MCP calls) is **deferred** rather than skipped — running it now would be undone by the next login, since re-enrichment still happens. Will run alongside the help desk resolution when it lands.

---

## Task graph final state

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Sentry "Prevent Storing of IP Addresses" toggle | ✅ completed | User-flipped, confirmed |
| 2 | PostHog `property_denylist` (non-geo) in `src/lib/posthog.js` | ✅ completed | Shipped in PR #159 |
| 3 | Sentry `beforeSend` defensive `event.user.{geo,ip_address}` strip | ✅ completed | Shipped in PR #159 |
| 4 | CLAUDE.md §16.7.1 doctrine subsection | ✅ completed | Shipped in PR #159 |
| 5 | Bundled PR for #2/#3/#4 | ✅ completed | PR #159 merged at `03fdbdf` |
| 6 | Post-merge verification of clean identify event | ✅ completed | Verified via PostHog `execute-sql` on `$set` events from post-merge re-login |
| 7 | Cleanup historical geo properties on existing person profile | ❎ deleted | Deferred to post-help-desk; would be undone by re-enrichment |
| 8 | Verify `$geoip_disable` mechanism via PostHog docs before drafting code | ✅ completed | Caught the wrong mechanism; triggered scope correction |

---

## PR ledger this session

| # | Title | State | Notes |
|---|-------|-------|-------|
| #158 | docs: CC session handoff 2026-05-13 (PR-Privacy-Denylists in-flight state) | MERGED | Earlier in-flight handoff doc; superseded by this file. Auto-merged squash. |
| #159 | feat(privacy): non-geo SDK denylist + defensive Sentry strip + §16.7.1 doctrine | MERGED | The actual privacy ship. CI: 1 minute, squashed at `03fdbdf`. |

Open at session end (not opened by this session):

- **#147** chore(deps)(deps): bump the risky-runtime-deps group across 1 directory with 5 updates — Dependabot, opened 04:21 UTC, untouched

---

## MCPs at session end

| MCP | Status | Notes |
|---|---|---|
| `plugin:posthog:posthog` | Authed | Project 421610. Used for `search`, `info`, `call persons-list`, `call persons-retrieve`, `call docs-search`, `call execute-sql`. |
| `supabase-ro` | Authed | Project-scoped to `vrwwpsbfbnveawqwbdmj`, read-only. Available but unused this session. |
| `supabase-rw` | Not authed | Pilot, full access. Untouched. |
| `claude.ai Sentry` | Available (hosted) | Used `find_organizations`, `find_projects`, `search_events`, `search_issues`, `get_sentry_resource`. |
| Other claude.ai MCPs (Ahrefs, Guru, Lucid, Microsoft 365, Bitly, Canva, Cloudflare, Gmail, Calendar, Drive, Mermaid, Stripe, Supabase unscoped, Vercel, Wix) | Available, not used | All connected via claude.ai OAuth or untouched. |

---

## Memory files at session end

`/home/admin/.claude/projects/-home-admin/memory/MEMORY.md` index has four entries; the **new one this session** is the last:

- `check-main-before-framing-revive-options` (pre-existing)
- `use-gh-pr-merge-auto-not-bash-wait-loops` (pre-existing)
- `ask-receipts-when-reviewer-cites-off-cc-work` (pre-existing, referenced heavily this session)
- **`verify-sdk-mechanism-against-installed-source`** — written today. When a reviewer specifies an SDK option, grep the installed version's source/docs before drafting; generalized SDK knowledge misses the difference between SDK-side filters and server-side enrichment. Anchored to today's PostHog GeoIP arc.

---

## Carryover items (priority order)

| # | Item | Blocked on | Estimate |
|---|------|-----------|----------|
| 1 | PostHog help desk ticket re: GeoIP transformation toggle on Free tier | You opening it | ~5 min to file, days for response |
| 2 | `persons-property-delete` cleanup loop on person `502fd821-…` (30 calls) | Resolution of #1 | ~5 min CC time once unblocked |
| 3 | react-hooks 7.1.1 triage execution (Group D first, mechanical 3-site fix) | Nothing — pure CC work | Unknown without scoping |
| 4 | Test-team / test-org doctrine decision | Your decision | — |
| 5 | Playwright #2 (auth-gated login) | #4 | — |
| 6 | Playwright #3 (RSVP both paths) | #4, #5 | — |
| 7 | Playwright #4 (briefing send) | #4, #5, #6 | — |
| 8 | Event taxonomy (PostHog) | Your §16.12 picks | — |
| 9 | Lighthouse warnings-only enforcement | Post-Wave-1 | — |

None are urgent. None are degrading anything currently working.

---

## Session lessons (durable)

The pattern that emerged today: a chat-side reviewer (working from generalized SDK knowledge) proposed three distinct mechanisms for stopping PostHog's GeoIP enrichment, and **all three were wrong** when checked against the installed SDK version + PostHog's own docs:

1. SDK-side `property_denylist` on `$geoip_*` — caught by reading `node_modules/posthog-js/lib/src/posthog-core.js`. Those properties are server-enriched; denylist runs pre-transport; no-op.
2. PostHog "Discard client IPs and GeoIP data" project toggle — caught by `docs-search`. Real label is "Discard client IP data" (no GeoIP); per docs, only discards raw IP at rest, GeoIP enrichment still runs.
3. `$geoip_disable` super-property on `posthog-js` — caught by `docs-search`. Documented for server SDKs only; open bug GH #31154 for alias/merge events on browser SDK (which our `identify` after Supabase auth uses).

The keeper: **reviewer's general knowledge < CC's first-party verification of the installed version, every time.** Captured in the memory file written today.

---

## Resume path

Next CC session:

1. Read this doc + `git log --oneline -10` + CLAUDE.md §16.7.1.
2. If the PostHog help desk has responded on the GeoIP transformation, that unblocks carryover #1 → #2 (file the dashboard change, then run the cleanup loop).
3. Otherwise, pick from carryover #3 onward — react-hooks triage is the most self-contained.

End handoff.
