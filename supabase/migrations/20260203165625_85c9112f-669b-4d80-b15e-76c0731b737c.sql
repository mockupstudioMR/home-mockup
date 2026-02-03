-- Add design history tracking columns to generated_designs
ALTER TABLE public.generated_designs 
ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS locked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS full_description text,
ADD COLUMN IF NOT EXISTS modification_history jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS extracted_items jsonb;

-- Create a table for extracted room items
CREATE TABLE IF NOT EXISTS public.design_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  design_id uuid NOT NULL REFERENCES public.generated_designs(id) ON DELETE CASCADE,
  item_type text NOT NULL, -- 'wall_color', 'floor_material', 'furniture', 'decor', 'lighting', 'textile'
  item_name text NOT NULL,
  item_description text,
  color text,
  material text,
  style text,
  priority text DEFAULT 'recommended', -- 'essential', 'recommended', 'optional'
  matched_product_id uuid REFERENCES public.shop_products(id),
  google_shopping_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on design_items
ALTER TABLE public.design_items ENABLE ROW LEVEL SECURITY;

-- Users can view their own design items
CREATE POLICY "Users can view own design items" 
ON public.design_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.generated_designs 
    WHERE id = design_items.design_id 
    AND user_id = auth.uid()
  )
);

-- Users can insert items for their own designs
CREATE POLICY "Users can insert own design items" 
ON public.design_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.generated_designs 
    WHERE id = design_items.design_id 
    AND user_id = auth.uid()
  )
);

-- Users can update their own design items
CREATE POLICY "Users can update own design items" 
ON public.design_items 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.generated_designs 
    WHERE id = design_items.design_id 
    AND user_id = auth.uid()
  )
);

-- Users can delete their own design items
CREATE POLICY "Users can delete own design items" 
ON public.design_items 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.generated_designs 
    WHERE id = design_items.design_id 
    AND user_id = auth.uid()
  )
);

-- Add city/location column to business_profiles if not exists
ALTER TABLE public.business_profiles 
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS country text DEFAULT 'Netherlands';

-- Add location to profiles for user matching
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS country text;