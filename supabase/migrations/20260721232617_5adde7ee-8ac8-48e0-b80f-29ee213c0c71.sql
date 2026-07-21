CREATE TABLE public.material_visuals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  style_slug TEXT NOT NULL,
  kind TEXT NOT NULL,
  label TEXT NOT NULL,
  label_key TEXT GENERATED ALWAYS AS (lower(btrim(label))) STORED,
  image_url TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX material_visuals_unique_key
  ON public.material_visuals (style_slug, kind, label_key);

CREATE INDEX material_visuals_lookup
  ON public.material_visuals (style_slug, kind);

GRANT SELECT ON public.material_visuals TO anon;
GRANT SELECT, INSERT ON public.material_visuals TO authenticated;
GRANT ALL ON public.material_visuals TO service_role;

ALTER TABLE public.material_visuals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached material visuals"
  ON public.material_visuals
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add cached visuals"
  ON public.material_visuals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER update_material_visuals_updated_at
  BEFORE UPDATE ON public.material_visuals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();