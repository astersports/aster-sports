-- Wave 1 P0 #4: replace hardcoded Legacy Hoopers UUID in 4 public-read RLS
-- policies with a per-org gating column. Unblocks multi-tenant public listing.

ALTER TABLE public.organizations
  ADD COLUMN public_listing_enabled boolean NOT NULL DEFAULT true;

-- events_select_public: preserve publish_status filter + team_id FK traversal,
-- preserve {anon}-only role list.
DROP POLICY IF EXISTS events_select_public ON public.events;
CREATE POLICY events_select_public ON public.events
  FOR SELECT TO anon
  USING (
    publish_status = 'published'
    AND team_id IN (
      SELECT t.id FROM teams t
      WHERE t.org_id IN (
        SELECT id FROM organizations WHERE public_listing_enabled = true
      )
    )
  );

-- teams_select_public: direct org_id, {anon,authenticated}.
DROP POLICY IF EXISTS teams_select_public ON public.teams;
CREATE POLICY teams_select_public ON public.teams
  FOR SELECT TO anon, authenticated
  USING (
    org_id IN (
      SELECT id FROM organizations WHERE public_listing_enabled = true
    )
  );

-- tournaments_select_public: direct org_id, {anon,authenticated}.
DROP POLICY IF EXISTS tournaments_select_public ON public.tournaments;
CREATE POLICY tournaments_select_public ON public.tournaments
  FOR SELECT TO anon, authenticated
  USING (
    org_id IN (
      SELECT id FROM organizations WHERE public_listing_enabled = true
    )
  );

-- tournament_teams_select_public: tournament_id FK traversal, {anon,authenticated}.
DROP POLICY IF EXISTS tournament_teams_select_public ON public.tournament_teams;
CREATE POLICY tournament_teams_select_public ON public.tournament_teams
  FOR SELECT TO anon, authenticated
  USING (
    tournament_id IN (
      SELECT tt.id FROM tournaments tt
      WHERE tt.org_id IN (
        SELECT id FROM organizations WHERE public_listing_enabled = true
      )
    )
  );
