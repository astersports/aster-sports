-- Slim the no-login Hub directory payload. The directory list cards only need
-- the division COUNT (rendered as "5 divisions"), but the RPC embedded the full
-- divisions array (~2.1 KB/tournament: id, name, grade_label, gender,
-- advance_count, team_count per division). At 15 active tournaments that's a
-- ~52 KB home-page payload that grows with every tournament. Replace the embed
-- with `division_count` (already computed as div_count); the detail page loads
-- full divisions via get_public_tournament_teams on demand. (52 KB -> ~3 KB.)
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
    WHERE div_count > 0
  ),
  t AS (SELECT * FROM ranked WHERE rn = 1)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', t.id, 'name', t.name, 'circuit', t.circuit,
    'start_date', t.start_date, 'end_date', t.end_date,
    'division_count', t.div_count,
    'states', COALESCE((
      SELECT jsonb_agg(DISTINCT v.state ORDER BY v.state)
      FROM public.division_games dg
      JOIN public.tournament_divisions d ON d.id = dg.tournament_division_id
      JOIN public.venues v ON v.id = dg.venue_id
      WHERE d.tournament_id = t.id AND v.state IS NOT NULL AND btrim(v.state) <> ''
    ), '[]'::jsonb)
  ) ORDER BY t.start_date DESC), '[]'::jsonb)
  FROM t;
$function$;

-- Re-assert the public-RPC grant convention (AP #23/#57) + refresh the comment
-- so this mirror stays faithful and self-contained (CREATE OR REPLACE preserves
-- the prior ACL, so this is a no-op re-assertion, not a privilege change).
REVOKE EXECUTE ON FUNCTION public.get_public_tournament_directory() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_tournament_directory() FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_public_tournament_directory() TO anon, authenticated;
COMMENT ON FUNCTION public.get_public_tournament_directory() IS
  'AAU Discovery directory (public-read, Plane A). Canonical-deduped tournaments. SLIMMED 2026-06-30: returns scalar division_count instead of the embedded divisions array (home cards only need the count; the detail page loads full divisions via get_public_tournament_teams). states = DISTINCT venues.state via division_games.venue_id (geocoded only; [] when none).';
