-- Track-S S3 — collapse briefing_triggers per-team_type sprawl to ONE org-wide
-- row per (org_id, trigger_event).
--
-- Behavior-identical: briefing-auto-draft-tick/index.ts already dedupes by
-- (org_id, trigger_event) (only the first row per pair runs) and NO handler
-- reads team_type_id (verified vestigial — it appears only in a comment). All
-- duplicate rows within a group are identical except team_type_id (verified: 1
-- distinct briefing_kind / lead_time_hours / active per group). The only reader
-- is index.ts. This removes the dead rows; the UNIQUE constraint prevents
-- re-sprawl. Applied via MCP 2026-06-04 (version 20260604032557); LH went 23 -> 7
-- rows. Mirror per AP #21.

-- 1. Keep one row per (org_id, trigger_event) — the earliest created — delete the rest.
DELETE FROM public.briefing_triggers bt
USING (
  SELECT id, row_number() OVER (PARTITION BY org_id, trigger_event ORDER BY created_at, id) AS rn
  FROM public.briefing_triggers
) ranked
WHERE bt.id = ranked.id AND ranked.rn > 1;

-- 2. NULL team_type_id on the survivors — these are now org-wide triggers.
UPDATE public.briefing_triggers SET team_type_id = NULL WHERE team_type_id IS NOT NULL;

-- 3. Prevent re-sprawl: one trigger per (org_id, trigger_event).
ALTER TABLE public.briefing_triggers
  ADD CONSTRAINT briefing_triggers_org_event_unique UNIQUE (org_id, trigger_event);
