
-- Room furniture configuration table
CREATE TABLE public.room_furniture_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_type text NOT NULL UNIQUE,
  room_label text NOT NULL,
  furniture_items text[] NOT NULL DEFAULT '{}',
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.room_furniture_config ENABLE ROW LEVEL SECURITY;

-- Public can read (used by edge function and quiz)
CREATE POLICY "Public can view room furniture config"
  ON public.room_furniture_config FOR SELECT
  USING (true);

-- Admins can manage
CREATE POLICY "Admins can manage room furniture config"
  ON public.room_furniture_config FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_room_furniture_config_updated_at
  BEFORE UPDATE ON public.room_furniture_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Pre-fill room types with typical furniture
INSERT INTO public.room_furniture_config (room_type, room_label, furniture_items, description) VALUES
  ('living-room', 'Living Room', ARRAY['sofa', 'coffee table', 'armchair', 'TV stand', 'bookshelf', 'side table', 'floor lamp', 'rug', 'curtains', 'cushions', 'wall art'], 'The heart of the home for relaxing and entertaining'),
  ('bedroom', 'Bedroom', ARRAY['bed frame', 'mattress', 'nightstand', 'wardrobe', 'dresser', 'desk', 'desk chair', 'bedside lamp', 'rug', 'curtains', 'mirror', 'cushions'], 'Personal retreat for rest and rejuvenation'),
  ('kitchen', 'Kitchen', ARRAY['dining table', 'dining chairs', 'bar stools', 'kitchen island', 'pendant lights', 'storage shelves', 'countertop accessories', 'backsplash tiles', 'rug', 'wall clock'], 'Where culinary creativity comes to life'),
  ('office', 'Home Office', ARRAY['desk', 'office chair', 'bookshelf', 'filing cabinet', 'desk lamp', 'monitor stand', 'storage boxes', 'rug', 'curtains', 'wall organizer', 'plants'], 'A productive space for work and focus'),
  ('bathroom', 'Bathroom', ARRAY['vanity', 'mirror', 'towel rack', 'shower screen', 'bath mat', 'storage cabinet', 'wall sconces', 'soap dispenser', 'plants', 'laundry basket'], 'A spa-like sanctuary for self-care');

-- Prompt templates table
CREATE TABLE public.prompt_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key text NOT NULL UNIQUE,
  template_label text NOT NULL,
  template text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

-- Public can read (used by edge function)
CREATE POLICY "Public can view prompt templates"
  ON public.prompt_templates FOR SELECT
  USING (true);

-- Admins can manage
CREATE POLICY "Admins can manage prompt templates"
  ON public.prompt_templates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_prompt_templates_updated_at
  BEFORE UPDATE ON public.prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Pre-fill prompt templates
INSERT INTO public.prompt_templates (template_key, template_label, template, description) VALUES
  ('default', 'Default Room Generation', 
   'Generate a stunning {{style}} {{room}} interior design. Use {{colors}}. Create a {{budget}} aesthetic. {{elements}} {{product_instructions}} Ultra high resolution, photorealistic interior design photography, professional lighting, magazine quality, 16:9 aspect ratio.',
   'Used when generating a new room design from scratch'),
  ('with_source_image', 'Room Transformation', 
   'Transform this room into a beautiful {{style}} {{room}} design. Use {{colors}}. Create a {{budget}} aesthetic. {{elements}} {{product_instructions}} Ultra high resolution, photorealistic interior design photography, professional lighting, magazine quality.',
   'Used when the user uploads a reference photo of their existing room'),
  ('with_product_images', 'Product-Featured Design', 
   'Create a stunning {{style}} {{room}} interior design that prominently features ALL the products shown in the reference images. {{product_instructions}} Use {{colors}}. Create a {{budget}} aesthetic. {{elements}} The products must appear EXACTLY as they look in the reference images - same colors, textures, and design details. Ultra high resolution, photorealistic interior design photography, professional lighting, magazine quality, 16:9 aspect ratio.',
   'Used when product images are included in the generation'),
  ('modification', 'Design Modification', 
   'Modify this interior design image: {{modification_prompt}}. Maintain the {{style}} style with {{colors}}. {{product_instructions}} Ultra high resolution, photorealistic interior design photography.',
   'Used when the user requests modifications to an existing design'),
  ('furniture_context', 'Furniture Context Prefix', 
   'The {{room}} typically contains these furniture items: {{furniture_list}}. Make sure the design includes appropriate items from this list.',
   'Appended to give the AI context about typical furniture for the room type');
