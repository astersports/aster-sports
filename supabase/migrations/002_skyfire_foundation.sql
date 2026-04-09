-- ============================================================
-- 002_skyfire_foundation.sql
-- Multi-tenant foundation: organizations, settings, org-scoped roles
-- ============================================================

-- ------------------------------------------------------------
-- 1. Organizations table
-- ------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sport text not null,
  logo_url text,
  brand_colors jsonb not null default '{"header":"#151525","accent":"#C9952E","accent_hover":"#D4A843","text_on_dark":"#F5F0E8"}'::jsonb,
  stripe_account_id text,
  subscription_plan text not null default 'starter'
    check (subscription_plan in ('starter', 'pro', 'elite')),
  subscription_status text not null default 'active',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. Organization settings table
-- ------------------------------------------------------------
create table public.organization_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade unique,
  timezone text not null default 'America/New_York',
  season_label text,
  registration_open boolean not null default false,
  futures_academy_enabled boolean not null default true,
  carpool_enabled boolean not null default true,
  custom_domain text,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. Add organization_id to user_roles
-- ------------------------------------------------------------
alter table public.user_roles
  add column organization_id uuid references public.organizations(id) on delete cascade;

-- ------------------------------------------------------------
-- 4. RLS on organizations (authenticated users can read their own org)
-- ------------------------------------------------------------
alter table public.organizations enable row level security;

create policy "Users can read their own organization"
  on public.organizations for select
  using (
    id in (
      select organization_id from public.user_roles
      where user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 5. RLS on organization_settings (scoped to user's org)
-- ------------------------------------------------------------
alter table public.organization_settings enable row level security;

create policy "Users can read their org settings"
  on public.organization_settings for select
  using (
    organization_id in (
      select organization_id from public.user_roles
      where user_id = auth.uid()
    )
  );

create policy "Admins can manage their org settings"
  on public.organization_settings for all
  using (
    organization_id in (
      select organization_id from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- ------------------------------------------------------------
-- 6. Replace user_roles RLS policies (org-scoped)
-- ------------------------------------------------------------
drop policy if exists "Users can read own role" on public.user_roles;
drop policy if exists "Admins can manage roles" on public.user_roles;

-- Users can read their own role within their organization
create policy "Users can read own role in their org"
  on public.user_roles for select
  using (auth.uid() = user_id);

-- Admins can manage roles within their organization only
create policy "Admins can manage roles in their org"
  on public.user_roles for all
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role = 'admin'
        and organization_id = user_roles.organization_id
    )
  );

-- ------------------------------------------------------------
-- 7. Seed Legacy Hoopers as org #1
-- ------------------------------------------------------------
insert into public.organizations (name, slug, sport, brand_colors)
values (
  'Legacy Hoopers LLC',
  'legacy-hoopers',
  'basketball',
  '{"header":"#4a8fd4","accent":"#4a8fd4","accent_hover":"#5BA0E0","text_on_dark":"#FFFFFF"}'::jsonb
);

insert into public.organization_settings (organization_id, timezone, season_label, futures_academy_enabled, carpool_enabled)
select id, 'America/New_York', 'Spring 2026', true, true
from public.organizations
where slug = 'legacy-hoopers';
