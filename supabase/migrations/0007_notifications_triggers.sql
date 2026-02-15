-- Notification triggers

create or replace function public.notify_user(
  target_user uuid,
  n_type text,
  n_title text,
  n_body text,
  n_link text
) returns void language plpgsql as $$
begin
  insert into public.notifications (user_id, type, title, body, link_url)
  values (target_user, n_type, n_title, n_body, n_link);
end;
$$;

-- Proposal submitted -> notify founder
create or replace function public.notify_on_proposal_insert()
returns trigger language plpgsql as $$
declare
  founder_id uuid;
  post_title text;
  post_id uuid;
begin
  select p.created_by, p.title, p.id
  into founder_id, post_title, post_id
  from public.problem_posts p
  where p.id = new.post_id;

  if founder_id is not null then
    perform public.notify_user(
      founder_id,
      'proposal_submitted',
      'New proposal received',
      coalesce(post_title, 'A proposal was submitted'),
      concat('/app/posts/', post_id)
    );
  end if;

  return new;
end;
$$;

create trigger proposal_insert_notify
after insert on public.proposals
for each row execute function public.notify_on_proposal_insert();

-- Proposal status change -> notify helper
create or replace function public.notify_on_proposal_update()
returns trigger language plpgsql as $$
declare
  post_title text;
  post_id uuid;
  status_label text;
begin
  if new.status = old.status then
    return new;
  end if;

  select p.title, p.id
  into post_title, post_id
  from public.problem_posts p
  where p.id = new.post_id;

  status_label := new.status;

  perform public.notify_user(
    new.proposed_by,
    'proposal_status',
    concat('Proposal ', status_label),
    coalesce(post_title, 'Your proposal status changed'),
    concat('/app/market/', post_id)
  );

  return new;
end;
$$;

create trigger proposal_update_notify
after update on public.proposals
for each row execute function public.notify_on_proposal_update();

-- Evidence submitted -> notify founder
create or replace function public.notify_on_evidence_insert()
returns trigger language plpgsql as $$
declare
  founder_id uuid;
  deal_id uuid;
begin
  select d.founder_id, d.id
  into founder_id, deal_id
  from public.deal_milestones m
  join public.deals d on d.id = m.deal_id
  where m.id = new.milestone_id;

  if founder_id is not null then
    perform public.notify_user(
      founder_id,
      'evidence_submitted',
      'Milestone evidence submitted',
      'A helper submitted evidence for review',
      concat('/app/deals/', deal_id)
    );
  end if;

  return new;
end;
$$;

create trigger evidence_insert_notify
after insert on public.milestone_evidence
for each row execute function public.notify_on_evidence_insert();

-- Milestone approved/rejected -> notify helper
create or replace function public.notify_on_milestone_update()
returns trigger language plpgsql as $$
declare
  helper_id uuid;
  deal_id uuid;
  status_label text;
begin
  if new.status = old.status then
    return new;
  end if;

  select d.helper_id, d.id
  into helper_id, deal_id
  from public.deals d
  where d.id = new.deal_id;

  status_label := new.status;

  perform public.notify_user(
    helper_id,
    'milestone_status',
    concat('Milestone ', status_label),
    'A milestone status changed',
    concat('/app/deals/', deal_id)
  );

  return new;
end;
$$;

create trigger milestone_update_notify
after update on public.deal_milestones
for each row execute function public.notify_on_milestone_update();
