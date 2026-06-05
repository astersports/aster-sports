# HOME REDESIGN — CC GROUND-TRUTH CONFIRMATIONS

> CC's response to `HOME_BUILD_HANDOFF_CC.md §2` (the 7 confirmations) for the claude.ai design lane.
> Source hierarchy: live system state (Supabase MCP project `vrwwpsbfbnveawqwbdmj`) + repo greps.
> Date 2026-06-05. **No code / migrations / schema changes made — confirmations only**, per the
> handoff collaboration protocol (§6: confirm → flag → reconcile in claude.ai → Frank GO → build).
> Companion to `docs/AUDIT_HOME_REDESIGN_L99.md` (the §16.15 code audit).

---

## Headline corrections (read first)
1. **The "gating" migrations 013 / 018 / 020 are all already APPLIED — not future.** The real gate is
   **data population**, not migration existence. And **020 is mislabeled** in the canon (it's
   `event_notifications_enum_reconciliation`; attendance views are migration **023**, also applied).
2. **Three canon component names don't exist as written** (Rule 13): `NextUpCard` → actually
   **`NextEventCard`**; `CompactCard` → does not exist; `useAdminStats` → does not exist
   (**`useProgramHealthMetrics`**). The `UPCOMING_SEED` stub is **already replaced** (parent next-event
   is a real `useActivities` query).
3. **RSVP 3-state and home-level density are both feasible with no migration.**

---

## §2.1 — Rebrand status ⚠ need your grep file
Token rebrand is **clean**: `--sf-` = 0, `--em-` = 0, `--as-` = 2170, AsterSports = 18 in `src/`.
But **43 "Ember" + 2 "Skyfire" string hits** remain in `src/` (excluding the deliberately-surviving
`ember_live` / `@ember` legacy IDs per CLAUDE.md) — almost certainly comments / historical refs
(e.g. index.css `/* Brand (Ember defaults…) */`), not live naming. Cannot certify against the
"should be 0" target without the exact six greps. **`REBRAND_VERIFY_chatai.txt` was not in the
package** — please send it and I'll report exact counts.

## §2.2 — Component map (B4) ✓
Coach renders via a **dedicated `src/pages/CoachHomePage.jsx`** (lazy-loaded from `HomePage.jsx` on
`activeRole === 'coach'`). Parent = `ParentHomePage`, Admin = `AdminHomePage`. B4 answer: coach has its
own page, not a shared `HomePage`.

## §2.3 — Migration status ⚠ premise correction
All APPLIED (registered in `schema_migrations`): **013** `coaching_assignments_rates`, **016**
`user_preferences`, **018** `team_achievements`, **020** `event_notifications_enum_reconciliation`.
- **020 ≠ attendance.** Attendance views are **migration 023 `attendance_trending_views`** (applied).
- None of these are future/gating. Re-ground day-one-vs-end-state on **data population** (below).

### §2.3b — Gated-feature DATA reality (the real gate)
| Feature | Schema | Live rows | Real status |
|---|---|---|---|
| Achievements (`team_achievements`, 018) | exists | **3 rows** | Can render day-one — not empty |
| Comp accrual (`coaching_assignments.rates`, 013) | exists (`rates`, `pay_per_session_cents`) | **11 rows** | Schema + data exist; gate = wiring session counts |
| Attendance arrow / roster-health (`check_ins` + 023 views) | exists | **check_ins = 0** | **Genuinely empty — THIS is the real gate** (data, not migration) |
| Coach per-event assignment (`event_coach_assignments`) | exists | **0 rows** | Empty — see Rule 1 |

## §2.4 — RSVP states ✓ three states already supported
Table `event_rsvps`, column **`response`** (not `status`). CHECK = **`going / not_going / maybe`** —
three states live in prod. **Inline 3-state control needs no prerequisite migration.**

## §2.5 — Density ⚠ correction + doctrine impact
`user_preferences.card_density` is **JSONB, not single-value** — currently a per-section map (keys like
`parent-home`, `coach-schedule`, `default`). Home-level adoption = **code change, no migration** (write
one `default`/`home` key, retire per-section toggles in UI). Caveats: (1) **supersedes CLAUDE.md §16.2**
(per-section NowSection scoping) — doctrine line needs updating; (2) `DensityToggle`/`useDensity` is a
**2-state runtime (`minimal`/`maximum`)** but carries **dead `medium` 3-state refs + stale comment**
(`DensityToggle.jsx:17-21,48-49`) — clean that first. **CC confirms home-level density feasible;
recommend ratifying 2-state as final.**

