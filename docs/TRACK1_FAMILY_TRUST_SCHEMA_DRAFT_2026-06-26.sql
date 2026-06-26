-- ============================================================================
-- TRACK 1 — AAU FAMILY HUB : FAMILY TRUST SCHEMA (Tier-1 / Tier-2 / Entitlement)
-- D-FV2 + D-FV9 — DRAFT FOR ARCHITECT DESIGN REVIEW
-- ============================================================================
-- STATUS: *** NOT APPLIED. DO NOT APPLY. *** Design-review artifact (docs/).
--   Owner applies after the architect reviews the STRUCTURAL enforcement (the
--   architect explicitly asked to verify guardianship is enforced at the DB, not
--   just in app code). At apply time it moves to supabase/migrations/ with the
--   production version prefix (AP #21).
--
-- ENCODES THE RATIFIED CONTRACT (ARCHITECT_RATIFICATION_AAU_FAMILY_2026-06-26.txt §2):
--   THE INVARIANT (live, at read time):
--     canAccessChildData(user, child) = hasPaidEntitlement(user)
--                                       AND isVerifiedGuardian(user, child)
--   - GUARDIANSHIP is DURABLE  -> the child-link row PERSISTS; FK-enforced so it is
--     UN-CREATABLE without the verified player_guardians relationship.
--   - ENTITLEMENT is CURRENT   -> a separate Stripe-derived state, read LIVE; a lapse
--     SUSPENDS child access even though the child-link row remains.
--   - The two are PHYSICALLY SEPARATE (different tables/columns). Neither is
--     satisfiable by the other: payment never implies guardianship; guardianship is
--     never satisfiable by payment.
--
-- THREE TIERS:
--   TIER 1  family_subscriptions  — follow ANY public team (open claim, org-agnostic).
--           PUBLIC data + team-level push ONLY. Carries ZERO child columns -> a Tier-1
--           row CANNOT expose child data, structurally. Following a team != claiming a kid.
--   TIER 2  family_children       — a VERIFIED child link. FK to player_guardians +
--           a trigger asserting the guardian is THIS user (email-confirmed claim).
--   D-FV9   family_entitlements    — Stripe-derived entitlement state, separate column,
--           written ONLY by the (held) Stripe webhook, read live by the AND-gate.
--
-- HELD (NOT in this draft): all FILM / media tables (§C posture — multi-minor
--   minimization, jersey-OCR-only / no facial recognition, sub-processor DPA + consent,
--   retention/deletion). The film bucket is gated on can_access_child() below PLUS §C.
--
-- MONEY-PATH: this draft is SCHEMA ONLY. The Stripe webhook that WRITES
--   family_entitlements (idempotent, derive-don't-double-grant — the H1 ledger lens)
--   is HELD for the architect money-path review before any billing code merges. Live
--   Stripe keys != live billing. CC does not wire billing logic without that sign-off.
--
-- GROUNDED @ #1101: player_guardians(id PK, player_id, guardian_id, relationship,
--   is_primary, UNIQUE(player_id,guardian_id)) 003_core_data_model.sql:99; guardians.user_id
--   set on email-confirmed claim (claim_guardian_by_email, 20260609024700) -> the
--   confirmed-guardian signal; auth.users; teams; opponents.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- TIER 1 — family_subscriptions : follow any team's PUBLIC data. NO child columns.
--   Org-agnostic (user_id + 3-way team identity, mirrors the standings OQ2 model) so
--   cross-program PUBLIC tracking "just works" without the multi-org auth refactor.
--   Notification prefs are for PUBLIC-FACTUAL team events only (schedule/score/final).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.family_subscriptions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,   -- the following account; org-agnostic
  team_id           uuid REFERENCES public.teams(id) ON DELETE CASCADE,          -- our team, if this maps to one
  opponent_id       uuid REFERENCES public.opponents(id) ON DELETE CASCADE,      -- a known external team
  external_team_key text,                                                        -- scraper TM team id (cross-program)
  display_name      text NOT NULL,                                               -- always present (scraped name)
  notify_schedule   boolean NOT NULL DEFAULT true,                               -- PUBLIC events only
  notify_score      boolean NOT NULL DEFAULT true,
  notify_final      boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  resolved_key      text GENERATED ALWAYS AS (
                      COALESCE(team_id::text, opponent_id::text, external_team_key, lower(btrim(display_name)))
                    ) STORED,
  CONSTRAINT family_sub_one_identity CHECK (num_nonnulls(team_id, opponent_id) <= 1),
  CONSTRAINT family_subscriptions_unique UNIQUE (user_id, resolved_key)
);
CREATE INDEX IF NOT EXISTS idx_family_subscriptions_user ON public.family_subscriptions (user_id);
-- NOTE: there is deliberately NO player_id / child column on this table. Tier-1 data
-- exposure is structurally bounded to PUBLIC team facts.

