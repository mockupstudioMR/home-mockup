-- Room-specific Generator PRO scenes. Only the project owner may read them.
-- The scene config is a URL to a prepared manifest with aligned WebP layers.
CREATE TABLE IF NOT EXISTS public.showroom_scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  layout_id text NOT NULL,
  view text NOT NULL CHECK (view IN ('room','wall_a','wall_b','wall_c','wall_d')),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  manifest_url text NOT NULL CHECK (manifest_url ~ '^https://'),
  assets_url text NOT NULL CHECK (assets_url ~ '^https://'),
  status text NOT NULL DEFAULT 'preparing' CHECK (status IN ('preparing','ready','failed','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, layout_id, view, version)
);
CREATE INDEX IF NOT EXISTS showroom_scenes_lookup ON public.showroom_scenes (room_id, layout_id, view, status, version DESC);
ALTER TABLE public.showroom_scenes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read showroom scenes" ON public.showroom_scenes
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = showroom_scenes.project_id AND p.owner_id = auth.uid())
  );
CREATE POLICY "Admins manage showroom scenes" ON public.showroom_scenes
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
GRANT SELECT ON public.showroom_scenes TO authenticated;

-- Persist selections only for the owner; scene assets must be provisioned separately.
CREATE TABLE IF NOT EXISTS public.showroom_scene_selections (
  scene_id uuid NOT NULL REFERENCES public.showroom_scenes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selections jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(selections) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scene_id, user_id)
);
ALTER TABLE public.showroom_scene_selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their scene selections" ON public.showroom_scene_selections
  FOR ALL TO authenticated USING (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.showroom_scenes s JOIN public.projects p ON p.id=s.project_id
      WHERE s.id=scene_id AND p.owner_id=auth.uid()
    )
  ) WITH CHECK (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.showroom_scenes s JOIN public.projects p ON p.id=s.project_id
      WHERE s.id=scene_id AND p.owner_id=auth.uid()
    )
  );
GRANT SELECT, INSERT, UPDATE ON public.showroom_scene_selections TO authenticated;
