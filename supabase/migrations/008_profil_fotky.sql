-- Profilové fotky: avatár (foto_url) a banner (banner_url)
ALTER TABLE public.medailonek
  ADD COLUMN IF NOT EXISTS foto_url   text,
  ADD COLUMN IF NOT EXISTS banner_url text;

-- Storage bucket — veřejný (URL nepotřebuje token)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profil-fotky', 'profil-fotky', true)
ON CONFLICT (id) DO NOTHING;

-- Politiky
CREATE POLICY "profil-fotky public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profil-fotky');

CREATE POLICY "profil-fotky auth upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profil-fotky' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "profil-fotky auth update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profil-fotky' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "profil-fotky auth delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'profil-fotky' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
