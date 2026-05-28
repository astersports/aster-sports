-- Stream A (§16.5) automatic event reminders: idempotency log + trigger wiring.

CREATE TABLE IF NOT EXISTS public.event_reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  offset_bucket text NOT NULL CHECK (offset_bucket IN ('72h','24h','4h')),
  recipient_count integer NOT NULL DEFAULT 0,
  push_sent integer NOT NULL DEFAULT 0,
  email_sent integer NOT NULL DEFAULT 0,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, offset_bucket)
);

CREATE INDEX IF NOT EXISTS event_reminder_log_org_idx ON public.event_reminder_log (org_id);

-- RLS on, no authenticated/anon policies = deny-all for non-service roles.
-- Operational send-metadata; the edge function writes it via service role
-- (which bypasses RLS). Add an admin SELECT policy later if a UI needs it.
ALTER TABLE public.event_reminder_log ENABLE ROW LEVEL SECURITY;

-- Allow the 'event_reminder' kind on the auto-draft trigger config. The
-- direct-send path does NOT write comms_messages rows, so comms_messages
-- .kind_check is intentionally left unchanged.
ALTER TABLE public.briefing_triggers DROP CONSTRAINT IF EXISTS briefing_triggers_kind_check;
ALTER TABLE public.briefing_triggers ADD CONSTRAINT briefing_triggers_kind_check
  CHECK (briefing_kind = ANY (ARRAY[
    'weekly_digest','schedule_change','game_recap','tournament_prelim','tournament_recap',
    'announcement','custom_message','rsvp_nudge','academy_callup_notice','coach_roundup',
    'family_guide','games_recap','event_reminder'
  ]));

-- Seed one active event_reminder_due trigger for Legacy Hoopers. The handler
-- iterates all teams' games itself (index.ts collapses per org/trigger_event),
-- so one row per org suffices. lead_time_hours is NULL — the 3d/1d/4h cadence
-- is fixed in the handler, not read from the trigger row.
INSERT INTO public.briefing_triggers (org_id, team_type_id, trigger_event, briefing_kind, lead_time_hours, active)
SELECT 'e3e95e21-3571-4e9a-985a-d5d01480d4a6', NULL, 'event_reminder_due', 'event_reminder', NULL, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.briefing_triggers
  WHERE org_id = 'e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND trigger_event = 'event_reminder_due'
);
