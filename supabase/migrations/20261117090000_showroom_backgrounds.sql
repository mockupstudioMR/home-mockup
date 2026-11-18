-- =====================================================================
-- Interactive showroom (chapter 2, from step 5.3): reference data.
--
-- 1. showroom_layer_rules  — which showroom layers each room state sees.
-- 2. showroom_backgrounds  — the starting picture ("background") the
--    showroom opens on, per room state × room type × view
--    (whole room + walls A–D, since every wall is its own showroom).
--
-- These are the DEFAULT backgrounds, used until the user's own room
-- (photo / floor plan) has been rendered. image_path stays NULL until an
-- image is generated from `prompt` and stored in the showroom-backgrounds
-- bucket; status tracks that. Review the wording before production.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Layer rules
-- ---------------------------------------------------------------------
CREATE TABLE public.showroom_layer_rules (
  starting_state  public.room_starting_state NOT NULL,
  layer           text NOT NULL CHECK (layer IN ('furniture', 'walls_floor', 'light_power', 'wall_by_wall')),
  layer_order     smallint NOT NULL,
  mode            text NOT NULL CHECK (mode IN ('full', 'limited', 'skipped')),
  allowed         text[] NOT NULL DEFAULT '{}',
  note            text,
  PRIMARY KEY (starting_state, layer)
);
ALTER TABLE public.showroom_layer_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view showroom layer rules" ON public.showroom_layer_rules FOR SELECT USING (true);
CREATE POLICY "Admins manage showroom layer rules" ON public.showroom_layer_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.showroom_layer_rules TO anon, authenticated;

INSERT INTO public.showroom_layer_rules (starting_state, layer, layer_order, mode, allowed, note) VALUES
 -- Core & shell: everything is open.
 ('core_shell', 'furniture',    1, 'full',    '{sofa,chairs,tables,storage,bed,rug}', NULL),
 ('core_shell', 'walls_floor',  2, 'full',    '{wall_colour,wall_finish,panelling,wallpaper,floor,skirting,ceiling}', 'Walls and floor are bare: choose everything.'),
 ('core_shell', 'light_power',  3, 'full',    '{ceiling_lights,wall_lights,lamps,sockets,switches,dimmers,data_points}', 'Points can go anywhere: electrician confirms.'),
 ('core_shell', 'wall_by_wall', 4, 'full',    '{built_ins,consoles,art,mirrors,curtains}', NULL),
 -- Empty: finished shell, surfaces only.
 ('empty', 'furniture',    1, 'full',    '{sofa,chairs,tables,storage,bed,rug}', NULL),
 ('empty', 'walls_floor',  2, 'limited', '{wall_colour,wallpaper,panelling}', 'Surfaces only: paint, wallpaper, panels. Floor stays.'),
 ('empty', 'light_power',  3, 'limited', '{ceiling_lights,wall_lights,lamps}', 'Fixtures on existing points, plus lamps.'),
 ('empty', 'wall_by_wall', 4, 'full',    '{built_ins,consoles,art,mirrors,curtains}', NULL),
 -- Partially furnished: kept pieces are locked.
 ('partially_furnished', 'furniture',    1, 'full',    '{sofa,chairs,tables,storage,bed,rug}', 'Pieces you keep show as locked green dots.'),
 ('partially_furnished', 'walls_floor',  2, 'skipped', '{}', 'Room is already finished: this layer is skipped.'),
 ('partially_furnished', 'light_power',  3, 'limited', '{ceiling_lights,wall_lights,lamps}', 'Fixtures on existing points, plus lamps.'),
 ('partially_furnished', 'wall_by_wall', 4, 'full',    '{consoles,art,mirrors,curtains}', NULL),
 -- Redo it all: like core & shell, starting from today's room.
 ('redo_all', 'furniture',    1, 'full', '{sofa,chairs,tables,storage,bed,rug}', NULL),
 ('redo_all', 'walls_floor',  2, 'full', '{wall_colour,wall_finish,panelling,wallpaper,floor,skirting,ceiling}', NULL),
 ('redo_all', 'light_power',  3, 'full', '{ceiling_lights,wall_lights,lamps,sockets,switches,dimmers,data_points}', 'Moving points may need approvals: trades confirm.'),
 ('redo_all', 'wall_by_wall', 4, 'full', '{built_ins,consoles,art,mirrors,curtains}', NULL);

