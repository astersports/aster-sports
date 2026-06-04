-- Briefings Phase 3 — D-2(α-schema) BUG B fix: widen comms_messages_audience_type_check
-- to include the 4 documented audience types that the prior CHECK rejected.
--
-- Cross-reference: docs/REDESIGN_BRIEFINGS_2026-06-03.md §2.D-2.
-- Origin: docs/AUDIT_BRIEFINGS_2026-06-02.md §1.2-DEEP-1 + §B4.1 (4-way drift).
-- Applied via Supabase MCP by chat-CC 2026-06-03 19:49:47 UTC.
-- Mirror per AP #21 (split-of-labor: chat applies, terminal CC mirrors).
--
-- The prior CHECK (mig 20260508234920 / 20260509161303 foundation) only
-- allowed: team, multi_team, tournament_attendees, event_attendees,
-- org_all, custom. But BRIEFINGS_COVERAGE_L99.md + KIND_METADATA had
-- shipped 4 additional values as defaults for specific kinds:
--
--   player_specific          — academy_callup_notice (audienceLocked)
--   multi_event_attendees    — games_recap (audienceLocked)
--   coach_self               — coach_roundup
--   family_specific          — family_guide
--
-- Production impact prior to this fix (per §1.2-DEEP-1 + B3.3):
--   - academyCallupSend.js:81 hard-codes audience_type='player_specific' →
--     CHECK rejected → 0 callup_notice sends ever succeeded
--   - games_recap (audienceLocked='multi_event_attendees') → 0 sends
--   - coach_roundup + family_guide → wizard silently coerced to
--     team/multi_team (21 production rows with wrong-but-allowed values)
--
-- Frank routed: widen CHECK now (this migration); backfill of the 21
-- legacy-coerced rows DROPPED from Phase 3 (PR 9 canceled per
-- 2026-06-03 routing) — those rows stay as-is.
--
-- Phase 3 D-2(γ-UI) companion (separate PR): AudiencePicker.MODES
-- prepends the kindMetadata default if not present, so admin sees
-- the semantic default as the active option.
--
-- Phase 3 D-7 companion (separate PR): audience-catalog parity vitest
-- to lock CHECK ↔ KIND_METADATA ↔ MODES ↔ AUDIENCE_LABEL alignment.

ALTER TABLE public.comms_messages
  DROP CONSTRAINT IF EXISTS comms_messages_audience_type_check;

ALTER TABLE public.comms_messages
  ADD CONSTRAINT comms_messages_audience_type_check CHECK (
    audience_type IS NULL
    OR audience_type = ANY (ARRAY[
      'team', 'multi_team',
      'tournament_attendees', 'event_attendees',
      'org_all', 'custom',
      'player_specific',
      'multi_event_attendees',
      'coach_self',
      'family_specific'
    ])
  );

-- Verification: confirm all 10 values + NULL pass the new constraint.
do $$
declare
  v_def text;
begin
  select pg_get_constraintdef(oid) into v_def
    from pg_constraint
   where conrelid = 'public.comms_messages'::regclass
     and conname = 'comms_messages_audience_type_check';
  if v_def is null then
    raise exception 'comms_messages_audience_type_check missing after re-create';
  end if;
  foreach v_def in array array['team','multi_team','tournament_attendees','event_attendees','org_all','custom','player_specific','multi_event_attendees','coach_self','family_specific'] loop
    perform 1
       from pg_constraint
      where conrelid = 'public.comms_messages'::regclass
        and conname = 'comms_messages_audience_type_check'
        and pg_get_constraintdef(oid) like '%'||v_def||'%';
    if not found then
      raise exception 'value % missing from re-created CHECK', v_def;
    end if;
  end loop;
  raise notice 'audience_type CHECK widened to 10 values + NULL';
end $$;
