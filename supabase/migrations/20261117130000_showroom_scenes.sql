-- Prepared, room-specific Generator PRO scenes. Static backgrounds alone are not scenes.
CREATE TABLE IF NOT EXISTS public.showroom_scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  layout_id text NOT NULL,
  view text NOT NULL CHECK (view IN ('room','wall_a','wall_b','wall_c','wall_d')),
  manifest_url text NOT NULL,
  assets_url text NOT NULL,
  status text NOT NULL DEFAULT 'preparing' CHECK (status IN ('preparing','ready','failed')),
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, room_id, layout_id, view, version)
);
ALTER TABLE public.showroom_scenes ENABLE ROW LEVEL SECURITY;
-- Restrict scene metadata to project owners; asset storage must separately
-- enforce the same access rules if URLs contain private content.
CREATE POLICY "Project owners read showroom scenes" ON public.showroom_scenes
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
);
CREATE INDEX IF NOT EXISTS showroom_scenes_lookup
ON public.showroom_scenes(project_id,room_id,layout_id,view,status,version DESC);
