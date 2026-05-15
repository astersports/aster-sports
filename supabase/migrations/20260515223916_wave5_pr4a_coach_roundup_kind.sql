-- Wave 5 PR 4a (cutover wave) — register `coach_roundup` as a new
-- briefing kind. Per docs/CUTOVER_WAVE_GAP_AUDIT.md §5.3 + §9.3:
-- separate kind (not an audience-filter variant of tournament_prelim)
-- because the visual + content shape differs substantially (multi-
-- team aggregation, per-team color rows, conflict detection).
--
-- Extends the three kind_check constraints in lockstep (per CLAUDE.md
-- §13 — comms_messages.kind, briefing_templates.kind, briefing_
-- triggers.briefing_kind must all stay in sync). Resolver + compose
-- ship as a stub in 4a; real implementation lands in 4b.

ALTER TABLE public.comms_messages DROP CONSTRAINT comms_messages_kind_check;
ALTER TABLE public.comms_messages
  ADD CONSTRAINT comms_messages_kind_check
  CHECK (kind = ANY (ARRAY[
    'weekly_digest',
    'schedule_change',
    'game_recap',
    'tournament_prelim',
    'tournament_recap',
    'announcement',
    'custom_message',
    'rsvp_nudge',
    'academy_callup_notice',
    'coach_roundup'
  ]::text[]));

ALTER TABLE public.briefing_templates DROP CONSTRAINT briefing_templates_kind_check;
ALTER TABLE public.briefing_templates
  ADD CONSTRAINT briefing_templates_kind_check
  CHECK (kind = ANY (ARRAY[
    'weekly_digest',
    'schedule_change',
    'game_recap',
    'tournament_prelim',
    'tournament_recap',
    'announcement',
    'custom_message',
    'rsvp_nudge',
    'academy_callup_notice',
    'coach_roundup'
  ]::text[]));

ALTER TABLE public.briefing_triggers DROP CONSTRAINT briefing_triggers_kind_check;
ALTER TABLE public.briefing_triggers
  ADD CONSTRAINT briefing_triggers_kind_check
  CHECK (briefing_kind = ANY (ARRAY[
    'weekly_digest',
    'schedule_change',
    'game_recap',
    'tournament_prelim',
    'tournament_recap',
    'announcement',
    'custom_message',
    'rsvp_nudge',
    'academy_callup_notice',
    'coach_roundup'
  ]::text[]));
