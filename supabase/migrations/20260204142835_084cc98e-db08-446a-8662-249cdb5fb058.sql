-- Add index on generated_designs.user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_generated_designs_user_id ON public.generated_designs(user_id);

-- Add composite index for the common query pattern (user_id + created_at DESC)
CREATE INDEX IF NOT EXISTS idx_generated_designs_user_created ON public.generated_designs(user_id, created_at DESC);