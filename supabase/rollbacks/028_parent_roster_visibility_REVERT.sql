-- Rollback for Migration 028
DROP POLICY IF EXISTS players_select_parent_team ON public.players;
DROP FUNCTION IF EXISTS public.current_user_teammate_player_ids();
