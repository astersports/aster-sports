# AUDIT — Briefings L99 Redesign · Live-State Seed (chat-CC half)

> **Status:** SEED input, not the full audit. This is the **live-state half**
> (chat-CC, Supabase/Vercel/GitHub MCP) of the §16.15 L99 audit Frank locked
> 2026-06-03 ("briefings gets the full L99 audit + redesign"). terminal-CC
> owns the **code-read half** (file-by-file mount tree) and assembles the
> consolidated audit doc with all five §16.15 elements before any PR-A code
> lands. Everything below was verified against production
> (`vrwwpsbfbnveawqwbdmj`) on 2026-06-03 PM, not inferred.
>
> **Origin:** surfaced when Frank smoke-tested the Resend key by trying to send
> from the app. Six send attempts mapped the surface. The key itself is fine
> (proven via a direct `pg_net` → Resend call, `200` + email id, landed in the
> pilot inbox); the *briefings send surface* is what broke.

---

## 0. Headline — the surface splits cleanly along kind maturity

The tournament kinds are production-quality and work end-to-end; the newer
kinds are half-wired. Every breakage tonight fell on the "newer kind" side.

| Kind | Live result (2026-06-03) | Verdict |
|---|---|---|
| `tournament_recap` | Sent + **landed in pilot inbox**, branded, real game results | ✅ works |
| `tournament_prelim` | Scheduled + sending | ✅ works |
| `weekly_digest` (audience All) | `23505` duplicate key → block | 🔴 BUG A |
| `weekly_digest` (audience Team) | "No recipients available" | 🔴 pilot/audience |
| `games_recap` | `23514` check violation → "Save failed" | 🔴 BUG B (never worked) |
| `rsvp_nudge` (send) | "No recipients (pilotOnly:true)" | 🔴 pilot inconsistency |
| `rsvp_nudge` (preview) | "No engine composer for kind rsvp_nudge" | 🔴 BUG C |

