-- Add AI-generated metadata columns to shop_products
ALTER TABLE public.shop_products 
ADD COLUMN IF NOT EXISTS ai_style_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_image_description text;

-- Create index for style tags search
CREATE INDEX IF NOT EXISTS idx_shop_products_ai_style_tags ON public.shop_products USING GIN(ai_style_tags);

-- Add RLS policy for admins to view all products
CREATE POLICY "Admins can view all products" 
ON public.shop_products 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));