CREATE OR REPLACE FUNCTION public.derive_quarter_scores(p_event_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
  SELECT COALESCE(
    jsonb_object_agg(
      'q' || period::text,
      jsonb_build_object('us', us_pts, 'them', them_pts)
    ),
    '{}'::jsonb
  )
  FROM (
    SELECT
      period,
      SUM(CASE WHEN play_type = '2PT_MADE' AND NOT is_opponent THEN 2
               WHEN play_type = '3PT_MADE' AND NOT is_opponent THEN 3
               WHEN play_type = 'FT_MADE'  AND NOT is_opponent THEN 1
               ELSE 0 END) AS us_pts,
      SUM(CASE WHEN play_type = '2PT_MADE' AND is_opponent THEN 2
               WHEN play_type = '3PT_MADE' AND is_opponent THEN 3
               WHEN play_type = 'FT_MADE'  AND is_opponent THEN 1
               ELSE 0 END) AS them_pts
    FROM public.game_plays
    WHERE event_id = p_event_id AND NOT is_voided
    GROUP BY period
    ORDER BY period
  ) q;
$$;

GRANT EXECUTE ON FUNCTION public.derive_quarter_scores(uuid) TO authenticated;
