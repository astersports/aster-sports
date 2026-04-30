-- ===========================================================================
-- Migration 027: Hotfix — restrict legacy public-role policies to authenticated
-- ===========================================================================
-- Source: P0 hotfix for Wave 3c-a, April 30, 2026
-- Applied: 2026-04-30 via Supabase MCP apply_migration
--
-- Root cause: 11 existing RLS policies have roles={public} but USING/WITH
-- CHECK clauses call current_user_org_id(). Anon lacks EXECUTE on that
-- function, so the policy evaluation throws permission-denied before
-- OR-evaluation can short-circuit to the new permissive policies.
--
-- Fix: restrict 11 affected policies to {authenticated} only. They were
-- never functionally usable by anon (function returns NULL). Anon access
-- for /records continues via Migration 025 policies.
-- ===========================================================================

ALTER POLICY teams_select ON teams TO authenticated;
ALTER POLICY events_select ON events TO authenticated;
ALTER POLICY events_insert ON events TO authenticated;
ALTER POLICY locations_select ON locations TO authenticated;
ALTER POLICY opponents_select ON opponents TO authenticated;
ALTER POLICY seasons_select ON seasons TO authenticated;
ALTER POLICY team_players_select ON team_players TO authenticated;
ALTER POLICY team_staff_select ON team_staff TO authenticated;
ALTER POLICY location_rooms_org_isolation ON location_rooms TO authenticated;
ALTER POLICY ride_offers_select ON event_ride_offers TO authenticated;
ALTER POLICY ride_offers_insert ON event_ride_offers TO authenticated;

DO $$
DECLARE
  still_public_count INT;
  authenticated_count INT;
BEGIN
  SELECT COUNT(*) INTO still_public_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND roles = '{public}'
    AND (qual::text LIKE '%current_user_org_id%'
         OR with_check::text LIKE '%current_user_org_id%')
    AND policyname IN (
      'teams_select', 'events_select', 'events_insert',
      'locations_select', 'opponents_select', 'seasons_select',
      'team_players_select', 'team_staff_select',
      'location_rooms_org_isolation',
      'ride_offers_select', 'ride_offers_insert'
    );
  IF still_public_count <> 0 THEN
    RAISE EXCEPTION 'Migration 027 failed: % policies still have roles=public', still_public_count;
  END IF;

  SELECT COUNT(*) INTO authenticated_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND roles = '{authenticated}'
    AND policyname IN (
      'teams_select', 'events_select', 'events_insert',
      'locations_select', 'opponents_select', 'seasons_select',
      'team_players_select', 'team_staff_select',
      'location_rooms_org_isolation',
      'ride_offers_select', 'ride_offers_insert'
    );
  IF authenticated_count <> 11 THEN
    RAISE EXCEPTION 'Migration 027 failed: expected 11 authenticated policies, got %', authenticated_count;
  END IF;
END $$;
