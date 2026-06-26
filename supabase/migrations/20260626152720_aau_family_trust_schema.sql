-- Track-1 family trust schema (D-FV2 + D-FV9), with the architect review §2 (live
-- guardian re-check) + §3 (caller-scoping) applied. Owner-approved + MCP-applied
-- 2026-06-26. Mirror of the applied migration (design draft:
-- docs/TRACK1_FAMILY_TRUST_SCHEMA_DRAFT_2026-06-26.sql). Film tables HELD (§C); the
-- Stripe webhook that writes family_entitlements HELD for the money-path review.

CREATE TABLE IF NOT EXISTS public.family_subscriptions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id           uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  opponent_id       uuid REFERENCES public.opponents(id) ON DELETE CASCADE,
  external_team_key text,
  display_name      text NOT NULL,
  notify_schedule   boolean NOT NULL DEFAULT true,
  notify_score      boolean NOT NULL DEFAULT true,
  notify_final      boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  resolved_key      text GENERATED ALWAYS AS (COALESCE(team_id::text, opponent_id::text, external_team_key, lower(btrim(display_name)))) STORED,
  CONSTRAINT family_sub_one_identity CHECK (num_nonnulls(team_id, opponent_id) <= 1),
  CONSTRAINT family_subscriptions_unique UNIQUE (user_id, resolved_key)
);
CREATE INDEX IF NOT EXISTS idx_family_subscriptions_user ON public.family_subscriptions (user_id);

CREATE TABLE IF NOT EXISTS public.family_entitlements (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id     text,
  stripe_subscription_id text,
  status                 text NOT NULL DEFAULT 'inactive' CHECK (status IN ('active','trialing','past_due','canceled','inactive')),
  current_period_end     timestamptz,
  updated_at             timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT family_entitlements_user_unique UNIQUE (user_id)
);
CREATE INDEX IF NOT EXISTS idx_family_entitlements_user ON public.family_entitlements (user_id);

CREATE TABLE IF NOT EXISTS public.family_children (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_guardian_id  uuid NOT NULL REFERENCES public.player_guardians(id) ON DELETE CASCADE,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT family_children_unique UNIQUE (user_id, player_guardian_id)
);
CREATE INDEX IF NOT EXISTS idx_family_children_user ON public.family_children (user_id);

CREATE OR REPLACE FUNCTION public.assert_family_child_verified()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.player_guardians pg
    JOIN public.guardians g ON g.id = pg.guardian_id
    WHERE pg.id = NEW.player_guardian_id AND g.user_id = NEW.user_id AND g.user_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'family_children: player_guardian_id % is not a confirmed guardian link for user % (verified guardianship required for child data)', NEW.player_guardian_id, NEW.user_id;
  END IF;
  RETURN NEW;
END;
$fn$;
DROP TRIGGER IF EXISTS trg_family_child_verified ON public.family_children;
CREATE TRIGGER trg_family_child_verified BEFORE INSERT OR UPDATE ON public.family_children FOR EACH ROW EXECUTE FUNCTION public.assert_family_child_verified();

CREATE OR REPLACE FUNCTION public.is_entitled(p_user uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $fn$
  SELECT (p_user = (SELECT auth.uid()) OR (SELECT auth.role()) = 'service_role')
     AND EXISTS (
       SELECT 1 FROM public.family_entitlements e
       WHERE e.user_id = p_user AND e.status IN ('active','trialing')
         AND (e.current_period_end IS NULL OR e.current_period_end > now())
     );
$fn$;

CREATE OR REPLACE FUNCTION public.can_access_child(p_user uuid, p_player_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $fn$
  SELECT (p_user = (SELECT auth.uid()) OR (SELECT auth.role()) = 'service_role')
     AND public.is_entitled(p_user)
     AND EXISTS (
       SELECT 1 FROM public.family_children fc
       JOIN public.player_guardians pg ON pg.id = fc.player_guardian_id
       JOIN public.guardians        g  ON g.id  = pg.guardian_id AND g.user_id = p_user
       WHERE fc.user_id = p_user AND pg.player_id = p_player_id
     );
$fn$;

ALTER TABLE public.family_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_entitlements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_children      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS family_subscriptions_select ON public.family_subscriptions;
CREATE POLICY family_subscriptions_select ON public.family_subscriptions FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS family_subscriptions_insert ON public.family_subscriptions;
CREATE POLICY family_subscriptions_insert ON public.family_subscriptions FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS family_subscriptions_update ON public.family_subscriptions;
CREATE POLICY family_subscriptions_update ON public.family_subscriptions FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS family_subscriptions_delete ON public.family_subscriptions;
CREATE POLICY family_subscriptions_delete ON public.family_subscriptions FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS family_entitlements_select ON public.family_entitlements;
CREATE POLICY family_entitlements_select ON public.family_entitlements FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS family_children_select ON public.family_children;
CREATE POLICY family_children_select ON public.family_children FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS family_children_insert ON public.family_children;
CREATE POLICY family_children_insert ON public.family_children FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS family_children_delete ON public.family_children;
CREATE POLICY family_children_delete ON public.family_children FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_subscriptions TO authenticated, service_role;
GRANT SELECT ON public.family_entitlements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_entitlements TO service_role;
GRANT SELECT, INSERT, DELETE ON public.family_children TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_entitled(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_entitled(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.is_entitled(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.can_access_child(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_access_child(uuid, uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.can_access_child(uuid, uuid) TO authenticated, service_role;
