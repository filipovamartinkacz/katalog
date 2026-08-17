-- ============================================================
-- 023_ucet_potvrzeni.sql
-- Medailonek smí admin schválit (is_published = true), ale veřejně
-- viditelný (a použitelný pro poptávku) je až když si odbornice
-- skutečně vytvořila a potvrdila účet — jinak by poptávka neměla
-- komu chodit a profil by patřil nikomu neověřenému.
--
-- Denormalizovaný sloupec (ne živý JOIN na auth.users v RLS) —
-- viz 017_poptavky_rls_fix.sql: volání SECURITY DEFINER funkce
-- zevnitř cizí RLS politiky se v tomto projektu už jednou chovalo
-- nespolehlivě. Přímý sloupec na medailonek je bezpečný stejným
-- způsobem, jakým dnes funguje is_published.
-- ============================================================

ALTER TABLE public.medailonek
  ADD COLUMN IF NOT EXISTS user_confirmed boolean NOT NULL DEFAULT false;

-- Backfill podle aktuálního stavu účtu
UPDATE public.medailonek m
SET user_confirmed = EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = m.user_id AND u.email_confirmed_at IS NOT NULL
);

-- Nový medailonek (self-serve i import) dostane správný stav hned podle
-- toho, jestli je propojený účet v tu chvíli už potvrzený.
CREATE OR REPLACE FUNCTION public.set_user_confirmed_on_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.user_confirmed := EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = NEW.user_id AND u.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS medailonek_set_user_confirmed ON public.medailonek;
CREATE TRIGGER medailonek_set_user_confirmed
  BEFORE INSERT ON public.medailonek
  FOR EACH ROW EXECUTE FUNCTION public.set_user_confirmed_on_insert();

-- Když si odbornice účet dodatečně potvrdí (pozvánka → nastavení hesla),
-- dosynchronizuj její medailonek.
CREATE OR REPLACE FUNCTION public.sync_user_confirmed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.medailonek
  SET user_confirmed = (NEW.email_confirmed_at IS NOT NULL)
  WHERE user_id = NEW.id AND user_confirmed IS DISTINCT FROM (NEW.email_confirmed_at IS NOT NULL);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_confirmed();

-- Veřejná viditelnost medailonku vyžaduje oboje
DROP POLICY IF EXISTS "medailonek public read" ON public.medailonek;
CREATE POLICY "medailonek public read"
  ON public.medailonek FOR SELECT
  USING (is_published = true AND user_confirmed = true);

-- Helper používaný politikami service/social_link/image/file/location/metoda
CREATE OR REPLACE FUNCTION public.medailonek_is_published(p_medailonek_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT coalesce(
    (SELECT is_published AND user_confirmed FROM public.medailonek WHERE id = p_medailonek_id),
    false
  );
$$;

-- Poptávka a proklik: přímý sloupcový check (ne volání funkce z cizí politiky,
-- viz komentář nahoře) — stejný vzor jako 017/021, jen s podmínkou navíc.
DROP POLICY IF EXISTS "poptavka insert" ON public.poptavka;
CREATE POLICY "poptavka insert"
  ON public.poptavka FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.medailonek m
      WHERE m.id = medailonek_id AND m.is_published = true AND m.user_confirmed = true
    )
    AND (
      service_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.service s
        WHERE s.id = service_id AND s.medailonek_id = poptavka.medailonek_id
      )
    )
  );

DROP POLICY IF EXISTS "rezervace_proklik insert" ON public.rezervace_proklik;
CREATE POLICY "rezervace_proklik insert"
  ON public.rezervace_proklik FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.medailonek m
      WHERE m.id = medailonek_id AND m.is_published = true AND m.user_confirmed = true
    )
    AND (
      service_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.service s
        WHERE s.id = service_id AND s.medailonek_id = rezervace_proklik.medailonek_id
      )
    )
  );
