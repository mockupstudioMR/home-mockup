
CREATE TABLE public.journey_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  stage text NOT NULL DEFAULT 'start',
  sub_step text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_sessions TO authenticated;
GRANT ALL ON public.journey_sessions TO service_role;

ALTER TABLE public.journey_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own journey session"
  ON public.journey_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_journey_sessions_updated_at
  BEFORE UPDATE ON public.journey_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_journey_sessions_user ON public.journey_sessions(user_id);
