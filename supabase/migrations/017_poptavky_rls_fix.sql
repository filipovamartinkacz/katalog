-- ============================================================
-- 017_poptavky_rls_fix.sql
-- Oprava: politiky "poptavka insert" a "rezervace_proklik insert"
-- volaly medailonek_is_published() jako SECURITY DEFINER funkci
-- zevnitř cizí RLS politiky — v tomto kontextu se chová jinak než
-- při přímém volání a odmítala i publikované profily ("new row
-- violates row-level security policy"). Nahrazeno přímým EXISTS
-- dotazem stejně jako u prokazatelně fungující politiky
-- "clanek_oblibene owner insert" (opírá se o vlastní "public read"
-- politiku tabulky medailonek, ne o funkci).
-- ============================================================

drop policy if exists "poptavka insert" on public.poptavka;
create policy "poptavka insert"
  on public.poptavka for insert
  with check (
    exists (select 1 from public.medailonek m where m.id = medailonek_id and m.is_published = true)
  );

drop policy if exists "rezervace_proklik insert" on public.rezervace_proklik;
create policy "rezervace_proklik insert"
  on public.rezervace_proklik for insert
  with check (
    exists (select 1 from public.medailonek m where m.id = medailonek_id and m.is_published = true)
    and (
      service_id is null
      or exists (
        select 1 from public.service s
        where s.id = service_id and s.medailonek_id = rezervace_proklik.medailonek_id
      )
    )
  );
