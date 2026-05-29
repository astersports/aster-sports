-- Migration #1a (EMBER_PROGRAM_SETUP_SPEC_v2 build): minimum sports table + programs.sport_id FK.
-- Frank-directed follow-on to PR 1 — wires the sport_id scaffolding to a real table.
-- The spec's relationship diagram has sports(sport_id, org_id) as parent of programs, but the
-- §4.5 12-migration list omitted it; this fills that gap. Minimal shape (id/org_id/name).
-- Seeds LH's single sport (Basketball). Adds the programs.sport_id FK (programs is empty in
-- prod → instant, no validation pass). RLS mirrors seasons/programs (parent SELECT via
-- current_user_org_ids() deferred to migration #12). sport_id stays nullable for now;
-- NOT NULL tightening belongs with the registration build that always sets a sport.
-- Applied via Supabase MCP 2026-05-29 (version 20260529155952).

CREATE TABLE public.sports (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sports_org_name_key UNIQUE (org_id, name)
);

CREATE INDEX sports_org_id_idx ON public.sports (org_id);

ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;

CREATE POLICY sports_select ON public.sports FOR SELECT TO authenticated
  USING (org_id = current_user_org_id());
CREATE POLICY sports_insert ON public.sports FOR INSERT
  WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin'::text]));
CREATE POLICY sports_update ON public.sports FOR UPDATE
  USING (user_has_role_in_org(org_id, ARRAY['admin'::text]))
  WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin'::text]));
CREATE POLICY sports_delete ON public.sports FOR DELETE
  USING (user_has_role_in_org(org_id, ARRAY['admin'::text]));

CREATE TRIGGER trg_sports_updated_at BEFORE UPDATE ON public.sports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO public.sports (org_id, name)
VALUES ('e3e95e21-3571-4e9a-985a-d5d01480d4a6', 'Basketball')
ON CONFLICT (org_id, name) DO NOTHING;

ALTER TABLE public.programs
  ADD CONSTRAINT programs_sport_id_fkey FOREIGN KEY (sport_id) REFERENCES public.sports(id) ON DELETE RESTRICT;

DO $$
DECLARE v_sport_count int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sports') THEN
    RAISE EXCEPTION 'verify failed: sports table missing';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.sports'::regclass) THEN
    RAISE EXCEPTION 'verify failed: RLS not enabled on sports';
  END IF;
  IF (SELECT count(*) FROM pg_policy WHERE polrelid='public.sports'::regclass) <> 4 THEN
    RAISE EXCEPTION 'verify failed: expected 4 RLS policies on sports';
  END IF;
  SELECT count(*) INTO v_sport_count FROM public.sports
    WHERE org_id='e3e95e21-3571-4e9a-985a-d5d01480d4a6' AND name='Basketball';
  IF v_sport_count <> 1 THEN
    RAISE EXCEPTION 'verify failed: LH Basketball not seeded exactly once (got %)', v_sport_count;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='programs_sport_id_fkey' AND conrelid='public.programs'::regclass) THEN
    RAISE EXCEPTION 'verify failed: programs.sport_id FK missing';
  END IF;
  RAISE NOTICE 'sports table + LH Basketball seed + programs.sport_id FK verified.';
END $$;
