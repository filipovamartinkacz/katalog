-- ============================================================
-- 019_debug_policy_2.sql
-- DOČASNÁ diagnostika — kontext role a přímé vyhodnocení EXISTS
-- podmínky z politiky "poptavka insert". Smaže se po vyřešení.
-- ============================================================

create or replace function public.debug_context(p_medailonek_id uuid)
returns table (
  current_role_ text,
  auth_role text,
  auth_uid text,
  exists_check boolean,
  medailonek_is_published boolean
)
language plpgsql security invoker as $$
begin
  return query select
    current_user::text,
    auth.role()::text,
    auth.uid()::text,
    exists (select 1 from public.medailonek m where m.id = p_medailonek_id and m.is_published = true),
    public.medailonek_is_published(p_medailonek_id);
end;
$$;

grant execute on function public.debug_context(uuid) to anon, authenticated;
