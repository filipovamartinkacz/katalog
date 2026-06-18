-- Slug pro profily (SEO-friendly URL)
CREATE EXTENSION IF NOT EXISTS unaccent;

ALTER TABLE public.medailonek
  ADD COLUMN IF NOT EXISTS slug text;

-- Backfill existujících záznamů
UPDATE public.medailonek
SET slug = lower(regexp_replace(
  unaccent(trim(jmeno) || '-' || trim(prijmeni)),
  '[^a-z0-9]+', '-', 'g'
))
WHERE slug IS NULL;

-- Duplicity: přidej suffix z UUID
WITH ranked AS (
  SELECT id, slug,
    ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) AS rn
  FROM public.medailonek
)
UPDATE public.medailonek m
SET slug = m.slug || '-' || left(replace(m.id::text, '-', ''), 4)
FROM ranked r
WHERE m.id = r.id AND r.rn > 1;

ALTER TABLE public.medailonek
  ADD CONSTRAINT medailonek_slug_key UNIQUE (slug);
