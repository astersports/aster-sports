-- Global team search: return the tournament_division_teams id as teamKey (was
-- resolved_key, the normalized NAME — identical across every tournament, which made
-- search-tracking collapse all of a club's teams into one entry AND mismatch the
-- tdt-id key TrackTeams writes). teamKey is now the stable per-(team,division) id, so
-- tracking from search and from a tournament use the same key space.
CREATE OR REPLACE FUNCTION public.search_public_teams(p_query text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH term AS (SELECT lower(btrim(coalesce(p_query, ''))) AS q),
  base AS (
    SELECT tt.id, tt.name, tt.start_date, tt.end_date,
      (SELECT count(*) FROM public.tournament_divisions d WHERE d.tournament_id = tt.id) AS div_count,
      (SELECT count(*) FROM public.tournament_division_teams x
         JOIN public.tournament_divisions d ON d.id = x.tournament_division_id
         WHERE d.tournament_id = tt.id) AS team_count
    FROM public.tournaments tt
    WHERE public.org_is_public_listed(tt.org_id) AND tt.archived_at IS NULL
  ),
  canon AS (
    SELECT id, name, start_date, end_date FROM (
      SELECT *, row_number() OVER (
        PARTITION BY lower(btrim(name)), start_date ORDER BY team_count DESC, div_count DESC, id
      ) AS rn
      FROM base WHERE div_count > 0
    ) r WHERE rn = 1
  ),
  hits AS (
    SELECT tdt.id AS team_key, tdt.display_name AS name,
           c.id AS tournament_id, c.name AS tournament_name, c.start_date, c.end_date,
           d.id AS division_id, d.name AS division_name, d.grade_label, d.gender
    FROM canon c
    JOIN public.tournament_divisions d ON d.tournament_id = c.id
    JOIN public.tournament_division_teams tdt ON tdt.tournament_division_id = d.id
    WHERE (SELECT q FROM term) <> ''
      AND lower(tdt.display_name) LIKE '%' || (SELECT q FROM term) || '%'
    ORDER BY c.start_date DESC, tdt.display_name
    LIMIT 50
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'teamKey', team_key, 'name', name,
    'tournamentId', tournament_id, 'tournamentName', tournament_name,
    'startDate', start_date, 'endDate', end_date,
    'divisionId', division_id, 'divisionName', division_name,
    'gradeLabel', grade_label, 'gender', gender
  )), '[]'::jsonb) FROM hits;
$function$;
