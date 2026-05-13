# CC Session Handoff — 2026-05-13

## Purpose

Frank is heading out of town. This doc captures the in-flight state of the **PR-Privacy-Denylists** work so the next CC session can resume without re-deriving context from chat history.

Read this + tail of CLAUDE.md §16.7 + `git log --oneline -10` and you have the full picture.

---

## In-flight work: PR-Privacy-Denylists (task graph)

7 tasks, wired with dependencies. **None of the code is on disk yet — `main` is unchanged at `91e16ce`.**

| # | Task | Status | Blocked by |
|---|------|--------|------------|
| 1 | Confirm Sentry "Prevent Storing of IP Addresses" toggle flipped | pending | — |
| 2 | Add `$geoip_disable` super-property + `property_denylist` to `src/lib/posthog.js` | blocked | #1 |
| 3 | Add defensive geo/ip strip to `src/lib/sentry.js` `beforeSend` | blocked | #1 |
| 4 | Document two-surface enrichment principle in CLAUDE.md §16.7.x | blocked | #1 |
| 5 | Open bundled PR for posthog.js + sentry.js + CLAUDE.md changes | blocked | #2, #3, #4 |
| 6 | Verify clean identify event after toggle + PR merge | blocked | #5 |
| 7 | Clean up historical geo properties on existing person profile (~30 MCP calls) | blocked | #6 |

Task graph lives in CC's local task state. `TaskList` in a fresh session surfaces it.

---

## Scope: actually-correct (post-docs-search)

This session re-scoped the PostHog fix three times before landing on the right mechanism. Capturing the final version so it doesn't get re-derived (or re-mis-derived) later:

### The two leaks

- **PostHog server-side GeoIP enrichment** attaches `$geoip_*` (15 fields) and `$initial_geoip_*` (15 mirror fields) to every event from the source IP. Verified first-party on person `502fd821-f79c-5747-8cad-7700a9746d19` (Supabase auth UID `0b81b465-225e-4ede-b752-ed9a2dde1f7c`): Armonk city, lat/long 41.1265/-73.714, postal 10504, NY subdivision, America/New_York TZ — all attached.
- **Sentry server-side IP-based enrichment** attaches `user.geo` (`US, Armonk, United States`) to events. Verified first-party on event `198d7b89eafa4d77ace2039bf88c786d` (issue JAVASCRIPT-REACT-2).

### The actually-correct fixes

| Surface | Mechanism | Notes |
|---|---|---|
| **PostHog GeoIP** | `posthog.register({ $geoip_disable: true })` in init's `loaded` callback | Server-side enricher honors this flag per event. **This is the primary fix.** Verified via PostHog docs-search 2026-05-13. |
| PostHog non-geo auto-capture | `property_denylist` for ~25 keys (`$current_url`, `$pathname`, `$host`, `$referrer`, `$raw_user_agent`, `$browser`, `$os`, `$device_type`, `$screen_*`, `$viewport_*`, all UTM keys, all click-ID keys) | SDK-side; strips client-attached fields pre-transport. |
| PostHog raw IP at rest | "Discard client IP data" toggle at `/settings/project#datacapture` | **All plans, including Free.** Optional defense-in-depth. **Does NOT stop GeoIP enrichment** — only discards raw IP after enrichment runs. |
| Sentry `user.geo` / `user.ip_address` | Project setting: **"Prevent Storing of IP Addresses"** at `/settings/legacy-hoopers/projects/javascript-react/security-and-privacy/` | Primary fix. |
| Sentry defensive | Add `event.user.geo` / `event.user.ip_address` strip in `beforeSend` with comment | No-op today (server-enriched after beforeSend runs). Activates only if anyone later flips `sendDefaultPii: true`. |
| Historical PostHog cleanup | 30 `persons-property-delete` MCP calls on person `502fd821-…` | Durable because `$geoip_disable` prevents re-enrichment on subsequent events. |

---

## Three-strikes correction log

Worth recording — the discipline that produced the correct scope:

