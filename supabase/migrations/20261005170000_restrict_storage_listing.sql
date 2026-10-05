-- Stop anyone from listing users' files in the public buckets.
--
-- room-photos, room-uploads, design-images and product-images are public
-- buckets. Their images are served through /storage/v1/object/public/...,
-- which does not consult row-level security, so stored links keep working
-- without any SELECT policy. The broad "anyone can view" SELECT policies
-- below were therefore not needed for display; what they did allow was
-- listing and searching every user's files through the storage API.
--
-- Replace them with owner-only access to <user id>/... folders, which the
-- app needs for upsert and remove. Admins can see everything.
-- Edge functions use the service role and are unaffected.

DROP POLICY IF EXISTS "Anyone can view room photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view room images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Design images are publicly accessible" ON storage.objects;

DROP POLICY IF EXISTS "Users can view own files in public buckets" ON storage.objects;
CREATE POLICY "Users can view own files in public buckets"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id IN ('room-photos', 'design-images', 'product-images')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
-- room-uploads already has "Users can view their room images" (own folder).

DROP POLICY IF EXISTS "Admins can view all files in public buckets" ON storage.objects;
CREATE POLICY "Admins can view all files in public buckets"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id IN ('room-photos', 'room-uploads', 'design-images', 'product-images', 'cms-assets')
    AND public.has_role(auth.uid(), 'admin')
  );

-- design-images had no UPDATE policy, so an upsert by the owner failed.
DROP POLICY IF EXISTS "Users can update own design images" ON storage.objects;
CREATE POLICY "Users can update own design images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'design-images' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'design-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- cms-assets: used by the admin CMS editor, but never created by a migration.
-- Public so CMS images can be shown on the site; only admins can write.
INSERT INTO storage.buckets (id, name, public)
VALUES ('cms-assets', 'cms-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Admins manage cms assets" ON storage.objects;
CREATE POLICY "Admins manage cms assets"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'cms-assets' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'cms-assets' AND public.has_role(auth.uid(), 'admin'));
