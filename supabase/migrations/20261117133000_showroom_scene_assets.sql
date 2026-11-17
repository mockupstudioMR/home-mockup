-- Only publish approved non-sensitive showroom assets in this PUBLIC bucket.
-- Never upload user room photos or private designs to it.
INSERT INTO storage.buckets (id, name, public)
VALUES ('showroom-scene-assets', 'showroom-scene-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read published showroom assets"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'showroom-scene-assets');

CREATE POLICY "Admins manage showroom scene assets"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'showroom-scene-assets' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'showroom-scene-assets' AND public.has_role(auth.uid(), 'admin'));
