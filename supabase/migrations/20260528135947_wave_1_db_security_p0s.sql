-- Wave 1 P0 fixes: AP #57 anon-EXECUTE leaks + push_subscriptions NOT NULL + staff_profiles RLS
-- Source: docs/AUDIT_WAVE_1_PRE_CUTOVER_2026-05-28.md

REVOKE EXECUTE ON FUNCTION public.mint_unsubscribe_token(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mint_unsubscribe_token(uuid) FROM anon;

REVOKE EXECUTE ON FUNCTION public.sync_opponent_record(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_opponent_record(uuid) FROM anon;

REVOKE EXECUTE ON FUNCTION public.sync_tournament_team_record(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_tournament_team_record(uuid, uuid) FROM anon;

ALTER TABLE public.push_subscriptions ALTER COLUMN org_id SET NOT NULL;

DROP POLICY IF EXISTS staff_profiles_select_authenticated ON public.staff_profiles;
CREATE POLICY staff_profiles_select_authenticated ON public.staff_profiles
  FOR SELECT TO authenticated
  USING (org_id = (SELECT current_user_org_id()));
