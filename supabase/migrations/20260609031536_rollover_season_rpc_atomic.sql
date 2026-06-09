-- H-2 / FORK-ROLLOVER-RPC — atomic season rollover as one SECDEF function.
-- Authored in the architect lane (Rule 7) from CC's staged reference + live schema
-- verification; applied via MCP 2026-06-09. AP#21 mirror (verbatim canonical SQL).
-- Fixes the broken client rollover: status 'draft' (not 'planning' 23514); no
-- roster_type (42703); team_type_id carried forward (makes H-3 safe); atomic incl.
-- the season_rollovers audit row; plan-gated activate-in-txn. Corrections over the
-- staged draft: team fields COALESCE plan-over-source (v_src) so an omitted/explicit-
-- NULL age_group/sort_order/gender doesn't fail NOT NULL; team_feed_token/issued_at
-- omitted intentionally (per-row defaults gen_random_uuid()::text / now() -> fresh
-- unique tokens); team_staff.role COALESCE to 'assistant_coach' (NN + CHECK).
-- Decisions: activate plan-gated default-draft; clean-slate financial carry (0);
-- inline current_user_org_ids() assert; 'advance' is an audit count only (no in-txn
-- grade mutation). Supersedes docs/staged_migrations/S1_rollover_season_rpc.sql.
CREATE OR REPLACE FUNCTION public.rollover_season(
  p_from_season_id uuid,
  p_plan           jsonb
) RETURNS season_rollovers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_org_id    uuid;
  v_sport_id  uuid;
  v_new_season uuid;
  v_new_team  uuid;
  v_src       teams%ROWTYPE;
  v_carried   int := 0;
  v_advanced  int := 0;
  v_dropped   int := 0;
  v_coaches   int := 0;
  v_teams     int := 0;
  v_row       season_rollovers;
  t jsonb; p jsonb; c jsonb;
BEGIN
  SELECT org_id, sport_id INTO v_org_id, v_sport_id
    FROM programs WHERE id = p_from_season_id;
  IF v_org_id IS NULL OR NOT (v_org_id = ANY (current_user_org_ids())) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  INSERT INTO programs (org_id, sport_id, program_type, parent_program_id,
                        name, start_date, end_date, status, is_published)
    VALUES (v_org_id, v_sport_id, 'season', p_from_season_id,
            COALESCE(NULLIF(p_plan->>'newSeasonName',''), 'Rolled Season'),
            NULLIF(p_plan->>'startDate','')::date, NULLIF(p_plan->>'endDate','')::date,
            'draft', false)
    RETURNING id INTO v_new_season;

  IF COALESCE((p_plan->>'carryLocations')::boolean, true) THEN
    INSERT INTO season_locations (season_id, location_id)
      SELECT v_new_season, location_id FROM season_locations WHERE season_id = p_from_season_id;
  END IF;

  FOR t IN SELECT * FROM jsonb_array_elements(COALESCE(p_plan->'teams','[]'::jsonb)) LOOP
    SELECT * INTO v_src FROM teams WHERE id = NULLIF(t->>'src_team_id','')::uuid;
    INSERT INTO teams (org_id, season_id, name, team_color, sort_order,
                       age_group, division, circuit, gender, team_type_id)
      VALUES (v_org_id, v_new_season,
              COALESCE(NULLIF(t->>'name',''),        v_src.name),
              COALESCE(NULLIF(t->>'team_color',''),  v_src.team_color),
              COALESCE(NULLIF(t->>'sort_order','')::int, v_src.sort_order, 0),
              COALESCE(NULLIF(t->>'age_group',''),   v_src.age_group),
              COALESCE(NULLIF(t->>'division',''),    v_src.division),
              COALESCE(NULLIF(t->>'circuit',''),     v_src.circuit, 'aau'),
              COALESCE(NULLIF(t->>'gender',''),      v_src.gender),
              v_src.team_type_id)
      RETURNING id INTO v_new_team;
    v_teams := v_teams + 1;

    FOR p IN SELECT * FROM jsonb_array_elements(COALESCE(t->'players','[]'::jsonb)) LOOP
      IF p->>'action' = 'drop' THEN v_dropped := v_dropped + 1; CONTINUE; END IF;
      INSERT INTO roster_members (team_id, player_id, registered_at)
        VALUES (v_new_team, (p->>'id')::uuid, now());
      v_carried := v_carried + 1;
      IF p->>'action' = 'advance' THEN v_advanced := v_advanced + 1; END IF;
    END LOOP;

    FOR c IN SELECT * FROM jsonb_array_elements(COALESCE(t->'coaches','[]'::jsonb)) LOOP
      IF COALESCE((c->>'keep')::boolean, false) THEN
        INSERT INTO team_staff (team_id, user_id, role)
          VALUES (v_new_team, (c->>'user_id')::uuid,
                  COALESCE(NULLIF(c->>'role',''), 'assistant_coach'));
        v_coaches := v_coaches + 1;
      END IF;
    END LOOP;
  END LOOP;

  UPDATE programs SET status='archived', rolled_over_at=now() WHERE id = p_from_season_id;

  IF COALESCE((p_plan->>'activate')::boolean, false) THEN
    UPDATE programs SET status='archived'
      WHERE org_id = v_org_id AND program_type='season' AND status='active' AND id <> v_new_season;
    UPDATE programs SET status='active' WHERE id = v_new_season;
  END IF;

  INSERT INTO season_rollovers (from_season_id, to_season_id, org_id, initiated_by,
      players_carried, players_advanced_age, players_dropped, coaches_carried,
      teams_recreated, financial_balances_carried_cents, status, completed_at)
    VALUES (p_from_season_id, v_new_season, v_org_id, auth.uid(),
      v_carried, v_advanced, v_dropped, v_coaches, v_teams,
      0, 'complete', now())
    RETURNING * INTO v_row;

  RETURN v_row;
END
$function$;

REVOKE EXECUTE ON FUNCTION public.rollover_season(uuid,jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rollover_season(uuid,jsonb) FROM anon;
GRANT  EXECUTE ON FUNCTION public.rollover_season(uuid,jsonb) TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                 WHERE n.nspname='public' AND p.proname='rollover_season') THEN
    RAISE EXCEPTION 'verify failed: rollover_season not created';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.routine_privileges
             WHERE routine_schema='public' AND routine_name='rollover_season' AND grantee='anon') THEN
    RAISE EXCEPTION 'verify failed: anon still holds EXECUTE on rollover_season';
  END IF;
END $$;
