
CREATE TABLE public.layout_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  room_type text,
  room_shape text,
  room_dimensions jsonb,
  openings jsonb DEFAULT '[]'::jsonb,
  layout_name text,
  furniture_item text NOT NULL,
  position_x numeric,
  position_y numeric,
  width_pct numeric,
  height_pct numeric,
  ai_reason text,
  agreed boolean NOT NULL,
  user_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.layout_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own layout feedback"
  ON public.layout_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own layout feedback"
  ON public.layout_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all layout feedback"
  ON public.layout_feedback FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_layout_feedback_user ON public.layout_feedback(user_id);
CREATE INDEX idx_layout_feedback_item ON public.layout_feedback(furniture_item, agreed);
