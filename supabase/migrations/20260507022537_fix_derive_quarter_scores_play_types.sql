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
      SUM(CASE WHEN play_type = 'fg2_made' AND NOT is_opponent THEN 2
               WHEN play_type = 'fg3_made' AND NOT is_opponent THEN 3
               WHEN play_type = 'ft_made'  AND NOT is_opponent THEN 1
               ELSE 0 END)::int AS us_pts,
      SUM(CASE WHEN play_type = 'fg2_made' AND is_opponent THEN 2
               WHEN play_type = 'fg3_made' AND is_opponent THEN 3
               WHEN play_type = 'ft_made'  AND is_opponent THEN 1
               ELSE 0 END)::int AS them_pts
    FROM public.game_plays
    WHERE event_id = p_event_id AND NOT is_voided
    GROUP BY period
    ORDER BY period
  ) q;
$$;
