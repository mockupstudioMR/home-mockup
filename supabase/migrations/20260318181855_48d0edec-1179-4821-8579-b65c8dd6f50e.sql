UPDATE prompt_templates SET template = 'ABSOLUTE ROOM PRESERVATION — SELECTIVE STYLE EDIT: Study the attached photo(s) of the existing room with extreme care. You MUST reproduce this EXACT room — same camera angle, same perspective, same spatial layout, same lighting direction, same composition. Every piece of furniture, every object, every architectural element must remain in its EXACT position, size, angle, and proportion. Do NOT move, remove, add, rearrange, or resize ANY item. Do NOT replace any furniture with different furniture. The room must be pixel-perfect identical in layout and composition to the original photo.

{{keep_change_directive}}

{{detected_colors}}{{detected_keywords}}{{moodboard_context}}{{inspiration_context}}

COLOR COHERENCE RULE: Apply the chosen color palette CONSISTENTLY across elements marked for change — walls, tiles, textiles, and accessories must all harmonize. Do NOT alter elements marked to keep. Avoid random warm-toned wood or mismatched accent colors unless explicitly requested.

CLEAN AESTHETIC RULE: Keep surfaces clean and uncluttered. Every object in the room should feel intentional and purposeful.

Apply a {{style}} aesthetic ONLY to the elements marked for change. Use {{colors}} for the restyled elements. Create a {{budget}} feel through material quality and finish choices — NOT by replacing furniture. {{elements}} {{product_instructions}}

The final image must look like the EXACT SAME photograph of the EXACT SAME room with selective style changes applied only where specified. Ultra high resolution, photorealistic interior design photography, same lighting quality as original, 16:9 aspect ratio.', updated_at = now() WHERE template_key = 'existing_room_redesign'