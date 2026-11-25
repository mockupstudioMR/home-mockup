-- The confirmed picture of a wall: the person's chosen options flattened into one image.
ALTER TABLE public.wall_compositions ADD COLUMN IF NOT EXISTS final_url text;
ALTER TABLE public.wall_compositions ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
