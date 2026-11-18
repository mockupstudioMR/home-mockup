-- Reusable camera-registered, approved scene assets. Reuse only when
-- dimensions, camera key, room family and license match exactly.
CREATE TABLE public.showroom_asset_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('furniture','walls','floor','lighting','decor')),
  room_type text NOT NULL,
  camera_key text NOT NULL,
  asset_key text NOT NULL,
  width integer NOT NULL CHECK (width BETWEEN 128 AND 4096),
  height integer NOT NULL CHECK (height BETWEEN 128 AND 4096),
  image_paths text[] NOT NULL CHECK (array_length(image_paths,1) >= 2),
  shadow_path text,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  style_tags text[] NOT NULL DEFAULT '{}',
  license_scope text NOT NULL DEFAULT 'demo' CHECK (license_scope IN ('demo','commercial')),
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_type,camera_key,asset_key,width,height)
);
ALTER TABLE public.showroom_asset_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read approved library" ON public.showroom_asset_library
FOR SELECT TO authenticated USING (approved = true);
CREATE POLICY "Admins manage library" ON public.showroom_asset_library
FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX showroom_library_match_idx ON public.showroom_asset_library
(room_type,camera_key,width,height,category) WHERE approved = true;
