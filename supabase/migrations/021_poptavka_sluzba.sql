-- ============================================================
-- 021_poptavka_sluzba.sql
-- Poptávkový formulář: výběr služby ("Mám zájem o")
-- ============================================================

alter table public.poptavka add column if not exists service_id int references public.service (id) on delete set null;

drop policy if exists "poptavka insert" on public.poptavka;
create policy "poptavka insert"
  on public.poptavka for insert
  with check (
    exists (select 1 from public.medailonek m where m.id = medailonek_id and m.is_published = true)
    and (
      service_id is null
      or exists (
        select 1 from public.service s
        where s.id = service_id and s.medailonek_id = poptavka.medailonek_id
      )
    )
  );
