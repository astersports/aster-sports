-- P0 lane STEP 2 (SD-10 ruling, operator GO 2026-06-12): anon org-gate repair.
-- DB-1: since 20260528140000 the four *_select_public policies gate on a
-- subquery over public.organizations, which has NO anon-readable policy —
-- policy USING expressions evaluate as the CALLER, so for anon the gate
-- always returned empty and the public schedule has been fail-closed.
-- Ruled fix: a SECURITY DEFINER helper (runs as definer, never exposes
-- organizations rows to anon), consumed by the rewritten policies.

CREATE OR REPLACE FUNCTION public.org_is_public_listed(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = p_org_id AND public_listing_enabled = true
  );
$$;

-- AP #23 (PUBLIC first) + AP #57 (Supabase default privileges auto-grant
-- EXECUTE to anon — clear it, then grant explicitly so intent is on record).
REVOKE EXECUTE ON FUNCTION public.org_is_public_listed(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.org_is_public_listed(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.org_is_public_listed(uuid) TO anon, authenticated;

-- Per-team calendar-subscribe info for the public page, gated on public
-- listing. Replaces the anon bulk SELECT of teams.team_feed_token revoked in
-- STEP 1 (the token is a bearer secret; this hands it out one team at a time
-- and only for orgs that opted into public listing). Also carries the org
-- display name, since anon cannot (and should not) read organizations rows.
CREATE OR REPLACE FUNCTION public.get_public_subscribe_info(p_team_id uuid)
RETURNS TABLE (feed_token text, org_display_name text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT t.team_feed_token, COALESCE(o.display_name, o.name)
  FROM public.teams t
  JOIN public.organizations o ON o.id = t.org_id
  WHERE t.id = p_team_id AND o.public_listing_enabled = true;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_subscribe_info(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_subscribe_info(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_public_subscribe_info(uuid) TO anon, authenticated;

-- Rewrite the four public policies onto the helper. Role lists and all
-- non-gate conjuncts preserved exactly from the live policies (read from
-- pg_policies 2026-06-12 before this migration).

DROP POLICY IF EXISTS events_select_public ON public.events;
CREATE POLICY events_select_public ON public.events
  FOR SELECT TO anon
  USING (
    publish_status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = events.team_id
        AND public.org_is_public_listed(t.org_id)
    )
  );

DROP POLICY IF EXISTS teams_select_public ON public.teams;
CREATE POLICY teams_select_public ON public.teams
  FOR SELECT TO anon, authenticated
  USING (public.org_is_public_listed(org_id));

DROP POLICY IF EXISTS tournaments_select_public ON public.tournaments;
CREATE POLICY tournaments_select_public ON public.tournaments
  FOR SELECT TO anon, authenticated
  USING (public.org_is_public_listed(org_id));

DROP POLICY IF EXISTS tournament_teams_select_public ON public.tournament_teams;
CREATE POLICY tournament_teams_select_public ON public.tournament_teams
  FOR SELECT TO anon, authenticated
  USING (
    tournament_id IN (
      SELECT tt.id FROM public.tournaments tt
      WHERE public.org_is_public_listed(tt.org_id)
    )
  );
