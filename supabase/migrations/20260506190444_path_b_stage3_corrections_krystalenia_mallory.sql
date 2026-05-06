-- ============================================================================
-- Migration: Path B Stage 3 corrections - Krystalenia + Mallory Fall 2025
-- Date: 2026-05-06
-- ============================================================================
-- Resolves 2 Fall 2025 carry-forwards from Stage 3:
--   1. Krystalenia Demasi: $1,275 paid (was skipped due to NULL P1 email in CSV)
--      Attributed to existing primary guardian Joseph Demasi.
--   2. Mallory Zinman: $1,275 owed, $0 paid (registered but never paid)
--      Creates new player + links to existing guardians Jon + Carla Zinman.
--      Account created with no transaction → outstanding balance = $1,275.
--
-- Targets:
--   Fall accounts:      41 → 43
--   Fall billable:      $53,602.50 → $56,152.50 (matches LeagueApps invoiced)
--   Fall transactions:  46 → 47
--   Fall paid:          $53,602.50 → $54,877.50 (matches LeagueApps paid)
--   Fall outstanding:   $0 → $1,275 (Mallory unpaid)
-- ============================================================================

-- Step 1: Create Mallory Zinman as player
INSERT INTO public.players (id, org_id, first_name, last_name, dob)
SELECT 'a370ee2b-dc93-4889-aacf-cc0ea2d7bcbb', 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Mallory', 'Zinman', DATE '2015-04-23'
WHERE NOT EXISTS (
  SELECT 1 FROM public.players
  WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
    AND LOWER(first_name) = 'mallory' AND LOWER(last_name) = 'zinman'
);

-- Step 2: Link Mallory to Jon (primary) + Carla (secondary)
INSERT INTO public.player_guardians (player_id, guardian_id, relationship, is_primary) VALUES
  ('a370ee2b-dc93-4889-aacf-cc0ea2d7bcbb', '065e0299-44f1-44b5-9276-cb797580887e', 'parent', true),
  ('a370ee2b-dc93-4889-aacf-cc0ea2d7bcbb', '7eefb488-d612-414e-aa18-8f3263b762ac', 'parent', false)
ON CONFLICT (player_id, guardian_id) DO NOTHING;

-- Step 3: Krystalenia Fall 2025 financial_account ($1,275 under Joseph Demasi)
WITH fall_season AS (SELECT id FROM public.seasons WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND name = 'Fall 2025')
INSERT INTO public.financial_accounts (org_id, guardian_id, season_id, season_fee_cents, notes) VALUES
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '31382df9-5afc-4b67-b9db-fe68ce7978cd', (SELECT id FROM fall_season), 127500,
   'Fall 2025 backfill 2026-05-06 (Stage 3 correction): Krystalenia Demasi ($1275.00, 5th Grade Girls Blue). Skipped from Stage 3 main migration due to NULL P1 email in source registration row; attributed here to existing primary guardian.')
ON CONFLICT (org_id, guardian_id, season_id) DO NOTHING;

-- Step 4: Mallory Fall 2025 financial_account ($1,275 OWED under Jon Zinman, no transaction)
WITH fall_season AS (SELECT id FROM public.seasons WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND name = 'Fall 2025')
INSERT INTO public.financial_accounts (org_id, guardian_id, season_id, season_fee_cents, notes) VALUES
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '065e0299-44f1-44b5-9276-cb797580887e', (SELECT id FROM fall_season), 127500,
   'Fall 2025 backfill 2026-05-06 (Stage 3 correction): Mallory Zinman ($1275.00, 5th Grade Girls Black) - REGISTERED BUT NEVER PAID. Outstanding balance $1275.00. Tracked for retention/financial visibility per admin direction. NOTE: LeagueApps had a duplicate registration row that was deleted; this is the canonical record.')
ON CONFLICT (org_id, guardian_id, season_id) DO NOTHING;

