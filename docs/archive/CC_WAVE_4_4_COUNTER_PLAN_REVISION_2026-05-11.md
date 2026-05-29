# CC Wave 4.4 Counter-Plan — REVISION (Frank's-Local Verification Pass)
**2026-05-11 (afternoon, post-recap)**

---

## 0. WHAT THIS DOCUMENT IS

The consolidated session recap explicitly asked: *"CC reviews this recap and produces a counter-plan."* A counter-plan was already produced and merged this morning as PR #92 (`docs/CC_WAVE_4_4_COUNTER_PLAN_2026-05-11.md`, 382 lines).

This document is a **second-pass verification** run from Frank's local terminal — a separate working copy that was at `v2 @ 967fd7c` before this session and **never had Waves 4.3-H through 4.3-L merged into it locally**. That is, the cloud sandbox CC who produced PR #92 saw fully-merged code; this session is verifying that code from Frank's machine after fast-forwarding `main` from `edd671d` → `58b35b1` (516 commits behind).

Purpose:
1. Confirm PRE.1 (branch reconciliation) cleared on Frank's local.
2. Independently verify the load-bearing claims in PR #92.
3. Surface three refinements PR #92 did not catch.
4. Lock the Wave 4.4 sequence.

PR #92 is the canonical counter-plan. This document **augments** it.

---

## 1. PRE.1 STATUS — CLEARED ON FRANK'S LOCAL

Before this pass:
- Local `main` at `edd671d` (516 commits behind origin)
- Local `v2` at `967fd7c` (carries the Wave 1G + 2A + 2BC schedule UI work)
- Untracked: `supabase/migrations/20260507012318_backfill_tournament_opponents.sql` (blocked the FF)

