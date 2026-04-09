-- User roles table: maps auth.users to app roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  role text not null check (role in ('admin', 'coach', 'parent')),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.user_roles enable row level security;

-- Users can read their own role
create policy "Users can read own role"
  on public.user_roles for select
  using (auth.uid() = user_id);

-- Admins can manage all roles
create policy "Admins can manage roles"
  on public.user_roles for all
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );
