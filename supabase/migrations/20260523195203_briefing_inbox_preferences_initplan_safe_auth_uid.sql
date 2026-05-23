-- AP #15 — wrap auth.uid() in (SELECT auth.uid()) for initplan safety
-- on briefing_inbox_preferences_own. Bare auth.uid() in USING/WITH
-- CHECK evaluates per-row; the subselect form is evaluated once per
-- query as an initplan.
--
-- Drop + recreate is required (ALTER POLICY can change name/role but
-- not USING/WITH CHECK expressions).

DROP POLICY IF EXISTS briefing_inbox_preferences_own
  ON public.briefing_inbox_preferences;

CREATE POLICY briefing_inbox_preferences_own
  ON public.briefing_inbox_preferences FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DO $$
DECLARE
  using_expr text;
  check_expr text;
BEGIN
  SELECT pg_get_expr(polqual, polrelid), pg_get_expr(polwithcheck, polrelid)
  INTO using_expr, check_expr
  FROM pg_policy
  WHERE polrelid = 'public.briefing_inbox_preferences'::regclass
    AND polname = 'briefing_inbox_preferences_own';
  IF using_expr NOT LIKE '%SELECT auth.uid()%' THEN
    RAISE EXCEPTION 'Policy USING clause did not wrap auth.uid(): %', using_expr;
  END IF;
  IF check_expr NOT LIKE '%SELECT auth.uid()%' THEN
    RAISE EXCEPTION 'Policy WITH CHECK clause did not wrap auth.uid(): %', check_expr;
  END IF;
END $$;
