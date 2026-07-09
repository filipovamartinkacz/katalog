-- ============================================================
-- 012_clanky_oblibene.sql
-- Blog: oblíbené články (soukromé, admin vidí denormalizovaný počet)
-- ============================================================

alter table public.clanek add column oblibene_count int not null default 0;

create table public.clanek_oblibene (
  user_id    uuid not null references auth.users (id) on delete cascade,
  clanek_id  uuid not null references public.clanek (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, clanek_id)
);

alter table public.clanek_oblibene enable row level security;

create policy "clanek_oblibene owner read"
  on public.clanek_oblibene for select
  using (auth.uid() = user_id);

create policy "clanek_oblibene owner insert"
  on public.clanek_oblibene for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.clanek c where c.id = clanek_id and c.status = 'publikovano')
  );

create policy "clanek_oblibene owner delete"
  on public.clanek_oblibene for delete
  using (auth.uid() = user_id);

create or replace function public.clanek_oblibene_count_sync()
returns trigger language plpgsql security definer as $$
begin
  if (tg_op = 'INSERT') then
    update public.clanek set oblibene_count = oblibene_count + 1 where id = new.clanek_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.clanek set oblibene_count = greatest(0, oblibene_count - 1) where id = old.clanek_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger clanek_oblibene_insert_count
  after insert on public.clanek_oblibene
  for each row execute function public.clanek_oblibene_count_sync();

create trigger clanek_oblibene_delete_count
  after delete on public.clanek_oblibene
  for each row execute function public.clanek_oblibene_count_sync();
