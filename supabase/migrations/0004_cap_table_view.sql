-- Cap table view + indices

create view public.cap_table_view as
select
  business_id,
  recipient_user_id as holder_user_id,
  sum(units)::numeric as units_sum
from public.equity_ledger_entries
group by business_id, recipient_user_id;

create index if not exists equity_ledger_entries_business_recipient_idx
  on public.equity_ledger_entries (business_id, recipient_user_id);

create index if not exists deals_business_id_idx
  on public.deals (business_id);

create index if not exists deal_milestones_deal_id_idx
  on public.deal_milestones (deal_id);
