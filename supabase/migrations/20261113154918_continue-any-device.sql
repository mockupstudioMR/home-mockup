-- Continue a project on any device: every journey step keeps its answers in its step_progress row.
-- step_payload holds the step's answers (images only as stored links, never inline data);
-- version is bumped on every save so a device only overwrites a row it has seen (optimistic check).
-- RLS is unchanged: members read, the project owner writes (see 20261012090000_designing_my_home_v2.sql).
ALTER TABLE public.step_progress
  ADD COLUMN IF NOT EXISTS step_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.step_progress.step_payload IS 'The step''s journey answers for this room (step 1: the project''s). Images are stored links only.';
COMMENT ON COLUMN public.step_progress.version IS 'Bumped on every save; writes check it so the newer change wins across devices.';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.step_progress TO authenticated;
GRANT ALL ON public.step_progress TO service_role;
