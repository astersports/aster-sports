-- ============================================================================
-- Migration: Backfill tournament event opponents (11 events, 3 categories)
-- Version: 20260507012318
-- Date: 2026-05-06
-- ============================================================================

DO $$
DECLARE
  before_null_count int;
BEGIN
  SELECT COUNT(*) INTO before_null_count
  FROM public.events
  WHERE tournament_id IS NOT NULL AND opponent IS NULL;

  RAISE NOTICE 'PRE-MIGRATION: % events have tournament_id but NULL opponent', before_null_count;

  IF before_null_count <> 11 THEN
    RAISE EXCEPTION 'Expected 11 NULL-opponent tournament events at start, got %', before_null_count;
  END IF;
END $$;

UPDATE public.events
SET opponent = 'Pool Play', updated_at = NOW()
WHERE id IN (
  '8bd92cb6-1be3-4f26-aec3-75a20e955ea2',
  '7244af3b-6a9a-4927-a9e6-26151567bd03',
  '57d64aa8-2601-4201-9d6b-854c5645ae9c',
  '062c47b1-cafb-43c2-8c80-1d9d14192ec9',
  '37d2b977-05dc-4089-a8d8-0c36828dfb82',
  'd1bacf07-9b1e-407f-920c-ad2d54d60d90',
  'b28a9d69-55be-4463-8ba1-b9fcc0ad022d',
  '62d67d5e-f04b-4c7d-94e2-d706c701a167',
  '99f68535-e579-477a-a2f0-46f816b994d2'
);

UPDATE public.events
SET status = 'cancelled',
    cancelled_at = '2026-04-19 15:35:00-04:00'::timestamptz,
    cancellation_reason = 'Tournament finals canceled (per LeagueApps source 2026-04-21)',
    updated_at = NOW()
WHERE id = 'ef69e5f8-77f4-4c06-b6fa-e4ce4f008746';

UPDATE public.events
SET opponent = 'Storm Blue', updated_at = NOW()
WHERE id = 'c2a9994b-f0ef-46c4-ae69-c65eab2371fb';
