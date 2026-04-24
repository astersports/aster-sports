-- ============================================================
-- 023_attendance_trending_views.sql
--
-- Migration 023: Add events.season_id + 4 attendance/RSVP trending VIEWs
--
-- DESIGN PHILOSOPHY (locked decisions):
--   Q1: Hybrid attendance - RSVP "not_going" excuses, no-shows count
--   Q2: Always show denominator (confidence indicator)
--   Q3: Trend = last 30d vs prior 30d
--   Q4: Per-event-type breakdown (practice/game/tournament/other)
--   Q5: Date-window roster correctly per event
--   Q6: Cancelled events excluded from denominator
--   Q7: Each event = 1 attendance unit (no tournament rollup yet)
--   Q9: Plain VIEWs Phase 1, materialize in Phase 2
--   Q10: Rich denormalized data, compute once
--
-- VIEWS:
--   team_attendance_30d - team check-in % rolling 30d + trend
--   team_rsvp_30d       - team RSVP rates rolling 30d + trend
--   player_attendance_season - per-player check-in % current season
--   player_rsvp_season  - per-player RSVP rates current season
--
-- All views use security_invoker=true so caller RLS cascades from
-- Migration 022 policies on roster_members, players, etc.
--
-- DEPENDENCIES:
--   - Migration 022 (RLS + roster_members.left_at)
--   - seasons table with status='active' for current season scoping
--   - check_ins table (checked_in boolean)
--   - event_rsvps table (response: going/maybe/not_going)
--
-- Safe to re-apply: idempotent.
-- ============================================================

BEGIN;

