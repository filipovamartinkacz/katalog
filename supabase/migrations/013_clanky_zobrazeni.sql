-- ============================================================
-- 013_clanky_zobrazeni.sql
-- Blog: dedupované počítadlo zobrazení (1 návštěvník / den)
-- ============================================================

alter table public.clanek add column view_count int not null default 0;

create table public.clanek_view (
  clanek_id  uuid not null references public.clanek (id) on delete cascade,
  visitor_id uuid not null,
  viewed_on  date not null default current_date,
  primary key (clanek_id, visitor_id, viewed_on)
);

alter table public.clanek_view enable row level security;
-- Záměrně žádné select/insert politiky — tabulka se dotýká jen přes
-- SECURITY DEFINER funkci níže (běží jako vlastník funkce, obchází RLS,
-- stejně jako owns_medailonek() v 001_initial_schema.sql).

create or replace function public.clanek_view_count_sync()
returns trigger language plpgsql security definer as $$
begin
  update public.clanek set view_count = view_count + 1 where id = new.clanek_id;
  return new;
end;
$$;

create trigger clanek_view_insert_count
  after insert on public.clanek_view
  for each row execute function public.clanek_view_count_sync();

create or replace function public.record_clanek_view(p_clanek_id uuid, p_visitor_id uuid)
returns void language plpgsql security definer as $$
begin
  insert into public.clanek_view (clanek_id, visitor_id)
  values (p_clanek_id, p_visitor_id)
  on conflict (clanek_id, visitor_id, viewed_on) do nothing;
end;
$$;

-- Voláno přímo přes RPC z anon i authenticated klienta (i nepřihlášení čtenáři)
grant execute on function public.record_clanek_view(uuid, uuid) to anon, authenticated;
