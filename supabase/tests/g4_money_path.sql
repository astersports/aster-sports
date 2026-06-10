-- supabase/tests/g4_money_path.sql
--
-- G4 MONEY-PATH + ANON-FLOW ACCEPTANCE FIXTURE (on-demand, rollback-only).
-- Ratified mechanism: F-G4-MECH option (A) — server-side SQL, NOT vitest (CI has
-- dummy Supabase creds + no pg + no client-side txns). Run via Supabase MCP
-- execute_sql (or psql). The whole run is ONE transaction that ALWAYS ends in a
-- RAISE, so NOTHING persists — re-runnable any time. Asserts fail loud (RAISE
-- with the failing value). A success run ends with 'G4_PASS_POSTB0 …'.
--
-- POST-B0 FORM: PR-B0 (migration 20260610172425) made family_balances the single
-- source of "owes" for funnel registrations — submit_registration now posts an
-- append-only 'fee' financial_transaction per genuinely-new registration. So T1
-- asserts the family_balances BALANCE DELTA == authoritative_total_cents (not the
-- pre-B0 "unchanged"), and T1b asserts the account balance == 19000 across two fee
-- transactions. This fixture is B0's fail-loud acceptance test.
--
-- Contract (D-G4, ratified + strengthened): T1 money (+B0 ledger delta), T1b
-- multi-child family-cap (+account balance), T1c duplicate no-double-bill (+ledger
-- unchanged), T2 grade band, T2b window/status gates, T3 get_public_program shape,
-- T3b anon-execute.

DO $$
DECLARE
  v_org      uuid := 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';  -- Legacy Hoopers
  v_uniq     text := replace(gen_random_uuid()::text, '-', '');
  v_prog     uuid; v_prog_closed uuid; v_prog_draft uuid; v_div uuid;
  v_slug     text := 'g4-'  || left(v_uniq, 12);
  v_slug_dft text := 'g4d-' || left(v_uniq, 12);
  v_res jsonb; v_res2 jsonb;
  v_gid uuid; v_gid_cap uuid; v_total bigint; v_disc bigint;
  v_bal bigint; v_txn int; v_pub jsonb; v_caught text;
