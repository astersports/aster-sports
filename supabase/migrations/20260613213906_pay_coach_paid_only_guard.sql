-- Migration D: harden pay_coach to settle paid sessions only.
-- Session pay_status has no intermediate 'settling' state, so a non-paid payout must
-- never flip sessions out of owed. Guard enforces the paid-only invariant at the DB.
-- Applied via Supabase MCP 2026-06-13. Mirror of production version 20260613213906.

CREATE OR REPLACE FUNCTION pay_coach(
  p_org uuid, p_coach uuid, p_season uuid, p_session_ids uuid[],
  p_amount_cents int, p_status text, p_method text, p_paid_at timestamptz, p_notes text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $fn$
DECLARE v_payout uuid; v_bad int;
BEGIN
  IF NOT user_has_role_in_org(p_org, ARRAY['admin']) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF p_status <> 'paid' THEN
    RAISE EXCEPTION 'pay_coach settles paid sessions only; p_status must be ''paid'' (got %)', p_status;
  END IF;
  SELECT count(*) INTO v_bad
  FROM unnest(p_session_ids) sid
  LEFT JOIN event_coach_assignments ea ON ea.id = sid
  LEFT JOIN events e ON e.id = ea.event_id
  LEFT JOIN teams t ON t.id = e.team_id
  WHERE ea.id IS NULL OR ea.coach_user_id <> p_coach
     OR ea.pay_status <> 'owed' OR t.org_id <> p_org;
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'settlement aborted: % invalid/non-owed sessions', v_bad;
  END IF;

  INSERT INTO coach_payouts (org_id, coach_user_id, season_id, amount_cents, status,
    payment_method, paid_at, source_assignments, notes)
  VALUES (p_org, p_coach, p_season, p_amount_cents, p_status, p_method, p_paid_at,
    p_session_ids, p_notes)
  RETURNING id INTO v_payout;

  UPDATE event_coach_assignments
    SET pay_status='paid', settled_by_payout_id=v_payout
    WHERE id = ANY(p_session_ids) AND pay_status='owed';
  RETURN v_payout;
END $fn$;
GRANT EXECUTE ON FUNCTION pay_coach(uuid,uuid,uuid,uuid[],int,text,text,timestamptz,text) TO authenticated;

DO $v$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE proname='pay_coach'
    AND pg_get_functiondef(oid) ILIKE '%p_status <> ''paid''%') THEN
    RAISE EXCEPTION 'verify: pay_coach paid-only guard missing';
  END IF;
END $v$;
