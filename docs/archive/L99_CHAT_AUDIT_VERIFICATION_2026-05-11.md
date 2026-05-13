# L99 Chat-Side Audit Verification — 2026-05-11 (post-Wave 4.3-L)

**Companion document** to Claude.ai's "Magnum Opus Audit" (chat-side strategic doc) and the CC code-side audit (in flight).

**Purpose:** ground-truth-verify every claim in the Magnum Opus via Supabase + Vercel MCP. Identify gaps the chat audit couldn't see. Flag risks the CC audit may miss.

**Production state:** main @ `897c30c` (Wave 4.3-L). Vercel deploy ready. 5 waves shipped this session: 4.3-H/I/J/K/L. Edge function versions: `send-tournament-message` v17, `briefing-auto-draft-tick` v8, `briefing-cron-dispatch` v8.

---

## 1. EXECUTIVE TRIAGE

| Category | Magnum Opus claim | Ground-truth verdict |
|---|---|---|
| **status=draft-forever** | XI.C — happens on 11 messages | ✅ **CONFIRMED** — 7 of 22 messages (all sent rows still status='draft') |
| **audience_filter never persisted** | III.D — wizard captures type but not filter | ✅ **CONFIRMED + WORSE** — ALL 22 rows have `audience_filter=NULL`. 15 of those have `audience_type` set. **The filter column has never been written once in production.** |
| **get_briefing_queue is tournament-only** | II.B — returns only tournament rows | ✅ **CONFIRMED via function body** — JOINs `tournaments → events → teams`, no path for weekly_digest/rsvp_nudge/announcement |
| **briefing_templates empty** | P1.8 — 0 rows | ✅ **CONFIRMED** — table exists, 0 rows |
| **scheduled_for / status=scheduled** | XI.D — no cron pickup logic | ✅ **CONFIRMED** — 0 messages with `scheduled_for`, 0 with `status='scheduled'` |
| **voice_config** | "moat" claim | ✅ **POPULATED** — 1 org has voice_config NOT NULL (Legacy Hoopers) |
| **Multi-team families: 4** | III.C — Frank/Stephanie + others | ✅ **CONFIRMED** — Allie Alexander, Frank Samaritano, Matt Alexander, Stephanie Samaritano (98 single-team + 4 multi-team = 102 active guardians) |
| **0 opens across 11 sends** | IX — engagement gap | ✅ **CONFIRMED + WORSE** — `opened_at IS NULL` on 100% of 11 recipient rows. **Plus** the schema has NO `clicked_at`, NO `bounced_at`, NO `delivered_at` columns. Click/bounce/delivery tracking isn't just broken — it's not in the schema at all. |
| **event_reminder_due trigger missing** | P0.2 | ✅ **CONFIRMED** — 6 trigger events live (game_completed, rsvp_low_24h_before, schedule_changed, tournament_approaching, tournament_completed, weekly_sunday); `event_reminder_due` absent |
| **Legacy column writers post-4.3** | P2.11 — drift not fixed | ✅ **CONFIRMED** — 7 most-recent sent messages all have headline, sub_context, body_notes, body_html populated. The send pipeline (`digestSend.js`) still writes legacy fields despite the polymorphic rename being shipped. |
| **briefing_triggers active count** | not in chat audit | **22 active triggers across 6 events**. game_completed=2, rsvp_low_24h_before=4, schedule_changed=6, tournament_approaching=2, tournament_completed=2, weekly_sunday=6. |

---

## 2. CRITICAL NEW FINDINGS (chat audit MISSED these)

### F1 — Engagement schema is structurally incomplete

The chat audit treated the 0-opens issue as a webhook integration bug. The schema reality is worse:

`comms_message_recipients` columns: `id, message_id, guardian_id, email_at_send, delivery_method, delivery_status, opened_at, created_at, body_html_rendered, body_plain_rendered, subject_rendered, teams_included`

**There is no `clicked_at`, no `bounced_at`, no `delivered_at`, no `unsubscribed_at`, no `complained_at`.**

The webhook receiver might be working perfectly for opens (the only event the schema tracks) — but every other engagement signal Resend reports is being dropped on the floor because there's no column to write it to. This makes the P0 engagement gap a **schema migration + receiver update**, not just a receiver fix.

