-- TEST ONLY: approve two living-room backgrounds (Redo it all · whole room
-- and wall D) using sample pictures already shipped with the app, so the
-- showroom can be tried before the AI pictures are generated.
-- "Make a new version" in Admin > Showroom backgrounds replaces them.
UPDATE public.showroom_backgrounds
SET image_path = '/journey-sample/room-hero.jpg', status = 'approved', updated_at = now()
WHERE starting_state = 'redo_all' AND room_type = 'living-room' AND view = 'room';

UPDATE public.showroom_backgrounds
SET image_path = '/journey-sample/entry-wall.jpg', status = 'approved', updated_at = now()
WHERE starting_state = 'redo_all' AND room_type = 'living-room' AND view = 'wall_d';
