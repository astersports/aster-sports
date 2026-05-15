# Cutover Wave — Gap Audit

**Audit date:** 2026-05-15
**Scope:** Reconcile the cutover wave plan against existing
codebase reality. Surface gaps between what the engine produces
today and what Frank's hand-composed briefings show as the
target. Revise the wave sequence accordingly.

**Methodology:** Read the engine (composer.js, resolver
registry, tournamentPrelim resolver, header renderer), the
composer UI (TournamentPrelimBody, composerSubmit), the
dispatch pipeline references, and queried production for
actually-sent briefings. Compared against Frank's 6 hand-
composed briefing samples (3 team + 1 family + 2 coach
roundup) and the cataloged renderer style spec
(`docs/BRIEFING_RENDERER_REFERENCES.md`).

**Output rule:** doc only. No code, no migrations, no new
files outside `docs/`. Findings inform PR 2-N scoping next
session.

---

## TL;DR

The wave plan ("PR 1 = build the renderer engine") was based
on a greenfield assumption. Reality is a **mature, fully
wired briefing pipeline** with ~50 files, 21 atomic section
renderers, 7 calendar-anchored kinds via `RESOLVER_REGISTRY`,
deterministic template-driven generation, comms_messages
queue + per-recipient body, Resend integration with bounce
webhook, RSVP token handling, scheduled-send infra,
unsubscribe handling, and a multi-step composer wizard with
9 body-component kinds.

**The gap is not "build the engine."** The gap is:
1. **Existing engine produces a different output shape than
   Frank's hand-composed briefings.** The engine has been
   used for weekly digests + announcements but **NOT** for
   the cobalt-header tournament briefings Frank shared.
2. **Three new audience types** (multi-team coach roundup,
   multi-kid family guide, conflict-detection variants) are
   not represented in the existing kinds.
3. **LLM-generated voicey content is absent.** The engine
   is template-driven; voice slots are operator-typed
   textareas. Frank's voicey closers ("fly to Florida and
   back") would need a new path.
4. **Per-venue local notes** (Casa Bianca Pizza, etc.) have
   no schema home or render path today.

The wave is much smaller than originally scoped on the engine
side, and much more focused on **alignment + extension** than
**build from scratch**.

---

## 1. What exists

### 1.1 Engine layer (`src/lib/engine/`)

**composer.js** (112 lines) — engine entrypoint.
- `SECTION_RENDERERS` map: 21 atomic section types →
  renderer function. Includes header, game_card,
  championship_scenarios, footer, signoff, hotel_block,
  champion_callout, other_games, ops_notes, cta_buttons,
  stats_narrative, labeled_keys, stat_grid, results_table,
  weekly_schedule, tiebreaker_explainer, schedule_change_diff,
  rsvp_request, callup_response, pool_standings,
  custom_message.
- `KIND_COMPOSERS` map: 4 legacy kinds (academy_callup_notice,
  weekly_digest, announcement, custom_message). Calendar-
  anchored kinds dispatch via `RESOLVER_REGISTRY`, NOT
  via `KIND_COMPOSERS`.
- `renderSections(sections)` → joined HTML string
- `renderSectionsPlainText(sections)` → joined plain-text

**resolvers/registry.js** — `RESOLVER_REGISTRY` for 7
calendar-anchored kinds:
- weekly_digest (sendPath: digestSend)
- game_recap (composerSubmit)
- tournament_prelim (composerSubmit)
- tournament_recap (composerSubmit)
- schedule_change (composerSubmit)
- rsvp_nudge (rsvpNudgeSend)
- academy_callup_notice (academyCallupSend)

Each entry: `{ resolve, compose, anchorFromState,
overridesFromState, sendPath }`. Two-stage contract:
`resolve(anchor, options) → { context, slices }` then
`compose(context, slice, overrides) → { subject, content_sections }`.
Per anti-pattern #28 (CLAUDE.md) — single source of truth,
no kind-switch in dispatch.