-- Step 5: Krystalenia Fall 2025 transaction ($1,275 paid)
WITH fall_season AS (SELECT id FROM public.seasons WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND name = 'Fall 2025'),
     krystalenia_account AS (
       SELECT id FROM public.financial_accounts
       WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
         AND guardian_id = '31382df9-5afc-4b67-b9db-fe68ce7978cd'
         AND season_id = (SELECT id FROM fall_season)
     )
INSERT INTO public.financial_transactions (account_id, org_id, transaction_type, amount_cents, payment_method, reference, occurred_at, notes)
SELECT (SELECT id FROM krystalenia_account),
       'e3e95e21-3571-4e9a-985a-d5d01480d4a6',
       'payment',
       127500,
       'other',
       'LeagueApps Fall 2025: Krystalenia Demasi / 5th Grade Girls Blue',
       '2025-09-01 12:00:00-04:00'::timestamptz,
       'Krystalenia Demasi / 5th Grade Girls Blue (Stage 3 correction)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.financial_transactions
  WHERE reference = 'LeagueApps Fall 2025: Krystalenia Demasi / 5th Grade Girls Blue'
);

-- Step 6: Verification
DO $$
DECLARE
  fall_acct_count int;
  fall_acct_total_cents bigint;
  fall_txn_count int;
  fall_txn_total_cents bigint;
  fall_outstanding_cents bigint;
  mallory_player_count int;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(season_fee_cents), 0)
    INTO fall_acct_count, fall_acct_total_cents
  FROM public.financial_accounts
  WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
    AND season_id = (SELECT id FROM public.seasons
                     WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
                       AND name = 'Fall 2025');

  SELECT COUNT(*), COALESCE(SUM(amount_cents), 0)
    INTO fall_txn_count, fall_txn_total_cents
  FROM public.financial_transactions ft
  JOIN public.financial_accounts fa ON fa.id = ft.account_id
  WHERE fa.org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
    AND fa.season_id = (SELECT id FROM public.seasons
                        WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
                          AND name = 'Fall 2025');

  fall_outstanding_cents := fall_acct_total_cents - fall_txn_total_cents;

  SELECT COUNT(*) INTO mallory_player_count
  FROM public.players
  WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
    AND LOWER(first_name) = 'mallory' AND LOWER(last_name) = 'zinman';

  RAISE NOTICE 'POST-CORRECTION STATE:';
  RAISE NOTICE '  Mallory Zinman player count: %', mallory_player_count;
  RAISE NOTICE '  Fall 2025 accounts: % ($%)', fall_acct_count, (fall_acct_total_cents/100.0);
  RAISE NOTICE '  Fall 2025 transactions: % ($%)', fall_txn_count, (fall_txn_total_cents/100.0);
  RAISE NOTICE '  Fall 2025 outstanding balance: $%', (fall_outstanding_cents/100.0);

  IF mallory_player_count <> 1 THEN
    RAISE EXCEPTION 'Mallory Zinman should have 1 player record, got %', mallory_player_count;
  END IF;
  IF fall_acct_count <> 43 THEN
    RAISE EXCEPTION 'Fall 2025 should have 43 accounts after corrections, got %', fall_acct_count;
  END IF;
  IF fall_acct_total_cents <> 5615250 THEN
    RAISE EXCEPTION 'Fall 2025 billable should be $56,152.50, got $%', (fall_acct_total_cents/100.0);
  END IF;
  IF fall_txn_count <> 47 THEN
    RAISE EXCEPTION 'Fall 2025 should have 47 transactions, got %', fall_txn_count;
  END IF;
  IF fall_txn_total_cents <> 5487750 THEN
    RAISE EXCEPTION 'Fall 2025 paid should be $54,877.50, got $%', (fall_txn_total_cents/100.0);
  END IF;
  IF fall_outstanding_cents <> 127500 THEN
    RAISE EXCEPTION 'Fall 2025 outstanding should be $1,275 (Mallory unpaid), got $%', (fall_outstanding_cents/100.0);
  END IF;
END $$;
