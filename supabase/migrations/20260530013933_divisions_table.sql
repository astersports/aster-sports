-- Migration #4 (EMBER_PROGRAM_SETUP_SPEC_v2 §4.5 step 4): divisions table.
-- Child of programs (CASCADE per §4.4); exists only conceptually when program_type='season'
-- (not enforced at DB level — the wizard scopes creation). Columns per §4.5 step 4:
-- grade_min/max (grade band), gender (M/F — §4.2 F5 Q1: divisions enforce M/F; Co-Ed lives on
-- camp programs, not divisions), state (US state — geographic; the spec uses `status` everywhere
-- it means lifecycle, so `state` here is the geographic dimension), team_color (hex, mirrors
-- teams.team_color). RLS mirrors the programs table exactly. Applied via Supabase MCP 2026-05-29
-- (version 20260530013933).

CREATE TABLE public.divisions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  program_id  uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  name        text NOT NULL,
  grade_min   integer,
  grade_max   integer,
  gender      text CHECK (gender IN ('M','F')),   -- nullable during build-out; tightens to NOT NULL when the divisions wizard ships
  state       text,                                -- US state (geographic)
  team_color  text,                                -- hex, mirrors teams.team_color
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_divisions_program_id ON public.divisions(program_id);
CREATE INDEX idx_divisions_org_id     ON public.divisions(org_id);

CREATE TRIGGER trg_divisions_updated_at BEFORE UPDATE ON public.divisions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;

-- RLS mirrors programs: authenticated SELECT scoped to own org; admin-only writes.
CREATE POLICY divisions_select ON public.divisions
  FOR SELECT TO authenticated USING (org_id = current_user_org_id());
CREATE POLICY divisions_insert ON public.divisions
  FOR INSERT WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin'::text]));
CREATE POLICY divisions_update ON public.divisions
  FOR UPDATE USING (user_has_role_in_org(org_id, ARRAY['admin'::text]))
            WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin'::text]));
CREATE POLICY divisions_delete ON public.divisions
  FOR DELETE USING (user_has_role_in_org(org_id, ARRAY['admin'::text]));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.divisions TO anon, authenticated, service_role;

-- Verify.
DO $$
BEGIN
  IF (SELECT relkind FROM pg_class WHERE oid='public.divisions'::regclass) <> 'r' THEN
    RAISE EXCEPTION 'verify failed: divisions is not a base table';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.divisions'::regclass) THEN
    RAISE EXCEPTION 'verify failed: RLS not enabled on divisions';
  END IF;
  IF (SELECT count(*) FROM pg_policy WHERE polrelid='public.divisions'::regclass) <> 4 THEN
    RAISE EXCEPTION 'verify failed: expected 4 RLS policies, got %', (SELECT count(*) FROM pg_policy WHERE polrelid='public.divisions'::regclass);
  END IF;
  IF (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='divisions'
        AND column_name IN ('grade_min','grade_max','gender','state','team_color','program_id','org_id','name')) <> 8 THEN
    RAISE EXCEPTION 'verify failed: divisions missing expected columns';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='divisions_program_id_fkey' AND confrelid='public.programs'::regclass AND confdeltype='c') THEN
    RAISE EXCEPTION 'verify failed: divisions->programs FK not CASCADE';
  END IF;
  RAISE NOTICE 'divisions verified: base table, RLS on, 4 policies, FK CASCADE to programs, grade/gender/state/team_color cols present.';
END $$;
