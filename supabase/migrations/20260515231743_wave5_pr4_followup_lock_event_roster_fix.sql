-- Wave 5 follow-up (cutover wave) — fix lock_event_roster which
-- queried events.org_id. The events table has no org_id column; the
-- org link is through events.team_id → teams.org_id. The bug was
-- introduced in 20260509004510_roster_lock_kind_extension_and_rpcs
-- which assumed an org_id column that doesn't exist on events.
-- Production-affecting: Frank's Lock roster button surfaces
-- `column "org_id" does not exist` in the UI and the lock never
-- happens.

CREATE OR REPLACE FUNCTION public.lock_event_roster(p_event_id uuid, p_player_ids uuid[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_org uuid;
  v_role text;
  v_old_locked_at timestamptz;
  v_old_player_ids uuid[];
BEGIN
  SELECT t.org_id, e.locked_roster_at, e.locked_roster_player_ids
    INTO v_org, v_old_locked_at, v_old_player_ids
    FROM public.events e
    JOIN public.teams t ON e.team_id = t.id
    WHERE e.id = p_event_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Event not found'; END IF;

  SELECT role INTO v_role FROM public.user_roles
    WHERE user_id = auth.uid() AND organization_id = v_org
      AND role IN ('admin','coach') LIMIT 1;
  IF v_role IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;

  IF p_player_ids IS NULL OR array_length(p_player_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Roster cannot be empty';
  END IF;

  UPDATE public.events
    SET locked_roster_player_ids = p_player_ids,
        locked_roster_at = NOW(),
        locked_roster_by = auth.uid()
    WHERE id = p_event_id;

  PERFORM public.log_pii_change(
    'events', p_event_id, 'locked_roster_at',
    COALESCE(v_old_locked_at::text, ''), NOW()::text, v_org
  );
  PERFORM public.log_pii_change(
    'events', p_event_id, 'locked_roster_player_ids',
    COALESCE(v_old_player_ids::text, '{}'),
    p_player_ids::text, v_org
  );
END $function$;
