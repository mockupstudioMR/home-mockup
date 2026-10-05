-- The app mirrors moodboard images, journey products and style prompt images
-- into the private "moodboard-assets" bucket (src/lib/journeyPersistence.ts),
-- and a migration already defines its access policies, but no migration
-- created the bucket itself. In a project where it was never created by hand,
-- every upload failed and only a console warning appeared.
--
-- Private bucket; files live under <user id>/... and are read through signed
-- URLs. Existing buckets are left unchanged.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'moodboard-assets',
  'moodboard-assets',
  false,
  15728640, -- 15 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;