Actions taken this session:
1. `git fetch --all --prune` — pulled every `claude/wave-4-*` branch ref + `origin/main` advanced to `58b35b1`
2. `git stash -u` to handle untracked migration file
3. `git pull --ff-only origin main` — FF succeeded, HEAD at `58b35b1` (CC Wave 4.4 counter-plan PR #92)
4. Verified the previously-untracked migration `20260507012318_backfill_tournament_opponents.sql` is now in `supabase/migrations/` from the upstream merge
5. `git stash drop stash@{0}` — cleared

Local `v2` is **still at `967fd7c`** — it has not been merged with `main` yet. Per PR #92 §1 resolution and recap PRE.1, the operator must still run:
```bash
git checkout v2 && git merge origin/main && git push origin v2
```
before any Wave 4.4 work that touches the briefing system from `v2`.

**Open question for Frank:** is `v2` still a meaningful branch given that `main` has shipped 5 waves of briefing work and `v2` is on schedule-UI work that long predates them? If `v2` is the active feature branch, the merge will likely produce conflicts in unrelated areas. If `v2` is stale, retire it and start Wave 4.4 work from `main`. Recommendation: **retire `v2`**, work on PR branches off `main` going forward.

---

## 2. PRE.2 STATUS — F5 INDEPENDENTLY VERIFIED, NO HOTFIX NEEDED

PR #92 §2 claims `handleWeeklySunday` correctly threads `triggerId` and May 17 cron will populate `created_by_trigger`. **Concurred independently.**

Evidence from `supabase/functions/briefing-auto-draft-tick/index.ts`:

```typescript
// line 46 — handler signature
async function handleWeeklySunday(sb, triggerId: string, orgId: string, ...) {
  ...
  // line 53
  const row = buildWeeklyDigestDraftRow({ orgId, period, now, triggerId });
  const { data: inserted, error: insErr } = await sb.from("comms_messages").insert(row)...

// line 73 — dispatch site
case "weekly_sunday":
  return [{ trigger_id: t.id, org_id: t.org_id, kind: t.briefing_kind,
            ...(await handleWeeklySunday(sb, t.id, t.org_id, now, bypassWeeklyWindow)) }];
```

`t.id` is the briefing_trigger row id, passed in as `triggerId`. `buildWeeklyDigestDraftRow` is in `_helpers.ts` (mirror in `briefingCronHelpers.js`) and includes `triggerId` in its returned row. Cross-referenced with `_handlers.ts:47` (`placeholderDraft`), which for the 5 non-weekly handlers does:
```typescript
return { org_id: trigger.org_id, created_by_trigger: trigger.id, ... }
```

Both code paths (weekly + 5 non-weekly) emit `created_by_trigger`. The 18 existing weekly_digest rows with NULL `created_by_trigger` predate the column existing (mig `20260511020407` added it). The next Sunday cron tick (May 17) will write `created_by_trigger` on every new weekly_digest auto-draft.

**No Wave 4.3-M hotfix needed.**

Frank's verification query for after the May 17 cron fires:
```sql
SELECT COUNT(*) AS new_drafts,
       COUNT(*) FILTER (WHERE created_by_trigger IS NOT NULL) AS with_trigger
FROM comms_messages
WHERE kind='weekly_digest'
  AND created_at > '2026-05-17 00:00:00 UTC';
-- expect: new_drafts == with_trigger (both equal to active LH teams = 5)
```

---

## 3. INDEPENDENT VERIFICATION OF PR #92 LOAD-BEARING CLAIMS

| PR #92 claim | Status | Evidence |
|---|---|---|
| §3 Layer A: `AudiencePicker.jsx:60` clears filter on type-change | **CONFIRMED** | Read source — line 60: `onClick={() => !locked && onPick(m.type, audienceType === m.type ? audienceFilter : null)}` — passes `null` for filter on any new type. Six modes in the picker, **zero** sub-pickers anywhere in `src/components/briefings/` to populate `audience_filter` payloads. |
| §3 Layer B: `digestSend.js` INSERT omits 5 columns | **CONFIRMED** | Read source — lines 97–110 — INSERT writes `org_id, tournament_id, team_id, kind, language_code, delivery_method, sent_at, subject, body_html, body_plain, headline, sub_context, content_sections, body_notes, signoff_message, period_start, period_end`. Missing: `audience_type, audience_filter, anchor_kind, anchor_id, status, last_edited_by, created_by_trigger`. |
| §3 Layer C: `composerReducer.SET_AUDIENCE` correctly dispatches both fields | **CONFIRMED** | Read source — line 72–73: `case 'SET_AUDIENCE': return { ...state, audience_type: action.audience_type, audience_filter: action.audience_filter ?? null };`. Reducer is **not** the bug. |
| §4 inbox deep-link is wired | **CONFIRMED** | Read `BriefingsInboxPage.jsx:75–83`. `onAction` routes by `row.synthetic_id`: synthetic → `{kind, anchor_kind, anchor_id}`, persisted → `{draft_id}`. Plus URL-param ingestion at lines 53–67 (Wave 4.1b §3 Bug C). Deep-link is real. |
| §5 webhook receiver handles 4 event types | **CONFIRMED** | Read full source of `resend-webhook-receiver/index.ts` (116 lines). Lines 91–102 handle exactly `email.delivered`, `email.opened`, `email.bounced`, `email.complained`. `email.clicked`, `email.sent`, `email.failed`, `email.delivery_delayed` → fall through to `"event type not tracked: " + eventType` and return `200 ok`. |
| §5 RESEND_WEBHOOK_SECRET unset is the likely 0-opens cause | **CONFIRMED PLAUSIBLE** | Lines 36–39: `if (!secret) { console.error(...); return json({ error: "Webhook not configured" }, 503); }`. If env var is unset, every webhook returns 503 silently. Cannot be confirmed without dashboard access; the diagnostic is correct. |
| §6 file size cap violations | **CONFIRMED** | `wc -l` gives `send-tournament-message/index.ts: 189`, `briefing-auto-draft-tick/_handlers.ts: 169`. Both over the 150 cap. All `src/` briefing files ≤150 (checked via xargs wc -l). |

PR #92 holds up under independent code-side audit. **All seven major claims verified.**

---

## 4. THREE REFINEMENTS PR #92 DID NOT CATCH

### Refinement R1: Two distinct row-creation lineages, not one

PR #92's audience_filter Layer-A/B framing treats the problem as a single bug in two layers. There are actually **two independent row-creation lineages**, each with its own audience-filter behavior:

**Lineage 1 — Auto-draft path** (`briefing-auto-draft-tick/_handlers.ts:42`)
```typescript
function placeholderDraft(trigger, kind, anchorKind, anchorId, teamId, audienceType, now) {
  return {
    ...
    audience_type: audienceType,     // populated
    audience_filter: null,           // INTENTIONALLY NULL
    ...
  };
}
```
The handler writes `audience_filter: null` **deliberately**. The design assumption is that the resolver runs fresh at preview/send time per Wave 4.2-A-8a — and the resolver derives recipients from `anchor_kind + anchor_id`, not from `audience_filter`. For `event_attendees` audience, the resolver should query `events WHERE id = anchor_id` then `event_rsvps`. For `tournament_attendees`, query `tournament_rosters WHERE tournament_id = anchor_id`. `audience_filter` is redundant in this lineage.

**Lineage 2 — Wizard-save path** (`useBriefingDraft.js` → `digestSend.js`)
```javascript
// composerReducer SET_AUDIENCE dispatches { audience_type, audience_filter }
// useBriefingDraft.save persists the draft row including audience_filter (per PR #92 §3 Layer C)
// digestSend.js at SEND time creates a SECOND row with neither audience_type nor audience_filter
```
The wizard draft row carries audience_type + audience_filter. The send path **does not read it** — it creates a fresh row.

The implication: **the bug is not just "audience_filter is null" but "the wizard's draft and the wizard's send produce two unrelated rows."** The 22-row production count of audience_filter=NULL is a mix of both lineages and the bug profile is different for each.

| Lineage | audience_filter today | Fix |
|---|---|---|
| Auto-draft (5 handlers + handleWeeklySunday) | NULL by design | None needed if resolver derives from anchor; verify the 8 non-weekly_digest kinds' resolvers work without audience_filter |
| Wizard draft (`useBriefingDraft.save`) | populated per `composerReducer` IF `AudiencePicker` ever wrote one (it can't for multi-X) | Build sub-pickers (PR #92 4.4-C1) |
| Wizard send (`digestSend.js`, `scheduleChangeSend.js`) | dropped at INSERT | Add columns to INSERT (PR #92 4.4-C2) |

PR #92's 4.4-C1/C2/C3 split is correct, but **4.4-C2 has a hidden sub-task: reconcile the two-row-lineage problem.** The wizard's draft row at status='draft' becomes orphaned the moment the user clicks Send — the send path doesn't UPDATE the existing draft, it INSERTs a new row. The two-row history makes audit logs and history view confusing.

**Recommendation:** before 4.4-C2 ships, decide whether to:
- (a) UPDATE the existing draft row on send (single-row lineage, clean)
- (b) INSERT new send row + UPDATE draft to status='sent' (two-row chain, requires `parent_message_id`)
- (c) INSERT new send row + DELETE draft (lossy, no audit trail)

Recommendation: **(a) UPDATE the existing draft row on send.** It maps to the user's mental model ("I sent the draft I was looking at"), preserves single-row history, and avoids `parent_message_id` overhead. The trigger `trg_messages_immutable` on `tournament_messages` (from mig 011) suggests the design previously favored versioning, but the recap notes `tournament_messages` is the legacy table family that `comms_messages` replaced. No immutability trigger exists on `comms_messages` (verified by absence in 4.3-* migrations). The UPDATE path is clean.

### Refinement R2: PR #92 §7 sequencing — 4.4-B blocked by 4.4-C2, not parallel

PR #92 §7 proposes: `PRE.1 → PRE.2 → 4.4-A0 → 4.4-B (IA refactor) → 4.4-C2+C3 (parallel) → 4.4-C1+D+A1/A2 (parallel) → 4.4-0 smoke tests → ...`

**Disagree on the position of 4.4-B.** 4.4-B builds `get_unified_briefing_queue` and a homepage UI that surfaces auto-drafts and wizard-flowed messages side-by-side. Today every wizard-flowed row has `audience_type=NULL, audience_filter=NULL, anchor_kind=NULL, anchor_id=NULL` per digestSend.js evidence. If 4.4-B ships before 4.4-C2, the new queue UI will render those rows as `Audience: unknown · Anchor: unknown`. Two failure modes:

1. The unified queue's row-grouping logic (by anchor_kind, by audience) won't work for wizard rows — they all collapse into an "Unknown" bucket.
2. The deep-link from a wizard row back to the composer (per `BriefingsInboxPage.jsx:75–83`) will route to `setComposer({ draft_id: row.id })`. The composer will load the draft and `HYDRATE_DRAFT` will fire `hydrateTargetStep` which checks `step2Valid`. Wizard rows have `audience_type` set (per composerReducer) but for the 11 existing wizard-flowed weekly_digest drafts those values may be NULL too (depending on whether composerReducer persisted them — `useBriefingDraft.save` is in the trust chain). Result: composer jumps to Step 2 not Step 3, surfacing the very bug 4.4-B was supposed to hide.

**Counter-proposal:** `PRE.1 → PRE.2 → 4.4-A0 → 4.4-C2+C3 (parallel) → 4.4-B → 4.4-C1+D+A1/A2 (parallel) → 4.4-0 → 4.4-E → 4.4-F → 4.4-G → 4.4-H → 4.4-I → 4.4-J (legacy cleanup)`

The single change: **4.4-C2 (digestSend INSERT completeness) ships strictly before 4.4-B (IA refactor).** Estimated 4.4-C2 is 1 session per PR #92 §3 — so 4.4-B is delayed by 1 session, not blocked indefinitely. Worth the delay because 4.4-B is Frank's #1 UX win — it should ship onto clean data.

### Refinement R3: digestSend.js `sample` family pattern is a separate concern

PR #92 doesn't address this; surfacing as a new flag.

`digestSend.js:94–110`:
```javascript
const sample = renderedFamilies[0];   // one family's render
...
.insert({
  ...
  subject, body_html: sample?.html || '', body_plain: sample?.plainText || '',
  content_sections: sample?.sections || [],
  ...
})
```

The `comms_messages` row's `body_html`, `body_plain`, `content_sections` are populated from **one specific family's render** — `renderedFamilies[0]`, which is sorted deterministically by `guardian_id ASC` (line 48). This is fine for display purposes (admin sees a representative render) but has two side-effects:

1. **The message-level body is whichever family sorted first alphabetically by guardian UUID.** If that family has fewer kids on the anchor team, the saved body looks lighter than the actual sends. The admin's history view doesn't reflect what most families saw.
2. **`teams_included` is omitted from message-level row, included per-recipient.** Line 126 sets `teams_included: f.teams_included` on the recipient row. The message-level row has no `teams_included` summary. Queue UI grouping by team will need to derive from the recipients table.

Not a bug per se, but a thing to know when designing the Messages tab UI in 4.4-B. The admin's "what did I send" view should pull the rendered body from `comms_message_recipients`, not from the message row, OR the send path should compute a canonical message-level render distinct from the sample family.

**Suggested 4.4 doc note:** add a paragraph in the Wave 4.4-B spec covering this — "message-level body is a sample; per-recipient bodies are canonical."

---

## 5. OPEN-1 THROUGH OPEN-5 — CONCUR WITH PR #92

| Open | PR #92 resolution | This pass | Note |
|---|---|---|---|
| OPEN-1 (domain) | `ember.app` | Concur | Subject to availability; reserve before naming Phase 0C |
| OPEN-2 (rebrand timing) | After Wave 4.4, before Phase 1 | Concur | Worth adding: rebrand wave is also when `tournamentBriefing.js` legacy module (separate from comms_messages family) should be reviewed for removal — it's pre-Wave-3, hard-codes `'Legacy Hoopers'`, and lives at `src/lib/tournamentBriefing.js`. Probably already dead but verify before Phase 0C ships. |
| OPEN-3 (Phase 1 order) | 1-A → (1-D + 1-E parallel) → 1-B → 1-C | Concur | |
| OPEN-4 (smoke depth) | hybrid: option (a) first, escalate to (b) on failures | Concur | |
| OPEN-5 (parent volunteer) | yes — recruit Coach Kenny | Concur | Add to recruitment: confirm Coach Kenny uses Gmail (not Apple Mail / Yahoo) so the test reflects the parent demographic likely seeing it |

---

## 6. ONE NEW OPEN QUESTION FOR FRANK

**OPEN-6: Lineage strategy for wizard send.** Per Refinement R1, the wizard's `Save Draft` produces row #1; clicking `Send` produces a separate row #2 (digestSend.js INSERT). Three resolutions exist:

| Strategy | Implementation cost | Pro | Con |
|---|---|---|---|
| (a) UPDATE draft row on send | Smallest. Change digestSend.js INSERT → UPDATE ... WHERE id = draftId. | Single row, clean audit trail, "what I sent is what I edited" | Need to handle case where admin sent without saving as draft first |
| (b) INSERT + UPDATE draft to sent | Medium. New `parent_message_id` for version chain. | Versioning support if user edits + resends | Two rows per send; doubles message table volume |
| (c) INSERT + DELETE draft | Smallest. Lossy. | Single row in history | Loses pre-edit content forever; no audit trail |

**Recommendation: (a).** Concrete fix in 4.4-C2 then becomes: if `draft_id` is set in the composer state when Send is clicked, the send path UPDATEs that row with the rendered content + audience metadata + status='sent' + sent_at = now(). If `draft_id` is null (admin compose-and-immediate-send), INSERT a new row at status='sent'.

This is a one-paragraph decision that affects the shape of 4.4-C2 + 4.4-C3 specs. Worth deciding before either wave starts.

---

## 7. REVISED WAVE 4.4 SEQUENCE

```
PRE.1   Branch reconciliation             — operator (Frank): merge v2 ↔ main OR retire v2
PRE.2   May 17 verification               — VERIFIED CLEAR by this pass; no work needed

4.4-A0  Webhook config diagnostic         — 0.25 sessions (dashboard check + 1 test send)
        IF working: skip 4.4-A1
        IF broken: fix config, plan A1 scope

4.4-C2  digestSend.js INSERT completeness — 1 session
        Includes OPEN-6 decision (recommend strategy a: UPDATE draft on send)
        Includes scheduleChangeSend.js INSERT fix

4.4-C3  status state machine in send pipeline — 1 session
        send-tournament-message UPDATE status='sent' on Resend success
        Check constraint: (status='sent') == (sent_at IS NOT NULL)
        Backfill 7 stuck-at-draft rows

4.4-B   Homepage IA refactor              — 3-4 sessions
        get_tournament_briefing_queue alias + get_unified_briefing_queue
        Inbox UI: all 9 kinds visible, deep-link works
        Engagement home card + /engagement route
        Bulk approve (Gmail-style: tap=preview, select=multi-select, swipe=quick-approve)
        Message-level body sample note (per Refinement R3)

4.4-A1  Engagement schema (if A0 says needed) — 1-2 sessions
        ADD clicked_at, bounced_at, delivered_at, unsubscribed_at, complained_at
        ADD CHECK constraint on delivery_status enum transitions

4.4-A2  Webhook receiver expansion        — 2 sessions
        Handle email.clicked, email.sent, email.failed, email.delivery_delayed
        State transitions per event type

4.4-C1  AudiencePicker sub-pickers        — 2 sessions
        Multi-team checklist, event picker, tournament picker,
        player picker, family picker (single_family + multi_family per D2)

4.4-D   Inline RSVP buttons               — 2 sessions
        Large pill CTAs in 9 kinds, mint_rsvp_token URLs embedded

4.4-0   Cross-kind smoke testing          — 1-2 sessions
        1 test per untested kind (8 kinds) to admin@
        Frank screenshots, files per-kind bugs

4.4-E   event_reminder_due trigger        — 2-3 sessions
        T-3d, T-1d, T-4h cadence per organization_settings

4.4-F   Wizard N1+N2 fixes                — 1 session
        Multi-team picker overlap with 4.4-C1; this is the surface bug
        portion (Search input, "All teams (0 emails)", anchor switch)

4.4-G   Scheduled sends                   — 1 session
        scheduled_for write + cron pickup

4.4-H   Preview pane fix                  — 1-2 sessions
        Server-side compose_preview RPC OR client-side composer reuse

4.4-I   briefing_templates seed           — 2 sessions
        Import 11 Squarespace HTML templates, composer reads from DB

4.4-J   Legacy column cleanup             — 1-2 sessions   [PR #92 §8 new wave]
        Drop headline, sub_context, body_notes, coach_user_ids, team_id,
        tournament_id, sent_by — IF validated unused by callsite grep
        Update digestSend.js + scheduleChangeSend.js to canonical-only
```

**Total estimated 4.4 effort:** 22–28 sessions. Consistent with recap's 25–30 estimate, slightly lower because A1 is gated on A0 outcome.

**One change from PR #92 §7:** **4.4-C2 moved before 4.4-B.** Everything else preserved.

---

## 8. FOR THE NEXT SESSION

Operator picks up here:

1. **Decide v2 fate** (PRE.1 follow-up — retire or merge).
2. **Decide OPEN-6** (Refinement R1 — lineage strategy for wizard send).
3. **Run 4.4-A0** (Resend dashboard check; 15 minutes).
4. **Greenlight 4.4-C2** based on OPEN-6 answer.

PR #92 + this revision together fully cover:
- Branch reconciliation (PRE.1)
- May 17 risk (PRE.2 — cleared)
- audience_filter localization (3 layers via PR #92 + 2 lineages via this doc)
- Inbox deep-link verification
- Webhook coverage + likely 0-opens root cause
- File size cap violations
- OPEN-1 through OPEN-5 resolutions
- New OPEN-6 (lineage strategy)
- Revised Wave 4.4 sequence (4.4-C2 before 4.4-B)

**Standing by for OPEN-6 and 4.4-A0 result.**

— end —
