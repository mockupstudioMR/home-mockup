UPDATE public.room_furniture_config
SET furniture_items = ARRAY['bed', 'nightstand (left of bed)', 'nightstand (right of bed)', 'wardrobe', 'dresser', 'desk', 'desk chair', 'rug', 'mirror']
WHERE room_type = 'bedroom';