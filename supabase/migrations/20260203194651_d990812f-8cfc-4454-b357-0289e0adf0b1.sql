-- Add google_images_url column to design_items table
ALTER TABLE public.design_items 
ADD COLUMN IF NOT EXISTS google_images_url text;