BEGIN
  -- seed: published+active program, open window, one division, base + add_on fees;
  -- program_type='camp' so the single-active-SEASON index allows it (RPCs are
  -- program_type-agnostic). Plus a closed-window + a draft program for T2b.
  INSERT INTO programs (org_id,name,program_type,status,is_published,public_slug,reg_opens_at,reg_closes_at,start_date,end_date)
    VALUES (v_org,'G4 Test Camp','camp','active',true,v_slug,now()-interval '1 day',now()+interval '30 days',current_date,current_date+60) RETURNING id INTO v_prog;
  INSERT INTO divisions (org_id,program_id,name,grade_min,grade_max,sort_order) VALUES (v_org,v_prog,'G4 Div 3-5',3,5,1) RETURNING id INTO v_div;
  INSERT INTO division_fees (org_id,division_id,name,fee_type,amount_cents,sort_order) VALUES (v_org,v_div,'Base','base',8000,1),(v_org,v_div,'Uniform','add_on',2000,2);
  INSERT INTO programs (org_id,name,program_type,status,is_published,public_slug,reg_opens_at,reg_closes_at)
    VALUES (v_org,'G4 Closed','camp','active',true,'g4c-'||left(v_uniq,12),now()-interval '10 days',now()-interval '1 day') RETURNING id INTO v_prog_closed;
  INSERT INTO programs (org_id,name,program_type,status,is_published,public_slug) VALUES (v_org,'G4 Draft','camp','draft',false,v_slug_dft) RETURNING id INTO v_prog_draft;

  -- T1: single-child money path + B0 ledger delta
  v_res := submit_registration(jsonb_build_object('program_id',v_prog,
    'guardian',jsonb_build_object('first_name','G4','last_name','One','email','t1-'||v_uniq||'@g4.test'),
    'children',jsonb_build_array(jsonb_build_object('player',jsonb_build_object('first_name','Kid','last_name','One','grade','4'),'division_id',v_div,'details','{}'::jsonb))));
  v_gid := (v_res->>'guardian_id')::uuid; v_total := (v_res->>'authoritative_total_cents')::bigint;
  IF v_total <> 10000 THEN RAISE EXCEPTION 'G4_FAIL T1: authoritative_total expected 10000 got %', v_total; END IF;
  -- B0: family_balances balance for (guardian, program) == authoritative_total
  SELECT balance_cents INTO v_bal FROM family_balances WHERE guardian_id=v_gid AND season_id=v_prog;
  IF v_bal IS DISTINCT FROM v_total THEN RAISE EXCEPTION 'G4_FAIL T1: family_balances balance % <> authoritative_total %', v_bal, v_total; END IF;
  SELECT count(*) INTO v_txn FROM financial_transactions ft JOIN financial_accounts fa ON fa.id=ft.account_id
    WHERE fa.guardian_id=v_gid AND fa.season_id=v_prog AND ft.transaction_type='fee';
  IF v_txn <> 1 THEN RAISE EXCEPTION 'G4_FAIL T1: expected 1 fee transaction got %', v_txn; END IF;

  -- T1b: multi-child family-cap (one submit) + account balance nets across two fee txns
  UPDATE organizations SET family_cap_policy='{"enabled":true,"per_extra_child_cents":1000}'::jsonb WHERE id=v_org;
  v_res2 := submit_registration(jsonb_build_object('program_id',v_prog,
    'guardian',jsonb_build_object('first_name','G4','last_name','Cap','email','t1b-'||v_uniq||'@g4.test'),
    'children',jsonb_build_array(
      jsonb_build_object('player',jsonb_build_object('first_name','Cap','last_name','A','grade','4'),'division_id',v_div,'details','{}'::jsonb),
      jsonb_build_object('player',jsonb_build_object('first_name','Cap','last_name','B','grade','5'),'division_id',v_div,'details','{}'::jsonb))));
  v_gid_cap := (v_res2->>'guardian_id')::uuid; v_disc := (v_res2->>'discount_cents')::bigint; v_total := (v_res2->>'authoritative_total_cents')::bigint;
  IF v_disc <> 1000 THEN RAISE EXCEPTION 'G4_FAIL T1b: family-cap discount expected 1000 got % (the D-Q7 one-submit fix)', v_disc; END IF;
  IF v_total <> 19000 THEN RAISE EXCEPTION 'G4_FAIL T1b: total expected 19000 got %', v_total; END IF;
  SELECT balance_cents INTO v_bal FROM family_balances WHERE guardian_id=v_gid_cap AND season_id=v_prog;
  IF v_bal <> 19000 THEN RAISE EXCEPTION 'G4_FAIL T1b: account balance % <> 19000 (per-reg fees net the discount)', v_bal; END IF;
  SELECT count(*) INTO v_txn FROM financial_transactions ft JOIN financial_accounts fa ON fa.id=ft.account_id
    WHERE fa.guardian_id=v_gid_cap AND fa.season_id=v_prog AND ft.transaction_type='fee';
  IF v_txn <> 2 THEN RAISE EXCEPTION 'G4_FAIL T1b: expected 2 fee transactions got %', v_txn; END IF;
  UPDATE organizations SET family_cap_policy=NULL WHERE id=v_org;

  -- T1c: duplicate submit -> no new reg AND no new ledger fee (no double-bill)
  v_res2 := submit_registration(jsonb_build_object('program_id',v_prog,
    'guardian',jsonb_build_object('first_name','G4','last_name','One','email','t1-'||v_uniq||'@g4.test'),
    'children',jsonb_build_array(jsonb_build_object('player',jsonb_build_object('first_name','Kid','last_name','One','grade','4'),'division_id',v_div,'details','{}'::jsonb))));
  IF jsonb_array_length(v_res2->'registration_ids') <> 0 THEN RAISE EXCEPTION 'G4_FAIL T1c: duplicate created % new registration(s)', jsonb_array_length(v_res2->'registration_ids'); END IF;
  SELECT balance_cents INTO v_bal FROM family_balances WHERE guardian_id=v_gid AND season_id=v_prog;
  IF v_bal <> 10000 THEN RAISE EXCEPTION 'G4_FAIL T1c: duplicate changed the balance to % (double-bill)', v_bal; END IF;
  SELECT count(*) INTO v_txn FROM financial_transactions ft JOIN financial_accounts fa ON fa.id=ft.account_id
    WHERE fa.guardian_id=v_gid AND fa.season_id=v_prog AND ft.transaction_type='fee';
  IF v_txn <> 1 THEN RAISE EXCEPTION 'G4_FAIL T1c: duplicate added a fee transaction (now %)', v_txn; END IF;

  -- T2: grade band
  BEGIN
    PERFORM submit_registration(jsonb_build_object('program_id',v_prog,'guardian',jsonb_build_object('first_name','G4','last_name','Gr','email','t2-'||v_uniq||'@g4.test'),
      'children',jsonb_build_array(jsonb_build_object('player',jsonb_build_object('first_name','Too','last_name','Young','grade','1'),'division_id',v_div,'details','{}'::jsonb))));
    RAISE EXCEPTION 'G4_FAIL T2: grade 1 did not raise';
  EXCEPTION WHEN others THEN GET STACKED DIAGNOSTICS v_caught=MESSAGE_TEXT; IF v_caught <> 'grade_below_band' THEN RAISE EXCEPTION 'G4_FAIL T2: got "%"', v_caught; END IF; END;

  -- T2b: closed window + draft/unpublished gates
  BEGIN
    PERFORM submit_registration(jsonb_build_object('program_id',v_prog_closed,'guardian',jsonb_build_object('first_name','G4','last_name','Cl','email','t2bc-'||v_uniq||'@g4.test'),
      'children',jsonb_build_array(jsonb_build_object('player',jsonb_build_object('first_name','C','last_name','C','grade','4'),'division_id',v_div,'details','{}'::jsonb))));
    RAISE EXCEPTION 'G4_FAIL T2b-closed: did not reject';
  EXCEPTION WHEN others THEN GET STACKED DIAGNOSTICS v_caught=MESSAGE_TEXT; IF v_caught <> 'registration_closed' THEN RAISE EXCEPTION 'G4_FAIL T2b-closed: got "%"', v_caught; END IF; END;
  BEGIN
    PERFORM submit_registration(jsonb_build_object('program_id',v_prog_draft,'guardian',jsonb_build_object('first_name','G4','last_name','Df','email','t2bd-'||v_uniq||'@g4.test'),
      'children',jsonb_build_array(jsonb_build_object('player',jsonb_build_object('first_name','D','last_name','D','grade','4'),'division_id',v_div,'details','{}'::jsonb))));
    RAISE EXCEPTION 'G4_FAIL T2b-draft: did not reject';
  EXCEPTION WHEN others THEN GET STACKED DIAGNOSTICS v_caught=MESSAGE_TEXT; IF v_caught <> 'registration_closed' THEN RAISE EXCEPTION 'G4_FAIL T2b-draft: got "%"', v_caught; END IF; END;

  -- T3: get_public_program shape + draft slug -> null
  v_pub := get_public_program(v_slug);
  IF v_pub IS NULL OR (v_pub->'program'->>'id') <> v_prog::text THEN RAISE EXCEPTION 'G4_FAIL T3: did not return the published program'; END IF;
  IF jsonb_array_length(v_pub->'divisions') <> 1 THEN RAISE EXCEPTION 'G4_FAIL T3: expected 1 division got %', jsonb_array_length(v_pub->'divisions'); END IF;
  IF (v_pub->'divisions'->0->>'base_fee_cents')::bigint <> 8000 THEN RAISE EXCEPTION 'G4_FAIL T3: base_fee_cents expected 8000 got %', v_pub->'divisions'->0->>'base_fee_cents'; END IF;
  IF get_public_program(v_slug_dft) IS NOT NULL THEN RAISE EXCEPTION 'G4_FAIL T3: a draft/unpublished slug must return null'; END IF;

  -- T3b: anon can execute both public RPCs
  SET LOCAL ROLE anon;
  BEGIN
    PERFORM get_public_program(v_slug);
    PERFORM submit_registration(jsonb_build_object('program_id',v_prog,'guardian',jsonb_build_object('first_name','G4','last_name','An','email','t3b-'||v_uniq||'@g4.test'),
      'children',jsonb_build_array(jsonb_build_object('player',jsonb_build_object('first_name','An','last_name','On','grade','4'),'division_id',v_div,'details','{}'::jsonb))));
  EXCEPTION WHEN insufficient_privilege THEN RESET ROLE; RAISE EXCEPTION 'G4_FAIL T3b: anon cannot execute a public RPC — %', SQLERRM; END;
  RESET ROLE;

  RAISE EXCEPTION 'G4_PASS_POSTB0 T1(balance==total) T1b(acct=19000,2fees) T1c(no-double-bill) T2 T2b T3 T3b';
END $$;
