-- Fix prompt templates so the AI strictly respects the room type and approved furniture list.
-- 1) Replace the buggy furniture_context (the blocklist contradicted the approved list, causing the
--    model to omit sofas/armchairs from a living room).
-- 2) Move the furniture/room constraint to the FRONT of every generation template so it dominates.

UPDATE prompt_templates SET template = $$
ROOM IDENTITY (HIGHEST PRIORITY): This is a {{room}}. The final image MUST clearly read as a {{room}} — its primary function and recognizable furniture must be visible at first glance. Do NOT generate a different room type.

STRICT FURNITURE CONSTRAINT: The {{room}} must ONLY contain furniture items drawn from this approved list: {{furniture_list}}. Every visible furniture piece MUST be one of these items. Do NOT add any other furniture (no beds, no desks, no dining tables, no wardrobes, no kitchen cabinets, etc., UNLESS they appear in the approved list). Include each item at most once. The most important items from the list (e.g. sofa for a living room, bed for a bedroom, dining table for a dining room) MUST be present and prominent. This constraint is absolute and overrides any styling instruction or product reference image.
$$ WHERE template_key = 'furniture_context';

UPDATE prompt_templates SET template = $$
Create a stunning {{style}} {{room}} interior design. The room must clearly read as a {{room}} containing the approved furniture: {{furniture_list}}. The reference product images are STYLE inspiration only — match their colors, materials and aesthetic, but do NOT include products that are not appropriate for a {{room}}. {{product_instructions}} {{detected_colors}}{{detected_keywords}}{{moodboard_context}}{{inspiration_context}}Use {{colors}}. Create a {{budget}} aesthetic. {{elements}} For products of types not in the approved furniture list, omit them and instead show approved-list items styled to match the inspiration. Ultra high resolution, photorealistic interior design photography, professional lighting, magazine quality, 16:9 aspect ratio.
$$ WHERE template_key = 'with_product_images';

UPDATE prompt_templates SET template = $$
Generate a stunning {{style}} {{room}} interior design. The room must clearly read as a {{room}} and may ONLY contain furniture from this approved list: {{furniture_list}}. {{detected_colors}}{{detected_keywords}}{{moodboard_context}}{{inspiration_context}}Use {{colors}}. Create a {{budget}} aesthetic. {{elements}} {{product_instructions}} Ultra high resolution, photorealistic interior design photography, professional lighting, magazine quality, 16:9 aspect ratio.
$$ WHERE template_key = 'default';

UPDATE prompt_templates SET template = $$
Transform this room into a beautiful {{style}} {{room}} design. The room must clearly read as a {{room}} and may ONLY contain furniture from this approved list: {{furniture_list}}. {{detected_colors}}{{detected_keywords}}{{moodboard_context}}{{inspiration_context}}Use {{colors}}. Create a {{budget}} aesthetic. {{elements}} {{product_instructions}} Ultra high resolution, photorealistic interior design photography, professional lighting, magazine quality.
$$ WHERE template_key = 'with_source_image';
