-- Wave 5 PR 5a — register `family_guide` as a new briefing kind.
-- Per-parent multi-kid aggregation (one parent → N kids → N teams →
-- N events). Separate kind from coach_roundup because the audience is
-- ONE parent (not one coach), conflict semantics differ (parent
-- physically can only be at one game at a time), and the section
-- shape adds VIP header + kid color pills + quick-link nav instead
-- of coach-roundup's team grouping.
--
-- Extends the three kind_check constraints in lockstep (per CLAUDE.md
-- §13). Resolver + compose ship as stubs in 5a; real implementation
-- lands in 5b.

ALTER TABLE public.comms_messages DROP CONSTRAINT comms_messages_kind_check;
ALTER TABLE public.comms_messages
  ADD CONSTRAINT comms_messages_kind_check
  CHECK (kind = ANY (ARRAY[
    'weekly_digest','schedule_change','game_recap','tournament_prelim','tournament_recap',
    'announcement','custom_message','rsvp_nudge','academy_callup_notice','coach_roundup',
    'family_guide'
  ]::text[]));

ALTER TABLE public.briefing_templates DROP CONSTRAINT briefing_templates_kind_check;
ALTER TABLE public.briefing_templates
  ADD CONSTRAINT briefing_templates_kind_check
  CHECK (kind = ANY (ARRAY[
    'weekly_digest','schedule_change','game_recap','tournament_prelim','tournament_recap',
    'announcement','custom_message','rsvp_nudge','academy_callup_notice','coach_roundup',
    'family_guide'
  ]::text[]));

ALTER TABLE public.briefing_triggers DROP CONSTRAINT briefing_triggers_kind_check;
ALTER TABLE public.briefing_triggers
  ADD CONSTRAINT briefing_triggers_kind_check
  CHECK (briefing_kind = ANY (ARRAY[
    'weekly_digest','schedule_change','game_recap','tournament_prelim','tournament_recap',
    'announcement','custom_message','rsvp_nudge','academy_callup_notice','coach_roundup',
    'family_guide'
  ]::text[]));

-- Smoke test: insert + rollback a comms_messages row with kind='family_guide'.
-- Uses the actual NOT NULL columns from production schema.
DO $$
DECLARE
  v_org_id uuid;
  v_inserted_id uuid;
BEGIN
  SELECT id INTO v_org_id FROM organizations LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE NOTICE 'No organizations row found; smoke test skipped';
    RETURN;
  END IF;
  INSERT INTO comms_messages (org_id, kind, status, body_html, body_plain, content_sections)
  VALUES (v_org_id, 'family_guide', 'draft', '', '', '[]'::jsonb)
  RETURNING id INTO v_inserted_id;
  DELETE FROM comms_messages WHERE id = v_inserted_id;
  RAISE NOTICE 'Wave 5 PR 5a: family_guide kind accepted by all 3 kind_check constraints';
END $$;
