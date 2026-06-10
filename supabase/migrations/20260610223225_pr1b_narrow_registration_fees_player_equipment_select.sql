-- D2 / pr1b — narrow registration_fees + player_equipment SELECT from org-wide to
-- admin-or-own-child. Architect-ruled apply-now, Frank GO 2026-06-10. Mirror of the
-- MCP apply (AP#21); production version 20260610223225.
--
-- WHY NOW: the org-wide deviation in 20260531222056 was contract-only and safe
-- under "no parent-facing UI queries these tables." That precondition EXPIRED this
-- session — B1 (My Family, /family) + B2 (magic-link claim) shipped, so any
-- authenticated parent could read every family's per-registration fee amounts +
-- equipment rows via a crafted PostgREST query. This applies the documented REVERT
-- PATH from 20260531222056. Staff read = admin-only (money/equipment-sensitive; no
-- coach surface reads these). current_user_player_ids() is the same helper the
-- shipped registrations_select_parent uses.
--
-- VERIFIED LIVE (impersonated JWT replay): player_equipment 95 rows total — admin
-- sees 95, sample parent (2 kids) sees 3 own-child rows, cross-family = 0.
-- registration_fees 0 rows today (leak surface empty; contract now fixed).

-- registration_fees: no player_id column → join through registration_id.
DROP POLICY registration_fees_select ON public.registration_fees;
CREATE POLICY registration_fees_select ON public.registration_fees
  FOR SELECT TO authenticated
  USING (
    user_has_role_in_org(org_id, ARRAY['admin'::text])
    OR registration_id IN (
      SELECT r.id FROM public.registrations r
      WHERE r.player_id = ANY (current_user_player_ids())
    )
  );

-- player_equipment: player_id directly.
DROP POLICY player_equipment_select ON public.player_equipment;
CREATE POLICY player_equipment_select ON public.player_equipment
  FOR SELECT TO authenticated
  USING (
    user_has_role_in_org(org_id, ARRAY['admin'::text])
    OR player_id = ANY (current_user_player_ids())
  );
