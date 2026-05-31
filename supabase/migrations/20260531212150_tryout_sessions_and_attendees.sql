-- Migration #9 (EMBER_PROGRAM_SETUP_SPEC_v2 §4.5 step 9): tryout_sessions + tryout_attendees.
-- Tryout scheduling + per-attendee evaluation. Both scoped under tryout-type programs (program_type
-- ENUM has 'tryout'; not enforced at DB level — the tryout wizard scopes creation). Spec lines 219-220.
-- FK rules (not in the §4.4 table; sensible defaults): tryout_sessions.program_id→programs CASCADE
-- (sessions belong to the program), tryout_attendees.session_id→tryout_sessions CASCADE,
-- tryout_attendees.registration_id→registrations CASCADE (an attendee row is meaningless without its
-- registration). RLS mirrors registrations/programs. Applied via Supabase MCP 2026-05-31
-- (version 20260531212150).

CREATE TABLE public.tryout_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  program_id  uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  starts_at   timestamptz NOT NULL,   -- spec 'datetime'
  capacity    integer,                -- nullable: uncapped session
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,  -- where the tryout runs (optional)
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tryout_sessions_program_id ON public.tryout_sessions(program_id);
CREATE INDEX idx_tryout_sessions_org_id     ON public.tryout_sessions(org_id);

CREATE TABLE public.tryout_attendees (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  registration_id  uuid NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  session_id       uuid NOT NULL REFERENCES public.tryout_sessions(id) ON DELETE CASCADE,
  evaluation_note  text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tryout_attendees_registration_session_uniq UNIQUE (registration_id, session_id)
);

CREATE INDEX idx_tryout_attendees_registration_id ON public.tryout_attendees(registration_id);
CREATE INDEX idx_tryout_attendees_session_id      ON public.tryout_attendees(session_id);
CREATE INDEX idx_tryout_attendees_org_id          ON public.tryout_attendees(org_id);

CREATE TRIGGER trg_tryout_sessions_updated_at BEFORE UPDATE ON public.tryout_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tryout_attendees_updated_at BEFORE UPDATE ON public.tryout_attendees
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.tryout_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tryout_attendees ENABLE ROW LEVEL SECURITY;

-- RLS mirrors registrations/programs: authenticated org-scoped SELECT; admin-only writes.
CREATE POLICY tryout_sessions_select ON public.tryout_sessions
  FOR SELECT TO authenticated USING (org_id = current_user_org_id());
CREATE POLICY tryout_sessions_insert ON public.tryout_sessions
  FOR INSERT WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin'::text]));
CREATE POLICY tryout_sessions_update ON public.tryout_sessions
  FOR UPDATE USING (user_has_role_in_org(org_id, ARRAY['admin'::text]))
            WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin'::text]));
CREATE POLICY tryout_sessions_delete ON public.tryout_sessions
  FOR DELETE USING (user_has_role_in_org(org_id, ARRAY['admin'::text]));

CREATE POLICY tryout_attendees_select ON public.tryout_attendees
  FOR SELECT TO authenticated USING (org_id = current_user_org_id());
CREATE POLICY tryout_attendees_insert ON public.tryout_attendees
  FOR INSERT WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin'::text]));
CREATE POLICY tryout_attendees_update ON public.tryout_attendees
  FOR UPDATE USING (user_has_role_in_org(org_id, ARRAY['admin'::text]))
            WITH CHECK (user_has_role_in_org(org_id, ARRAY['admin'::text]));
CREATE POLICY tryout_attendees_delete ON public.tryout_attendees
  FOR DELETE USING (user_has_role_in_org(org_id, ARRAY['admin'::text]));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tryout_sessions  TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tryout_attendees TO anon, authenticated, service_role;

-- Verify.
DO $$
BEGIN
  IF (SELECT relkind FROM pg_class WHERE oid='public.tryout_sessions'::regclass) <> 'r'
   OR (SELECT relkind FROM pg_class WHERE oid='public.tryout_attendees'::regclass) <> 'r' THEN
    RAISE EXCEPTION 'verify failed: a table is missing';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.tryout_sessions'::regclass)
   OR NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.tryout_attendees'::regclass) THEN
    RAISE EXCEPTION 'verify failed: RLS not enabled on both';
  END IF;
  IF (SELECT count(*) FROM pg_policy WHERE polrelid='public.tryout_sessions'::regclass) <> 4
   OR (SELECT count(*) FROM pg_policy WHERE polrelid='public.tryout_attendees'::regclass) <> 4 THEN
    RAISE EXCEPTION 'verify failed: expected 4 policies on each';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='tryout_sessions_program_id_fkey' AND confrelid='public.programs'::regclass AND confdeltype='c') THEN
    RAISE EXCEPTION 'verify failed: tryout_sessions.program_id not CASCADE';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='tryout_attendees_session_id_fkey' AND confrelid='public.tryout_sessions'::regclass AND confdeltype='c') THEN
    RAISE EXCEPTION 'verify failed: tryout_attendees.session_id not CASCADE';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='tryout_attendees_registration_id_fkey' AND confrelid='public.registrations'::regclass AND confdeltype='c') THEN
    RAISE EXCEPTION 'verify failed: tryout_attendees.registration_id not CASCADE';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='tryout_attendees_registration_session_uniq' AND contype='u') THEN
    RAISE EXCEPTION 'verify failed: missing (registration,session) unique';
  END IF;
  RAISE NOTICE 'tryout_sessions + tryout_attendees verified: 2 base tables, RLS on both, 4 policies each, FK cascades + unique correct.';
END $$;
