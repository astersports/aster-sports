-- Closes Wave 3.A #18 P0-1 path (b): reroute pending-invitations read off the
-- empty `invitations` table to the Supabase Auth canonical source.
--
-- Background: invite-parent calls supabase.auth.admin.inviteUserByEmail() which
-- writes auth.users.invited_at + raw_user_meta_data.{org_id, invited_by}. The
-- public.invitations table was the original intent but never got wired as a
-- writer. Per the audit, the cheapest fix is to read from the canonical source
-- (auth.users) instead of building a parallel write path.
--
-- SECDEF RPC because auth.users isn't directly readable via PostgREST under
-- standard RLS. Authorization is enforced inside the RPC: caller must have an
-- admin role in the requested org (matches the prior invitations.select_admin
-- policy semantics).
--
-- "Pending" definition: invited_at IS NOT NULL AND last_sign_in_at IS NULL.
-- Filters in the user_metadata-stamped org_id (per invite-parent's binding).

create or replace function public.get_pending_invitations(p_org_id uuid)
returns table (
  email      text,
  invited_at timestamptz,
  org_id     uuid,
  invited_by uuid
)
language sql
stable
security definer
set search_path = public, auth, pg_catalog
as $$
  -- Caller authorization first; if not an admin of the requested org, return
  -- zero rows (RPC contract: never raise — empty table is the "no access"
  -- shape that the hook treats as empty queue).
  select
    u.email::text                                 as email,
    u.invited_at                                  as invited_at,
    (u.raw_user_meta_data->>'org_id')::uuid       as org_id,
    (u.raw_user_meta_data->>'invited_by')::uuid   as invited_by
  from auth.users u
  where u.invited_at is not null
    and u.last_sign_in_at is null
    and (u.raw_user_meta_data->>'org_id')::uuid = p_org_id
    and public.user_has_role_in_org(p_org_id, array['admin'])
  order by u.invited_at desc;
$$;

revoke execute on function public.get_pending_invitations(uuid) from public;
revoke execute on function public.get_pending_invitations(uuid) from anon;
grant  execute on function public.get_pending_invitations(uuid) to authenticated;

comment on function public.get_pending_invitations(uuid) is
  'Returns guardians invited via Supabase Auth (invite-parent) who have not yet signed in. Admin-only per user_has_role_in_org check inside the RPC body. Replaces direct read of the empty public.invitations table (Wave 3.A #18 P0-1).';
