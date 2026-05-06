-- ============================================================================
-- Migration: Path B Stage 2 - Winter 2025-26 waitlist registrations (15)
-- Version: 20260506173911
-- Date: 2026-05-06
-- ============================================================================
-- Adds $100 waitlist registration fee to existing Winter 2025-26 accounts
-- for 15 guardians who had a sibling on a Winter waitlist program.
--
-- Schema constraint: UNIQUE (org_id, guardian_id, season_id) on financial_accounts
-- means we cannot create separate waitlist accounts. Option A: roll into existing.
--
-- Programs covered:
--   - 10U (4th) Boys - Waitlist: 5 paid x $100 = $500
--   - 9U (3rd) Boys - Waitlist:  10 paid x $100 = $1,000
-- Total added: $1,500 across 15 guardians, 15 new transactions.
--
-- Skipped (carry-forward):
--   - Boys - Waitlist: $1,500 invoiced but $0 paid (waitlisters never activated)
--   - Winter 5th-6th Boys - Waitlist: $0 invoiced (placeholder only)
--
-- Pre-migration state:  Winter 2025-26 = 40 accts / $32,522.50 / 42 txns
-- Post-migration state: Winter 2025-26 = 40 accts / $34,022.50 / 57 txns
--                       (matches LeagueApps Winter 2025 Season "Paid" total)
-- ============================================================================

WITH
  winter_id AS (
    SELECT id FROM public.seasons
    WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
      AND name = 'Winter 2025-26'
  ),
  waitlist_data (guardian_id, child_name, program_label) AS (
    VALUES
      -- 10U (4th) Boys - Waitlist
      ('02810181-4676-406b-8ddc-84a530c5bc90'::uuid, 'Shane Stein',     '10U (4th) Boys - Waitlist'),
      ('6c5256a0-cefb-4401-809d-2f5dbe8751a9'::uuid, 'Zachary Bortner', '10U (4th) Boys - Waitlist'),
      ('c751639a-04d7-4a16-a551-0114cb5b2efb'::uuid, 'Chase Kweskin',   '10U (4th) Boys - Waitlist'),
      ('f50e9714-cc9c-4c23-8042-db88731cc932'::uuid, 'Hudson Edelman',  '10U (4th) Boys - Waitlist'),
      ('ee841047-2af2-4ea6-bcf2-3ced8a0f13ff'::uuid, 'Henry Katzeff',   '10U (4th) Boys - Waitlist'),
      -- 9U (3rd) Boys - Waitlist
      ('6e1bf9fe-1c0b-4c8d-b4e8-6d1c10422507'::uuid, 'Miles Goodman',   '9U (3rd) Boys - Waitlist'),
      ('b3f7109a-648c-495c-ab87-36b02467998c'::uuid, 'Ethan Stern',     '9U (3rd) Boys - Waitlist'),
      ('c6eedacb-9436-4690-a695-c7a8bfdf38e2'::uuid, 'Miles Wilk',      '9U (3rd) Boys - Waitlist'),
      ('43fb1457-968c-4c3d-9b82-c7ae31e9e520'::uuid, 'Jake Lipsky',     '9U (3rd) Boys - Waitlist'),
      ('03b79d73-a677-4884-a68b-fc604fecfbdd'::uuid, 'Mason Ulezalka',  '9U (3rd) Boys - Waitlist'),
      ('25f79a67-7b54-4b31-a5b2-0a83c52ce358'::uuid, 'Ethan Kaczinski', '9U (3rd) Boys - Waitlist'),
      ('520352be-ce8c-4455-b001-b07458a75cbe'::uuid, 'Jordan Levey',    '9U (3rd) Boys - Waitlist'),
      ('50b904e5-f05d-4d29-aff7-8c2aae5079de'::uuid, 'Henry Warheit',   '9U (3rd) Boys - Waitlist'),
      ('ed4c1ac3-99d6-48e8-9896-7e4d731a94be'::uuid, 'Spencer Miller',  '9U (3rd) Boys - Waitlist'),
      ('46731e5c-b72f-4235-806e-e79b45fcc569'::uuid, 'Max Cohen',       '9U (3rd) Boys - Waitlist')
  ),
  account_lookup AS (
    SELECT fa.id AS account_id, wd.guardian_id, wd.child_name, wd.program_label
    FROM waitlist_data wd
    JOIN public.financial_accounts fa
      ON fa.guardian_id = wd.guardian_id
     AND fa.season_id = (SELECT id FROM winter_id)
     AND fa.org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
  ),
  updated_accounts AS (
    UPDATE public.financial_accounts fa
    SET season_fee_cents = fa.season_fee_cents + 10000,
        updated_at = NOW(),
        notes = COALESCE(fa.notes || E'\n', '') ||
                'Added $100 waitlist registration on 2026-05-06: ' || al.child_name || ' / ' || al.program_label
    FROM account_lookup al
    WHERE fa.id = al.account_id
    RETURNING fa.id
  )
INSERT INTO public.financial_transactions (
  account_id, org_id, transaction_type, amount_cents,
  payment_method, reference, occurred_at, notes
)
SELECT al.account_id,
       'e3e95e21-3571-4e9a-985a-d5d01480d4a6'::uuid,
       'payment',
       10000,
       'other',
       'LeagueApps waitlist registration',
       '2025-11-01 12:00:00-04:00'::timestamptz,
       al.child_name || ' / ' || al.program_label
FROM account_lookup al;

-- Verification block
DO $$
DECLARE
  winter_count int;
  winter_total_cents bigint;
  txn_count int;
  txn_total_cents bigint;
  waitlist_txn_count int;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(season_fee_cents), 0)
    INTO winter_count, winter_total_cents
  FROM public.financial_accounts
  WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
    AND season_id = (SELECT id FROM public.seasons
                     WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
                       AND name = 'Winter 2025-26');

  SELECT COUNT(*), COALESCE(SUM(amount_cents), 0)
    INTO txn_count, txn_total_cents
  FROM public.financial_transactions ft
  JOIN public.financial_accounts fa ON fa.id = ft.account_id
  WHERE fa.org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
    AND fa.season_id = (SELECT id FROM public.seasons
                        WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
                          AND name = 'Winter 2025-26');

  SELECT COUNT(*) INTO waitlist_txn_count
  FROM public.financial_transactions ft
  WHERE ft.reference = 'LeagueApps waitlist registration'
    AND ft.org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';

  RAISE NOTICE 'POST-MIGRATION STATE:';
  RAISE NOTICE '  Winter 2025-26 accounts: % ($%)', winter_count, (winter_total_cents/100.0);
  RAISE NOTICE '  Winter 2025-26 transactions: % ($%)', txn_count, (txn_total_cents/100.0);
  RAISE NOTICE '  Waitlist registration transactions: %', waitlist_txn_count;

  IF winter_count <> 40 THEN
    RAISE EXCEPTION 'Account count should be 40 (UPDATE not INSERT), got %', winter_count;
  END IF;
  IF winter_total_cents <> 3402250 THEN
    RAISE EXCEPTION 'Winter billable should be $34,022.50, got $%', (winter_total_cents/100.0);
  END IF;
  IF txn_count <> 57 THEN
    RAISE EXCEPTION 'Winter transactions should be 57, got %', txn_count;
  END IF;
  IF txn_total_cents <> 3402250 THEN
    RAISE EXCEPTION 'Winter transaction total should be $34,022.50, got $%', (txn_total_cents/100.0);
  END IF;
  IF waitlist_txn_count <> 15 THEN
    RAISE EXCEPTION 'Should have 15 waitlist transactions, got %', waitlist_txn_count;
  END IF;
END $$;
