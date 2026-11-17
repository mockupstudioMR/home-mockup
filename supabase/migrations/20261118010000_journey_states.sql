-- The journey's answers kept with the person's account (one row per person), so they come back in any
-- browser and are not lost when a browser's storage is cleared.
CREATE TABLE IF NOT EXISTS public.journey_states (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  state jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.journey_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "People read their own journey" ON public.journey_states FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "People save their own journey" ON public.journey_states FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "People update their own journey" ON public.journey_states FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
