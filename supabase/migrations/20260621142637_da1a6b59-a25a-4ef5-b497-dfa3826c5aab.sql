CREATE TABLE public.whatsapp_quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  phone_e164 text NOT NULL,
  current_step int NOT NULL DEFAULT 0,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  step_token text,
  step_token_expires_at timestamptz,
  last_message_sid text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX whatsapp_quiz_sessions_phone_idx ON public.whatsapp_quiz_sessions (phone_e164);
CREATE INDEX whatsapp_quiz_sessions_user_idx ON public.whatsapp_quiz_sessions (user_id);

GRANT SELECT ON public.whatsapp_quiz_sessions TO authenticated;
GRANT ALL ON public.whatsapp_quiz_sessions TO service_role;

ALTER TABLE public.whatsapp_quiz_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own whatsapp sessions"
ON public.whatsapp_quiz_sessions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_whatsapp_quiz_sessions_updated_at
BEFORE UPDATE ON public.whatsapp_quiz_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();