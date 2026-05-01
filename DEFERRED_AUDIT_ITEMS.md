# DEFERRED_AUDIT_ITEMS.md

Tracker for audit findings that have been logged but not yet shipped. Replaces the build-queue-scroll pattern where items surfaced in multiple audits and never landed.

**Severity scale:**
- **P0:** Privacy / safety / data integrity violation. Ship immediately when surfaced.
- **P1:** Real bug or compliance gap with user-visible impact. Slot into next available wave.
- **P2:** Anti-pattern, drift, or polish with measurable UX cost. Cluster into cleanup commits.
- **P3:** Cosmetic, low-leverage, or research-only. Defer until adjacent work touches the surface.

**Audit codes:**
- **3D-G.1** = April 30 fresh-eyes audit on Wave 3d-g
- **IA-V1** = April 30 adversarial pass on Wave 2 IA Map v1
- **PARENT** = April 30 parent profile audit (3 sequential adversarial passes; pass-distinction carried by ID prefix — B# = Pass 1, C# = Pass 2 compliance, B'/E' = Pass 2, B″/E″ = Pass 3)
- **PRIOR** = surfaced in earlier session, still standing

---

## P0 — Privacy / compliance violations

| ID | Origin | Audit | Wave slot | Description |
|---|---|---|---|---|
| E3 | 2026-04-30 | PARENT | Wave 2.5 | Notification preferences UI missing. `guardian_notification_prefs` schema exists with 4 toggles defaulting ON; parents have no opt-out path. Violates CLAUDE.md §16.5 + §16.7. Real wave-shape: settings UI + mutation hook + save flow + kindness microcopy. **Pragmatism note:** P0 per severity scale means "ship immediately"; Wave 2.5 slot is a momentum compromise to avoid disrupting Wave 2 architecture. Re-evaluate if Wave 2 schedule slips past 2 weeks. |
| C1 | 2026-04-30 | PARENT | Future wave (own scope) | i18n strings hardcoded across all parent surfaces — §16.6 at 0% compliance. Spot-check: "Teams", "Schedule", "View full season records", "Nothing in the next 48 hours", "Couldn't clear RSVP", "No messages yet", "Player of the Game:" all inline literals in JSX. Spanish translation impossible without extraction pass. Single biggest structural compliance violation in the parent profile. Framework decision needed early (e.g., useTranslation hook + en.json/es.json) so future commits add to bundle naturally. |
| C2 | 2026-04-30 | PARENT | Tier 2 cluster | ChildRsvp not optimistic — §16.1 violation. `save()` does `setSaving(true)` → `await supabase.upsert` → state-flip on confirm. Per §16.1 ("per-row writes ship optimistic"). Single component, real UX uplift on flaky 4G. Couples with C8 audit of other write paths. |
| C3 | (alias of E3) | PARENT | (see E3) | Notification preferences UI missing — paper-trail alias for E3. Reserved here so audit-code sequence stays continuous. Do not duplicate description. |
| C4 | 2026-04-30 | PARENT | Future wave (own scope) | First-time tour not built — §16.11 violation ("First-time tour: 3 dismissible tooltips on first home visit"). New parents arrive at feature-rich home with zero orientation. Couples with B4″ empty-tank states. |
| C5 | 2026-04-30 | PARENT | Tier 2 cluster (string pass) | Voice library not applied to in-app microcopy — §16.3 partial violation. Master index Section 0C voice library locked for emails; in-app strings are generic ("Loading...", "No messages yet"). Apply Frank-voice to ~20 highest-traffic strings as a single string-pass commit. |
| C6 | 2026-04-30 | PARENT | Audit + fix wave | Accessibility never verified per §16.4. Some `aria-*` present (ChildRsvp post-3d-g.2); never holistically audited. §16.4 requires "VoiceOver test before any persona's home page passes 95%." Hasn't happened. Audit pass reveals gaps; fix is per-component. |
| C7 | 2026-04-30 | PARENT | Wave 4+ (deferred build) | Photo wall / streaks not built — §16.7 vision exists, surface doesn't. Youth basketball is photo-driven; parent profile has zero photo content today. Per CLAUDE.md: admin pre-approves first 30 days per user, then trusted-contributor auto. Capture in tracker so the gap is documented; build slots into Wave 4 communications surface or later. |
| C8 | 2026-04-30 | PARENT | Tier 2 cluster (with C2) | Optimistic UI inconsistency across other write paths beyond ChildRsvp. Audit `useRsvps`, `useEventDetail` edits, AccountPage future writes, RSVP comment save for same §16.1 pattern. Cluster with C2 fix as a single "optimistic-write hardening" commit. |

---

## P1 — Real bugs and compliance gaps

| ID | Origin | Audit | Wave slot | Description |
|---|---|---|---|---|
| B1 | 2026-04-30 | PARENT | Tier 5 contingent | MessagesPage is a 10-line stub on bottom nav. Frank conceded: keep slot for Phase 4-A messaging (don't swap), ship branded "Coming late summer 2026" placeholder via E14. |
| B3 | 2026-04-30 | PARENT | Tier 1 research → Tier 5 | No /account link in BottomNav. No top-nav avatar confirmed. AccountPage well-built; problem is discoverability. Must read AppShell.jsx first — if it has a top-right avatar already, this is a non-issue. |
| B4 | 2026-04-30 | PARENT | Tier 3 cluster | EventDetailPage uses native `window.confirm()` at lines 68, 80, 87, 92, 112. Recurring-series delete chains 2-3 native confirms. Violates CLAUDE.md §11.15 (Simple dialogs → BottomSheet). Replace with branded BottomSheet pattern. |
| B6 | 2026-04-30 | PARENT | Tier 2 cluster | SchedulePage uses inline `<div>Loading...</div>` (line 67). Same anti-pattern fixed on parent home in 3d-e/g.1 (SectionShell skeleton). Visible regression on slow loads. |
| B8 | 2026-04-30 | PARENT | Tier 2 cluster | LoginPage REDIRECT_ALLOWLIST omits /records and /account. Parent deep-linked to either while unauthed gets bounced to /login → home, not back to deep link. One-line fix at LoginPage.jsx line 12. |
| B12 | 2026-04-29 | PRIOR | 3d-g.3 (deferred) | ParentHomePage filter-aware empty state. Empty NEXT 48 HOURS shows "Your next event is X" computed from unfiltered activities — when parent filters to a kid with no events, message refers to a different kid's event. |
| B13 | 2026-04-30 | 3D-G.1 + PARENT | Tier 4 lift | NEXT 48 HOURS and MY TEAMS not SectionShell-wrapped. No error rendering, no pulsing-dot affordance during refetch. Logged for 3d-g.2; still standing. |
| B14 | 2026-04-29 | PRIOR (surfaced 3x) | Tier 2 cluster (promoted) | useOrgTeamRecords missing useRefetchOnVisible wiring. Parent's open /records and MY TEAMS strip stay stale on tab return. Unblocked by 3d-g.1's refetch export. **Surfaced in 3 separate audits — the trigger for creating this tracker.** Promoted from Tier 4 to Tier 2 cluster: one-line wiring add, structurally inconsistent to leave the tracker's trigger item buried. |
| B16 | 2026-04-30 | PARENT | Tier 1 research | LocationsPage state unknown. Sits on parent BottomNav as a primary tab. Could be stub like Messages, could be solid. Must read before any BottomNav restructure decision. |
| B17 | 2026-04-30 | PARENT | Tier 1 research | ForgotPasswordPage (62 lines) state unknown. Sits on parent auth path. |
| B5' | 2026-04-30 | PARENT | Tier 1 research → fix | AddToCalendarButton UX unverified across iOS / Android / desktop. EventDetailPage:139 renders it; iCal export via icalHelpers.js. Behavior on iOS Safari likely = download .ics file (user opens in Calendar). Android Chrome differs. Desktop differs. Parents tapping "Add to Calendar" expecting Google quick-add may get a download. Most-likely-complained-about in the parent profile; never audited. |
| B6' | 2026-04-30 | PARENT | Tier 1 research → fix | TournamentBriefingBanner content + render conditions unknown. EventDetailPage:105 renders unconditionally based on event + team + role. Per master index Decision 57, M2-1 spec was tournament briefing generator that did NOT ship. Banner may be placeholder, partial, or functional. Parents see SOMETHING on every tournament event detail — what is unverified. If placeholder, parents perceive broken state. |
| B7' | 2026-04-30 | PARENT | Small commit | /records Open Graph metadata missing. When parent shares /records URL with grandparents (the explicit "viral moment" surface), link preview renders default Vite favicon + generic title. Should be `<meta og:title>` "Legacy Hoopers Spring 2026 Records" + `<meta og:image>` (records hero or team color block). Without it, the share-out lands flat. |
| B9' | 2026-04-30 | PARENT | Tier 4 lift (couples with B13) | Loading-state stagger jitter on parent home. ParentHomePage mounts useActivities + useOrgTeamRecords concurrently; sections fade in at different times causing visible reflow. Skeleton shells per section would smooth it; only NEXT UP has one (via SectionShell after 3d-e/g.1). Resolves when B13 lands (NEXT 48 HOURS + MY TEAMS into SectionShell). |
| B10' | 2026-04-30 | PARENT | Polish wave | Form dirty-check missing on EventRsvpTab + likely other input surfaces. Parent typing RSVP comment, navigates away mid-typing, loses text. No "you have unsaved changes" guard. Per §16.3 kindness mandate (respect the user). |
| B2″ | 2026-04-30 | PARENT | Tier 7 (verify first) | Sticky-hover on touch — CSS hover styles likely fire on tap and stay sticky until next tap clears them. Need `@media (hover: hover)` gating on every `:hover` style. iOS Safari is worst offender. Untested today; verify scope before slotting. |
| B3″ | 2026-04-30 | PARENT | Wave 2.5 (with E3) | Session timeout silent failure. Supabase JWT default ~1 hour. After expiry, next write silently 401s; parent sees generic toast. No proactive refresh, no token rotation, no kindness microcopy. Slot with notification preferences (E3) since both are auth-context features. |
| B4″ | 2026-04-30 | PARENT | Wave 2.5 (with C4) | Empty-tank first-touch states unhandled. New parent with 0 kids linked sees three empty home sections (MY TEAMS, NEXT UP, NEXT 48 HOURS) — reads like a broken app, not a setup-in-progress state. No "we're setting up your account" message, no "contact your coach" CTA. Couples with C4 (first-time tour). |
| B11 | 2026-04-30 | PARENT | Tier 7 (defer) | EventDetailPage dutyCount fetched once on mount, never refetched (lines 42-46). Stale until full page refresh if coach adds duty mid-view. Narrow edge case. |
| B19 | 2026-04-30 | PARENT | Tier 1 research | TournamentsPage state unknown. Parents reach via tournaments nav route. Read before any priority decisions. |
| B20 | 2026-04-30 | PARENT | Tier 1 research | TournamentDetailPage state unknown. Reached from records timeline + event detail. |
| B21 | 2026-04-30 | PARENT | Tier 1 research | EventCommentsTab unread. Sub-component of EventDetailPage. Parent surface for per-event comments. |
| B22 | 2026-04-30 | PARENT | Tier 1 research | EventRidesTab unread. Parents claim ride seats / offer rides — load-bearing for Phase 2-D2 ride coordination already shipped. |
| B23 | 2026-04-30 | PARENT | Tier 1 research | EventDutiesTab unread. Parents sign up for game-day duties. |
| B24 | 2026-04-30 | PARENT | Tier 1 research | EventRsvpTab unread (sub-component, distinct from ChildRsvp). |
| B25 | 2026-04-30 | PARENT | Tier 1 research | notificationBadgeQueries.js + badge-count surface unread. Likely surfaces on BottomNav (Messages tab?) but unverified. |
| B26 | 2026-04-30 | PARENT | Tier 1 research | /teams/:teamId/tournaments route content unread (per App.jsx:60). |

---

## P2 — Anti-patterns and drift

| ID | Origin | Audit | Wave slot | Description |
|---|---|---|---|---|
| B5 | 2026-04-30 | PARENT | Tier 7 (defer) | EventDetailPage at 150-line cap. Same brittleness pattern as ParentHomePage pre-3d-g.1. Extract pass when next addition needs it. |
| B7 | 2026-04-30 | PARENT | Tier 7 (defer) | SchedulePage 4 useMemos with `tick` in deps source the 7 pre-existing lint warnings. Tick is doing real work; lint sees as unused. Rename to `_tick` or extract `useNow()` hook. |
| B9 | 2026-04-30 | PARENT | Tier 7 (defer) | AccountPage Sign Out has no confirmation. Low risk (worst case = re-login) but most apps confirm. BottomSheet "Sign out?" pattern. |
| B10 | 2026-04-30 | PARENT | Tier 2 cluster | AccountPage lastName fetch is synchronous setState in effect (lines 22-26). Same react-hooks anti-pattern fixed in useTeamRecords (3d-e). Microtask-wrap one-line fix. |
| B15 | 2026-04-30 | PARENT | Tier 2 cluster | EventDetailPage re-implements isStaff inline (line 61) instead of importing from permissions.js. SchedulePage uses helper correctly. Drift. One-line fix. |
| B18 | 2026-04-30 | PARENT | Tier 7 (defer) | WelcomeOverlay and InstallPrompt are no-op stubs (return null) but HomePage still wraps every render in withChrome. Wasted React tree slots. Anti-drift kept these in place; can be removed cleanly. |
| B2' | 2026-04-30 | PARENT | Polish wave (paired with B8″) | Per-kid visual distinction weak for multi-kid parents. ChildFilterChips lets parents filter to one kid; absent filter, every list (NEXT 48 HOURS, MY TEAMS, /schedule, events, RSVPs) doesn't visually separate kids. Team color stripe fails when two kids on same team. No "this row is about Aiden" signal. Solution = per-kid initial badge on every row. Couples with B8″ (color-blindness signal). |
| B3' | 2026-04-30 | PARENT | Tier 7 (defer) | Module-level cache hygiene. useActivities cache + ChildRsvp responseCache + others never explicitly cleared on sign-out. Memory leak over long-lived tab session. Not a security bug (data correctly invalidates by key); cleanup item. |
| B8″ | 2026-04-30 | PARENT | Polish wave (paired with B2') | Color blindness — team_color alone insufficient differentiator. ~8% of male parents red-green color-blind. 9U Boys (red) and 8U Boys (orange) nearly identical to deuteranope. Need secondary signal (initial badge, pattern). Solution overlaps with B2'. |
| B9″ | 2026-04-30 | PARENT | Phase 5 (per §16.4 explicit deferral) | iOS Dynamic Type / accessibility scaling. Most CSS uses px not rem. Parents who increased font size in iOS Settings see no change. §16.4 marks Dynamic Type as "Phase 5 native" — technically deferred; flag as gap so it's not forgotten when Phase 5 lands. |
| B10″ | 2026-04-30 | PARENT | Tier 7 (defer) | useNow() device-clock dependency. No SNTP/server-time anchor. Parent with phone clock 5 min off sees countdowns wrong. Edge case; defer until a real complaint surfaces. |
| B27 | 2026-04-30 | PARENT | Polish wave | Conflict-warning has no action affordance. ThisWeekRow renders "⚠ Conflicts with X at Y" inline; parent reads and... does what? Tap should drill into conflict-resolution view (which kid where, whose ride is whose, priority). Information without action. |
| B28 | 2026-04-30 | PARENT | Tier 2 cluster | Empty-state component fragmentation: TextEmptyState vs EmptyState vs inline divs across surfaces. Brand voice fragmented. Pick one canonical empty-state component, migrate stragglers. |

---

## P3 — Enhancements (low-leverage or research)

| ID | Origin | Audit | Wave slot | Description |
|---|---|---|---|---|
| E2 | 2026-04-30 | PARENT | Tier 1 contingent | Account avatar in top nav. Top-right initials → /account. Only ship if Tier 1 research confirms AppShell doesn't already do it. |
| E6 | 2026-04-30 | PARENT | Tier 7 (defer) | AccountPage MY CHILDREN cards add jersey numbers + roster_type. "#12 Aiden Rodriguez · Roster · 10U Black" instead of current shape. |
| E7 | 2026-04-30 | PARENT | Tier 7 (defer) | Pull-to-refresh on SchedulePage. TeamsPage has it; SchedulePage doesn't. Match pattern. |
| E9 | 2026-04-29 | PRIOR | Tier 2 cluster | AccountPage version label hand-maintained ('Ember v2.0'). Pull from package.json. Trivial. |
| E11 | 2026-04-30 | PARENT | Future wave | SchedulePage calendar-grid view mode. Currently linear date-grouped list. Toggle to calendar grid for upcoming-tournament-month-at-a-glance. Medium-high effort. |
| E12 | 2026-04-30 | PARENT | Future wave | Page-anchor TOC on EventDetailPage. 6+ sections (Detail, Location, RSVPs, Volunteers, Rides, Notes, Comments). Sticky anchor strip for mobile. |
| E13 | 2026-04-30 | PARENT | Future wave | LoginPage Google SSO. Email + password only today. Most parents have Google. Reduces friction for pilot's family invite flow. |
| E14 | 2026-04-30 | PARENT | Tier 5 (immediate) | MessagesPage branded "Coming late summer 2026" placeholder. Replaces "No messages yet" empty state. Frank-confirmed direction (preserves nav shape). |
| E15 | 2026-04-30 | PARENT | Tier 1 research | TournamentDetailPage audit. Reached from records timeline + event detail. State unknown. |
| B6″ | 2026-04-30 | PARENT | Phase 1 Step 5G (Realtime) | Trust signals weak after parent action. RSVP saves → component flips state. No "Coach Kenny will see this" or "now visible on team roster" confirmation. Per §16.9 vision: "Sara K just RSVP'd ✓" toasts. Lands naturally with Migration 039 Realtime publication. |
| B7″ | 2026-04-30 | PARENT | Future wave (delight) | "Leave by" predictive surface. Data exists (event start, location coords, optional parent address, travel-time estimate). Apple Calendar surfaces "Leave in 15 minutes." NEXT UP card adds "LEAVE BY 8:42 AM" line when event < 4hr away. Real differentiator vs LeagueApps/TeamSnap. |
| E3″ | 2026-04-30 | PARENT | Future wave (delight) | Day-of-game home page mode. When `now < anyEvent.start_at < now+6h`, parent home re-orders: top becomes "Today's game card" (jersey color, arrival time, location, weather, parking). NEXT 48 HOURS demoted. After game ends, normal layout returns. Context-aware density per §16.13 spirit. |
| E6″ | 2026-04-30 | PARENT | Polish wave | Print stylesheet for /records. Parents print for grandparents / refrigerator-pinning. CSS `@media print` stripping chrome and laying out clean — low-effort delight. |
| E7″ | 2026-04-30 | PARENT | Future wave | Dark mode. CSS uses light-mode tokens only. Parents using app at night get blasted with white. Real lift (token system + per-component verification). |

---

## Conceded — not shipping

Items explicitly conceded by Frank during audit triage. Captured for paper-trail completeness; no current plan to ship.

| ID | Origin | Audit | Reason |
|---|---|---|---|
| E1 | 2026-04-30 | PARENT | Promote /records to BottomNav. Conceded: bottom nav has 5 finite slots, Phase 4-A messaging gets one, demoting now creates churn. /records discoverability solved another way (top nav, account dropdown, home page card stays). |
| E5 | 2026-04-30 | PARENT | Hide Messages from BottomNav. Same reason as E1 — superseded by E14 placeholder approach. |

---

## Aliases — do not double-list

Pass-3 IDs that alias items already captured under canonical IDs above:

| Pass-3 ID | Canonical ID | Item |
|---|---|---|
| C3 | E3 | Notification preferences UI missing |
| E1″ | C5 | Apply voice library to in-app strings |
| E2″ | B8″ | Color-blindness team identification |
| E4″ | B7″ | "Leave by" predictive surface |
| E5″ | B4″ | Empty-tank welcome state |
| B5″ | E3″ | Day-of-game home page mode |

---

## Stats

- **65 items total** across all severity tiers
- **8 P0** compliance violations (1 from Pass 1, 7 from Pass 2/3 — C1-C8 with C3 = E3 alias)
- **25 P1** real bugs (10 verified bugs + 8 unaudited surfaces from Pass 1, plus 7 verified bugs + 8 unaudited surfaces from Pass 2/3)
- **15 P2** anti-pattern / drift items
- **17 P3** enhancements
- **2 conceded** (E1, E5 — not shipping)

The shape is heavier on the front-end (P0/P1) than the original draft suggested — the second + third audit passes specifically existed to surface compliance violations and unaudited surfaces, both of which sit in the high-severity tiers.

---

## Process notes

- **Tracker created 2026-04-30** in response to B14 surfacing in 3 separate audits with no canonical home outside scroll-back commit log. The trigger item is intentionally promoted to Tier 2 cluster (not buried in Tier 4) so the tracker's first commit also closes the trigger.
- **Update protocol:** every audit pass appends new findings here, then the audit response references item IDs rather than re-listing full descriptions.
- **Closing items:** when an item ships, mark it ✅ with the SHA + commit date in a "Closed" section at bottom of file. Don't delete — historical record matters.
- **Multi-pass audits:** when a comprehensive audit runs multiple adversarial passes (parent profile audit ran 3), pass-distinction is carried by ID prefix (B# Pass 1, C# Pass 2 compliance, B'/E' Pass 2, B″/E″ Pass 3) — not by audit-code suffix. The audit code stays singular (PARENT, not PARENT-1/2/3).
- **Wave-slot conventions:**
  - "Tier N cluster" = parent profile audit triage groupings
  - "Wave 2.5" = real feature work between Wave 2 sub-waves
  - "Tier 1 research" = unblock conditional decisions (read N files)
  - "Future wave" = real work but no current slot
  - "Tier 7 (defer)" = real but low-leverage; defer until adjacent work touches the surface
  - Section labels (Polish wave, Audit + fix wave, etc.) = ad-hoc cluster names; group at slotting time

## Related docs

- `EMBER_MASTER_INDEX_v3.md` — canonical decisions
- `WAVE_2_IA_MAP_v1.md` — Wave 2 architecture (28 decisions)
- `SKYFIRE_BUILD_QUEUE_v2.md` — commit log (NOT a tracker; this file replaces that role for audit findings)
- `CLAUDE.md` — coding rules + anti-patterns referenced throughout

---

## Closed

(Items ship here with SHA + date when they land. Empty at file creation; populated as items close.)
