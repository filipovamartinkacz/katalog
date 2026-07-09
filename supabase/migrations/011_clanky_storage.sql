-- ============================================================
-- 011_clanky_storage.sql
-- Blog: bucket pro cover a inline obrázky v článcích
-- ============================================================

insert into storage.buckets (id, name, public)
values ('clanek-obrazky', 'clanek-obrazky', true)
on conflict (id) do nothing;

create policy "clanek-obrazky public read"
  on storage.objects for select
  using (bucket_id = 'clanek-obrazky');

create policy "clanek-obrazky auth upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'clanek-obrazky' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "clanek-obrazky auth update"
  on storage.objects for update to authenticated
  using (bucket_id = 'clanek-obrazky' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "clanek-obrazky auth delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'clanek-obrazky' and (storage.foldername(name))[1] = auth.uid()::text);
