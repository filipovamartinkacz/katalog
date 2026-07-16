-- ============================================================
-- 024_medailonek_rls_fix.sql
-- Politika "medailonek owner update" (001_initial_schema.sql) nemá
-- WITH CHECK, takže vlastník mohl přes obyčejný update nastavit
-- is_published/user_confirmed sám sobě a obejít admin schválení
-- (approveMedailonek) i potvrzení účtu (023_ucet_potvrzeni.sql).
--
-- Řešeno triggerem místo WITH CHECK, protože potřebujeme porovnat
-- NEW s OLD hodnotou (WITH CHECK vidí jen NEW). Trigger sloupce
-- vrátí na původní hodnotu, pokud update nejde přes service_role
-- (admin) nebo interní trigger mimo PostgREST — sync_user_confirmed
-- v 023 běží z auth.users mimo PostgREST, kde auth.role() je NULL.
-- ============================================================

CREATE OR REPLACE FUNCTION public.medailonek_protect_admin_columns()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF auth.role() IS NOT NULL AND auth.role() <> 'service_role' THEN
    NEW.is_published := OLD.is_published;
    NEW.user_confirmed := OLD.user_confirmed;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS medailonek_protect_admin_columns ON public.medailonek;
CREATE TRIGGER medailonek_protect_admin_columns
  BEFORE UPDATE ON public.medailonek
  FOR EACH ROW EXECUTE FUNCTION public.medailonek_protect_admin_columns();
