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
- **TIER1** = May 1 Tier 1 research pass on unaudited surfaces (3 originally-flagged + 8 from Pass 2/3 additions). New findings carry the `N#` prefix.
- **GATE3** = May 1 Wave 2A Gate-3 prep (post-Migration-032 verification). Surfaces protocol/discipline drift discovered while preparing the repo-file commit, after the migration itself was already applied + verified clean. Findings carry the `N#` prefix.
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
| B4 | 2026-04-30 | PARENT (scope expanded by TIER1 2026-05-01) | Tier 3 cluster | `window.confirm()` for destructive actions across **3 files**: EventDetailPage (lines 68, 80, 87, 92, 112 — 5 instances), LocationsPage (line 24 — archive), TournamentsPage (line 30 — archive). Recurring-series delete chains 2-3 native confirms. Violates CLAUDE.md §11.15 (Simple dialogs → BottomSheet). Cluster fix: replace all with branded BottomSheet pattern. |
| B6 | 2026-04-30 | PARENT (scope expanded by TIER1 2026-05-01) | Tier 2 cluster | Inline `<div>Loading...</div>` anti-pattern across **6 surfaces**: SchedulePage:67, LocationsPage:54-58, TournamentsPage:56-60, TournamentDetailPage:19-25, EventCommentsTab:20, EventDutiesTab via `<Empty text="Loading duties..." />` line 11, EventRsvpTab:9-11. Same anti-pattern fixed on parent home in 3d-e/g.1 (SectionShell skeleton). Cluster fix: canonicalize loading state across all parent-facing surfaces. |
| B8 | 2026-04-30 | PARENT | Tier 2 cluster | LoginPage REDIRECT_ALLOWLIST omits /records and /account. Parent deep-linked to either while unauthed gets bounced to /login → home, not back to deep link. One-line fix at LoginPage.jsx line 12. |
| B12 | 2026-04-29 | PRIOR | 3d-g.3 (deferred) | ParentHomePage filter-aware empty state. Empty NEXT 48 HOURS shows "Your next event is X" computed from unfiltered activities — when parent filters to a kid with no events, message refers to a different kid's event. |
| B13 | 2026-04-30 | 3D-G.1 + PARENT | Tier 4 lift | NEXT 48 HOURS and MY TEAMS not SectionShell-wrapped. No error rendering, no pulsing-dot affordance during refetch. Logged for 3d-g.2; still standing. |
| B14 | 2026-04-29 | PRIOR (surfaced 3x) | Tier 2 cluster (promoted) | useOrgTeamRecords missing useRefetchOnVisible wiring. Parent's open /records and MY TEAMS strip stay stale on tab return. Unblocked by 3d-g.1's refetch export. **Surfaced in 3 separate audits — the trigger for creating this tracker.** Promoted from Tier 4 to Tier 2 cluster: one-line wiring add, structurally inconsistent to leave the tracker's trigger item buried. |
| B17 | 2026-04-30 | PARENT (verified by TIER1 2026-05-01) | Auth-polish wave (own scope) | ForgotPasswordPage is a **branded stub** — header comment says "Stub — full flow arrives with the auth-polish prompt." User-visible message: "Password reset is coming soon. Ask an admin to send you a new invite." Self-service password reset does not exist; parents must contact admin to reset. Promote to its own auth-polish wave when scheduled. |
| B5' | 2026-04-30 | PARENT (confirmed by TIER1 2026-05-01) | Polish wave | AddToCalendarButton.jsx is 18 lines — calls `downloadIcs(event)` from icalHelpers.js. iOS Safari downloads .ics → opens Calendar. Android varies. Desktop downloads. **Confirmed: not Google Quick Add; mechanism is platform-default ics handling.** Needs branded explanation OR per-platform branching (iOS/Android-specific button copy or behavior). |
| B6' | 2026-04-30 | PARENT (re-scoped by TIER1 2026-05-01) | Tier 1 research → fix (staff-side) | TournamentBriefingBanner is **STAFF-ONLY** (line 11: `if (!event?.tournament_name || !isStaff(role) || !team) return null`). Parents never see it. Parent-side worry was wrong — they see nothing. Staff-side concern remains: opens `<TournamentBriefing>` overlay on tap; per master index Decision 57, M2-1 spec was tournament briefing generator that did NOT ship. Verify TournamentBriefing.jsx in next pass to determine if overlay is functional/placeholder/broken. |
| B7' | 2026-04-30 | PARENT | Small commit | /records Open Graph metadata missing. When parent shares /records URL with grandparents (the explicit "viral moment" surface), link preview renders default Vite favicon + generic title. Should be `<meta og:title>` "Legacy Hoopers Spring 2026 Records" + `<meta og:image>` (records hero or team color block). Without it, the share-out lands flat. |
| B9' | 2026-04-30 | PARENT | Tier 4 lift (couples with B13) | Loading-state stagger jitter on parent home. ParentHomePage mounts useActivities + useOrgTeamRecords concurrently; sections fade in at different times causing visible reflow. Skeleton shells per section would smooth it; only NEXT UP has one (via SectionShell after 3d-e/g.1). Resolves when B13 lands (NEXT 48 HOURS + MY TEAMS into SectionShell). |
| B10' | 2026-04-30 | PARENT | Polish wave | Form dirty-check missing on EventRsvpTab + likely other input surfaces. Parent typing RSVP comment, navigates away mid-typing, loses text. No "you have unsaved changes" guard. Per §16.3 kindness mandate (respect the user). |
| B2″ | 2026-04-30 | PARENT | Tier 7 (verify first) | Sticky-hover on touch — CSS hover styles likely fire on tap and stay sticky until next tap clears them. Need `@media (hover: hover)` gating on every `:hover` style. iOS Safari is worst offender. Untested today; verify scope before slotting. |
| B3″ | 2026-04-30 | PARENT | Wave 2.5 (with E3) | Session timeout silent failure. Supabase JWT default ~1 hour. After expiry, next write silently 401s; parent sees generic toast. No proactive refresh, no token rotation, no kindness microcopy. Slot with notification preferences (E3) since both are auth-context features. |
| B4″ | 2026-04-30 | PARENT | Wave 2.5 (with C4) | Empty-tank first-touch states unhandled. New parent with 0 kids linked sees three empty home sections (MY TEAMS, NEXT UP, NEXT 48 HOURS) — reads like a broken app, not a setup-in-progress state. No "we're setting up your account" message, no "contact your coach" CTA. Couples with C4 (first-time tour). |
| B11 | 2026-04-30 | PARENT | Tier 7 (defer) | EventDetailPage dutyCount fetched once on mount, never refetched (lines 42-46). Stale until full page refresh if coach adds duty mid-view. Narrow edge case. |
| N3 | 2026-05-01 | TIER1 | Tier 2 cluster (badge-disable hide-with-flag) | Notification badge wired without inbox UI. Bell icon in Header.jsx shows real badge count + severity color; tap shows "Notifications coming soon" toast (Header.jsx:25). Badge tells parent "you have 3 unanswered RSVPs" → tap leads nowhere actionable. Borderline-broken trust signal. **Mechanism: hide-with-flag** (Frank-confirmed via "yes" answer 2026-05-01) — wrap Header.jsx:89-96 in a `BADGE_VISIBLE` constant; keep badge query running for cheap re-enable when inbox lands. ~5 min. **Slip clause: if Tier 2 cluster doesn't ship by 2026-05-06, promote N3 to its own hotfix commit independent of cluster.** Trust-signal damage compounds during active Spring 2026 season. |
| B25 | 2026-04-30 | PARENT (resolved by TIER1 2026-05-01; superseded by N3) | (see N3) | Notification badge surface IS wired in `Header.jsx` (top-right bell icon, lines 83-97) with severity-colored badge (info/warning/danger). `notificationBadgeQueries.js` (77 lines) is real, sophisticated implementation. Badge correctly fires for parents (events in next 48h with no RSVP from kids) and staff (events in next 24h with <50% RSVP). **However:** bell tap shows "Notifications coming soon" toast — badge fires without an inbox UI to receive the tap. Wired-but-incomplete. See N3 below for the trust-signal action item. |

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
| B28 | 2026-04-30 | PARENT (scope expanded by TIER1 2026-05-01) | Tier 2 cluster (audit + canonicalize) | Empty-state component fragmentation confirmed across **5+ surfaces**: TextEmptyState (MessagesPage, ParentHomePage), `<EmptyState>` shared component (TeamDetailPage, TeamsPage), inline custom (LocationsPage:67-76, TournamentsPage:68-78), inline div (EventCommentsTab:22, EventRsvpTab:10-13), `<Empty>` helper local-to-file (EventDutiesTab:65-67). Three+ distinct empty-state patterns coexist; brand voice fragmented. Audit + canonicalize across all surfaces. |
| N1 | 2026-05-01 | TIER1 | Tier 2 cluster | TournamentsPage stale comments + microcopy. Header comment line 14: "No + New button yet (ships in 2A-γ with the form sheet)" — but + New IS rendered (line 49) and form sheet IS imported + used (lines 7, 107). Empty-state copy line 75: "Create form ships next." Code shipped, docs/copy never updated. Single-file fix. |
| N4 | 2026-05-01 | TIER1 | Tier 2 cluster (with C2/C8 batched-write hardening) | `notificationBadgeQueries.js` has N+1 hazards in BOTH paths. `fetchParentBadgeCount` (lines 23-35): one count query per event in next 48h. `fetchStaffBadgeCount` (lines 56-68): two count queries per event in next 24h. Same shape we killed in 3d-f for game results. Batched group-by-event_id query would collapse both. Real perf issue at scale. |

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
| N8 | 2026-05-01 | TIER1 | Tier 7 (defer) | No persistent "viewing as" banner for parent-mode admin. Header has yellow safe-area stripe at top when `isViewingAs` (Header.jsx:31-40) but no in-flow text banner ("Viewing as Frank Samaritano · Exit"). Cosmetic for parents (they don't see this); real for admins doing QA on parent surfaces who can lose track of their context. Couples with prior home-review E1 (admin view-as banner). |
| N10 | 2026-05-01 | GATE3 (Wave 1F pre-flight) | Schema cleanup wave | locations table has duplicate lat/lon fields: lat (double precision) + latitude (numeric), lon (double precision) + longitude (numeric). Schema drift artifact. Code currently uses one pair or both inconsistently. Resolution: pick the canonical pair (likely latitude/longitude as numeric with higher precision), backfill from the other pair if any rows diverge, drop the deprecated pair in a future migration. Not Wave 1F scope. Surfaced during Wave 1F pre-flight column inventory. |
| N12 | 2026-05-01 | GATE3 (Wave 1F P1-4 sub-step A finding) | Documentation / process reminder | Schema additions to tables with explicit-column-list queries (e.g. useLocations parent query) are NOT auto-protected. The Wave 1F locations.admin_notes privacy boundary worked retroactively because useLocations already used an explicit column list predating the admin_notes column. That safety is contingent on the convention being upheld in every future schema-additive migration plus every future query write/refactor. Pre-flight checklist for future migrations adding columns to existing tables: (1) grep all queries against the affected table; (2) confirm explicit column lists either include the new column OR explicitly exclude it per intent; (3) flag any .select('*') calls that pull in the new column unintentionally. Resolution: capture as standing pre-flight item; not a one-time fix. |
| N11 | 2026-05-01 | GATE3 (Wave 1F P1-1 follow-up) | Polish wave | RSVP label inconsistency: ChildRsvp.jsx shows "No" (Wave 1F P1-1 shipped 74f6a78); four other RSVP surfaces still show "Not Going": EventRsvpTab, RsvpPlayerRow, RsvpSummary, NextUpCardRsvpSection. Parents see two different labels for the same state across surfaces. Resolution: evaluate whether unification is actually better UX (compact cards want "No"; spacious roster rows may read better as "Not Going"). If unifying, propagate via str_replace across 4 files. ~4 files, ~4 edits, no logic change. Defer to next polish wave; not Phase 1 close-out blocker. |
| N9 | 2026-05-01 | GATE3 (Migration 032) | Pre-flight discipline (next migration onward) | **Three-way migration-naming drift** — disk, ledger version, ledger name. Three eras visible in production: **(era 1, pre-Apr-27)** disk `NNN_topic.sql` + ledger version `NNN` + ledger name `topic` — internally consistent (e.g., `025_rides_redesign.sql` ↔ version `025` ↔ name `rides_redesign`). **(era 2, post-Apr-27)** disk `YYYYMMDDHHMMSS_topic.sql` + ledger version timestamp + ledger name **bare topic** with NO numeric prefix (e.g., `20260427131334_rides_offer_cancel_cascade.sql` ↔ version `20260427131334` ↔ name `rides_offer_cancel_cascade`). **(transition: re-registration of pre-Apr-27 files)** disk kept old `NNN_topic.sql` filename, but new ledger row picked up timestamp version + dropped the `NNN_` from the name (e.g., `032_rides_lifecycle_and_realtime.sql` on disk ↔ ledger version `20260426160517` ↔ ledger name `rides_lifecycle_and_realtime` — **disk prefix and ledger name diverge**). **Migration 032 (Wave 2A) inherited the legacy NNN convention by accident:** pre-flight Item 0 returned next-NNN=032 by inspecting disk-filename prefixes (which still carry legacy NNNs); had it inspected ledger names instead, it would have seen post-Apr-27 migrations drop the NNN entirely. Repo + ledger inspection on 2026-05-01 also surfaced **5 paired-prefix collisions on disk** — `026/026, 027/027, 028/028, 029/029, 030/030` — plus a sixth introduced by Migration 032 (`032_rides_lifecycle_and_realtime.sql` ↔ new `20260501110331_032_game_result_edits_audit_table.sql`). **Protocol fix for next migration onward:** drop the `NNN_` middle entirely. Filenames `YYYYMMDDHHMMSS_topic.sql`; ledger names bare `topic`. The `MAX(version)` timestamp is sufficient identity; the NNN middle is post-Apr-27 cruft that introduces drift opportunities. **Not a Migration 032 blocker:** timestamp `20260501110331` is unique on disk and in ledger; `apply_migration` succeeded; verification queries clean. The bell can't be unrung for this migration (ledger name is locked at `032_game_result_edits_audit_table`); disk filename matches ledger name to avoid the disk↔ledger drift `rides_lifecycle_and_realtime` already shows. **Apply protocol fix at Wave 2's next migration** (likely Wave 2D's audit-write path or Wave 2F's backfill-related migration if any). |

---

## Conceded — not shipping

Items explicitly conceded by Frank during audit triage. Captured for paper-trail completeness; no current plan to ship.

| ID | Origin | Audit | Reason |
|---|---|---|---|
| E1 | 2026-04-30 | PARENT | Promote /records to BottomNav. Conceded: bottom nav has 5 finite slots, Phase 4-A messaging gets one, demoting now creates churn. /records discoverability solved another way (top nav, account dropdown, home page card stays). |
| E5 | 2026-04-30 | PARENT | Hide Messages from BottomNav. Same reason as E1 — superseded by E14 placeholder approach. |

---

## Process methodology — pending CLAUDE.md promotion

Methodology insights surfaced during audits today that are CLAUDE.md-rule candidates. Frank explicitly deferred the CLAUDE.md edit ("worth promoting to a rule eventually. Not tonight."). Logged here so they're not lost to scroll-back — same anti-drift purpose this tracker serves for surface-level audit findings.

| ID | Origin | Audit | Promotion target | Description |
|---|---|---|---|---|
| M1 | 2026-04-30 | 3D-G.1 + IA-V1 | CLAUDE.md §0 anti-drift rules | **Always run the adversarial audit pass on architecture docs.** Drafting in compliance mode (transcribe Frank's resolutions cleanly) is not the same as adversarial mode (find what's missing). Wave 2 IA Map v1 drafted in compliance mode missed 17 holes; the audit pass switched modes and found them. Going forward: every IA Map / architecture doc gets the adversarial pass before commit. Not optional. Same way pre-flight isn't optional before code. |
| M2 | 2026-04-30 | PARENT (Pass 3) | CLAUDE.md §0 anti-drift rules (paired with M1) | **For cross-surface audits, two adversarial passes minimum.** First pass finds the obvious; second pass, with fresh eyes after the first surfaces the categories, finds the systemic compliance gaps. Specifically applies to: parent profile, coach profile, admin profile, persona-wide compliance reviews. The Pass 3 audit on the parent profile found 25 items the first two passes missed — 8 of which were P0 compliance violations. Single-pass audits on cross-surface scope are structurally undersized. |
| M3 | 2026-05-01 | Wave 1F Session 1 | CLAUDE.md §0 anti-drift rules | **All material decisions, including deliberate non-actions, require explicit GO before being finalized.** The pattern flagged in 3e06919 (autonomous capture commit) and aad2ba8 (autonomous P0 hotfix) extends to non-commit decisions: closing a planned step with "verified working, no action needed" is a material decision that the human must approve. CC reports the verification finding, human gives explicit GO on the close-out, then it's recorded. Pattern observed: P1-3 closed as Outcome B without separate GO in Session 1 (commit 836dab5 message). Not a fix-the-repo issue; a discipline note for future waves. |

When promoted, all three rules slot into CLAUDE.md §0 alongside the existing 9 anti-drift rules. Likely as new rules #10 (M1), #11 (M2), and #12 (M3), or folded into a new "Audit and architecture-doc discipline" sub-section.

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

- **As of 2026-05-01 TIER1:** 60 active items + 10 closed items + 2 process-methodology items
  - **60 active** = 65 original + 4 new (N1, N3, N4, N8) + 1 reframed (B17 promoted to auth-polish wave) − 10 closed
  - **10 closed** = 9 from TIER1 research (B3, B16, B19, B20, B21, B22, B23, B24, B26) + 1 born-closed via Decision #105 (N2)
  - **B25 reframed** as superseded by N3; remains visible in P1 as a context entry pointing at N3
  - **B4, B6, B28** scopes expanded by TIER1 findings (B4 → 3 files, B6 → 6 surfaces, B28 → confirmed across 5+ surfaces)
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

Items resolved by code change (with SHA) or by audit pass (with audit code + date). Don't delete — historical record matters.

| ID | Original | Closed by | Resolution |
|---|---|---|---|
| B3 | 2026-04-30 PARENT | 2026-05-01 TIER1 | `Header.jsx:99-105` has Settings gear icon top-right routing to /account. Discoverability exists; gear-vs-avatar is a polish-level preference, not a missing feature. |
| B16 | 2026-04-30 PARENT | 2026-05-01 TIER1 | LocationsPage is a real 95-line page with search, filter chips, location cards, and create/edit form (staff). Inherits B4 (`window.confirm` line 24) + B6 (inline Loading line 56) anti-patterns — counted in those expanded scopes. |
| B19 | 2026-04-30 PARENT | 2026-05-01 TIER1 | TournamentsPage is a real 111-line page with status filter, list, pagination, create/edit form (staff). Inherits B4 + B6 anti-patterns. One additional finding (N1: stale comments + microcopy) tracked separately. |
| B20 | 2026-04-30 PARENT | 2026-05-01 TIER1 + Decision #105 | TournamentDetailPage is a real 86-line page with 5 tabs. Original concern was "state unknown"; TIER1 resolved by reading the page. Sub-finding "4 of 5 tabs are stubs" (originally N2) closed in same commit via master-index Decision #105 (Wave 5 — Tournament UI named) + TournamentDetailPage.jsx microcopy update from `Ships in Session 2B-β` etc. to `Ships in Wave 5 — Tournament UI`. |
| B21 | 2026-04-30 PARENT | 2026-05-01 TIER1 | EventCommentsTab is real 67-line component. Functional comment thread with pin support, send button + Enter-to-submit. No moderation tools (delete/edit) — flagged as known gap, not a bug. |
| B22 | 2026-04-30 PARENT | 2026-05-01 TIER1 | EventRidesTab is sophisticated 129-line component. Real ride coordination per Phase 2-D2 (already shipped): PostOffer, ClaimSeat, OfferCard with seats/claimers, DensityToggle wired. Respects per-event `enable_rides` flag. |
| B23 | 2026-04-30 PARENT | 2026-05-01 TIER1 | EventDutiesTab is real 74-line component. Claim/release per slot, grouped by `duty_name`. Matches CLAUDE.md schema (per-slot rows). |
| B24 | 2026-04-30 PARENT | 2026-05-01 TIER1 | EventRsvpTab is real 55-line thin wrapper around RsvpSummary + RsvpPlayerRow. Sorts by RSVP status with status headers between groups. |
| B26 | 2026-04-30 PARENT | 2026-05-01 TIER1 | `/teams/:teamId/tournaments` routes to TournamentsPage with `useParams.teamId` pre-filtering (TournamentsPage.jsx:18). No separate page; reuses tournaments list with team filter. |
| N2 | 2026-05-01 TIER1 | 2026-05-01 Decision #105 | TournamentDetailPage 4-of-5 tabs are stubs (Games, Roster, Messages, Scenarios). Resolved by naming Wave 5 — Tournament UI in master-index Decision #105 + TournamentDetailPage.jsx microcopy update so stubs read "Ships in Wave 5 — Tournament UI" instead of stale `Ships in Session 2B-β/γ/δ/2C` references that predated the Wave 2 v1.1 amendment. |
| P1-1 | 2026-05-01 Wave 1F | 74f6a78 | RSVP pill "Not Going" clipped on small phones. Shortened to "No" + added min-width: 0 flex constraint. ChildRsvp.jsx. |
| P1-2 | 2026-05-01 Wave 1F | 836dab5 | Density toggle labels spelled out: MIN/MED/MAX to Compact/Default/Detailed. DensityToggle.jsx. |
| P1-3 | 2026-05-01 Wave 1F | verified-working at 836dab5 | "View full season records" link targets /records which is a live route (App.jsx:52, RecordsPreview). Outcome B: no fix needed. |
| P1-4 | 2026-05-01 Wave 1F | [Gate 3 SHA] | Location admin_notes privacy boundary. Migration locations_admin_notes (20260501124915) adds admin_notes column. useLocations explicit column list retroactively excludes it (N12). LocationCard renders admin_notes block only when isStaff. Decision #107. |
