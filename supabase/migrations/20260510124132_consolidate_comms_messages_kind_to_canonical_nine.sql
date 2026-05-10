-- Wave 4.1d-6: consolidate comms_messages.kind to the canonical 9
-- Aligns comms_messages.kind_check with briefing_templates.kind_check
-- and briefing_triggers.kind_check (already on canonical 9).
-- d-5 (PR #65) retired all legacy emit sites; this migration backfills
-- 7 historical rows and tightens the constraint.

BEGIN;

-- Backfill historical rows
UPDATE comms_messages
SET kind = 'tournament_prelim'
WHERE kind = 'tournament_preliminary';

UPDATE comms_messages
SET kind = 'custom_message'
WHERE kind = 'custom';

-- Tighten CHECK constraint to canonical 9
ALTER TABLE comms_messages DROP CONSTRAINT comms_messages_kind_check;
ALTER TABLE comms_messages ADD CONSTRAINT comms_messages_kind_check
  CHECK (kind = ANY (ARRAY[
    'weekly_digest','schedule_change','game_recap','tournament_prelim',
    'tournament_recap','announcement','custom_message','rsvp_nudge','academy_callup_notice'
  ]));

-- Post-condition verification (Rule 19): aborts transaction on failure
DO $$
DECLARE
  legacy_count INT;
  prelim_count INT;
  custom_count INT;
BEGIN
  SELECT COUNT(*) INTO legacy_count
  FROM comms_messages
  WHERE kind NOT IN (
    'weekly_digest','schedule_change','game_recap','tournament_prelim',
    'tournament_recap','announcement','custom_message','rsvp_nudge','academy_callup_notice'
  );
  IF legacy_count > 0 THEN
    RAISE EXCEPTION 'Post-condition failed: % rows still have legacy kind', legacy_count;
  END IF;

  SELECT COUNT(*) INTO prelim_count FROM comms_messages WHERE kind = 'tournament_prelim';
  IF prelim_count < 6 THEN
    RAISE EXCEPTION 'Post-condition failed: tournament_prelim count is % (expected >= 6)', prelim_count;
  END IF;

  SELECT COUNT(*) INTO custom_count FROM comms_messages WHERE kind = 'custom_message';
  IF custom_count < 1 THEN
    RAISE EXCEPTION 'Post-condition failed: custom_message count is % (expected >= 1)', custom_count;
  END IF;
END $$;

COMMIT;
