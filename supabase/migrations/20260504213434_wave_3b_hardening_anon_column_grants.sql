-- Wave 3-B-hardening: column-level GRANT for anon on events, game_results, tournaments
-- Applied: 2026-05-04 21:34:34 UTC via Supabase MCP apply_migration
-- Project: vrwwpsbfbnveawqwbdmj (Legacy Hoopers / Skyfire / Ember)
--
-- Closes the events.notes/coach_notes leak. Switches anon from wildcard table
-- SELECT to explicit column-list GRANT. Authenticated role unaffected.
-- /schedule/:teamId queries explicit columns; no app code change required.

-- ============ events ============
REVOKE SELECT ON public.events FROM anon;
GRANT SELECT (
  id, team_id, event_type, title,
  start_at, end_at, end_date, is_multi_day, parent_event_id,
  location, location_address, sub_location, location_id, location_room_id,
  opponent, opponent_id, home_away, jersey,
  status, cancellation_reason, cancelled_at,
  notes,
  arrival_minutes_before, arrival_time, rsvp_deadline,
  enable_rides, indoor,
  is_scrimmage, is_bonus_game, is_championship_final,
  tournament_name, tournament_id,
  is_bracket_placeholder, bracket_placeholder_label, bracket_placeholder,
  is_bracket_game, bracket_label, game_sequence,
  publish_status, season_id,
  created_at, updated_at
) ON public.events TO anon;
-- Withheld from anon: coach_notes, coach_keys, opponent_pool, attachments

-- ============ game_results ============
REVOKE SELECT ON public.game_results FROM anon;
GRANT SELECT (
  id, event_id,
  our_score, opponent_score, result, quarter_scores, point_differential,
  player_of_game_id,
  published_at
) ON public.game_results TO anon;
-- Withheld from anon: coach_highlight, private_notes, entered_by, entered_at, published_by

-- ============ tournaments ============
REVOKE SELECT ON public.tournaments FROM anon;
GRANT SELECT (
  id, org_id, name, circuit,
  start_date, end_date,
  primary_venue, primary_venue_address,
  tourney_url, hotel_url,
  status, schedule_status,
  rsvp_deadline_at, hotel_deadline_at,
  pool_label, roster_locked_at,
  archived_at, created_at
) ON public.tournaments TO anon;
-- Withheld from anon: survival_notes, coach_theme, game_day_guide,
--   entry_fee_cents, rules, created_by, roster_locked_by

-- ============ Verification ============
DO $$
DECLARE has_perm boolean;
BEGIN
  -- Sensitive columns: must be FALSE
  SELECT has_column_privilege('anon','public.events','coach_notes','SELECT') INTO has_perm;
  IF has_perm THEN RAISE EXCEPTION 'anon still has SELECT on events.coach_notes'; END IF;
  SELECT has_column_privilege('anon','public.events','coach_keys','SELECT') INTO has_perm;
  IF has_perm THEN RAISE EXCEPTION 'anon still has SELECT on events.coach_keys'; END IF;
  SELECT has_column_privilege('anon','public.events','opponent_pool','SELECT') INTO has_perm;
  IF has_perm THEN RAISE EXCEPTION 'anon still has SELECT on events.opponent_pool'; END IF;
  SELECT has_column_privilege('anon','public.events','attachments','SELECT') INTO has_perm;
  IF has_perm THEN RAISE EXCEPTION 'anon still has SELECT on events.attachments'; END IF;

  SELECT has_column_privilege('anon','public.game_results','private_notes','SELECT') INTO has_perm;
  IF has_perm THEN RAISE EXCEPTION 'anon still has SELECT on game_results.private_notes'; END IF;
  SELECT has_column_privilege('anon','public.game_results','coach_highlight','SELECT') INTO has_perm;
  IF has_perm THEN RAISE EXCEPTION 'anon still has SELECT on game_results.coach_highlight'; END IF;

  SELECT has_column_privilege('anon','public.tournaments','survival_notes','SELECT') INTO has_perm;
  IF has_perm THEN RAISE EXCEPTION 'anon still has SELECT on tournaments.survival_notes'; END IF;
  SELECT has_column_privilege('anon','public.tournaments','rules','SELECT') INTO has_perm;
  IF has_perm THEN RAISE EXCEPTION 'anon still has SELECT on tournaments.rules'; END IF;
  SELECT has_column_privilege('anon','public.tournaments','entry_fee_cents','SELECT') INTO has_perm;
  IF has_perm THEN RAISE EXCEPTION 'anon still has SELECT on tournaments.entry_fee_cents'; END IF;

  -- Safe columns: must be TRUE
  SELECT has_column_privilege('anon','public.events','title','SELECT') INTO has_perm;
  IF NOT has_perm THEN RAISE EXCEPTION 'anon lost SELECT on events.title'; END IF;
  SELECT has_column_privilege('anon','public.events','start_at','SELECT') INTO has_perm;
  IF NOT has_perm THEN RAISE EXCEPTION 'anon lost SELECT on events.start_at'; END IF;
  SELECT has_column_privilege('anon','public.events','status','SELECT') INTO has_perm;
  IF NOT has_perm THEN RAISE EXCEPTION 'anon lost SELECT on events.status'; END IF;
  SELECT has_column_privilege('anon','public.events','notes','SELECT') INTO has_perm;
  IF NOT has_perm THEN RAISE EXCEPTION 'anon lost SELECT on events.notes (must remain public)'; END IF;
  SELECT has_column_privilege('anon','public.events','opponent','SELECT') INTO has_perm;
  IF NOT has_perm THEN RAISE EXCEPTION 'anon lost SELECT on events.opponent'; END IF;
  SELECT has_column_privilege('anon','public.events','location','SELECT') INTO has_perm;
  IF NOT has_perm THEN RAISE EXCEPTION 'anon lost SELECT on events.location'; END IF;

  SELECT has_column_privilege('anon','public.game_results','our_score','SELECT') INTO has_perm;
  IF NOT has_perm THEN RAISE EXCEPTION 'anon lost SELECT on game_results.our_score'; END IF;
  SELECT has_column_privilege('anon','public.game_results','published_at','SELECT') INTO has_perm;
  IF NOT has_perm THEN RAISE EXCEPTION 'anon lost SELECT on game_results.published_at'; END IF;

  SELECT has_column_privilege('anon','public.tournaments','name','SELECT') INTO has_perm;
  IF NOT has_perm THEN RAISE EXCEPTION 'anon lost SELECT on tournaments.name'; END IF;
  SELECT has_column_privilege('anon','public.tournaments','primary_venue','SELECT') INTO has_perm;
  IF NOT has_perm THEN RAISE EXCEPTION 'anon lost SELECT on tournaments.primary_venue'; END IF;
END $$;
