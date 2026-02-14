-- Quick seed data for manual testing.
-- Replace the UUIDs below with real auth user IDs from your Supabase project.

-- TODO: Replace these with real auth user IDs
-- founder_id: <FOUNDERS_AUTH_USER_ID>
-- helper_id: <HELPERS_AUTH_USER_ID>

with
  seed_users as (
    select
      '00000000-0000-0000-0000-000000000001'::uuid as founder_id,
      '00000000-0000-0000-0000-000000000002'::uuid as helper_id
  ),
  inserted_profiles as (
    insert into public.profiles (id, name, role)
    select founder_id, 'Alex Founder', 'founder' from seed_users
    union all
    select helper_id, 'Taylor Helper', 'helper' from seed_users
    on conflict (id) do nothing
    returning id
  ),
  inserted_business as (
    insert into public.businesses (owner_id, name, description)
    select founder_id, 'Clearcap Labs', 'Founder-led B2B ops startup' from seed_users
    returning id, owner_id
  ),
  inserted_post as (
    insert into public.problem_posts (business_id, created_by, title, category, description, equity_min, equity_max)
    select
      b.id,
      b.owner_id,
      'RevOps automation help',
      'Operations',
      'Need help automating onboarding and CRM workflows.',
      0.25,
      0.75
    from inserted_business b
    returning id, business_id, created_by
  ),
  inserted_proposal as (
    insert into public.proposals (post_id, proposed_by, deliverables, timeline_days, equity_ask)
    select
      p.id,
      s.helper_id,
      'Audit CRM, implement onboarding automation, handoff docs',
      21,
      0.5
    from inserted_post p
    cross join seed_users s
    returning id, post_id, proposed_by
  ),
  inserted_deal as (
    insert into public.deals (post_id, business_id, founder_id, helper_id)
    select
      p.id,
      p.business_id,
      p.created_by,
      s.helper_id
    from inserted_post p
    cross join seed_users s
    returning id, business_id, founder_id, helper_id
  ),
  inserted_milestones as (
    insert into public.deal_milestones (deal_id, title, acceptance_criteria, equity_grant_units)
    select
      d.id,
      'Ship onboarding automation',
      'Automations live + demo walkthrough',
      25
    from inserted_deal d
    returning id, deal_id
  )
insert into public.business_equity_settings (business_id, total_units)
select business_id, 1000 from inserted_deal
on conflict (business_id) do nothing;

-- Optional: seed evidence + ledger entry manually once the edge function is live.