1. **Chat-side reviewer's first spec:** SDK-side `property_denylist` on `$geoip_*` fields. Caught by source-grep against `node_modules/posthog-js@1.373.4`: those fields are server-enriched, never in SDK outbound payload. Denylist would have been a no-op shipped as a privacy fix.
2. **Reviewer's (and CC's) second spec:** PostHog "Discard client IPs and GeoIP data" project toggle. Caught by docs-search: per `posthog.com/docs/privacy/data-storage`, that toggle (real label: "Discard client IP data", no GeoIP in label) only discards raw IP at rest — GeoIP enrichment still runs.
3. **docs-search surfaced the actual mechanism:** `$geoip_disable: true` super-property. Documented in PostHog community Q&A (Max, PostHog, May 2025).

Each correction earned by first-party verification rather than reviewer framing. See memories `[[ask-receipts-when-reviewer-cites-off-cc-work]]` and `[[verify-sdk-mechanism-against-installed-source]]`.

---

## Open PRs at session end

- **#147** chore(deps)(deps): bump the risky-runtime-deps group across 1 directory with 5 updates (Dependabot, opened 2026-05-13T04:21Z)

No other PRs in flight.

---

## MCPs at session end

| MCP | Status | Notes |
|---|---|---|
| `plugin:posthog:posthog` | Authed | Project 421610. Exercised: `search`, `info`, `call persons-list`, `call persons-retrieve`, `call docs-search`. |
| `supabase-ro` | Authed | Project-scoped to `vrwwpsbfbnveawqwbdmj`, read-only. Unused this session. |
| `supabase-rw` | Not authed | Pilot, full access. Untouched. |
| `claude.ai Sentry` | Available | Used `find_organizations`, `find_projects`, `search_events`, `search_issues`, `get_sentry_resource`. |
| Ahrefs, Guru, Lucid, Microsoft 365 | Not authed | Untouched. |
| `claude.ai Supabase` (unscoped) | Available | Untouched this session — prefer `supabase-ro` for diagnostics. |

---

## Memory files at session end

`/home/admin/.claude/projects/-home-admin/memory/MEMORY.md` index has four entries:

- `check-main-before-framing-revive-options` (pre-existing)
- `use-gh-pr-merge-auto-not-bash-wait-loops` (pre-existing)
- `ask-receipts-when-reviewer-cites-off-cc-work` (pre-existing, referenced heavily this session)
- **`verify-sdk-mechanism-against-installed-source` (NEW this session)** — when someone specifies an SDK option, grep the installed version's source before drafting; pairs with the ask-receipts memory.

---

## Time-sensitive / known unresolved states

- PostHog person profile `0b81b465-…` still holds **30 geo properties** (`$geoip_*` + `$initial_geoip_*`). Will keep re-enriching on every login until task #2 ships (`$geoip_disable`). Single test account, Frank's own data — not a multi-user emergency, just unresolved.
- Sentry `javascript-react` still allows IP-based geo enrichment until task #1 (toggle) lands.
- The "Autocapture web vitals opt in updated successfully!" message the reviewer cited from chat-side was never confirmed by CC's tool log. Reviewer recommended a defensive sweep of three PostHog autocapture toggles (web autocapture, web vitals, dead clicks) to confirm all OFF — not done this session.

---

## Resume path

1. Read this doc + tail of `CLAUDE.md §16.7` + `git log --oneline -10` for any commits since this handoff.
2. `TaskList` to surface the 7-task graph.
3. If Sentry toggle has been flipped, mark task #1 complete and proceed with #2 → #7 in order.
4. Tasks #2/#3/#4 can be drafted in parallel; bundle as one PR in #5 per `[[use-gh-pr-merge-auto-not-bash-wait-loops]]`.
5. Post-merge: re-query the person profile (`persons-retrieve id=502fd821-f79c-5747-8cad-7700a9746d19`) before running cleanup to confirm `$geoip_disable` actually suppressed re-enrichment. If `$geoip_*` is still appearing on events captured *after* the merge, the super-property may not be registering early enough — check that `register()` runs in the `loaded` callback before any identify.

End handoff.
