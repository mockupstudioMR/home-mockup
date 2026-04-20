UPDATE public.prompt_templates SET template = $TPL$Analyze these product/furniture images. For each product, identify:
1. Product name/type
2. Category (furniture, lighting, decor, textile, etc.)
3. Best matching interior style
4. Brief description

Then perform a STYLE ANALYSIS exactly like analyzing a room. Identify all dominant interior design styles present across these products. For each detected style, provide:
1. Style name (e.g., "Modern & Minimal", "Bohemian Eclectic", "Mediterranean", "Classic Historical", "Rustic Nature", "Glam & Luxe")
2. Confidence score (0-1)
3. Short description
4. 3-5 keywords describing the look (materials, shapes, mood)
5. A single representative "iconicItem" — one specific furniture/decor item that visually embodies the style

Also extract:
- dominantColors[]: combined palette across all images as hex codes (4-8 colors)
- materials[]: 4-8 specific materials/textures across the products (e.g., "natural linen", "polished marble", "rough oak", "brushed brass", "boucle wool")

IMPORTANT: Also identify what essential products are MISSING to complete a cohesive room design. For each missing product, suggest:
- Product type and name
- Category
- Why it's needed (function or aesthetic reason)
- Search keywords the user could use to find similar products online

Respond in this exact JSON format:
{
  "products": [
    { "productName": "string", "category": "string", "suggestedStyle": "string", "description": "string" }
  ],
  "styles": [
    { "styleName": "string", "confidence": 0.0, "description": "string", "keywords": ["string"], "iconicItem": "string" }
  ],
  "dominantColors": ["#hex"],
  "materials": ["string"],
  "missingProducts": [
    { "productName": "string", "category": "string", "reason": "string", "searchKeywords": ["string"], "priceRange": "budget | mid-range | premium", "priority": "essential | recommended | optional" }
  ],
  "recommendedStyle": "string",
  "styleDescription": "string",
  "moodboardSuggestion": "string"
}$TPL$, updated_at = now()
WHERE template_key = 'analyze_style_products';