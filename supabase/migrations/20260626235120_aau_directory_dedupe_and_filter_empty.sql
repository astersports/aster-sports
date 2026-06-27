-- AAU directory hygiene: hide tournaments with 0 divisions (old seed clutter / a
-- failed scrape), and collapse cross-org / re-ingest duplicates to ONE entry per
-- (name, start_date) — the richest copy (most teams, then most divisions). Pure
-- presentation in the RPC; no data deleted, LH app unaffected. CREATE OR REPLACE.
--
-- Mirror of the prod-applied migration (AP #21 — version string matches production).

CREATE OR REPLACE FUNCTION public.get_public_tournament_directory()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH base AS (
    SELECT tt.id, tt.org_id, tt.name, tt.circuit, tt.start_date, tt.end_date,
      (SELECT count(*) FROM public.tournament_divisions d WHERE d.tournament_id = tt.id) AS div_count,
      (SELECT count(*) FROM public.tournament_division_teams x
        JOIN public.tournament_divisions d ON d.id = x.tournament_division_id
        WHERE d.tournament_id = tt.id) AS team_count
    FROM public.tournaments tt
    WHERE public.org_is_public_listed(tt.org_id) AND tt.archived_at IS NULL
  ),
  ranked AS (
    SELECT *, row_number() OVER (
      PARTITION BY lower(btrim(name)), start_date
      ORDER BY team_count DESC, div_count DESC, id
    ) AS rn
    FROM base
    WHERE div_count > 0                       -- drop empty (0-division) tournaments
  ),
  t AS (SELECT * FROM ranked WHERE rn = 1),   -- one per (name, date): the richest copy
  divs AS (
    SELECT td.tournament_id, td.id, td.name, td.grade_label, td.gender, td.advance_count, td.sort_order,
           count(x.id) AS team_count
    FROM public.tournament_divisions td
    JOIN t ON t.id = td.tournament_id
    LEFT JOIN public.tournament_division_teams x ON x.tournament_division_id = td.id
    GROUP BY td.tournament_id, td.id, td.name, td.grade_label, td.gender, td.advance_count, td.sort_order
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

REVOKE EXECUTE ON FUNCTION public.get_public_tournament_directory() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_tournament_directory() FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_public_tournament_directory() TO anon, authenticated;
