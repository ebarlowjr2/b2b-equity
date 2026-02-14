-- Core schema + RLS for MVP

create extension if not exists "pgcrypto";

-- Enums
create type public.profile_role as enum ('founder', 'helper');
create type public.problem_post_status as enum ('open', 'closed');
create type public.proposal_status as enum ('submitted', 'accepted', 'rejected');
create type public.deal_status as enum ('active', 'completed', 'cancelled');
create type public.milestone_status as enum ('pending', 'submitted', 'approved', 'rejected');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role public.profile_role not null,
  created_at timestamptz not null default now()
);

-- Businesses
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- Problem posts
create table public.problem_posts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text,
  description text,
  equity_min numeric,
  equity_max numeric,
  status public.problem_post_status not null default 'open',
  created_at timestamptz not null default now()
);

-- Proposals
create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.problem_posts(id) on delete cascade,
  proposed_by uuid not null references public.profiles(id) on delete cascade,
  deliverables text,
  timeline_days integer,
  equity_ask numeric,
  status public.proposal_status not null default 'submitted',
  created_at timestamptz not null default now()
);

-- Deals
create table public.deals (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.problem_posts(id) on delete set null,
  business_id uuid not null references public.businesses(id) on delete cascade,
  founder_id uuid not null references public.profiles(id) on delete cascade,
  helper_id uuid not null references public.profiles(id) on delete cascade,
  status public.deal_status not null default 'active',
  created_at timestamptz not null default now()
);

-- Deal milestones
create table public.deal_milestones (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  title text not null,
  acceptance_criteria text,
  equity_grant_units numeric not null,
  status public.milestone_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- Milestone evidence
create table public.milestone_evidence (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.deal_milestones(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  evidence_url text,
  notes text,
  created_at timestamptz not null default now()
);

-- Equity ledger entries (source of truth)
create table public.equity_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete set null,
  milestone_id uuid references public.deal_milestones(id) on delete set null,
  units numeric not null,
  memo text,
  created_at timestamptz not null default now()
);

-- Business equity settings
create table public.business_equity_settings (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  total_units numeric not null
);

-- Indexes
create index on public.problem_posts (business_id);
create index on public.problem_posts (created_by);
create index on public.proposals (post_id);
create index on public.proposals (proposed_by);
create index on public.deals (business_id);
create index on public.deals (founder_id, helper_id);
create index on public.deal_milestones (deal_id);
create index on public.milestone_evidence (milestone_id);
create index on public.equity_ledger_entries (business_id);
create index on public.equity_ledger_entries (recipient_user_id);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.problem_posts enable row level security;
alter table public.proposals enable row level security;
alter table public.deals enable row level security;
alter table public.deal_milestones enable row level security;
alter table public.milestone_evidence enable row level security;
alter table public.equity_ledger_entries enable row level security;
alter table public.business_equity_settings enable row level security;

-- Profiles policies
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Businesses policies
create policy "Businesses are viewable by owner"
  on public.businesses for select
  using (owner_id = auth.uid());

create policy "Businesses are insertable by owner"
  on public.businesses for insert
  with check (owner_id = auth.uid());

create policy "Businesses are updatable by owner"
  on public.businesses for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Problem posts policies
create policy "Problem posts are viewable by authenticated users"
  on public.problem_posts for select
  using (auth.role() = 'authenticated');

create policy "Problem posts are insertable by business owner"
  on public.problem_posts for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  );

create policy "Problem posts are updatable by business owner"
  on public.problem_posts for update
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  );

-- Proposals policies
create policy "Proposals are viewable by proposer or business owner"
  on public.proposals for select
  using (
    proposed_by = auth.uid()
    or exists (
      select 1
      from public.problem_posts p
      join public.businesses b on b.id = p.business_id
      where p.id = post_id and b.owner_id = auth.uid()
    )
  );

create policy "Proposals are insertable by proposer"
  on public.proposals for insert
  with check (proposed_by = auth.uid());

create policy "Proposals are updatable by business owner"
  on public.proposals for update
  using (
    exists (
      select 1
      from public.problem_posts p
      join public.businesses b on b.id = p.business_id
      where p.id = post_id and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.problem_posts p
      join public.businesses b on b.id = p.business_id
      where p.id = post_id and b.owner_id = auth.uid()
    )
  );

-- Deals policies
create policy "Deals are viewable by participants"
  on public.deals for select
  using (founder_id = auth.uid() or helper_id = auth.uid());

create policy "Deals are insertable by founder"
  on public.deals for insert
  with check (founder_id = auth.uid());

create policy "Deals are updatable by founder"
  on public.deals for update
  using (founder_id = auth.uid())
  with check (founder_id = auth.uid());

-- Deal milestones policies
create policy "Milestones are viewable by deal participants"
  on public.deal_milestones for select
  using (
    exists (
      select 1
      from public.deals d
      where d.id = deal_id
        and (d.founder_id = auth.uid() or d.helper_id = auth.uid())
    )
  );

create policy "Milestones are insertable by founder"
  on public.deal_milestones for insert
  with check (
    exists (
      select 1
      from public.deals d
      where d.id = deal_id and d.founder_id = auth.uid()
    )
  );

create policy "Milestones are updatable by founder"
  on public.deal_milestones for update
  using (
    exists (
      select 1
      from public.deals d
      where d.id = deal_id and d.founder_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.deals d
      where d.id = deal_id and d.founder_id = auth.uid()
    )
  );

-- Milestone evidence policies
create policy "Evidence is viewable by deal participants"
  on public.milestone_evidence for select
  using (
    exists (
      select 1
      from public.deal_milestones m
      join public.deals d on d.id = m.deal_id
      where m.id = milestone_id
        and (d.founder_id = auth.uid() or d.helper_id = auth.uid())
    )
  );

create policy "Evidence is insertable by helper"
  on public.milestone_evidence for insert
  with check (
    submitted_by = auth.uid()
    and exists (
      select 1
      from public.deal_milestones m
      join public.deals d on d.id = m.deal_id
      where m.id = milestone_id and d.helper_id = auth.uid()
    )
  );

-- Equity ledger policies (no client inserts)
create policy "Ledger is viewable by owner or recipient"
  on public.equity_ledger_entries for select
  using (
    recipient_user_id = auth.uid()
    or exists (
      select 1
      from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  );

-- Business equity settings policies
create policy "Equity settings are viewable by owner"
  on public.business_equity_settings for select
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  );

create policy "Equity settings are insertable by owner"
  on public.business_equity_settings for insert
  with check (
    exists (
      select 1
      from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  );

create policy "Equity settings are updatable by owner"
  on public.business_equity_settings for update
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  );