-- ============================================================
-- SECTION 1: Add events.season_id (Option B from audit)
-- ============================================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS season_id uuid REFERENCES public.seasons(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.events.season_id IS
  'Season the event belongs to. Backfilled via date overlap. Required FK as of Phase 2.';

-- Backfill: match each event to the season covering its start_at
UPDATE public.events e
SET season_id = s.id
FROM public.seasons s
JOIN public.teams t ON t.org_id = s.org_id
WHERE e.team_id = t.id
  AND e.season_id IS NULL
  AND e.start_at::date >= s.start_date
  AND (s.end_date IS NULL OR e.start_at::date <= s.end_date);

-- Index for season-scoped queries
CREATE INDEX IF NOT EXISTS idx_events_season_team
  ON public.events (season_id, team_id) WHERE season_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_team_start
  ON public.events (team_id, start_at);

-- ============================================================
-- SECTION 2: VIEW team_attendance_30d
-- Per-team attendance via check-ins, last 30 days + trend vs prior 30d
-- ============================================================

DROP VIEW IF EXISTS public.team_attendance_30d;
CREATE VIEW public.team_attendance_30d
WITH (security_invoker = true)
AS
WITH window_events AS (
  SELECT
    e.id AS event_id,
    e.team_id,
    e.event_type,
    e.start_at,
    t.org_id,
    CASE 
      WHEN e.start_at >= now() - INTERVAL '30 days' THEN 'current'
      WHEN e.start_at >= now() - INTERVAL '60 days' AND e.start_at < now() - INTERVAL '30 days' THEN 'prior'
    END AS window_period
  FROM public.events e
  JOIN public.teams t ON t.id = e.team_id
  WHERE e.start_at >= now() - INTERVAL '60 days'
    AND e.start_at <= now()
    AND e.status != 'cancelled'
),
event_attendance AS (
  SELECT
    we.team_id,
    we.org_id,
    we.event_id,
    we.event_type,
    we.window_period,
    we.start_at,
    -- Date-windowed expected: player on roster at event time
    COUNT(DISTINCT rm.player_id) FILTER (
      WHERE rm.registered_at::date <= we.start_at::date
        AND (rm.left_at IS NULL OR rm.left_at::date > we.start_at::date)
    ) AS expected_count,
    -- RSVP-aware: exclude players who said "not_going"
    COUNT(DISTINCT rm.player_id) FILTER (
      WHERE rm.registered_at::date <= we.start_at::date
        AND (rm.left_at IS NULL OR rm.left_at::date > we.start_at::date)
        AND COALESCE(er.response, '') != 'not_going'
    ) AS expected_minus_excused,
    -- Actual attendance (checked_in = true)
    COUNT(DISTINCT ci.player_id) FILTER (
      WHERE ci.checked_in = true
    ) AS attended_count
  FROM window_events we
  JOIN public.roster_members rm ON rm.team_id = we.team_id
  LEFT JOIN public.event_rsvps er ON er.event_id = we.event_id AND er.player_id = rm.player_id
  LEFT JOIN public.check_ins ci ON ci.event_id = we.event_id AND ci.player_id = rm.player_id
  GROUP BY we.team_id, we.org_id, we.event_id, we.event_type, we.window_period, we.start_at
)
SELECT
  team_id,
  org_id,
  -- CURRENT WINDOW (last 30d)
  COUNT(DISTINCT event_id) FILTER (WHERE window_period = 'current') AS events_current,
  SUM(expected_minus_excused) FILTER (WHERE window_period = 'current') AS expected_current,
  SUM(attended_count) FILTER (WHERE window_period = 'current') AS attended_current,
  CASE
    WHEN SUM(expected_minus_excused) FILTER (WHERE window_period = 'current') > 0
    THEN ROUND(100.0 * SUM(attended_count) FILTER (WHERE window_period = 'current') 
               / SUM(expected_minus_excused) FILTER (WHERE window_period = 'current'), 1)
    ELSE NULL
  END AS attendance_pct_current,
  -- PRIOR WINDOW (30-60d ago)
  COUNT(DISTINCT event_id) FILTER (WHERE window_period = 'prior') AS events_prior,
  SUM(expected_minus_excused) FILTER (WHERE window_period = 'prior') AS expected_prior,
  SUM(attended_count) FILTER (WHERE window_period = 'prior') AS attended_prior,
  CASE
    WHEN SUM(expected_minus_excused) FILTER (WHERE window_period = 'prior') > 0
    THEN ROUND(100.0 * SUM(attended_count) FILTER (WHERE window_period = 'prior') 
               / SUM(expected_minus_excused) FILTER (WHERE window_period = 'prior'), 1)
    ELSE NULL
  END AS attendance_pct_prior,
  -- PER-EVENT-TYPE BREAKDOWN (current window)
  COUNT(DISTINCT event_id) FILTER (WHERE window_period = 'current' AND event_type = 'practice') AS practices_current,
  SUM(attended_count) FILTER (WHERE window_period = 'current' AND event_type = 'practice') AS practices_attended_current,
  COUNT(DISTINCT event_id) FILTER (WHERE window_period = 'current' AND event_type = 'game') AS games_current,
  SUM(attended_count) FILTER (WHERE window_period = 'current' AND event_type = 'game') AS games_attended_current,
  COUNT(DISTINCT event_id) FILTER (WHERE window_period = 'current' AND event_type = 'tournament') AS tournaments_current,
  SUM(attended_count) FILTER (WHERE window_period = 'current' AND event_type = 'tournament') AS tournaments_attended_current,
  now() AS computed_at
FROM event_attendance
GROUP BY team_id, org_id;

COMMENT ON VIEW public.team_attendance_30d IS
  'Per-team check-in attendance over rolling 30 days, with prior 30d for trend, and per-event-type breakdown. RSVP "not_going" excuses absences. Powers coach Team Pulse + admin KPI cards.';

-- ============================================================
-- SECTION 3: VIEW team_rsvp_30d
-- Per-team RSVP response rates last 30d + trend vs prior 30d
-- ============================================================

DROP VIEW IF EXISTS public.team_rsvp_30d;
CREATE VIEW public.team_rsvp_30d
WITH (security_invoker = true)
AS
WITH window_events AS (
  SELECT
    e.id AS event_id,
    e.team_id,
    e.event_type,
    e.start_at,
    t.org_id,
    CASE 
      WHEN e.start_at >= now() - INTERVAL '30 days' THEN 'current'
      WHEN e.start_at >= now() - INTERVAL '60 days' AND e.start_at < now() - INTERVAL '30 days' THEN 'prior'
    END AS window_period
  FROM public.events e
  JOIN public.teams t ON t.id = e.team_id
  WHERE e.start_at >= now() - INTERVAL '60 days'
    AND e.status != 'cancelled'
),
event_rsvp AS (
  SELECT
    we.team_id,
    we.org_id,
    we.event_id,
    we.event_type,
    we.window_period,
    we.start_at,
    COUNT(DISTINCT rm.player_id) FILTER (
      WHERE rm.registered_at::date <= we.start_at::date
        AND (rm.left_at IS NULL OR rm.left_at::date > we.start_at::date)
    ) AS expected_count,
    COUNT(DISTINCT er.player_id) FILTER (WHERE er.response = 'going') AS going_count,
    COUNT(DISTINCT er.player_id) FILTER (WHERE er.response = 'maybe') AS maybe_count,
    COUNT(DISTINCT er.player_id) FILTER (WHERE er.response = 'not_going') AS not_going_count,
    COUNT(DISTINCT er.player_id) FILTER (WHERE er.response IS NOT NULL) AS responded_count
  FROM window_events we
  JOIN public.roster_members rm ON rm.team_id = we.team_id
  LEFT JOIN public.event_rsvps er ON er.event_id = we.event_id AND er.player_id = rm.player_id
  GROUP BY we.team_id, we.org_id, we.event_id, we.event_type, we.window_period, we.start_at
)
SELECT
  team_id,
  org_id,
  -- CURRENT
  COUNT(DISTINCT event_id) FILTER (WHERE window_period = 'current') AS events_current,
  SUM(expected_count) FILTER (WHERE window_period = 'current') AS expected_current,
  SUM(going_count) FILTER (WHERE window_period = 'current') AS going_current,
  SUM(maybe_count) FILTER (WHERE window_period = 'current') AS maybe_current,
  SUM(not_going_count) FILTER (WHERE window_period = 'current') AS not_going_current,
  SUM(responded_count) FILTER (WHERE window_period = 'current') AS responded_current,
  CASE
    WHEN SUM(expected_count) FILTER (WHERE window_period = 'current') > 0
    THEN ROUND(100.0 * SUM(going_count) FILTER (WHERE window_period = 'current') 
               / SUM(expected_count) FILTER (WHERE window_period = 'current'), 1)
    ELSE NULL
  END AS going_pct_current,
  CASE
    WHEN SUM(expected_count) FILTER (WHERE window_period = 'current') > 0
    THEN ROUND(100.0 * SUM(responded_count) FILTER (WHERE window_period = 'current') 
               / SUM(expected_count) FILTER (WHERE window_period = 'current'), 1)
    ELSE NULL
  END AS response_pct_current,
  -- PRIOR
  COUNT(DISTINCT event_id) FILTER (WHERE window_period = 'prior') AS events_prior,
  CASE
    WHEN SUM(expected_count) FILTER (WHERE window_period = 'prior') > 0
    THEN ROUND(100.0 * SUM(going_count) FILTER (WHERE window_period = 'prior') 
               / SUM(expected_count) FILTER (WHERE window_period = 'prior'), 1)
    ELSE NULL
  END AS going_pct_prior,
  CASE
    WHEN SUM(expected_count) FILTER (WHERE window_period = 'prior') > 0
    THEN ROUND(100.0 * SUM(responded_count) FILTER (WHERE window_period = 'prior') 
               / SUM(expected_count) FILTER (WHERE window_period = 'prior'), 1)
    ELSE NULL
  END AS response_pct_prior,
  now() AS computed_at
FROM event_rsvp
GROUP BY team_id, org_id;

COMMENT ON VIEW public.team_rsvp_30d IS
  'Per-team RSVP rates (going/maybe/not_going/responded) rolling 30d with prior 30d trend. Powers coach Team Pulse RSVP metric and admin KPI.';

-- ============================================================
-- SECTION 4: VIEW player_attendance_season
-- Per-player check-in % for current season, with streak + last-attended
-- ============================================================

DROP VIEW IF EXISTS public.player_attendance_season;
CREATE VIEW public.player_attendance_season
WITH (security_invoker = true)
AS
WITH season_events AS (
  SELECT
    e.id AS event_id,
    e.team_id,
    e.event_type,
    e.start_at,
    s.id AS season_id,
    s.org_id
  FROM public.events e
  JOIN public.seasons s ON s.id = e.season_id
  WHERE s.status = 'active'
    AND e.status != 'cancelled'
    AND e.start_at <= now()
),
player_events AS (
  SELECT
    rm.player_id,
    rm.team_id,
    se.org_id,
    se.season_id,
    se.event_id,
    se.event_type,
    se.start_at,
    CASE WHEN ci.checked_in = true THEN 1 ELSE 0 END AS attended
  FROM season_events se
  JOIN public.roster_members rm ON rm.team_id = se.team_id
    AND rm.registered_at::date <= se.start_at::date
    AND (rm.left_at IS NULL OR rm.left_at::date > se.start_at::date)
  LEFT JOIN public.event_rsvps er ON er.event_id = se.event_id AND er.player_id = rm.player_id
  LEFT JOIN public.check_ins ci ON ci.event_id = se.event_id AND ci.player_id = rm.player_id
  WHERE COALESCE(er.response, '') != 'not_going'
)
SELECT
  player_id,
  team_id,
  org_id,
  season_id,
  COUNT(DISTINCT event_id) AS events_eligible,
  SUM(attended) AS events_attended,
  CASE
    WHEN COUNT(DISTINCT event_id) > 0
    THEN ROUND(100.0 * SUM(attended) / COUNT(DISTINCT event_id), 1)
    ELSE NULL
  END AS attendance_pct,
  COUNT(DISTINCT event_id) FILTER (WHERE event_type = 'practice') AS practices_eligible,
  SUM(attended) FILTER (WHERE event_type = 'practice') AS practices_attended,
  COUNT(DISTINCT event_id) FILTER (WHERE event_type = 'game') AS games_eligible,
  SUM(attended) FILTER (WHERE event_type = 'game') AS games_attended,
  COUNT(DISTINCT event_id) FILTER (WHERE event_type = 'tournament') AS tournaments_eligible,
  SUM(attended) FILTER (WHERE event_type = 'tournament') AS tournaments_attended,
  MAX(start_at) FILTER (WHERE attended = 1) AS last_attended_at,
  now() AS computed_at
FROM player_events
GROUP BY player_id, team_id, org_id, season_id;

COMMENT ON VIEW public.player_attendance_season IS
  'Per-player check-in attendance for current active season. Includes total + per-event-type breakdown + last attended. RSVP "not_going" excuses absences. Powers parent home MY TEAMS per-child attendance.';

-- ============================================================
-- SECTION 5: VIEW player_rsvp_season
-- Per-player RSVP rates current season
-- ============================================================

DROP VIEW IF EXISTS public.player_rsvp_season;
CREATE VIEW public.player_rsvp_season
WITH (security_invoker = true)
AS
WITH season_events AS (
  SELECT
    e.id AS event_id,
    e.team_id,
    e.event_type,
    e.start_at,
    s.id AS season_id,
    s.org_id
  FROM public.events e
  JOIN public.seasons s ON s.id = e.season_id
  WHERE s.status = 'active'
    AND e.status != 'cancelled'
),
player_rsvp AS (
  SELECT
    rm.player_id,
    rm.team_id,
    se.org_id,
    se.season_id,
    se.event_id,
    se.event_type,
    er.response
  FROM season_events se
  JOIN public.roster_members rm ON rm.team_id = se.team_id
    AND rm.registered_at::date <= se.start_at::date
    AND (rm.left_at IS NULL OR rm.left_at::date > se.start_at::date)
  LEFT JOIN public.event_rsvps er ON er.event_id = se.event_id AND er.player_id = rm.player_id
)
SELECT
  player_id,
  team_id,
  org_id,
  season_id,
  COUNT(DISTINCT event_id) AS events_eligible,
  COUNT(DISTINCT event_id) FILTER (WHERE response = 'going') AS rsvp_going,
  COUNT(DISTINCT event_id) FILTER (WHERE response = 'maybe') AS rsvp_maybe,
  COUNT(DISTINCT event_id) FILTER (WHERE response = 'not_going') AS rsvp_not_going,
  COUNT(DISTINCT event_id) FILTER (WHERE response IS NOT NULL) AS rsvp_responded,
  CASE
    WHEN COUNT(DISTINCT event_id) > 0
    THEN ROUND(100.0 * COUNT(DISTINCT event_id) FILTER (WHERE response = 'going') / COUNT(DISTINCT event_id), 1)
    ELSE NULL
  END AS going_pct,
  CASE
    WHEN COUNT(DISTINCT event_id) > 0
    THEN ROUND(100.0 * COUNT(DISTINCT event_id) FILTER (WHERE response IS NOT NULL) / COUNT(DISTINCT event_id), 1)
    ELSE NULL
  END AS response_pct,
  now() AS computed_at
FROM player_rsvp
GROUP BY player_id, team_id, org_id, season_id;

COMMENT ON VIEW public.player_rsvp_season IS
  'Per-player RSVP response rates for current active season. Powers parent home MY TEAMS RSVP behavior visibility.';

NOTIFY pgrst, 'reload schema';

COMMIT;
