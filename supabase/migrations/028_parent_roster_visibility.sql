-- Migration 028: Parent roster + player visibility for own teams
-- Per D-roster1: parents see full team roster (player names + RSVP status) on
-- event detail and team detail. Coaches and admins already have full visibility.
-- Per D-roster2: admin toggle to hide deferred to Sprint E.
--
-- Three layers in the useRoster join chain:
--   roster_members -> players -> player_guardians -> guardians
--
-- This migration adds parent-team visibility to layer 2 (players). Layer 1
-- (roster_members) was previously fixed via current_user_child_team_ids().
-- Layers 3-4 stay restricted: parents see player NAMES only, not contact info
-- for other families.
--
-- L99 lesson: never write an RLS policy whose USING clause does an inner SELECT
-- on the same table or a related table covered by RLS. Always extract to a
-- SECURITY DEFINER helper. The helper below mirrors the existing
-- current_user_child_team_ids() and current_user_player_ids() patterns.

CREATE OR REPLACE FUNCTION public.current_user_teammate_player_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(ARRAY_AGG(DISTINCT rm.player_id), ARRAY[]::uuid[])
  FROM roster_members rm
  WHERE rm.team_id = ANY (current_user_child_team_ids());
$$;

CREATE POLICY players_select_parent_team
ON public.players
FOR SELECT
TO authenticated
USING (id = ANY (current_user_teammate_player_ids()));
