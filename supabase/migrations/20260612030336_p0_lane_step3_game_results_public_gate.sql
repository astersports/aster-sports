-- P0 lane STEP 3 (SD-13 ruling, operator GO 2026-06-12): gate game_results.
-- DB-3: game_results_select_public was qual'd on published_at alone — anon
-- (and any cross-org authenticated user) could read every org's published
-- results. Rewritten to follow parent-event visibility + the public-listing
-- gate: anon sees results only for public-listed orgs' published events;
-- authenticated users see results only where they can see the parent event
-- (org members via their events policies — closes the cross-org authed read).
-- game_results_select_staff (org-scoped) is untouched and continues to cover
-- staff irrespective of listing state.

DROP POLICY IF EXISTS game_results_select_public ON public.game_results;
CREATE POLICY game_results_select_public ON public.game_results
  FOR SELECT TO anon, authenticated
  USING (
    published_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = game_results.event_id
    )
  );

-- DB-5: game_results_select_parent is dead weight — strictly narrower than the
-- public policy that already covered authenticated, it raw-joins
-- roster_members/player_guardians against the §11.5 helper rule, and it omits
-- the left_at window. Parents retain read access through the rewritten public
-- policy via their own parent-event visibility.
DROP POLICY IF EXISTS game_results_select_parent ON public.game_results;
