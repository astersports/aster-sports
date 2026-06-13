-- Migration E: reconcile seed coach-payout source_assignments with session pay_status.
-- Pilot fixture correction (Legacy Hoopers). MCP-verified 2026-06-13.
-- Darien PAID $1,680 (fb694cc0) names 28 sessions, all owed, all his, in-org; 28x$60=$1,680 exact.
-- Honor it: flip those 28 to paid + link settled_by_payout_id. Invariant restored:
-- every session referenced by a PAID payout is itself paid (pay_coach can never re-settle them).
-- Darien PENDING $540 (e5ddd234) carries source_assignments (7 owed + 2 dangling); a non-paid
-- payout must not claim sessions under Migration D, so clear them. The 7 real sessions stay owed.
-- Paid totals unchanged ($2,780). Darien owed 35->7 sessions ($2,100 -> $420).

DO $e$
DECLARE v_paid uuid; v_flipped int;
BEGIN
  SELECT id INTO v_paid FROM coach_payouts
   WHERE org_id='e3e95e21-3571-4e9a-985a-d5d01480d4a6'
     AND coach_user_id='af40a751-1db2-4690-98ad-8b630d354c66'
     AND status='paid' AND amount_cents=168000 AND source_assignments IS NOT NULL;
  IF v_paid IS NOT NULL THEN
    UPDATE event_coach_assignments ea
       SET pay_status='paid', settled_by_payout_id=v_paid
      FROM coach_payouts cp
     WHERE cp.id=v_paid
       AND ea.id = ANY(cp.source_assignments)
       AND ea.coach_user_id='af40a751-1db2-4690-98ad-8b630d354c66'
       AND ea.pay_status='owed';
    GET DIAGNOSTICS v_flipped = ROW_COUNT;
    RAISE NOTICE 'Migration E: flipped % owed sessions to paid under payout %', v_flipped, v_paid;
  END IF;
  UPDATE coach_payouts
     SET source_assignments = NULL
   WHERE org_id='e3e95e21-3571-4e9a-985a-d5d01480d4a6'
     AND coach_user_id='af40a751-1db2-4690-98ad-8b630d354c66'
     AND status='pending' AND source_assignments IS NOT NULL;
END $e$;

DO $v$
DECLARE v_bad int;
BEGIN
  SELECT count(*) INTO v_bad FROM coach_payouts cp
   WHERE cp.org_id='e3e95e21-3571-4e9a-985a-d5d01480d4a6'
     AND cp.status='paid' AND cp.source_assignments IS NOT NULL
     AND EXISTS (SELECT 1 FROM unnest(cp.source_assignments) sid
                  JOIN event_coach_assignments ea ON ea.id=sid WHERE ea.pay_status='owed');
  IF v_bad>0 THEN RAISE EXCEPTION 'verify E: % paid payouts still reference owed sessions', v_bad; END IF;
END $v$;
