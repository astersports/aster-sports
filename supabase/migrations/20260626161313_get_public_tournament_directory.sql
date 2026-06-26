-- AAU hub: public tournament directory RPC.
-- Mirror of the prod-applied migration (AP #21 — version string matches production).
-- Anon-readable directory of public-listed tournaments and their divisions, for the
-- astersports.io/aau Standings hub. Gated by org_is_public_listed() — same public
-- surface contract as the other get_public_* RPCs. No tenant-private data leaves here.

CREATE OR REPLACE FUNCTION public.get_public_tournament_directory()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH t AS (
    SELECT tt.id, tt.org_id, tt.name, tt.circuit, tt.start_date, tt.end_date
    FROM public.tournaments tt
    WHERE public.org_is_public_listed(tt.org_id)
      AND tt.archived_at IS NULL
  ),
  divs AS (
    SELECT td.tournament_id, td.id, td.name, td.grade_label, td.gender, td.advance_count, td.sort_order,
           (SELECT count(*) FROM public.tournament_division_teams x WHERE x.tournament_division_id = td.id) AS team_count
    FROM public.tournament_divisions td
    JOIN t ON t.id = td.tournament_id
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', t.id, 'name', t.name, 'circuit', t.circuit,
    'start_date', t.start_date, 'end_date', t.end_date,
    'divisions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', d.id, 'name', d.name, 'grade_label', d.grade_label, 'gender', d.gender,
        'advance_count', d.advance_count, 'team_count', d.team_count) ORDER BY d.sort_order, d.name)
      FROM divs d WHERE d.tournament_id = t.id), '[]'::jsonb)
  ) ORDER BY t.start_date DESC), '[]'::jsonb)
  FROM t;
$function$;

-- Public surface: anon may execute (read-only, org_is_public_listed-gated). Lock down the rest.
REVOKE EXECUTE ON FUNCTION public.get_public_tournament_directory() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_tournament_directory() TO anon, authenticated;
