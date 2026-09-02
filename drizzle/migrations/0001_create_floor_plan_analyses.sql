CREATE TABLE public.floor_plan_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  image_hash text NOT NULL,
  image_url text NOT NULL,
  storage_path text,
  plan jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT floor_plan_analyses_user_hash_key UNIQUE (user_id, image_hash)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.floor_plan_analyses TO authenticated;
GRANT ALL ON public.floor_plan_analyses TO service_role;

ALTER TABLE public.floor_plan_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own floor plan analyses"
ON public.floor_plan_analyses
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_floor_plan_analyses_user_created ON public.floor_plan_analyses (user_id, created_at DESC);

CREATE TRIGGER trg_floor_plan_analyses_updated
BEFORE UPDATE ON public.floor_plan_analyses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();