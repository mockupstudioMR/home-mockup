DROP POLICY "Anyone can read furniture groupings" ON public.furniture_groupings;
CREATE POLICY "Anyone can read furniture groupings" ON public.furniture_groupings FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY "Anyone can read grouping members" ON public.furniture_grouping_members;
CREATE POLICY "Anyone can read grouping members" ON public.furniture_grouping_members FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.furniture_groupings g WHERE g.id = grouping_id AND g.is_active = true));
DROP POLICY "Anyone can read wall gap rules" ON public.wall_gap_rules;
CREATE POLICY "Anyone can read wall gap rules" ON public.wall_gap_rules FOR SELECT TO anon, authenticated USING (behind IN ('plain', 'window', 'balcony', 'door'));