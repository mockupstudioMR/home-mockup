-- Owners must be able to read their new row during INSERT ... RETURNING.
-- Preserve accepted collaborator and administrator access through the existing helper.
ALTER POLICY "Project members read" ON public.projects
  USING (owner_id = auth.uid() OR public.can_access_project(id));