Wave 4.4-A scope must include:
1. `ALTER TABLE comms_message_recipients ADD COLUMN clicked_at, bounced_at, delivered_at, unsubscribed_at, complained_at` (5 timestamptz columns)
2. Update `resend-webhook-receiver` to handle 5 event types (today only 1 column to update)
3. Migration mirror per anti-pattern #21

### F2 — `delivery_status` enum is impoverished

All 11 recipient rows have `delivery_status='sent'`. No row has ever transitioned to `delivered`, `opened`, `bounced`, `failed`. The receiver isn't updating this column either. So the entire delivery state machine ends at "we asked Resend to send."

Add to F1's scope: the receiver should update both `delivery_status` AND the matching `*_at` timestamp column.

### F3 — weekly_digest send path bypasses `created_by_trigger`

Per-kind audit:
- `weekly_digest`: 18 rows, **0 with created_by_trigger** (admin-only writes)
- `rsvp_nudge`: 3 rows, 3 with created_by_trigger ✓
- `game_recap`: 1 row, 1 with created_by_trigger ✓

The `_handlers.ts/placeholderDraft` path correctly writes `trigger.id` for the non-weekly kinds. But the weekly_digest path (`briefingCronHelpers.js/buildWeeklyDigestDraftRow`) — even though wave 4.3-H added the `triggerId` parameter — apparently hasn't been exercised end-to-end (next Sunday cron window is May 17). All 18 weekly_digest rows are wizard-flow originated.

**Risk:** when the May 17 cron fires, will it actually pass `t.id` through `handleWeeklySunday`? Inspect `index.ts` deploy of `briefing-auto-draft-tick` v8 to confirm.

### F4 — `digestSend.js` still writes legacy columns

Most-recent 7 weekly_digest sends (between 12:27 and 13:47 UTC today) all have:
- `headline = 'WEEK AHEAD'` (legacy column, still written)
- `sub_context = 'May 11–17'` (legacy column, still written)
- `body_html != ''` (legacy column, populated by `renderSlice`)
- `body_notes` (legacy column, populated by override)
- `audience_type = NULL` (despite anchor/audience being captured in wizard)
- `audience_filter = NULL` (the III.D bug)

`digestSend.js:87-97` INSERT statement writes `headline`, `sub_context`, `body_html`, `body_plain`, `body_notes`, `signoff_message` — all named legacy columns. The polymorphic rename was supposed to deprecate these in favor of `content_sections` (jsonb). The new column is ALSO populated (`content_sections_nonempty=22`), so both old + new write paths are active. **Dual-write pattern.**

For wave 4.4 cleanup: pick a side. Either drop the legacy columns (force composer-only reads) or formally lock dual-write in CLAUDE.md.

### F5 — `recipient_count` on `comms_messages` not incremented

The column `recipient_count` exists on `comms_messages` (NOT NULL, default 0). Verification query: 0 messages have `recipient_count > 0`. So the column exists but is never populated by the send pipeline.

The actual recipient count is derivable via `COUNT(*) FROM comms_message_recipients WHERE message_id = m.id` — but the denormalized cache column on the parent row is dead.

Same for `opened_count`: NOT NULL default 0, never updated.

Wave 4.4 cleanup: either populate these columns at send time (trigger or send-pipeline update) or drop them.

### F6 — Wizard state field `audience_filter` exists but isn't persisted

