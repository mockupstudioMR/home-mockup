
-- business_profiles: remove public-read exposing phone
DROP POLICY IF EXISTS "Public can view active business profiles" ON public.business_profiles;

-- prompt_templates: remove public read
DROP POLICY IF EXISTS "Public can view prompt templates" ON public.prompt_templates;

-- role_invites: remove public read (acceptance handled by SECURITY DEFINER accept_invite)
DROP POLICY IF EXISTS "Anyone can view invite by token" ON public.role_invites;

-- product-images storage: scope insert/delete to user-owned folder
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;

CREATE POLICY "Users can upload product images to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own product images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- room-uploads: add missing UPDATE policy scoped to user folder
CREATE POLICY "Users can update their room images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'room-uploads' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'room-uploads' AND (auth.uid())::text = (storage.foldername(name))[1]);
