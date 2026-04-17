
-- Canonical Room Spec table - single source of truth for a room
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Room',
  room_type TEXT NOT NULL DEFAULT 'living-room',

  -- Architecture
  shape TEXT NOT NULL DEFAULT 'rectangle',
  dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
  custom_walls JSONB,                       -- vertices for "custom" shape
  walls JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ id, length_m, surface, openings: [{type, position_pct, width_pct, swing?}] }] in clockwise order

  -- Style
  style JSONB NOT NULL DEFAULT '{}'::jsonb, -- { preference, colorPalette, budgetFeel, mustHaveElements[], referenceImageUrl }

  -- Furniture selection
  furniture JSONB NOT NULL DEFAULT '{}'::jsonb, -- { selectedItems: string[] }

  -- Layout
  layout JSONB,                             -- { name, description, items:[{label,x,y,w,h,rotation?,reason}], feedback:[{item,agreed,note}] }

  -- Bookkeeping
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rooms"   ON public.rooms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rooms" ON public.rooms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rooms" ON public.rooms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rooms" ON public.rooms FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_rooms_user_id    ON public.rooms(user_id);
CREATE INDEX idx_rooms_updated_at ON public.rooms(updated_at DESC);

-- Link a generated design back to its source room spec (optional, nullable for legacy designs)
ALTER TABLE public.generated_designs
  ADD COLUMN room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL;

CREATE INDEX idx_generated_designs_room_id ON public.generated_designs(room_id);
