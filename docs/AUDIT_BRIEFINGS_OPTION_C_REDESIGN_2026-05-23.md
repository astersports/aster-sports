# Briefings Option C Redesign — L99 Audit

**Branch:** `claude/briefing-composing-navigation-B5hVH`
**Date:** 2026-05-23
**Methodology:** §16.15 L99 redesign template
**Surface scope:** admin-only (briefings are admin-scoped)

---

## 0. Decision context

Frank-driven session 2026-05-23 PM. PR #503 (this branch's first ship) retired the redundant "Compose Briefing" tile. Follow-up review of the Briefings inbox surfaced that Active (41) + Drafts (37) are too noisy — Active includes drafts, drafts include 12-day-old stragglers. Three options offered (A: hero + collapsibles; B: tab-count cleanup; C: compose-first, hide queue). Frank locked **Option C**.

### Locked decisions
| Decision | Locked |
|---|---|
| Briefings tile target | Composer modal opens directly (existing `/admin/briefings/compose` route) |
| Draft-resume affordance | Inside composer Step 1 (StepKindPicker) — "Resume a draft?" card above tile grid |
| Synthetic alert surface | Admin Home `AlertZone` only — no separate inbox |
| Sent history access | Small "View sent" link in composer wizard header |
| Sent history page route | New `/admin/briefings/history` (sent-only standalone) |
| Draft auto-archive cadence | 7 days untouched → status='archived' |
| `/admin/briefings` URL | Redirect to `/admin/briefings/compose` (preserves bookmarks) |
| `CutoverGateChip` mount | AdminHomePage only (already there) |

### Out of scope for this audit
- Parent/coach surfaces (briefings are admin-only).
- Migration of historical drafts (audit assumes existing drafts stay where they are; auto-archive cron applies forward).
- Edge function / cron infrastructure for auto-archive (PR-D scope).
- New alert kind taxonomy beyond extending existing `briefing_overdue` evaluator (see §6 open question).

---

## 1. Initial audit pass

