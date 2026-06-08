-- STAGED — NOT APPLIED. S3 / FORK-REG-UNIQUE (close the submit_registration TOCTOU).
-- Ratified PARTIAL by the architect 2026-06-08. registration_status enum (live):
-- pending,confirmed,waitlist,cancelled,payment_overdue. Only 'cancelled' is
-- terminal/re-registerable; payment_overdue is a live reg that must block a dup.
-- Pre-flight live: registrations rows=0, dup (program_id,player_id) pairs=0.

CREATE UNIQUE INDEX registrations_program_player_live_uniq
  ON registrations (program_id, player_id)
  WHERE status <> 'cancelled';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes
        WHERE indexname='registrations_program_player_live_uniq') THEN
    RAISE EXCEPTION 'verify failed: partial unique index missing';
  END IF;
END $$;

-- COMPANION (separate build PR — NOT part of this migration): make the INSERT in
-- public.submit_registration race-safe by using the partial index as the
-- ON CONFLICT arbiter:
--   INSERT INTO registrations (...)
--     ON CONFLICT (program_id, player_id) WHERE status <> 'cancelled'
--     DO NOTHING RETURNING id INTO v_reg_id;
--   IF v_reg_id IS NULL THEN  -- lost the race: a live reg already exists
--     v_already := v_already || (v_child->'player'->>'first_name'); CONTINUE;
--   END IF;
-- The soft SELECT pre-check stays as a fast path; the partial index is the guard.