-- ----------------------------------------------------------------------------
-- D-FV9 — family_entitlements : Stripe-derived commercial state. SEPARATE from
--   guardianship. Written ONLY by the (held) Stripe webhook via service_role; the
--   user can never write it. Read live by is_entitled().
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.family_entitlements (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id     text,
  stripe_subscription_id text,
  status                 text NOT NULL DEFAULT 'inactive'      -- mirrors Stripe subscription status
    CHECK (status IN ('active','trialing','past_due','canceled','inactive')),
  current_period_end     timestamptz,                          -- entitlement is CURRENT; it lapses
  updated_at             timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT family_entitlements_user_unique UNIQUE (user_id)  -- one entitlement per account
);
CREATE INDEX IF NOT EXISTS idx_family_entitlements_user ON public.family_entitlements (user_id);

-- ----------------------------------------------------------------------------
-- TIER 2 — family_children : the VERIFIED child link. FK to the player_guardians
--   relationship makes it un-creatable without that row; the trigger below asserts
--   the linked guardian is THIS user (email-confirmed claim). Guardianship is DURABLE:
--   this row persists across entitlement lapses.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.family_children (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_guardian_id  uuid NOT NULL REFERENCES public.player_guardians(id) ON DELETE CASCADE,  -- the VERIFIED link
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT family_children_unique UNIQUE (user_id, player_guardian_id)
);
CREATE INDEX IF NOT EXISTS idx_family_children_user ON public.family_children (user_id);

-- STRUCTURAL enforcement (not just app code): a family_children row is un-creatable
-- unless the referenced player_guardians row belongs to a guardian whose user_id is
-- THIS user (i.e. an email-confirmed claim). A simple FK can't express the cross-row
-- "...and that guardian is this user" condition, so a BEFORE trigger does — and it
-- fires for EVERY writer, including service_role (RLS does not).
CREATE OR REPLACE FUNCTION public.assert_family_child_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.player_guardians pg
    JOIN public.guardians g ON g.id = pg.guardian_id
    WHERE pg.id = NEW.player_guardian_id
      AND g.user_id = NEW.user_id          -- the guardian IS this user...
      AND g.user_id IS NOT NULL            -- ...via an email-confirmed claim (the confirmed-guardian signal)
  ) THEN
    RAISE EXCEPTION
      'family_children: player_guardian_id % is not a confirmed guardian link for user % (verified guardianship required for child data)',
      NEW.player_guardian_id, NEW.user_id;
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_family_child_verified ON public.family_children;
CREATE TRIGGER trg_family_child_verified
  BEFORE INSERT OR UPDATE ON public.family_children
  FOR EACH ROW EXECUTE FUNCTION public.assert_family_child_verified();

