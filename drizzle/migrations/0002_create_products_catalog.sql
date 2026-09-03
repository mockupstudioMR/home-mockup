CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name text NOT NULL DEFAULT 'MockUp Studio',
  shop_id uuid,
  name text NOT NULL,
  description text,
  type text,
  style text,
  color text,
  material text,
  price numeric,
  currency text NOT NULL DEFAULT 'EUR',
  image_url text,
  source_url text,
  design_id uuid REFERENCES public.generated_designs(id) ON DELETE SET NULL,
  design_item_id uuid REFERENCES public.design_items(id) ON DELETE SET NULL,
  created_by uuid,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX products_design_item_key ON public.products (design_item_id) WHERE design_item_id IS NOT NULL;
CREATE INDEX products_shop_name_idx ON public.products (shop_name);
CREATE INDEX products_type_idx ON public.products (type);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Owners and admins can insert products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners and admins can update products"
  ON public.products FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners and admins can delete products"
  ON public.products FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_products_updated
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();