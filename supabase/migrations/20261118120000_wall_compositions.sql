-- How every wall picture of the showroom is composed, stored as data rather than inside a manifest file.
--
-- 1. showroom_canvas_presets: the few picture sizes every wall is drawn at. A wall is drawn on the preset whose
--    shape is closest to its own (length : height), at one scale (px per cm) for the whole wall, so the guide,
--    the photo, every layer and every thumbnail share one size and stay sharp.
-- 2. showroom_item_specs: one composition rule per layout box (furniture_specs row): how it hangs or stands, how
--    far in front it sits (drawing order), how much room its cut-out gets, where its hotspot goes, and the
--    smallest size it may be drawn at. New furniture_specs rows get one automatically.
-- 3. wall_compositions + wall_composition_items: the composition of each person's wall: the wall's size, its
--    canvas and scale, and every piece's place in centimetres and pixels with its layer files.

-- 1 ---------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.showroom_canvas_presets (
  key         text PRIMARY KEY,
  label       text NOT NULL,
  width_px    integer NOT NULL CHECK (width_px BETWEEN 512 AND 2048 AND width_px % 16 = 0),
  height_px   integer NOT NULL CHECK (height_px BETWEEN 512 AND 2048 AND height_px % 16 = 0),
  ratio       numeric GENERATED ALWAYS AS (round(width_px::numeric / height_px, 4)) STORED,
  active      boolean NOT NULL DEFAULT true,
  note        text
);
ALTER TABLE public.showroom_canvas_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads canvas presets" ON public.showroom_canvas_presets FOR SELECT USING (true);
CREATE POLICY "Admins manage canvas presets" ON public.showroom_canvas_presets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Sizes the image models draw natively (multiples of 16, longest side at most 2048).
INSERT INTO public.showroom_canvas_presets (key, label, width_px, height_px, note) VALUES
  ('4x3',  'Short wall (4:3)',        1536, 1152, 'walls up to about 1.4 × their height'),
  ('3x2',  'Compact wall (3:2)',      1536, 1024, NULL),
  ('16x9', 'Standard wall (16:9)',    1792, 1008, 'most living-room walls, 4–5 m'),
  ('2x1',  'Long wall (2:1)',         2048, 1024, NULL),
  ('21x9', 'Very long wall (21:9)',   2048,  880, NULL),
  ('3x1',  'Gallery wall (3:1)',      2048,  688, 'walls longer than about 7 m')
ON CONFLICT (key) DO NOTHING;