-- ---------------------------------------------------------------------
-- 2. Default backgrounds
-- ---------------------------------------------------------------------
CREATE TABLE public.showroom_backgrounds (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  starting_state  public.room_starting_state NOT NULL,
  room_type       text NOT NULL,
  view            text NOT NULL CHECK (view IN ('room', 'wall_a', 'wall_b', 'wall_c', 'wall_d')),
  label           text NOT NULL,
  prompt          text NOT NULL,
  image_path      text,
  status          text NOT NULL DEFAULT 'to_generate' CHECK (status IN ('to_generate', 'generated', 'approved')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (starting_state, room_type, view)
);
ALTER TABLE public.showroom_backgrounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view showroom backgrounds" ON public.showroom_backgrounds FOR SELECT USING (true);
CREATE POLICY "Admins manage showroom backgrounds" ON public.showroom_backgrounds FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.showroom_backgrounds TO anon, authenticated;

-- Public bucket for the generated pictures.
INSERT INTO storage.buckets (id, name, public)
VALUES ('showroom-backgrounds', 'showroom-backgrounds', true)
ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Admins upload showroom backgrounds" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'showroom-backgrounds' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'showroom-backgrounds' AND public.has_role(auth.uid(), 'admin'));

-- 4 states × 8 room types × 5 views = 160 rows.
INSERT INTO public.showroom_backgrounds (starting_state, room_type, view, label, prompt)
SELECT
  s.state::public.room_starting_state,
  r.room_type,
  v.view,
  s.label || ' · ' || r.room_label || ' · ' || v.view_label,
  'Photorealistic interior photo, eye level, soft daylight, no people, no text. '
    || v.framing || ' of a ' || r.room_noun || '. '
    || s.condition || ' '
    || CASE WHEN s.state IN ('core_shell', 'redo_all') THEN r.shell_points ELSE r.finished_points END
    || ' Leave clear space so furniture and finishes can be placed on top.'
FROM (VALUES
  ('core_shell', 'Core & shell',
   'Bare core and shell: grey skim plaster walls, raw cement screed floor, exposed concrete ceiling, cables and empty back boxes coming out of the walls, no skirting, no doors fitted, no furniture, no light fittings.'),
  ('empty', 'Empty',
   'Finished but empty: smooth white painted walls, light oak floor with white skirting, white ceiling with plain ceiling points, sockets and switches fitted, doors fitted, no furniture, no rugs, no decor.'),
  ('partially_furnished', 'Partly furnished',
   'Finished and partly furnished: painted walls, wooden floor, a few existing pieces in place that the owner keeps, mostly empty floor space, no styling or decor.'),
  ('redo_all', 'Redo it all',
   'An existing lived-in room that will be fully redone: dated beige walls, worn laminate floor, old furniture and a ceiling light, shown slightly faded so new choices stand out.')
) s(state, label, condition)
CROSS JOIN (VALUES
  ('living-room', 'Living room',     'living room',     'Window on one wall and a door on another.', 'Window on one wall, a door, sockets near the floor and a TV point.'),
  ('bedroom',     'Bedroom',         'bedroom',         'Window, a door and capped cables where bedside lights will go.', 'Window, a door, sockets either side of the bed wall.'),
  ('kitchen',     'Kitchen',         'kitchen',         'Capped water and waste pipes, an extractor duct opening and cooker cable on the walls; no cabinets.', 'Water and waste points, extractor duct and appliance sockets on the walls; no cabinets.'),
  ('dining-room', 'Dining room',     'dining room',     'Window and a single capped ceiling cable over the middle of the room.', 'Window and a ceiling point centred for a pendant.'),
  ('office',      'Home office',     'home office',     'Window and cables for sockets and a data point.', 'Window, double sockets and a network point at desk height.'),
  ('bathroom',    'Bathroom',        'bathroom',        'Bare walls and floor with capped water pipes, a waste opening and a floor drain; no tiles, no sanitaryware.', 'Tiled walls and floor in plain white, water points, no sanitaryware fitted.'),
  ('kids-room',   'Kids'' room',     'child''s bedroom','Window, a door and capped cables at low height.', 'Window, a door and sockets with child-safe covers.'),
  ('hallway',     'Hallway & entry', 'entrance hallway','Front door, a narrow plan and capped cables for a light and an entry phone.', 'Front door, a ceiling point and an entry-phone panel.')
) r(room_type, room_label, room_noun, shell_points, finished_points)
CROSS JOIN (VALUES
  ('room',   'Whole room', 'Wide-angle view from the doorway corner showing two walls and the floor'),
  ('wall_a', 'Wall A',     'Straight-on, centred view of wall A (the main wall) from floor to ceiling'),
  ('wall_b', 'Wall B',     'Straight-on, centred view of wall B (to the right of wall A) from floor to ceiling'),
  ('wall_c', 'Wall C',     'Straight-on, centred view of wall C (opposite wall A, usually the window wall) from floor to ceiling'),
  ('wall_d', 'Wall D',     'Straight-on, centred view of wall D (the entry wall with the door) from floor to ceiling')
) v(view, view_label, framing);

-- Quick lookup used by the showroom: background for a room + view.
CREATE OR REPLACE FUNCTION public.showroom_background(_room_id uuid, _view text DEFAULT 'room')
RETURNS public.showroom_backgrounds LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT b.* FROM rooms r
  JOIN showroom_backgrounds b
    ON b.starting_state = r.starting_state
   AND b.room_type = COALESCE(r.room_type, 'living-room')
   AND b.view = _view
  WHERE r.id = _room_id
  LIMIT 1;
$$;
