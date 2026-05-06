-- ============================================================================
-- Migration: Path B Stage 1 + original seed asks
-- Version: 20260506173057
-- Date: 2026-05-06
-- ============================================================================
-- 1. Create Winter 2025-26 season placeholder
-- 2. Re-tag 40 mislabeled financial_accounts from Fall 2025 to Winter 2025-26
-- 3. Seed team_achievements (3 rows)
-- 4. Seed championship_scenarios (3 rows)
-- ============================================================================
-- Verified pre-migration state:
--   Production "Fall 2025" = $32,522.50 / 40 accounts / 42 transactions
--   This is precisely Winter 2025-26 main team paid registrations (12+11+10+9 = 42)
--   37 of 40 guardian emails match Winter 2025-26 paid CSV registrants
--   Hypothesis confirmed beyond reasonable doubt
--
-- Carry-forward (Path B Stages 2-4 deferred):
--   Stage 2: Load 3 Winter waitlist programs (~$3K, 17 accounts)
--   Stage 3: Load TRUE Fall 2025 ($56,152.50, 48 players, 6 programs)
--   Stage 4: Load Winter 2025-26 off-platform revenue (~$26.5K from Excel)
-- ============================================================================

-- Step 1: Create Winter 2025-26 season
INSERT INTO public.seasons (org_id, name, status, start_date, end_date)
SELECT 'e3e95e21-3571-4e9a-985a-d5d01480d4a6',
       'Winter 2025-26', 'archived',
       '2025-11-15'::date, '2026-03-04'::date
WHERE NOT EXISTS (
  SELECT 1 FROM public.seasons
  WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
    AND name = 'Winter 2025-26'
);

-- Step 2: Re-tag the 40 mislabeled accounts
WITH fall_id AS (
  SELECT id FROM public.seasons
  WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND name = 'Fall 2025'
),
winter_id AS (
  SELECT id FROM public.seasons
  WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND name = 'Winter 2025-26'
)
UPDATE public.financial_accounts
SET season_id = (SELECT id FROM winter_id),
    updated_at = NOW(),
    notes = COALESCE(notes || E'\n', '') ||
            'Re-tagged from Fall 2025 to Winter 2025-26 on 2026-05-06 (mislabel correction)'
WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
  AND season_id = (SELECT id FROM fall_id);

-- Step 3: team_achievements
INSERT INTO public.team_achievements (
  org_id, team_id, tournament_id, season_id, achievement_type, custom_title,
  description, badge_emoji, badge_color, is_pending_confirmation, earned_at
) VALUES
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '507d7a4e-553e-4ba7-a61c-38d6cdf2f364',
   '54885ddf-7762-4208-b772-e9d99327d5fe', 'b8a83563-6878-4ebb-8918-9d884050ab23',
   'champions', NULL, 'Tournament Champion', '🏆', '#FFD700', true,
   '2026-04-18 20:00:00-04:00'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', '6abb0447-8866-461c-bd78-1c58eebf9551',
   NULL, 'b8a83563-6878-4ebb-8918-9d884050ab23',
   'custom', 'Pool Play Winner', 'Won pool play group', '⭐', '#4a8fd4', true,
   '2026-04-15 18:00:00-04:00'),
  ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'e6dde2e0-38f7-46c9-ad1a-5ac253a2a570',
   NULL, 'b8a83563-6878-4ebb-8918-9d884050ab23',
   'custom', 'Most Improved Team',
   'Largest improvement in team performance over the season',
   '📈', '#f59e0b', true, '2026-04-30 12:00:00-04:00')
ON CONFLICT DO NOTHING;

-- Step 4: championship_scenarios
INSERT INTO public.championship_scenarios (
  tournament_id, team_id, condition_label, outcome_color, narrative, sort_order
) VALUES
  ('0fc1f7a1-45bb-4c21-a3e7-2003a004a47a', '507d7a4e-553e-4ba7-a61c-38d6cdf2f364',
   'Win pool play (3-0)', 'positive',
   'Top seed into bracket play. Likely path to semifinals or better.', 1),
  ('0fc1f7a1-45bb-4c21-a3e7-2003a004a47a', '507d7a4e-553e-4ba7-a61c-38d6cdf2f364',
   'Go 2-1 in pool play', 'neutral',
   'Mid-seed (2nd-4th depending on point differential). Tougher bracket draw possible.', 2),
  ('0fc1f7a1-45bb-4c21-a3e7-2003a004a47a', '507d7a4e-553e-4ba7-a61c-38d6cdf2f364',
   'Lose 2+ pool games', 'negative',
   'Eliminated from championship bracket. Consolation games only.', 3)
ON CONFLICT DO NOTHING;

-- Step 5: Verification block
DO $$
DECLARE
  fall_count int; winter_count int; ach_count int; scen_count int;
  fall_total_cents bigint; winter_total_cents bigint;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(season_fee_cents), 0)
    INTO fall_count, fall_total_cents
  FROM public.financial_accounts
  WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
    AND season_id = (SELECT id FROM public.seasons
                     WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
                       AND name = 'Fall 2025');

  SELECT COUNT(*), COALESCE(SUM(season_fee_cents), 0)
    INTO winter_count, winter_total_cents
  FROM public.financial_accounts
  WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
    AND season_id = (SELECT id FROM public.seasons
                     WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6'
                       AND name = 'Winter 2025-26');

  SELECT COUNT(*) INTO ach_count FROM public.team_achievements
    WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6';
  SELECT COUNT(*) INTO scen_count FROM public.championship_scenarios
    WHERE tournament_id = '0fc1f7a1-45bb-4c21-a3e7-2003a004a47a';

  RAISE NOTICE 'POST-MIGRATION STATE:';
  RAISE NOTICE '  Fall 2025 accounts: % ($%)', fall_count, (fall_total_cents/100.0);
  RAISE NOTICE '  Winter 2025-26 accounts: % ($%)', winter_count, (winter_total_cents/100.0);
  RAISE NOTICE '  team_achievements: %', ach_count;
  RAISE NOTICE '  championship_scenarios: %', scen_count;

  IF fall_count <> 0 THEN
    RAISE EXCEPTION 'Fall 2025 should be empty after retag, got % accounts', fall_count;
  END IF;
  IF winter_count <> 40 THEN
    RAISE EXCEPTION 'Winter 2025-26 should have 40 accounts, got %', winter_count;
  END IF;
  IF winter_total_cents <> 3252250 THEN
    RAISE EXCEPTION 'Winter 2025-26 total should be $32,522.50, got $%', (winter_total_cents/100.0);
  END IF;
  IF ach_count < 3 THEN
    RAISE EXCEPTION 'team_achievements seed failed (%)', ach_count;
  END IF;
  IF scen_count < 3 THEN
    RAISE EXCEPTION 'championship_scenarios seed failed (%)', scen_count;
  END IF;
END $$;
