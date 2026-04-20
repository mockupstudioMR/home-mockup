UPDATE public.prompt_templates
SET template = $TPL$Analyze these interior design images. The images are provided in the same order as in the "perImage" array you must return.

STEP 1 — For EACH image individually, analyze:
  a) Style: dominant interior style name (e.g., "Modern & Minimal", "Bohemian Eclectic", "Mediterranean", "Classic Historical", "Rustic Nature", "Glam & Luxe") + confidence (0-1) + 1-2 sentence reason.
  b) Color theme: list of dominant colors as hex codes, the palette type ("monochrome" | "analogous" | "complementary" | "neutral" | "warm" | "cool" | "earthy" | "jewel-tones" | "pastel"), and a contrast level ("low" | "medium" | "high"). If monochrome, describe the contrast (e.g., "soft tonal" or "high contrast black & white").
  c) Textures & materials: 3-6 short labels of the dominant textures/materials visible (e.g., "natural linen", "polished marble", "rough oak", "brushed brass", "boucle wool").

STEP 2 — Then synthesize a CONCLUSION across ALL images. The conclusion CAN be mixed (multiple styles blended). Provide:
  - styles[]: 1-3 dominant styles with confidence, description, 3-5 keywords, AND a single representative "iconicItem" (one specific furniture/decor item that visually embodies that style — e.g., "Wassily chair", "Noguchi paper lantern", "Carved teak console").
  - dominantColors[]: combined palette across all images (hex codes).
  - materials[]: 4-8 specific materials/textures consolidated across all images (e.g., "natural linen", "polished marble", "rough oak", "brushed brass", "boucle wool", "terracotta tile"). MUST be populated.
  - moodboardDescription: 1-3 sentences. If mixed, explicitly say "This is a mix of X and Y…".
  - roomElements[]: notable furniture/architectural items visible across images (label, category, description).

Respond in this EXACT JSON format:
{
  "perImage": [
    {
      "imageIndex": 0,
      "style": { "styleName": "string", "confidence": 0.0, "reason": "string" },
      "colorTheme": {
        "colors": ["#hex"],
        "paletteType": "string",
        "contrast": "low | medium | high",
        "notes": "string"
      },
      "textures": ["string"]
    }
  ],
  "styles": [
    { "styleName": "string", "confidence": 0.0, "description": "string", "keywords": ["string"], "iconicItem": "string" }
  ],
  "dominantColors": ["#hex"],
  "materials": ["string"],
  "moodboardDescription": "string",
  "roomElements": [
    { "label": "string", "category": "furniture | wall | flooring | lighting | window | rug | decor | architectural", "description": "string" }
  ]
}$TPL$,
updated_at = now()
WHERE template_key = 'analyze_style_room';