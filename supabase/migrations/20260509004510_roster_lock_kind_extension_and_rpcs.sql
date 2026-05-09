-- ============================================================
-- ROSTER LOCK UX WAVE — schema delta
--
-- 1. Extend comms_messages.kind CHECK to allow academy_callup_notice
-- 2. Lock/unlock RPCs (transactional + audited + role-gated)
-- 3. Academy callup add/remove RPCs
-- 4. Tournament-wide roster UNION query (locked decision 1E)
--
-- All RPCs route audit through foundation log_pii_change(text, uuid,
-- text, text, text, uuid). Foundation columns used as-is:
--   events.locked_roster_player_ids uuid[]
--   events.locked_roster_at timestamptz
--   events.locked_roster_by uuid
--   events.academy_callup_player_ids uuid[]
-- ============================================================

-- 1. Extend kind CHECK constraint
ALTER TABLE public.comms_messages DROP CONSTRAINT comms_messages_kind_check;
ALTER TABLE public.comms_messages
  ADD CONSTRAINT comms_messages_kind_check
  CHECK (kind = ANY (ARRAY[
    'weekly_digest',
    'tournament_preliminary',
    'tournament_final',
    'tournament_rsvp_lock',
    'tournament_recap_interim',
    'tournament_recap_final',
    'schedule_change',
    'multi_team_notice',
    'academy_callup_notice',
    'custom'
  ]::text[]));

-- 2. lock_event_roster — captures snapshot + audits
CREATE OR REPLACE FUNCTION public.lock_event_roster(
  p_event_id uuid,
  p_player_ids uuid[]
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
DECLARE
  v_org uuid;
  v_role text;
  v_old_locked_at timestamptz;
  v_old_player_ids uuid[];
BEGIN
  SELECT org_id, locked_roster_at, locked_roster_player_ids
    INTO v_org, v_old_locked_at, v_old_player_ids
    FROM public.events WHERE id = p_event_id;
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
END $$;

-- 3. unlock_event_roster — preserves snapshot, clears lock metadata
CREATE OR REPLACE FUNCTION public.unlock_event_roster(
  p_event_id uuid,
  p_reason text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
DECLARE v_org uuid; v_role text;
BEGIN
  IF p_reason IS NULL OR length(trim(p_reason)) < 3 THEN
    RAISE EXCEPTION 'Unlock reason required (3+ chars)';
  END IF;

  SELECT org_id INTO v_org FROM public.events WHERE id = p_event_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Event not found'; END IF;

  SELECT role INTO v_role FROM public.user_roles
    WHERE user_id = auth.uid() AND organization_id = v_org
      AND role IN ('admin','coach') LIMIT 1;
  IF v_role IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;

  UPDATE public.events
    SET locked_roster_at = NULL,
        locked_roster_by = NULL
    WHERE id = p_event_id;

  PERFORM public.log_pii_change(
    'events', p_event_id, 'locked_roster_unlocked',
    NULL, p_reason, v_org
  );
END $$;

-- 4. add_academy_callup — appends to array (idempotent), audits
CREATE OR REPLACE FUNCTION public.add_academy_callup(
  p_event_id uuid,
  p_player_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
DECLARE v_org uuid; v_role text; v_old_ids uuid[]; v_new_ids uuid[];
BEGIN
  SELECT org_id, academy_callup_player_ids INTO v_org, v_old_ids
    FROM public.events WHERE id = p_event_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Event not found'; END IF;

  SELECT role INTO v_role FROM public.user_roles
    WHERE user_id = auth.uid() AND organization_id = v_org
      AND role IN ('admin','coach') LIMIT 1;
  IF v_role IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;

  v_new_ids := CASE WHEN p_player_id = ANY(v_old_ids) THEN v_old_ids
                    ELSE array_append(v_old_ids, p_player_id) END;

  UPDATE public.events
    SET academy_callup_player_ids = v_new_ids
    WHERE id = p_event_id;

  PERFORM public.log_pii_change(
    'events', p_event_id, 'academy_callup_added',
    v_old_ids::text, v_new_ids::text, v_org
  );
END $$;

-- 5. remove_academy_callup — removes from array, audits
CREATE OR REPLACE FUNCTION public.remove_academy_callup(
  p_event_id uuid,
  p_player_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
DECLARE v_org uuid; v_role text; v_old_ids uuid[]; v_new_ids uuid[];
BEGIN
  SELECT org_id, academy_callup_player_ids INTO v_org, v_old_ids
    FROM public.events WHERE id = p_event_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Event not found'; END IF;

  SELECT role INTO v_role FROM public.user_roles
    WHERE user_id = auth.uid() AND organization_id = v_org
      AND role IN ('admin','coach') LIMIT 1;
  IF v_role IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;

  v_new_ids := array_remove(v_old_ids, p_player_id);

  UPDATE public.events
    SET academy_callup_player_ids = v_new_ids
    WHERE id = p_event_id;

  PERFORM public.log_pii_change(
    'events', p_event_id, 'academy_callup_removed',
    v_old_ids::text, v_new_ids::text, v_org
  );
END $$;

-- 6. get_tournament_roster_player_ids — UNION across event lockedrosters + callups
CREATE OR REPLACE FUNCTION public.get_tournament_roster_player_ids(
  p_tournament_id uuid
) RETURNS uuid[]
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, pg_catalog AS $$
  SELECT COALESCE(array_agg(DISTINCT pid), '{}'::uuid[])
  FROM (
    SELECT unnest(locked_roster_player_ids) AS pid
    FROM public.events WHERE tournament_id = p_tournament_id
    UNION
    SELECT unnest(academy_callup_player_ids) AS pid
    FROM public.events WHERE tournament_id = p_tournament_id
  ) AS roster_union
  WHERE pid IS NOT NULL;
$$;

-- Permissions
REVOKE EXECUTE ON FUNCTION public.lock_event_roster(uuid, uuid[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.unlock_event_roster(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.add_academy_callup(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.remove_academy_callup(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lock_event_roster(uuid, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_event_roster(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_academy_callup(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_academy_callup(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tournament_roster_player_ids(uuid) TO authenticated;

-- 7. Verification block
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conrelid='public.comms_messages'::regclass
                   AND conname='comms_messages_kind_check'
                   AND pg_get_constraintdef(oid) ILIKE '%academy_callup_notice%') THEN
    RAISE EXCEPTION 'kind CHECK does not include academy_callup_notice';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname='lock_event_roster') THEN
    RAISE EXCEPTION 'lock_event_roster RPC missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname='unlock_event_roster') THEN
    RAISE EXCEPTION 'unlock_event_roster RPC missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname='add_academy_callup') THEN
    RAISE EXCEPTION 'add_academy_callup RPC missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname='remove_academy_callup') THEN
    RAISE EXCEPTION 'remove_academy_callup RPC missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname='get_tournament_roster_player_ids') THEN
    RAISE EXCEPTION 'get_tournament_roster_player_ids missing';
  END IF;
END $$;
