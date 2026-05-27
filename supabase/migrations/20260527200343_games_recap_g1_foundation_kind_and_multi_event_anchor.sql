-- games_recap (G1) foundation: allow the new kind across the 3 kind_check
-- constraints + allow anchor_kind='multi_event' on comms_messages. The kind
-- is not yet emitted/wizard-exposed (PR B/C wire the resolver + body); this
-- only lets the value pass the DB constraints when those land.

ALTER TABLE comms_messages DROP CONSTRAINT comms_messages_kind_check;
ALTER TABLE comms_messages ADD CONSTRAINT comms_messages_kind_check CHECK (kind = ANY (ARRAY[
  'weekly_digest','schedule_change','game_recap','tournament_prelim','tournament_recap',
  'announcement','custom_message','rsvp_nudge','academy_callup_notice','coach_roundup',
  'family_guide','games_recap']));

ALTER TABLE comms_messages DROP CONSTRAINT comms_messages_anchor_kind_check;
ALTER TABLE comms_messages ADD CONSTRAINT comms_messages_anchor_kind_check CHECK (
  anchor_kind IS NULL OR anchor_kind = ANY (ARRAY['event','tournament','team','org','multi_event']));

ALTER TABLE briefing_templates DROP CONSTRAINT briefing_templates_kind_check;
ALTER TABLE briefing_templates ADD CONSTRAINT briefing_templates_kind_check CHECK (kind = ANY (ARRAY[
  'weekly_digest','schedule_change','game_recap','tournament_prelim','tournament_recap',
  'announcement','custom_message','rsvp_nudge','academy_callup_notice','coach_roundup',
  'family_guide','games_recap']));

ALTER TABLE briefing_triggers DROP CONSTRAINT briefing_triggers_kind_check;
ALTER TABLE briefing_triggers ADD CONSTRAINT briefing_triggers_kind_check CHECK (briefing_kind = ANY (ARRAY[
  'weekly_digest','schedule_change','game_recap','tournament_prelim','tournament_recap',
  'announcement','custom_message','rsvp_nudge','academy_callup_notice','coach_roundup',
  'family_guide','games_recap']));
