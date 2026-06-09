-- F-REG-STATUS-GATE (Tier-0, read half) — gate the public program read on
-- status='active', not is_published alone. Closes P0-NEW-2 (a published draft/
-- archived program was anon-registerable; is_published and status are orthogonal).
-- The only change vs the prior definition is the trailing `AND p.status = 'active'`.
-- Applied by the architect via MCP 2026-06-09; AP#21 mirror (exact CREATE OR REPLACE
-- re-dumped via pg_get_functiondef). Pre-flight: 0 published non-active programs, so
-- zero happy-path change today. The WRITE half (submit_registration status gate +
-- C-4 ON CONFLICT) is H-1, held for the architect's next GO.
CREATE OR REPLACE FUNCTION public.get_public_program(p_slug text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'program', jsonb_build_object(
      'id', p.id, 'name', p.name, 'program_type', p.program_type,
      'start_date', p.start_date, 'end_date', p.end_date,
      'reg_opens_at', p.reg_opens_at, 'reg_closes_at', p.reg_closes_at,
      'org_id', p.org_id, 'org_name', o.name, 'org_logo_url', o.logo_url, 'brand_colors', o.brand_colors
    ),
    'registration_open', (now() >= COALESCE(p.reg_opens_at,'-infinity'::timestamptz)
                          AND now() < COALESCE(p.reg_closes_at,'infinity'::timestamptz)),
    'divisions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', d.id, 'name', d.name, 'grade_min', d.grade_min, 'grade_max', d.grade_max,
        'gender', d.gender, 'team_color', d.team_color,
        'base_fee_cents', COALESCE((SELECT sum(df.amount_cents) FROM division_fees df
                                    WHERE df.division_id=d.id AND df.fee_type='base'),0),
        'fees', COALESCE((SELECT jsonb_agg(jsonb_build_object('id',df.id,'name',df.name,
                                   'fee_type',df.fee_type,'amount_cents',df.amount_cents) ORDER BY df.sort_order)
                          FROM division_fees df WHERE df.division_id=d.id AND df.fee_type IN ('base','add_on')),'[]'::jsonb)
      ) ORDER BY d.sort_order)
      FROM divisions d WHERE d.program_id = p.id), '[]'::jsonb)
  )
  FROM programs p JOIN organizations o ON o.id = p.org_id
  WHERE p.public_slug = p_slug AND p.is_published = true AND p.status = 'active';
$function$;
