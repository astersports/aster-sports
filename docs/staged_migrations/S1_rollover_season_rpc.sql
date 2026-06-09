-- STAGED — NOT APPLIED. S1 / FORK-ROLLOVER-RPC (rebuild season rollover atomic).
-- Ratified (all 5 parts) by the architect 2026-06-08. This is a faithful DRAFT;
-- the architect pre-flights before apply. Grounded live (2026-06-08):
--   * `seasons` is a VIEW (relkind='v') over base table `programs` -> this RPC
--     writes `programs` directly. View col `parent_season_id` == base
--     `parent_program_id`. programs NOT-NULL-no-default cols = (org_id, name);
--     status/program_type are defaulted (we set status='draft' explicitly).
--   * current_user_org_ids() EXISTS (plural) -> used for the org assert (Q-C).
--   * roster_members has NO roster_type column -> omitted (part c).
--   * programs_status_check allows {active,draft,archived} -> 'draft' valid (part a).
--
-- OPEN DECISION POINTS (architect rules before apply):
--   Q-A (a vs e tension): new season is created 'draft'. The OPTIONAL activation
--       block (gated on p_plan->>'activate') is included per ratified part (e) —
--       confirm whether rollover auto-activates or stays draft-only. As written:
--       draft by default; activate only if plan.activate=true.
--   Q-B financial-carry: clean-slate (0 cents; CC lean). family_balances already
--       spans seasons.
--   Q-C org assert: current_user_org_ids() inline. Alternative: assert_org_owns_*
--       SECDEF helper (AP#57).

CREATE OR REPLACE FUNCTION public.rollover_season(
  p_from_season_id uuid,
  p_plan           jsonb
) RETURNS season_rollovers
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_org_id uuid; v_sport_id uuid; v_new_season uuid; v_new_team uuid;
  v_carried int := 0; v_advanced int := 0; v_dropped int := 0;
  v_coaches int := 0; v_teams int := 0;
  v_row season_rollovers; t jsonb; p jsonb; c jsonb;
BEGIN
  -- org-ownership assert (Q-C): caller's org cohort must own the source season
  SELECT org_id, sport_id INTO v_org_id, v_sport_id FROM programs WHERE id = p_from_season_id;
  IF v_org_id IS NULL OR NOT (v_org_id = ANY (current_user_org_ids())) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- (a) new season as DRAFT, lineage set (base table; parent_program_id alias)
  INSERT INTO programs (org_id, sport_id, program_type, parent_program_id,
                        name, start_date, end_date, status)
    VALUES (v_org_id, v_sport_id, 'season', p_from_season_id,
            p_plan->>'newSeasonName',
            NULLIF(p_plan->>'startDate','')::date, NULLIF(p_plan->>'endDate','')::date,
            'draft')
    RETURNING id INTO v_new_season;

  -- carry season_locations (optional, default true)
  IF COALESCE((p_plan->>'carryLocations')::boolean, true) THEN
    INSERT INTO season_locations (season_id, location_id)
      SELECT v_new_season, location_id FROM season_locations WHERE season_id = p_from_season_id;
  END IF;

  -- recreate teams (b: carry team_type_id) + roster (c: no roster_type) + staff
  FOR t IN SELECT * FROM jsonb_array_elements(COALESCE(p_plan->'teams','[]'::jsonb)) LOOP
    INSERT INTO teams (org_id, season_id, name, team_color, sort_order,
                       age_group, division, circuit, team_type_id)
      VALUES (v_org_id, v_new_season, t->>'name', t->>'team_color',
              NULLIF(t->>'sort_order','')::int, t->>'age_group', t->>'division',
              COALESCE(t->>'circuit','aau'),
              (SELECT team_type_id FROM teams WHERE id = (t->>'src_team_id')::uuid))
      RETURNING id INTO v_new_team;
    v_teams := v_teams + 1;

    FOR p IN SELECT * FROM jsonb_array_elements(COALESCE(t->'players','[]'::jsonb)) LOOP
      IF p->>'action' = 'drop' THEN v_dropped := v_dropped + 1; CONTINUE; END IF;
      INSERT INTO roster_members (team_id, player_id, registered_at)   -- (c) no roster_type
        VALUES (v_new_team, (p->>'id')::uuid, now());
      v_carried := v_carried + 1;
      IF p->>'action' = 'advance' THEN v_advanced := v_advanced + 1; END IF;
    END LOOP;

    FOR c IN SELECT * FROM jsonb_array_elements(COALESCE(t->'coaches','[]'::jsonb)) LOOP
      IF COALESCE((c->>'keep')::boolean, false) THEN
        INSERT INTO team_staff (team_id, user_id, role)
          VALUES (v_new_team, (c->>'user_id')::uuid, c->>'role');
        v_coaches := v_coaches + 1;
      END IF;
    END LOOP;
  END LOOP;

  -- archive the source season
  UPDATE programs SET status='archived', rolled_over_at=now() WHERE id = p_from_season_id;

  -- (e) OPTIONAL activate-in-txn (Q-A): archive the org's other active season of
  -- the same type, then activate the new one — atomic, so the single-active
  -- partial index never sees 0 or 2. Gated on plan.activate (default false=draft).
  IF COALESCE((p_plan->>'activate')::boolean, false) THEN
    UPDATE programs SET status='archived'
      WHERE org_id = v_org_id AND program_type='season' AND status='active' AND id <> v_new_season;
    UPDATE programs SET status='active' WHERE id = v_new_season;
  END IF;

  -- (d) audit row, same txn
  INSERT INTO season_rollovers (from_season_id, to_season_id, org_id, initiated_by,
      players_carried, players_advanced_age, players_dropped, coaches_carried,
      teams_recreated, financial_balances_carried_cents, status, completed_at)
    VALUES (p_from_season_id, v_new_season, v_org_id, auth.uid(),
      v_carried, v_advanced, v_dropped, v_coaches, v_teams,
      0 /* Q-B clean-slate */, 'complete', now())
    RETURNING * INTO v_row;

  RETURN v_row;
END $$;

-- doctrine grants (AP#23/#57): revoke PUBLIC + anon explicitly, grant authenticated
REVOKE EXECUTE ON FUNCTION public.rollover_season(uuid,jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rollover_season(uuid,jsonb) FROM anon;
GRANT  EXECUTE ON FUNCTION public.rollover_season(uuid,jsonb) TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname='rollover_season') THEN
    RAISE EXCEPTION 'verify failed: rollover_season not created';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.routine_privileges
        WHERE routine_name='rollover_season' AND grantee='anon') THEN
    RAISE EXCEPTION 'verify failed: anon still holds EXECUTE on rollover_season';
  END IF;
END $$;

-- COMPANION (separate build PR — NOT this migration): useSeasonRollover.js collapses
-- to one supabase.rpc('rollover_season', { p_from_season_id, p_plan }); plan.teams[]
-- gains src_team_id (SeasonRolloverPage already selects '*', so team_type_id is in hand).
