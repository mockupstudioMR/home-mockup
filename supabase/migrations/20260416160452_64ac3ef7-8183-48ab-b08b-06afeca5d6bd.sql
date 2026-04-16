
-- 1. furniture_specs
CREATE TABLE public.furniture_specs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  width_cm integer NOT NULL DEFAULT 80,
  depth_cm integer NOT NULL DEFAULT 60,
  min_clearance_cm integer NOT NULL DEFAULT 40,
  must_against_wall boolean NOT NULL DEFAULT false,
  default_orientation text NOT NULL DEFAULT 'any',
  grouping_key text,
  companion_of text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.furniture_specs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view furniture specs"
  ON public.furniture_specs FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage furniture specs"
  ON public.furniture_specs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_furniture_specs_updated_at
  BEFORE UPDATE ON public.furniture_specs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. room_activities
CREATE TABLE public.room_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_type text NOT NULL,
  activity_name text NOT NULL,
  priority integer NOT NULL DEFAULT 1,
  furniture_items text[] NOT NULL DEFAULT '{}'::text[],
  preferred_zone text NOT NULL DEFAULT 'center',
  preferred_orientation text NOT NULL DEFAULT 'any',
  advisory_text text,
  opening_affinity jsonb DEFAULT '{}'::jsonb,
  space_weight numeric NOT NULL DEFAULT 0.3,
  is_predefined boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (room_type, activity_name)
);

ALTER TABLE public.room_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view room activities"
  ON public.room_activities FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage room activities"
  ON public.room_activities FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_room_activities_updated_at
  BEFORE UPDATE ON public.room_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. opening_rules
CREATE TABLE public.opening_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opening_type text NOT NULL UNIQUE,
  clearance_cm integer NOT NULL DEFAULT 80,
  requires_path_to text[] DEFAULT '{}'::text[],
  attracts_furniture text[] DEFAULT '{}'::text[],
  repels_furniture text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.opening_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view opening rules"
  ON public.opening_rules FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage opening rules"
  ON public.opening_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_opening_rules_updated_at
  BEFORE UPDATE ON public.opening_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
