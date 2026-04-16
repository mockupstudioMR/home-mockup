UPDATE public.room_furniture_config
SET furniture_items = ARRAY['bed', 'nightstand', 'wardrobe', 'dresser', 'desk', 'desk chair', 'bedside lamp', 'rug', 'curtains', 'mirror', 'cushions']
WHERE room_type = 'bedroom';