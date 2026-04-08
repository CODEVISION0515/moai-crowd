-- 成果物ファイル保存用バケット
insert into storage.buckets (id, name, public)
values ('deliverables', 'deliverables', true)
on conflict (id) do nothing;

-- アップロードは認証済みユーザーのみ
create policy "authenticated users can upload deliverables"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'deliverables');

create policy "deliverables are publicly readable"
  on storage.objects for select using (bucket_id = 'deliverables');
