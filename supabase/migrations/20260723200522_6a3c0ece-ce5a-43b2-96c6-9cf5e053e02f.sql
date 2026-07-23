
CREATE POLICY "Users read own moodboard files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'moodboard-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own moodboard files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'moodboard-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own moodboard files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'moodboard-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own moodboard files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'moodboard-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
