-- A.1.a fix (2026-05-23): get_staff_email SECDEF RPC for coach_roundup
-- actor send path. staff_profiles has no email column; auth.users does.
-- Resolver calls this RPC to fetch coach.email for the single_recipient
-- slice introduced in this same PR.
--
-- Per AP #23 + #57: REVOKE EXECUTE FROM PUBLIC AND explicit REVOKE FROM
-- anon. Supabase default-privilege auto-grant leaks to anon despite
-- the PUBLIC revoke; explicit anon revoke is required. authenticated
-- role retains EXECUTE via Supabase default grants — intentional
-- (resolver runs signed-in via the admin's auth context).

CREATE OR REPLACE FUNCTION public.get_staff_email(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
BEGIN
  -- Defense-in-depth: only return email if requested user is a staff
  -- member in the caller's org. RLS on staff_profiles handles the
  -- equivalent check via direct SELECT; RPC needs explicit scope
  -- check since SECDEF bypasses RLS by design.
  IF NOT EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE user_id = p_user_id
      AND org_id = current_user_org_id()
  ) THEN
    RETURN NULL;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  RETURN v_email;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_staff_email(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_staff_email(uuid) FROM anon;

-- DO $$ verification per AP #21 / #32 hint. Function-shape check only —
-- branch behavior validates at runtime in the resolver where the
-- authenticated admin has org context. Migration runner (postgres
-- superuser) has no org context, so current_user_org_id() returns
-- NULL and the NOT EXISTS branch always fires → return NULL.
DO $$
DECLARE
  v_nonexistent uuid := '00000000-0000-0000-0000-000000000000';
  v_result text;
BEGIN
  SELECT get_staff_email(v_nonexistent) INTO v_result;
  IF v_result IS NOT NULL THEN
    RAISE EXCEPTION 'get_staff_email returned non-null for nonexistent user_id';
  END IF;
  RAISE NOTICE 'get_staff_email RPC created. Nonexistent-user branch returned NULL as expected.';
END $$;