**Root pattern (AP #63):** "who receives this in pilot mode," audience
resolution, preview, and the send path were wired **per-kind** instead of
once. The tournament kinds got the mature path; the rest each diverged. This
is the redesign's center of gravity — not the individual bugs.

---

## 1. BUG A — `weekly_digest` unique index collides with the compose flow

- **Index (live):**
  `CREATE UNIQUE INDEX comms_messages_weekly_digest_unique ON public.comms_messages (org_id, period_start) WHERE kind='weekly_digest' AND status IN ('draft','scheduled','queued','sent')`
- **Provenance:** designed in PR #657 (terminal-CC, Wave 3 P1 batch 2); applied
  to prod via MCP migration `20260602195100` (chat-CC). Correcting the earlier
  ledger §4.BW phrasing: the *design* is #657's; chat-CC only applied it.
- **Collision (live rows):** non-archived `weekly_digest` already exist for the
  current week — `d83347c7` (draft, period_start 2026-05-31) and `2f3a3dba`
  (sent, period_start 2026-06-01). The composer **INSERTs a new row** on send;
  the index blocks it → raw `23505` to the admin.
- **Why it's structural, not incidental:** the auto-draft cron pre-writes the
  week's draft; the composer doesn't reuse it. Including `'draft'` in the index
  predicate is the over-reach — the invariant that actually mattered (the 11
  duplicate *test-sends* that motivated #657) was about *sent* rows.
- **chat-CC recommended fix:** narrow the predicate to **drop `'draft'`**
  (`status IN ('scheduled','queued','sent')`). Minimal, one reversible
  migration, preserves no-dup-send, **touches zero composer behavior across any
  kind** — unlike the "composer reuses draft" option, which would change every
  pre-drafting kind (`rsvp_nudge`, `tournament_*`, `schedule_change` all
  pre-draft; only `weekly_digest` has the index, so only it collides).
  **Routing: Frank's call (narrow-predicate vs composer-reuse); chat-CC leans
  narrow-predicate.** terminal-CC authors migration, chat-CC applies (AP #21).

---

## 2. BUG B — `games_recap` has never sent: CHECK constraint missing a shipped value

- **Constraint (live):**
  `CHECK (audience_type IS NULL OR audience_type = ANY (ARRAY['team','multi_team','tournament_attendees','event_attendees','org_all','custom']))`
- **Missing value:** `multi_event_attendees` — locked and shipped everywhere
  *except* the constraint: `kindMetadata.js:57` (`audienceLocked: true`),
  `recipientFilter.js:49` (resolution logic), `StepAnchorAudience.jsx:37` (UI),
  unit tests, and `BRIEFINGS_COVERAGE_L99.md` ("shipped Wave 5 G1").
- **Consequence (verified):** `games_recap`'s only audience is the locked
  `multi_event_attendees`, so **every `games_recap` send has violated the
  constraint since Wave 5** — zero have ever persisted. A silently-broken
  feature.
- **Fix:** widen the constraint to include `multi_event_attendees` — making the
  DB match locked/tested/shipped code. Lowest ambiguity of the set. Schema
  change → route, terminal-CC writes migration, chat-CC applies.

---

## 3. Pilot mode — the AP #63 core. Two implementations, only one correct.

- **Digest path (correct — REDIRECT):** `get_digest_recipients(org, p_pilot_only=true)`
  emits **5 synthetic rows, one per team, all addressed to
  `pilot_test_recipient_email`** (`olivejuiceinc1@gmail.com`), via an
  `override` + `synthetic` CTE; real guardians are suppressed when the override
  is active. Live counts: `pilot_only=true → 5`, `pilot_only=false → 102`. This
  is why `tournament_recap` landed.
- **Per-event / team / nudge paths (broken — FILTER):** `rsvp_nudge` and
  event-attendee / team-scoped audiences resolve pilot by filtering on
  `guardians.is_pilot_family` and **do not** use the synthetic redirect. Live:
  `guardians.is_pilot_family` count = **0**, so these paths return **0
  recipients** → "No recipients available." The `useDigestRecipients.js:10`
  comment ("currently 6 for Legacy Hoopers") is stale and was the red herring
  that nearly mis-routed this.
- **Redesign mandate:** ONE pilot-recipient mechanism across all kinds.
  Whichever model wins (the redirect is the better one — it needs no
  `is_pilot_family` flags and gives per-team inbox labels), every kind must use
  it. This is the single highest-value fix in the redesign.

---

## 4. BUG C — preview composer gap

- **Live error:** composing `rsvp_nudge` → "Preview error: No engine composer
  for kind 'rsvp_nudge'. Supported kinds: academy_callup_notice, weekly_digest,
  announcement, custom_message."
- The wizard offers `rsvp_nudge` (and likely other registry kinds) but the
  preview panel only knows 4. Ties to AP #28: `rsvp_nudge` dispatches via
  `rsvpNudgeSend` (per-recipient mint short-circuit), not the main composer —
  so either it shouldn't appear in the standard compose picker, or the preview
  must handle the registry-dispatched kinds. **Code-read item for terminal-CC.**

---

## 5. Meta (cross-cutting) — raw DB errors reach admins

The composer surfaces raw Postgres errors verbatim — `23505` "duplicate key
value violates constraint…", `23514`, generic "Save failed." Violates §16.3
kindness microcopy. Needs error-class translation at the send surface
(`23505` → "There's already a digest for this week — open it instead?";
`23514` → "That audience isn't allowed for this briefing kind."). Small,
reversible, but gate it **after** A/B/pilot land so the copy matches final
behavior.

---

## 6. Side flag — NOT in audit scope, but caught

`game_recap` (singular, distinct from `games_recap` per §13) has **15,770
rows, 15,759 trigger-created**, nearly all archived/empty. Something is
mass-generating per-game recap drafts. Possible runaway trigger / data bloat —
flagged for a separate data-hygiene look, explicitly **out of scope** for the
briefings redesign.

---

## 7. What this seed does NOT cover (terminal-CC's half)

Per §16.15, the full audit still needs, from the code-read side:
- (a) File-by-file read of the full briefings mount tree (composer, reducer,
  `resolvers/registry.js`, `sectionRenderers.js`, preview panel, all send
  paths) with severity + file:line.
- (b) Deep-read addendum (the ~40% miss-rate second pass).
- (c) Anti-pattern cross-reference (already in play: #28, #38, #63).
- (d) Per-role **and per-kind** wireframes of the compose→preview→send flow.
- (e) Explicit out-of-scope list for the redesign PR sequence.

The consolidated doc is terminal-CC's to assemble; this seed is its live-state
input. No PR-A redesign code lands before that doc exists.
