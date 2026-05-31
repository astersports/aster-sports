-- Migration #6 (EMBER_PROGRAM_SETUP_SPEC_v2 §4.5 step 6): registrations + all new columns.
-- The conversion-surface table: one row per (program, player) sign-up. Three native enums
-- (mirror program_type / division_fee_type style). FK cascade per §4.4: programs→RESTRICT
-- (must cancel registrations before deleting a program), players→RESTRICT, team_id→SET NULL
-- (nullable: unallocated until placed), promoted_from_registration_id→self SET NULL (tryout→season
-- link). RLS mirrors divisions/programs (admin write, org-scoped authenticated select); parent-facing
-- SELECT/INSERT policies via current_user_org_ids() are deferred to migration #12 per spec §4.3
-- (the public registration flow that writes these rows is a later UI PR). Applied via Supabase MCP
-- 2026-05-31 (version 20260531120820).

-- registration_tier: 3 ship in v1 per §4.2 F1.v1.1 (call_up removed — it's a roster action, not a reg tier).
CREATE TYPE public.registration_tier AS ENUM ('full_roster','practice_roster','practice_player');
-- waitlist_state: tryout/season waitlist lifecycle.
CREATE TYPE public.waitlist_state AS ENUM ('none','on_list','promoted_credit','promoted_pay','refund_released');
-- registration_status: the registration's own lifecycle (distinct from waitlist_state).
CREATE TYPE public.registration_status AS ENUM ('pending','confirmed','waitlist','cancelled','payment_overdue');

CREATE TABLE public.registrations (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                        uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  program_id                    uuid NOT NULL REFERENCES public.programs(id) ON DELETE RESTRICT,
  player_id                     uuid NOT NULL REFERENCES public.players(id) ON DELETE RESTRICT,
  team_id                       uuid REFERENCES public.teams(id) ON DELETE SET NULL,  -- nullable: unallocated until placed
  registration_tier            public.registration_tier NOT NULL DEFAULT 'full_roster',
  waitlist_state               public.waitlist_state NOT NULL DEFAULT 'none',
  promoted_from_registration_id uuid REFERENCES public.registrations(id) ON DELETE SET NULL,  -- tryout → season link
  status                       public.registration_status NOT NULL DEFAULT 'pending',
  sms_opt_in_p1                boolean NOT NULL DEFAULT false,
  sms_opt_in_p2                boolean NOT NULL DEFAULT false,
  emergency_contact_name       text,
  emergency_contact_phone      text,
  emergency_contact_relationship text,
  secondary_contact_name       text,
  secondary_contact_phone      text,
  medical_notes                text,
  conduct_acknowledged_at      timestamptz,
  custom_responses             jsonb,   -- St Pats CCD, AAU membership #, etc. (per-program form answers)
  created_at                   timestamptz NOT NULL DEFAULT now(),
  updated_at                   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_registrations_program_id ON public.registrations(program_id);
CREATE INDEX idx_registrations_player_id  ON public.registrations(player_id);
CREATE INDEX idx_registrations_team_id    ON public.registrations(team_id);
CREATE INDEX idx_registrations_org_id     ON public.registrations(org_id);

CREATE TRIGGER trg_registrations_updated_at BEFORE UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- RLS mirrors programs/divisions: authenticated SELECT scoped to own org; admin-only writes.
-- Parent-facing SELECT (own child's registrations) + INSERT (public registration flow) land in
-- migration #12 with current_user_org_ids() per spec §4.3.
CREATE POLICY registrations_select ON public.registrations
  FOR SELECT TO authenticated USING (org_id = current_user_org_id());
CREATE POLICY registrations_insert ON public.registrations
  FOR INSERT WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin'::text]));
CREATE POLICY registrations_update ON public.registrations
  FOR UPDATE USING (user_has_role_in_org(org_id, ARRAY['admin'::text]))
            WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin'::text]));
CREATE POLICY registrations_delete ON public.registrations
  FOR DELETE USING (user_has_role_in_org(org_id, ARRAY['admin'::text]));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.registrations TO anon, authenticated, service_role;

-- Verify.
DO $$
DECLARE v_cols int;
BEGIN
  IF (SELECT relkind FROM pg_class WHERE oid='public.registrations'::regclass) <> 'r' THEN
    RAISE EXCEPTION 'verify failed: registrations is not a base table';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.registrations'::regclass) THEN
    RAISE EXCEPTION 'verify failed: RLS not enabled';
  END IF;
  IF (SELECT count(*) FROM pg_policy WHERE polrelid='public.registrations'::regclass) <> 4 THEN
    RAISE EXCEPTION 'verify failed: expected 4 RLS policies, got %', (SELECT count(*) FROM pg_policy WHERE polrelid='public.registrations'::regclass);
  END IF;
  IF (SELECT count(*) FROM pg_enum WHERE enumtypid='public.registration_tier'::regtype) <> 3
   OR (SELECT count(*) FROM pg_enum WHERE enumtypid='public.waitlist_state'::regtype) <> 5
   OR (SELECT count(*) FROM pg_enum WHERE enumtypid='public.registration_status'::regtype) <> 5 THEN
    RAISE EXCEPTION 'verify failed: enum value counts wrong';
  END IF;
  SELECT count(*) INTO v_cols FROM information_schema.columns WHERE table_schema='public' AND table_name='registrations'
    AND column_name IN ('program_id','player_id','team_id','registration_tier','waitlist_state',
      'promoted_from_registration_id','status','sms_opt_in_p1','sms_opt_in_p2','emergency_contact_name',
      'emergency_contact_phone','emergency_contact_relationship','secondary_contact_name','secondary_contact_phone',
      'medical_notes','conduct_acknowledged_at','custom_responses');
  IF v_cols <> 17 THEN
    RAISE EXCEPTION 'verify failed: expected 17 spec columns, got %', v_cols;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='registrations_program_id_fkey' AND confdeltype='r') THEN
    RAISE EXCEPTION 'verify failed: program_id FK not RESTRICT';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='registrations_player_id_fkey' AND confdeltype='r') THEN
    RAISE EXCEPTION 'verify failed: player_id FK not RESTRICT';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='registrations_team_id_fkey' AND confdeltype='n') THEN
    RAISE EXCEPTION 'verify failed: team_id FK not SET NULL';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='registrations_promoted_from_registration_id_fkey' AND confdeltype='n') THEN
    RAISE EXCEPTION 'verify failed: promoted_from self-FK not SET NULL';
  END IF;
  RAISE NOTICE 'registrations verified: base table, RLS on, 4 policies, 3 enums (3/5/5), 17 spec cols, FK cascades correct.';
END $$;
