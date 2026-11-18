-- How far furniture (a single piece, or a set measured from its main piece's back) stands from the wall behind it,
-- by what's in that wall behind it: a plain wall 0.1 m, a window or balcony door 0.5 m, a door 2 m. A plain stretch
-- of wall is tried before one with a window, and a door wall last. When a set still doesn't fit, the room is
-- measured again as a smaller box with every wall moved in by its gap, and placed again in it.
CREATE TABLE IF NOT EXISTS public.wall_gap_rules (
  behind     text PRIMARY KEY CHECK (behind IN ('plain', 'window', 'balcony', 'door')),
  gap_cm     integer NOT NULL CHECK (gap_cm >= 0 AND gap_cm <= 500),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wall_gap_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read wall gap rules" ON public.wall_gap_rules;
CREATE POLICY "Anyone can read wall gap rules" ON public.wall_gap_rules FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage wall gap rules" ON public.wall_gap_rules;
CREATE POLICY "Admins manage wall gap rules" ON public.wall_gap_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP TRIGGER IF EXISTS update_wall_gap_rules_updated_at ON public.wall_gap_rules;
CREATE TRIGGER update_wall_gap_rules_updated_at BEFORE UPDATE ON public.wall_gap_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.wall_gap_rules (behind, gap_cm) VALUES
 ('plain', 10), ('window', 50), ('balcony', 50), ('door', 200)
ON CONFLICT (behind) DO NOTHING;
