-- H-1 — submit_registration write-half hardening (F-REG-STATUS-GATE + C-4).
-- Three edits vs the prior body, everything else byte-identical:
--   (1) program-resolve WHERE: + AND status = 'active' (no anon reg into a
--       draft/archived program — pairs with the get_public_program read gate).
--   (2) dedupe SELECT: + AND status <> 'cancelled' (a cancelled player IS
--       re-registerable — matches the partial unique index from S3).
--   (3) registrations INSERT: ON CONFLICT (program_id, player_id) WHERE status
--       <> 'cancelled' DO NOTHING + race-loser short-circuit (concurrent
--       double-submit maps to already_registered instead of a raw 23505).
-- Authored + applied by the architect via MCP 2026-06-09; AP#21 mirror (the
-- exact as-applied body re-dumped via pg_get_functiondef). Verified live: all
-- three edits present, ON CONFLICT predicate matches the index, SECDEF intact.
CREATE OR REPLACE FUNCTION public.submit_registration(p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_in_program  uuid := NULLIF(p_payload->>'program_id','')::uuid;
  v_program_id  uuid;
  v_org_id      uuid;
  v_now         timestamptz := now();
  v_g           jsonb := p_payload->'guardian';
  v_cog         jsonb := p_payload->'co_guardian';
  v_children    jsonb := p_payload->'children';
  v_guardian_id uuid;
  v_cog_id      uuid;
  v_child       jsonb;
  v_player_id   uuid;
  v_div         divisions%ROWTYPE;
  v_reg_id      uuid;
  v_grade       int;
  v_total_cents bigint := 0;
  v_child_fee   bigint;
  v_reg_ids     uuid[] := '{}';
  v_already     text[] := '{}';
  v_policy      jsonb;
  v_discount    bigint := 0;
  v_paid        int := 0;
  v_email       text := lower(trim(v_g->>'email'));
BEGIN
  -- resolve program: must be published + active + inside the registration window
  SELECT id, org_id INTO v_program_id, v_org_id FROM programs
   WHERE (id = v_in_program OR public_slug = p_payload->>'program_slug')
     AND is_published = true
     AND status = 'active'
     AND v_now >= COALESCE(reg_opens_at,'-infinity'::timestamptz)
     AND v_now <  COALESCE(reg_closes_at,'infinity'::timestamptz)
   LIMIT 1;
  IF v_program_id IS NULL THEN RAISE EXCEPTION 'registration_closed'; END IF;

  IF v_children IS NULL OR jsonb_typeof(v_children) <> 'array'
     OR jsonb_array_length(v_children) = 0 THEN RAISE EXCEPTION 'no_children'; END IF;
  IF jsonb_array_length(v_children) > 10 THEN RAISE EXCEPTION 'too_many_children'; END IF;
  IF v_email IS NULL OR v_email = '' THEN RAISE EXCEPTION 'guardian_email_required'; END IF;

  -- primary guardian upsert (email is globally UNIQUE)
  INSERT INTO guardians (org_id, first_name, last_name, email, phone)
    VALUES (v_org_id, v_g->>'first_name', v_g->>'last_name', v_email, v_g->>'phone')
  ON CONFLICT (email) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, guardians.first_name),
    last_name  = COALESCE(EXCLUDED.last_name,  guardians.last_name),
    phone      = COALESCE(EXCLUDED.phone,      guardians.phone),
    updated_at = now()
  RETURNING id INTO v_guardian_id;

  -- optional co-guardian
  IF v_cog IS NOT NULL AND jsonb_typeof(v_cog)='object' AND COALESCE(v_cog->>'first_name','') <> '' THEN
    IF COALESCE(lower(trim(v_cog->>'email')),'') <> '' THEN
      INSERT INTO guardians (org_id, first_name, last_name, email, phone)
        VALUES (v_org_id, v_cog->>'first_name', v_cog->>'last_name', lower(trim(v_cog->>'email')), v_cog->>'phone')
      ON CONFLICT (email) DO UPDATE SET phone = COALESCE(EXCLUDED.phone, guardians.phone), updated_at=now()
      RETURNING id INTO v_cog_id;
    ELSE
      INSERT INTO guardians (org_id, first_name, last_name, phone)
        VALUES (v_org_id, v_cog->>'first_name', v_cog->>'last_name', v_cog->>'phone')
      RETURNING id INTO v_cog_id;
    END IF;
  END IF;

  SELECT family_cap_policy INTO v_policy FROM organizations WHERE id = v_org_id;

  FOR v_child IN SELECT * FROM jsonb_array_elements(v_children)
  LOOP
    SELECT * INTO v_div FROM divisions
      WHERE id = NULLIF(v_child->>'division_id','')::uuid AND program_id = v_program_id;
    IF v_div.id IS NULL THEN RAISE EXCEPTION 'invalid_division'; END IF;

    v_grade := NULLIF(v_child->'player'->>'grade','')::int;
    IF v_div.grade_min IS NOT NULL AND v_grade IS NOT NULL AND v_grade < v_div.grade_min THEN
      RAISE EXCEPTION 'grade_below_band'; END IF;
    IF v_div.grade_max IS NOT NULL AND v_grade IS NOT NULL AND v_grade > v_div.grade_max THEN
      RAISE EXCEPTION 'grade_above_band'; END IF;

    -- dedupe-or-create player (org + name + dob)
    SELECT id INTO v_player_id FROM players
      WHERE org_id = v_org_id
        AND lower(first_name) = lower(v_child->'player'->>'first_name')
        AND lower(last_name)  = lower(v_child->'player'->>'last_name')
        AND dob IS NOT DISTINCT FROM NULLIF(v_child->'player'->>'dob','')::date
      LIMIT 1;
    IF v_player_id IS NULL THEN
      INSERT INTO players (org_id, first_name, last_name, dob, grade, member_type)
        VALUES (v_org_id, v_child->'player'->>'first_name', v_child->'player'->>'last_name',
                NULLIF(v_child->'player'->>'dob','')::date, v_grade, 'roster')
      RETURNING id INTO v_player_id;
    END IF;

    INSERT INTO player_guardians (player_id, guardian_id, relationship, is_primary)
      VALUES (v_player_id, v_guardian_id, COALESCE(v_g->>'relationship','parent'), true)
    ON CONFLICT (player_id, guardian_id) DO NOTHING;
    IF v_cog_id IS NOT NULL THEN
      INSERT INTO player_guardians (player_id, guardian_id, relationship, is_primary)
        VALUES (v_player_id, v_cog_id, COALESCE(v_cog->>'relationship','parent'), false)
      ON CONFLICT (player_id, guardian_id) DO NOTHING;
    END IF;

    -- already registered for this program? skip dupe (cancelled is re-registerable)
    SELECT id INTO v_reg_id FROM registrations
      WHERE program_id = v_program_id AND player_id = v_player_id
        AND status <> 'cancelled' LIMIT 1;
    IF v_reg_id IS NOT NULL THEN
      v_already := v_already || (v_child->'player'->>'first_name'); CONTINUE;
    END IF;

    INSERT INTO registrations (org_id, program_id, player_id, status, registration_tier, waitlist_state,
        sms_opt_in_p1, sms_opt_in_p2, emergency_contact_name, emergency_contact_phone,
        emergency_contact_relationship, secondary_contact_name, secondary_contact_phone,
        medical_notes, custom_responses)
      VALUES (v_org_id, v_program_id, v_player_id, 'pending', 'full_roster', 'none',
        COALESCE((v_g->>'sms_opt_in')::boolean,false), COALESCE((v_cog->>'sms_opt_in')::boolean,false),
        v_child->'details'->>'emergency_contact_name', v_child->'details'->>'emergency_contact_phone',
        v_child->'details'->>'emergency_contact_relationship', v_child->'details'->>'secondary_contact_name',
        v_child->'details'->>'secondary_contact_phone', v_child->'details'->>'medical_notes',
        CASE WHEN v_child->'details'->'custom_responses' IS NOT NULL
             THEN v_child->'details'->'custom_responses' ELSE NULL END)
      ON CONFLICT (program_id, player_id) WHERE status <> 'cancelled' DO NOTHING
      RETURNING id INTO v_reg_id;
    IF v_reg_id IS NULL THEN
      v_already := v_already || (v_child->'player'->>'first_name'); CONTINUE;
    END IF;

    INSERT INTO registration_fees (org_id, registration_id, fee_id, fee_type, amount_cents)
      SELECT v_org_id, v_reg_id, df.id, df.fee_type, df.amount_cents
      FROM division_fees df WHERE df.division_id = v_div.id AND df.fee_type IN ('base','add_on');
    SELECT COALESCE(sum(amount_cents),0) INTO v_child_fee FROM registration_fees WHERE registration_id = v_reg_id;

    IF COALESCE(v_child->'details'->>'jersey_size','') <> '' OR COALESCE(v_child->'details'->>'shorts_size','') <> '' THEN
      IF NOT EXISTS (SELECT 1 FROM player_equipment WHERE player_id=v_player_id AND season_id=v_program_id) THEN
        INSERT INTO player_equipment (org_id, player_id, season_id, jersey_size, shorts_size, status)
          VALUES (v_org_id, v_player_id, v_program_id,
                  NULLIF(v_child->'details'->>'jersey_size',''), NULLIF(v_child->'details'->>'shorts_size',''), 'needed');
      END IF;
    END IF;

    v_reg_ids := v_reg_ids || v_reg_id;
    v_total_cents := v_total_cents + v_child_fee;
    v_paid := v_paid + 1;
  END LOOP;

  -- family-cap discount: no-op when policy null (LH pilot). Shape {enabled, per_extra_child_cents}.
  IF v_policy IS NOT NULL AND COALESCE((v_policy->>'enabled')::boolean,false) AND v_paid > 1 THEN
    v_discount := LEAST((v_paid - 1) * COALESCE((v_policy->>'per_extra_child_cents')::bigint,0), v_total_cents);
    IF v_discount > 0 THEN
      INSERT INTO registration_fees (org_id, registration_id, fee_id, fee_type, amount_cents)
        VALUES (v_org_id, v_reg_ids[1], NULL, 'family_discount', -v_discount);
      v_total_cents := v_total_cents - v_discount;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'guardian_id', v_guardian_id,
    'registration_ids', to_jsonb(v_reg_ids),
    'authoritative_total_cents', v_total_cents,
    'discount_cents', v_discount,
    'already_registered', to_jsonb(v_already)
  );
END $function$;
