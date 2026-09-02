CREATE TABLE public.shopping_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scope_key text NOT NULL,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  design_id uuid REFERENCES public.generated_designs(id) ON DELETE SET NULL,
  room_label text,
  measurements jsonb NOT NULL DEFAULT '{}'::jsonb,
  list jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX shopping_lists_user_scope_key ON public.shopping_lists (user_id, scope_key);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopping_lists TO authenticated;
GRANT ALL ON public.shopping_lists TO service_role;

ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own shopping lists"
ON public.shopping_lists
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_shopping_lists_updated
BEFORE UPDATE ON public.shopping_lists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();