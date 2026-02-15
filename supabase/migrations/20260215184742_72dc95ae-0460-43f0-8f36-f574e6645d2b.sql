
-- Add product_photo_url to store AI-isolated product photos on white background
ALTER TABLE public.design_items ADD COLUMN product_photo_url TEXT;

-- Add wall_type for wall items (pleine wall, door wall, window wall, balcony wall)
ALTER TABLE public.design_items ADD COLUMN wall_type TEXT;
