-- Durable preparation jobs; no generated output becomes reusable until reviewed.
CREATE TABLE public.showroom_asset_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
 room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
 room_type text NOT NULL,
 camera_key text NOT NULL,
 category text NOT NULL CHECK (category IN ('furniture','walls','floor','lighting','decor')),
 width integer NOT NULL CHECK (width BETWEEN 128 AND 4096),
 height integer NOT NULL CHECK (height BETWEEN 128 AND 4096),
 reference_path text NOT NULL,
 prompt text NOT NULL,
 status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','review','approved','failed')),
 output_paths text[] NOT NULL DEFAULT '{}',
 error text,
 attempts integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.showroom_asset_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own jobs" ON public.showroom_asset_jobs
 FOR SELECT TO authenticated USING (
 EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
 );
CREATE POLICY "Admins manage asset jobs" ON public.showroom_asset_jobs
 FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
 WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX showroom_jobs_queue ON public.showroom_asset_jobs(status,created_at);
