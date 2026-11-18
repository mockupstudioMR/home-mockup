-- Layout rules: furniture sizes with which way each piece faces, and the groupings professionals use
-- (sofa + coffee table + TV, bed + nightstands, table + chairs). Step 4 layouts are built from these:
-- the AI picks groupings and walls, code places every piece from the sizes and offsets below.
-- The same data is built into the app (supabase/functions/_shared/layoutRules.ts) as a fallback.

-- ---------------------------------------------------------------
-- 1. Sizes: what each piece is drawn as, and which way it faces
-- ---------------------------------------------------------------
ALTER TABLE public.furniture_specs
  ADD COLUMN IF NOT EXISTS kind   text NOT NULL DEFAULT 'other'
    CHECK (kind IN ('sofa', 'chair', 'table', 'rug', 'storage', 'bed', 'desk', 'bench', 'other')),
  -- wall: back against a wall · head_wall: head end against a wall (beds) · anchor: faces the piece it
  -- belongs to (chairs) · free: no front (tables, rugs, lamps)
  ADD COLUMN IF NOT EXISTS facing text NOT NULL DEFAULT 'free'
    CHECK (facing IN ('wall', 'head_wall', 'anchor', 'free'));

-- ---------------------------------------------------------------
-- 2. Groupings: pieces that go together, and where each sits
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.furniture_groupings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key            text NOT NULL UNIQUE CHECK (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name           text NOT NULL,
  room_types     text[] NOT NULL DEFAULT '{}',   -- journey room ids: living-room, bedroom, dining-room …
  activities     text[] NOT NULL DEFAULT '{}',   -- step 3 activities it serves: Relax, Sleep, Eat here …
  anchor_name    text NOT NULL,                  -- the main piece (furniture_specs.name)
  anchor_variant text,                           -- its size (furniture_specs.variant); default size when empty
  anchor_place   text NOT NULL DEFAULT 'wall' CHECK (anchor_place IN ('wall', 'floating')),
  priority       integer NOT NULL DEFAULT 5,     -- lower first when several serve the same activity
  zone           text NOT NULL DEFAULT '',       -- one upper-case word on the plan, e.g. RELAX
  notes          text,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Where each member sits, drawn as if the main piece stands against the TOP wall facing down into the room:
-- dx_cm sideways (right +), dy_cm into the room (+), to the member's centre. For a main piece against a wall
-- they're measured from the middle of its back (on the wall); for a free-standing one from its centre.
-- faces: which way the member's front points in that drawing. at = opposite_wall: against the wall facing the
-- main piece, lined up with it (a TV unit across from the sofa).
CREATE TABLE IF NOT EXISTS public.furniture_grouping_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grouping_id  uuid NOT NULL REFERENCES public.furniture_groupings(id) ON DELETE CASCADE,
  sort         smallint NOT NULL DEFAULT 0,
  spec_name    text NOT NULL,
  spec_variant text,
  label        text,
  dx_cm        integer NOT NULL DEFAULT 0,
  dy_cm        integer NOT NULL DEFAULT 0,
  faces        text NOT NULL DEFAULT 'into_room' CHECK (faces IN ('into_room', 'toward_wall', 'left', 'right', 'none')),
  at           text NOT NULL DEFAULT 'offset' CHECK (at IN ('offset', 'opposite_wall')),
  optional     boolean NOT NULL DEFAULT false   -- left out when it doesn't fit
);
CREATE INDEX IF NOT EXISTS idx_grouping_members_grouping ON public.furniture_grouping_members (grouping_id, sort);

