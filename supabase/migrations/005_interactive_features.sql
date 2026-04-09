-- ============================================================
-- 005_interactive_features.sql
-- RSVP deadline, notifications queue
-- Depends on: 004_schedule_extensions.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. Add rsvp_deadline to events
-- ------------------------------------------------------------
alter table public.events
  add column rsvp_deadline timestamptz;

-- ------------------------------------------------------------
-- 2. Notifications queue
-- ------------------------------------------------------------
create table public.notifications_queue (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  notification_type text not null
    check (notification_type in ('schedule_change', 'reminder_24h', 'reminder_gameday', 'cancellation', 'rsvp_nudge')),
  recipient_type text not null
    check (recipient_type in ('team', 'player', 'guardian')),
  recipient_id uuid,
  payload jsonb not null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index idx_notifications_queue_status on public.notifications_queue(status, created_at);
create index idx_notifications_queue_org on public.notifications_queue(org_id);
create index idx_notifications_queue_event on public.notifications_queue(event_id);

-- RLS
alter table public.notifications_queue enable row level security;

create policy notifications_queue_org_isolation on public.notifications_queue
  for all using (org_id = public.current_user_org_id());
