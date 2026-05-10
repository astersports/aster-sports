-- L99 wave 4.1+4.2 foundation step M1: reconcile JS-DB kind mismatch
-- Today's CHECK rejects tournament_prelim, tournament_recap, game_recap, announcement,
-- custom_message, rsvp_nudge. Adds the new kinds to the union while keeping legacy
-- kinds for backward compatibility.

ALTER TABLE comms_messages DROP CONSTRAINT comms_messages_kind_check;

ALTER TABLE comms_messages ADD CONSTRAINT comms_messages_kind_check
  CHECK (kind = ANY (ARRAY[
    'weekly_digest'::text,
    'schedule_change'::text,
    'game_recap'::text,
    'tournament_prelim'::text,
    'tournament_recap'::text,
    'announcement'::text,
    'custom_message'::text,
    'rsvp_nudge'::text,
    'academy_callup_notice'::text,
    'tournament_preliminary'::text,
    'tournament_final'::text,
    'tournament_rsvp_lock'::text,
    'tournament_recap_interim'::text,
    'tournament_recap_final'::text,
    'multi_team_notice'::text,
    'custom'::text
  ]));

-- Verification: probe with a test INSERT that passes all NOT NULL columns, then clean up
DO $$
DECLARE
  test_id uuid;
BEGIN
  INSERT INTO comms_messages (org_id, kind, status, anchor_kind, body_html, body_plain, recipient_count)
  VALUES ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'rsvp_nudge', 'draft', 'event', '', '', 0)
  RETURNING id INTO test_id;

  IF test_id IS NULL THEN
    RAISE EXCEPTION 'rsvp_nudge draft failed to insert';
  END IF;

  DELETE FROM comms_messages WHERE id = test_id;

  RAISE NOTICE 'M1 verified: rsvp_nudge accepted by new CHECK';
END $$;
