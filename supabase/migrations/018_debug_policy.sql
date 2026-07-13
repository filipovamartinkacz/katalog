-- ============================================================
-- 018_debug_policy.sql
-- DOČASNÁ diagnostická funkce — zobrazí skutečné znění RLS politik
-- na tabulce poptavka. Smaže se v příští migraci po vyřešení.
-- ============================================================

create or replace function public.debug_poptavka_policies()
returns table (policyname text, cmd text, qual text, with_check text)
language sql security definer as $$
  select polname::text, polcmd::text,
         pg_get_expr(polqual, polrelid)::text,
         pg_get_expr(polwithcheck, polrelid)::text
  from pg_policy
  where polrelid = 'public.poptavka'::regclass;
$$;

grant execute on function public.debug_poptavka_policies() to anon, authenticated;
