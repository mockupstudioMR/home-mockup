-- Create a public bucket for generated design images
INSERT INTO storage.buckets (id, name, public) VALUES ('design-images', 'design-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own design images
CREATE POLICY "Users can upload design images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'design-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to design images
CREATE POLICY "Design images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'design-images');

-- Allow users to delete their own design images
CREATE POLICY "Users can delete own design images"
ON storage.objects FOR DELETE
USING (bucket_id = 'design-images' AND auth.uid()::text = (storage.foldername(name))[1]);