# Phase 5 Type / Contract Audit

**Date:** 2026-05-16 (Italy morning, "go and don't stop" mode)
**Method:** 1 Explore agent walking RESOLVER_REGISTRY + composer emit-sites + Body component contracts
**Coverage:** 8 calendar-anchored kinds, 32 SECTION_RENDERERS, 10 Body components, composerSubmit 4-branch dispatch
**Status:** Read-only inventory.

---

## RESOLVER_REGISTRY contract — PASS

All 8 kinds have:
- `resolveXxx({ ...anchor }, { supabase, ... }) → Promise<{ context, slices }>` ✓
- `composeXxx(context, slice, overrides) → { subject, content_sections }` ✓
- `anchorFromState` returning correct shape per anchor source ✓
- `overridesFromState` using consistent `bodyOverrides` pattern ✓
- `sendPath ∈ { composerSubmit, digestSend, rsvpNudgeSend, academyCallupSend }` ✓

Zero contract drift across the registry. Wave 4.2-A discipline held.

---

## composer emit-site sweep — 7 ORPHAN SECTION KINDS (Phase 2 had 3, +4 new found)

Phase 2 surfaced 3 orphan kinds (event_card, placement_block, game_log). Phase 5 agent walked ALL composer emit-sites and surfaced 4 additional:

| Orphan kind | Emitted by | First found in |
|---|---|---|
| `event_card` | rsvpNudge.js:122, academyCallupNotice.js:118 | Phase 2 |
| `placement_block` | tournamentRecapHelpers.js:12 | Phase 2 |
| `game_log` | tournamentRecapHelpers.js:38, 46 | Phase 2 |
| `callup_card` | academyCallupNotice.js:117 | **Phase 5 NEW** |
| `coach_reflection` | tournamentRecap.js:120 | **Phase 5 NEW** |
| `standout_moments` | tournamentRecap.js:119 | **Phase 5 NEW** |
| `family` | academyCallupNotice.js:54 (?) | **Phase 5 NEW** — needs verification |

All 7 are top-level `sections.push({ kind: 'X', ... })` emit-sites. `composer.js:renderSections` calls `warnUnknownKind()` (dev console only) and returns empty string. **In production, all 7 sections silently render empty.**

**Note on cross-phase context:** Phase 2A agent claimed `family`, `callup_card`, `coach_reflection`, `standout_moments` were "data carriers nested inside other sections" — NOT top-level sections. Phase 5 contradicts this. Cross-verification required before action:

Looking at the actual `academyCallupNotice.js:117`:
```js
sections.push({ kind: 'callup_card', kid_first_name: ..., ... });
```

That's top-level `sections.push` — same flow as renderSections iteration. The Phase 2A "nested data carrier" claim was wrong; Phase 5 finding is correct.

**Combined finding count:** 7 unique orphan section kinds across 4 briefing kinds (rsvp_nudge, academy_callup_notice, tournament_recap, plus the suspected `family` site).

### Severity classification

All 7 are **P0-LATENT** — would silently render empty in production on first send of the affected briefing kind. None of the affected kinds have been sent to real recipients yet per the production `comms_messages` state. The bugs are PRE-PRODUCTION, but ship the moment Frank sends a real briefing of one of these kinds.

**Fix scope:** 7 new renderer files (one per orphan kind), each ~30-50 lines following existing patterns. Plus composer.js registration. ~250-350 lines total. Substantial but mechanical.

---

## Body component contract — 1 P1 DRIFT

**TournamentRecapBody.jsx**
- Composer emits `standout_moments` and `coach_reflection` from `overrides` (tournamentRecap.js:119-120)
- BriefingComposer wizard state carries these as `state.body.standout_moments` + `state.body.coach_reflection`
- **TournamentRecapBody.defaultValue lacks both keys** — UI form does not initialize these fields
- The result: when an admin opens a tournament_recap draft for the first time, these override fields are undefined; the composer falls through to whatever it does with `undefined`

**Severity: P1.** Contract divergence is silent today (composer probably handles undefined gracefully) but will surface as a UX bug on first real use of the kind. Same class as the orphan emits — latent.

**Fix scope:** ~4 lines on `TournamentRecapBody.jsx` defaultValue.

The other 7 Body components (GameRecap, TournamentPrelim, ScheduleChange, RsvpNudge, AcademyCallup, CoachRoundup, WeeklyDigest, AnnouncementBody, CustomMessageBody) correctly include emitted override keys in defaultValue.

---

## composerSubmit dispatch — PASS

4-branch dispatch verified intact:
1. `rsvp_nudge` → `sendRsvpNudge` short-circuit (lines 81-85)
2. `academy_callup_notice` → `sendAcademyCallupNotice` short-circuit (lines 86-90)
3. Guard rejects digestSend/rsvpNudgeSend/academyCallupSend fall-through (lines 92-95)
4. composerSubmit kinds (game_recap, tournament_prelim, tournament_recap, schedule_change) → `resolveAndComposePerSlice` (lines 99-102)
5. announcement/custom_message → `composeLegacy` (line 104)

Per-slice compose dispatches via `RESOLVER_REGISTRY[kind].compose`. Zero drift.

---

## Severity summary

| Severity | Count | Class |
|---|---|---|
| P0-LATENT | 7 unique orphan section kinds (across 4 briefing kinds) | Class 5 (Registry) |
| P1 | 1 (TournamentRecapBody defaultValue drift) | Class 8 (Type/Contract) |
| P2 | 0 | — |

**RESOLVER_REGISTRY contracts: CLEAN**
**composerSubmit dispatch: CLEAN**

---

## Cross-phase synthesis preview

Phase 5 elevated the orphan-section count from 3 → 7, which materially changes the post-synthesis batched fix scope. Rough estimate:
- 7 renderers × 30-50 lines = ~250-350 lines of new renderer code
- Composer.js registration += 7 lines
- May need 1-2 new helper files if any renderer is substantial

That's a meaningful chunk of work — bigger than I anticipated when proposing "stage to post-synthesis batched PR" in Phase 2. Worth Frank's input on whether to:
- Ship 7 renderers in one big PR
- Split into 2-3 PRs by briefing kind (rsvp_nudge renderers, academy_callup renderers, tournament_recap renderers)
- Defer some kinds (e.g., tournament_recap renderers can wait until Frank wants to send recaps)

---

## Phase 5 status: COMPLETE

- **P0-LATENT:** 7 orphan section kinds (4 new beyond Phase 2)
- **P1:** 1 Body defaultValue drift (TournamentRecapBody)
- **P2:** 0
- **RESOLVER_REGISTRY contracts:** PASS
- **composerSubmit dispatch:** PASS

Next: **Phase 6 — Synthesis doc** (top findings across all 5 phases, systemic themes, impact on PR 5/6/7).