ALTER TABLE public.furniture_groupings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.furniture_grouping_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read furniture groupings" ON public.furniture_groupings;
CREATE POLICY "Anyone can read furniture groupings" ON public.furniture_groupings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage furniture groupings" ON public.furniture_groupings;
CREATE POLICY "Admins manage furniture groupings" ON public.furniture_groupings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can read grouping members" ON public.furniture_grouping_members;
CREATE POLICY "Anyone can read grouping members" ON public.furniture_grouping_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage grouping members" ON public.furniture_grouping_members;
CREATE POLICY "Admins manage grouping members" ON public.furniture_grouping_members FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_furniture_groupings_updated_at ON public.furniture_groupings;
CREATE TRIGGER update_furniture_groupings_updated_at BEFORE UPDATE ON public.furniture_groupings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------
-- 3. Data
-- ---------------------------------------------------------------
-- Existing pieces get their kind and facing.
UPDATE public.furniture_specs SET kind = 'sofa',  facing = 'wall'   WHERE name ILIKE '%sofa%' AND kind = 'other';
UPDATE public.furniture_specs SET kind = 'chair', facing = 'anchor' WHERE name ILIKE '%chair%' AND kind = 'other';
UPDATE public.furniture_specs SET kind = 'table', facing = 'free'   WHERE name ILIKE '%table%' AND kind = 'other';
UPDATE public.furniture_specs SET kind = 'rug',   facing = 'free'   WHERE name ILIKE 'rug%' AND kind = 'other';
UPDATE public.furniture_specs SET facing = 'wall' WHERE must_against_wall AND facing = 'free';

-- A size is only made the default when its piece has no default yet (one default per name).
INSERT INTO public.furniture_specs (name, variant, kind, facing, is_default, width_cm, depth_cm, height_cm, min_clearance_cm, must_against_wall, category, source)
SELECT v.name, v.variant, v.kind, v.facing, v.is_default AND NOT EXISTS (SELECT 1 FROM public.furniture_specs x WHERE x.name = v.name AND x.is_default),
       v.width_cm, v.depth_cm, v.height_cm, v.min_clearance_cm, v.must_against_wall, v.category, v.source
FROM (VALUES
 ('3-seat sofa', 'standard', 'sofa', 'wall', true, 220, 95, 85, 60, true, 'seating', 'typical'),
 ('curved sofa', '3-seat', 'sofa', 'wall', true, 240, 105, 80, 60, true, 'seating', 'typical'),
 ('l-shape sofa', 'standard', 'sofa', 'wall', true, 280, 180, 85, 60, true, 'seating', 'typical'),
 ('accent chair', 'standard', 'chair', 'anchor', true, 80, 85, 85, 50, false, 'seating', 'typical'),
 ('dining chair', 'standard', 'chair', 'anchor', true, 45, 50, 85, 0, false, 'seating', 'typical'),
 ('desk chair', 'standard', 'chair', 'anchor', true, 60, 60, 100, 0, false, 'seating', 'typical'),
 ('bench', 'standard', 'bench', 'free', true, 120, 40, 45, 0, false, 'seating', 'typical'),
 ('piano bench', 'standard', 'bench', 'anchor', true, 56, 36, 49, 0, false, 'instruments', 'typical'),
 ('coffee table', 'standard', 'table', 'free', true, 110, 65, 38, 45, false, 'tables', 'typical'),
 ('side table', 'standard', 'table', 'free', true, 45, 45, 50, 0, false, 'tables', 'typical'),
 ('dining table', '4-seat', 'table', 'free', true, 140, 80, 75, 80, false, 'tables', 'typical'),
 ('dining table', '6-seat', 'table', 'free', false, 180, 90, 75, 80, false, 'tables', 'typical'),
 ('desk', 'standard', 'desk', 'wall', true, 120, 60, 75, 90, true, 'tables', 'typical'),
 ('bed', 'double', 'bed', 'head_wall', true, 160, 200, 100, 60, true, 'beds', 'typical'),
 ('bed', 'king', 'bed', 'head_wall', false, 180, 200, 100, 60, true, 'beds', 'typical'),
 ('bed', 'single', 'bed', 'head_wall', false, 90, 200, 90, 60, true, 'beds', 'typical'),
 ('nightstand', 'standard', 'storage', 'wall', true, 45, 40, 55, 0, true, 'storage', 'typical'),
 ('wardrobe', 'standard', 'storage', 'wall', true, 200, 60, 220, 90, true, 'storage', 'typical'),
 ('dresser', 'standard', 'storage', 'wall', true, 120, 50, 80, 80, true, 'storage', 'typical'),
 ('tv unit', 'standard', 'storage', 'wall', true, 160, 40, 50, 0, true, 'storage', 'typical'),
 ('bookshelf', 'standard', 'storage', 'wall', true, 90, 35, 200, 70, true, 'storage', 'typical'),
 ('sideboard', 'standard', 'storage', 'wall', true, 160, 45, 80, 80, true, 'storage', 'typical'),
 ('console', 'slim', 'storage', 'wall', true, 100, 30, 80, 60, true, 'storage', 'typical'),
 ('upright piano', 'standard', 'other', 'wall', true, 150, 60, 125, 90, true, 'instruments', 'typical'),
 ('rug', 'large', 'rug', 'free', true, 240, 340, 1, 0, false, 'decor', 'typical'),
 ('rug', 'medium', 'rug', 'free', false, 230, 160, 1, 0, false, 'decor', 'typical'),
 ('floor lamp', 'standard', 'other', 'free', true, 30, 30, 155, 0, false, 'lighting', 'typical')
) AS v(name, variant, kind, facing, is_default, width_cm, depth_cm, height_cm, min_clearance_cm, must_against_wall, category, source)
ON CONFLICT (name, variant) DO UPDATE SET kind = EXCLUDED.kind, facing = EXCLUDED.facing, must_against_wall = EXCLUDED.must_against_wall;

