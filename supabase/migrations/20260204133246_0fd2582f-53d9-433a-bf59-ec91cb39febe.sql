-- Create storage bucket for room analysis uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-uploads', 'room-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload room images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'room-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to view their own files
CREATE POLICY "Users can view their room images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'room-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their room images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'room-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Public read access for the bucket (since designs may be shared)
CREATE POLICY "Public can view room images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'room-uploads');