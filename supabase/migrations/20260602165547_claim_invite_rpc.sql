-- Closes Wave 3.A #18 P0-3 + P0-4: post-login claim handler for invited users.
--
-- Today autoLinkGuardian (src/lib/autoLinkGuardian.js) covers the
-- parent-with-pre-existing-guardian-row case. It does NOT cover:
--   - staff invites (role = coach | admin) — no user_roles row gets created
--   - parents without a pre-seeded guardian row — no claim path
--
-- claim_invite() reads raw_user_meta_data set by invite-parent
-- ({ org_id, invited_by, role }) and writes the matching user_roles row.
-- It's idempotent: a re-call after the role already exists returns the
-- org context without inserting again.
--
-- AuthContext invokes claim_invite() alongside autoLinkGuardian on session
-- bootstrap. Order doesn't matter; both are safe to call together.
--
-- Staff-profile / guardian-row creation are NOT in scope here — see the
-- P0-3 follow-up arc.

create or replace function public.claim_invite()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $$
declare
  v_user_id uuid := auth.uid();
  v_meta    jsonb;
  v_org_id  uuid;
  v_role    text;
  v_count   int;
  v_org     record;
begin
  if v_user_id is null then
    return jsonb_build_object('claimed', false, 'reason', 'unauthenticated');
  end if;

  select raw_user_meta_data into v_meta from auth.users where id = v_user_id;
  if v_meta is null then
    return jsonb_build_object('claimed', false, 'reason', 'no_user_row');
  end if;

  v_org_id := nullif(v_meta->>'org_id', '')::uuid;
  v_role   := nullif(v_meta->>'role', '');

  if v_org_id is null or v_role is null then
    return jsonb_build_object('claimed', false, 'reason', 'no_invite_metadata');
  end if;
  if v_role not in ('parent', 'coach', 'admin') then
    return jsonb_build_object('claimed', false, 'reason', 'invalid_role');
  end if;

  -- Already claimed?
  select count(*) into v_count
    from public.user_roles
   where user_id = v_user_id and organization_id = v_org_id;

  if v_count > 0 then
    select id, name, slug, logo_url, brand_colors into v_org
      from public.organizations where id = v_org_id;
    return jsonb_build_object(
      'claimed', false,
      'reason', 'already_claimed',
      'role', v_role,
      'organization', row_to_json(v_org)
    );
  end if;

  -- Insert the matching user_roles row. ON CONFLICT guard handles
  -- the race where two parallel callers (e.g., a tab reload during
  -- AuthContext bootstrap) try to claim simultaneously.
  insert into public.user_roles (user_id, organization_id, role)
    values (v_user_id, v_org_id, v_role)
    on conflict (user_id, organization_id) do nothing;

  select id, name, slug, logo_url, brand_colors into v_org
    from public.organizations where id = v_org_id;

  return jsonb_build_object(
    'claimed', true,
    'role', v_role,
    'organization', row_to_json(v_org)
  );
end;
$$;

-- AP #23 + #57: explicit revokes; authenticated is the only role
-- with EXECUTE.
revoke execute on function public.claim_invite() from public;
revoke execute on function public.claim_invite() from anon;
grant  execute on function public.claim_invite() to authenticated;

comment on function public.claim_invite() is
  'Post-login claim handler for invited users. Reads raw_user_meta_data.{org_id,role} (set by invite-parent) and inserts the matching user_roles row. Idempotent; returns already_claimed when the role already exists. Closes Wave 3.A #18 P0-3 + P0-4.';
