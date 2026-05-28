-- Wave 3-A: season_locations junction table
-- Applied: 2026-05-05 19:05:00 UTC via Supabase MCP apply_migration
-- Project: vrwwpsbfbnveawqwbdmj (Legacy Hoopers / Ember / Ember)
--
-- Per-season activation set for org locations. Filters the activity wizard's
-- location dropdown to only locations active for the current season.
-- Seeded with all 22 active LH locations for Spring 2026.
--
-- Schema decisions:
--   - Junction table: (season_id, location_id) unique
--   - SELECT RLS: admin/coach/parent in the org can read mappings (needed for wizard dropdown)
--   - WRITE RLS: admin only
--   - Uses canonical user_has_role_in_org() helper, not org_members (which doesn't exist)
--
-- Companion features (deployed to v2 awaiting this migration):
--   - useSeasonLocations.js: bulk diff writes
--   - useSeasonScopedLocations.js: graceful fallback if no rows exist for a season
--   - ManageSeasonLocationsSheet.jsx: bulk checkbox sheet (admin only)
--   - LocationsPage.jsx: "Season" button (admin + active season only)
--   - StepWhen.jsx: wizard location dropdown filtered by season's active set
--   - SeasonRolloverPage.jsx: pre-fetch from-season location count
--   - RolloverSteps.jsx: carry-forward checkbox in StepDetails + Preview row
--   - useSeasonRollover.js: copy season_locations rows on commit (errors recoverable)

CREATE TABLE public.season_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_id, location_id)
);

CREATE INDEX idx_season_locations_season ON public.season_locations(season_id);
CREATE INDEX idx_season_locations_location ON public.season_locations(location_id);

ALTER TABLE public.season_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY season_locations_select ON public.season_locations
  FOR SELECT TO authenticated
  USING (season_id IN (
    SELECT id FROM public.seasons
    WHERE user_has_role_in_org(org_id, ARRAY['admin','coach','parent'])
  ));

CREATE POLICY season_locations_write ON public.season_locations
  FOR ALL TO authenticated
  USING (season_id IN (
    SELECT id FROM public.seasons
    WHERE user_has_role_in_org(org_id, ARRAY['admin'])
  ))
  WITH CHECK (season_id IN (
    SELECT id FROM public.seasons
    WHERE user_has_role_in_org(org_id, ARRAY['admin'])
  ));

INSERT INTO public.season_locations (season_id, location_id)
SELECT s.id, l.id
FROM public.seasons s
CROSS JOIN public.locations l
WHERE s.org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
  AND s.status = 'active'
  AND l.org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
  AND l.archived_at IS NULL
ON CONFLICT (season_id, location_id) DO NOTHING;

DO $$
DECLARE
  seeded_count int;
  policy_count int;
BEGIN
  SELECT COUNT(*) INTO seeded_count FROM public.season_locations;
  IF seeded_count <> 22 THEN
    RAISE EXCEPTION 'Expected 22 season_location seed rows, got %', seeded_count;
  END IF;

  SELECT COUNT(*) INTO policy_count FROM pg_policies
    WHERE schemaname='public' AND tablename='season_locations';
  IF policy_count <> 2 THEN
    RAISE EXCEPTION 'Expected 2 policies on season_locations, got %', policy_count;
  END IF;
END $$;
