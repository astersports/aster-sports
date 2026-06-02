-- Closes Wave 3.B #27 P0-1: data subject deletion path.
--
-- iOS App Store §5.1.1(v) requires an in-app deletion path for any PWA
-- that goes through the App Store wrapper. CCPA + GDPR-best-practice
-- expectation. Today the platform has no path; this migration adds the
-- intake side (request capture + audit log).
--
-- Design:
--   - User submits a deletion request via request_account_deletion(reason).
--   - Operator processes the request manually (SQL-driven for now;
--     admin UI is a follow-up). Processing means: NULL the guardian.user_id
--     (parent case; child + org data stays for the org), or remove
--     user_roles + staff_profiles (staff case), then auth.users delete
--     via the Supabase admin API.
--   - Audit-log shape: no DELETE; processing fills processed_at +
--     processed_by + notes.
--   - SLA: ops doctrine target is 30 days (matches CCPA's 45-day
--     fulfillment window; we set our internal goal tighter).

create table if not exists public.account_deletion_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  requested_at  timestamptz not null default now(),
  reason        text,
  processed_at  timestamptz,
  processed_by  uuid references auth.users(id),
  notes         text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_account_deletion_requests_user on public.account_deletion_requests(user_id);
create index if not exists idx_account_deletion_requests_open on public.account_deletion_requests(requested_at) where processed_at is null;

comment on table public.account_deletion_requests is
  'Audit-log of user-initiated account deletion requests (CCPA / iOS App Store §5.1.1(v) / GDPR best practice). Append-only at the user-visible layer; operator fills processed_at + processed_by + notes when the actual delete runs. Closes Wave 3.B #27 P0-1.';

-- RLS: user sees their own requests; admins see all (platform-level,
-- not org-scoped, because deletion is a platform-level concern).
alter table public.account_deletion_requests enable row level security;
revoke all on public.account_deletion_requests from public;
revoke all on public.account_deletion_requests from anon;

create policy "deletion_requests_select_own" on public.account_deletion_requests
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Admin SELECT: any admin role in any org (platform-operator posture;
-- multi-tenant refinement deferred to onboarding-arc PRs).
create policy "deletion_requests_select_admin" on public.account_deletion_requests
  for select to authenticated
  using (exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.role = 'admin'
  ));

-- No INSERT policy; the RPC below uses SECURITY DEFINER to write the row
-- under controlled conditions (any authenticated user can request their
-- own deletion). No UPDATE policy at the user layer; only service_role
-- (operator) modifies processed_at / processed_by / notes.

create or replace function public.request_account_deletion(p_reason text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_user_id uuid := auth.uid();
  v_id      uuid;
  v_existing_open int;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;

  -- Idempotency: if an open request already exists for this user, return
  -- it without inserting a second one. Re-clicking the button shouldn't
  -- create N audit rows.
  select count(*) into v_existing_open
    from public.account_deletion_requests
   where user_id = v_user_id and processed_at is null;
  if v_existing_open > 0 then
    return jsonb_build_object('ok', true, 'already_open', true);
  end if;

  insert into public.account_deletion_requests (user_id, reason)
    values (v_user_id, nullif(trim(p_reason), ''))
    returning id into v_id;

  return jsonb_build_object('ok', true, 'request_id', v_id);
end;
$$;

revoke execute on function public.request_account_deletion(text) from public;
revoke execute on function public.request_account_deletion(text) from anon;
grant  execute on function public.request_account_deletion(text) to authenticated;

comment on function public.request_account_deletion(text) is
  'Submits an account-deletion request for the authenticated user. Idempotent (returns already_open=true if an unprocessed request exists). Operator processes via SQL/admin tooling. Closes Wave 3.B #27 P0-1.';
