INSERT INTO public.room_furniture_config (room_type, room_label, furniture_items, description) VALUES
('open-space-kitchen-dining-living', 'Open Space (Kitchen + Dining + Living)',
  ARRAY['sofa','coffee table','armchair','TV stand','side table','floor lamp','rug','dining table','dining chairs','kitchen island','bar stools','pendant lights','bookshelf','desk','desk chair','curtains','wall art','plants'],
  'Open-plan area combining cooking, dining and lounging — desk allowed as optional work nook'),
('dining-living', 'Dining + Living',
  ARRAY['sofa','coffee table','armchair','TV stand','side table','floor lamp','rug','dining table','dining chairs','sideboard','bookshelf','curtains','wall art','plants'],
  'Combined dining and living space — no desk, kitchen items excluded'),
('studio-apartment', 'Studio Apartment',
  ARRAY['bed','nightstand','sofa','coffee table','armchair','TV stand','dining table','dining chairs','desk','desk chair','wardrobe','dresser','bookshelf','floor lamp','rug','curtains','wall art','plants','kitchen island','bar stools'],
  'Single open space combining living, sleeping, working and cooking — desk and bed both included');