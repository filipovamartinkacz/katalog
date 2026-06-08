-- Nahraď 'ceka_na_schvaleni' hodnotou 'navrzena' (jsou totéž, sjednocení terminologie)
do $$
declare v_conname text;
begin
  select conname into v_conname
  from pg_constraint
  where conrelid = 'public.metoda'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%status%';
  if v_conname is not null then
    execute format('alter table public.metoda drop constraint %I', v_conname);
  end if;
end $$;

alter table public.metoda
  add constraint metoda_status_check
    check (status in ('aktivni', 'navrzena'));