The wizard's `composerReducer` `SET_AUDIENCE` action writes both `audience_type` and `audience_filter` to state. The `useBriefingDraft` save path (via `draft.save(...)`) writes both to `comms_messages`. **But the data shows 0 rows have audience_filter populated.** Possible causes:
1. `draft.save` doesn't include `audience_filter` in the UPDATE payload
2. The wizard never sets `audience_filter` to non-null (UI bug — picker doesn't dispatch `audience_filter` with the values)
3. The audience_filter is written but a downstream trigger / RPC strips it

Without code-side grep, I can't tell which. **CC code-side audit should grep `audience_filter` writes to find the bug.**

### F7 — Branch divergence on Frank's local machine

CC's earlier git log showed unfamiliar commits (`967fd7c`, `318fdbf`, `b27758b` — schedule UI work). His local v2 branch may NOT have waves 4.3-H/I/J/K/L merged in. **The CC audit running in the terminal right now may be auditing PRE-wave-4.3 code.**

Critical pre-audit verification step. If CC is on stale code, audit conclusions about briefings will be wrong.

---

## 3. REFUTED OR REFINED CLAIMS FROM CHAT AUDIT

### Magnum Opus II.B "Auto-drafted briefings don't deep-link"

✅ Partial confirmation. The chat audit assumed all 11 auto-drafts present in DB. Actual: **3 rsvp_nudge + 1 game_recap auto-drafts exist; 11 weekly_digest drafts are admin-created wizard-abandoned drafts**, NOT auto-drafts. The deep-link issue is real but the surface is smaller than implied. Still worth fixing.

### Magnum Opus III.D "11 active auto-drafts"

❌ Number wrong. Actual: 4 auto-drafted (3 rsvp_nudge + 1 game_recap) + 11 admin-created drafts + 7 sent = 22 total. The "11" figure is the unsent **weekly_digest** count, not auto-drafts.

### Magnum Opus VI.D "weekly_digest 9/10, other kinds untested"

⚠️ Refined: 0 of 9 kinds have been sent end-to-end in production. Only weekly_digest has 7 sends. The other 8 kinds: 3 rsvp_nudge drafts (not sent), 1 game_recap draft (not sent), 0 of {schedule_change, tournament_prelim, tournament_recap, announcement, custom, academy_callup_notice} have any production rows. **Cross-kind smoke testing is a P0 gap — not P2 as chat audit framed.**

### Magnum Opus VII.B "no-reply abstraction beats competitors"

❌ Production state contradicts. `organization_settings.reply_to_email = 'admin@legacyhoopers.org'`, not a no-reply. Verified. The "moat" claim is correct (real reply address) but the chat audit didn't confirm the column was populated.

### Magnum Opus VIII.A "verify reply_to set"

✅ Verified set to `admin@legacyhoopers.org`.

---

## 4. SECURITY POSTURE (Supabase advisors)

29 security-level lints. Most are intentional (current_user_* helpers, token mint/verify RPCs designed to be auth-callable). Worth noting:

- `app_secrets` has RLS enabled but no policies — **intentional**, service_role-only access pattern (anti-pattern #33 compliance)
- `pg_net` extension in public schema — pre-existing, low risk
- 24 SECURITY DEFINER functions callable by anon/authenticated — these are the audit pattern functions + token mint/verify RPCs + ride helpers. Each has been individually GRANTed deliberately. Document, not fix.

No surprises. Security posture is as designed.

Performance advisors: 262KB output (saved to file). Not yet read; recommend CC code-side audit pulls the top 10 issues.

---

## 5. RECONCILED P0 LIST (rebuilt from ground truth)

Reorder based on what's actually verifiable in production:

| # | Item | Ground-truth severity | CC scope |
|---|---|---|---|
| **P0.1** | Engagement schema incomplete (no click/bounce/delivered/unsubscribed columns) | **Production-impacting** — 100% of engagement signal is being dropped today, not just opens | Yes — code + migration |
| **P0.2** | audience_filter never written to DB (22/22 rows NULL) | **Production-impacting** — multi_team/event_attendees/tournament audience choices are silently lost | Yes — grep wizard writes |
| **P0.3** | get_briefing_queue tournament-scoped, no surface for other kinds | **UX-blocking** — Frank's stated #1 complaint | Yes — RPC + IA refactor |
| **P0.4** | status=draft after sent_at (7 rows) | **State-corruption** — every queue/history query is wrong | Yes — send-pipeline UPDATE |
| **P0.5** | event_reminder_due trigger absent | **Feature-missing** — T-3d/T-1d/T-4h reminders don't exist | Yes — trigger + handler |
| **P0.6** | 8 of 9 briefing kinds never sent in production | **Test-coverage gap** — render quality unknown for 88% of the system | Yes — smoke-test sends |

**P1** (next tier, also verifiable):

| # | Item | Notes |
|---|---|---|
| P1.1 | Legacy columns dual-written by digestSend.js + send-tournament-message | Pick a side; drop legacy or formalize dual-write |
| P1.2 | weekly_digest auto-draft path bypasses created_by_trigger | Verify on May 17 cron tick |
| P1.3 | recipient_count + opened_count on comms_messages never populated | Drop or populate |
| P1.4 | Wizard N1 multi-team picker broken | Confirmed in 5-wave audit |
| P1.5 | Wizard N2 anchor Switch broken | Confirmed in 5-wave audit |
| P1.6 | Preview pane on Body step blank | Confirmed via screenshots |
| P1.7 | No "Send as-drafted" 1-tap flow | UX-blocking for moat |

---

## 6. WHAT THE MAGNUM OPUS GOT STRATEGICALLY RIGHT

Despite ground-truth refinements above, these strategic recommendations are right and worth shipping:

1. **Rename `get_briefing_queue` → `get_tournament_briefing_queue`** + build `get_unified_briefing_queue`. The current function literally cannot surface 8 of 9 kinds.
2. **Deep-link inbox row → Step 3 of wizard with pre-filled state.** Highest-leverage Frank UX fix.
3. **Inline RSVP buttons in event rows.** mint_rsvp_token RPC exists, just needs render integration.
4. **Engagement dashboard surface.** Once F1+F2 land, the data flows. Surface 7-day open/click/bounce metrics.
5. **Bulk approve from queue.** Auto-draft + 1-tap-confirm pattern is the moat.
6. **Single-family + multi-family audience types.** Real use case (4 multi-team families need different render than single-team).

---

## 7. WHAT THE CC CODE-SIDE AUDIT MUST COVER (where chat-side can't reach)

Hand off to terminal CC for these specifically:

1. **Verify branch state** — confirm CC is on a branch with wave 4.3-H/I/J/K/L merged. If not, `git pull origin main` before continuing.
2. **Find audience_filter writers** — `grep -rn "audience_filter"` in `src/` to find where it's set in dispatch vs. saved to DB. Identify the wire-up gap.
3. **Trace `digestSend.js` write path** — what columns does the INSERT touch? Which are needed vs. legacy?
4. **resend-webhook-receiver source review** — read `supabase/functions/resend-webhook-receiver/index.ts` and identify which event types it handles, what columns it updates. Confirm signature verification.
5. **9-kind × 8-audience matrix** — for each cell (72 total), document whether reachable from wizard, what RPC is called, what audience_filter shape is required.
6. **Inbox row click handler** — read `ActionQueueRow.jsx` onClick: where does it route? Does it pass anchor/audience info? Does HYDRATE_DRAFT pre-fill state?
7. **Dead code sweep** — find exports never imported, RPCs never called from JS, fixtures from older waves.
8. **File size cap violations** — current state vs. 150 LOC ceiling.
9. **Component dependency graph** — orphans, god components, duplicate paths.
10. **Test coverage map** — which functions in `src/lib/engine/resolvers/*` have ZERO test coverage; which composers tested across all 9 kinds.

---

## 8. PRIORITY DECISIONS NEEDED FROM FRANK

D1. **Wave 4.4-A scope confirmation** — engagement schema migration adds 5 columns + receiver rewrite. Ship as one PR or split?

D2. **Legacy column policy** — drop them now (breaking change for any external SQL consumers) or formalize dual-write in CLAUDE.md and defer?

D3. **Branch reconciliation** — confirm local v2 has waves 4.3-H/I/J/K/L. If not, what's the merge plan?

D4. **End-to-end smoke-test waves** — do you want CC to actually send 1 test of each of 8 untested kinds via wizard before merging anything else? Provides ground truth on render quality but takes ~2 sessions.

D5. **get_briefing_queue rename** — keep backward-compat by aliasing, or hard-rename + force callers to update?

---

## 9. CHAT-SIDE AUDIT TODO (still to verify)

- [ ] Performance advisors top 10 — saved 262KB file, needs read
- [ ] Vercel runtime logs for `resend-webhook-receiver` — confirm webhook events are/aren't arriving
- [ ] Resend dashboard webhook URL verification (needs Frank's manual check)
- [ ] Sample 1 test send + 60s wait + check opened_at populated
- [ ] Recent migrations vs. mirror file inventory drift

---

**Ready for CC code-side audit to land. Then cross-reconcile.**
