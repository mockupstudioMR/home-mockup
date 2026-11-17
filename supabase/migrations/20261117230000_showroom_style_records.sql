-- The saved style of a room from the 3D showroom: the moodboard's colours with exact values, every element
-- with its colour, material, matched shape and place on its wall, and what the person changed.
CREATE TABLE IF NOT EXISTS public.showroom_style_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  layout_id text,
  record jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, room_id)
);
ALTER TABLE public.showroom_style_records ENABLE ROW LEVEL SECURITY;

-- Row ownership is checked directly on the project, as for the other project tables.
CREATE POLICY "Project owners read showroom style records" ON public.showroom_style_records
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
);
CREATE POLICY "Project owners add showroom style records" ON public.showroom_style_records
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
);
CREATE POLICY "Project owners update showroom style records" ON public.showroom_style_records
FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
);
CREATE INDEX IF NOT EXISTS showroom_style_records_room ON public.showroom_style_records(room_id);