-- 2 ---------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.showroom_item_specs (
  spec_id           uuid PRIMARY KEY REFERENCES public.furniture_specs(id) ON DELETE CASCADE,
  mount             text NOT NULL DEFAULT 'floor' CHECK (mount IN ('floor', 'wall', 'ceiling')),
  bottom_cm         integer NOT NULL DEFAULT 0 CHECK (bottom_cm BETWEEN 0 AND 400),   -- wall-hung: height of its lower edge
  depth_band        smallint NOT NULL DEFAULT 2 CHECK (depth_band BETWEEN 0 AND 4),  -- 0 on the wall … 4 foreground
  layer_group       text NOT NULL DEFAULT 'furniture' CHECK (layer_group IN ('furniture', 'walls', 'floor', 'lighting', 'decor')),
  cut_padding       numeric(4,2) NOT NULL DEFAULT 0.28 CHECK (cut_padding BETWEEN 0.05 AND 0.6), -- room around the piece for its cut-out, share of its size
  shadow_margin_cm  integer NOT NULL DEFAULT 8 CHECK (shadow_margin_cm BETWEEN 0 AND 60),
  hotspot_x         numeric(3,2) NOT NULL DEFAULT 0.5 CHECK (hotspot_x BETWEEN 0 AND 1),  -- inside the piece's box
  hotspot_y         numeric(3,2) NOT NULL DEFAULT 0.5 CHECK (hotspot_y BETWEEN 0 AND 1),
  min_px            integer NOT NULL DEFAULT 96 CHECK (min_px BETWEEN 16 AND 1024),     -- smallest side it may be drawn at
  in_wall_pictures  boolean NOT NULL DEFAULT true,
  updated_at        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.showroom_item_specs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads item composition specs" ON public.showroom_item_specs FOR SELECT USING (true);
CREATE POLICY "Admins manage item composition specs" ON public.showroom_item_specs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- The default rule for a layout box, from what it is.
CREATE OR REPLACE FUNCTION public.showroom_item_spec_defaults(p public.furniture_specs)
RETURNS public.showroom_item_specs LANGUAGE plpgsql STABLE AS $$
DECLARE r public.showroom_item_specs; n text := lower(coalesce(p.name, ''));
BEGIN
  r.spec_id := p.id; r.mount := 'floor'; r.bottom_cm := 0; r.depth_band := 2; r.layer_group := 'furniture';
  r.cut_padding := 0.28; r.shadow_margin_cm := 8; r.hotspot_x := 0.5; r.hotspot_y := 0.5; r.min_px := 96;
  r.in_wall_pictures := true; r.updated_at := now();
  IF n LIKE '%mirror%' OR n LIKE '%art%' OR n LIKE '%frame%' OR n LIKE '%shelf (wall)%' THEN
    r.mount := 'wall'; r.bottom_cm := 110; r.depth_band := 0; r.layer_group := 'decor'; r.cut_padding := 0.22; r.shadow_margin_cm := 3; r.min_px := 80;
  ELSIF n LIKE '%pendant%' OR n LIKE '%ceiling%' THEN
    r.mount := 'ceiling'; r.depth_band := 3; r.layer_group := 'lighting'; r.cut_padding := 0.35; r.shadow_margin_cm := 0; r.hotspot_y := 0.6; r.min_px := 64;
  ELSIF n LIKE '%lamp%' THEN
    r.depth_band := 3; r.layer_group := 'lighting'; r.cut_padding := 0.4; r.hotspot_y := 0.25; r.min_px := 64;
  ELSIF p.kind = 'rug' OR n LIKE 'rug%' THEN
    r.depth_band := 1; r.layer_group := 'floor'; r.in_wall_pictures := false; r.shadow_margin_cm := 0;
  ELSIF n LIKE '%cushion%' OR n LIKE '%throw%' THEN
    r.depth_band := 4; r.layer_group := 'decor'; r.cut_padding := 0.3; r.in_wall_pictures := false; r.min_px := 48;
  ELSIF p.kind = 'sofa' OR p.kind = 'bed' THEN
    r.depth_band := 2; r.hotspot_y := 0.55; r.min_px := 160;
  ELSIF p.kind = 'chair' OR p.kind = 'bench' THEN
    r.depth_band := 3; r.hotspot_y := 0.55; r.min_px := 96;
  ELSIF p.kind = 'table' THEN
    -- coffee and side tables stand in front of what is against the wall
    r.depth_band := CASE WHEN n LIKE '%coffee%' THEN 4 ELSE 3 END; r.hotspot_y := 0.35; r.min_px := CASE WHEN n LIKE '%side%' THEN 64 ELSE 112 END;
  ELSIF p.kind IN ('storage', 'desk') OR p.must_against_wall THEN
    r.depth_band := 1; r.cut_padding := 0.22; r.hotspot_y := 0.4; r.min_px := 96;
  END IF;
  RETURN r;
END $$;

-- one rule for every layout box already stored …
INSERT INTO public.showroom_item_specs
SELECT (public.showroom_item_spec_defaults(f)).* FROM public.furniture_specs f
ON CONFLICT (spec_id) DO NOTHING;

-- … and for every one added later
CREATE OR REPLACE FUNCTION public.showroom_item_specs_for_new_box() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.showroom_item_specs SELECT (public.showroom_item_spec_defaults(NEW)).* ON CONFLICT (spec_id) DO NOTHING;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS showroom_item_specs_for_new_box ON public.furniture_specs;
CREATE TRIGGER showroom_item_specs_for_new_box AFTER INSERT ON public.furniture_specs
  FOR EACH ROW EXECUTE FUNCTION public.showroom_item_specs_for_new_box();

-- Read together, as the app uses them.
CREATE OR REPLACE VIEW public.showroom_item_specs_full WITH (security_invoker = true) AS
SELECT f.id AS spec_id, f.name, f.variant, f.kind, f.category, f.is_default, f.width_cm, f.depth_cm, f.height_cm,
       s.mount, s.bottom_cm, s.depth_band, s.layer_group, s.cut_padding, s.shadow_margin_cm, s.hotspot_x, s.hotspot_y,
       s.min_px, s.in_wall_pictures
FROM public.furniture_specs f JOIN public.showroom_item_specs s ON s.spec_id = f.id;

-- 3 ---------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wall_compositions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id       uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  room_id          uuid REFERENCES public.rooms(id) ON DELETE CASCADE,
  layout_id        text NOT NULL,
  wall             text NOT NULL CHECK (wall IN ('A', 'B', 'C', 'D')),
  wall_length_cm   integer NOT NULL CHECK (wall_length_cm > 0),
  wall_height_cm   integer NOT NULL CHECK (wall_height_cm > 0),
  preset_key       text NOT NULL REFERENCES public.showroom_canvas_presets(key),
  canvas_width_px  integer NOT NULL,
  canvas_height_px integer NOT NULL,
  px_per_cm        numeric(6,3) NOT NULL CHECK (px_per_cm > 0),
  wall_x_px        integer NOT NULL DEFAULT 0,   -- where the wall starts inside the canvas
  wall_y_px        integer NOT NULL DEFAULT 0,
  scene_key        text NOT NULL,                -- what the picture was made from
  status           text NOT NULL DEFAULT 'ready' CHECK (status IN ('making', 'ready', 'failed')),
  guide_url        text,
  background_url   text,
  manifest_url     text,
  made_at          timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, layout_id, wall)
);
CREATE INDEX IF NOT EXISTS wall_compositions_room_idx ON public.wall_compositions (room_id, wall);
ALTER TABLE public.wall_compositions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read their wall compositions" ON public.wall_compositions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners add their wall compositions" ON public.wall_compositions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update their wall compositions" ON public.wall_compositions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners remove their wall compositions" ON public.wall_compositions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.wall_composition_items (
  composition_id   uuid NOT NULL REFERENCES public.wall_compositions(id) ON DELETE CASCADE,
  item_key         text NOT NULL,                -- the piece's id in the layout ("walls", "floor", "doors" for the shell)
  spec_id          uuid REFERENCES public.furniture_specs(id) ON DELETE SET NULL,
  label            text NOT NULL,
  layer_group      text NOT NULL,
  depth_band       smallint NOT NULL DEFAULT 2,
  z_order          integer NOT NULL,             -- drawing order: higher is in front
  -- on the wall, in centimetres from its left end and from the floor
  from_cm          integer NOT NULL,
  width_cm         integer NOT NULL,
  bottom_cm        integer NOT NULL,
  height_cm        integer NOT NULL,
  -- on the canvas, in pixels
  x_px             integer NOT NULL,
  y_px             integer NOT NULL,
  w_px             integer NOT NULL,
  h_px             integer NOT NULL,
  hotspot_x_px     integer NOT NULL,
  hotspot_y_px     integer NOT NULL,
  low_res          boolean NOT NULL DEFAULT false, -- drawn smaller than its spec's min_px
  variations       text[] NOT NULL DEFAULT '{}',
  thumbnails       text[] NOT NULL DEFAULT '{}',
  variation_names  text[] NOT NULL DEFAULT '{}',
  picked           smallint NOT NULL DEFAULT 0,
  PRIMARY KEY (composition_id, item_key)
);
ALTER TABLE public.wall_composition_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read their wall pieces" ON public.wall_composition_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.wall_compositions c WHERE c.id = composition_id AND c.user_id = auth.uid()));
CREATE POLICY "Owners add their wall pieces" ON public.wall_composition_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.wall_compositions c WHERE c.id = composition_id AND c.user_id = auth.uid()));
CREATE POLICY "Owners update their wall pieces" ON public.wall_composition_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.wall_compositions c WHERE c.id = composition_id AND c.user_id = auth.uid()));
CREATE POLICY "Owners remove their wall pieces" ON public.wall_composition_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.wall_compositions c WHERE c.id = composition_id AND c.user_id = auth.uid()));
