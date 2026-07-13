-- ============================================================
-- 022_oprava_slugu.sql
-- Oprava chyby z 009_profil_slug.sql: lower() se tam aplikoval až
-- po regexp_replace, takže velká písmena (vždy na začátku jména
-- i příjmení) byla v tu chvíli "neplatný znak" a smazala se /
-- splynula se sousední pomlčkou dřív, než je lower() stihl převést
-- (např. "Ivana Fišarová" → "-vana-isarova" místo "ivana-fisarova").
-- ============================================================

UPDATE public.medailonek
SET slug = trim(both '-' from regexp_replace(
  unaccent(lower(trim(jmeno) || '-' || trim(prijmeni))),
  '[^a-z0-9]+', '-', 'g'
));

-- Duplicity: přidej suffix z UUID (stejný vzor jako 009)
WITH ranked AS (
  SELECT id, slug,
    ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) AS rn
  FROM public.medailonek
)
UPDATE public.medailonek m
SET slug = m.slug || '-' || left(replace(m.id::text, '-', ''), 4)
FROM ranked r
WHERE m.id = r.id AND r.rn > 1;