INSERT INTO public.furniture_groupings (key, name, room_types, activities, anchor_name, anchor_variant, anchor_place, priority, zone)
VALUES
 ('tv-lounge', 'Sofa, coffee table and TV', ARRAY['living-room']::text[], ARRAY['Relax', 'Watch films']::text[], '3-seat sofa', NULL, 'wall', 1, 'RELAX'),
 ('conversation', 'Sofa with two armchairs', ARRAY['living-room']::text[], ARRAY['Host friends', 'Relax']::text[], '3-seat sofa', NULL, 'wall', 2, 'SOCIAL'),
 ('reading-corner', 'Reading chair and lamp', ARRAY['living-room', 'bedroom', 'office']::text[], ARRAY['Read']::text[], 'accent chair', NULL, 'wall', 3, 'READ'),
 ('piano', 'Upright piano and bench', ARRAY['living-room', 'kids-room']::text[], ARRAY['Play piano']::text[], 'upright piano', NULL, 'wall', 2, 'MUSIC'),
 ('work-desk', 'Desk and chair', ARRAY['living-room', 'bedroom', 'office', 'kids-room']::text[], ARRAY['Work', 'Study', 'Video calls', 'Paint & craft']::text[], 'desk', NULL, 'wall', 2, 'WORK'),
 ('dining-4', 'Table for four', ARRAY['dining-room', 'living-room', 'kitchen']::text[], ARRAY['Eat here', 'Host friends', 'Cook', 'Play board games']::text[], 'dining table', '4-seat', 'floating', 2, 'DINING'),
 ('dining-6', 'Table for six', ARRAY['dining-room']::text[], ARRAY['Eat here', 'Host friends', 'Play board games']::text[], 'dining table', '6-seat', 'floating', 1, 'DINING'),
 ('bed-set', 'Bed with two nightstands', ARRAY['bedroom']::text[], ARRAY['Sleep', 'Relax']::text[], 'bed', 'double', 'wall', 1, 'SLEEP'),
 ('single-bed', 'Single bed and nightstand', ARRAY['kids-room', 'bedroom', 'office']::text[], ARRAY['Sleep', 'Guests stay']::text[], 'bed', 'single', 'wall', 3, 'SLEEP'),
 ('wardrobe', 'Wardrobe', ARRAY['bedroom', 'kids-room', 'hallway']::text[], ARRAY['Get dressed', 'Store coats & shoes', 'Sleep']::text[], 'wardrobe', NULL, 'wall', 4, 'DRESS'),
 ('dresser', 'Dresser', ARRAY['bedroom']::text[], ARRAY['Get dressed']::text[], 'dresser', NULL, 'wall', 5, 'DRESS'),
 ('bookshelf-wall', 'Bookshelves', ARRAY['living-room', 'office', 'kids-room']::text[], ARRAY['Read', 'Kids play', 'Study']::text[], 'bookshelf', NULL, 'wall', 5, 'BOOKS'),
 ('entry-console', 'Console by the door', ARRAY['hallway', 'living-room']::text[], ARRAY['Arrive & leave', 'Store coats & shoes', 'Read the post']::text[], 'console', NULL, 'wall', 6, 'ENTRY')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.furniture_grouping_members (grouping_id, sort, spec_name, spec_variant, label, dx_cm, dy_cm, faces, at, optional)
