-- supabase/tests/g4_money_path.sql
--
-- G4 MONEY-PATH + ANON-FLOW ACCEPTANCE FIXTURE (on-demand, rollback-only).
-- Ratified mechanism: F-G4-MECH option (A) — server-side SQL, NOT vitest (CI has
-- dummy Supabase creds + no pg + no client-side txns). Run via Supabase MCP
-- execute_sql (or psql). The whole run is ONE transaction that ALWAYS ends in a
-- RAISE, so NOTHING persists — re-runnable any time. Asserts fail loud (RAISE
-- with the failing value). A success run ends with 'G4_PASS …'; any failure ends
-- with 'G4_FAIL <case>: …'.
--
-- PRE-B0 FORM (this file): the registration_fees<->family_balances reconciliation
-- (PR-B0) is NOT built yet, so T1 asserts:
--   authoritative_total_cents == sum(registration_fees)   AND
--   family_balances UNCHANGED (no financial_accounts row created by a registration)
-- documenting the disconnect F-B1-MONEY surfaced. After PR-B0 lands, the
-- family_balances-delta clause is restored (see the POST-B0 note at T1).
--
-- Contract (D-G4, ratified + strengthened): T1 money, T1b multi-child family-cap,
-- T1c duplicate no-double-bill, T2 grade band, T2b window/status gates,
-- T3 get_public_program shape, T3b anon-execute.

DO $$
DECLARE
  v_org      uuid := 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';  -- Legacy Hoopers
  v_uniq     text := replace(gen_random_uuid()::text, '-', '');
  v_prog     uuid; v_prog_closed uuid; v_prog_draft uuid;
  v_div      uuid;
  v_slug     text := 'g4-' || left(v_uniq, 12);
  v_slug_dft text := 'g4d-' || left(v_uniq, 12);
  v_res      jsonb; v_res2 jsonb;
  v_gid      uuid; v_fee_sum bigint; v_reg_count int; v_acct_count int;
  v_total    bigint; v_disc bigint;
  v_pub      jsonb; v_caught text;
