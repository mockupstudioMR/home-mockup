-- People publish their own walls' layered pictures (made in the browser in step 5) for their own projects.
-- Ownership is checked directly on the project, as for the other project tables.
CREATE POLICY "Project owners add showroom scenes" ON public.showroom_scenes
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
);