SELECT g.id, m.sort, m.spec_name, m.spec_variant, m.label, m.dx_cm, m.dy_cm, m.faces, m.at, m.optional
FROM (VALUES
 ('tv-lounge', 0, 'rug', 'medium', NULL, 0, 150, 'none', 'offset', true),
 ('tv-lounge', 1, 'coffee table', NULL, NULL, 0, 173, 'none', 'offset', false),
 ('tv-lounge', 2, 'tv unit', NULL, NULL, 0, 0, 'toward_wall', 'opposite_wall', true),
 ('tv-lounge', 3, 'side table', NULL, NULL, 138, 30, 'none', 'offset', true),
 ('tv-lounge', 4, 'floor lamp', NULL, NULL, -130, 25, 'none', 'offset', true),
 ('conversation', 0, 'rug', 'medium', NULL, 0, 160, 'none', 'offset', true),
 ('conversation', 1, 'coffee table', NULL, NULL, 0, 173, 'none', 'offset', false),
 ('conversation', 2, 'accent chair', NULL, 'Armchair', -140, 185, 'right', 'offset', false),
 ('conversation', 3, 'accent chair', NULL, 'Armchair', 140, 185, 'left', 'offset', true),
 ('reading-corner', 0, 'floor lamp', NULL, NULL, -62, 22, 'none', 'offset', false),
 ('reading-corner', 1, 'side table', NULL, NULL, 65, 30, 'none', 'offset', true),
 ('piano', 0, 'piano bench', NULL, NULL, 0, 88, 'toward_wall', 'offset', false),
 ('work-desk', 0, 'desk chair', NULL, NULL, 0, 78, 'toward_wall', 'offset', false),
 ('work-desk', 1, 'bookshelf', NULL, NULL, 115, 18, 'into_room', 'offset', true),
 ('dining-4', 0, 'dining chair', NULL, NULL, -35, -62, 'into_room', 'offset', false),
 ('dining-4', 1, 'dining chair', NULL, NULL, 35, -62, 'into_room', 'offset', false),
 ('dining-4', 2, 'dining chair', NULL, NULL, -35, 62, 'toward_wall', 'offset', false),
 ('dining-4', 3, 'dining chair', NULL, NULL, 35, 62, 'toward_wall', 'offset', false),
 ('dining-6', 0, 'dining chair', NULL, NULL, -55, -67, 'into_room', 'offset', false),
 ('dining-6', 1, 'dining chair', NULL, NULL, 0, -67, 'into_room', 'offset', false),
 ('dining-6', 2, 'dining chair', NULL, NULL, 55, -67, 'into_room', 'offset', false),
 ('dining-6', 3, 'dining chair', NULL, NULL, -55, 67, 'toward_wall', 'offset', false),
 ('dining-6', 4, 'dining chair', NULL, NULL, 0, 67, 'toward_wall', 'offset', false),
 ('dining-6', 5, 'dining chair', NULL, NULL, 55, 67, 'toward_wall', 'offset', false),
 ('dining-6', 6, 'sideboard', NULL, NULL, 0, 0, 'toward_wall', 'opposite_wall', true),
 ('bed-set', 0, 'rug', 'medium', NULL, 0, 150, 'none', 'offset', true),
 ('bed-set', 1, 'nightstand', NULL, NULL, -108, 20, 'into_room', 'offset', false),
 ('bed-set', 2, 'nightstand', NULL, NULL, 108, 20, 'into_room', 'offset', true),
 ('bed-set', 3, 'bench', NULL, 'Bench at the foot of the bed', 0, 228, 'into_room', 'offset', true),
 ('single-bed', 0, 'nightstand', NULL, NULL, 75, 20, 'into_room', 'offset', false),
 ('bookshelf-wall', 0, 'bookshelf', NULL, NULL, 92, 18, 'into_room', 'offset', true)
) AS m(key, sort, spec_name, spec_variant, label, dx_cm, dy_cm, faces, at, optional)
JOIN public.furniture_groupings g ON g.key = m.key
WHERE NOT EXISTS (SELECT 1 FROM public.furniture_grouping_members x WHERE x.grouping_id = g.id);