BEGIN
  -- ── seed: a published+active program with an open window + one division + fees ──
  INSERT INTO programs (org_id, name, program_type, status, is_published, public_slug,
                        reg_opens_at, reg_closes_at, start_date, end_date)
    VALUES (v_org, 'G4 Test Camp', 'camp', 'active', true, v_slug,
            now() - interval '1 day', now() + interval '30 days',
            current_date, current_date + 60)
    RETURNING id INTO v_prog;
  INSERT INTO divisions (org_id, program_id, name, grade_min, grade_max, sort_order)
    VALUES (v_org, v_prog, 'G4 Div 3-5', 3, 5, 1) RETURNING id INTO v_div;
  INSERT INTO division_fees (org_id, division_id, name, fee_type, amount_cents, sort_order)
    VALUES (v_org, v_div, 'Base',    'base',   8000, 1),
           (v_org, v_div, 'Uniform', 'add_on', 2000, 2);
  -- a CLOSED-window program + a DRAFT(unpublished) program for T2b
  INSERT INTO programs (org_id, name, program_type, status, is_published, public_slug,
                        reg_opens_at, reg_closes_at)
    VALUES (v_org, 'G4 Closed', 'camp', 'active', true, 'g4c-'||left(v_uniq,12),
            now() - interval '10 days', now() - interval '1 day')
    RETURNING id INTO v_prog_closed;
  INSERT INTO programs (org_id, name, program_type, status, is_published, public_slug)
    VALUES (v_org, 'G4 Draft', 'camp', 'draft', false, v_slug_dft)
    RETURNING id INTO v_prog_draft;

  -- ─────────────────────────── T1: single-child money path ───────────────────────────
  v_res := submit_registration(jsonb_build_object(
    'program_id', v_prog,
    'guardian', jsonb_build_object('first_name','G4','last_name','One',
                'email', 't1-'||v_uniq||'@g4.test'),
    'children', jsonb_build_array(jsonb_build_object(
      'player', jsonb_build_object('first_name','Kid','last_name','One','grade','4'),
      'division_id', v_div, 'details', '{}'::jsonb))));
  v_gid   := (v_res->>'guardian_id')::uuid;
  v_total := (v_res->>'authoritative_total_cents')::bigint;
  SELECT COALESCE(sum(rf.amount_cents),0) INTO v_fee_sum
    FROM registration_fees rf
    WHERE rf.registration_id = ANY (ARRAY(SELECT jsonb_array_elements_text(v_res->'registration_ids')::uuid));
  IF v_total <> 10000 THEN RAISE EXCEPTION 'G4_FAIL T1: authoritative_total expected 10000 got %', v_total; END IF;
  IF v_fee_sum <> v_total THEN RAISE EXCEPTION 'G4_FAIL T1: sum(registration_fees) % <> authoritative_total %', v_fee_sum, v_total; END IF;
  -- family_balances UNCHANGED (pre-B0): a registration creates no financial_accounts row.
  -- POST-B0: replace this with balance delta == v_total for (org, v_gid, v_prog).
  SELECT count(*) INTO v_acct_count FROM financial_accounts
    WHERE org_id = v_org AND guardian_id = v_gid AND season_id = v_prog;
  IF v_acct_count <> 0 THEN RAISE EXCEPTION 'G4_FAIL T1: pre-B0 expected 0 financial_accounts, got % (B0 may be live — switch to the delta assert)', v_acct_count; END IF;

  -- ───────────────────── T1b: multi-child family-cap discount (one submit) ─────────────────────
  -- needs an enabled policy (LH's is null); set it in-txn (rolled back).
  UPDATE organizations SET family_cap_policy = '{"enabled":true,"per_extra_child_cents":1000}'::jsonb
    WHERE id = v_org;
  v_res2 := submit_registration(jsonb_build_object(
    'program_id', v_prog,
    'guardian', jsonb_build_object('first_name','G4','last_name','Cap',
                'email', 't1b-'||v_uniq||'@g4.test'),
    'children', jsonb_build_array(
      jsonb_build_object('player', jsonb_build_object('first_name','Cap','last_name','A','grade','4'),
        'division_id', v_div, 'details', '{}'::jsonb),
      jsonb_build_object('player', jsonb_build_object('first_name','Cap','last_name','B','grade','5'),
        'division_id', v_div, 'details', '{}'::jsonb))));
  v_disc  := (v_res2->>'discount_cents')::bigint;
  v_total := (v_res2->>'authoritative_total_cents')::bigint;
  IF v_disc <> 1000 THEN RAISE EXCEPTION 'G4_FAIL T1b: family-cap discount expected 1000 got % (the D-Q7 one-submit fix — cap must fire on a single multi-child call)', v_disc; END IF;
  IF v_total <> (2*10000 - 1000) THEN RAISE EXCEPTION 'G4_FAIL T1b: total expected 19000 got %', v_total; END IF;
  UPDATE organizations SET family_cap_policy = NULL WHERE id = v_org;  -- restore (also rolled back)

  -- ───────────────────── T1c: duplicate submit, no double-bill ─────────────────────
  -- re-submit the SAME (program, player) as T1's child One -> already_registered, no 2nd reg/fee.
  v_res2 := submit_registration(jsonb_build_object(
    'program_id', v_prog,
    'guardian', jsonb_build_object('first_name','G4','last_name','One',
                'email', 't1-'||v_uniq||'@g4.test'),
    'children', jsonb_build_array(jsonb_build_object(
      'player', jsonb_build_object('first_name','Kid','last_name','One','grade','4'),
      'division_id', v_div, 'details', '{}'::jsonb))));
  IF jsonb_array_length(v_res2->'already_registered') <> 1 THEN
    RAISE EXCEPTION 'G4_FAIL T1c: expected already_registered=[1], got %', v_res2->'already_registered'; END IF;
  IF jsonb_array_length(v_res2->'registration_ids') <> 0 THEN
    RAISE EXCEPTION 'G4_FAIL T1c: duplicate submit created % new registration(s) (double-bill)', jsonb_array_length(v_res2->'registration_ids'); END IF;
  SELECT count(*) INTO v_reg_count FROM registrations r
    WHERE r.program_id = v_prog AND r.player_id IN (
      SELECT id FROM players WHERE org_id=v_org AND lower(first_name)='kid' AND lower(last_name)='one')
      AND r.status <> 'cancelled';
  IF v_reg_count <> 1 THEN RAISE EXCEPTION 'G4_FAIL T1c: expected exactly 1 live reg for the dup player, got %', v_reg_count; END IF;

  -- ───────────────────── T2: grade band rejection ─────────────────────
  BEGIN
    PERFORM submit_registration(jsonb_build_object(
      'program_id', v_prog,
      'guardian', jsonb_build_object('first_name','G4','last_name','Grade','email','t2-'||v_uniq||'@g4.test'),
      'children', jsonb_build_array(jsonb_build_object(
        'player', jsonb_build_object('first_name','Too','last_name','Young','grade','1'),
        'division_id', v_div, 'details', '{}'::jsonb))));
    RAISE EXCEPTION 'G4_FAIL T2: grade 1 into a 3-5 division did NOT raise grade_below_band';
  EXCEPTION
    WHEN others THEN
      GET STACKED DIAGNOSTICS v_caught = MESSAGE_TEXT;
      IF v_caught <> 'grade_below_band' THEN RAISE EXCEPTION 'G4_FAIL T2: expected grade_below_band got "%"', v_caught; END IF;
  END;

  -- ───────────────────── T2b: window + status/publish gates ─────────────────────
  BEGIN
    PERFORM submit_registration(jsonb_build_object('program_id', v_prog_closed,
      'guardian', jsonb_build_object('first_name','G4','last_name','Closed','email','t2bc-'||v_uniq||'@g4.test'),
      'children', jsonb_build_array(jsonb_build_object(
        'player', jsonb_build_object('first_name','C','last_name','C','grade','4'),
        'division_id', v_div, 'details', '{}'::jsonb))));
    RAISE EXCEPTION 'G4_FAIL T2b: closed-window program did NOT reject';
  EXCEPTION WHEN others THEN
    GET STACKED DIAGNOSTICS v_caught = MESSAGE_TEXT;
    IF v_caught <> 'registration_closed' THEN RAISE EXCEPTION 'G4_FAIL T2b(closed): expected registration_closed got "%"', v_caught; END IF;
  END;
  BEGIN
    PERFORM submit_registration(jsonb_build_object('program_id', v_prog_draft,
      'guardian', jsonb_build_object('first_name','G4','last_name','Draft','email','t2bd-'||v_uniq||'@g4.test'),
      'children', jsonb_build_array(jsonb_build_object(
        'player', jsonb_build_object('first_name','D','last_name','D','grade','4'),
        'division_id', v_div, 'details', '{}'::jsonb))));
    RAISE EXCEPTION 'G4_FAIL T2b: draft/unpublished program did NOT reject';
  EXCEPTION WHEN others THEN
    GET STACKED DIAGNOSTICS v_caught = MESSAGE_TEXT;
    IF v_caught <> 'registration_closed' THEN RAISE EXCEPTION 'G4_FAIL T2b(draft): expected registration_closed got "%"', v_caught; END IF;
  END;

  -- ───────────────────── T3: get_public_program shape ─────────────────────
  v_pub := get_public_program(v_slug);
  IF v_pub IS NULL OR (v_pub->'program'->>'id') <> v_prog::text THEN
    RAISE EXCEPTION 'G4_FAIL T3: get_public_program did not return the published program'; END IF;
  IF jsonb_array_length(v_pub->'divisions') <> 1 THEN
    RAISE EXCEPTION 'G4_FAIL T3: expected 1 division, got %', jsonb_array_length(v_pub->'divisions'); END IF;
  IF (v_pub->'divisions'->0->>'base_fee_cents')::bigint <> 8000 THEN
    RAISE EXCEPTION 'G4_FAIL T3: base_fee_cents expected 8000 got %', v_pub->'divisions'->0->>'base_fee_cents'; END IF;
  IF get_public_program(v_slug_dft) IS NOT NULL THEN
    RAISE EXCEPTION 'G4_FAIL T3: a draft/unpublished slug must return null (status=active gate)'; END IF;

  -- ───────────────────── T3b: anon can execute both public RPCs ─────────────────────
  SET LOCAL ROLE anon;
  BEGIN
    PERFORM get_public_program(v_slug);
    PERFORM submit_registration(jsonb_build_object('program_id', v_prog,
      'guardian', jsonb_build_object('first_name','G4','last_name','Anon','email','t3b-'||v_uniq||'@g4.test'),
      'children', jsonb_build_array(jsonb_build_object(
        'player', jsonb_build_object('first_name','An','last_name','On','grade','4'),
        'division_id', v_div, 'details', '{}'::jsonb))));
  EXCEPTION WHEN insufficient_privilege THEN
    RESET ROLE;
    RAISE EXCEPTION 'G4_FAIL T3b: anon cannot execute a public RPC (botched anon grant) — %', SQLERRM;
  END;
  RESET ROLE;

  -- ── all green → RAISE to roll everything back (always-RAISE, zero persistence) ──
  RAISE EXCEPTION 'G4_PASS T1 T1b T1c T2 T2b T3 T3b (pre-B0: family_balances unchanged, asserted disconnect)';
END $$;
