-- Notifications

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications (user_id);

alter table public.notifications enable row level security;

create policy "Notifications are viewable by owner"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Notifications are updatable by owner"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
