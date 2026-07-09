-- ============================================================
-- 015_clanky_trigger_security_definer.sql
-- Oprava: trigger funkce aktualizující oblibene_count/view_count na
-- tabulce clanek běžely s právy volajícího (čtenářky), ne s
-- oprávněním potřebným k zápisu do cizího článku — RLS je proto
-- blokovala ("new row violates row-level security policy for
-- table clanek"). SECURITY DEFINER je spustí s právy vlastníka
-- funkce, stejně jako ostatní pomocné funkce v projektu
-- (owns_medailonek, record_clanek_view…).
-- ============================================================

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

create or replace function public.clanek_view_count_sync()
returns trigger language plpgsql security definer as $$
begin
  update public.clanek set view_count = view_count + 1 where id = new.clanek_id;
  return new;
end;
$$;
