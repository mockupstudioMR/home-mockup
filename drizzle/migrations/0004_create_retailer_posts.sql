CREATE TABLE public.retailer_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.retailer_style_profiles(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  caption TEXT,
  body TEXT,
  subject TEXT,
  preview TEXT,
  hashtags TEXT,
  image_url TEXT,
  image_prompt TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  language TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.retailer_posts TO authenticated;
GRANT ALL ON public.retailer_posts TO service_role;

ALTER TABLE public.retailer_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own retailer posts"
ON public.retailer_posts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view retailer posts"
ON public.retailer_posts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_retailer_posts_user ON public.retailer_posts(user_id, created_at DESC);

CREATE TRIGGER trg_retailer_posts_updated
BEFORE UPDATE ON public.retailer_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();