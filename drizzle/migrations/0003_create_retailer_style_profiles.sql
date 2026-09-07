CREATE TABLE public.retailer_style_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_range TEXT,
  product_types TEXT[] NOT NULL DEFAULT '{}',
  sales_channel TEXT,
  product_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  product_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  analysis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.retailer_style_profiles TO authenticated;
GRANT ALL ON public.retailer_style_profiles TO service_role;

ALTER TABLE public.retailer_style_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own retailer style profiles"
ON public.retailer_style_profiles
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view retailer style profiles"
ON public.retailer_style_profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_retailer_style_profiles_user ON public.retailer_style_profiles(user_id, created_at DESC);