-- ============================================================
-- 014_clanky_obrazky_limit.sql
-- Blog: tvrdý limit velikosti a typu souboru na úrovni Storage
-- (klientská kontrola v prohlížeči jde obejít, tohle ne)
--
-- Nahrávané obrázky se v prohlížeči vždy převedou na WebP a zmenší na
-- max. 1920 px (viz src/lib/image-convert.ts), takže bucket povoluje
-- jen tenhle jeden formát — cokoli jiného znamená, že převod selhal
-- a nemělo by se to vůbec dostat až sem.
-- ============================================================

update storage.buckets
set file_size_limit = 8388608, -- 8 MB — velkorysá pojistka, po převodu bude soubor výrazně menší
    allowed_mime_types = array['image/webp']
where id = 'clanek-obrazky';
