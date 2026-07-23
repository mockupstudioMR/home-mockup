
-- 1) moodboard_assets
CREATE TABLE public.moodboard_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.journey_sessions(id) ON DELETE CASCADE,
  design_id UUID REFERENCES public.generated_designs(id) ON DELETE CASCADE,
  section TEXT NOT NULL,             -- 'architecture' | 'colors' | 'materials' | 'furniture' | 'decor' | 'must_include'
  kind TEXT NOT NULL DEFAULT 'ai',   -- 'ai' | 'upload' | 'reference'
  label TEXT,
  prompt TEXT,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.moodboard_assets TO authenticated;
GRANT ALL ON public.moodboard_assets TO service_role;
ALTER TABLE public.moodboard_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own moodboard assets"
  ON public.moodboard_assets FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_moodboard_assets_session ON public.moodboard_assets(session_id);
CREATE INDEX idx_moodboard_assets_design ON public.moodboard_assets(design_id);
CREATE TRIGGER trg_moodboard_assets_updated
  BEFORE UPDATE ON public.moodboard_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) journey_products
CREATE TABLE public.journey_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.journey_sessions(id) ON DELETE CASCADE,
  design_id UUID REFERENCES public.generated_designs(id) ON DELETE CASCADE,
  section TEXT,
  name TEXT,
  source_url TEXT,
  image_url TEXT,
  storage_path TEXT,
  price NUMERIC,
  currency TEXT DEFAULT 'EUR',
  is_pinned BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_products TO authenticated;
GRANT ALL ON public.journey_products TO service_role;
ALTER TABLE public.journey_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own journey products"
  ON public.journey_products FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_journey_products_session ON public.journey_products(session_id);
CREATE INDEX idx_journey_products_design ON public.journey_products(design_id);
CREATE TRIGGER trg_journey_products_updated
  BEFORE UPDATE ON public.journey_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) style_prompts
CREATE TABLE public.style_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.journey_sessions(id) ON DELETE CASCADE,
  input_kind TEXT NOT NULL DEFAULT 'text', -- 'text' | 'voice'
  prompt TEXT NOT NULL,
  generated_image_url TEXT,
  storage_path TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.style_prompts TO authenticated;
GRANT ALL ON public.style_prompts TO service_role;
ALTER TABLE public.style_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own style prompts"
  ON public.style_prompts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_style_prompts_session ON public.style_prompts(session_id);
CREATE TRIGGER trg_style_prompts_updated
  BEFORE UPDATE ON public.style_prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) design_journey_metadata
CREATE TABLE public.design_journey_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  design_id UUID NOT NULL UNIQUE REFERENCES public.generated_designs(id) ON DELETE CASCADE,
  health_score INTEGER,
  style_dna JSONB NOT NULL DEFAULT '{}'::jsonb,
  budget JSONB NOT NULL DEFAULT '{}'::jsonb,
  roadmap JSONB NOT NULL DEFAULT '{}'::jsonb,
  shopping JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.design_journey_metadata TO authenticated;
GRANT ALL ON public.design_journey_metadata TO service_role;
ALTER TABLE public.design_journey_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own design journey metadata"
  ON public.design_journey_metadata FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_djm_design ON public.design_journey_metadata(design_id);
CREATE TRIGGER trg_djm_updated
  BEFORE UPDATE ON public.design_journey_metadata
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
