-- Add hex_code column for storing paint color codes separately
ALTER TABLE public.design_items ADD COLUMN IF NOT EXISTS hex_code TEXT;

-- Add bounding_box column for storing item location in the image
ALTER TABLE public.design_items ADD COLUMN IF NOT EXISTS bounding_box JSONB;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_design_items_hex_code ON public.design_items (hex_code) WHERE hex_code IS NOT NULL;