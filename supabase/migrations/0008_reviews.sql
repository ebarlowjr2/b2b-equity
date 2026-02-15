-- Reviews

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  text text,
  created_at timestamptz not null default now(),
  unique (reviewer_id, deal_id)
);

create index if not exists reviews_reviewee_id_idx on public.reviews (reviewee_id);
create index if not exists reviews_deal_id_idx on public.reviews (deal_id);

alter table public.reviews enable row level security;

create policy "Reviews are viewable by participants"
  on public.reviews for select
  using (reviewer_id = auth.uid() or reviewee_id = auth.uid());

create policy "Reviews are insertable by reviewer"
  on public.reviews for insert
  with check (reviewer_id = auth.uid());

create policy "Reviews are updatable by reviewer"
  on public.reviews for update
  using (reviewer_id = auth.uid())
  with check (reviewer_id = auth.uid());
