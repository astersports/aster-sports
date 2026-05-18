# Tier 3 v1 — Retrospective Notes

Running scratch of architectural decisions whose payoff lies beyond
v1 ship. Each entry pins a v2 trigger condition so we don't carry
the concern as ambient anxiety. Grouped by audience — Performance
items belong to whoever's optimizing the system, Process items
belong to whoever's running the next wave, UX items belong to
whoever's polishing the surface.

## Performance

### Polling cost — 60s client polling on home pages (PR 4 / PR 5)

60s client polling acceptable at Legacy scale. Migration trigger:
simultaneous-open spike load OR org with 500+ users. Migration paths
per Gap 8 (edge function with shared cache OR cron-cache table).

Reasoning + math: PR 4 review covered admin path (~25-50 queries/min
per active admin session). PR 5 review covered parent path (~60
families × 5 queries/min worst-case = ~5K queries/hour spike if all
simultaneous-open, well inside Supabase Pro tier headroom of ~10M
reads/day).

### Per-team useAttendanceData mount cost (PR 6 review)

**Context.** `CoachRosterSnapshot` mounts one `useAttendanceData`
hook per team rendered. Each mount issues its own attendance query.
Cost scales linearly with team count.

**Trigger.** Any of: coach managing 10+ teams; coach surface becomes
primary view path (e.g., admin sessions defaulting to coach view);
mobile load >3s consistently on coach home.

**Path forward.** Batched `useAttendanceData(teamIds[])` hook —
single query with grouped result keyed by team_id. Component
receives the team-keyed map and indexes by id. At Legacy scale
(Kenny coaches 1-2 teams; same for Frank, Darien) per-team mount
is cheap. The cost only matters when teams-per-coach exceeds the
~5-10 range.

## Process

### Pre-flight grep discipline compounding value

The discipline of grepping for named components, architectural
concepts, and animation tokens BEFORE locking PR briefs compounds
across PRs in a wave. Each catch encodes itself as both a
CLAUDE.md anti-pattern (codified, durable) and a session-precedent
(the next brief starts with the discipline applied).

Earned across Tier 3 v1: PR 3 (5-component spec mismatch caught
before lock), PR 5 (`familyGuideHelpers` path correction), PR 6
(twin catch — `useActiveRole` parallel-system buildup caught
before designing around it; `sf-pulse` animation reference
caught against CLAUDE.md §3's defined token list). The PR 6
twin catch was the discipline paying off twice in one brief.

The mechanism: the brief stage is where assumptions are cheapest
to invalidate. A grep that takes 30 seconds prevents a 2-hour
parallel-system rebuild or a CSS token drift that contaminates
the design system. The compounding effect is that each prevented
miss adds an anti-pattern entry (durable) AND tightens the
operator's mental model for the next brief (lived).

Wave 5+ should treat pre-flight grep as table stakes, not as a
discretionary discipline.

## UX

### Per-player yellow highlight overdue gate (PR 6 review)

**Context.** `CoachRosterSnapshotTeam` currently highlights any
player without an RSVP on the next event in yellow. When 100% of
rows are yellow (because the next event is far enough out that no
one has RSVP'd yet), the binary signal loses scan-value — the
coach can't quickly identify which players need follow-up.

**Trigger.** Any "all-yellow" coach view in real-world conditions.
Will fire as soon as a coach uses the surface when the next event
is >72h out (common when checking the roster early in the week).

**Path forward.** Gate the yellow highlight on (no RSVP) AND
(next-event-start <72h). The 72h threshold matches the standard
youth-sports expectation of "RSVP by 3 days out". Tracked as
candidate D in the post-PR-#235 candidate list — small UI tweak,
estimated ~20 min.
