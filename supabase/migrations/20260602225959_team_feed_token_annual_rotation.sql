-- Closes Wave 3.B #27 P1: team_feed_token bearer URL exposes event titles
-- with kid names indefinitely (compounds Wave 2.A #15 P0-2).
--
-- Per AUDIT_WAVE_3_P1_BACKLOG_STATUS.md routing call: annual rotation
-- strategy (a) — bounded friction, bounded exposure window.
--
-- Changes:
-- 1. Add teams.team_feed_token_issued_at timestamptz (NOT NULL DEFAULT now())
--    Backfills existing rows with now() — those tokens get the full 365
--    days from migration apply, not from their original issue. Frank's
--    operational call: avoid blanket-expiring everyone today.
-- 2. Update get_team_by_feed_token RPC to return rows only when the
--    token is < 365 days old. Returns empty TABLE for expired tokens;
--    the team-feed edge function maps that to 410 Gone + a re-subscribe
--    message.
-- 3. New regenerate_team_feed_token(p_team_id) admin-only SECDEF RPC.
--    Generates fresh UUID + bumps issued_at = now(). Caller must be
--    admin in the team's org.
--
-- Out of scope here (separate UI work):
-- - Admin UI for regeneration (RPC ready; button needs design)
-- - Email warning to parents 30 days before expiry (notification scope)
-- - Audit logging of regenerations (manual SQL audit for now)

alter table public.teams
  add column if not exists team_feed_token_issued_at timestamptz not null default now();

comment on column public.teams.team_feed_token_issued_at is
  'Timestamp of the current team_feed_token. The token expires 365 days after this value (Wave 3.B #27 P1 closure — annual rotation strategy). Bumped by regenerate_team_feed_token(team_id).';

-- Update the lookup RPC to enforce expiry.
create or replace function public.get_team_by_feed_token(p_token text)
returns table (id uuid, name text, org_id uuid, team_color text)
language sql
security definer
stable
set search_path = public
as $$
  select id, name, org_id, team_color
    from public.teams
   where team_feed_token = p_token
     and team_feed_token_issued_at > now() - interval '365 days'
   limit 1;
$$;

revoke execute on function public.get_team_by_feed_token(text) from public;
revoke execute on function public.get_team_by_feed_token(text) from anon;
revoke execute on function public.get_team_by_feed_token(text) from authenticated;
grant  execute on function public.get_team_by_feed_token(text) to service_role;

comment on function public.get_team_by_feed_token(text) is
  'Lookup a team by its current feed token. Returns no rows for expired tokens (Wave 3.B #27 P1 closure — annual rotation). The team-feed edge function maps empty result to 410 Gone.';

-- New: admin-only regenerator. Bumps the token + issued_at, breaking
-- existing subscriptions for that team. Caller must be admin in the
-- team's org.
create or replace function public.regenerate_team_feed_token(p_team_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_org_id uuid;
  v_new_token text;
begin
  -- Find org for caller-auth check.
  select org_id into v_org_id from public.teams where id = p_team_id;
  if v_org_id is null then
    return jsonb_build_object('ok', false, 'reason', 'team_not_found');
  end if;
  if not public.user_has_role_in_org(v_org_id, array['admin']) then
    return jsonb_build_object('ok', false, 'reason', 'not_admin');
  end if;

  v_new_token := gen_random_uuid()::text;
  update public.teams
     set team_feed_token = v_new_token,
         team_feed_token_issued_at = now()
   where id = p_team_id;

  return jsonb_build_object('ok', true, 'team_id', p_team_id, 'new_token', v_new_token, 'expires_at', now() + interval '365 days');
end;
$$;

revoke execute on function public.regenerate_team_feed_token(uuid) from public;
revoke execute on function public.regenerate_team_feed_token(uuid) from anon;
grant  execute on function public.regenerate_team_feed_token(uuid) to authenticated;

comment on function public.regenerate_team_feed_token(uuid) is
  'Admin-only: regenerate a team feed token + bump issued_at. Breaks existing subscriptions; parents must re-subscribe. Returns the new token in the response. Wave 3.B #27 P1 closure — manual rotation path beyond the 365-day automatic expiry.';
