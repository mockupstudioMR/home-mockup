-- =====================================================================
-- Reference data for the 10-step flow. Typical sizes are starting
-- values for the size database — review before production.
-- =====================================================================

-- Default scope per starting state (drives screens 1.5a–d).
CREATE TABLE public.scope_defaults (
  starting_state  public.room_starting_state NOT NULL,
  area            text NOT NULL,
  mode            public.scope_mode NOT NULL,
  hint            text,
  PRIMARY KEY (starting_state, area)
);
ALTER TABLE public.scope_defaults ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view scope defaults" ON public.scope_defaults FOR SELECT USING (true);
CREATE POLICY "Admins manage scope defaults" ON public.scope_defaults FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.scope_defaults TO anon, authenticated;

INSERT INTO public.scope_defaults (starting_state, area, mode, hint)
SELECT s.state::public.room_starting_state, a.area, m.mode::public.scope_mode, m.hint
FROM (VALUES ('core_shell'), ('empty'), ('partially_furnished'), ('redo_all')) s(state)
CROSS JOIN (VALUES ('furniture'),('walls_finishes'),('floors'),('lighting'),('built_ins'),
                   ('electrical'),('water_plumbing'),('ac_ventilation'),('heating'),('data_tv_sound')) a(area)
CROSS JOIN LATERAL (
  SELECT CASE
    WHEN s.state IN ('core_shell', 'redo_all') THEN 'in_scope'
    WHEN a.area IN ('furniture', 'walls_finishes', 'lighting') THEN 'in_scope'
    WHEN s.state = 'empty' THEN 'kept_as_is'
    ELSE 'on_request' END AS mode,
  CASE
    WHEN s.state = 'redo_all' AND a.area IN ('water_plumbing', 'ac_ventilation', 'heating') THEN 'Moving it may need approvals — trades confirm'
    WHEN s.state IN ('empty', 'partially_furnished') AND a.area = 'walls_finishes' THEN 'Surfaces only: paint, wallpaper, panels'
    WHEN s.state IN ('empty', 'partially_furnished') AND a.area = 'lighting' THEN 'Fixtures on existing points, lamps'
    ELSE NULL END AS hint
) m;

-- Helper: copy the defaults into a room when its starting state is chosen.
CREATE OR REPLACE FUNCTION public.apply_scope_defaults(_room_id uuid)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  INSERT INTO room_scope (room_id, area, mode)
  SELECT r.id, d.area, d.mode FROM rooms r JOIN scope_defaults d ON d.starting_state = r.starting_state
  WHERE r.id = _room_id
  ON CONFLICT (room_id, area) DO UPDATE SET mode = EXCLUDED.mode;
$$;

-- Standard sizes (cm). One default variant per item name.
INSERT INTO public.furniture_specs (name, category, variant, is_default, width_cm, depth_cm, height_cm, min_clearance_cm, must_against_wall, extra_dims, source)
VALUES
 ('upright piano',   'instruments', 'standard', true,  150,  60, 125, 90, true,  '{"bench":{"w":56,"d":36,"h":49}}', 'typical range 140–155 × 55–65 × 110–131'),
 ('upright piano',   'instruments', 'compact',  false, 140,  55, 110, 90, true,  '{"bench":{"w":56,"d":36,"h":49}}', 'typical'),
 ('upright piano',   'instruments', 'tall',     false, 152,  62, 131, 90, true,  '{"bench":{"w":56,"d":36,"h":49}}', 'typical'),
 ('digital piano',   'instruments', 'standard', true,  136,  40,  95, 80, true,  '{}', 'typical'),
 ('baby grand piano','instruments', 'standard', true,  150, 155, 100, 100, false, '{}', 'typical'),
 ('curved sofa',     'seating',     '3-seat',   true,  240, 105,  80, 60, false, '{"seat_height_cm":44}', 'typical'),
 ('curved sofa',     'seating',     '2-seat',   false, 190,  95,  80, 60, false, '{"seat_height_cm":44}', 'typical'),
 ('curved sofa',     'seating',     '4-seat',   false, 290, 110,  80, 60, false, '{"seat_height_cm":44}', 'typical'),
 ('3-seat sofa',     'seating',     'standard', true,  220,  95,  85, 60, false, '{"seat_height_cm":45}', 'typical'),
 ('l-shape sofa',    'seating',     'standard', true,  280, 180,  85, 60, false, '{"seat_height_cm":45}', 'typical'),
 ('accent chair',    'seating',     'standard', true,   80,  85,  85, 50, false, '{"seat_height_cm":42}', 'typical'),
 ('coffee table',    'tables',      'standard', true,  110,  65,  38, 45, false, '{}', 'typical'),
 ('side table',      'tables',      'standard', true,   45,  45,  50, 30, false, '{"round":true}', 'typical'),
 ('console',         'storage',     'slim',     true,  100,  30,  80, 60, true,  '{}', 'typical'),
 ('rug',             'decor',       'large',    true,  240, 340,   1,  0, false, '{}', 'typical'),
 ('round mirror',    'decor',       'standard', true,   80,   3,  80,  0, true,  '{"round":true}', 'typical'),
 ('floor lamp',      'lighting',    'standard', true,   30,  30, 155, 20, false, '{"base_d":30}', 'typical 145–165 high'),
 ('cushion',         'decor',       'standard', true,   45,  45,  15,  0, false, '{"alt":"50×50"}', 'typical')
ON CONFLICT (name, variant) DO NOTHING;

-- Living-room activities (step 3.1).
INSERT INTO public.room_activities (room_type, activity_name, priority, furniture_items, preferred_zone, space_weight)
VALUES
 ('living-room', 'Relax',          1, '{sofa,coffee table}',       'center', 0.4),
 ('living-room', 'Host friends',   2, '{sofa,accent chair}',       'center', 0.4),
 ('living-room', 'Play piano',     2, '{upright piano}',           'wall',   0.2),
 ('living-room', 'Watch films',    3, '{sofa,tv unit}',            'wall',   0.3),
 ('living-room', 'Read',           3, '{accent chair,floor lamp}', 'window', 0.15),
 ('living-room', 'Work',           3, '{desk,chair}',              'window', 0.2),
 ('living-room', 'Paint & craft',  4, '{table}',                   'window', 0.2),
 ('living-room', 'Kids play',      4, '{storage}',                 'center', 0.25),
 ('living-room', 'Eat here',       4, '{dining table}',            'center', 0.3),
 ('living-room', 'Yoga & stretch', 5, '{}',                        'center', 0.2)
ON CONFLICT (room_type, activity_name) DO NOTHING;

-- Opening rules used by layout generation.
INSERT INTO public.opening_rules (opening_type, clearance_cm, requires_path_to, attracts_furniture, repels_furniture)
VALUES
 ('door',     90, '{window}', '{console}',                  '{sofa,piano}'),
 ('window',   60, '{}',       '{accent chair,desk}',        '{tv unit}'),
 ('radiator', 30, '{}',       '{}',                         '{sofa,piano,bookshelf}')
ON CONFLICT (opening_type) DO NOTHING;
