-- Phase 4 Messaging: DM picker name resolution
-- SECURITY DEFINER function that returns user_id + display_name + role
-- for all members of an org, with caller-membership guard to prevent
-- cross-tenant data leak.
--
-- Display name resolution (COALESCE chain):
--   1. Guardian first + last name (parents)
--   2. auth.users.raw_user_meta_data->>'full_name' (staff)
--   3. auth.users.raw_user_meta_data->>'name' (fallback)
--   4. INITCAP(role) (last resort: "Admin", "Coach", "Parent")

CREATE OR REPLACE FUNCTION public.get_org_user_profiles(p_org_id uuid)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    ur.user_id,
    COALESCE(
      NULLIF(TRIM(CONCAT(g.first_name, ' ', g.last_name)), ''),
      NULLIF(au.raw_user_meta_data->>'full_name', ''),
      NULLIF(au.raw_user_meta_data->>'name', ''),
      INITCAP(ur.role)
    ) AS display_name,
    ur.role
  FROM public.user_roles ur
  JOIN auth.users au ON au.id = ur.user_id
  LEFT JOIN public.guardians g ON g.user_id = ur.user_id
  WHERE ur.organization_id = p_org_id
    AND EXISTS (
      SELECT 1 FROM public.user_roles caller
      WHERE caller.user_id = (SELECT auth.uid())
        AND caller.organization_id = p_org_id
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_org_user_profiles(uuid) TO authenticated;