### 1.1 Deletion candidates (`src/components/briefings/inbox/`)
| File | Lines | Purpose | Outside callers |
|---|---|---|---|
| `ActiveQueue.jsx` | 64 | Renders db rows + synthetic items | None |
| `ActionQueueRow.jsx` | 58 | Row item renderer | None |
| `BriefingsHero.jsx` | 34 | Page hero header | None |
| `ComposeFab.jsx` | 36 | FAB to open composer | None |
| `EmptyState.jsx` | 52 | Empty state shell | None |
| `InboxFilters.jsx` | 112 | Filter controls (kind/team/date) | None |
| `InboxSearch.jsx` | 30 | Search input | None |
| `InboxTabs.jsx` | 49 | Active / Drafts / History tabs | None |
| `clientFilters.js` | 26 | Client-side filter helper | None |
| `HistoryView.jsx` | (unread) | Sent-rows view — **KEEP, mount into new history page** | (becomes the new page's body) |

`src/pages/BriefingsInboxPage.jsx` (150 lines) — replaced.

**Verification (grep):** No imports of the above components from outside `src/components/briefings/inbox/` other than `BriefingsInboxPage` itself.

### 1.2 Must-keep files
| File | Lines | Modification needed |
|---|---|---|
| `BriefingComposer.jsx` | 148 | +"View sent" link in header (passes to WizardHeader prop) |
| `WizardHeader.jsx` | (unread) | Accept + render `viewSentLink` prop |
| `StepKindPicker.jsx` | 82 | Insert "Resume a draft?" card before the grid (lines 63-81) |
| `useBriefingDraft.js` | 113 | Unchanged. `last_edited_at` is the auto-archive timing field; `status` enum already includes 'archived' (line 105) |
| `useBriefingDeepLink.js` | 60 | Unchanged |
| `useInboxQueue.js` | (unread) | Reused by new history page (filter to status='sent') |
| `lib/alerts/evaluator.js` | 162 | Extend `EVALUATORS` map with new `briefing_overdue:*` sub-keys (see §6) |

### 1.3 Consumers of old inbox URL
Grep `/admin/briefings` (excluding `/compose` and `/history/`):
| file:line | Today | Change |
|---|---|---|
| `src/App.jsx:90` | Route → BriefingsInboxPage | Replace element with `<Navigate to="/admin/briefings/compose" replace />` |
| `src/components/admin/QuickActions.jsx:48` | Tile `to: '/admin/briefings'` | Update `to: '/admin/briefings/compose'` directly (avoid bounce) |
| `src/components/briefings/inbox/HistoryView.jsx:38` | `onClearFilters → '/admin/briefings?tab=history'` | Update to `/admin/briefings/history` |
| `src/pages/admin/BriefingHistoryDetail.jsx:65` | "Back to inbox" → `/admin/briefings?tab=history` | Update to `/admin/briefings/history` |
| `src/pages/BriefingsInboxPage.jsx:88` | `closeComposer` navigates to `/admin/briefings` | Composer's new freestanding host page (per §1.4) handles close differently |

### 1.4 New page structure
- `src/pages/BriefingsComposePage.jsx` (NEW, ~80 lines) — thin host that mounts `BriefingComposer` directly. Replaces the inbox+modal pattern. `onClose` navigates back to `/` (admin home). Uses `useBriefingDeepLink` for anchor/kind/draft params (existing behavior preserved). Routes:
  - `/admin/briefings/compose` → `BriefingsComposePage`
- `src/pages/BriefingsHistoryPage.jsx` (NEW, ~100 lines) — standalone sent-only history. Mounts `HistoryView` + `InboxSearch` + `InboxFilters` (filters preserved verbatim from inbox; tabs gone). Route:
  - `/admin/briefings/history` → `BriefingsHistoryPage`

### 1.5 AlertZone integration
`src/components/alerts/AlertZone.jsx` + `src/hooks/useAlertEvaluator.js` already support pluggable alert kinds via the `EVALUATORS` map in `src/lib/alerts/evaluator.js:117`. Existing `briefing_overdue:weekly_digest` and `briefing_overdue:tournament_prelim` instances show the pattern. New sub-keys for Option C synthetic alerts:
- `briefing_overdue:game_recap` — game ended >24h ago, no game_recap sent
- `briefing_overdue:tournament_recap` — tournament ended >48h ago, no tournament_recap sent
- `briefing_overdue:schedule_change_followup` — `event_change_audit` row >24h old with no follow-up `comms_messages.kind='schedule_change'` linked

Each alert row's `actionTo` field deep-links to `/admin/briefings/compose?anchor=<kind>&id=<id>&kind=<briefing_kind>` (existing `useBriefingDeepLink` hydration).

### 1.6 Step 1 "Resume a draft" affordance
New hook `useAvailableDrafts({ orgId, limit: 5 })` — single Supabase query:
```
SELECT id, kind, anchor_kind, anchor_id, last_edited_at
FROM comms_messages
WHERE org_id = $1 AND status = 'draft'
  AND last_edited_at > NOW() - INTERVAL '7 days'
ORDER BY last_edited_at DESC LIMIT $2
```
Renders as a horizontal card row above the kind tile grid in `StepKindPicker.jsx`. Tap → `dispatch({ type: 'HYDRATE_DRAFT', payload: {...} })` (existing reducer action at `BriefingComposer.jsx:60`). Collapsed state when 0 drafts. New file `src/components/briefings/DraftResumeRow.jsx` (~60 lines) holds the rendering.

---

## 2. Deep-read addendum

Second pass surfaced these that initial missed:

### 2.1 The `?tab=` query param convention is referenced in tests
`src/hooks/__tests__/useBriefingDeepLink.test.js` doesn't test `?tab=`, but `BriefingsInboxPage:44` and `BriefingHistoryDetail:65` rely on it. The redirect (`/admin/briefings` → `/admin/briefings/compose`) drops the `?tab=` param. **Verify no callsites preserve tab through navigation**; if any do (e.g., back button from detail), they need updating to `/admin/briefings/history`.

### 2.2 `useInboxQueue` returns both drafts and sent rows
`src/hooks/useInboxQueue.js` calls the `briefing_active_queue` RPC, which returns rows tagged with `source='comms_messages'` (real rows) or `source='synthetic'` (auto-generated alerts). The new history page needs ONLY `status='sent'` rows — synthetic rows excluded entirely. `BriefingsHistoryPage` filters at the hook layer: pass `viewFilter='sent'` flag to `useInboxQueue` (new param) OR fetch directly via `supabase.from('comms_messages').select().eq('status', 'sent')`. **Recommendation:** direct query in the history page hook — RPC has too much synthetic-row baggage for a pure sent view.

### 2.3 `CutoverGateChip` (PR #484) mounted on both surfaces
`src/components/admin/CutoverGateChip.jsx` is mounted at `BriefingsInboxPage:128` AND `AdminHomePage:84`. The cross-surface invariant test (`CutoverGateChipCrossSurface.test.jsx`) per AP #43 locks identical rendering across both mounts. Removing `BriefingsInboxPage` removes one mount surface; **the cross-surface test loses one of its two render targets**. Either (a) update the test to mount on the new `BriefingsComposePage` if the chip is shown there too, or (b) reduce the test to single-surface (AdminHomePage only) + rename. Recommendation: (b) — Option C de-emphasizes per-briefings-page UI in favor of the home-centric pattern.

### 2.4 `PilotModeChip` lives inside `BriefingsHero`
`src/components/briefings/PilotModeChip.jsx` (referenced at `BriefingsHero.jsx:9`) renders the "Pilot Mode ON" pill. Deleting `BriefingsHero` orphans this surface unless we mount the chip elsewhere. Options:
- (a) Mount inside `BriefingsComposePage` header (next to "View sent" link).
- (b) Mount inside Admin Home (next to `CutoverGateChip`).
- (c) Drop entirely (pilot mode is an org-level setting visible in admin settings page).
Recommendation: (a) — pilot mode is most relevant when about to send.

### 2.5 `ComposeAnchorCta` deep-link path stays intact
`src/components/briefings/ComposeAnchorCta.jsx:52` constructs `/admin/briefings/compose?kind=<kind>&anchor=<anchor>&id=<id>` — works identically against the new `BriefingsComposePage` because `useBriefingDeepLink` is preserved. No change needed.

### 2.6 Tests that mount the old inbox
Grep `BriefingsInboxPage`:
- `src/components/admin/__tests__/CutoverGateChipCrossSurface.test.jsx` — see §2.3 above.
No other tests mount the inbox page directly.

### 2.7 Edge function / cron for auto-archive
No existing edge function archives drafts. New cron tick + edge function needed:
- `supabase/functions/briefing-draft-archive-tick/index.ts` — runs daily, archives `comms_messages WHERE status='draft' AND last_edited_at < NOW() - INTERVAL '7 days'`.
- Migration: register pg_cron schedule.
- Per AP #31: add `[functions.briefing-draft-archive-tick] verify_jwt = false` in `supabase/config.toml` if using `CRON_SECRET` auth (audit test at `src/lib/__tests__/verifyJwtConfigAudit.test.js` enforces this).
- Per AP #33: any new shared secret lives in `app_secrets` (reuse existing `cron_secret`).

**Defer to PR-D (last in sequence).** Lower priority — the redesign ships value without it; the auto-archive cron is a hygiene follow-up.

---

## 3. Anti-pattern catalog cross-reference

| AP | Application |
|---|---|
| #6 file-length ≤150 | All new pages stay under 150. `BriefingComposer.jsx` already at 148 — adding "View sent" link prop pushes us close; verify post-edit. `BriefingsComposePage.jsx` (new) ~80; `BriefingsHistoryPage.jsx` (new) ~100. |
| #11 P0 blocker on >150 | Pre-flight wc check on every touched file before commit. |
| #34 registry caller migration | EVALUATORS map gains 3 new sub-keys; `alert_types` table needs 3 new rows registered in same migration. No existing callers reference these keys yet, so it's an additive registry change. |
| #36 destructured-default error swallowing | New `useAvailableDrafts` hook + history page Supabase queries must check `{ data, error }` and throw on error, not silently `= []`. |
| #37 org_id-first filtering | `comms_messages` is org-scoped — every query starts `.eq('org_id', orgId)` before other filters. |
| #42 parallel-system buildup | Don't build a new draft-resume hook if `useBriefingDraft` already exposes the list. **Verify:** `useBriefingDraft.js` currently fetches one draft by id. A list-fetch hook is new (`useAvailableDrafts`), but it's the single consumer; not a parallel system. |
| #43 cross-surface invariant test | `CutoverGateChipCrossSurface.test.jsx` loses one mount surface — see §2.3 resolution. |
| #45 ledger reconciliation | This audit doc IS the planning artifact. Update `EMBER_PENDING_LEDGER.md` §4.AI in the same commit as this doc. |
| #49 full-paste discipline | Full doc pasted in chat after commit + push + PR. |
| #51 dead-feature mount retirement | Inbox surface retirement is the model case — this is the 18+th surface retired under this pattern. |
| #54 same-MCP-burst ready-flip + auto-merge | Every PR in the sequence flips ready + enables auto-merge in same burst as `create_pull_request`. |
| #58 cross-batch pattern check | PR sequence (A→D) is sequential, not parallel batches; not directly applicable, but each PR notes patterns observed for downstream PRs. |

---

## 4. Wireframes (admin only)

### 4.1 Admin Home — COMMUNICATE group (unchanged from PR #503)
```
COMMUNICATE
┌─────────────────────┐  ┌─────────────────────┐
│ 📥 Briefings        │  │ 📣 Announce         │
└─────────────────────┘  └─────────────────────┘
```
"Briefings" tile now links directly to `/admin/briefings/compose` (no inbox detour).

### 4.2 Admin Home — AlertZone (new synthetic alert kinds)
```
ALERTS
┌──────────────────────────────────────────────────────────┐
│ 🟧 Game recap pending                            warning │
│    11U Girls vs. Westchester (Sat) — game ended 26h ago  │
│    [ Compose recap ] →                                   │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ 🟧 Tournament wrap-up pending                    warning │
│    Spring Showdown — ended 2d ago, no recap sent         │
│    [ Compose wrap-up ] →                                 │
└──────────────────────────────────────────────────────────┘
```
Each alert deep-links to composer with anchor + kind pre-filled.

### 4.3 `/admin/briefings/compose` — new freestanding compose page (FullScreenForm host)
```
┌────────────────────────────────────────────────────────────┐
│ Cancel                Compose · Kind         View sent ▾  │  ← WizardHeader
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─ Resume a draft? ──────────────────────────────────┐    │
│  │ Game recap · 11U Girls · last edited Mon 6:01 PM  │    │
│  │ Tournament prelim · Spring Showdown · Sun 4:22 PM │    │
│  │ Announcement · all teams · Sun 12:15 PM           │    │
│  └────────────────────────────────────────────────────┘    │
│                                                            │
│  Or pick a kind:                                           │
│  ┌──────────┬──────────┬──────────┐                        │
│  │  Game    │ Tournmt  │ Tournmt  │                        │
│  │  recap   │ prelim   │ recap    │                        │
│  ├──────────┼──────────┼──────────┤                        │
│  │ Weekly   │ Schedule │ Coach    │                        │
│  │ digest   │ change   │ roundup  │                        │
│  ├──────────┼──────────┼──────────┤                        │
│  │ RSVP     │ Family   │ Announce-│                        │
│  │ nudge    │ guide    │ ment     │                        │
│  └──────────┴──────────┴──────────┘                        │
│                                                            │
│  Pilot Mode ON                                             │
└────────────────────────────────────────────────────────────┘
```

### 4.4 `/admin/briefings/history` — sent-only history page
```
┌────────────────────────────────────────────────────────────┐
│ ← Back                                                     │
│                                                            │
│  Sent briefings                                            │
│                                                            │
│  [ All kinds ▾ ] [ All teams ▾ ] [ All time ▾ ]            │
│  [ Search sent…                                       🔍 ] │
│                                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 🏆 Game recap                              SENT    │    │
│  │ 11U Girls vs. Westchester · Mon, May 19 6:01 PM    │    │
│  │ 12 families · ★ 4.5 (8 ratings)                    │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 📅 Weekly digest                           SENT    │    │
│  │ all teams · Sun, May 18 5:00 PM                    │    │
│  │ 60 families · ★ 4.2 (24 ratings)                   │    │
│  └────────────────────────────────────────────────────┘    │
│  ...                                                       │
└────────────────────────────────────────────────────────────┘
```
Tap row → existing `BriefingHistoryDetail` (unchanged).

---

## 5. Out-of-scope (explicit)

- Parent-facing surfaces (no parent inbox; briefings are admin-scoped).
- Coach-facing surfaces (coach home doesn't surface briefings — Option B in earlier discussion would have changed this, Option C does not).
- Migration of in-flight drafts (37 existing drafts stay where they are; auto-archive cron applies forward from PR-D ship).
- Per-row "Discard" actions on the draft-resume card (user clears stale drafts by ignoring them — auto-archive handles cleanup).
- Search across draft bodies (search lives on history page; drafts surface only by recency in the resume affordance).
- Mobile-vs-desktop responsive variants beyond what `FullScreenForm` already provides.
- Tournament/team views (deep-link composer access from `TournamentHeader`, `TeamDetailHero`, `EventHeroActions` stays unchanged).
- Sentry / PostHog event re-keying for the new pages (track-as-existing).

---

## 6. Open questions

### Q1 — Alert kind structure
Per §1.5, three new sub-keys under `briefing_overdue`:
- (a) Register 3 new instance-keys (`game_recap`, `tournament_recap`, `schedule_change_followup`) on the existing `briefing_overdue` alert_type. Per-instance evaluators in `EVALUATORS` map.
- (b) Add one new alert_type `briefings_active_queue` with a single evaluator that reads from `briefing_active_queue` RPC and emits one alert per firing kind.

(a) is consistent with the existing pattern (matches `weekly_digest` + `tournament_prelim` shape). (b) is simpler infrastructure but introduces a single multi-purpose evaluator. **Recommend (a)** — register per-kind for granular admin enable/disable later.

### Q2 — `BriefingsHistoryPage` data source
Per §2.2, either:
- (a) Pass `viewFilter='sent'` param to existing `useInboxQueue` hook (RPC-backed, includes synthetic-row baggage filtered client-side).
- (b) Direct `supabase.from('comms_messages').eq('status','sent')` query in a new `useSentBriefings` hook.

**Recommend (b)** — no synthetic-row contamination, simpler query, no RPC dependency for a pure sent view.

### Q3 — Cancel behavior on `BriefingsComposePage`
When user taps Cancel (or composer onClose), where do they go?
- (a) `/` (admin home).
- (b) `/admin/briefings/history` (the sent page).
- (c) `navigate(-1)` (browser back).

**Recommend (a)** — clean exit to admin home matches the "compose-first, no inbox" intent.

---

## 7. PR sequence

| PR | Title | Scope | Lines changed (est.) |
|---|---|---|---|
| A | feat(briefings): freestanding compose page + history page | New `BriefingsComposePage` + `BriefingsHistoryPage`; route updates in `App.jsx`; `QuickActions` tile retargets; `useAvailableDrafts` hook; `DraftResumeRow` component; `StepKindPicker` integration; "View sent" link in `WizardHeader`. Delete `BriefingsInboxPage` + 9 inbox sub-components. | +~400 / -~500 |
| B | feat(alerts): briefing_overdue sub-keys (recap, tournament_recap, schedule_change_followup) | Migration: 3 new `alert_types` rows + 3 default `alert_configurations`. Code: 3 new evaluators in `src/lib/alerts/evaluator.js` (Q1 option a). 3 alert-zone test fixtures. | +~150 |
| C | refactor(test): CutoverGateChip single-surface | Per §2.3 resolution (b). Update + rename `CutoverGateChipCrossSurface.test.jsx` → `CutoverGateChipRender.test.jsx`. | +0 / -~30 |
| D | feat(briefings): auto-archive drafts >7 days | New edge function `briefing-draft-archive-tick`. `supabase/config.toml` entry. pg_cron schedule migration. Test coverage. | +~120 |

A is the load-bearing redesign PR. B unlocks alert-driven workflows. C cleans up the test consequence of A. D is hygiene follow-up.

**Recommend:** ship A→B→C in this session; D as a follow-up tomorrow or next routing window (don't gate A on D — per §16.13 "ship not gate by config").

---

## 8. PR A verification checklist (manual, post-merge)

1. Log in as admin.
2. Tap **Briefings** tile on admin home → composer wizard opens directly (no inbox first).
3. Verify Step 1 shows "Resume a draft?" card with up to 5 recent drafts (assuming drafts exist <7d old).
4. Tap a draft → composer hydrates to Step 3 (Body) with content prefilled.
5. Reopen composer fresh → tap "View sent" in wizard header → lands on `/admin/briefings/history` with sent rows.
6. Tap any sent row → opens existing `BriefingHistoryDetail` page.
7. Open browser to `/admin/briefings` directly → redirects to `/admin/briefings/compose`.
8. From event detail page, tap "Compose briefing" → composer opens with event anchor (deep-link path still works per §2.5).
9. From admin home, verify CutoverGateChip still renders (unchanged surface).