-- ----------------------------------------------------------------------------
-- THE GATE — is_entitled() (current) and can_access_child() (the live AND).
--   These are the ONLY place the two checks combine. Child surfaces (per-child push,
--   and later FILM) call can_access_child() at READ time, so an entitlement lapse
--   suspends access while the durable child-link row stays put.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_entitled(p_user uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $fn$
  -- Caller-scoping (architect review §3): an authenticated caller may only ask about
  -- THEMSELVES; service_role may ask about anyone (server-side film/push authz). Closes
  -- the relationship-probing side channel. Fail-closed: unauthorized probe -> false.
  SELECT (p_user = (SELECT auth.uid()) OR (SELECT auth.role()) = 'service_role')
     AND EXISTS (
       SELECT 1 FROM public.family_entitlements e
       WHERE e.user_id = p_user
         AND e.status IN ('active','trialing')
         AND (e.current_period_end IS NULL OR e.current_period_end > now())
     );
$fn$;

CREATE OR REPLACE FUNCTION public.can_access_child(p_user uuid, p_player_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $fn$
  -- Caller-scoping (architect review §3): authenticated asks only about itself;
  -- service_role may ask about anyone (server-side film/push authz).
  SELECT (p_user = (SELECT auth.uid()) OR (SELECT auth.role()) = 'service_role')
     -- BOTH halves of the gate live (architect review §2 REQUIRED):
     --   current entitlement (is_entitled) AND a guardian STILL claimed by this user.
     --   The added guardians JOIN with g.user_id = p_user re-checks the claim live, so a
     --   REASSIGNED/REVOKED claim (user_id changed, not just the row deleted) cuts access
     --   immediately, fail-closed. The family_children ROW still persists (guardianship
     --   durable); only ACCESS goes live.
     AND public.is_entitled(p_user)
     AND EXISTS (
       SELECT 1
       FROM public.family_children fc
       JOIN public.player_guardians pg ON pg.id = fc.player_guardian_id
       JOIN public.guardians        g  ON g.id  = pg.guardian_id
                                      AND g.user_id = p_user        -- live claim re-check (REQUIRED)
       WHERE fc.user_id   = p_user
         AND pg.player_id = p_player_id
     );
$fn$;

-- ----------------------------------------------------------------------------
-- RLS — own-rows only. Entitlements are READ-ONLY to the user (webhook writes).
-- ----------------------------------------------------------------------------
ALTER TABLE public.family_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_entitlements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_children      ENABLE ROW LEVEL SECURITY;

-- family_subscriptions: a user fully manages their own follows.
DROP POLICY IF EXISTS family_subscriptions_select ON public.family_subscriptions;
CREATE POLICY family_subscriptions_select ON public.family_subscriptions
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS family_subscriptions_insert ON public.family_subscriptions;
CREATE POLICY family_subscriptions_insert ON public.family_subscriptions
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS family_subscriptions_update ON public.family_subscriptions;
CREATE POLICY family_subscriptions_update ON public.family_subscriptions
  FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS family_subscriptions_delete ON public.family_subscriptions;
CREATE POLICY family_subscriptions_delete ON public.family_subscriptions
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- family_entitlements: user can READ own; NO user write (service_role/webhook only,
-- which bypasses RLS). No INSERT/UPDATE/DELETE policy for authenticated = no user write.
DROP POLICY IF EXISTS family_entitlements_select ON public.family_entitlements;
CREATE POLICY family_entitlements_select ON public.family_entitlements
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- family_children: user manages own links; the trigger enforces verified guardianship
-- on top of the WITH CHECK (defense in depth — RLS for the authenticated path, trigger
-- for ALL paths incl. service_role).
DROP POLICY IF EXISTS family_children_select ON public.family_children;
CREATE POLICY family_children_select ON public.family_children
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS family_children_insert ON public.family_children;
CREATE POLICY family_children_insert ON public.family_children
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS family_children_delete ON public.family_children;
CREATE POLICY family_children_delete ON public.family_children
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_subscriptions TO authenticated, service_role;
GRANT SELECT ON public.family_entitlements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_entitlements TO service_role;   -- webhook writes
GRANT SELECT, INSERT, DELETE ON public.family_children TO authenticated, service_role;

-- Gate helpers: child data is NEVER anon. Grant to authenticated + service_role only
-- (AP #23/#57: revoke PUBLIC + anon first, then grant explicitly).
REVOKE EXECUTE ON FUNCTION public.is_entitled(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_entitled(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.is_entitled(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.can_access_child(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_access_child(uuid, uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.can_access_child(uuid, uuid) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================================
-- OPEN QUESTIONS FOR THE ARCHITECT
-- ============================================================================
-- TQ1  CONFIRMED-GUARDIAN SIGNAL: the trigger treats guardians.user_id IS NOT NULL
--      (email-confirmed claim) as "verified." The ratification §2(a) said "is_primary
--      or an equivalent confirmed flag." CC reads g.user_id (the claim link) AS the
--      confirmed flag — a SECOND parent (is_primary=false) is still a real guardian, so
--      CC did NOT additionally require is_primary. Confirm: claim-link is sufficient, or
--      also require is_primary? CC lean: claim-link sufficient (don't lock out a
--      verified non-primary parent).
--
-- TQ2  ENTITLEMENT GRANULARITY: family_entitlements is per-USER (one paying account).
--      A family with two guardian accounts would each need their own entitlement to
--      see child data. Alternative: entitlement per "family group" shared across the
--      kid's guardians. CC lean: per-user for v1 (simplest; matches "one paid family
--      account"); revisit if households share. Confirm.
--
-- TQ3  WEBHOOK DERIVATION (money-path, HELD): family_entitlements is written by the
--      Stripe webhook only. The handler must be IDEMPOTENT (retries don't double-write),
--      derive status from the Stripe event (not trust client), and read like the credit
--      ledger derives balance. That handler is NOT in this draft — it needs the money-
--      path review before any billing code merges. Confirm the schema shape supports it
--      (status enum + current_period_end + stripe ids) before CC drafts the handler.
--
-- TQ4  FILM (HELD, Track 2): the film bucket + media tables gate on can_access_child()
--      PLUS the §C posture. Confirm can_access_child() is the right gate signature for
--      the future film upload path (per-player), so the gate is settled before §C design.
-- ============================================================================

-- ============================================================================
-- ARCHITECT REVIEW APPLIED 2026-06-26 (architectreviewfamilytrustschema.txt)
-- ============================================================================
-- VERDICT: approved in shape. The two review items are now APPLIED above:
--   REQUIRED (§2): can_access_child() now JOINs guardians ... AND g.user_id = p_user,
--     so guardianship is re-verified LIVE -- a reassigned/revoked claim cuts access
--     fail-closed, while the family_children row stays (guardianship durable).
--   RECOMMENDED (§3): is_entitled() + can_access_child() now scope to the caller
--     (p_user = auth.uid() OR auth.role() = 'service_role') -- no relationship-probing
--     side channel; service_role retains server-side authz for film/push.
--
-- TQ RULINGS (architect):
--   TQ1 CONFIRMED: claim-link (guardians.user_id IS NOT NULL) is the verified signal;
--       do NOT require is_primary. The §2 live re-check makes this safe over time.
--   TQ2 per-USER entitlement is fine for v1. TWO PRODUCT CALLS ARE FRANK'S, not built:
--       (i) a verified SECOND parent of the same kid needs their OWN subscription to see
--           data -- accept for v1, or plan household sharing later (schema supports both);
--       (ii) is_entitled() currently treats 'past_due' as NOT entitled (access cuts the
--           moment a payment fails) -- Frank may want a past_due GRACE window instead.
--       Both are pricing/packaging calls; left as-is pending Frank.
--   TQ3 CONFIRMED shape; the Stripe webhook handler stays HELD for the money-path review.
--       When built: guard OUT-OF-ORDER Stripe delivery (apply only if newer); consider a
--       last-applied marker (stripe_event_id + event_ts) so the upsert is idempotent AND
--       order-safe; derive status from the Stripe object, never the client.
--   TQ4 CONFIRMED: can_access_child(user, player) is the right per-player film gate. Film
--       stays HELD for §C (minimize raw multi-minor retention is load-bearing: the gate
--       authorizes uploader<->THEIR kid; raw film still contains other minors it can't).
--
-- STATUS: with §2+§3 applied, the trust schema is APPLY-READY (owner applies; no agent
--   MCP-apply). family_entitlements webhook HELD for money-path review. Film HELD for §C.
-- ============================================================================
