-- Experience logos bucket — exists in storage but had no documented policies,
-- so dashboard logo uploads/deletes were denied. Additive, safe to re-run.

INSERT INTO storage.buckets (id, name, public)
VALUES ('experience-logos', 'experience-logos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public read experience logos" ON storage.objects;
CREATE POLICY "public read experience logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'experience-logos');

DROP POLICY IF EXISTS "admin upload experience logos" ON storage.objects;
CREATE POLICY "admin upload experience logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'experience-logos'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "admin update experience logos" ON storage.objects;
CREATE POLICY "admin update experience logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'experience-logos'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "admin delete experience logos" ON storage.objects;
CREATE POLICY "admin delete experience logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'experience-logos'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
