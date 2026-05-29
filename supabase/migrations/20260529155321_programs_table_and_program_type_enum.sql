-- Migration #1 (EMBER_PROGRAM_SETUP_SPEC_v2 build, PR 1): programs table + program_type ENUM.
-- Spec §4.5 step 1. The `programs` table is the new top-level container (parent of
-- divisions/registrations); `seasons` becomes a backwards-compat view over it in PR 3.
-- Column set is a SUPERSET of `seasons` so PR 2 (backfill) + PR 3 (compat view) are clean.
-- sport_id is forward-compat scaffolding (no FK — the `sports` table is not built in this
-- wave; LH is single-sport). RLS mirrors `seasons` exactly; parent SELECT via
-- current_user_org_ids() is deferred to migration #12 (spec §4.3). Purely additive.
-- Applied via Supabase MCP 2026-05-29 (version 20260529155321).

CREATE TYPE public.program_type AS ENUM
  ('season','tryout','camp','clinic','interest_list','evaluation');

CREATE TABLE public.programs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  sport_id          uuid,
  program_type      public.program_type NOT NULL DEFAULT 'season',
  parent_program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  name              text NOT NULL,
  start_date        date,
  end_date          date,
  status            text NOT NULL DEFAULT 'active',
  rolled_over_at    timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX programs_org_id_idx   ON public.programs (org_id);
CREATE INDEX programs_org_type_idx ON public.programs (org_id, program_type);
CREATE INDEX programs_parent_idx   ON public.programs (parent_program_id) WHERE parent_program_id IS NOT NULL;

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY programs_select ON public.programs FOR SELECT TO authenticated
  USING (org_id = current_user_org_id());
CREATE POLICY programs_insert ON public.programs FOR INSERT
  WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin'::text]));
CREATE POLICY programs_update ON public.programs FOR UPDATE
  USING (user_has_role_in_org(org_id, ARRAY['admin'::text]))
  WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin'::text]));
CREATE POLICY programs_delete ON public.programs FOR DELETE
  USING (user_has_role_in_org(org_id, ARRAY['admin'::text]));

CREATE TRIGGER trg_programs_updated_at BEFORE UPDATE ON public.programs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'program_type') THEN
    RAISE EXCEPTION 'verify failed: program_type enum missing';
  END IF;
  IF (SELECT count(*) FROM unnest(enum_range(NULL::public.program_type))) <> 6 THEN
    RAISE EXCEPTION 'verify failed: program_type should have 6 values';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='programs') THEN
    RAISE EXCEPTION 'verify failed: programs table missing';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.programs'::regclass) THEN
    RAISE EXCEPTION 'verify failed: RLS not enabled on programs';
  END IF;
  IF (SELECT count(*) FROM pg_policy WHERE polrelid='public.programs'::regclass) <> 4 THEN
    RAISE EXCEPTION 'verify failed: expected 4 RLS policies on programs';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.programs'::regclass AND tgname='trg_programs_updated_at') THEN
    RAISE EXCEPTION 'verify failed: updated_at trigger missing';
  END IF;
  RAISE NOTICE 'programs table + program_type enum verified (6 enum values, 4 RLS policies, trigger present).';
END $$;
