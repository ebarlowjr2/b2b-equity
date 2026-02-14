-- Storage bucket for milestone evidence

insert into storage.buckets (id, name, public)
values ('milestone-evidence', 'milestone-evidence', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload/read evidence files
create policy "Milestone evidence objects are readable"
  on storage.objects for select
  using (bucket_id = 'milestone-evidence' and auth.role() = 'authenticated');

create policy "Milestone evidence objects are insertable"
  on storage.objects for insert
  with check (bucket_id = 'milestone-evidence' and auth.role() = 'authenticated');