## §2.6 — Reused component names (Rule 13) ⚠ 3 mismatches
- **`NextUpCard` → does NOT exist.** Shipped card is **`NextEventCard`**
  (`src/components/admin/NextEventCard.jsx`), reused across all 3 homes.
- **`CompactCard` → does NOT exist.** Name the intended target.
- **`useAdminStats` → does NOT exist.** Admin KPIs come from **`useProgramHealthMetrics`** (+
  `useAdminHomeSignals`).
- Confirmed present ✓: `ChildRsvp`, `QuickActions` (admin shortcut grid), `ProgramHealthCard`,
  `DensityToggle`, `useRsvps`.

## §2.7 / §3 — Data-source map reconciliation
- **Parent next event:** **`UPCOMING_SEED` stub does NOT exist** — already a real `useActivities` query
  via `useParentHomeSignals`. The "replace the seed stub" task is **already done**.
- **Coach assignment scoping (Rule 1):** current code scopes via **`team_staff`** (team-level), not
  assignment. `coaching_assignments` (11 rows) is also team-level. True per-session scoping ("Darien
  sees only his sessions") needs **`event_coach_assignments` — 0 rows.** Rule 1's per-session promise
  has no data today. Recommend: day-one coach scopes to team via `team_staff`/`coaching_assignments`;
  per-session waits on `event_coach_assignments` population.
- **Briefing pilot mode is ON** — the unread-briefing item + admin Radar pin must respect pilot gating
  (families receive nothing until flipped).

---

## CC code-audit findings that affect the day-one shell
(from `docs/AUDIT_HOME_REDESIGN_L99.md`)
- **Shell's single `ComingUp` source FIXES a real bug.** "Next event" is computed **3 different ways**
  today (admin `activities.find`, coach `thisWeek[0]`, parent `nextEventId`) — AP#63 divergence. One
  source closes it.
- **"Week → Schedule tab" is a real scope reduction** from the current NEXT-7-DAYS home list
  (`DateGroupedList`); also removes the parent/coach `dutyCounts` divergence. Confirm the UX change.
- **Perf anchor (§17.1/§17.8): home LCP ~5s, 3.3× over the 1.5s budget.** Root cause aligns with the
  lean shell: **6 self-fetching admin cards** fan out independent queries that defeat the loading gate.
  Recommend `use[Role]NeedsYou()`/`use[Role]ComingUp()` own the fetching; cards stay presentational.
- **Weather coords `41.03,-73.76` hardcoded ×7** (+ `America/New_York` TZ) — every org gets Westchester.
- **a11y systemic:** soft-on-soft text (success/warning/accent eyebrows) ~3.6–3.9:1 < 4.5:1 across ~4
  home cards; fix likely needs the §0 accessibility-corollary token (`--as-text-meta` precedent).

---

## Open questions / decisions back to the design lane
1. Send `REBRAND_VERIFY_chatai.txt` for exact rebrand greps.
2. Re-ground day-one gating on **data** (`check_ins`=0, `event_coach_assignments`=0), not migrations
   (all applied). Achievements (3 rows) + comp schema (11 rows) can render sooner than assumed — want
   them in Parent/Coach day-one?
3. Confirm **`NextEventCard`** as canonical (not `NextUpCard`); name the intended `CompactCard`/
   `EventMini` target.
4. Ratify **2-state density** as final + accept the §16.2 doctrine update.
5. Confirm **coach day-one scopes to team** (`team_staff`) until `event_coach_assignments` is populated.
6. Naming: CC produced the §16.15 audit as `docs/AUDIT_HOME_REDESIGN_L99.md`; the canon references
   **`HOME_AUDIT_L99.md §7`** (per-role definition of done). Is §7 expected from CC's audit, or a
   separate design-lane artifact? Will align names on GO.

**STATUS:** Holding per protocol — no code/migrations/schema until reconciled in claude.ai and Frank
gives GO. The §16.15 audit doc + this report are committed to the branch as review artifacts only.
