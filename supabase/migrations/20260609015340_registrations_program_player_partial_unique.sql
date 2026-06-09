-- FORK-REG-UNIQUE (S3): close the submit_registration TOCTOU at the DB layer.
-- Ratified PARTIAL (architect 2026-06-08): only 'cancelled' is terminal/
-- re-registerable in registration_status {pending,confirmed,waitlist,cancelled,
-- payment_overdue}; payment_overdue/waitlist/pending/confirmed are live regs that
-- must block a duplicate. Pre-flight: registrations rows=0, dup pairs=0.
-- Applied via MCP 2026-06-09 (mirror per AP#21). Spec: docs/PROGRAMS_TIER1_FORK_SPECS_2026-06-08.txt
CREATE UNIQUE INDEX registrations_program_player_live_uniq
  ON registrations (program_id, player_id)
  WHERE status <> 'cancelled'::registration_status;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes
        WHERE indexname = 'registrations_program_player_live_uniq') THEN
    RAISE EXCEPTION 'verify failed: partial unique index missing';
  END IF;
END $$;
