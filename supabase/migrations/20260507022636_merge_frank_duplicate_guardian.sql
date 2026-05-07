DO $$
DECLARE
  v_dupe_pgs_count int;
  v_keeper_pgs_count int;
  v_dupe_fa_count int;
BEGIN
  SELECT COUNT(*) INTO v_dupe_pgs_count
  FROM public.player_guardians WHERE guardian_id = '6ba0cd8c-692d-4b52-907a-e32fecbe183d';
  SELECT COUNT(*) INTO v_keeper_pgs_count
  FROM public.player_guardians WHERE guardian_id = '9659f2bb-2a53-4e37-ba5b-29e5b6bd1c96';
  SELECT COUNT(*) INTO v_dupe_fa_count
  FROM public.financial_accounts WHERE guardian_id = '6ba0cd8c-692d-4b52-907a-e32fecbe183d';

  IF v_dupe_pgs_count <> 2 OR v_keeper_pgs_count <> 2 OR v_dupe_fa_count <> 1 THEN
    RAISE EXCEPTION 'Pre-flight failed: dupe_pgs=% keeper_pgs=% dupe_fa=% (expected 2/2/1)',
                    v_dupe_pgs_count, v_keeper_pgs_count, v_dupe_fa_count;
  END IF;
END $$;

UPDATE public.financial_accounts
SET guardian_id = '9659f2bb-2a53-4e37-ba5b-29e5b6bd1c96',
    notes = COALESCE(notes || E'\n', '') || 'Merged from duplicate guardian 6ba0cd8c on 2026-05-06',
    updated_at = NOW()
WHERE guardian_id = '6ba0cd8c-692d-4b52-907a-e32fecbe183d';

DELETE FROM public.player_guardians
WHERE guardian_id = '6ba0cd8c-692d-4b52-907a-e32fecbe183d';

DELETE FROM public.guardians
WHERE id = '6ba0cd8c-692d-4b52-907a-e32fecbe183d';