**resolvers/tournamentPrelim.js** — example calendar-anchored
resolver. Walks tournament + tournament_teams + events +
locations + staff_profiles + organizations. Returns
slices = one per team. compose() emits sections:
header / team_schedule_table / hotel_block (cond) /
survival_guide (cond) / coach_keys (cond) /
tourney_url_link (cond) / stats_narrative (per coach_note +
parent_shoutout) / signoff / footer.

**templates/** — 7 starter-template files (one per kind):
tournamentPrelim, tournamentRecap, weeklyDigest, gameRecap,
rsvpNudge, announcement, customMessage. Each template is a
list of pre-filled body-field starter values (e.g.,
"tp-multi-day-hotels" pre-fills hotel_block + sat_notes).
Frank picks a template, edits the fields. NOT LLM-driven
— deterministic body values.

**__fixtures__/** — 11 reusable section fixtures
(signoff, statGrid, weeklySchedule, ctaButtons, etc.) for
tests + dev preview.

**substitution/** — per-recipient token substitution helpers
(callupTokens.js, rsvpTokens.js) per anti-pattern #29.

**renderers/** — 24 renderer files. Each exports a function
returning `{ html, plainText }`. HTML is inline-styled,
table-based markup per CLAUDE.md §13 rules (no `<style>`
blocks, table layout, inline styles, no `<div>` wrappers in
rules sections).

### 1.2 Composer UI (`src/components/briefings/`)

**BriefingComposer.jsx** — main multi-step wizard. Touched in
PR #168 (Group C2 fix). State machine via composerReducer.

**Steps:** StepKindPicker → StepAnchorAudience → StepBodySignoff
→ StepSendConfirm. Plus PreviewPanel (live render preview),
SaveStatusPill (autosave indicator), ScheduleForLaterPicker,
PilotModeChip + PilotTestScopePicker.

**bodies/** — 9 Body component editors, one per kind:
- TournamentPrelimBody (5-textarea form: hotel_block,
  sat_notes, sun_notes, opponent_scouting, lineup_notes +
  optional tourney_link_label)
- TournamentRecapBody, GameRecapBody, WeeklyDigestBody,
  RsvpNudgeBody, AnnouncementBody, CustomMessageBody,
  ScheduleChangeBody, AcademyCallupBody
- AcademyCallupRedirectCard, PlayerPicker (sub-components)

**audience/** — RecentAndFavorites + TeamGroupedPicker for
recipient selection.

**inbox/** — 8 inbox UI components (BriefingsHero,
ActiveQueue, HistoryView, ActionQueueRow, InboxFilters,
InboxSearch, InboxTabs, ComposeFab, EmptyState). Briefings
inbox is the entry point post-PR-#160.

**composerSubmit.js** — orchestrates resolve → compose →
render → queue → dispatch. Routes per `sendPath` from
RESOLVER_REGISTRY. Calls `send-tournament-message` Edge
Function for immediate sends.

### 1.3 Edge functions (`supabase/functions/`)

8 functions, mature pipeline:
- `send-tournament-message` — manual dispatch (drains
  comms_message_recipients with status=queued)
- `briefing-cron-dispatch` — auto-send queued/scheduled
  briefings on cron tick
- `briefing-auto-draft-tick` — auto-create drafts per cron
  (Wed 6 PM weekly-digest pattern from CLAUDE.md mentions)
- `resend-webhook-receiver` — Resend bounce/delivery/
  open/click webhook (per anti-pattern #33's exception)
- `rsvp-token-handler` — signed-token RSVP landing
- `callup-token-handler` — signed-token academy callup landing
- `unsubscribe-handler` — CAN-SPAM unsubscribe link target
- `invite-parent` — guardian onboarding invite flow

### 1.4 Hooks (`src/hooks/`) — 9 briefing-related

useComposeBriefing, useBriefingDraft, useEventBriefings,
useAnchorBriefings, useNeedsBriefing (inbox), useDigestRecipients,
usePlayerRecipients, useBriefingDeepLink, useBriefingFilters.

### 1.5 Schema state (verified against production today)

`comms_messages` table — kind, anchor_kind, anchor_id,
audience_type, audience_filter, body_html, body_plain,
content_sections (JSONB), subject, signoff_message,
status, sent_at, recipient_count, scheduled_for, etc.

`comms_message_recipients` — per-recipient body persist
(supports per-recipient HTML for tokens substitution).

Recent kind allowlist on `comms_messages_kind_check`:
weekly_digest, tournament_preliminary, tournament_final,
tournament_rsvp_lock, tournament_recap_interim,
tournament_recap_final, schedule_change, multi_team_notice,
academy_callup_notice, custom. (Note: legacy values still
present per the comms-foundation migration; the resolver
registry uses tournament_prelim / tournament_recap as
canonical.)

---

## 2. The actual pipeline (resolver → compose → render → queue → dispatch)

```
User picks kind in BriefingComposer wizard
  ↓
state.kind set → composerReducer
  ↓
RESOLVER_REGISTRY[state.kind].anchorFromState(state) → anchor
  ↓
RESOLVER_REGISTRY[state.kind].resolve(anchor, { supabase })
  → { context, slices }    (DB walks: tournament, teams,
                             events, locations, coaches,
                             recipients)
  ↓
overrides = { ...state.body, signoff_message: state.signoff_message }
  ↓
For each slice (per-team):
  RESOLVER_REGISTRY[state.kind].compose(context, slice, overrides)
    → { subject, content_sections }
  ↓
composer.renderSections(content_sections) → HTML string
composer.renderSectionsPlainText(content_sections) → plain
  ↓
INSERT comms_messages row (body_html, body_plain, content_sections)
INSERT comms_message_recipients per recipient (queued)
  ↓
supabase.functions.invoke('send-tournament-message', { message_id })
  ↓
Edge function: drains queued recipients, batch-sends via Resend
  ↓
UPDATE comms_message_recipients status=sent (or failed per response)
UPDATE comms_messages sent_at, sent_by, recipient_count, delivery_method
```

This is a clean, mature pipeline. It works.

---

## 3. What's been actually sent

Production query: 10 most recent comms_messages for org
e3e95e21 (Legacy Hoopers).

| kind             | sent_at              | subject                  | recipients |
|------------------|----------------------|--------------------------|------------|
| announcement     | 2026-05-11 22:46     | (null)                   | 1          |
| weekly_digest    | 2026-05-11 22:13     | Week ahead — May 11–17   | 1          |
| weekly_digest    | 2026-05-11 22:01     | Week ahead — May 11–17   | 1          |
| weekly_digest    | 2026-05-11 19:42     | Week ahead — May 11–17   | 1          |
| weekly_digest    | 2026-05-11 18:52     | Week ahead — May 11–17   | 1          |
| weekly_digest    | 2026-05-11 13:47     | Week ahead — May 11–17   | 1          |
| weekly_digest    | 2026-05-11 13:43     | Week ahead — May 11–17   | 5          |
| weekly_digest    | 2026-05-11 13:02     | Week ahead — May 11–17   | 1          |
| weekly_digest    | 2026-05-11 13:00     | Week ahead — May 11–17   | 1          |
| weekly_digest    | 2026-05-11 12:52     | Week ahead — May 11–17   | 1          |

**Pattern:** weekly_digest sends dominate. Most are
recipient_count=1 (test sends to admin@). One real send hit
5 recipients on May 11 13:43.

**Crucially: zero `tournament_prelim` sends.** Frank has
NOT used the engine for the cobalt-header tournament
briefings he showed in chat. Those were composed in some
external tool (HTML editor, email service, etc.) and sent
via a separate path — NOT through Skyfire.

This is the central gap finding. **The engine works for
the kinds it's been used for (weekly digests). The
tournament-briefing UX it would produce today is NOT what
Frank actually sends to parents.**

---

## 4. Gap analysis — engine output vs Frank's hand-composed

### 4.1 What the engine produces today (tournament_prelim)

Per `composeTournamentPrelim` in
`src/lib/engine/resolvers/tournamentPrelim.js`:

1. **header** — eyebrow="{TEAM} · TOURNAMENT WEEK",
   headline="TOURNAMENT BRIEFING", sub_context=date+venue
   summary, goldStripe=true.
2. **team_schedule_table** — day-grouped events with
   times, opponents, locations.
3. **hotel_block** (cond) — Frank's text or tournament
   hotel_block_info or hotel_url.
4. **survival_guide** (cond) — Frank's text or tournament
   survival_notes.
5. **coach_keys** (cond) — Frank's text or tournament
   coach_theme.
6. **tourney_url_link** (cond) — if tournament has
   tourney_url AND Frank labeled it.
7. **stats_narrative** (cond) — Frank's coach_note OR
   parent_shoutout (one section per).
8. **signoff** — Frank's signoff_message OR coach signature
   list.
9. **footer** — logo + org name + website + contact.

### 4.2 What Frank's hand-composed briefings have

Per the 6 production briefings (3 team + 1 VIP + 2 coach
roundup) cataloged in `docs/BRIEFING_RENDERER_REFERENCES.md`:

1. **Cobalt blue header band** — overline "{TEAM} | ZG
   RUMBLE FOR THE RING" / display "TOURNAMENT WEEKEND" or
   "ROAD TRIP TO CT" / subline "May 16-17 | <voice phrase>"
2. **Yellow RSVP banner** — "RSVP in the LeagueApps app so
   Coach <Name> can set rosters."
3. **Venue list block** — each venue as
   "{Name} | {City} | Map" (single or multi)
4. **"View Live Standings" link row** — accent color, centered
5. **Day-grouped game cards** — DAY header (optionally
   with venue suffix like "| ANSONIA"), GAME N + time +
   "VS {OPPONENT}" + court info per row, BONUS variant
   with "Does not count toward standings."
6. **Bracket section** — peach background, "BRACKET PLAY |
   IF ADVANCE" or "CHAMPIONSHIP | IF ADVANCE", SEMI + ★
   Championship rows with bracket_placeholder_label
   matchup descriptors
7. **Logistics line** — "Arrive 15 minutes before each
   tip | Jersey: black side out"
8. **Tagline footer** — per-team free-text ("27 days of
   work. Time to show it." or "Tournament 3. These boys
   are ready.")
9. **Voicey prose closer** (optional, 8U pattern) —
   paragraph(s) of coach-voice prose with humor + local
   knowledge (Casa Bianca Pizza, "fly to Florida" joke)
10. **Brand footer** — "LEGACY HOOPERS | GROW YOUR GAME ·
    LEAVE YOUR LEGACY"

### 4.3 Section-by-section gap

| Frank's section | Engine equivalent | Status |
|---|---|---|
| Cobalt header band | `header` | ⚠ Different shape — eyebrow/headline naming convention differs. Engine: "TEAM · TOURNAMENT WEEK" / "TOURNAMENT BRIEFING". Frank's: "TEAM | TOURNAMENT" / "TOURNAMENT WEEKEND". Renderer is flexible (eyebrow + headline are slot strings); resolver just needs to pass the right strings. |
| Yellow RSVP banner | (none) | ❌ MISSING. New section type. Could be `rsvp_request` (already a renderer) but probably warrants a dedicated `rsvp_callout` section. |
| Venue list block | (none) | ❌ MISSING. New section type. |
| "View Live Standings" link | (cta_buttons fits) | ⚠ Renderer exists; resolver doesn't emit it for tournament_prelim today. Easy add. |
| Day-grouped game cards | `team_schedule_table` | ⚠ EXISTS but unverified shape. Need to read `weeklySchedule.js` renderer + the team_schedule_table fixture to see if it produces "GAME N + time + VS opponent" rows or a different layout. |
| BONUS variant | (none in current schedule renderer) | ❌ MISSING. Game card needs a bonus flag + footnote. |
| Bracket section | `championshipScenarios` exists | ⚠ Renderer exists; resolver doesn't currently emit bracket placeholder rows for tournament_prelim. Database column `is_bracket_placeholder` exists; resolver needs to project these. |
| Logistics line | (none) | ❌ MISSING. New section type or `ops_notes` reuse. |
| Tagline footer | (none) | ❌ MISSING. Per-team free-text override; needs schema home (likely a `signoff_tagline` column on comms_messages or a new `tagline` body field). |
| Voicey prose closer | `signoff.prose` | ⚠ EXISTS via signoff section's `prose` field (overrides.signoff_message). Frank can write it manually. LLM-generated version absent. |
| Brand footer | `footer` | ⚠ Different content. Engine: logo + org name + website + contact. Frank's: "LEGACY HOOPERS | GROW YOUR GAME · LEAVE YOUR LEGACY". Tagline-as-footer differs from contact-as-footer. |

**Net: 5 missing section types, 5 different-shape sections,
1 fully matching (signoff prose).** This is a real renderer
gap, but it's at the section-shape level, not the
architectural level.

---

## 5. The three CC-flagged gaps — verified against code

### 5.1 LLM voicey closer

**Original framing:** the engine needs LLM-generated voicey
closer text matching Frank's voice.

**Verified reality:** the engine has a `signoff` section
with a `prose` field (`overrides.signoff_message` from
state). Frank CAN write a voicey closer manually today —
he types it in the StepBodySignoff editor. There's no
LLM in the path; Frank IS the writer.

**Implication:** LLM-generated closer is **not a missing
feature in the existing engine** — it's a NEW capability
to add ON TOP. The signoff slot exists; only the
generation path is new.

**Architectural decision:** layer LLM on top of the
existing signoff slot, OR replace the manual textarea with
LLM + override? Recommend: **keep manual textarea,
add LLM-suggest button** that pre-fills the textarea.
Frank reviews + edits + sends. Same workflow as today,
just with a starting draft from the LLM.

### 5.2 Per-venue notes (Casa Bianca Pizza)

**Original framing:** new `venue_notes` table or per-team
local-notes textarea.

**Verified reality:** no schema home for venue notes today.
`locations` table has `parking_notes`, `notes`,
`entry_instructions`, `admin_notes` columns (per the
schema dump from earlier work). Could repurpose `notes`
column OR add a structured `venue_notes` table for
note_type discrimination (restaurant, parking, bathroom).

**Implication:** Frank's recommendation (per-venue, not
per-team) maps cleanly to the existing `locations` table.
Could ship as `locations.notes` extension OR new table.
The renderer needs a path to fetch notes by location_id
and weave them into the briefing (probably via the
`stats_narrative` or `ops_notes` section, OR a new
`venue_notes` section).

**Architectural decision:** start with `locations.notes`
(already exists, free) + a renderer that reads it for
relevant venues. New table only if note_type
discrimination becomes load-bearing.

### 5.3 Multi-team coach roundup + multi-kid family guide

**Original framing:** new briefing kinds for
coach-scoped (Coach Kenny / Coach Darien) and
family-scoped (Dodaro family) audience patterns.

**Verified reality:** these audience patterns DON'T exist
in current kinds. Closest is `multi_team_notice` in the
kind_check allowlist — but no resolver, no compose function,
no body component, no template for it.

**Implication:** these are **net-new kinds**, not
extensions. Each needs:
- Resolver (DB walk pattern: per-coach-of-multiple-teams or
  per-family-with-multiple-kids)
- Compose function (audience filter by coach OR by family)
- Body component (UI for picking audience + tweaking
  content)
- Section types for new visual elements (kid color pills,
  team color pills, conflict callouts, color-striped game
  rows)
- RESOLVER_REGISTRY entry

**Architectural decision:** these are PR 3+ work, NOT
PR 1 or PR 2. Defer until tournament_prelim renderer
matches Frank's hand-composed pattern.

---

## 6. The four wave-design questions — answered against reality

### Q1: Layer order — engine-first vs paste-first

**Decided:** engine-first based on Test A + Test B passing.

**Reality check after audit:** engine is built; PR 1 is
ALIGNMENT to Frank's hand-composed pattern, not "build engine."
Layer-order question becomes:
- "Align tournament_prelim resolver/compose to produce
  Frank's pattern" (~PR 1)
- "Build parser" (~PR 2)
- "Connect them" (~PR 3)

OR:
- "Build parser first to populate events (already done for
  ZG Rumble; not yet for future weekends)" (~PR 1)
- "Align tournament_prelim renderer" (~PR 2)
- "Connect" (~PR 3)

The audit doesn't change the layer order — engine alignment
work CAN proceed independently of parser. But the audit
clarifies that PR 1 is **renderer alignment + new section
types**, not "build the renderer engine."

### Q2: Parser — pure LLM vs hybrid validation

**Decided:** hybrid (LLM + 8 validation rules).

**Reality check:** stands. Parser is greenfield (no parser
code exists in repo). All 8 validation rules apply as
designed.

### Q3: Coverage delegation — schema A (column) vs B (table)

**Decided:** defer until CC reads existing team_staff /
coach modeling.

**Reality check from audit:** I haven't deeply read
`team_staff` schema yet. Quick read: `team_staff` table
exists (per CLAUDE.md §5 schema list, migration 002
programs_teams.sql) and joins teams to coaches with
role/user_id/team_id. This is the long-running coach-team
assignment pattern (per anti-pattern surfaced in
Coach Roundup analysis).

For PER-EVENT coach assignment (delegation), no schema
exists. Per Frank's earlier analysis of multi-coach scenarios
(head + assistant present at tournament games):
**Option B (separate `event_coach_assignments` table)** is
correct. Models the actual domain (many-to-many event→coach
with assigned/attended/absent status). Option A locks in a
constraint that production scenarios will violate.

### Q4: Voice library — Option A (recent-as-examples) vs B (curated)

**Decided:** Option A for v1, Option B as future enhancement.

**Reality check:** stands. Existing engine has zero voice
library; either approach is greenfield. Option A (RAG-lite —
fetch 2-3 recent briefings for the team, include as in-context
examples) is the right starting point.

---

## 7. Three additional gaps surfaced by the audit

### 7.1 Schema doesn't currently store per-briefing tagline override

The "27 days of work. Time to show it." tagline lives in
Frank's hand-composed briefings as a footer. There's no
field on `comms_messages` (or a body field) for it today.
Options:
- Add `tagline` column to `comms_messages`
- Add `tagline` body field to TournamentPrelimBody
- Reuse `signoff_message` for both prose closer + tagline
  (probably wrong — they're different visual sections)

Recommend: add `tagline` body field to TournamentPrelimBody
+ resolver passes it to the footer renderer.

### 7.2 BONUS game variant has database support but no renderer

`events.is_bonus_game` exists (set on the 11U Girls Sunday
10am game I materialized this morning). The
`tournament_prelim` resolver currently doesn't project this
into the schedule section. The schedule renderer doesn't
have a BONUS visual variant.

Easy gap to close: resolver passes `is_bonus_game` per
schedule row; renderer adds the BONUS overline + "Does not
count toward standings." footnote when present.

### 7.3 Bracket placeholder rows have database support but no renderer surface

`events.is_bracket_placeholder` + `bracket_placeholder_label`
exist (set on the 4 bracket events I materialized this
morning). The `tournament_prelim` resolver currently treats
events with no opponent as "Bracket TBD" inline (per
`buildTeamScheduleSection`'s `isBracket` check), but doesn't
emit a separate bracket section.

Frank's hand-composed briefings have a distinct yellow
"BRACKET PLAY | IF ADVANCE" section with SEMI + ★
Championship rows. The `championshipScenarios` renderer
exists but isn't wired into tournament_prelim.

Gap: resolver needs to split events into pool vs bracket
groups and emit two separate sections. Renderer has the
parts.

---

## 8. Revised wave sequence

Original wave plan (3 PRs):
- PR 1: build the renderer engine
- PR 2: build the parser
- PR 3: connect them

Revised wave sequence (audit-informed, ~5-7 PRs):

### PR 1 — `tournament_prelim` renderer alignment
- Match the cobalt-header / yellow-RSVP-banner / venue-list /
  day-grouped-game-cards / IF-ADVANCE / logistics / tagline /
  brand-footer pattern from Frank's hand-composed briefings
- Add 5 new section types: rsvp_callout, venue_list,
  logistics_line, tagline_footer, brand_footer (or extend
  existing footer); BONUS variant on game card; bracket
  section split
- Update `composeTournamentPrelim` to project these
- Add `tagline` body field to TournamentPrelimBody
- Wire `is_bonus_game` + `is_bracket_placeholder` into
  schedule rendering

### PR 2 — Parser (the spike validated this)
- Single-paste flow at `/admin/import-schedule`
- LLM extraction with 8 validation rules
- Per-row inline edit
- Reuses DO $$ pattern from ZG Rumble materialization

### PR 3 — Per-venue notes + LLM-suggested closer
- Add `locations.notes` as the venue-notes home (or new
  table if note_type discrimination needed)
- Renderer reads venue notes for events at that venue
- LLM-suggest button on signoff_message textarea
  (recent-briefings-as-examples for voice grounding)
- Time-gap helper utility for prompt context

### PR 4 — Coach Roundup kind
- New `coach_roundup` kind in RESOLVER_REGISTRY
- Resolver: walks coach's teams' events for date range
- Compose: multi-team header + per-team-color game rows +
  conflict callout
- Body component for coach picker + date range
- New section types: coach_header, team_color_pill,
  conflict_callout, color_striped_row

### PR 5 — Family Guide kind (VIP Parent Guide)
- New kind for multi-kid family briefings
- Resolver: walks parent's kids' events across teams/orgs
- Compose: VIP header + per-kid-color game rows
- New section types: vip_header, kid_color_pill,
  quick_link_nav

### PR 6 — Coverage delegation schema + UI
- New `event_coach_assignments` table (Option B)
- Conflict detection at parse time + delegation prompt in
  import preview
- UI to view/edit per-event assignments

### PR 7 — Cutover gate infrastructure
- `briefing_feedback` table
- Survey link injection into briefing emails
- 1-5 rating signed-token endpoint
- Aggregation query for ≥4.0 average

Out of scope for v1 cutover (post-cutover wave):
- Briefing send-failure UI (queue is durable; manual
  recovery acceptable until automation added)
- Send scheduling UX (cron infrastructure exists; UI
  nice-to-have)
- Parent unsubscribe enhancements (`unsubscribe-handler`
  already shipped)
- Reconcile-on-repaste (defer)
- Score recording for recaps (separate feature)

---

## 9. Specific questions for Frank to resolve

### 9.1 PR 1 scope — narrow alignment OR broader ambition?

Two flavors of PR 1:
- **Narrow**: align tournament_prelim renderer to match
  Frank's hand-composed pattern exactly. Section-by-section
  gap closure (8-10 sections affected). Ship for parallel-
  send testing this weekend.
- **Broader**: PR 1 ALSO drops the per-venue notes path AND
  the LLM-suggest closer. Three-week-stretch scope.

Recommend: **narrow**. Ship the renderer alignment first;
LLM + venue notes follow in PR 3. Lower blast radius;
parallel-send testing has clean signal (renderer is
correct, not "renderer + LLM").

### 9.2 The "different shape" sections — keep engine pattern OR adopt Frank's?

The engine produces "{TEAM} · TOURNAMENT WEEK" / "TOURNAMENT
BRIEFING" / Coach signoff list + brand footer.
Frank's produces "{TEAM} | ZG RUMBLE FOR THE RING" /
"TOURNAMENT WEEKEND" / per-team tagline + minimal footer.

Engine pattern vs Frank's pattern is mostly cosmetic, but
Frank's is what parents have been receiving. Recommend:
**adopt Frank's pattern** — the audit goal is alignment,
not "make Frank conform to the engine." Renderer slots are
flexible; resolver string formatting is the only change.

### 9.3 Coach roundup + family guide — separate kinds OR audience-filter on tournament_prelim?

Architectural decision. Options:
- **Separate kinds** (`coach_roundup`, `family_guide`):
  net-new resolver + compose + body. Clean kind boundary.
- **Audience filter on existing kind**: tournament_prelim
  with audience_type=coach or audience_type=family.
  Resolver detects + emits different section types.

Recommend: **separate kinds**. The visual + content
differences are large (multi-team + conflict detection +
color-striped rows for coach; multi-kid + parent name +
kid pills for family) — pretending they're audience
variants of one kind would bloat the resolver. Separate
kinds is cleaner.

### 9.4 LLM-suggest UX — pre-fill textarea OR side-by-side draft pane?

Two interaction patterns for LLM-generated voicey closer:
- **Pre-fill textarea**: Frank clicks "Suggest closer",
  textarea fills with LLM output, Frank edits OR replaces.
- **Side-by-side**: separate pane shows LLM draft, Frank
  copies what he likes into the manual textarea.

Recommend: **pre-fill**. Lower friction; Frank can ignore
the suggestion entirely by clearing the textarea. Side-by-
side adds visual complexity for unclear gain.

### 9.5 Tagline storage — body field OR comms_messages column?

The tagline ("27 days of work. Time to show it.") is per-
briefing free-text. Storage options:
- **Body field on TournamentPrelimBody**: lives in
  `state.body.tagline`, persisted to `content_sections.body`.
  Simpler; matches existing pattern.
- **Column on `comms_messages`**: structured field, could
  enable cross-briefing analytics.

Recommend: **body field**. Matches existing override
pattern. Promotion to column only if analytics needs it.

---

## 10. Time + budget audit

**Audit time spent:** ~45 min (well under the 2-3 hour
budget).

**Remaining session capacity:** 1.5-2.5 hours. Could:
- Ship the audit doc as PR (this work) — ~10 min
- Start PR 1 (renderer alignment) scope read with Frank
  approval — 1.5+ hours

OR park here, ship audit, resume next session for PR 1
scope review per Frank's directive ("After CC's audit
lands, I'll read it carefully and we'll route the next
session's PR 1 scope from there").

Recommend: **ship audit, stop**. Frank reviews + routes
next session. Same discipline that produced the C3 + Group
A reversals (read first, decide second, ship third) — the
audit IS the read step; PR 1 scope is the decide step;
implementation is the ship step. Don't compress.

---

## 11. Closing observation

The session lesson from the react-hooks triage applies
here too: documents are starting hypotheses, not final
scopes. The wave plan was a starting hypothesis; the audit
is the corrective ground truth.

Two specific reversals from the wave plan:
- **PR 1 is alignment, not "build the engine."** The engine
  is built. The gap is shape-matching to Frank's hand-
  composed pattern.
- **The LLM voicey closer is an additive feature on the
  existing signoff slot, not a replacement for a non-existent
  pipeline.** The signoff prose path exists today; LLM is
  a convenience layer.

Both are good news. The wave is smaller than originally
scoped on the renderer side, and the existing infrastructure
(comms_messages queue, Resend integration, scheduled sends,
inbox UI, autosave, RSVP tokens, unsubscribe handler) is
reusable for the cutover.

Net: cutover wave is real work but smaller than the original
plan suggested. PR 1 (narrow renderer alignment) is
shippable in 1 PR session. The full cutover wave (PR 1-7)
is realistic in 4-6 sessions.
