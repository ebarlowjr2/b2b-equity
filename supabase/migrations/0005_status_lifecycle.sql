-- Add lifecycle statuses

alter type public.problem_post_status add value if not exists 'in_review';
alter type public.problem_post_status add value if not exists 'matched';

alter type public.proposal_status add value if not exists 'withdrawn';

alter type public.deal_status add value if not exists 'disputed';
