ALTER TABLE public.furniture_specs
 ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'other' CHECK (kind IN ('sofa','chair','table','rug','storage','bed','desk','bench','other')),
 ADD COLUMN IF NOT EXISTS facing text NOT NULL DEFAULT 'free' CHECK (facing IN ('wall','head_wall','anchor','free')),
 ADD COLUMN IF NOT EXISTS symbol text CHECK (symbol IS NULL OR symbol ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 ADD COLUMN IF NOT EXISTS front_label text,
 ADD COLUMN IF NOT EXISTS back_label text,
 ADD COLUMN IF NOT EXISTS left_label text,
 ADD COLUMN IF NOT EXISTS right_label text,
 ADD COLUMN IF NOT EXISTS back_clearance_cm integer NOT NULL DEFAULT 0 CHECK (back_clearance_cm >= 0),
 ADD COLUMN IF NOT EXISTS left_clearance_cm integer NOT NULL DEFAULT 0 CHECK (left_clearance_cm >= 0),
 ADD COLUMN IF NOT EXISTS right_clearance_cm integer NOT NULL DEFAULT 0 CHECK (right_clearance_cm >= 0),
 ADD COLUMN IF NOT EXISTS symbol_front text NOT NULL DEFAULT 'bottom' CHECK (symbol_front IN ('bottom','top','left','right'));
CREATE TABLE IF NOT EXISTS public.furniture_groupings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 key text NOT NULL UNIQUE CHECK (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), name text NOT NULL,
 room_types text[] NOT NULL DEFAULT '{}', activities text[] NOT NULL DEFAULT '{}', anchor_name text NOT NULL,
 anchor_variant text, anchor_place text NOT NULL DEFAULT 'wall' CHECK (anchor_place IN ('wall','floating')),
 priority integer NOT NULL DEFAULT 5, zone text NOT NULL DEFAULT '', notes text, is_active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 symbol text CHECK (symbol IS NULL OR symbol ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
GRANT SELECT ON public.furniture_groupings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.furniture_groupings TO authenticated;
GRANT ALL ON public.furniture_groupings TO service_role;
ALTER TABLE public.furniture_groupings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read furniture groupings" ON public.furniture_groupings FOR SELECT USING (true);
CREATE POLICY "Admins manage furniture groupings" ON public.furniture_groupings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE TABLE IF NOT EXISTS public.furniture_grouping_members (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), grouping_id uuid NOT NULL REFERENCES public.furniture_groupings(id) ON DELETE CASCADE,
 sort smallint NOT NULL DEFAULT 0, spec_name text NOT NULL, spec_variant text, label text, dx_cm integer NOT NULL DEFAULT 0,
 dy_cm integer NOT NULL DEFAULT 0, faces text NOT NULL DEFAULT 'into_room' CHECK (faces IN ('into_room','toward_wall','left','right','none')),
 at text NOT NULL DEFAULT 'offset' CHECK (at IN ('offset','opposite_wall')), optional boolean NOT NULL DEFAULT false
);
GRANT SELECT ON public.furniture_grouping_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.furniture_grouping_members TO authenticated;
GRANT ALL ON public.furniture_grouping_members TO service_role;
ALTER TABLE public.furniture_grouping_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read grouping members" ON public.furniture_grouping_members FOR SELECT USING (true);
CREATE POLICY "Admins manage grouping members" ON public.furniture_grouping_members FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE INDEX IF NOT EXISTS idx_grouping_members_grouping ON public.furniture_grouping_members(grouping_id, sort);
CREATE TRIGGER update_furniture_groupings_updated_at BEFORE UPDATE ON public.furniture_groupings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TABLE IF NOT EXISTS public.wall_gap_rules (
 behind text PRIMARY KEY CHECK (behind IN ('plain','window','balcony','door')),
 gap_cm integer NOT NULL CHECK (gap_cm >= 0 AND gap_cm <= 500), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wall_gap_rules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wall_gap_rules TO authenticated;
GRANT ALL ON public.wall_gap_rules TO service_role;
ALTER TABLE public.wall_gap_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read wall gap rules" ON public.wall_gap_rules FOR SELECT USING (true);
CREATE POLICY "Admins manage wall gap rules" ON public.wall_gap_rules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE TRIGGER update_wall_gap_rules_updated_at BEFORE UPDATE ON public.wall_gap_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();