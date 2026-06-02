-- Non-secret runtime config readable by edge functions via service-role SELECT.
-- Distinct from app_secrets (AP #33 = secrets only). SQL-settable so the
-- parent-invite magic-link host can be repointed at go-live with one UPDATE,
-- no dashboard / CLI. Seeded with the CURRENT working deploy host (dormant —
-- behavior unchanged until UPDATEd to the new domain).
create table if not exists public.app_config (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

comment on table public.app_config is
  'Non-secret runtime config read by edge functions via service-role SELECT (SQL-settable without a dashboard). Distinct from app_secrets (AP #33, secrets only).';

-- Defense-in-depth: RLS on + strip client grants. service_role bypasses RLS
-- and keeps its grant, which is the only reader (edge functions use it).
alter table public.app_config enable row level security;
revoke all on public.app_config from public;
revoke all on public.app_config from anon;
revoke all on public.app_config from authenticated;

insert into public.app_config (key, value)
values ('app_base_url', 'https://skyfire-app.vercel.app')
on conflict (key) do nothing;
