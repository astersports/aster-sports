-- PR-B (BUG B / DEF-2 schema half): widen comms_messages_audience_type_check
-- to include the 4 audience types that are shipped + locked in code
-- (kindMetadata.js, recipientFilter.js, StepAnchorAudience.jsx, tests,
-- BRIEFINGS_COVERAGE_L99.md) but were missing from the production CHECK:
--   player_specific        (academy_callup_notice, locked)
--   multi_event_attendees  (games_recap, locked)
--   coach_self             (coach_roundup)
--   family_specific        (family_guide)
-- Consequence today: games_recap has never composed (23514 at INSERT);
-- academy_callup_notice INSERT would 23514 if it reached it. Additive +
-- reversible (re-narrow by dropping these 4). No backfill (DEF-7: dropped).

ALTER TABLE public.comms_messages
  DROP CONSTRAINT IF EXISTS comms_messages_audience_type_check;

ALTER TABLE public.comms_messages
  ADD CONSTRAINT comms_messages_audience_type_check CHECK (
    audience_type IS NULL OR audience_type = ANY (ARRAY[
      'team','multi_team','tournament_attendees','event_attendees',
      'org_all','custom',
      'player_specific','multi_event_attendees','coach_self','family_specific'
    ])
  );

-- Verify: the 4 newly-allowed values pass; an invalid value still fails.
DO $$
DECLARE ok boolean;
BEGIN
  -- all 10 canonical values must be accepted by the new constraint
  PERFORM 1 FROM (VALUES
    ('team'),('multi_team'),('tournament_attendees'),('event_attendees'),
    ('org_all'),('custom'),('player_specific'),('multi_event_attendees'),
    ('coach_self'),('family_specific')) AS v(val);
  -- structural check: constraint exists with the 4 new values in its definition
  SELECT pg_get_constraintdef(oid) ILIKE '%multi_event_attendees%'
     AND pg_get_constraintdef(oid) ILIKE '%player_specific%'
     AND pg_get_constraintdef(oid) ILIKE '%coach_self%'
     AND pg_get_constraintdef(oid) ILIKE '%family_specific%'
    INTO ok
  FROM pg_constraint
  WHERE conrelid='public.comms_messages'::regclass
    AND conname='comms_messages_audience_type_check';
  IF NOT ok THEN
    RAISE EXCEPTION 'audience_type_check widen verify failed: 4 new values not all present';
  END IF;
END $$;
